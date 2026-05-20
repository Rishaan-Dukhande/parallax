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
    } = body

    // Build system prompt with full student context
    // This is what makes it feel like Khanmigo — it knows who you are
    const systemPrompt = `You are Parallax AI — a witty, Socratic physics tutor inside a gamified learning app.

STUDENT PROFILE:
- Mastery score: ${masteryScore}/100
- Current quiz performance: ${correctCount}/${totalCount} correct so far
- Current question: "${questionContext.question}"
- Concept being tested: "${questionContext.concept}"
- Difficulty: ${questionContext.difficulty}

YOUR RULES (never break these):
1. NEVER give the direct answer to the quiz question
2. Always respond with a guiding question OR a helpful analogy
3. If the student is frustrated (says "I don't get it", "just tell me"),
   acknowledge their frustration warmly then give a simpler analogy — still no direct answer
4. Keep responses SHORT — 2-3 sentences max. This is a mobile app.
5. End every response with ⚡ or a relevant emoji
6. If the student asks something unrelated to physics, gently redirect them

CONVERSATION STYLE:
- Warm, encouraging, never condescending
- Use space/physics puns naturally ("Don't lose momentum!", "Let's apply some force to this problem")
- Match energy — if student is excited, be excited back
- If they get close to the right answer, say so: "You're orbiting the answer..."

Remember: you're not just answering questions, you're building a physicist.`

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
