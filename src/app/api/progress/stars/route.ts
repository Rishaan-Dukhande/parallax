import { NextResponse } from 'next/server'
import { getLessonStars } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const stars = await getLessonStars(userId)
    return NextResponse.json(stars)
  } catch (err) {
    console.error('Error fetching stars:', err)
    return NextResponse.json({}, { status: 500 })
  }
}
