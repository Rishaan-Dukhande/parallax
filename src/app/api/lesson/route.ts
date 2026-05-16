import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

// All physics lessons metadata
// Used by Claude to know what concept to teach
const LESSON_META: Record<string, {
  unitName: string
  lessonName: string
  concept: string
  prerequisites: string[]
  keyFacts: string[]
}> = {
  '101': { unitName: 'Kinematics', lessonName: 'What is Motion?', concept: 'motion and reference frames', prerequisites: [], keyFacts: ['Motion is change in position over time', 'Motion is relative to a reference frame', 'Position needs a reference point'] },
  '102': { unitName: 'Kinematics', lessonName: 'Velocity vs Speed', concept: 'the difference between scalar speed and vector velocity', prerequisites: ['motion'], keyFacts: ['Speed is magnitude only (scalar)', 'Velocity includes direction (vector)', 'Constant speed can mean changing velocity (circular motion)'] },
  '103': { unitName: 'Kinematics', lessonName: 'Acceleration', concept: 'acceleration as rate of change of velocity', prerequisites: ['velocity'], keyFacts: ['Acceleration = Δv/Δt', 'Can be negative (deceleration)', 'Direction matters — it is a vector'] },
  '104': { unitName: 'Kinematics', lessonName: 'Kinematic Equations', concept: 'the four kinematic equations for constant acceleration', prerequisites: ['velocity', 'acceleration'], keyFacts: ['v = v₀ + at', 'x = v₀t + ½at²', 'v² = v₀² + 2ax', 'x = ½(v + v₀)t'] },
  '105': { unitName: 'Kinematics', lessonName: 'Projectile Motion', concept: 'projectile motion as independent horizontal and vertical components', prerequisites: ['kinematic equations', 'vectors'], keyFacts: ['Horizontal velocity is constant', 'Vertical acceleration is -9.8 m/s²', 'Components are independent'] },
  '201': { unitName: "Newton's Laws", lessonName: 'Force Basics', concept: 'force as a vector interaction between two objects', prerequisites: ['motion'], keyFacts: ['Force = push or pull', 'Forces have magnitude and direction', 'Net force causes acceleration'] },
  '202': { unitName: "Newton's Laws", lessonName: 'Free Body Diagrams', concept: 'representing all forces on an object visually', prerequisites: ['force basics'], keyFacts: ['Show all forces as arrows', 'Length represents magnitude', 'Direction represents direction of force'] },
  '203': { unitName: "Newton's Laws", lessonName: "Newton's 1st Law", concept: 'inertia and objects maintaining their state of motion', prerequisites: ['force basics'], keyFacts: ['Objects at rest stay at rest', 'Objects in motion stay in motion', 'Only net force changes motion'] },
  '204': { unitName: "Newton's Laws", lessonName: "Newton's 2nd Law", concept: 'F = ma — the relationship between force, mass, and acceleration', prerequisites: ["Newton's 1st Law", 'free body diagrams'], keyFacts: ['F = ma', 'Larger mass needs more force for same acceleration', 'Direction of acceleration = direction of net force'] },
  '205': { unitName: "Newton's Laws", lessonName: "Newton's 3rd Law", concept: 'action-reaction pairs — every force has an equal and opposite force', prerequisites: ["Newton's 2nd Law"], keyFacts: ['Every action has equal and opposite reaction', 'Forces act on DIFFERENT objects', 'Rocket propulsion is an example'] },
  '206': { unitName: "Newton's Laws", lessonName: 'Force Intuition Bridge', concept: 'building intuition for force through everyday examples', prerequisites: ['force basics'], keyFacts: ['Forces are everywhere in daily life', 'Normal force balances gravity on flat surfaces', 'Friction opposes motion'] },
  '301': { unitName: 'Work & Energy', lessonName: 'What is Work?', concept: 'work as force times displacement in the same direction', prerequisites: ['force basics'], keyFacts: ['W = F·d·cos(θ)', 'No displacement = no work', 'Perpendicular force does zero work'] },
  '302': { unitName: 'Work & Energy', lessonName: 'Kinetic Energy', concept: 'kinetic energy as energy of motion KE = ½mv²', prerequisites: ['work'], keyFacts: ['KE = ½mv²', 'Always positive', 'Doubles when speed increases by √2'] },
  '303': { unitName: 'Work & Energy', lessonName: 'Potential Energy', concept: 'stored energy due to position or configuration', prerequisites: ['work', 'kinetic energy'], keyFacts: ['Gravitational PE = mgh', 'Spring PE = ½kx²', 'Stored, not moving'] },
  '304': { unitName: 'Work & Energy', lessonName: 'Conservation of Energy', concept: 'total mechanical energy is conserved in closed systems', prerequisites: ['kinetic energy', 'potential energy'], keyFacts: ['KE + PE = constant', 'Energy transforms, not destroyed', 'Friction converts to heat'] },
  '305': { unitName: 'Work & Energy', lessonName: 'Work-Energy Theorem', concept: 'net work done equals change in kinetic energy', prerequisites: ['work', 'kinetic energy'], keyFacts: ['W_net = ΔKE', 'Links forces to energy', 'Powerful problem-solving tool'] },
  '401': { unitName: 'Momentum', lessonName: 'What is Momentum?', concept: 'momentum as mass times velocity', prerequisites: ["Newton's Laws"], keyFacts: ['p = mv', 'Vector quantity', 'Harder to stop = more momentum'] },
  '402': { unitName: 'Momentum', lessonName: 'Impulse', concept: 'impulse as change in momentum over time', prerequisites: ['momentum'], keyFacts: ['J = FΔt = Δp', 'Longer time = less force needed', 'Explains car airbags'] },
  '403': { unitName: 'Momentum', lessonName: 'Conservation of Momentum', concept: 'total momentum conserved in isolated systems', prerequisites: ['impulse'], keyFacts: ['p_before = p_after', 'No external forces needed', 'Applies to all collisions'] },
  '404': { unitName: 'Momentum', lessonName: 'Elastic Collisions', concept: 'collisions where both momentum and kinetic energy are conserved', prerequisites: ['conservation of momentum'], keyFacts: ['Both p and KE conserved', 'Objects bounce off', 'Billiard balls are approximately elastic'] },
}

function buildSystemPrompt(): string {
  return `You are Parallax AI — an adaptive physics tutor inside a gamified learning app called Parallax. Your personality:
- Encouraging but never patronizing
- Witty — occasional space/physics puns naturally
- Concise — this is a mobile-style app, not a textbook
- Use the Socratic method for hints — never give direct answers

CRITICAL TEACHING RULES:
1. NEVER just list facts. Always build intuition first through analogy, then introduce the formal concept.
2. Use 2-3 short paragraphs maximum per message. Short, punchy, clear.
3. Always end your final message with a thought-provoking question that leads naturally into the checkpoint.
4. Vary your analogies — NEVER use the same analogy on retry attempts.
5. Match depth to mastery score: below 40 = pure intuition/analogy, 40-70 = introduce equations, above 70 = full AP-level treatment.`
}

function buildLessonPrompt(
  meta: typeof LESSON_META[string],
  attemptNumber: number,
  masteryScore: number,
  missedConcepts: string[],
  preferredStyle: string
): string {
  const isRetry = attemptNumber > 1
  const missedText = missedConcepts.length > 0
    ? `The student previously struggled with: ${missedConcepts.join(', ')}. Address these specifically.`
    : ''

  const retryText = isRetry
    ? `This is attempt #${attemptNumber}. Use COMPLETELY DIFFERENT analogies and examples than before. Approach the concept from a fresh angle.`
    : ''

  const styleText = preferredStyle === 'visual'
    ? 'This student learns visually — use spatial analogies, describe scenes, reference the diagram.'
    : preferredStyle === 'mathematical'
    ? 'This student prefers equations — introduce the math earlier and explain each variable.'
    : 'Use everyday real-world analogies this student can relate to.'

  return `Teach the physics concept: "${meta.concept}" for the lesson "${meta.lessonName}" in the unit "${meta.unitName}".

Student context:
- Overall mastery score: ${masteryScore}/100
- Attempt number: ${attemptNumber}
- Learning style: ${preferredStyle}
${missedText}
${retryText}
${styleText}

Key facts to cover (naturally, not as a list):
${meta.keyFacts.map(f => `- ${f}`).join('\n')}

Prerequisites the student knows: ${meta.prerequisites.join(', ') || 'none yet'}

Generate exactly 3 teaching messages. Format your response as JSON:
{
  "messages": [
    "First message — hook the student with an analogy or surprising fact",
    "Second message — build the concept deeper, introduce any equations if appropriate",
    "Third message — connect to real world or the bigger physics picture, end with a question"
  ],
  "checkpoints": [
    {
      "question": "Checkpoint question 1 testing core concept",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0,
      "hint": "Socratic hint that guides without giving answer ⚡"
    },
    {
      "question": "Checkpoint question 2 testing application",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0,
      "hint": "Socratic hint ⚡"
    }
  ],
  "diagramType": "motion|velocity|force|work|momentum|energy|generic"
}

Return ONLY valid JSON. No markdown, no backticks, no preamble.`
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
      return NextResponse.json(
        { error: `Lesson ${lessonId} not found` },
        { status: 404 }
      )
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: buildSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildLessonPrompt(meta, attemptNumber, masteryScore, missedConcepts, preferredStyle)
      }]
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // If JSON parse fails, return a fallback
      parsed = {
        messages: [
          `Welcome, Navigator. Let's explore ${meta.lessonName}. ${meta.keyFacts[0]}. ⚡`,
          `${meta.keyFacts[1]}. Think about how this applies in the real world.`,
          `${meta.keyFacts[2]}. Now — can you predict what happens when we push this concept further?`,
        ],
        checkpoints: [
          { question: `What is the core idea behind ${meta.concept}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0, hint: 'Think about the definition. ⚡' },
          { question: `How does ${meta.lessonName} apply in real life?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0, hint: 'Consider everyday examples. ⚡' },
        ],
        diagramType: 'generic',
      }
    }

    return NextResponse.json({
      meta,
      ...parsed,
    })

  } catch (error) {
    console.error('Lesson API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson content' },
      { status: 500 }
    )
  }
}
