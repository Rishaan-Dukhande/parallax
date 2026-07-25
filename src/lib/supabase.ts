import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) { console.error('Error fetching user progress:', error); return null }
  return data
}

export async function updateUserProgress(userId: string, updates: { xp?: number; coins?: number; mastery_score?: number; level?: number; streak_days?: number; last_active?: string; league_rank?: string }) {
  const { data, error } = await supabase
    .from('user_progress')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) { console.error('Error updating user progress:', error); return null }
  return data
}

export async function addXPAndCoins(userId: string, xpToAdd: number, coinsToAdd: number, newMastery?: number) {
  const current = await getUserProgress(userId)
  if (!current) return null
  const newXP = current.xp + xpToAdd
  const newCoins = current.coins + coinsToAdd
  const newLevel = Math.floor(newXP / 1000) + 1
  const updates: Record<string, number | string> = {
    xp: newXP,
    coins: newCoins,
    level: newLevel,
    last_active: new Date().toISOString().split('T')[0],
  }
  if (newMastery !== undefined) updates.mastery_score = newMastery
  return updateUserProgress(userId, updates)
}

export async function saveLessonAttempt(userId: string, unitId: number, lessonId: number, stars: number, xpEarned: number, coinsEarned: number, attemptNumber: number) {
  const { data, error } = await supabase
    .from('lesson_attempts')
    .insert({ user_id: userId, unit_id: unitId, lesson_id: lessonId, stars, xp_earned: xpEarned, coins_earned: coinsEarned, attempt_number: attemptNumber })
    .select()
    .single()
  if (error) { console.error('Error saving lesson attempt:', error); return null }
  return data
}

export async function getLessonStars(userId: string) {
  const { data, error } = await supabase
    .from('lesson_attempts')
    .select('lesson_id, stars')
    .eq('user_id', userId)
  if (error) { console.error('Error fetching lesson stars:', error); return {} }
  const starMap: Record<number, number> = {}
  data.forEach(attempt => {
    const current = starMap[attempt.lesson_id] || 0
    starMap[attempt.lesson_id] = Math.max(current, attempt.stars)
  })
  return starMap
}

export async function saveQuizAttempt(userId: string, topic: string, score: number, totalQuestions: number, xpEarned: number, masteryDelta: number) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({ user_id: userId, topic, score, total_questions: totalQuestions, xp_earned: xpEarned, mastery_delta: masteryDelta })
    .select()
    .single()
  if (error) { console.error('Error saving quiz attempt:', error); return null }
  return data
}

export async function getOrCreateUserProgress(userId: string) {
  const existing = await getUserProgress(userId)
  if (existing) return existing
  const { data, error } = await supabase
    .from('user_progress')
    .insert({ user_id: userId, xp: 0, coins: 0, mastery_score: 0, level: 1, streak_days: 0 })
    .select()
    .single()
  if (error) { console.error('Error creating user progress:', error); return null }
  return data
}

export async function getBeatenBosses(userId: string): Promise<number[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('topic')
    .eq('user_id', userId)
    .like('topic', 'boss-unit-%')
  if (error) { console.error('Error fetching beaten bosses:', error); return [] }
  const ids = new Set<number>()
  data.forEach(row => {
    const match = row.topic.match(/^boss-unit-(\d+)$/)
    if (match) ids.add(Number(match[1]))
  })
  return Array.from(ids)
}
