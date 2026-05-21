'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

interface Checkpoint {
  question: string
  options: string[]
  correct: number
  hint: string
}

interface LessonContent {
  meta: { unitName: string; lessonName: string }
  messages: string[]
  checkpoints: Checkpoint[]
  diagramType: string
}

type Phase = 'loading' | 'intro' | 'diagram' | 'checkpoint' | 'review' | 'complete'
type LearningStyle = 'intuitive' | 'visual' | 'mathematical'

// ─────────────────────────────────────────────
// STAR DISPLAY COMPONENT
// Shows 0-3 filled stars based on score
// ─────────────────────────────────────────────
function StarDisplay({ count, total = 3, size = 24 }: { count: number; total?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          fontSize: size,
          filter: i < count ? 'drop-shadow(0 0 6px #FFD700)' : 'grayscale(1) opacity(0.3)',
          transition: 'filter 0.3s ease',
          animation: i < count ? `starPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.15}s both` : 'none',
        }}>⭐</span>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// COINS DISPLAY
// ─────────────────────────────────────────────
function CoinsEarned({ amount }: { amount: number }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.4)',
      borderRadius: 20, padding: '4px 14px',
      animation: 'bossAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both',
    }}>
      <span style={{ fontSize: 16 }}>🪙</span>
      <span style={{ fontSize: 14, fontWeight: 900, color: '#FFD700', fontFamily: 'JetBrains Mono, monospace' }}>+{amount}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>COINS</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// DIAGRAMS (same as before, kept compact)
// ─────────────────────────────────────────────
function MotionDiagram() {
  const [ballX, setBallX] = useState(10)
  const [running, setRunning] = useState(false)
  const animRef = useRef<number>()
  useEffect(() => {
    if (running) {
      const animate = () => {
        setBallX(x => {
          if (x >= 85) { setRunning(false); return 85 }
          animRef.current = requestAnimationFrame(animate)
          return x + 0.4
        })
      }
      animRef.current = requestAnimationFrame(animate)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [running])
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>INTERACTIVE — CLICK ANIMATE</div>
      <svg viewBox="0 0 100 40" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
        <line x1="5" y1="30" x2="95" y2="30" stroke="#1A1D35" strokeWidth="0.5" />
        <text x="8" y="36" fontSize="3" fill="#6B7299" fontFamily="monospace">A</text>
        <circle cx="10" cy="30" r="0.8" fill="#00F0FF" />
        <text x="83" y="36" fontSize="3" fill="#6B7299" fontFamily="monospace">B</text>
        <circle cx="85" cy="30" r="0.8" fill="#00F0FF" />
        <circle cx={ballX} cy="25" r="4" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.5" />
        <text x={ballX} y="25.8" textAnchor="middle" fontSize="4">🚗</text>
        {ballX > 15 && (
          <>
            <line x1="10" y1="18" x2={ballX - 2} y2="18" stroke="#9B5DFF" strokeWidth="0.4" markerEnd="url(#arrow)" />
            <text x={(10 + ballX) / 2} y="16" textAnchor="middle" fontSize="2.5" fill="#9B5DFF" fontFamily="monospace">Δx = {(ballX - 10).toFixed(0)} units</text>
          </>
        )}
        <defs><marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#9B5DFF" /></marker></defs>
      </svg>
      <button onClick={() => { setBallX(10); setTimeout(() => setRunning(true), 100) }} style={{ marginTop: 10, padding: '8px 20px', background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 4, color: 'var(--cyan)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>▶ ANIMATE</button>
    </div>
  )
}

function ForceDiagram() {
  const [selected, setSelected] = useState<string | null>(null)
  const forces = [
    { id: 'gravity', label: 'Gravity', x: 50, y: 28, dx: 0, dy: 12, color: '#FF6B2B', desc: "⬇ Gravity pulls toward Earth's center. Always mg downward." },
    { id: 'normal', label: 'Normal', x: 50, y: 28, dx: 0, dy: -12, color: '#00F0FF', desc: '⬆ Normal force: surface pushes back perpendicular to surface.' },
    { id: 'push', label: 'Applied', x: 50, y: 28, dx: 14, dy: 0, color: '#9B5DFF', desc: '➡ Applied force from external source. Any direction.' },
    { id: 'friction', label: 'Friction', x: 50, y: 28, dx: -10, dy: 0, color: '#FF0044', desc: '⬅ Friction opposes motion direction.' },
  ]
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>TAP A FORCE VECTOR</div>
      <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
        <line x1="10" y1="40" x2="90" y2="40" stroke="#1A1D35" strokeWidth="0.5" />
        <rect x="40" y="20" width="20" height="16" fill="#00F0FF11" stroke="#00F0FF" strokeWidth="0.5" rx="1" />
        <text x="50" y="29.5" textAnchor="middle" fontSize="3.5" fill="#E8EEFF">📦</text>
        <defs>{forces.map(f => <marker key={f.id} id={`arr-${f.id}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill={f.color} /></marker>)}</defs>
        {forces.map(f => (
          <g key={f.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(f.id === selected ? null : f.id)}>
            <line x1={f.x} y1={f.y} x2={f.x + f.dx} y2={f.y + f.dy} stroke={f.color} strokeWidth={selected === f.id ? 1.2 : 0.7} markerEnd={`url(#arr-${f.id})`} strokeOpacity={selected && selected !== f.id ? 0.3 : 1} />
            <text x={f.x + f.dx * 1.3} y={f.y + f.dy * 1.3 + 1} textAnchor="middle" fontSize="2.5" fill={f.color} fontFamily="monospace" fillOpacity={selected && selected !== f.id ? 0.3 : 1}>{f.label}</text>
          </g>
        ))}
      </svg>
      {selected && <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-surface-hi)', border: `1px solid ${forces.find(f => f.id === selected)?.color}55`, borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{forces.find(f => f.id === selected)?.desc}</div>}
    </div>
  )
}

function WorkDiagram() {
  const [angle, setAngle] = useState(0)
  const rad = (angle * Math.PI) / 180
  const work = Math.cos(rad).toFixed(2)
  const forceX = 15 * Math.cos(rad), forceY = -15 * Math.sin(rad)
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>DRAG ANGLE — WATCH WORK CHANGE</div>
      <svg viewBox="0 0 100 50" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
        <line x1="10" y1="38" x2="90" y2="38" stroke="#1A1D35" strokeWidth="0.5" />
        <rect x="20" y="26" width="16" height="12" fill="#00F0FF11" stroke="#00F0FF" strokeWidth="0.5" rx="1" />
        <text x="28" y="33.5" textAnchor="middle" fontSize="4">📦</text>
        <line x1="28" y1="32" x2={28 + forceX} y2={32 + forceY} stroke="#9B5DFF" strokeWidth="1" markerEnd="url(#warrow)" />
        <defs><marker id="warrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#9B5DFF" /></marker></defs>
        <text x="75" y="20" textAnchor="middle" fontSize="3.5" fill="#00FF88" fontFamily="monospace" fontWeight="bold">W = {work} × F × d</text>
        <text x="75" y="26" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">cos({angle}°) = {work}</text>
        {Number(work) === 0 && <text x="75" y="34" textAnchor="middle" fontSize="2.8" fill="#FF0044" fontFamily="monospace">ZERO WORK!</text>}
      </svg>
      <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
        <span>0° (max work)</span><span>90° (zero work)</span>
      </div>
    </div>
  )
}

function GenericDiagram({ lessonName }: { lessonName: string }) {
  return (
    <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
      <circle cx="50" cy="30" r="18" fill="#00F0FF11" stroke="#00F0FF" strokeWidth="0.5" />
      <text x="50" y="27" textAnchor="middle" fontSize="3.2" fill="#E8EEFF" fontFamily="monospace" fontWeight="bold">{lessonName}</text>
      <text x="50" y="33" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">Explore above</text>
    </svg>
  )
}

const DIAGRAMS: Record<string, React.FC<{ lessonName: string }>> = {
  motion: () => <MotionDiagram />,
  force: () => <ForceDiagram />,
  work: () => <WorkDiagram />,
  generic: GenericDiagram,
  momentum: GenericDiagram,
  energy: GenericDiagram,
  velocity: GenericDiagram,
}

// ─────────────────────────────────────────────
// AI REVIEW POPUP
// Auto-appears when student scores 0 or 1
// Uses same chat API as quiz, but in lesson mode
// ─────────────────────────────────────────────
function AIReviewPopup({
  lessonName,
  missedCheckpoints,
  onClose,
  onRetry,
}: {
  lessonName: string
  missedCheckpoints: string[]
  onClose: () => void
  onRetry: () => void
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')

  // Auto-send explanation request on mount
  useEffect(() => {
    sendMessage(`I just completed the lesson on "${lessonName}" but I'm struggling. I got these questions wrong: ${missedCheckpoints.join('; ')}. Can you explain what I'm missing?`)
  }, [])

  const sendMessage = async (text: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(newMessages)
    setLoading(true)
    setStreaming('')
    try {
      const res = await fetch('/api/quiz/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          questionContext: {
            question: `Lesson: ${lessonName}`,
            concept: lessonName,
            difficulty: 'medium',
            questionNumber: 1,
            totalQuestions: 1,
          },
          masteryScore: 50,
          correctCount: 0,
          totalCount: missedCheckpoints.length,
          // Key: submitted=true means AI can fully explain
          // This is the post-answer phase — full explanations allowed
          submitted: true,
          isCorrect: false,
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
          setStreaming(full)
        }
      }
      setMessages(prev => [...prev, { role: 'assistant' as const, content: full }])
      setStreaming('')
    } catch {
      setMessages(prev => [...prev, { role: 'assistant' as const, content: 'Lost signal — but keep going! You can retry the lesson. ⚡' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'var(--bg-surface)', border: '1px solid var(--purple)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 0 60px var(--purple-glow)',
        animation: 'bossAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--purple-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🦉</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>Parallax AI — Review Session</div>
              <div style={{ fontSize: 10, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
                {loading ? '● EXPLAINING...' : '● READY TO HELP'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* Chat area */}
        <div style={{ height: 320, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '88%',
                background: msg.role === 'user' ? 'var(--purple-dim)' : 'var(--bg-surface-hi)',
                border: `1px solid ${msg.role === 'user' ? 'var(--purple)' : 'var(--border-hi)'}`,
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                padding: '10px 14px', fontSize: 13,
                color: 'var(--text-primary)', lineHeight: 1.7,
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && streaming && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ maxWidth: '88%', background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                {streaming}<span style={{ color: 'var(--purple)' }}>▋</span>
              </div>
            </div>
          )}
          {loading && !streaming && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Parallax AI is thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && input.trim() && !loading) {
                sendMessage(input.trim())
                setInput('')
              }
            }}
            placeholder="Ask a follow-up question..."
            style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-hi)', borderRadius: 4, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={() => { if (input.trim() && !loading) { sendMessage(input.trim()); setInput('') } }}
            style={{ background: 'var(--purple)', border: 'none', borderRadius: 4, width: 44, cursor: 'pointer', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ▶
          </button>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
            CLOSE
          </button>
          <button onClick={onRetry}
            style={{ flex: 2, padding: '12px', background: 'var(--purple)', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 16px var(--purple-glow)' }}>
            ↺ RETRY LESSON
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN LESSON PAGE
// ─────────────────────────────────────────────
export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.lessonId as string
  const unitId = params.unitId as string

  const [phase, setPhase] = useState<Phase>('loading')
  const [content, setContent] = useState<LessonContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [missedConcepts, setMissedConcepts] = useState<string[]>([])
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('intuitive')
  const masteryScore = 67

  // Checkpoint state
  const [messageIndex, setMessageIndex] = useState(0)
  const [checkpointIndex, setCheckpointIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [checkpointsPassed, setCheckpointsPassed] = useState(0)
  const [showHint, setShowHint] = useState(false)

  // Stars + coins
  const [stars, setStars] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [showXP, setShowXP] = useState(false)

  // AI review popup
  const [showReview, setShowReview] = useState(false)
  const [missedQuestions, setMissedQuestions] = useState<string[]>([])

  const fetchLesson = async (attempt: number, missed: string[], style: LearningStyle) => {
    setPhase('loading')
    setError(null)
    setMessageIndex(0)
    setCheckpointIndex(0)
    setSelected(null)
    setSubmitted(false)
    setCheckpointsPassed(0)
    setShowHint(false)
    setShowXP(false)
    setMissedQuestions([])

    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          attemptNumber: attempt,
          masteryScore,
          missedConcepts: missed,
          preferredStyle: style,
          // Request exactly 3 checkpoints
          checkpointCount: 3,
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      // Ensure exactly 3 checkpoints
      if (data.checkpoints && data.checkpoints.length < 3) {
        while (data.checkpoints.length < 3) {
          data.checkpoints.push(data.checkpoints[0])
        }
      }
      setContent(data)
      setPhase('intro')
    } catch (err) {
      setError('Failed to load lesson. Check your API key in .env.local.')
      setPhase('loading')
    }
  }

  useEffect(() => {
    fetchLesson(attemptNumber, missedConcepts, learningStyle)
  }, [lessonId])

  // ─────────────────────────────────────────────
  // CHECKPOINT LOGIC — 3 questions
  // 3/3 = 3 stars (full mastery)
  // 2/3 = 2 stars (pass, move on)
  // 1/3 = 1 star (fail, AI review popup)
  // 0/3 = 0 stars (fail, AI review popup)
  // ─────────────────────────────────────────────
  const handleCheckpointSubmit = () => {
    setSubmitted(true)
    const checkpoint = content!.checkpoints[checkpointIndex]
    const isCorrect = selected === checkpoint.correct
    if (!isCorrect) {
      setMissedQuestions(prev => [...prev, checkpoint.question])
      setMissedConcepts(prev => [...new Set([...prev, checkpoint.question])])
    } else {
      setCheckpointsPassed(p => p + 1)
    }
  }

  const handleCheckpointNext = () => {
    if (checkpointIndex + 1 < content!.checkpoints.length) {
      setCheckpointIndex(i => i + 1)
      setSelected(null)
      setSubmitted(false)
      setShowHint(false)
    } else {
      // All 3 checkpoints done — calculate stars
      const finalScore = checkpointsPassed + (selected === content!.checkpoints[checkpointIndex].correct ? 1 : 0)
      const earnedStars = finalScore // 0, 1, 2, or 3 stars
      const passed = earnedStars >= 2

      setStars(earnedStars)

      // Calculate coins
      // 3 stars = 150, 2 stars = 50, 1 star = 10, 0 stars = 0
      const coins = earnedStars === 3 ? 150 : earnedStars === 2 ? 50 : earnedStars === 1 ? 10 : 0
      setCoinsEarned(coins)

      setPhase('complete')
      setShowXP(true)

      // Auto-trigger AI review if score is 0 or 1
      if (earnedStars <= 1) {
        setTimeout(() => setShowReview(true), 1200)
      }
    }
  }

  const handleRetry = (style?: LearningStyle) => {
    const newAttempt = attemptNumber + 1
    const newStyle = style || learningStyle
    setAttemptNumber(newAttempt)
    setLearningStyle(newStyle)
    setStars(0)
    setCoinsEarned(0)
    setShowReview(false)
    fetchLesson(newAttempt, missedConcepts, newStyle)
  }

  const phaseNumber = { loading: 0, intro: 1, diagram: 2, checkpoint: 3, review: 3, complete: 4 }[phase]

  // ── LOADING SCREEN ──
  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          {error ? (
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
              <div style={{ color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, marginBottom: 20 }}>{error}</div>
              <button onClick={() => fetchLesson(attemptNumber, missedConcepts, learningStyle)} style={{ padding: '10px 24px', background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 4, color: 'var(--cyan)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>RETRY ↺</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 48 }}>🦉</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', fontSize: 13, letterSpacing: 2 }}>
                {attemptNumber > 1 ? `ADAPTING TO YOUR NEEDS... ATTEMPT ${attemptNumber}` : 'PREPARING YOUR LESSON...'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {attemptNumber > 1 && missedConcepts.length > 0 ? `Focusing on ${missedConcepts.length} concept(s) to reinforce` : 'Generating personalized content...'}
              </div>
            </>
          )}
        </main>
      </div>
    )
  }

  if (!content) return null

  const DiagramComponent = DIAGRAMS[content.diagramType] || GenericDiagram
  const currentCheckpoint = content.checkpoints[checkpointIndex]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />

      {/* AI Review Popup */}
      {showReview && (
        <AIReviewPopup
          lessonName={content.meta.lessonName}
          missedCheckpoints={missedQuestions}
          onClose={() => setShowReview(false)}
          onRetry={() => handleRetry()}
        />
      )}

      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title={`${content.meta.unitName.toUpperCase()} · ${content.meta.lessonName.toUpperCase()}`} activeTab="Energy" />

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: 780 }}>

            {/* Attempt badge */}
            {attemptNumber > 1 && (
              <div style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid var(--orange)', borderRadius: 4, padding: '8px 16px', marginBottom: 20, fontSize: 11, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡</span>
                <span>ATTEMPT {attemptNumber} — Lesson adapted to your responses</span>
              </div>
            )}

            {/* Phase progress */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' }}>
              {['AI Guide', 'Diagram', 'Checkpoint', 'Complete'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < 3 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i + 1 < phaseNumber ? 'var(--cyan)' : i + 1 === phaseNumber ? 'var(--cyan-dim)' : 'var(--border)', border: `1px solid ${i + 1 <= phaseNumber ? 'var(--cyan)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i + 1 < phaseNumber ? 'var(--bg-base)' : i + 1 === phaseNumber ? 'var(--cyan)' : 'var(--text-muted)' }}>
                      {i + 1 < phaseNumber ? '✓' : i + 1}
                    </div>
                    <div style={{ fontSize: 9, color: i + 1 === phaseNumber ? 'var(--cyan)' : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{label}</div>
                  </div>
                  {i < 3 && <div style={{ flex: 1, height: 1, background: i + 1 < phaseNumber ? 'var(--cyan)' : 'var(--border)', marginBottom: 14 }} />}
                </div>
              ))}
            </div>

            {/* ── PHASE 1: AI GUIDE ── */}
            {phase === 'intro' && (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 8 }}>PARALLAX AI · GUIDE MODE</div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>{content.meta.lessonName}</h1>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{content.meta.unitName} · Lesson {lessonId}</div>
                </div>

                {/* Learning style selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginRight: 4 }}>STYLE:</div>
                  {(['intuitive', 'visual', 'mathematical'] as LearningStyle[]).map(style => (
                    <button key={style} onClick={() => setLearningStyle(style)}
                      style={{ padding: '4px 12px', background: learningStyle === style ? 'var(--cyan-dim)' : 'transparent', border: `1px solid ${learningStyle === style ? 'var(--cyan)' : 'var(--border)'}`, borderRadius: 20, color: learningStyle === style ? 'var(--cyan)' : 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', letterSpacing: 1 }}>
                      {style.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* AI messages */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                  {content.messages.slice(0, messageIndex + 1).map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', animation: i === messageIndex ? 'fadeIn 0.5s ease' : 'none' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'var(--purple-dim)', border: '2px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 12px var(--purple-glow)' }}>🦉</div>
                      <div className="glass-card" style={{ padding: '16px 20px', flex: 1 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8 }}>{msg}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{messageIndex + 1} / {content.messages.length}</div>
                  {messageIndex < content.messages.length - 1 ? (
                    <button onClick={() => setMessageIndex(i => i + 1)} style={{ padding: '12px 32px', background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, color: 'var(--purple)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', letterSpacing: 1 }}>CONTINUE →</button>
                  ) : (
                    <button onClick={() => setPhase('diagram')} style={{ padding: '12px 32px', background: 'linear-gradient(135deg, var(--cyan), var(--purple))', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', letterSpacing: 1, boxShadow: '0 0 20px var(--cyan-glow)' }}>VIEW DIAGRAM →</button>
                  )}
                </div>
              </div>
            )}

            {/* ── PHASE 2: DIAGRAM ── */}
            {phase === 'diagram' && (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 8 }}>INTERACTIVE DIAGRAM</div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>See It in Action</h2>
                </div>
                <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                  <DiagramComponent lessonName={content.meta.lessonName} />
                </div>
                <div style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  🦉 <span style={{ color: 'var(--purple)', fontWeight: 700 }}>Parallax AI:</span> Play with the diagram until it feels intuitive. The checkpoint has 3 questions — you need 2/3 to advance. ⚡
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => setPhase('intro')} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>← REVIEW GUIDE</button>
                  <button onClick={() => setPhase('checkpoint')} style={{ padding: '12px 32px', background: 'linear-gradient(135deg, var(--cyan), var(--purple))', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', letterSpacing: 1, boxShadow: '0 0 20px var(--cyan-glow)' }}>TAKE CHECKPOINT →</button>
                </div>
              </div>
            )}

            {/* ── PHASE 3: CHECKPOINT ── */}
            {phase === 'checkpoint' && currentCheckpoint && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>
                      CHECKPOINT {checkpointIndex + 1} OF 3
                    </div>
                    {/* Live star preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {checkpointsPassed}/3 so far
                      </span>
                      <StarDisplay count={checkpointsPassed} size={16} />
                    </div>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>Verify Your Understanding</h2>
                  {/* Progress bar */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < checkpointIndex ? 'var(--cyan)' : i === checkpointIndex ? 'var(--cyan)' : 'var(--border)', opacity: i === checkpointIndex ? 1 : i < checkpointIndex ? 0.6 : 0.3 }} />
                    ))}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 24 }}>{currentCheckpoint.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {currentCheckpoint.options.map((opt, i) => {
                      let borderColor = 'var(--border-hi)', bgColor = 'var(--bg-surface-hi)', textColor = 'var(--text-primary)'
                      if (submitted && i === currentCheckpoint.correct) { borderColor = 'var(--green)'; bgColor = 'rgba(0,255,136,0.1)'; textColor = 'var(--green)' }
                      else if (submitted && selected === i && i !== currentCheckpoint.correct) { borderColor = 'var(--red)'; bgColor = 'rgba(255,0,68,0.1)'; textColor = 'var(--red)' }
                      else if (selected === i && !submitted) { borderColor = 'var(--cyan)'; bgColor = 'var(--cyan-dim)'; textColor = 'var(--cyan)' }
                      return (
                        <button key={i} onClick={() => !submitted && setSelected(i)} disabled={submitted}
                          style={{ background: bgColor, border: `1px solid ${borderColor}`, borderLeft: `3px solid ${borderColor}`, borderRadius: 4, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: submitted ? 'default' : 'pointer', transition: 'var(--transition)', textAlign: 'left' }}>
                          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', minWidth: 20 }}>{['A', 'B', 'C', 'D'][i]}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{opt}</span>
                          {submitted && i === currentCheckpoint.correct && <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>✓</span>}
                          {submitted && selected === i && i !== currentCheckpoint.correct && <span style={{ marginLeft: 'auto', color: 'var(--red)' }}>✗</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Hint */}
                {!submitted && (
                  <button onClick={() => setShowHint(h => !h)} style={{ background: 'transparent', border: '1px solid var(--purple)', borderRadius: 4, padding: '8px 16px', color: 'var(--purple)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', marginBottom: 12 }}>
                    🦉 {showHint ? 'HIDE HINT' : 'ASK PARALLAX'}
                  </button>
                )}
                {showHint && (
                  <div style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    🦉 {currentCheckpoint.hint}
                  </div>
                )}

                {submitted && (
                  <div style={{ background: selected === currentCheckpoint.correct ? 'rgba(0,255,136,0.08)' : 'rgba(255,0,68,0.08)', border: `1px solid ${selected === currentCheckpoint.correct ? 'var(--green)' : 'var(--red)'}`, borderRadius: 4, padding: '14px 18px', marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: selected === currentCheckpoint.correct ? 'var(--green)' : 'var(--red)', marginBottom: 4 }}>
                      {selected === currentCheckpoint.correct ? '🎯 Correct!' : '💡 Not quite — Parallax AI will review this with you.'}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {!submitted ? (
                    <button onClick={handleCheckpointSubmit} disabled={selected === null}
                      style={{ padding: '12px 32px', background: selected !== null ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--border)', border: 'none', borderRadius: 4, color: selected !== null ? 'var(--bg-base)' : 'var(--text-muted)', fontSize: 13, fontWeight: 900, letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', cursor: selected !== null ? 'pointer' : 'not-allowed' }}>SUBMIT →</button>
                  ) : (
                    <button onClick={handleCheckpointNext}
                      style={{ padding: '12px 32px', background: 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
                      {checkpointIndex + 1 < 3 ? 'NEXT CHECKPOINT →' : 'FINISH LESSON →'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── PHASE 4: COMPLETE ── */}
            {phase === 'complete' && (
              <div style={{ textAlign: 'center' }}>

                {/* Star animation */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <StarDisplay count={stars} size={48} />
                </div>

                <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {stars === 3 ? '🌟 Full Mastery!' : stars === 2 ? '✅ Lesson Passed!' : stars === 1 ? '💡 Keep Going!' : '🔄 Try Again!'}
                </h1>

                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {content.meta.lessonName} · {checkpointsPassed}/3 correct
                </div>

                {/* Pass/fail message */}
                <div style={{ fontSize: 13, color: stars >= 2 ? 'var(--green)' : 'var(--orange)', marginBottom: 32, fontFamily: 'JetBrains Mono, monospace' }}>
                  {stars >= 2 ? '⚡ Next lesson unlocked!' : 'Complete this lesson to unlock the next one — but you can move on and come back!'}
                </div>

                {/* XP + Coins */}
                {showXP && (
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
                    <div className="glass-card" style={{ padding: '20px 28px', display: 'inline-block' }}>
                      <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--cyan)', animation: 'bossAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}>
                        +{stars === 3 ? 180 : stars === 2 ? 120 : stars === 1 ? 40 : 0} XP
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                        {stars === 3 ? 'MASTERY BONUS' : stars === 2 ? 'COMPLETION' : 'PARTIAL'}
                      </div>
                    </div>
                    {coinsEarned > 0 && <CoinsEarned amount={coinsEarned} />}
                  </div>
                )}

                {/* Star breakdown */}
                <div className="glass-card" style={{ padding: '16px 24px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 12 }}>STAR REQUIREMENTS</div>
                  {[
                    { stars: 3, label: '3/3 correct', desc: 'Full mastery — maximum XP + coins', achieved: stars === 3 },
                    { stars: 2, label: '2/3 correct', desc: 'Passed — next lesson unlocks', achieved: stars >= 2 },
                    { stars: 1, label: '1/3 correct', desc: 'Attempted — can move on, boss locked', achieved: stars >= 1 },
                    { stars: 0, label: '0/3 correct', desc: 'Review needed — AI explains concepts', achieved: false },
                  ].map(row => (
                    <div key={row.stars} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, opacity: row.achieved ? 1 : 0.4 }}>
                      <StarDisplay count={row.stars} size={14} />
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: row.achieved ? 'var(--text-primary)' : 'var(--text-muted)' }}>{row.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{row.desc}</span>
                      </div>
                      {row.achieved && <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 14 }}>✓</span>}
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => router.push('/galaxy')}
                    style={{ padding: '14px 24px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                    ← BACK TO GALAXY
                  </button>
                  {stars <= 1 && (
                    <button onClick={() => setShowReview(true)}
                      style={{ padding: '14px 24px', background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, color: 'var(--purple)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                      🦉 REVIEW WITH AI
                    </button>
                  )}
                  <button onClick={() => {
                    if (stars <= 1) {
                      handleRetry()
                    } else {
                      router.push('/galaxy')
                    }
                  }}
                    style={{ padding: '14px 24px', background: stars >= 2 ? 'var(--cyan)' : 'var(--orange)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: `0 0 20px ${stars >= 2 ? 'var(--cyan-glow)' : 'rgba(255,107,43,0.4)'}` }}>
                    {stars === 3 ? '🌟 NEXT LESSON →' : stars === 2 ? 'NEXT LESSON →' : '↺ RETRY LESSON'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bossAppear { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 60% { transform: scale(1.2) rotate(10deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes starPop { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 70% { transform: scale(1.3) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
      `}</style>
    </div>
  )
}
