'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
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

type Phase = 'loading' | 'intro' | 'diagram' | 'checkpoint' | 'complete'
type LearningStyle = 'intuitive' | 'visual' | 'mathematical'

// ─────────────────────────────────────────────
// DIAGRAM COMPONENTS (same as before)
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
        {ballX > 15 && <><line x1="10" y1="18" x2={ballX - 2} y2="18" stroke="#9B5DFF" strokeWidth="0.4" markerEnd="url(#arrow)" /><text x={(10 + ballX) / 2} y="16" textAnchor="middle" fontSize="2.5" fill="#9B5DFF" fontFamily="monospace">Δx = {(ballX - 10).toFixed(0)} units</text></>}
        <defs><marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#9B5DFF" /></marker></defs>
      </svg>
      <button onClick={() => { setBallX(10); setTimeout(() => setRunning(true), 100) }} style={{ marginTop: 10, padding: '8px 20px', background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 4, color: 'var(--cyan)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>▶ ANIMATE MOTION</button>
    </div>
  )
}

function VelocityDiagram() {
  const [showVector, setShowVector] = useState(false)
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>CLICK TO REVEAL VELOCITY VECTORS</div>
      <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', cursor: 'pointer' }} onClick={() => setShowVector(v => !v)}>
        <circle cx="50" cy="32" r="20" fill="none" stroke="#1A1D35" strokeWidth="0.5" />
        {[0, 90, 180, 270].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const x = 50 + 20 * Math.cos(rad), y = 32 + 20 * Math.sin(rad)
          const vx = -Math.sin(rad) * 8, vy = Math.cos(rad) * 8
          return (<g key={i}><circle cx={x} cy={y} r="3.5" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.4" /><text x={x} y={y + 1.2} textAnchor="middle" fontSize="3.5">🚗</text>{showVector && <line x1={x} y1={y} x2={x + vx} y2={y + vy} stroke="#00FF88" strokeWidth="0.6" markerEnd="url(#varrow)" />}</g>)
        })}
        <defs><marker id="varrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#00FF88" /></marker></defs>
        <text x="50" y="8" textAnchor="middle" fontSize="3" fill={showVector ? '#00FF88' : '#6B7299'} fontFamily="monospace">{showVector ? 'velocity direction changes constantly' : 'tap to show velocity vectors'}</text>
        <text x="50" y="56" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">constant speed · changing velocity</text>
      </svg>
    </div>
  )
}

function ForceDiagram() {
  const [selected, setSelected] = useState<string | null>(null)
  const forces = [
    { id: 'gravity', label: 'Gravity', x: 50, y: 28, dx: 0, dy: 12, color: '#FF6B2B', desc: "⬇ Gravity pulls toward Earth's center. Always downward, always mg." },
    { id: 'normal', label: 'Normal', x: 50, y: 28, dx: 0, dy: -12, color: '#00F0FF', desc: '⬆ Normal force is the surface pushing back. Always perpendicular to surface.' },
    { id: 'push', label: 'Applied', x: 50, y: 28, dx: 14, dy: 0, color: '#9B5DFF', desc: '➡ Applied force — the push from an external source.' },
    { id: 'friction', label: 'Friction', x: 50, y: 28, dx: -10, dy: 0, color: '#FF0044', desc: '⬅ Friction opposes motion. Acts against direction of movement.' },
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
    <div>
      <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
        <circle cx="50" cy="30" r="18" fill="#00F0FF11" stroke="#00F0FF" strokeWidth="0.5" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
        <text x="50" y="26" textAnchor="middle" fontSize="3.5" fill="#E8EEFF" fontFamily="monospace" fontWeight="bold">{lessonName}</text>
        <text x="50" y="33" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">Explore the concept</text>
        <text x="50" y="39" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">above with Parallax AI</text>
      </svg>
    </div>
  )
}

const DIAGRAMS: Record<string, React.FC<{ lessonName: string }>> = {
  motion: () => <MotionDiagram />,
  velocity: () => <VelocityDiagram />,
  force: () => <ForceDiagram />,
  work: () => <WorkDiagram />,
  generic: GenericDiagram,
  momentum: GenericDiagram,
  energy: GenericDiagram,
}

// ─────────────────────────────────────────────
// MAIN LESSON PAGE
// ─────────────────────────────────────────────
export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.lessonId as string
  const unitId = params.unitId as string

  // ── Core lesson state ──
  const [phase, setPhase] = useState<Phase>('loading')
  const [content, setContent] = useState<LessonContent | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Adaptive state ──
  // These track the student's performance and style
  // They get sent back to Claude on retry to generate different content
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [missedConcepts, setMissedConcepts] = useState<string[]>([])
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('intuitive')
  const masteryScore = 67 // TODO: pull from Supabase later

  // ── UI state ──
  const [messageIndex, setMessageIndex] = useState(0)
  const [checkpointIndex, setCheckpointIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [checkpointsPassed, setCheckpointsPassed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showXP, setShowXP] = useState(false)

  // ─────────────────────────────────────────────
  // FETCH LESSON from our API route
  // This calls /api/lesson which calls Claude
  // attemptNumber and missedConcepts change on retry
  // so Claude generates completely different content
  // ─────────────────────────────────────────────
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
        }),
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const data = await res.json()
      setContent(data)
      setPhase('intro')
    } catch (err) {
      setError('Failed to load lesson. Check your API key in .env.local.')
      setPhase('loading')
    }
  }

  // Load lesson on first mount
  useEffect(() => {
    fetchLesson(attemptNumber, missedConcepts, learningStyle)
  }, [lessonId])

  // ─────────────────────────────────────────────
  // CHECKPOINT LOGIC
  // Track which concepts were missed
  // Pass them to Claude on retry
  // ─────────────────────────────────────────────
  const handleCheckpointSubmit = () => {
    setSubmitted(true)
    const checkpoint = content!.checkpoints[checkpointIndex]
    if (selected !== checkpoint.correct) {
      // Record what they got wrong — Claude will focus on this on retry
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
      setPhase('complete')
      setShowXP(true)
    }
  }

  // ─────────────────────────────────────────────
  // RETRY — sends updated context to Claude
  // Claude sees attemptNumber=2, missedConcepts=[...]
  // and generates a completely different lesson
  // ─────────────────────────────────────────────
  const handleRetry = (style?: LearningStyle) => {
    const newAttempt = attemptNumber + 1
    const newStyle = style || learningStyle
    setAttemptNumber(newAttempt)
    setLearningStyle(newStyle)
    fetchLesson(newAttempt, missedConcepts, newStyle)
  }

  const phaseNumber = { loading: 0, intro: 1, diagram: 2, checkpoint: 3, complete: 4 }[phase]

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
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
              <div style={{ fontSize: 48, animation: 'pulse-glow 1s ease-in-out infinite' }}>🦉</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', fontSize: 13, letterSpacing: 2 }}>
                {attemptNumber > 1 ? `ADAPTING TO YOUR NEEDS... ATTEMPT ${attemptNumber}` : 'PARALLAX AI IS PREPARING YOUR LESSON...'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {attemptNumber > 1 && missedConcepts.length > 0
                  ? `Focusing on: ${missedConcepts.length} concept${missedConcepts.length > 1 ? 's' : ''} to reinforce`
                  : 'Generating personalized content...'}
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
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title={`${content.meta.unitName.toUpperCase()} · ${content.meta.lessonName.toUpperCase()}`} activeTab="Energy" />

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: 780 }}>

            {/* Attempt badge — shows on retry */}
            {attemptNumber > 1 && (
              <div style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid var(--orange)', borderRadius: 4, padding: '8px 16px', marginBottom: 20, fontSize: 11, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡</span>
                <span>ATTEMPT {attemptNumber} — Parallax AI has adapted this lesson based on your previous responses</span>
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
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginRight: 4, display: 'flex', alignItems: 'center' }}>STYLE:</div>
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
                  🦉 <span style={{ color: 'var(--purple)', fontWeight: 700 }}>Parallax AI:</span> Interact with the diagram. The best physicists play with concepts until they feel intuitive. ⚡
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
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 8 }}>CHECKPOINT {checkpointIndex + 1} OF {content.checkpoints.length}</div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>Verify Your Understanding</h2>
                </div>

                <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 24 }}>{currentCheckpoint.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {currentCheckpoint.options.map((opt, i) => {
                      let borderColor = 'var(--border-hi)', bgColor = 'var(--bg-surface-hi)', textColor = 'var(--text-primary)'
                      if (submitted && i === currentCheckpoint.correct) { borderColor = 'var(--green)'; bgColor = 'rgba(0,255,136,0.1)'; textColor = 'var(--green)' }
                      else if (submitted && selected === i) { borderColor = 'var(--red)'; bgColor = 'rgba(255,0,68,0.1)'; textColor = 'var(--red)' }
                      else if (selected === i) { borderColor = 'var(--cyan)'; bgColor = 'var(--cyan-dim)'; textColor = 'var(--cyan)' }
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
                      {selected === currentCheckpoint.correct ? '🎯 Correct! Well done, Navigator.' : "💡 Not quite — that's how we learn."}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {selected === currentCheckpoint.correct ? 'Your understanding is confirmed.' : currentCheckpoint.hint}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {!submitted ? (
                    <button onClick={handleCheckpointSubmit} disabled={selected === null} style={{ padding: '12px 32px', background: selected !== null ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--border)', border: 'none', borderRadius: 4, color: selected !== null ? 'var(--bg-base)' : 'var(--text-muted)', fontSize: 13, fontWeight: 900, letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', cursor: selected !== null ? 'pointer' : 'not-allowed' }}>SUBMIT →</button>
                  ) : (
                    <button onClick={handleCheckpointNext} style={{ padding: '12px 32px', background: 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
                      {checkpointIndex + 1 < content.checkpoints.length ? 'NEXT CHECKPOINT →' : 'COMPLETE LESSON →'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── PHASE 4: COMPLETE ── */}
            {phase === 'complete' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 80, marginBottom: 24, animation: 'bossAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                  {checkpointsPassed === content.checkpoints.length ? '🌟' : '✅'}
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {checkpointsPassed === content.checkpoints.length ? 'Lesson Mastered!' : 'Lesson Complete'}
                </h1>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
                  {content.meta.lessonName} · {checkpointsPassed}/{content.checkpoints.length} checkpoints passed
                </div>

                {showXP && (
                  <div className="glass-card" style={{ padding: 32, marginBottom: 24, display: 'inline-block' }}>
                    <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--cyan)', animation: 'bossAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}>
                      +{checkpointsPassed === content.checkpoints.length ? 120 : 60} XP
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                      {checkpointsPassed === content.checkpoints.length ? 'FULL MASTERY BONUS' : 'PARTIAL COMPLETION'}
                    </div>
                  </div>
                )}

                {checkpointsPassed < content.checkpoints.length && (
                  <>
                    <div style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid var(--orange)', borderRadius: 4, padding: '14px 20px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      🦉 Some checkpoints need review. Would you like Parallax AI to adapt the lesson for you?
                    </div>
                    {/* Style selector on retry */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>HOW WOULD YOU LIKE IT EXPLAINED?</div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        {[
                          { style: 'intuitive' as LearningStyle, label: '💡 Simpler Analogies', desc: 'More everyday examples' },
                          { style: 'visual' as LearningStyle, label: '📊 More Visual', desc: 'Focus on diagrams' },
                          { style: 'mathematical' as LearningStyle, label: '🔢 Show the Math', desc: 'Equations and derivations' },
                        ].map(opt => (
                          <button key={opt.style} onClick={() => handleRetry(opt.style)}
                            style={{ flex: 1, padding: '14px 12px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: 4, cursor: 'pointer', textAlign: 'center' }}>
                            <div style={{ fontSize: 16, marginBottom: 4 }}>{opt.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={() => router.push('/galaxy')} style={{ padding: '14px 28px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>← BACK TO GALAXY</button>
                  {checkpointsPassed === content.checkpoints.length && (
                    <button onClick={() => handleRetry()} style={{ padding: '14px 28px', background: 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>RETRY ↺</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bossAppear { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 60% { transform: scale(1.2) rotate(10deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
      `}</style>
    </div>
  )
}
