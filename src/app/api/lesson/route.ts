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
    unitName: 'Work & Energy', lessonName: 'Work-Energy Theorem',
    concept: 'net work done on an object equals its change in kinetic energy: W_net = ΔKE',
    prerequisites: ['work', 'kinetic energy'],
    keyFacts: ['W_net = ΔKE = ½mv² - ½mv₀²', 'Links forces directly to speed changes', 'Negative work slows objects down'],
    realWorldExample: 'A baseball glove stopping a pitch — the glove does negative work, reducing the ball\'s KE to zero',
    apExamRelevance: 'The work-energy theorem lets you find final speeds without using kinematics equations'
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
