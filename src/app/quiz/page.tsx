'use client'
import { useState, useEffect, useRef } from 'react'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

interface Question {
  id: number
  question: string
  options: string[]
  correct: number
  explanation: string
  concept: string
  difficulty: 'easy' | 'medium' | 'hard'
}

const TOPICS = [
  { id: 'kinematics', label: 'Kinematics', icon: '🚀', color: 'var(--cyan)' },
  { id: 'newtons-laws', label: "Newton's Laws", icon: '⚡', color: 'var(--cyan)' },
  { id: 'work-energy', label: 'Work & Energy', icon: '🔋', color: 'var(--green)' },
  { id: 'momentum', label: 'Momentum', icon: '💥', color: 'var(--purple)' },
  { id: 'oscillations', label: 'Oscillations', icon: '〰️', color: 'var(--orange)' },
  { id: 'em-fields', label: 'E&M Fields', icon: '🌊', color: 'var(--red)' },
]

// ─────────────────────────────────────────────
// XP TIMER COMPONENT
// Counts up — shows decreasing XP bonus
// Hard questions have higher base XP
// ─────────────────────────────────────────────
function XPTimer({
  timeElapsed,
  difficulty = 'medium',
}: {
  timeElapsed: number
  difficulty?: string
}) {
  const MAX_TIME = 75
  const BASE_XP = difficulty === 'hard' ? 200 : difficulty === 'easy' ? 100 : 150
  const MAX_BONUS = 500
  const bonusXP = Math.max(0, Math.round(MAX_BONUS * (1 - timeElapsed / MAX_TIME)))
  const totalXP = BASE_XP + bonusXP
  const pct = bonusXP / MAX_BONUS

  const color = pct > 0.6
    ? 'var(--cyan)'
    : pct > 0.3
    ? 'var(--orange)'
    : 'var(--red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 20, fontWeight: 900, color,
        transition: 'color 0.5s',
        textShadow: `0 0 10px ${color}`,
      }}>
        +{totalXP}
      </div>
      <div style={{
        fontSize: 9, color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: 1,
      }}>
        XP BONUS
      </div>
      <div style={{ width: 60, height: 3, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: color, borderRadius: 2,
          transition: 'width 1s linear, background 0.5s',
          boxShadow: `0 0 6px ${color}`,
        }} />
      </div>
    </div>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = {
    easy: { color: 'var(--green)', label: 'EASY' },
    medium: { color: 'var(--orange)', label: 'MEDIUM' },
    hard: { color: 'var(--red)', label: 'HARD' },
  }[difficulty] || { color: 'var(--cyan)', label: 'STANDARD' }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${config.color}18`,
      border: `1px solid ${config.color}44`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 9, fontWeight: 700,
      color: config.color,
      fontFamily: 'JetBrains Mono, monospace',
      letterSpacing: 1,
    }}>
      {config.label}
    </div>
  )
}

function QuizContent() {
  const [masteryScore, setMasteryScore] = useState(67)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // ── Timer state ──
  // timeElapsed counts UP from 0
  // resets to 0 on every new question
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showSeeAnswer, setShowSeeAnswer] = useState(false)
  const [sawAnswer, setSawAnswer] = useState(false)

  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState<string[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')

  const question = questions[currentQ]

  // ─────────────────────────────────────────────
  // TIMER EFFECT
  // Key insight: currentQ is in the dependency array
  // So this effect fully restarts on every new question
  // timeElapsed resets in handleNext — this effect
  // just reads it and increments it
  // ─────────────────────────────────────────────
  useEffect(() => {
    // Don't run if quiz hasn't started, answer submitted, or quiz over
    if (!quizStarted || submitted || showResult || !question) return

    const timer = setInterval(() => {
      setTimeElapsed(t => {
        const next = t + 1
        if (next === 75) setShowSeeAnswer(true)
        return next
      })
    }, 1000)

    // Cleanup: stop the interval when question changes or answer submitted
    return () => clearInterval(timer)

    // currentQ in deps means this effect restarts fresh for every question
  }, [quizStarted, submitted, showResult, question, currentQ])

  const generateQuiz = async (topic: string) => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          masteryScore,
          questionCount: 5,
          previousMistakes: mistakes,
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setQuestions(data.questions)
      setCurrentQ(0)
      setSelected(null)
      setSubmitted(false)
      setTimeElapsed(0)
      setShowSeeAnswer(false)
      setSawAnswer(false)
      setScore(0)
      setCorrectCount(0)
      setShowResult(false)
      setQuizStarted(true)
    } catch (err) {
      setLoadError('Failed to generate quiz. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (userMessage: string) => {
    if (hintLoading || !question) return
    const newConversation = [
      ...conversation,
      { role: 'user' as const, content: userMessage },
    ]
    setConversation(newConversation)
    setHintLoading(true)
    setStreamingText('')
    try {
      const res = await fetch('/api/quiz/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newConversation,
          questionContext: {
            question: question.question,
            concept: question.concept,
            difficulty: question.difficulty,
            questionNumber: currentQ + 1,
            totalQuestions: questions.length,
          },
          masteryScore,
          correctCount,
          totalCount: questions.length,
          submitted,
          isCorrect: submitted && selected === question.correct,
        }),
      })
      if (!res.ok) throw new Error('Chat API error')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      if (!reader) throw new Error('No reader')
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullResponse += chunk
        setStreamingText(fullResponse)
      }
      setConversation(prev => [
        ...prev,
        { role: 'assistant' as const, content: fullResponse },
      ])
      setStreamingText('')
    } catch (err) {
      setConversation(prev => [
        ...prev,
        { role: 'assistant' as const, content: 'Sorry Navigator, lost signal. Try again! ⚡' },
      ])
    } finally {
      setHintLoading(false)
    }
  }

  const handleOpenDrawer = () => {
    setDrawerOpen(true)
    // Always start fresh for THIS question
    // Never carry over context from previous questions
    if (conversation.length === 0 && !hintLoading) {
      handleSendMessage('Give me a hint for this question')
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const isCorrect = selected === question.correct
    const BASE_XP = question.difficulty === 'hard' ? 200 : question.difficulty === 'easy' ? 100 : 150
    const bonusXP = Math.max(0, Math.round(500 * (1 - timeElapsed / 75)))
    const earnedXP = sawAnswer ? 0 : BASE_XP + bonusXP
    if (isCorrect && !sawAnswer) {
      setScore(s => s + earnedXP)
      setCorrectCount(c => c + 1)
      setMasteryScore(prev => Math.min(100, Math.round(prev + (100 - prev) * 0.05)))
    } else if (!isCorrect) {
      setMistakes(prev => [...new Set([...prev, question.concept])])
      setMasteryScore(prev => Math.max(0, Math.round(prev - prev * 0.03)))
    }
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setShowResult(true)
    } else {
      setCurrentQ(q => q + 1)
      setSelected(null)
      setSubmitted(false)
      // ← These three lines are the timer reset
      setTimeElapsed(0)
      setShowSeeAnswer(false)
      setSawAnswer(false)
      setDrawerOpen(false)
      setConversation([])
      setStreamingText('')
    }
  }

  const isCorrect = submitted && selected === question?.correct

  // ── TOPIC SELECTION SCREEN ──
  if (!quizStarted && !loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar title="PARALLAX QUIZ" activeTab="Mass" />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '60px 40px' }}>
            <div style={{ width: '100%', maxWidth: 680 }}>
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 8 }}>ADAPTIVE QUIZ ENGINE</div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>Choose Your Battle</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Parallax AI generates 5 questions tailored to your mastery level ({masteryScore}/100). Questions and XP adapt to your difficulty and speed.
                </p>
              </div>
              {loadError && (
                <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 4, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>
                  ⚠️ {loadError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 32 }}>
                {TOPICS.map(topic => (
                  <button key={topic.id}
                    onClick={() => setSelectedTopic(topic.id === selectedTopic ? null : topic.id)}
                    style={{
                      background: selectedTopic === topic.id ? `${topic.color}18` : 'var(--bg-surface)',
                      border: `1px solid ${selectedTopic === topic.id ? topic.color : 'var(--border)'}`,
                      borderRadius: 8, padding: '20px',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'var(--transition)',
                      boxShadow: selectedTopic === topic.id ? `0 0 16px ${topic.color}33` : 'none',
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{topic.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: selectedTopic === topic.id ? topic.color : 'var(--text-primary)', marginBottom: 4 }}>
                      {topic.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>5 adaptive questions</div>
                  </button>
                ))}
              </div>
              <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 6 }}>YOUR CURRENT MASTERY</div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                    <div style={{ width: `${masteryScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: 3, boxShadow: '0 0 8px var(--cyan-glow)', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 900, color: 'var(--cyan)' }}>
                  {masteryScore}
                </div>
              </div>
              <button
                onClick={() => selectedTopic && generateQuiz(selectedTopic)}
                disabled={!selectedTopic}
                style={{
                  width: '100%', padding: '16px',
                  background: selectedTopic ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--border)',
                  border: 'none', borderRadius: 4,
                  color: selectedTopic ? 'var(--bg-base)' : 'var(--text-muted)',
                  fontSize: 15, fontWeight: 900, letterSpacing: 2,
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: selectedTopic ? 'pointer' : 'not-allowed',
                  boxShadow: selectedTopic ? '0 0 20px var(--cyan-glow)' : 'none',
                  transition: 'var(--transition)',
                }}>
                {selectedTopic ? `⚡ GENERATE ${TOPICS.find(t => t.id === selectedTopic)?.label.toUpperCase()} QUIZ` : 'SELECT A TOPIC FIRST'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── LOADING SCREEN ──
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 48, animation: 'pulse-glow 1s ease-in-out infinite' }}>⚡</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', fontSize: 13, letterSpacing: 2 }}>PARALLAX AI IS GENERATING YOUR QUIZ...</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Calibrating to mastery score {masteryScore}/100</div>
        </main>
      </div>
    )
  }

  // ── RESULTS SCREEN ──
  if (showResult) {
    const percentage = Math.round((correctCount / questions.length) * 100)
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 520, width: '100%', padding: '0 40px' }}>
            <div style={{ fontSize: 72, marginBottom: 20, animation: 'bossAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
              {percentage >= 80 ? '🌟' : percentage >= 60 ? '✅' : '💡'}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
              {percentage >= 80 ? 'Outstanding, Navigator!' : percentage >= 60 ? 'Good Work!' : 'Keep Pushing!'}
            </h1>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
              {correctCount} / {questions.length} correct · {selectedTopic && TOPICS.find(t => t.id === selectedTopic)?.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Score', value: `${percentage}%`, color: percentage >= 80 ? 'var(--green)' : percentage >= 60 ? 'var(--cyan)' : 'var(--orange)' },
                { label: 'XP Earned', value: `+${score}`, color: 'var(--cyan)' },
                { label: 'Mastery', value: `${masteryScore}`, color: 'var(--purple)' },
              ].map(card => (
                <div key={card.label} className="glass-card" style={{ padding: '20px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{card.label}</div>
                </div>
              ))}
            </div>
            {mistakes.length > 0 && (
              <div style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid var(--orange)', borderRadius: 4, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 10 }}>⚡ CONCEPTS TO REVIEW</div>
                {mistakes.map(concept => (
                  <div key={concept} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{concept}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setQuizStarted(false); setSelectedTopic(null); setMistakes([]) }}
                style={{ flex: 1, padding: '14px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                ← NEW TOPIC
              </button>
              <button onClick={() => selectedTopic && generateQuiz(selectedTopic)}
                style={{ flex: 1, padding: '14px', background: 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
                ⚡ RETRY QUIZ
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!question) return null

  // ── QUIZ SCREEN ──
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title={`PARALLAX QUIZ — ${(selectedTopic || '').toUpperCase().replace(/-/g, ' ')}`} activeTab="Mass" />
        <div style={{ flex: 1, display: 'flex' }}>

          {/* QUIZ AREA */}
          <div style={{ flex: 1, padding: '40px', transition: 'max-width 0.3s ease' }}>

            {/* Progress + XP Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {questions.map((q, i) => (
                  <div key={i} style={{
                    width: 32, height: 6, borderRadius: 3,
                    background: i < currentQ ? 'var(--cyan)' : i === currentQ ? 'var(--cyan)' : 'var(--border)',
                    opacity: i === currentQ ? 1 : i < currentQ ? 0.6 : 0.3,
                    boxShadow: i === currentQ ? '0 0 8px var(--cyan-glow)' : 'none',
                  }} />
                ))}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 8 }}>
                  {currentQ + 1}/{questions.length}
                </span>
              </div>
              {/* XP timer only shows while answering */}
              {!submitted && <XPTimer timeElapsed={timeElapsed} difficulty={question.difficulty} />}
              {/* After submission show what was earned */}
              {submitted && (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 900, color: sawAnswer ? 'var(--purple)' : isCorrect ? 'var(--green)' : 'var(--red)' }}>
                  {sawAnswer ? '0 XP' : isCorrect ? `+${(question.difficulty === 'hard' ? 200 : question.difficulty === 'easy' ? 100 : 150) + Math.max(0, Math.round(500 * (1 - timeElapsed / 75)))} XP` : 'No XP'}
                </div>
              )}
            </div>

            {/* Question metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>
                QUANTUM CALCULATION {String(currentQ + 1).padStart(2, '0')}
              </div>
              <DifficultyBadge difficulty={question.difficulty} />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {question.concept}
              </div>
            </div>

            {/* Question card */}
            <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24, boxShadow: '0 0 40px var(--cyan-dim)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {question.question}
              </div>
            </div>

            {/* 2x2 answer grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {question.options.map((opt, i) => {
                let borderColor = 'var(--border-hi)'
                let bgColor = 'var(--bg-surface-hi)'
                let textColor = 'var(--text-primary)'
                if (submitted && sawAnswer && i === question.correct) {
                  borderColor = 'var(--purple)'; bgColor = 'var(--purple-dim)'; textColor = 'var(--purple)'
                } else if (submitted && !sawAnswer && i === question.correct) {
                  borderColor = 'var(--green)'; bgColor = 'rgba(0,255,136,0.1)'; textColor = 'var(--green)'
                } else if (submitted && selected === i && i !== question.correct) {
                  borderColor = 'var(--red)'; bgColor = 'rgba(255,0,68,0.1)'; textColor = 'var(--red)'
                } else if (selected === i && !submitted) {
                  borderColor = 'var(--cyan)'; bgColor = 'var(--cyan-dim)'; textColor = 'var(--cyan)'
                }
                return (
                  <button key={i}
                    onClick={() => !submitted && setSelected(i)}
                    disabled={submitted}
                    style={{
                      background: bgColor, border: `1px solid ${borderColor}`,
                      borderLeft: `3px solid ${borderColor}`,
                      borderRadius: 4, padding: '18px 20px',
                      cursor: submitted ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 14,
                      transition: 'var(--transition)', textAlign: 'left',
                    }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', minWidth: 20 }}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: textColor, flex: 1 }}>{opt}</span>
                    {submitted && sawAnswer && i === question.correct && <span style={{ color: 'var(--purple)' }}>👁</span>}
                    {submitted && !sawAnswer && i === question.correct && <span style={{ color: 'var(--green)' }}>✓</span>}
                    {submitted && !sawAnswer && selected === i && i !== question.correct && <span style={{ color: 'var(--red)' }}>✗</span>}
                  </button>
                )
              })}
            </div>

            {/* See answer button — appears at 75s */}
            {showSeeAnswer && !submitted && (
              <div style={{
                background: 'var(--purple-dim)', border: '1px solid var(--purple)',
                borderRadius: 4, padding: '14px 20px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', marginBottom: 2 }}>
                    Taking your time — good thinking!
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    You can reveal the answer, but you'll earn 0 XP.
                  </div>
                </div>
                <button
                  onClick={() => { setSawAnswer(true); setSubmitted(true) }}
                  style={{
                    padding: '10px 16px', background: 'var(--purple-dim)',
                    border: '1px solid var(--purple)', borderRadius: 4,
                    color: 'var(--purple)', fontSize: 12, fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                    marginLeft: 16, whiteSpace: 'nowrap',
                  }}>
                  SEE ANSWER
                </button>
              </div>
            )}

            {/* Result feedback */}
            {submitted && (
              <div style={{
                background: sawAnswer ? 'var(--purple-dim)' : isCorrect ? 'rgba(0,255,136,0.08)' : 'rgba(255,0,68,0.08)',
                border: `1px solid ${sawAnswer ? 'var(--purple)' : isCorrect ? 'var(--green)' : 'var(--red)'}`,
                borderRadius: 4, padding: '16px 20px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: sawAnswer ? 'var(--purple)' : isCorrect ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>
                  {sawAnswer ? '👁 Answer Revealed — 0 XP awarded' : isCorrect ? '🎯 Correct!' : '💡 Not quite'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {question.explanation}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleOpenDrawer}
                style={{
                  background: drawerOpen ? 'var(--purple-dim)' : 'transparent',
                  border: '1px solid var(--purple)', borderRadius: 4,
                  padding: '12px 24px', color: 'var(--purple)',
                  fontSize: 13, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                }}>
                🦉 {drawerOpen ? 'HIDE QUANTA' : 'ASK QUANTA'}
              </button>
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null}
                  style={{
                    background: selected !== null ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--border)',
                    border: 'none', borderRadius: 4, padding: '12px 32px',
                    color: selected !== null ? 'var(--bg-base)' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: 900, letterSpacing: 2,
                    fontFamily: 'JetBrains Mono, monospace',
                    cursor: selected !== null ? 'pointer' : 'not-allowed',
                    boxShadow: selected !== null ? '0 0 20px var(--cyan-glow)' : 'none',
                  }}>
                  SUBMIT ANSWER
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  style={{
                    background: 'var(--cyan)', border: 'none', borderRadius: 4,
                    padding: '12px 32px', color: 'var(--bg-base)',
                    fontSize: 13, fontWeight: 900, letterSpacing: 2,
                    fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                    boxShadow: '0 0 20px var(--cyan-glow)',
                  }}>
                  {currentQ + 1 >= questions.length ? 'FINISH SESSION →' : 'NEXT QUESTION →'}
                </button>
              )}
            </div>
          </div>

          {/* AI HINT DRAWER */}
          {drawerOpen && (
            <div style={{
              width: 360, borderLeft: '1px solid var(--border)',
              background: 'var(--bg-surface)', display: 'flex',
              flexDirection: 'column', padding: 28,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>Parallax AI</div>
                  <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
                    {hintLoading ? '● THINKING...' : '● READY FOR INQUIRY'}
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--purple-dim)', border: '2px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 0 16px var(--purple-glow)' }}>
                🦉
              </div>

              {/* Conversation */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 380 }}>
                {conversation.length === 0 && !hintLoading && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: 20 }}>
                    Ask me anything about this question ⚡
                  </div>
                )}
                {conversation.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%',
                      background: msg.role === 'user' ? 'var(--cyan-dim)' : 'var(--bg-surface-hi)',
                      border: `1px solid ${msg.role === 'user' ? 'var(--cyan)' : 'var(--border-hi)'}`,
                      borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      padding: '10px 14px', fontSize: 13,
                      color: 'var(--text-primary)', lineHeight: 1.6,
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {hintLoading && streamingText && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ maxWidth: '85%', background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {streamingText}<span style={{ color: 'var(--cyan)' }}>▋</span>
                    </div>
                  </div>
                )}
                {hintLoading && !streamingText && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Thinking across the cosmos...
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={followUp}
                    onChange={e => setFollowUp(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && followUp.trim() && !hintLoading) {
                        handleSendMessage(followUp.trim())
                        setFollowUp('')
                      }
                    }}
                    placeholder="Ask a follow-up..."
                    style={{
                      flex: 1, background: 'var(--bg-base)',
                      border: '1px solid var(--border-hi)',
                      borderRadius: 4, padding: '10px 14px',
                      color: 'var(--text-primary)', fontSize: 13,
                      fontFamily: 'DM Sans, sans-serif', outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      if (followUp.trim() && !hintLoading) {
                        handleSendMessage(followUp.trim())
                        setFollowUp('')
                      }
                    }}
                    disabled={!followUp.trim() || hintLoading}
                    style={{
                      background: followUp.trim() ? 'var(--cyan)' : 'var(--border)',
                      border: 'none', borderRadius: 4, width: 44,
                      cursor: followUp.trim() ? 'pointer' : 'not-allowed',
                      fontSize: 16, color: followUp.trim() ? 'var(--bg-base)' : 'var(--text-muted)',
                      fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    ▶
                  </button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 6, textAlign: 'center' }}>
                  Press Enter or ▶ to send
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes bossAppear {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>Loading...</div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
