import { useState, useEffect, useCallback } from 'react'

interface UserProgress {
  xp: number
  coins: number
  mastery_score: number
  level: number
  streak_days: number
  league_rank: string
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>({
    xp: 3240,
    coins: 2450,
    mastery_score: 67,
    level: 12,
    streak_days: 14,
    league_rank: 'Quasar',
  })
  const [loading, setLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/progress')
      const data = await res.json()
      if (!data.error) setProgress(data)
    } catch (err) {
      console.error('Failed to load progress:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      if (e.detail && !e.detail.error) setProgress(e.detail)
    }
    window.addEventListener('progress-updated', handleUpdate as EventListener)
    return () => window.removeEventListener('progress-updated', handleUpdate as EventListener)
  }, [])

  const saveLesson = async (params: {
    unitId: number
    lessonId: number
    stars: number
    xpEarned: number
    coinsEarned: number
    attemptNumber: number
    newMastery: number
  }) => {
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lesson', ...params }),
      })
      const updated = await res.json()
      if (!updated.error) {
        setProgress(updated)
        window.dispatchEvent(new CustomEvent('progress-updated', { detail: updated }))
      }
      return updated
    } catch (err) {
      console.error('Failed to save lesson:', err)
    }
  }

  const saveQuiz = async (params: {
    topic: string
    score: number
    totalQuestions: number
    xpEarned: number
    masteryDelta: number
    newMastery: number
  }) => {
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quiz', ...params }),
      })
      const updated = await res.json()
      if (!updated.error) {
        setProgress(updated)
        window.dispatchEvent(new CustomEvent('progress-updated', { detail: updated }))
      }
      return updated
    } catch (err) {
      console.error('Failed to save quiz:', err)
    }
  }

  return { progress, loading, saveLesson, saveQuiz, fetchProgress }
}
