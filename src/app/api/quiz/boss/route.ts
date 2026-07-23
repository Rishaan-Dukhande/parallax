import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

const UNIT_CONCEPTS: Record<number, {
  name: string
  concepts: string[]
  phase1Topics: string[]
  phase2Topics: string[]
}> = {
  1: {
    name: 'Kinematics',
    concepts: ['displacement', 'velocity', 'acceleration', 'kinematic equations', 'projectile motion'],
    phase1Topics: ['velocity and speed', 'displacement vs distance', 'constant acceleration'],
    phase2Topics: ['projectile motion components', 'multi-step kinematics', 'relative motion'],
  },
  2: {
    name: "Newton's Laws",
    concepts: ['force', 'mass', 'acceleration', 'Newton 1st', 'Newton 2nd', 'Newton 3rd', 'friction', 'free body diagrams'],
    phase1Topics: ['F = ma basic', 'Newton first law', 'action reaction pairs'],
    phase2Topics: ['inclined planes', 'Atwood machine', 'multi-force systems with friction'],
  },
  3: {
    name: 'Work & Energy',
    concepts: ['work', 'kinetic energy', 'potential energy', 'conservation of energy', 'work-energy theorem', 'power'],
    phase1Topics: ['W = Fd calculation', 'KE = half mv squared', 'PE = mgh'],
    phase2Topics: ['conservation of energy multi-step', 'work-energy theorem application', 'spring potential energy combined'],
  },
  4: {
    name: 'Momentum',
    concepts: ['momentum', 'impulse', 'conservation of momentum', 'elastic collisions', 'inelastic collisions', 'center of mass'],
    phase1Topics: ['p = mv calculation', 'impulse J = Ft', 'conservation in simple collision'],
    phase2Topics: ['elastic collision both velocities', 'explosion problems', 'combined momentum and energy'],
  },
  5: {
    name: 'Universal Gravity',
    concepts: ['gravitational force', 'gravitational fields', 'orbital motion', 'escape velocity', 'Kepler laws'],
    phase1Topics: ['F = Gm1m2/r squared', 'g = GM/r squared', 'orbital speed'],
    phase2Topics: ['escape velocity derivation', 'Kepler third law', 'gravitational potential energy combined'],
  },
  6: {
    name: 'Oscillations',
    concepts: ['simple harmonic motion', 'period', 'frequency', 'springs', 'pendulums', 'energy in SHM', 'resonance'],
    phase1Topics: ['period of pendulum', 'period of spring', 'frequency and period relationship'],
    phase2Topics: ['energy in SHM maximum speed', 'comparing two oscillators', 'resonance conditions'],
  },
  7: {
    name: 'E&M Fields',
    concepts: ["Coulomb's law", 'electric fields', 'electric potential', 'magnetic forces', 'Lorentz force', 'electromagnetic induction'],
    phase1Topics: ["Coulomb's law calculation", 'electric field direction', 'magnetic force on moving charge'],
    phase2Topics: ['net force from multiple charges', 'particle in combined E and B fields', 'work done by electric field'],
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { unitId, phase = 1, previousQuestions = [] } = body

    const unit = UNIT_CONCEPTS[unitId]
    if (!unit) {
      return NextResponse.json({ error: `Unit ${unitId} not found` }, { status: 404 })
    }

    const topics = phase === 1 ? unit.phase1Topics : unit.phase2Topics
    const difficulty = phase === 1 ? 'medium — single concept, clear calculation' : 'hard — AP Physics C level, multi-step reasoning'
    const timeLimit = phase === 1 ? 30 : 20
    const count = 5

    const avoidText = previousQuestions.length > 0
      ? `Do NOT repeat these questions: ${previousQuestions.slice(-10).join(' | ')}`
      : ''

    const prompt = `Generate exactly ${count} boss battle physics questions for the unit "${unit.name}".

This is Phase ${phase} of a boss battle game. The student has mastered all lessons in this unit.
Difficulty: ${difficulty}
Time limit per question: ${timeLimit} seconds

Draw from these specific topic areas (rotate through them):
${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

All concepts available: ${unit.concepts.join(', ')}

${avoidText}

RULES:
1. Every answer option must be SPECIFIC — real numbers, equations, or statements
2. NEVER write "Option A", "Answer 1", or placeholders
3. Wrong answers must be common misconceptions students actually have
4. Each question must cover a DIFFERENT topic area
5. Include the actual numbers/values needed to solve each problem
6. Phase ${phase} questions should feel ${phase === 1 ? 'challenging but fair' : 'intense and AP-exam worthy'}

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Full question with specific scenario and numbers",
      "options": ["Specific A", "Specific B", "Specific C", "Specific D"],
      "correct": 0,
      "explanation": "2-3 sentence explanation of why correct and why others wrong",
      "concept": "specific concept tested",
      "baseDamage": 300,
      "difficulty": "${phase === 1 ? 'medium' : 'hard'}"
    }
  ]
}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: `You are an expert AP Physics exam question generator creating boss battle questions.
Questions must be specific, challenging, and use real physics values.
Return ONLY valid JSON. No markdown, no backticks, no explanation outside JSON.`,
      messages: [{ role: 'user', content: prompt }],
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
      unitId,
      unitName: unit.name,
      phase,
      questions: parsed.questions || [],
    })

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Boss API error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
