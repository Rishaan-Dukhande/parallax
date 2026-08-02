import { NextRequest, NextResponse } from 'next/server'
import {
  getOrCreateUserProgress,
  addXPAndCoins,
  saveLessonAttempt,
  saveQuizAttempt,
} from '@/lib/supabase'
import { getCurrentUser, getCurrentUserId } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const progress = await getOrCreateUserProgress(user.id, user.email)
    if (!progress) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(progress)
  } catch (err) {
    console.error('GET /api/progress error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { type, ...data } = body

    console.log('POST /api/progress called with type:', type, 'data:', data)

    if (type === 'lesson') {
      console.log('Saving lesson attempt...')
      const lessonResult = await saveLessonAttempt(
        userId,
        data.unitId,
        data.lessonId,
        data.stars,
        data.xpEarned,
        data.coinsEarned,
        data.attemptNumber
      )
      console.log('Lesson attempt saved:', lessonResult)

      const updated = await addXPAndCoins(
        userId,
        data.xpEarned,
        data.coinsEarned,
        data.newMastery
      )
      console.log('User progress updated:', updated)

      return NextResponse.json(updated)
    }

    if (type === 'quiz') {
      console.log('Saving quiz attempt...')
      await saveQuizAttempt(
        userId,
        data.topic,
        data.score,
        data.totalQuestions,
        data.xpEarned,
        data.masteryDelta
      )

      const updated = await addXPAndCoins(
        userId,
        data.xpEarned,
        0,
        data.newMastery
      )
      console.log('Quiz progress updated:', updated)

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/progress error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
