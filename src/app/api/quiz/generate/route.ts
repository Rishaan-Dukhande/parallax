import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

const TOPIC_META: Record<string, {
  name: string
  unit: string
  concepts: string[]
  apLevel: boolean
}> = {
  'kinematics': {
    name: 'Kinematics',
    unit: 'Motion',
    concepts: ['displacement', 'velocity', 'acceleration', 'kinematic equations', 'projectile motion'],
    apLevel: false,
  },
  'newtons-laws': {
    name: "Newton's Laws",
    unit: 'Forces',
    concepts: ['force', 'mass', 'acceleration', 'F=ma', 'action-reaction', 'free body diagrams'],
    apLevel: false,
  },
  'work-energy': {
    name: 'Work & Energy',
    unit: 'Energy',
    concepts: ['work', 'kinetic energy', 'potential energy', 'conservation of energy', 'work-energy theorem'],
    apLevel: false,
  },
  'momentum': {
    name: 'Momentum',
    unit: 'Momentum',
    concepts: ['momentum', 'impulse', 'conservation of momentum', 'elastic collisions', 'inelastic collisions'],
    apLevel: true,
  },
  'oscillations': {
    name: 'Oscillations',
    unit: 'Oscillations',
    concepts: ['simple harmonic motion', 'springs', 'pendulums', 'period', 'frequency', 'resonance'],
    apLevel: true,
  },
  'em-fields': {
    name: 'E&M Fields',
    unit: 'Electromagnetism',
    concepts: ["Coulomb's law", 'electric fields', 'magnetic forces', 'Lorentz force'],
    apLevel: true,
  },
}

function buildQuizPrompt(
  topic: string,
  masteryScore: number,
  questionCount: number,
  previousMistakes: string[],
): string {
  const meta = TOPIC_META[topic] || TOPIC_META['newtons-laws']

  const difficulty = masteryScore < 30
    ? 'conceptual and intuitive — no equations, focus on understanding'
    : masteryScore < 60
    ? 'mixed — some equations, some conceptual, algebra-based'
    : 'AP Physics C level — calculus-based where appropriate, rigorous'

  const mistakesText = previousMistakes.length > 0
    ? `The student has previously struggled with: ${previousMistakes.join(', ')}. Include at least one question targeting these weak areas.`
    : ''

  return `Generate exactly ${questionCount} adaptive physics quiz questions for the topic "${meta.name}" (${meta.unit}).

Student context:
- Mastery score: ${masteryScore}/100
- Difficulty level: ${difficulty}
- Key concepts to cover: ${meta.concepts.join(', ')}
${mistakesText}

Rules for questions:
1. Each question must be distinct — cover different concepts from the list
2. Include one calculation question if mastery > 30
3. Include one "explain why" conceptual question
4. Make wrong answer options plausible — not obviously wrong
5. Vary question difficulty slightly across the set (not all same difficulty)
6. For mastery > 60: include one AP-style multi-step problem

Return ONLY valid JSON in this exact format, no markdown, no backticks:
{
  "questions": [
    {
      "id": 1,
      "question": "Full question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why the correct answer is right, and why the others are wrong",
      "concept": "which concept this tests",
      "difficulty": "easy|medium|hard"
    }
  ]
}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic = 'newtons-laws',
      masteryScore = 50,
      questionCount = 5,
      previousMistakes = [],
    } = body

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: `You are Parallax AI — an adaptive AP Physics quiz generator.
Generate rigorous but fair questions appropriate for the student's mastery level.
Always return valid JSON only. No preamble, no markdown, no explanation outside the JSON.`,
      messages: [{
        role: 'user',
        content: buildQuizPrompt(topic, masteryScore, questionCount, previousMistakes),
      }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Fallback questions if JSON parse fails
      parsed = {
        questions: [
          {
            id: 1,
            question: "A 5 kg block accelerates at 3 m/s². What is the net force?",
            options: ["10 N", "15 N", "8 N", "20 N"],
            correct: 1,
            explanation: "F = ma = 5 × 3 = 15 N. Newton's Second Law directly gives us the answer.",
            concept: "Newton's Second Law",
            difficulty: "easy",
          },
          {
            id: 2,
            question: "An object moves at constant velocity. What is the net force?",
            options: ["Equal to gravity", "Greater than friction", "Zero", "Cannot be determined"],
            correct: 2,
            explanation: "Constant velocity means zero acceleration. By F=ma, if a=0 then F_net=0.",
            concept: "Newton's First Law",
            difficulty: "easy",
          },
          {
            id: 3,
            question: "A rocket ejects gas downward. In which direction does it accelerate?",
            options: ["Downward", "Sideways", "Upward", "It stays still"],
            correct: 2,
            explanation: "Newton's Third Law: the gas pushes down, so the rocket is pushed up with equal force.",
            concept: "Newton's Third Law",
            difficulty: "medium",
          },
          {
            id: 4,
            question: "Two forces act on a box: 30 N right and 10 N left. Net force?",
            options: ["40 N right", "20 N left", "20 N right", "30 N left"],
            correct: 2,
            explanation: "Net force = 30 - 10 = 20 N in the direction of the larger force (right).",
            concept: "Net force and vectors",
            difficulty: "medium",
          },
          {
            id: 5,
            question: "Doubling the mass of an object while keeping force constant will:",
            options: ["Double acceleration", "Halve acceleration", "Keep acceleration the same", "Triple acceleration"],
            correct: 1,
            explanation: "From F=ma: a=F/m. If m doubles and F stays same, a is halved.",
            concept: "F=ma relationship",
            difficulty: "hard",
          },
        ],
      }
    }

    return NextResponse.json({
      topic,
      masteryScore,
      ...parsed,
    })
  } catch (error) {
    console.error('Quiz generate error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
