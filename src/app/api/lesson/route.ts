import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getCachedLesson, cacheLesson } from '@/lib/lessonCache'

const client = new Anthropic()

const LESSON_META: Record<string, {
  unitName: string
  lessonName: string
  concept: string
  prerequisites: string[]
  keyFacts: string[]
  realWorldExample: string
  apExamRelevance: string
}> = {
  '101': {
    unitName: 'Kinematics', lessonName: 'What is Motion?',
    concept: 'motion as change in position relative to a reference frame',
    prerequisites: [],
    keyFacts: ['Motion is change in position over time', 'All motion is relative to a reference frame', 'Position needs a reference point to be meaningful'],
    realWorldExample: 'A passenger on a train is stationary relative to their seat but moving at 200 km/h relative to the ground',
    apExamRelevance: 'Reference frames are fundamental to kinematics — every AP problem requires defining a coordinate system'
  },
  '102': {
    unitName: 'Kinematics', lessonName: 'Velocity vs Speed',
    concept: 'the difference between scalar speed and vector velocity',
    prerequisites: ['motion', 'reference frames'],
    keyFacts: ['Speed is magnitude only (scalar)', 'Velocity includes direction (vector)', 'Constant speed can mean changing velocity in circular motion'],
    realWorldExample: 'A car going around a circular track at 60 mph has constant speed but constantly changing velocity',
    apExamRelevance: 'AP Physics C distinguishes vectors from scalars in every kinematics problem — velocity appears in F=ma and momentum'
  },
  '103': {
    unitName: 'Kinematics', lessonName: 'Acceleration',
    concept: 'acceleration as the rate of change of velocity',
    prerequisites: ['velocity', 'vectors'],
    keyFacts: ['a = Δv/Δt', 'Acceleration is a vector', 'You can accelerate while at constant speed (changing direction)'],
    realWorldExample: 'An elevator starting to move upward accelerates even if it quickly reaches constant speed',
    apExamRelevance: 'Acceleration connects kinematics to Newton\'s Second Law — it appears in every dynamics problem'
  },
  '104': {
    unitName: 'Kinematics', lessonName: 'Kinematic Equations',
    concept: 'the four kinematic equations for constant acceleration',
    prerequisites: ['velocity', 'acceleration'],
    keyFacts: ['v = v₀ + at', 'x = v₀t + ½at²', 'v² = v₀² + 2ax', 'x = ½(v + v₀)t'],
    realWorldExample: 'A car braking from 30 m/s to rest — finding stopping distance uses v² = v₀² + 2ax',
    apExamRelevance: 'These equations appear on every AP kinematics free response — memorize all four'
  },
  '105': {
    unitName: 'Kinematics', lessonName: 'Projectile Motion',
    concept: 'projectile motion as independent horizontal and vertical components',
    prerequisites: ['kinematic equations', 'vectors', 'acceleration'],
    keyFacts: ['Horizontal velocity is constant', 'Vertical acceleration is -9.8 m/s²', 'Time of flight is determined only by vertical motion'],
    realWorldExample: 'A basketball thrown horizontally falls the same as one dropped straight down — same vertical acceleration',
    apExamRelevance: 'Projectile motion is a guaranteed AP free response topic — always decompose into x and y components'
  },
  '201': {
    unitName: "Newton's Laws", lessonName: 'Force Basics',
    concept: 'force as a vector interaction requiring two objects',
    prerequisites: ['motion', 'vectors'],
    keyFacts: ['Force requires two interacting objects', 'Forces have magnitude and direction (vector)', 'Net force determines acceleration'],
    realWorldExample: 'You cannot push without something pushing back — your foot pushes the floor, the floor pushes you forward',
    apExamRelevance: 'Understanding force as a vector is essential for free body diagrams on every AP dynamics problem'
  },
  '202': {
    unitName: "Newton's Laws", lessonName: 'Free Body Diagrams',
    concept: 'representing all forces on an isolated object as vectors',
    prerequisites: ['force basics', 'vectors'],
    keyFacts: ['Show ONLY forces on the object of interest', 'Arrow length represents magnitude', 'Arrow direction shows force direction'],
    realWorldExample: 'A book on a table has two forces: gravity down and normal force up — they balance so it does not accelerate',
    apExamRelevance: 'AP graders award specific points for correct FBDs — drawing them correctly is worth 2-3 points per problem'
  },
  '203': {
    unitName: "Newton's Laws", lessonName: "Newton's 1st Law",
    concept: 'inertia — objects maintain their state of motion without net force',
    prerequisites: ['force basics'],
    keyFacts: ['Objects at rest stay at rest', 'Objects in motion stay in motion at constant velocity', 'Net force ZERO means no acceleration'],
    realWorldExample: 'A hockey puck slides forever on frictionless ice — only friction stops real pucks',
    apExamRelevance: 'Newton\'s 1st law defines equilibrium — essential for statics problems and identifying when net force is zero'
  },
  '204': {
    unitName: "Newton's Laws", lessonName: "Newton's 2nd Law",
    concept: 'F = ma — net force equals mass times acceleration',
    prerequisites: ["Newton's 1st Law", 'free body diagrams', 'vectors'],
    keyFacts: ['ΣF = ma (sum of all forces)', 'Larger mass requires more force for same acceleration', 'Direction of acceleration equals direction of net force'],
    realWorldExample: 'Pushing a shopping cart empty vs full — same force produces less acceleration with more mass',
    apExamRelevance: 'F = ma is the most used equation in AP Physics C — appears in mechanics and electromagnetism'
  },
  '205': {
    unitName: "Newton's Laws", lessonName: "Newton's 3rd Law",
    concept: 'action-reaction pairs — equal and opposite forces on DIFFERENT objects',
    prerequisites: ["Newton's 2nd Law"],
    keyFacts: ['Every action has equal and opposite reaction', 'Forces act on DIFFERENT objects', 'Action-reaction pairs never cancel'],
    realWorldExample: 'Rocket exhaust pushes gas down, gas pushes rocket up — equal forces on different objects',
    apExamRelevance: 'Newton\'s 3rd Law explains propulsion, collisions, and why action-reaction pairs do NOT cancel in FBDs'
  },
  '206': {
    unitName: "Newton's Laws", lessonName: 'Friction & Normal Forces',
    concept: 'friction as a contact force opposing relative motion: f = μN',
    prerequisites: ["Newton's 2nd Law", 'free body diagrams'],
    keyFacts: ['Kinetic friction: f_k = μ_k · N', 'Static friction: f_s ≤ μ_s · N (maximum, not constant)', 'Normal force is perpendicular to surface — not always mg'],
    realWorldExample: 'A book sliding across a table decelerates because kinetic friction F = μN acts opposite to motion — heavier book means more N and more friction',
    apExamRelevance: 'Friction is in most AP dynamics free response — always find N first, identify static vs kinetic, and draw it correctly on the FBD'
  },
  '301': {
    unitName: 'Work & Energy', lessonName: 'What is Work?',
    concept: 'work as force times displacement in the same direction: W = F·d·cos(θ)',
    prerequisites: ['force basics', 'vectors'],
    keyFacts: ['W = F·d·cos(θ)', 'No displacement = zero work', 'Force perpendicular to motion = zero work'],
    realWorldExample: 'Carrying groceries horizontally does zero work on them — force is up, displacement is horizontal',
    apExamRelevance: 'Work is the bridge between forces and energy — the Work-Energy Theorem connects both on AP exams'
  },
  '302': {
    unitName: 'Work & Energy', lessonName: 'Kinetic Energy',
    concept: 'kinetic energy as energy of motion: KE = ½mv²',
    prerequisites: ['work', 'velocity'],
    keyFacts: ['KE = ½mv²', 'Always positive', 'Doubling speed quadruples kinetic energy'],
    realWorldExample: 'A car at 60 mph has 4 times the kinetic energy of the same car at 30 mph — why highway crashes are deadlier',
    apExamRelevance: 'KE appears in conservation of energy and work-energy theorem problems on every AP exam'
  },
  '303': {
    unitName: 'Work & Energy', lessonName: 'Potential Energy',
    concept: 'potential energy as stored energy due to position: PE = mgh and PE = ½kx²',
    prerequisites: ['work', 'kinetic energy'],
    keyFacts: ['Gravitational PE = mgh', 'Spring PE = ½kx²', 'PE converts to KE as objects fall or springs release'],
    realWorldExample: 'A roller coaster at the top of a hill has maximum PE — it converts to KE as it descends',
    apExamRelevance: 'Potential energy is half of conservation of energy problems — always identify all PE types in a system'
  },
  '304': {
    unitName: 'Work & Energy', lessonName: 'Conservation of Energy',
    concept: 'total mechanical energy is conserved in isolated systems: KE + PE = constant',
    prerequisites: ['kinetic energy', 'potential energy'],
    keyFacts: ['KE + PE = constant in isolated systems', 'Friction converts mechanical energy to heat', 'Energy is never created or destroyed'],
    realWorldExample: 'A pendulum swings — all PE at top, all KE at bottom, total energy always the same',
    apExamRelevance: 'Conservation of energy is the most powerful problem-solving tool in AP Physics — use it to skip force analysis'
  },
  '305': {
    unitName: 'Work & Energy', lessonName: 'Power',
    concept: 'power as the rate of doing work: P = dW/dt = Fv',
    prerequisites: ['work', 'kinetic energy', 'velocity'],
    keyFacts: ['P = W/t (average power)', 'P = Fv for constant force along velocity', 'SI unit: 1 Watt = 1 J/s'],
    realWorldExample: 'A 100 W bulb uses 100 J every second — a car engine at highway speed outputs ~50,000–100,000 W to overcome air drag',
    apExamRelevance: 'Power appears in AP free response when efficiency or rate of energy transfer is asked — P = Fv is the most tested form'
  },
  '401': {
    unitName: 'Momentum', lessonName: 'What is Momentum?',
    concept: 'momentum as mass in motion: p = mv',
    prerequisites: ['velocity', 'Newton\'s 2nd Law'],
    keyFacts: ['p = mv (vector, same direction as v)', 'Larger mass or velocity → more momentum', 'Momentum is conserved in isolated systems'],
    realWorldExample: 'A bowling ball at 5 m/s is much harder to stop than a tennis ball at the same speed — it has far more momentum',
    apExamRelevance: 'Momentum is the foundation of all collision problems — define the system and check if it is isolated before applying conservation'
  },
  '402': {
    unitName: 'Momentum', lessonName: 'Impulse',
    concept: 'impulse-momentum theorem: J = FΔt = Δp',
    prerequisites: ['momentum', 'Newton\'s 2nd Law'],
    keyFacts: ['J = FΔt = Δp', 'Impulse is the area under an F-t graph', 'Large force for short time = small force for long time (same impulse)'],
    realWorldExample: 'Airbags increase collision time, reducing average force on the driver — same Δp, much smaller F',
    apExamRelevance: 'Impulse appears on AP exams as F-t graphs (find area = impulse = Δp) and in problems where force and time are given instead of energy'
  },
  '403': {
    unitName: 'Momentum', lessonName: 'Collisions',
    concept: 'conservation of momentum in collisions: Σp_before = Σp_after',
    prerequisites: ['momentum', 'impulse'],
    keyFacts: ['Total momentum conserved in isolated systems', 'Perfectly inelastic: objects stick, maximum KE lost', 'm₁v₁ + m₂v₂ = (m₁+m₂)v_f'],
    realWorldExample: 'Two carts on a frictionless track collide and stick — total momentum before equals total momentum after, even though KE is lost',
    apExamRelevance: 'Momentum conservation in collisions is guaranteed AP free response material — identify elastic vs inelastic before setting up equations'
  },
  '404': {
    unitName: 'Momentum', lessonName: 'Elastic Collisions',
    concept: 'elastic collisions conserve both momentum AND kinetic energy',
    prerequisites: ['collisions', 'kinetic energy'],
    keyFacts: ['Both p and KE conserved', 'Solve system of two equations: Σp and ΣKE', 'Head-on equal-mass elastic: velocities exchange'],
    realWorldExample: 'A cue ball stopping dead after hitting a stationary billiard ball — classic elastic collision where all momentum transfers',
    apExamRelevance: 'AP elastic collision problems require two equations simultaneously — momentum AND KE. Watch for the equal-mass shortcut.'
  },
  '405': {
    unitName: 'Momentum', lessonName: 'Center of Mass',
    concept: 'center of mass as the mass-weighted average position: x_cm = Σmᵢxᵢ / M',
    prerequisites: ['momentum', 'collisions'],
    keyFacts: ['x_cm = Σmᵢxᵢ / M', 'External forces act as if applied at the center of mass', 'Internal forces cannot move the center of mass'],
    realWorldExample: 'A wrench tossed through the air spins chaotically — but its center of mass traces a perfect parabola, following only gravity',
    apExamRelevance: 'Center of mass connects to the system momentum: p_total = M·v_cm — expect it in AP problems with multiple-object systems'
  },
  '601': {
    unitName: 'Oscillations', lessonName: 'Simple Harmonic Motion',
    concept: 'SHM as motion with restoring force proportional to displacement: F = -kx',
    prerequisites: ['Newton\'s 2nd Law', 'springs'],
    keyFacts: ['F = -kx (restoring force)', 'x(t) = A cos(ωt + φ)', 'Period T = 2π/ω is independent of amplitude'],
    realWorldExample: 'A mass on a spring oscillates forever without friction — the restoring force is always directed back toward equilibrium',
    apExamRelevance: 'SHM is the gateway to all oscillation problems — define equilibrium, identify the restoring force, and write F = -kx'
  },
  '602': {
    unitName: 'Oscillations', lessonName: 'Spring Forces',
    concept: 'Hooke\'s Law and the period of a mass-spring system: T = 2π√(m/k)',
    prerequisites: ['simple harmonic motion'],
    keyFacts: ['F = -kx (Hooke\'s Law)', 'T = 2π√(m/k)', 'Larger k or smaller m → faster oscillation'],
    realWorldExample: 'A stiff spring (large k) bounces a ball faster than a soft spring — stiffer means shorter period',
    apExamRelevance: 'T = 2π√(m/k) is frequently tested — know what T depends on (m and k) and what it does NOT (amplitude, initial conditions)'
  },
  '603': {
    unitName: 'Oscillations', lessonName: 'Pendulums',
    concept: 'simple pendulum period depends only on length and g: T = 2π√(L/g)',
    prerequisites: ['simple harmonic motion', 'Newton\'s Laws'],
    keyFacts: ['T = 2π√(L/g)', 'Independent of mass and amplitude (small angles)', 'Restoring force is the tangential component of gravity'],
    realWorldExample: 'A grandfather clock keeps time with a pendulum — doubling the pendulum length increases the period by √2, slowing the clock',
    apExamRelevance: 'AP pendulum problems test T = 2π√(L/g) and the small-angle approximation — always confirm amplitude is small before using it'
  },
  '604': {
    unitName: 'Oscillations', lessonName: 'Energy in SHM',
    concept: 'total energy in SHM is conserved: E = ½kA² = ½mv² + ½kx²',
    prerequisites: ['simple harmonic motion', 'conservation of energy'],
    keyFacts: ['E = ½kA² (constant, set by amplitude)', 'At equilibrium x=0: all KE', 'At amplitude x=A: all PE, zero KE'],
    realWorldExample: 'A pendulum at max height (A) has all PE and zero KE — at the bottom it has all KE — total energy never changes',
    apExamRelevance: 'Energy in SHM is a classic multi-concept AP problem — combine conservation of energy with x(t) to find speed at any position'
  },
  '605': {
    unitName: 'Oscillations', lessonName: 'Damped Oscillations',
    concept: 'damping reduces amplitude over time; resonance occurs when driving frequency matches natural frequency',
    prerequisites: ['energy in SHM', 'simple harmonic motion'],
    keyFacts: ['Damping removes energy — amplitude decreases exponentially', 'Resonance: maximum amplitude when f_drive = f_natural', 'Critical damping returns to equilibrium fastest without oscillating'],
    realWorldExample: 'Car shock absorbers are critically damped — they stop bouncing immediately. An untuned car oscillates on every speed bump.',
    apExamRelevance: 'Damping and resonance are conceptual AP questions — understand why resonance produces large amplitudes and why critical damping is used in engineering'
  },
  '801': {
    unitName: 'Rotation', lessonName: 'Angular Motion',
    concept: 'angular displacement θ, velocity ω, and acceleration α are rotational analogues of x, v, a',
    prerequisites: ['kinematics', 'velocity', 'acceleration'],
    keyFacts: ['ω = dθ/dt, α = dω/dt', 'Same kinematic equations apply: ω = ω₀ + αt, θ = ω₀t + ½αt²', 'Linear and angular relate: v = rω, a_t = rα'],
    realWorldExample: 'A spinning top: its angle θ changes at rate ω (angular velocity), which itself changes at rate α — exactly like linear kinematics',
    apExamRelevance: 'Rotational kinematics mirrors linear kinematics exactly — AP problems require fluent switching between v/a and ω/α using v = rω'
  },
  '802': {
    unitName: 'Rotation', lessonName: 'Torque',
    concept: 'torque as the rotational analogue of force: τ = r × F = rF sin(θ)',
    prerequisites: ['angular motion', 'Newton\'s 2nd Law', 'vectors'],
    keyFacts: ['τ = rF sin(θ) where θ is angle between r and F', 'Torque is a cross product — direction by right-hand rule', 'Net torque causes angular acceleration: τ_net = Iα'],
    realWorldExample: 'A longer wrench requires less force for the same torque — mechanics use this every day without thinking about it',
    apExamRelevance: 'Torque is F=ma for rotation: τ=Iα — it appears in every AP rotational dynamics problem. Maximize torque by applying force perpendicular to r.'
  },
  '803': {
    unitName: 'Rotation', lessonName: 'Moment of Inertia',
    concept: 'moment of inertia I = Σmᵢrᵢ² measures resistance to angular acceleration',
    prerequisites: ['torque', 'angular motion'],
    keyFacts: ['I = Σmᵢrᵢ² (discrete) or ∫r² dm (continuous)', 'Parallel axis theorem: I = I_cm + Md²', 'Common values: ring mr², disk ½mr², solid sphere ⅖mr²'],
    realWorldExample: 'Figure skaters pull in their arms to spin faster — reducing r decreases I, and conservation of angular momentum increases ω',
    apExamRelevance: 'AP Physics C provides an I table — you must know which formula to pick for rings, disks, rods, and spheres, and when to use the parallel axis theorem'
  },
  '804': {
    unitName: 'Rotation', lessonName: 'Angular Momentum',
    concept: 'angular momentum L = Iω is conserved when net external torque is zero',
    prerequisites: ['moment of inertia', 'torque'],
    keyFacts: ['L = Iω', 'ΔL/Δt = τ_net', 'L is conserved when τ_net = 0 (isolated rotational system)'],
    realWorldExample: 'A gyroscope resists tipping — any applied torque rotates the direction of L rather than changing its magnitude, causing precession',
    apExamRelevance: 'Conservation of angular momentum is the rotational equivalent of momentum conservation — expect it on AP free response involving spinning systems'
  },
  '805': {
    unitName: 'Rotation', lessonName: 'Rolling Motion',
    concept: 'rolling without slipping combines rotation and translation: v_cm = Rω',
    prerequisites: ['angular momentum', 'kinetic energy', 'moment of inertia'],
    keyFacts: ['v_cm = Rω (rolling constraint)', 'KE_total = ½mv_cm² + ½Iω²', 'Objects with smaller I/MR² ratio reach bottom of ramp first'],
    realWorldExample: 'A solid ball and a hollow sphere released from the same ramp height — the solid ball wins because its KE is less concentrated in rotation',
    apExamRelevance: 'Rolling motion problems combine translational and rotational KE — use energy conservation with both ½mv² and ½Iω² terms, then apply v = Rω'
  },
}

function buildSystemPrompt(): string {
  return `You are Parallax AI — an elite AP Physics C tutor building interactive lesson cards.

YOUR TEACHING PHILOSOPHY:
- Hook students with surprising phenomena before explaining anything
- Build intuition through concrete analogies BEFORE introducing equations
- Each card teaches ONE idea completely before moving on
- Check understanding immediately after teaching — never batch testing at the end
- Use the Socratic method for hints — never give direct answers

CONTENT QUALITY RULES:
- Answer choices must be SPECIFIC physics values, equations, or statements
- NEVER write "Option A", "First choice", "Answer 1" or any placeholder text
- Wrong answers must be plausible misconceptions students actually have
- Questions must test understanding, not memorization
- Explanations must be 2-4 sentences maximum — this is a mobile app`
}

function buildLessonPrompt(
  meta: typeof LESSON_META[string],
  attemptNumber: number,
  masteryScore: number,
  missedConcepts: string[],
  preferredStyle: string
): string {
  const level = masteryScore < 40 ? 'conceptual only — no equations'
    : masteryScore < 70 ? 'algebra-based with clear variable explanations'
    : 'full AP Physics C calculus treatment'

  const retryNote = attemptNumber > 1
    ? `IMPORTANT: This is attempt ${attemptNumber}. Use COMPLETELY DIFFERENT analogies and examples. Approach from a fresh angle.`
    : ''

  const missedNote = missedConcepts.length > 0
    ? `Student previously struggled with: ${missedConcepts.join(', ')}. Address these gaps directly.`
    : ''

  return `Create an interactive lesson for: "${meta.lessonName}" (${meta.unitName})
Concept: ${meta.concept}

Student level: ${level}
${retryNote}
${missedNote}

Real world example to use: "${meta.realWorldExample}"
AP exam relevance: "${meta.apExamRelevance}"
Prerequisites known: ${meta.prerequisites.join(', ') || 'none yet'}
Key facts to cover: ${meta.keyFacts.join(' | ')}

Generate a lesson with exactly 9 cards in this sequence:
1. HOOK card — surprising question or fact that creates curiosity
2. CONCEPT card — core idea with analogy (${preferredStyle} style), focused ONLY on the foundational definition
3. CHECK card — 1 question testing JUST the foundational definition just taught
4. CONCEPT card — second distinct sub-idea (e.g. the equation/formula), with a DIFFERENT visual focus than card 2
5. CHECK card — question testing the equation/formula from card 4 (must be different topic than check in card 3)
6. CONCEPT card — third distinct sub-idea (e.g. real-world application or edge case), with yet another DIFFERENT visual focus
7. CHECK card — question testing the application from card 6 (must be different topic than checks in cards 3 and 5)
8. SUMMARY card — key takeaways + connection to AP exam
9. (This card is virtual - the 3 check cards from 3, 5, 7 become the final quiz automatically)

IMPORTANT: Generate TWO SEPARATE sets of questions:
1. "mini-checks" (3 questions) — embedded DURING the lesson, testing immediate understanding right after each concept is taught. These appear inline as the student progresses.
2. "finalQuiz" (3 DIFFERENT questions) — appears at the END, testing the SAME 3 concepts but with NEW scenarios, NEW numbers, or NEW angles. These must NOT be the same question reworded — they must be genuinely different questions that still test the same underlying concept.

Example of GOOD mini-check vs final quiz pairing:
Mini-check: "A 5kg ball is raised 2m. What is its PE?" → tests PE = mgh
Final quiz: "A roller coaster car (800kg) is at the top of a 15m hill. What is its PE?" → ALSO tests PE = mgh but completely different scenario/numbers

Return ONLY valid JSON:
{
  "cards": [
    { "type": "hook", "title": "...", "content": "...", "visual": "emoji" },
    { "type": "concept", "title": "...", "content": "...", "equation": "... or null", "visualFocus": "definition", "visual": "emoji" },
    {
      "type": "check",
      "title": "Quick Check",
      "question": "Mini-check question testing the definition just taught",
      "options": ["specific A", "specific B", "specific C", "specific D"],
      "correct": 0,
      "hint": "Socratic hint ⚡",
      "explanation": "Why this is correct, 2 sentences",
      "followUp": {
        "question": "A DIFFERENT question testing the SAME concept with different numbers/scenario",
        "options": ["specific A", "specific B", "specific C", "specific D"],
        "correct": 1,
        "explanation": "Why this is correct, 2 sentences"
      }
    },
    { "type": "concept", "title": "...", "content": "...", "equation": "...", "visualFocus": "equation", "visual": "different emoji" },
    {
      "type": "check",
      "title": "Apply the Formula",
      "question": "Mini-check testing the equation",
      "options": ["A", "B", "C", "D"],
      "correct": 1,
      "hint": "...",
      "explanation": "...",
      "followUp": {
        "question": "A DIFFERENT calculation question using the same equation with different values",
        "options": ["specific A", "specific B", "specific C", "specific D"],
        "correct": 0,
        "explanation": "Why this is correct, 2 sentences"
      }
    },
    { "type": "concept", "title": "...", "content": "...", "equation": "... or null", "visualFocus": "application", "visual": "third emoji" },
    {
      "type": "check",
      "title": "Real World Check",
      "question": "Mini-check testing application",
      "options": ["A", "B", "C", "D"],
      "correct": 2,
      "hint": "...",
      "explanation": "...",
      "followUp": {
        "question": "A DIFFERENT real-world scenario testing the same application concept",
        "options": ["specific A", "specific B", "specific C", "specific D"],
        "correct": 3,
        "explanation": "Why this is correct, 2 sentences"
      }
    },
    { "type": "summary", "title": "Key Takeaways", "points": ["...", "...", "..."], "apNote": "...", "visual": "🎯" }
  ],
  "finalQuiz": [
    {
      "question": "DIFFERENT scenario testing the SAME definition concept from mini-check 1",
      "options": ["specific A", "specific B", "specific C", "specific D"],
      "correct": 0,
      "hint": "Socratic hint ⚡",
      "explanation": "2 sentence explanation"
    },
    {
      "question": "DIFFERENT scenario testing the SAME equation/calculation from mini-check 2",
      "options": ["A", "B", "C", "D"],
      "correct": 1,
      "hint": "...",
      "explanation": "..."
    },
    {
      "question": "DIFFERENT scenario testing the SAME application concept from mini-check 3",
      "options": ["A", "B", "C", "D"],
      "correct": 2,
      "hint": "...",
      "explanation": "..."
    }
  ],
  "diagramType": "${
    meta.concept.includes('kinetic') ? 'kinetic' :
    meta.concept.includes('potential') ? 'potential' :
    meta.concept.includes('conserv') ? 'conservation' :
    meta.concept.includes('work-energy') || meta.concept.includes('Work-Energy') ? 'conservation' :
    meta.concept.includes('motion') || meta.concept.includes('kinematic') ? 'motion' :
    meta.concept.includes('force') || meta.concept.includes('Newton') ? 'force' :
    meta.concept.includes('work') ? 'work' :
    meta.concept.includes('velocity') || meta.concept.includes('speed') ? 'velocity' :
    meta.concept.includes('momentum') ? 'momentum' :
    meta.concept.includes('oscillat') || meta.concept.includes('spring') ? 'oscillation' :
    meta.concept.includes('gravity') || meta.concept.includes('orbit') ? 'gravity' : 'generic'
  }"
}

Each check card's followUp question must test the EXACT SAME concept as its parent question, but with different numbers or a different scenario — this is shown ONLY if the student gets the first question wrong, giving them a second chance to demonstrate understanding.

CRITICAL: finalQuiz questions must use DIFFERENT numbers, DIFFERENT scenarios, or DIFFERENT phrasing than the mini-checks — never copy or lightly reword them.

Return ONLY the JSON. No markdown, no explanation, no backticks.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      lessonId,
      attemptNumber = 1,
      masteryScore = 50,
      missedConcepts = [],
      preferredStyle = 'intuitive',
    } = body

    const meta = LESSON_META[lessonId]

    if (!meta) {
      return NextResponse.json({ error: `Lesson ${lessonId} not found` }, { status: 404 })
    }

    // Check cache first — if found, return immediately (free, instant)
    // Only cache the default 'intuitive' style on attempt 1
    // Personalized retries (attempt > 1) always generate fresh
    if (attemptNumber === 1 && preferredStyle === 'intuitive' && missedConcepts.length === 0) {
      const cached = await getCachedLesson(lessonId, preferredStyle)
      if (cached) {
        console.log(`Cache HIT for lesson ${lessonId} — serving cached content`)
        return NextResponse.json({ meta, ...cached })
      }
      console.log(`Cache MISS for lesson ${lessonId} — generating with Claude`)
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 5000,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildLessonPrompt(meta, attemptNumber, masteryScore, missedConcepts, preferredStyle) }]
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse lesson content' }, { status: 500 })
    }

    // Cache the result for future students (only default style, first attempt)
    if (attemptNumber === 1 && preferredStyle === 'intuitive' && missedConcepts.length === 0) {
      await cacheLesson(lessonId, preferredStyle, parsed)
      console.log(`Cached lesson ${lessonId} for future use`)
    }

    return NextResponse.json({ meta, ...parsed })

  } catch (error) {
    console.error('Lesson API error:', error)
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 })
  }
}
