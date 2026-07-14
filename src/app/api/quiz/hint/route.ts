import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, concept, attemptedAnswer, masteryScore = 50 } = body

    // Build a Socratic hint — never gives the answer
    const prompt = `A student is stuck on this physics question:
"${question}"

The concept being tested: ${concept}
The student selected: "${attemptedAnswer}" (which was wrong)
Student mastery score: ${masteryScore}/100

Give a Socratic hint that:
1. NEVER reveals the correct answer
2. Asks a guiding question that leads them to think correctly
3. References a real-world analogy they can relate to
4. Is 2-3 sentences maximum — this is a mobile app
5. Ends with ⚡

Tone: encouraging, witty, like a brilliant friend who happens to know physics.`

    // Use streaming so the hint appears word by word
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 200,
      system: 'You are Parallax AI — a witty, Socratic physics tutor. Never give direct answers. Always guide with questions. Be concise.',
      messages: [{ role: 'user', content: prompt }],
    })

    // Return a streaming response
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
    console.error('Hint API error:', error)
    return new Response('Failed to generate hint', { status: 500 })
  }
}
