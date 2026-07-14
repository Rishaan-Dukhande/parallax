import { NextResponse } from 'next/server'
import { getLessonStars } from '@/lib/supabase'

const DEFAULT_USER_ID = 'sandeep-default'

export async function GET() {
  try {
    const stars = await getLessonStars(DEFAULT_USER_ID)
    return NextResponse.json(stars)
  } catch (err) {
    console.error('Error fetching stars:', err)
    return NextResponse.json({}, { status: 500 })
  }
}
