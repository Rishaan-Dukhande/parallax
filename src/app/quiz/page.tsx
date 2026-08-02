'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

interface Question {
  question: string
  options: string[]
  correct: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  concept: string
}

const TOPICS = [
  { id: 'kinematics', label: 'Kinematics', icon: '🚀', color: 'var(--cyan)', simple: true },
  { id: 'newtons-laws', label: "Newton's Laws", icon: '⚡', color: 'var(--cyan)', simple: true },
  { id: 'work-energy', label: 'Work & Energy', icon: '🔋', color: 'var(--green)', simple: true },
  { id: 'momentum', label: 'Momentum', icon: '💥', color: 'var(--purple)', simple: false },
  { id: 'oscillations', label: 'Oscillations', icon: '〰️', color: 'var(--orange)', simple: false },
  { id: 'em-fields', label: 'E&M Fields', icon: '🌊', color: 'var(--red)', simple: false },
]

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = {
    easy: { color: 'var(--green)', label: 'EASY' },
    medium: { color: 'var(--orange)', label: 'MEDIUM' },
    hard: { color: 'var(--red)', label: 'HARD' },
  }[difficulty] || { color: 'var(--cyan)', label: 'STANDARD' }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${config.color}18`, border: `1px solid ${config.color}44`, borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 700, color: config.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
      {config.label}
    </div>
  )
}

function StreakIndicator({ streak, direction }: { streak: number; direction: 'up' | 'down' | 'none' }) {
  if (streak === 0) return null
  const color = direction === 'up' ? 'var(--green)' : 'var(--red)'
  const icon = direction === 'up' ? '🔥' : '💧'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
      {icon} {streak} {direction === 'up' ? 'correct' : 'wrong'} in a row
    </div>
  )
}

function QuizContent() {
  const masteryScore = 67

  // ── Session state ──
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionXP, setSessionXP] = useState(0)
  const [sessionCoins, setSessionCoins] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [showSessionEnd, setShowSessionEnd] = useState(false)

  // ── Question bank ──
  const [questionBank, setQuestionBank] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Per-question state ──
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  // ── Adaptive difficulty ──
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [correctStreak, setCorrectStreak] = useState(0)
  const [wrongStreak, setWrongStreak] = useState(0)
  const streakDirection = correctStreak >= 2 ? 'up' : wrongStreak >= 2 ? 'down' : 'none'
  const displayStreak = correctStreak >= 2 ? correctStreak : wrongStreak >= 2 ? wrongStreak : 0

  // ── Track questions asked to avoid repeats ──
  const askedQuestions = useRef<string[]>([])

  // ── AI Drawer ──
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatStreaming, setChatStreaming] = useState('')
  const lastQuestionSentRef = useRef('')

  const question = questionBank[currentQ]

  // ── Generate question batch ──
  const generateBatch = async (
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard',
    append = false
  ) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const topicConfig = TOPICS.find(t => t.id === topic)
      const res = await fetch('/api/quiz/infinite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          masteryScore,
          previousQuestions: askedQuestions.current,
          isSimpleTopic: topicConfig?.simple || false,
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      if (append) {
        setQuestionBank(prev => [...prev, ...data.questions])
      } else {
        setQuestionBank(data.questions)
        setCurrentQ(0)
        setSelected(null)
        setSubmitted(false)
        setShowExplanation(false)
        setSessionActive(true)
      }
    } catch (err) {
      setError('Failed to generate questions. Check your API key.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // ── Background refill — triggers when bank is running low ──
  useEffect(() => {
    if (!sessionActive || !selectedTopic) return
    const remaining = questionBank.length - currentQ
    if (remaining <= 3 && !loadingMore) {
      // Adjust difficulty based on streak
      let nextDifficulty = currentDifficulty
      if (correctStreak >= 3) {
        nextDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard'
        setCorrectStreak(0)
      } else if (wrongStreak >= 2) {
        nextDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy'
        setWrongStreak(0)
      }
      setCurrentDifficulty(nextDifficulty)
      generateBatch(selectedTopic, nextDifficulty, true)
    }
  }, [currentQ, questionBank.length, sessionActive])

  // ── Handle answer submission ──
  const handleSubmit = () => {
    if (selected === null || !question) return
    setSubmitted(true)
    setShowExplanation(true)

    const isCorrect = selected === question.correct
    const xpEarned = question.difficulty === 'hard' ? 150
      : question.difficulty === 'medium' ? 100
      : 60

    if (isCorrect) {
      setSessionXP(xp => xp + xpEarned)
      setSessionCoins(c => c + Math.floor(xpEarned / 3))
      setSessionCorrect(c => c + 1)
      setCorrectStreak(s => s + 1)
      setWrongStreak(0)
    } else {
      setCorrectStreak(0)
      setWrongStreak(s => s + 1)
    }
    setSessionTotal(t => t + 1)
    askedQuestions.current.push(question.question)

    // Tell AI what was answered
    if (drawerOpen) {
      const msg = isCorrect
        ? `I just answered "${question.options[selected]}" and got it correct! Can you explain why that's right and go deeper?`
        : `I answered "${question.options[selected]}" but got it wrong. The question was: "${question.question}". Can you explain why I was wrong?`
      sendChatMessage(msg, true)
    }
  }

  // ── Move to next question ──
  const handleNext = () => {
    setCurrentQ(q => q + 1)
    setSelected(null)
    setSubmitted(false)
    setShowExplanation(false)
    setConversation([])
    lastQuestionSentRef.current = ''
  }

  // ── End session and save to Supabase ──
  const handleEndSession = async () => {
    setShowSessionEnd(true)
    if (sessionXP > 0) {
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'quiz',
            topic: selectedTopic,
            score: sessionCorrect,
            totalQuestions: sessionTotal,
            xpEarned: sessionXP,
            masteryDelta: sessionCorrect - (sessionTotal - sessionCorrect),
            newMastery: Math.min(100, Math.max(0, masteryScore + Math.floor((sessionCorrect / Math.max(sessionTotal, 1) - 0.5) * 10))),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          if (!result.error) {
            window.dispatchEvent(new CustomEvent('progress-updated', { detail: result }))
          }
        }
      } catch (err) {
        console.error('Failed to save session:', err)
      }
    }
  }

  // ── AI Chat ──
  const sendChatMessage = async (text: string, isAuto = false) => {
    const newConv = [...conversation, { role: 'user' as const, content: text }]
    setConversation(newConv)
    setChatLoading(true)
    setChatStreaming('')
    try {
      const res = await fetch('/api/quiz/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newConv,
          questionContext: {
            question: question?.question || '',
            concept: question?.concept || '',
            difficulty: question?.difficulty || 'medium',
            questionNumber: currentQ + 1,
            totalQuestions: questionBank.length,
          },
          masteryScore,
          correctCount: sessionCorrect,
          totalCount: sessionTotal,
          submitted,
          isCorrect: submitted && selected === question?.correct,
        }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value)
          setChatStreaming(full)
        }
      }
      setConversation(prev => [...prev, { role: 'assistant' as const, content: full }])
      setChatStreaming('')
    } catch {
      setConversation(prev => [...prev, { role: 'assistant' as const, content: 'Lost signal. Try again! ⚡' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleOpenDrawer = () => {
    setDrawerOpen(true)
    if (conversation.length === 0 && question && !lastQuestionSentRef.current) {
      lastQuestionSentRef.current = question.question
      const intro = submitted
        ? `I just answered a question: "${question.question}". My answer was "${selected !== null ? question.options[selected] : 'unknown'}". Can you help me understand ${selected === question.correct ? 'why this is correct more deeply?' : 'why I got this wrong?'}`
        : `I need help with this question: "${question.question}". Please give me a Socratic hint without revealing the answer.`
      sendChatMessage(intro, true)
    }
  }

  // ── TOPIC SELECTION ──
  if (!sessionActive && !loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar title="QUICK QUIZ — INFINITE MODE" activeTab="Mass" />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '60px 40px' }}>
            <div style={{ width: '100%', maxWidth: 700 }}>

              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 8 }}>ALCUMUS-STYLE INFINITE DRILL</div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>Choose Your Battle</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  Questions never end. Difficulty adapts to your streak.
                  Full explanations after every answer. Stop whenever you want — your XP is saved.
                </p>
              </div>

              {error && (
                <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 4, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Topic grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 32 }}>
                {TOPICS.map(topic => (
                  <button key={topic.id}
                    onClick={() => setSelectedTopic(topic.id === selectedTopic ? null : topic.id)}
                    style={{ background: selectedTopic === topic.id ? `${topic.color}18` : 'var(--bg-surface)', border: `1px solid ${selectedTopic === topic.id ? topic.color : 'var(--border)'}`, borderRadius: 8, padding: '20px', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)', boxShadow: selectedTopic === topic.id ? `0 0 16px ${topic.color}33` : 'none' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{topic.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: selectedTopic === topic.id ? topic.color : 'var(--text-primary)', marginBottom: 4 }}>{topic.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {topic.simple ? '15 questions pre-loaded' : '10 questions pre-loaded'} · infinite refill
                    </div>
                  </button>
                ))}
              </div>

              {/* Difficulty selector */}
              {selectedTopic && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 12 }}>STARTING DIFFICULTY</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button key={d} onClick={() => setCurrentDifficulty(d)}
                        style={{ flex: 1, padding: '10px', background: currentDifficulty === d ? (d === 'easy' ? 'rgba(0,255,136,0.1)' : d === 'medium' ? 'rgba(255,107,43,0.1)' : 'rgba(255,0,68,0.1)') : 'var(--bg-surface)', border: `1px solid ${currentDifficulty === d ? (d === 'easy' ? 'var(--green)' : d === 'medium' ? 'var(--orange)' : 'var(--red)') : 'var(--border)'}`, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: currentDifficulty === d ? (d === 'easy' ? 'var(--green)' : d === 'medium' ? 'var(--orange)' : 'var(--red)') : 'var(--text-muted)', letterSpacing: 1 }}>
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 12 }}>HOW IT WORKS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '🔥', text: '3 correct in a row → difficulty increases' },
                    { icon: '💧', text: '2 wrong in a row → difficulty decreases' },
                    { icon: '📖', text: 'Full explanation shown after every answer' },
                    { icon: '💾', text: 'XP and coins saved when you end the session' },
                    { icon: '🦉', text: 'Ask Parallax AI for help on any question' },
                  ].map(item => (
                    <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => selectedTopic && generateBatch(selectedTopic, currentDifficulty)}
                disabled={!selectedTopic}
                style={{ width: '100%', padding: '16px', background: selectedTopic ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--border)', border: 'none', borderRadius: 4, color: selectedTopic ? 'var(--bg-base)' : 'var(--text-muted)', fontSize: 15, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: selectedTopic ? 'pointer' : 'not-allowed', boxShadow: selectedTopic ? '0 0 20px var(--cyan-glow)' : 'none', transition: 'var(--transition)' }}>
                {selectedTopic ? `⚡ START INFINITE ${TOPICS.find(t => t.id === selectedTopic)?.label.toUpperCase()} DRILL` : 'SELECT A TOPIC FIRST'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 48 }}>⚡</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', fontSize: 13, letterSpacing: 2 }}>GENERATING YOUR QUESTION BANK...</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Pre-loading {TOPICS.find(t => t.id === selectedTopic)?.simple ? '15' : '10'} questions at {currentDifficulty} difficulty
          </div>
        </main>
      </div>
    )
  }

  // ── SESSION END ──
  if (showSessionEnd) {
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 520, width: '100%', padding: '0 40px' }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>
              {accuracy >= 80 ? '🌟' : accuracy >= 60 ? '✅' : '💡'}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>Session Complete!</h1>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
              {sessionCorrect} / {sessionTotal} correct · {TOPICS.find(t => t.id === selectedTopic)?.label}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
              {[
                { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 80 ? 'var(--green)' : accuracy >= 60 ? 'var(--cyan)' : 'var(--orange)' },
                { label: 'XP Earned', value: `+${sessionXP}`, color: 'var(--cyan)' },
                { label: 'Coins', value: `+${sessionCoins}`, color: '#FFD700' },
              ].map(card => (
                <div key={card.label} className="glass-card" style={{ padding: '20px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{card.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setSessionActive(false); setSelectedTopic(null); setShowSessionEnd(false); setSessionXP(0); setSessionCoins(0); setSessionCorrect(0); setSessionTotal(0); setQuestionBank([]); askedQuestions.current = [] }}
                style={{ flex: 1, padding: '14px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                ← NEW TOPIC
              </button>
              <button onClick={() => { setShowSessionEnd(false); setSessionXP(0); setSessionCoins(0); setSessionCorrect(0); setSessionTotal(0); askedQuestions.current = []; generateBatch(selectedTopic!, currentDifficulty) }}
                style={{ flex: 1, padding: '14px', background: 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
                ⚡ NEW SESSION
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!question) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>⚡</div>
          <div style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>Loading next question...</div>
        </main>
      </div>
    )
  }

  const isCorrect = submitted && selected === question.correct
  const topicColor = TOPICS.find(t => t.id === selectedTopic)?.color || 'var(--cyan)'

  // ── QUIZ SCREEN ──
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title={`${TOPICS.find(t => t.id === selectedTopic)?.label.toUpperCase()} — INFINITE DRILL`} activeTab="Mass" />

        <div style={{ flex: 1, display: 'flex' }}>

          {/* QUIZ AREA */}
          <div style={{ flex: 1, padding: '32px 40px', maxWidth: drawerOpen ? 'calc(100% - 360px)' : '100%', transition: 'max-width 0.3s ease' }}>

            {/* Session stats bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>SESSION XP</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>+{sessionXP}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>ACCURACY</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: sessionTotal > 0 && sessionCorrect / sessionTotal >= 0.7 ? 'var(--green)' : 'var(--orange)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {sessionTotal > 0 ? `${Math.round(sessionCorrect / sessionTotal * 100)}%` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>ANSWERED</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{sessionTotal}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StreakIndicator streak={displayStreak} direction={streakDirection} />
                <DifficultyBadge difficulty={currentDifficulty} />
                {loadingMore && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>↻ loading more...</div>}
              </div>
            </div>

            {/* Question metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: topicColor, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>
                Q{sessionTotal + (submitted ? 0 : 1)}
              </div>
              <DifficultyBadge difficulty={question.difficulty} />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {question.concept}
              </div>
            </div>

            {/* Question card */}
            <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24, boxShadow: `0 0 30px ${topicColor}22` }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {question.question}
              </div>
            </div>

            {/* 2x2 answer grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {question.options.map((opt, i) => {
                let borderColor = 'var(--border-hi)', bgColor = 'var(--bg-surface-hi)', textColor = 'var(--text-primary)'
                if (submitted && i === question.correct) { borderColor = 'var(--green)'; bgColor = 'rgba(0,255,136,0.1)'; textColor = 'var(--green)' }
                else if (submitted && selected === i && i !== question.correct) { borderColor = 'var(--red)'; bgColor = 'rgba(255,0,68,0.1)'; textColor = 'var(--red)' }
                else if (selected === i && !submitted) { borderColor = topicColor; bgColor = `${topicColor}18`; textColor = topicColor }
                return (
                  <button key={i} onClick={() => !submitted && setSelected(i)} disabled={submitted}
                    style={{ background: bgColor, border: `1px solid ${borderColor}`, borderLeft: `3px solid ${borderColor}`, borderRadius: 4, padding: '16px 18px', cursor: submitted ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'var(--transition)', textAlign: 'left' }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', minWidth: 20 }}>{['A', 'B', 'C', 'D'][i]}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: textColor, flex: 1 }}>{opt}</span>
                    {submitted && i === question.correct && <span style={{ color: 'var(--green)' }}>✓</span>}
                    {submitted && selected === i && i !== question.correct && <span style={{ color: 'var(--red)' }}>✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Explanation — always shown after submit */}
            {submitted && showExplanation && (
              <div style={{ background: isCorrect ? 'rgba(0,255,136,0.06)' : 'rgba(255,0,68,0.06)', border: `1px solid ${isCorrect ? 'var(--green)' : 'var(--red)'}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isCorrect ? 'var(--green)' : 'var(--red)', marginBottom: 8 }}>
                  {isCorrect ? `🎯 Correct! +${question.difficulty === 'hard' ? 150 : question.difficulty === 'medium' ? 100 : 60} XP` : `💡 Not quite — the correct answer was: "${question.options[question.correct]}"`}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {question.explanation}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleOpenDrawer}
                  style={{ background: drawerOpen ? 'var(--purple-dim)' : 'transparent', border: '1px solid var(--purple)', borderRadius: 4, padding: '11px 20px', color: 'var(--purple)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                  🦉 {drawerOpen ? 'HIDE AI' : 'ASK PARALLAX'}
                </button>
                <button onClick={handleEndSession}
                  style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, padding: '11px 20px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                  END SESSION
                </button>
              </div>

              {!submitted ? (
                <button onClick={handleSubmit} disabled={selected === null}
                  style={{ background: selected !== null ? `linear-gradient(135deg, ${topicColor}, var(--purple))` : 'var(--border)', border: 'none', borderRadius: 4, padding: '12px 32px', color: selected !== null ? 'var(--bg-base)' : 'var(--text-muted)', fontSize: 13, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: selected !== null ? 'pointer' : 'not-allowed', boxShadow: selected !== null ? `0 0 20px ${topicColor}44` : 'none' }}>
                  SUBMIT ANSWER
                </button>
              ) : (
                <button onClick={handleNext}
                  style={{ background: 'var(--cyan)', border: 'none', borderRadius: 4, padding: '12px 32px', color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
                  NEXT QUESTION →
                </button>
              )}
            </div>
          </div>

          {/* AI DRAWER */}
          {drawerOpen && (
            <div className="ai-drawer" style={{ width: 360, borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--purple-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🦉</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)' }}>Parallax AI</div>
                    <div style={{ fontSize: 9, color: chatLoading ? 'var(--orange)' : submitted ? 'var(--green)' : 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
                      {chatLoading ? '● THINKING...' : submitted ? '● LEARNING MODE' : '● SOCRATIC MODE'}
                    </div>
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {conversation.length === 0 && !chatLoading && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: 20 }}>
                    Ask me anything about this question ⚡
                  </div>
                )}
                {conversation.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '88%', background: msg.role === 'user' ? 'var(--cyan-dim)' : 'var(--bg-surface-hi)', border: `1px solid ${msg.role === 'user' ? 'var(--cyan)' : 'var(--border-hi)'}`, borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && chatStreaming && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ maxWidth: '88%', background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                      {chatStreaming}<span style={{ color: 'var(--purple)' }}>▋</span>
                    </div>
                  </div>
                )}
                {chatLoading && !chatStreaming && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim() && !chatLoading) { sendChatMessage(chatInput.trim()); setChatInput('') } }}
                    placeholder={submitted ? 'Ask anything...' : 'Ask for a hint...'}
                    style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-hi)', borderRadius: 4, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 16, outline: 'none' }} />
                  <button onClick={() => { if (chatInput.trim() && !chatLoading) { sendChatMessage(chatInput.trim()); setChatInput('') } }}
                    disabled={!chatInput.trim() || chatLoading}
                    style={{ background: chatInput.trim() ? 'var(--purple)' : 'var(--border)', border: 'none', borderRadius: 4, width: 44, cursor: chatInput.trim() ? 'pointer' : 'not-allowed', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
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
