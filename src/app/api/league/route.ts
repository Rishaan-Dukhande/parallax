import { NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/supabase'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const leaderboard = await getLeaderboard()
    return NextResponse.json({ leaderboard, currentUserId: userId })
  } catch (err) {
    console.error('GET /api/league error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
