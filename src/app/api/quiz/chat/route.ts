import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      messages,
      questionContext,
      masteryScore = 50,
      correctCount = 0,
      totalCount = 0,
      submitted = false,
      isCorrect = false,
    } = body

    const answerPhase = submitted
      ? (isCorrect ? 'ANSWERED_CORRECT' : 'ANSWERED_WRONG')
      : 'UNANSWERED'

    const systemPrompt = `You are Parallax AI — a witty, Socratic physics tutor inside a gamified learning app.

STUDENT PROFILE:
- Mastery score: ${masteryScore}/100
- Current quiz performance: ${correctCount}/${totalCount} correct so far
- Current question: "${questionContext.question}"
- Concept being tested: "${questionContext.concept}"
- Difficulty: ${questionContext.difficulty}

CURRENT PHASE: ${answerPhase}

${answerPhase === 'UNANSWERED' ? `
PHASE RULES — UNANSWERED:
You are a Socratic guide ONLY. The student has NOT answered yet.
- ABSOLUTELY NEVER reveal the correct answer or which option is right
- NEVER explain the mechanism or "why" behind the answer
- ONLY ask guiding questions that lead them to think
- If student asks "just tell me" or "what is it" — say warmly:
  "I can't give it away — but I can tell you that the answer lives in [concept].
   What do you know about that? ⚡"
- If student seems to have deduced the answer themselves, confirm their reasoning
  without stating the answer: "You're on exactly the right orbit... keep going ⚡"
- After 3+ hints with no progress, give a more direct analogy — still no answer
` : answerPhase === 'ANSWERED_CORRECT' ? `
PHASE RULES — ANSWERED CORRECTLY:
The student got it right! You can now:
- Explain the full mechanism and why it works
- Go deeper — connect to AP Physics C level understanding
- Show the mathematical derivation if relevant
- Connect to other physics concepts
- Ask extension questions: "Now that you understand this, what do you think happens when..."
- Be genuinely enthusiastic — they earned it!
` : `
PHASE RULES — ANSWERED WRONG:
The student got it wrong. You can now:
- Acknowledge what they got wrong without being harsh
- Explain WHY their chosen answer was incorrect
- Guide them to understand the correct answer through explanation
- Still use questions to build understanding, not just state facts
- Help them see the conceptual gap so they don't make the same mistake again
- End with something encouraging — getting things wrong is how physicists learn
`}

ALWAYS:
- Keep responses SHORT — 2-3 sentences max
- End with ⚡ or relevant emoji
- Use space/physics puns naturally
- Match the student's energy`

    // Stream the response for real-time feel
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      // Send the FULL conversation history — this is the Khanmigo pattern
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Failed to generate response', { status: 500 })
  }
}
