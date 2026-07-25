import { NextResponse } from 'next/server'
import { getBeatenBosses } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const bosses = await getBeatenBosses(userId)
    return NextResponse.json(bosses)
  } catch (err) {
    console.error('Error fetching beaten bosses:', err)
    return NextResponse.json([], { status: 500 })
  }
}
