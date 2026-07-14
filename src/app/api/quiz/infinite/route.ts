import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

const TOPIC_CONFIG: Record<string, {
  name: string
  easyCount: number
  mediumCount: number
  hardCount: number
  concepts: string[]
  easyTemplates: string[]
  mediumTemplates: string[]
  hardTemplates: string[]
}> = {
  'kinematics': {
    name: 'Kinematics',
    easyCount: 5, mediumCount: 5, hardCount: 5,
    concepts: ['displacement', 'velocity', 'acceleration', 'kinematic equations', 'projectile motion'],
    easyTemplates: [
      'Conceptual question about what velocity/speed/displacement means',
      'True or false style question about direction and motion',
      'Basic definition of acceleration question',
    ],
    mediumTemplates: [
      'Single step v = d/t calculation with specific numbers',
      'Find acceleration given initial and final velocity over time',
      'Calculate displacement using x = v₀t + ½at²',
    ],
    hardTemplates: [
      'Two-part projectile motion problem',
      'Multi-step kinematics with two objects',
      'Find time using quadratic from kinematic equation',
    ],
  },
  'newtons-laws': {
    name: "Newton's Laws",
    easyCount: 5, mediumCount: 5, hardCount: 5,
    concepts: ['force', 'mass', 'acceleration', 'Newton 1st', 'Newton 2nd', 'Newton 3rd', 'free body diagrams'],
    easyTemplates: [
      'Conceptual question about inertia and Newton First Law',
      'Which direction does friction act question',
      'Action-reaction pair identification',
    ],
    mediumTemplates: [
      'F = ma calculation with single force',
      'Net force from multiple forces in same direction',
      'Find acceleration given mass and net force',
    ],
    hardTemplates: [
      'Inclined plane with friction — find acceleration',
      'Two-mass Atwood machine problem',
      'Multi-force system requiring FBD and Newton second law',
    ],
  },
  'work-energy': {
    name: 'Work & Energy',
    easyCount: 5, mediumCount: 5, hardCount: 5,
    concepts: ['work', 'kinetic energy', 'potential energy', 'conservation of energy', 'work-energy theorem'],
    easyTemplates: [
      'When is work zero — perpendicular force scenario',
      'Which has more kinetic energy conceptual question',
      'Identify potential vs kinetic energy in scenario',
    ],
    mediumTemplates: [
      'Calculate KE = ½mv² with specific values',
      'Find PE = mgh at a given height',
      'W = Fd·cosθ with angle given',
    ],
    hardTemplates: [
      'Conservation of energy — find speed at bottom of ramp',
      'Work-energy theorem to find final velocity',
      'Spring PE + gravitational PE combined system',
    ],
  },
  'momentum': {
    name: 'Momentum',
    easyCount: 4, mediumCount: 4, hardCount: 4,
    concepts: ['momentum', 'impulse', 'conservation of momentum', 'elastic collisions', 'inelastic collisions'],
    easyTemplates: [
      'Which object has more momentum conceptual',
      'What happens to momentum in isolated system',
      'Define impulse conceptual question',
    ],
    mediumTemplates: [
      'Calculate p = mv with specific values',
      'Find impulse J = FΔt',
      'Conservation of momentum — find final velocity after collision',
    ],
    hardTemplates: [
      'Elastic collision — find both final velocities',
      'Explosion problem — two pieces fly apart',
      'Multi-step impulse and momentum change',
    ],
  },
  'oscillations': {
    name: 'Oscillations',
    easyCount: 4, mediumCount: 4, hardCount: 4,
    concepts: ['simple harmonic motion', 'period', 'frequency', 'springs', 'pendulums', 'resonance'],
    easyTemplates: [
      'What happens to period if length doubles conceptual',
      'Where is KE maximum in oscillation',
      'Define frequency vs period',
    ],
    mediumTemplates: [
      'T = 2π√(L/g) pendulum period calculation',
      'T = 2π√(m/k) spring period calculation',
      'Find frequency given period',
    ],
    hardTemplates: [
      'Energy in SHM — find max speed from amplitude',
      'Compare two pendulums of different lengths',
      'Spring-mass system with energy conservation',
    ],
  },
  'em-fields': {
    name: 'E&M Fields',
    easyCount: 3, mediumCount: 4, hardCount: 3,
    concepts: ["Coulomb's law", 'electric fields', 'magnetic forces', 'Lorentz force'],
    easyTemplates: [
      'Like vs unlike charges — attract or repel',
      'Direction of electric field from positive charge',
      'What does magnetic field do to stationary charge',
    ],
    mediumTemplates: [
      "Coulomb's law calculation with two charges",
      'Electric field magnitude E = kQ/r²',
      'Magnetic force F = qvB with angle',
      'Compare electric force at two distances',
    ],
    hardTemplates: [
      'Net electric force from three charges',
      'Lorentz force direction using right-hand rule',
      'Work done by electric field on moving charge',
    ],
  },
}

function buildBatchPrompt(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number,
  masteryScore: number,
  previousQuestions: string[],
): string {
  const config = TOPIC_CONFIG[topic]
  const templates = difficulty === 'easy'
    ? config.easyTemplates
    : difficulty === 'medium'
    ? config.mediumTemplates
    : config.hardTemplates

  const avoidText = previousQuestions.length > 0
    ? `Do NOT repeat or closely resemble these previous questions: ${previousQuestions.slice(-10).join(' | ')}`
    : ''

  return `Generate exactly ${count} ${difficulty} physics questions for the topic "${config.name}".

Student mastery: ${masteryScore}/100
Concepts to draw from: ${config.concepts.join(', ')}

Question type templates to use (rotate through these, use different numbers each time):
${templates.map((t, i) => `${i + 1}. ${t}`).join('\n')}

${avoidText}

STRICT RULES:
1. Every option must be a SPECIFIC physics value, equation, or statement
2. NEVER write "Option A", "Answer 1", or any placeholder
3. Wrong answers must be plausible misconceptions — not obviously wrong
4. Each question must use DIFFERENT numbers than any other
5. Questions must be genuinely different from each other — different scenarios, different variables
6. For ${difficulty} level: ${
  difficulty === 'easy'
    ? 'focus on conceptual understanding, minimal or no calculation'
    : difficulty === 'medium'
    ? 'single equation, clear substitution, reasonable numbers'
    : 'multi-step reasoning, combine two concepts, realistic AP-style scenario'
}

Return ONLY valid JSON — no markdown, no backticks:
{
  "questions": [
    {
      "question": "Full question text with specific scenario and numbers",
      "options": ["Specific answer A", "Specific answer B", "Specific answer C", "Specific answer D"],
      "correct": 0,
      "explanation": "2-3 sentence explanation of WHY this is correct and why the others are wrong",
      "difficulty": "${difficulty}",
      "concept": "specific concept being tested"
    }
  ]
}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic = 'newtons-laws',
      difficulty = 'medium',
      masteryScore = 50,
      previousQuestions = [],
      isSimpleTopic = false,
    } = body

    const config = TOPIC_CONFIG[topic]
    if (!config) {
      return NextResponse.json({ error: `Topic ${topic} not found` }, { status: 404 })
    }

    const count = isSimpleTopic
      ? (difficulty === 'easy' ? config.easyCount : difficulty === 'medium' ? config.mediumCount : config.hardCount)
      : Math.ceil((difficulty === 'easy' ? config.easyCount : difficulty === 'medium' ? config.mediumCount : config.hardCount) * 0.7)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      system: `You are an expert AP Physics question generator. Generate high-quality, distinct physics questions.
Every answer choice must be specific — never use placeholder text like "Option A" or "First answer".
Return ONLY valid JSON. No explanation outside the JSON structure.`,
      messages: [{
        role: 'user',
        content: buildBatchPrompt(topic, difficulty, count, masteryScore, previousQuestions),
      }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse questions' }, { status: 500 })
    }

    return NextResponse.json({
      topic,
      difficulty,
      questions: parsed.questions || [],
    })

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Infinite quiz API error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
