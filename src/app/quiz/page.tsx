'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Question {
  id: number
  question: string
  options: string[]
  correct: number
  explanation: string
  concept: string
  difficulty: 'easy' | 'medium' | 'hard'
}

// ─────────────────────────────────────────────
// TOPIC SELECTOR
// Lets user pick which unit to be quizzed on
// ─────────────────────────────────────────────
const TOPICS = [
  { id: 'kinematics', label: 'Kinematics', icon: '🚀', color: 'var(--cyan)' },
  { id: 'newtons-laws', label: "Newton's Laws", icon: '⚡', color: 'var(--cyan)' },
  { id: 'work-energy', label: 'Work & Energy', icon: '🔋', color: 'var(--green)' },
  { id: 'momentum', label: 'Momentum', icon: '💥', color: 'var(--purple)' },
  { id: 'oscillations', label: 'Oscillations', icon: '〰️', color: 'var(--orange)' },
  { id: 'em-fields', label: 'E&M Fields', icon: '⚡', color: 'var(--red)' },
]

// ─────────────────────────────────────────────
// TIMER RING COMPONENT
// ─────────────────────────────────────────────
function TimerRing({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const progress = timeLeft / totalTime
  const color = timeLeft > 20
    ? 'var(--cyan)'
    : timeLeft > 10
    ? 'var(--orange)'
    : 'var(--red)'

  return (
    <div style={{ position: 'relative', width: 52, height: 52 }}>
      <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r={radius} fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle cx="26" cy="26" r={radius} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {timeLeft}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// DIFFICULTY BADGE
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// MAIN QUIZ COMPONENT
// ─────────────────────────────────────────────
function QuizContent() {
  const [masteryScore, setMasteryScore] = useState(67)

  // ── Quiz setup state ──
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)

  // ── Questions state ──
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ── Per-question state ──
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)

  // ── Session tracking ──
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState<string[]>([])  // concepts missed
  const [correctCount, setCorrectCount] = useState(0)
  const [showResult, setShowResult] = useState(false)

  // ── AI Hint state ──
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [conversation, setConversation] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')

  const question = questions[currentQ]

  // ─────────────────────────────────────────────
  // FETCH QUESTIONS from Claude API
  // ─────────────────────────────────────────────
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
      setTimeLeft(45)
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

  // ─────────────────────────────────────────────
  // SEND MESSAGE to Claude chat API with streaming
  // Maintains full conversation history (Khanmigo pattern)
  // ─────────────────────────────────────────────
  const handleSendMessage = async (userMessage: string) => {
    if (hintLoading || !question) return
    const newConversation = [
      ...conversation,
      { role: 'user' as const, content: userMessage }
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
          },
          masteryScore,
          correctCount,
          totalCount: questions.length,
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
        { role: 'assistant' as const, content: fullResponse }
      ])
      setStreamingText('')
    } catch (err) {
      setConversation(prev => [
        ...prev,
        { role: 'assistant' as const, content: 'Sorry Navigator, lost signal for a moment. Try again! ⚡' }
      ])
    } finally {
      setHintLoading(false)
    }
  }

  // Open drawer and send an initial hint request automatically
  const handleOpenDrawer = () => {
    setDrawerOpen(true)
    if (conversation.length === 0 && !hintLoading) {
      handleSendMessage('Give me a hint for this question')
    }
  }

  // ─────────────────────────────────────────────
  // TIMER
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!quizStarted || submitted || showResult || !question) return
    if (timeLeft <= 0) {
      setSubmitted(true)
      return
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, submitted, showResult, quizStarted, question])

  // ─────────────────────────────────────────────
  // SUBMIT ANSWER
  // Tracks correct/wrong and records missed concepts
  // ─────────────────────────────────────────────
  const handleSubmit = () => {
    setSubmitted(true)
    const isCorrect = selected === question.correct
    if (isCorrect) {
      setScore(s => s + 120)
      setCorrectCount(c => {
        const newCount = c + 1
        setMasteryScore(prev => Math.min(100, Math.round(prev + (100 - prev) * 0.05)))
        return newCount
      })
    } else {
      setMistakes(prev => [...new Set([...prev, question.concept])])
      setMasteryScore(prev => Math.max(0, Math.round(prev - prev * 0.03)))
    }
  }

  // ─────────────────────────────────────────────
  // NEXT QUESTION
  // ─────────────────────────────────────────────
  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setShowResult(true)
    } else {
      setCurrentQ(q => q + 1)
      setSelected(null)
      setSubmitted(false)
      setTimeLeft(45)
      setDrawerOpen(false)
      setConversation([])
      setStreamingText('')
      setFollowUp('')
    }
  }

  const isCorrect = submitted && selected === question?.correct

  // ─────────────────────────────────────────────
  // TOPIC SELECTION SCREEN
  // ─────────────────────────────────────────────
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
                  Parallax AI will generate 5 questions tailored to your mastery level ({masteryScore}/100).
                  Questions adapt based on your performance in real time.
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
                      borderRadius: 8, padding: '20px 20px',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'var(--transition)',
                      boxShadow: selectedTopic === topic.id ? `0 0 16px ${topic.color}33` : 'none',
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{topic.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: selectedTopic === topic.id ? topic.color : 'var(--text-primary)', marginBottom: 4 }}>
                      {topic.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      5 adaptive questions
                    </div>
                  </button>
                ))}
              </div>

              {/* Mastery indicator */}
              <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 6 }}>YOUR CURRENT MASTERY</div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                    <div style={{ width: `${masteryScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: 3, boxShadow: '0 0 8px var(--cyan-glow)' }} />
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
                  background: selectedTopic
                    ? 'linear-gradient(135deg, var(--cyan), var(--purple))'
                    : 'var(--border)',
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

  // ─────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 48, animation: 'pulse-glow 1s ease-in-out infinite' }}>⚡</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', fontSize: 13, letterSpacing: 2 }}>
            PARALLAX AI IS GENERATING YOUR QUIZ...
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Calibrating difficulty to mastery score {masteryScore}/100
          </div>
        </main>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // RESULTS SCREEN
  // ─────────────────────────────────────────────
  if (showResult) {
    const percentage = Math.round((correctCount / questions.length) * 100)
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
            <div style={{ fontSize: 72, marginBottom: 20, animation: 'bossAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
              {percentage >= 80 ? '🌟' : percentage >= 60 ? '✅' : '💡'}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
              {percentage >= 80 ? 'Outstanding, Navigator!' : percentage >= 60 ? 'Good Work!' : 'Keep Pushing!'}
            </h1>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
              {correctCount} / {questions.length} correct · {selectedTopic && TOPICS.find(t => t.id === selectedTopic)?.label}
            </div>

            {/* Score cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Score', value: `${percentage}%`, color: percentage >= 80 ? 'var(--green)' : percentage >= 60 ? 'var(--cyan)' : 'var(--orange)' },
                { label: 'XP Earned', value: `+${correctCount * 120}`, color: 'var(--cyan)' },
                { label: 'Streak', value: '🔥 14', color: 'var(--orange)' },
              ].map(card => (
                <div key={card.label} className="glass-card" style={{ padding: '20px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Missed concepts */}
            {mistakes.length > 0 && (
              <div style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid var(--orange)', borderRadius: 4, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 10 }}>
                  ⚡ CONCEPTS TO REVIEW
                </div>
                {mistakes.map(concept => (
                  <div key={concept} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{concept}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setQuizStarted(false); setSelectedTopic(null); setMistakes([]) }}
                style={{ flex: 1, padding: '14px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                ← NEW TOPIC
              </button>
              <button
                onClick={() => selectedTopic && generateQuiz(selectedTopic)}
                style={{ flex: 1, padding: '14px', background: 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
                ⚡ RETRY QUIZ
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // QUIZ SCREEN
  // ─────────────────────────────────────────────
  if (!question) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title={`PARALLAX QUIZ — ${(selectedTopic || '').toUpperCase().replace('-', "'S ").replace('-', ' & ')}`} activeTab="Mass" />

        <div style={{ flex: 1, display: 'flex' }}>

          {/* ── QUIZ AREA ── */}
          <div style={{ flex: 1, padding: '40px', maxWidth: drawerOpen ? 'calc(100% - 360px)' : '100%', transition: 'max-width 0.3s ease' }}>

            {/* Progress + timer */}
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
              <TimerRing timeLeft={timeLeft} totalTime={45} />
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

                if (submitted && i === question.correct) {
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
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
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
                    {submitted && i === question.correct && <span style={{ color: 'var(--green)' }}>✓</span>}
                    {submitted && selected === i && i !== question.correct && <span style={{ color: 'var(--red)' }}>✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Explanation after submit */}
            {submitted && (
              <div style={{
                background: isCorrect ? 'rgba(0,255,136,0.08)' : 'rgba(255,0,68,0.08)',
                border: `1px solid ${isCorrect ? 'var(--green)' : 'var(--red)'}`,
                borderRadius: 4, padding: '16px 20px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isCorrect ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>
                  {isCorrect ? '🎯 Correct!' : '💡 Not quite'}
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
                    background: selected !== null
                      ? 'linear-gradient(135deg, var(--cyan), var(--purple))'
                      : 'var(--border)',
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

          {/* ── AI HINT DRAWER ── */}
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

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 400 }}>
                {conversation.length === 0 && !hintLoading && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: 20 }}>
                    Ask me anything about this question ⚡
                  </div>
                )}
                {conversation.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ maxWidth: '85%', background: msg.role === 'user' ? 'var(--cyan-dim)' : 'var(--bg-surface-hi)', border: `1px solid ${msg.role === 'user' ? 'var(--cyan)' : 'var(--border-hi)'}`, borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {hintLoading && streamingText && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ maxWidth: '85%', background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {streamingText}<span style={{ animation: 'pulse-glow 0.8s infinite', color: 'var(--cyan)' }}>▋</span>
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
                    style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-hi)', borderRadius: 4, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                  />
                  <button
                    onClick={() => {
                      if (followUp.trim() && !hintLoading) {
                        handleSendMessage(followUp.trim())
                        setFollowUp('')
                      }
                    }}
                    disabled={!followUp.trim() || hintLoading}
                    style={{ background: followUp.trim() ? 'var(--cyan)' : 'var(--border)', border: 'none', borderRadius: 4, width: 44, cursor: followUp.trim() ? 'pointer' : 'not-allowed', fontSize: 16, color: followUp.trim() ? 'var(--bg-base)' : 'var(--text-muted)', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      `}</style>
    </div>
  )
}

// Wrap in Suspense because useSearchParams requires it
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
