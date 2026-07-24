import { NextResponse } from 'next/server'
import { getBeatenBosses } from '@/lib/supabase'

const DEFAULT_USER_ID = 'sandeep-default'

export async function GET() {
  try {
    const bosses = await getBeatenBosses(DEFAULT_USER_ID)
    return NextResponse.json(bosses)
  } catch (err) {
    console.error('Error fetching beaten bosses:', err)
    return NextResponse.json([], { status: 500 })
  }
}
