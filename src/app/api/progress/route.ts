import { NextRequest, NextResponse } from 'next/server'
import {
  getUserProgress,
  addXPAndCoins,
  saveLessonAttempt,
  saveQuizAttempt,
} from '@/lib/supabase'

const DEFAULT_USER_ID = 'sandeep-default'

export async function GET() {
  try {
    const progress = await getUserProgress(DEFAULT_USER_ID)
    if (!progress) {
      console.error('User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(progress)
  } catch (err) {
    console.error('GET /api/progress error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    console.log('POST /api/progress called with type:', type, 'data:', data)

    if (type === 'lesson') {
      console.log('Saving lesson attempt...')
      const lessonResult = await saveLessonAttempt(
        DEFAULT_USER_ID,
        data.unitId,
        data.lessonId,
        data.stars,
        data.xpEarned,
        data.coinsEarned,
        data.attemptNumber
      )
      console.log('Lesson attempt saved:', lessonResult)

      const updated = await addXPAndCoins(
        DEFAULT_USER_ID,
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
        DEFAULT_USER_ID,
        data.topic,
        data.score,
        data.totalQuestions,
        data.xpEarned,
        data.masteryDelta
      )

      const updated = await addXPAndCoins(
        DEFAULT_USER_ID,
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
