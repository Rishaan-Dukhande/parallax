import { supabase } from './supabase'

// Check if a lesson has been cached in Supabase
export async function getCachedLesson(lessonId: string, style: string) {
  const { data, error } = await supabase
    .from('lesson_cache')
    .select('content')
    .eq('lesson_id', lessonId)
    .eq('style', style)
    .single()

  if (error || !data) return null
  return data.content
}

// Save a generated lesson to cache
export async function cacheLesson(lessonId: string, style: string, content: unknown) {
  const { error } = await supabase
    .from('lesson_cache')
    .upsert({
      lesson_id: lessonId,
      style,
      content,
      cached_at: new Date().toISOString(),
    })

  if (error) console.error('Failed to cache lesson:', error)
}
