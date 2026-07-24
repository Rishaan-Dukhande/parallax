'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface HookCard {
  type: 'hook'
  title: string
  content: string
  visual: string
}

interface ConceptCard {
  type: 'concept'
  title: string
  content: string
  equation: string | null
  visual: string
}

interface CheckCard {
  type: 'check'
  title: string
  question: string
  options: string[]
  correct: number
  hint: string
  explanation: string
  followUp?: {
    question: string
    options: string[]
    correct: number
    explanation: string
  }
}

interface SummaryCard {
  type: 'summary'
  title: string
  points: string[]
  apNote: string
  visual: string
}

type Card = HookCard | ConceptCard | CheckCard | SummaryCard

interface LessonData {
  meta: { unitName: string; lessonName: string }
  cards: Card[]
  finalQuiz: CheckCard[]
  diagramType: string
}

type LearningStyle = 'intuitive' | 'visual' | 'mathematical'

// ─────────────────────────────────────────────
// STAR DISPLAY
// ─────────────────────────────────────────────
function StarDisplay({ count, total = 3, size = 24 }: { count: number; total?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          fontSize: size,
          filter: i < count ? 'drop-shadow(0 0 6px #FFD700)' : 'grayscale(1) opacity(0.3)',
          animation: i < count ? `starPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.15}s both` : 'none',
        }}>⭐</span>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// DIAGRAMS
// ─────────────────────────────────────────────
function MotionDiagram({ visualFocus }: { visualFocus?: string }) {
  const [ballX, setBallX] = useState(10)
  const [running, setRunning] = useState(false)
  const animRef = useRef<number | undefined>(undefined)
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

  if (visualFocus === 'definition') {
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>WHAT IS MOTION? — position changes over time</div>
        <svg viewBox="0 0 100 40" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
          <line x1="5" y1="30" x2="95" y2="30" stroke="#1A1D35" strokeWidth="0.5" />
          <text x="8" y="36" fontSize="3" fill="#6B7299" fontFamily="monospace">START</text>
          <circle cx="10" cy="30" r="0.8" fill="#00F0FF" />
          <text x="79" y="36" fontSize="3" fill="#6B7299" fontFamily="monospace">END</text>
          <circle cx="85" cy="30" r="0.8" fill="#00F0FF" />
          <circle cx={ballX} cy="25" r="4" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.5" />
          <text x={ballX} y="25.8" textAnchor="middle" fontSize="4">🚗</text>
          {ballX > 15 && <><line x1="10" y1="18" x2={ballX - 2} y2="18" stroke="#9B5DFF" strokeWidth="0.4" markerEnd="url(#arrow1)" /><text x={(10 + ballX) / 2} y="16" textAnchor="middle" fontSize="2.5" fill="#9B5DFF" fontFamily="monospace">changing position = motion</text></>}
          <defs><marker id="arrow1" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#9B5DFF" /></marker></defs>
        </svg>
        <button onClick={() => { setBallX(10); setTimeout(() => setRunning(true), 100) }} style={{ marginTop: 8, padding: '6px 16px', background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 4, color: 'var(--cyan)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>▶ SHOW MOTION</button>
      </div>
    )
  }

  if (visualFocus === 'equation') {
    const [time, setTime] = useState(0)
    const speed = 2
    const position = Math.min(85, 10 + speed * time)
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>SPEED = distance ÷ time</div>
        <svg viewBox="0 0 100 45" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <line x1="5" y1="32" x2="95" y2="32" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx={position} cy="27" r="4" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.5" />
          <text x={position} y="27.8" textAnchor="middle" fontSize="4">🚗</text>
          <text x="50" y="10" textAnchor="middle" fontSize="3.5" fill="#00F0FF" fontFamily="monospace" fontWeight="bold">v = Δx/Δt = {speed} m/s</text>
          <text x="50" y="16" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">distance: {(position - 10).toFixed(0)}m  time: {time}s</text>
        </svg>
        <input type="range" min="0" max="37" value={time} onChange={e => setTime(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--cyan)' }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>DRAG TO ADVANCE TIME</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>REFERENCE FRAMES — motion depends on your viewpoint</div>
      <svg viewBox="0 0 100 40" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
        <line x1="5" y1="30" x2="95" y2="30" stroke="#1A1D35" strokeWidth="0.5" />
        <circle cx={ballX} cy="25" r="4" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.5" />
        <text x={ballX} y="25.8" textAnchor="middle" fontSize="4">🚗</text>
        <text x="10" y="12" fontSize="2.8" fill="#00FF88" fontFamily="monospace">ground: moving</text>
        <text x="10" y="18" fontSize="2.8" fill="#FF6B2B" fontFamily="monospace">car seat: stationary</text>
        <line x1="5" y1="35" x2="95" y2="35" stroke="#00FF88" strokeWidth="0.3" strokeDasharray="2 2" />
        <defs><marker id="arrow2" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#9B5DFF" /></marker></defs>
      </svg>
      <button onClick={() => { setBallX(10); setTimeout(() => setRunning(true), 100) }} style={{ marginTop: 8, padding: '6px 16px', background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 4, color: 'var(--cyan)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>▶ ANIMATE</button>
    </div>
  )
}

function EnergyDiagram({ visualFocus }: { visualFocus?: string }) {
  const [height, setHeight] = useState(80)
  const pe = Math.round(height), ke = Math.round(100 - height)

  if (visualFocus === 'definition') {
    return (
      <div>
        <svg viewBox="0 0 100 70" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <line x1="10" y1="60" x2="90" y2="60" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx="30" cy={60 - (height * 0.5)} r="4" fill="#9B5DFF22" stroke="#9B5DFF" strokeWidth="0.8" />
          <text x="30" y={60 - (height * 0.5) + 1.5} textAnchor="middle" fontSize="5">⚽</text>
          <line x1="20" y1="60" x2="20" y2={60 - (height * 0.5)} stroke="#9B5DFF" strokeWidth="0.4" markerEnd="url(#eheight)" />
          <text x="14" y={60 - (height * 0.25)} fontSize="2.8" fill="#9B5DFF" fontFamily="monospace">height</text>
          <defs><marker id="eheight" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#9B5DFF" /></marker></defs>
          <text x="50" y="10" textAnchor="middle" fontSize="3" fill="#9B5DFF" fontFamily="monospace">Higher position = more stored energy</text>
        </svg>
        <input type="range" min="0" max="100" value={height} onChange={e => setHeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)' }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>DRAG TO RAISE/LOWER THE BALL</div>
      </div>
    )
  }

  if (visualFocus === 'equation') {
    const mass = 2
    const g = 9.8
    const h = (height / 100) * 10
    const pe_joules = (mass * g * h).toFixed(1)
    return (
      <div>
        <svg viewBox="0 0 100 70" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <line x1="10" y1="60" x2="90" y2="60" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx="30" cy={60 - (height * 0.5)} r="4" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.8" />
          <text x="30" y={60 - (height * 0.5) + 1.5} textAnchor="middle" fontSize="5">⚽</text>
          <text x="65" y="20" textAnchor="middle" fontSize="4" fill="#00F0FF" fontFamily="monospace" fontWeight="bold">PE = mgh</text>
          <text x="65" y="28" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">m={mass}kg, g={g}, h={h.toFixed(1)}m</text>
          <text x="65" y="36" textAnchor="middle" fontSize="3.5" fill="#00FF88" fontFamily="monospace" fontWeight="bold">PE = {pe_joules} J</text>
        </svg>
        <input type="range" min="0" max="100" value={height} onChange={e => setHeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--cyan)' }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>DRAG HEIGHT — WATCH PE CALCULATE</div>
      </div>
    )
  }

  return (
    <div>
      <svg viewBox="0 0 100 70" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
        <line x1="10" y1="60" x2="90" y2="60" stroke="#1A1D35" strokeWidth="0.5" />
        <circle cx="30" cy={60 - (height * 0.5)} r="4" fill="#9B5DFF22" stroke="#9B5DFF" strokeWidth="0.8" />
        <text x="30" y={60 - (height * 0.5) + 1.5} textAnchor="middle" fontSize="5">⚽</text>
        <rect x="55" y={60 - (pe * 0.5)} width="10" height={pe * 0.5} fill="#00F0FF44" stroke="#00F0FF" strokeWidth="0.4" />
        <text x="60" y={63} textAnchor="middle" fontSize="2.5" fill="#00F0FF" fontFamily="monospace">PE {pe}%</text>
        <rect x="70" y={60 - (ke * 0.5)} width="10" height={ke * 0.5} fill="#00FF8844" stroke="#00FF88" strokeWidth="0.4" />
        <text x="75" y={63} textAnchor="middle" fontSize="2.5" fill="#00FF88" fontFamily="monospace">KE {ke}%</text>
        <text x="50" y="7" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">As the ball falls: PE → KE</text>
      </svg>
      <input type="range" min="0" max="100" value={height} onChange={e => setHeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)' }} />
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>DRAG TO SEE ENERGY TRANSFORM</div>
    </div>
  )
}

function KineticEnergyDiagram({ visualFocus }: { visualFocus?: string }) {
  const [speed, setSpeed] = useState(30)
  const ke = (0.5 * 1000 * speed * speed / 10000).toFixed(1)
  const keDouble = (0.5 * 1000 * (speed * 2) * (speed * 2) / 10000).toFixed(1)

  if (visualFocus === 'definition') {
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>KE = ENERGY OF MOTION — faster = more energy</div>
        <svg viewBox="0 0 100 55" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
          <line x1="5" y1="38" x2="95" y2="38" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx="20" cy="38" r="5" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.6" />
          <text x="20" y="38.8" textAnchor="middle" fontSize="5">🐢</text>
          <line x1="25" y1="32" x2="35" y2="32" stroke="#00F0FF" strokeWidth="0.5" markerEnd="url(#ke1)" />
          <text x="30" y="29" textAnchor="middle" fontSize="2.5" fill="#00F0FF" fontFamily="monospace">slow</text>
          <text x="20" y="48" textAnchor="middle" fontSize="2.5" fill="#6B7299" fontFamily="monospace">low KE</text>
          <circle cx="70" cy="38" r="5" fill="#FF6B2B22" stroke="#FF6B2B" strokeWidth="0.6" />
          <text x="70" y="38.8" textAnchor="middle" fontSize="5">🚀</text>
          <line x1="75" y1="32" x2="92" y2="32" stroke="#FF6B2B" strokeWidth="0.5" markerEnd="url(#ke2)" />
          <text x="83" y="29" textAnchor="middle" fontSize="2.5" fill="#FF6B2B" fontFamily="monospace">fast</text>
          <text x="70" y="48" textAnchor="middle" fontSize="2.5" fill="#6B7299" fontFamily="monospace">high KE</text>
          <text x="50" y="10" textAnchor="middle" fontSize="3" fill="#6B7299" fontFamily="monospace">same mass — speed determines KE</text>
          <defs>
            <marker id="ke1" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#00F0FF" /></marker>
            <marker id="ke2" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#FF6B2B" /></marker>
          </defs>
        </svg>
      </div>
    )
  }

  if (visualFocus === 'equation') {
    const keVal = (0.5 * 1000 * speed * speed / 10000).toFixed(0)
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>KE = ½mv² — drag speed to see v² effect</div>
        <svg viewBox="0 0 100 50" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <line x1="5" y1="35" x2="95" y2="35" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx="15" cy="35" r="5" fill="#9B5DFF22" stroke="#9B5DFF" strokeWidth="0.6" />
          <text x="15" y="35.8" textAnchor="middle" fontSize="5">🚗</text>
          <line x1="20" y1="28" x2={20 + speed * 0.7} y2="28" stroke="#FF6B2B" strokeWidth="0.8" markerEnd="url(#keq)" />
          <text x="50" y="10" textAnchor="middle" fontSize="4" fill="#00FF88" fontFamily="monospace" fontWeight="bold">KE = {keVal} J</text>
          <text x="50" y="17" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">½ × 1000kg × {speed}² m/s</text>
          <defs><marker id="keq" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#FF6B2B" /></marker></defs>
        </svg>
        <input type="range" min="10" max="60" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#FF6B2B' }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>SPEED: {speed} m/s</div>
      </div>
    )
  }

  const speeds = [10, 20, 30, 40]
  const maxKE = 0.5 * 1000 * 40 * 40 / 10000
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>THE v² RULE — double speed = 4× the energy</div>
      <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
        <text x="50" y="8" textAnchor="middle" fontSize="3" fill="#6B7299" fontFamily="monospace">KE at different speeds (1000kg car)</text>
        {speeds.map((s, i) => {
          const keBar = (0.5 * 1000 * s * s / 10000)
          const barWidth = (keBar / maxKE) * 60
          const colors = ['#00F0FF', '#00FF88', '#FF6B2B', '#FF0044']
          return (
            <g key={s}>
              <text x="12" y={18 + i * 11} textAnchor="middle" fontSize="2.8" fill={colors[i]} fontFamily="monospace">{s}m/s</text>
              <rect x="22" y={13 + i * 11} width={barWidth} height="6" fill={colors[i] + '44'} stroke={colors[i]} strokeWidth="0.3" rx="1" />
              <text x={25 + barWidth} y={17 + i * 11} fontSize="2.5" fill={colors[i]} fontFamily="monospace">{keBar.toFixed(0)}J</text>
            </g>
          )
        })}
      </svg>
      <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>Notice: 20m/s has 4× the KE of 10m/s — that's the v² effect</div>
    </div>
  )
}

function ConservationDiagram({ visualFocus }: { visualFocus?: string }) {
  const [height, setHeight] = useState(80)
  const pe = Math.round(height), ke = Math.round(100 - height)

  if (visualFocus === 'definition') {
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>TOTAL ENERGY IS CONSTANT — it just transforms</div>
        <svg viewBox="0 0 100 65" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <line x1="10" y1="58" x2="90" y2="58" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx="30" cy={58 - (height * 0.5)} r="4" fill="#9B5DFF22" stroke="#9B5DFF" strokeWidth="0.8" />
          <text x="30" y={58 - (height * 0.5) + 1.5} textAnchor="middle" fontSize="5">⚽</text>
          <line x1="20" y1="58" x2="20" y2={58 - (height * 0.5)} stroke="#9B5DFF" strokeWidth="0.4" />
          <text x="14" y={58 - (height * 0.25)} fontSize="2.5" fill="#9B5DFF" fontFamily="monospace">h</text>
          <text x="65" y="15" textAnchor="middle" fontSize="3" fill="#6B7299" fontFamily="monospace">ALL PE</text>
          <text x="65" y="21" textAnchor="middle" fontSize="3" fill="#6B7299" fontFamily="monospace">no KE</text>
          <text x="65" y="45" textAnchor="middle" fontSize="3" fill="#6B7299" fontFamily="monospace">ALL KE</text>
          <text x="65" y="51" textAnchor="middle" fontSize="3" fill="#6B7299" fontFamily="monospace">no PE</text>
          <text x="50" y="62" textAnchor="middle" fontSize="2.5" fill="#00FF88" fontFamily="monospace">PE + KE = same total always</text>
        </svg>
        <input type="range" min="0" max="100" value={height} onChange={e => setHeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)' }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>DRAG HEIGHT — total energy never changes</div>
      </div>
    )
  }

  if (visualFocus === 'equation') {
    const total = 100
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>KE + PE = constant (isolated system)</div>
        <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <text x="50" y="8" textAnchor="middle" fontSize="3" fill="#6B7299" fontFamily="monospace">Total = {total}J always</text>
          <rect x="10" y={55 - (pe * 0.4)} width="20" height={pe * 0.4} fill="#00F0FF44" stroke="#00F0FF" strokeWidth="0.4" rx="1" />
          <text x="20" y={53 - (pe * 0.4)} textAnchor="middle" fontSize="2.5" fill="#00F0FF" fontFamily="monospace">PE</text>
          <text x="20" y="58" textAnchor="middle" fontSize="2.5" fill="#00F0FF" fontFamily="monospace">{pe}J</text>
          <rect x="40" y={55 - (ke * 0.4)} width="20" height={ke * 0.4} fill="#00FF8844" stroke="#00FF88" strokeWidth="0.4" rx="1" />
          <text x="50" y={53 - (ke * 0.4)} textAnchor="middle" fontSize="2.5" fill="#00FF88" fontFamily="monospace">KE</text>
          <text x="50" y="58" textAnchor="middle" fontSize="2.5" fill="#00FF88" fontFamily="monospace">{ke}J</text>
          <rect x="70" y="15" width="20" height="40" fill="transparent" stroke="#FFD700" strokeWidth="0.4" strokeDasharray="1 1" rx="1" />
          <text x="80" y="33" textAnchor="middle" fontSize="2.5" fill="#FFD700" fontFamily="monospace">Total</text>
          <text x="80" y="38" textAnchor="middle" fontSize="2.5" fill="#FFD700" fontFamily="monospace">{total}J</text>
        </svg>
        <input type="range" min="0" max="100" value={height} onChange={e => setHeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--cyan)' }} />
      </div>
    )
  }

  const [angle, setAngle] = useState(0)
  const [swinging, setSwinging] = useState(false)
  const animRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (swinging) {
      const start = Date.now()
      const animate = () => {
        const t = (Date.now() - start) / 1000
        setAngle(30 * Math.sin(t * 2))
        animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [swinging])
  const pendulumX = 50 + 30 * Math.sin(angle * Math.PI / 180)
  const pendulumY = 15 + 30 * (1 - Math.cos(angle * Math.PI / 180))
  const heightAboveBottom = 30 * (1 - Math.cos(angle * Math.PI / 180))
  const pePercent = Math.round((heightAboveBottom / 30) * 100)
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>PENDULUM — energy constantly transforms between PE and KE</div>
      <svg viewBox="0 0 100 65" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
        <line x1="50" y1="5" x2={pendulumX} y2={pendulumY + 5} stroke="#6B7299" strokeWidth="0.5" />
        <circle cx={pendulumX} cy={pendulumY + 5} r="4" fill="#FF6B2B22" stroke="#FF6B2B" strokeWidth="0.8" />
        <text x={pendulumX} y={pendulumY + 6} textAnchor="middle" fontSize="5">⚽</text>
        <line x1="10" y1="45" x2="90" y2="45" stroke="#1A1D35" strokeWidth="0.3" strokeDasharray="1 1" />
        <text x="15" y="55" fontSize="2.8" fill="#00F0FF" fontFamily="monospace">PE: {pePercent}%</text>
        <text x="55" y="55" fontSize="2.8" fill="#00FF88" fontFamily="monospace">KE: {100 - pePercent}%</text>
        <text x="50" y="62" textAnchor="middle" fontSize="2.5" fill="#FFD700" fontFamily="monospace">Total always = 100%</text>
      </svg>
      <button onClick={() => setSwinging(s => !s)} style={{ marginTop: 8, padding: '6px 16px', background: swinging ? 'var(--red-dim)' : 'var(--cyan-dim)', border: `1px solid ${swinging ? 'var(--red)' : 'var(--cyan)'}`, borderRadius: 4, color: swinging ? 'var(--red)' : 'var(--cyan)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
        {swinging ? '⏹ STOP' : '▶ SWING PENDULUM'}
      </button>
    </div>
  )
}

function ForceDiagram({ visualFocus }: { visualFocus?: string }) {
  const [selected, setSelected] = useState<string | null>(null)
  const forces = [
    { id: 'gravity', label: 'Gravity', x: 50, y: 28, dx: 0, dy: 12, color: '#FF6B2B', desc: "⬇ Gravity (mg) always acts downward toward Earth's center." },
    { id: 'normal', label: 'Normal', x: 50, y: 28, dx: 0, dy: -12, color: '#00F0FF', desc: '⬆ Normal force: surface pushes back perpendicular to itself.' },
    { id: 'push', label: 'Applied', x: 50, y: 28, dx: 14, dy: 0, color: '#9B5DFF', desc: '➡ Applied force from an external source.' },
    { id: 'friction', label: 'Friction', x: 50, y: 28, dx: -10, dy: 0, color: '#FF0044', desc: '⬅ Friction always opposes direction of motion.' },
  ]

  if (visualFocus === 'definition') {
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>FORCE = push or pull between TWO objects</div>
        <svg viewBox="0 0 100 50" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
          <rect x="20" y="20" width="18" height="12" fill="#9B5DFF22" stroke="#9B5DFF" strokeWidth="0.5" rx="1" />
          <text x="29" y="27.5" textAnchor="middle" fontSize="3.5" fill="#E8EEFF">You</text>
          <rect x="60" y="20" width="18" height="12" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.5" rx="1" />
          <text x="69" y="27.5" textAnchor="middle" fontSize="3.5" fill="#E8EEFF">Box</text>
          <line x1="38" y1="26" x2="58" y2="26" stroke="#00FF88" strokeWidth="1" markerEnd="url(#farrow1)" />
          <text x="48" y="22" textAnchor="middle" fontSize="2.8" fill="#00FF88" fontFamily="monospace">PUSH →</text>
          <line x1="60" y1="30" x2="40" y2="30" stroke="#FF6B2B" strokeWidth="0.6" markerEnd="url(#farrow2)" strokeDasharray="1 0.5" />
          <text x="50" y="38" textAnchor="middle" fontSize="2.5" fill="#FF6B2B" fontFamily="monospace">← reaction (Newton 3rd)</text>
          <defs>
            <marker id="farrow1" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#00FF88" /></marker>
            <marker id="farrow2" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#FF6B2B" /></marker>
          </defs>
        </svg>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>Forces always come in pairs — you can't push without being pushed back</div>
      </div>
    )
  }

  if (visualFocus === 'equation') {
    const [mass, setMass] = useState(5)
    const [accel, setAccel] = useState(3)
    const force = (mass * accel).toFixed(0)
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>F = ma — drag sliders to see the relationship</div>
        <svg viewBox="0 0 100 45" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <line x1="5" y1="35" x2="95" y2="35" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx="20" cy="35" r={mass * 0.8} fill="#9B5DFF22" stroke="#9B5DFF" strokeWidth="0.6" />
          <text x="20" y="35.5" textAnchor="middle" fontSize="2.5" fill="#9B5DFF" fontFamily="monospace">{mass}kg</text>
          <line x1={20 + mass * 0.8} y1="28" x2={20 + mass * 0.8 + accel * 4} y2="28" stroke="#00F0FF" strokeWidth="0.8" markerEnd="url(#faccel)" />
          <text x="50" y="10" textAnchor="middle" fontSize="4" fill="#00FF88" fontFamily="monospace" fontWeight="bold">F = {force}N</text>
          <text x="50" y="17" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">{mass}kg × {accel}m/s² = {force}N</text>
          <defs><marker id="faccel" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#00F0FF" /></marker></defs>
        </svg>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>MASS: {mass}kg</div>
            <input type="range" min="1" max="10" value={mass} onChange={e => setMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#9B5DFF' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>ACCEL: {accel}m/s²</div>
            <input type="range" min="1" max="10" value={accel} onChange={e => setAccel(Number(e.target.value))} style={{ width: '100%', accentColor: '#00F0FF' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>FREE BODY DIAGRAM — tap each force to learn more</div>
      <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
        <line x1="10" y1="40" x2="90" y2="40" stroke="#1A1D35" strokeWidth="0.5" />
        <rect x="40" y="20" width="20" height="16" fill="#00F0FF11" stroke="#00F0FF" strokeWidth="0.5" rx="1" />
        <text x="50" y="29.5" textAnchor="middle" fontSize="3.5" fill="#E8EEFF">📦</text>
        <defs>{forces.map(f => <marker key={f.id} id={`farr-${f.id}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill={f.color} /></marker>)}</defs>
        {forces.map(f => (
          <g key={f.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(f.id === selected ? null : f.id)}>
            <line x1={f.x} y1={f.y} x2={f.x + f.dx} y2={f.y + f.dy} stroke={f.color} strokeWidth={selected === f.id ? 1.2 : 0.7} markerEnd={`url(#farr-${f.id})`} strokeOpacity={selected && selected !== f.id ? 0.3 : 1} />
            <text x={f.x + f.dx * 1.3} y={f.y + f.dy * 1.3 + 1} textAnchor="middle" fontSize="2.5" fill={f.color} fontFamily="monospace" fillOpacity={selected && selected !== f.id ? 0.3 : 1}>{f.label}</text>
          </g>
        ))}
      </svg>
      {selected && <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-surface-hi)', border: `1px solid ${forces.find(f => f.id === selected)?.color}55`, borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{forces.find(f => f.id === selected)?.desc}</div>}
    </div>
  )
}

function VelocityDiagram({ visualFocus }: { visualFocus?: string }) {
  const [showVector, setShowVector] = useState(false)

  if (visualFocus === 'definition') {
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>SPEED vs VELOCITY — direction matters</div>
        <svg viewBox="0 0 100 55" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
          <text x="50" y="8" textAnchor="middle" fontSize="3" fill="#6B7299" fontFamily="monospace">Both cars go 60 km/h</text>
          <line x1="10" y1="22" x2="90" y2="22" stroke="#1A1D35" strokeWidth="0.3" />
          <text x="8" y="20" fontSize="3" fill="#00F0FF" fontFamily="monospace">→</text>
          <text x="20" y="22.5" fontSize="3.5" fontFamily="monospace">🚗</text>
          <text x="55" y="20" fontSize="2.8" fill="#00F0FF" fontFamily="monospace">+60 km/h (east)</text>
          <line x1="10" y1="38" x2="90" y2="38" stroke="#1A1D35" strokeWidth="0.3" />
          <text x="8" y="36" fontSize="3" fill="#FF6B2B" fontFamily="monospace">←</text>
          <text x="70" y="38.5" fontSize="3.5" fontFamily="monospace">🚗</text>
          <text x="20" y="36" fontSize="2.8" fill="#FF6B2B" fontFamily="monospace">−60 km/h (west)</text>
          <text x="50" y="50" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">same speed, opposite velocity</text>
        </svg>
      </div>
    )
  }

  if (visualFocus === 'equation') {
    const [speed, setSpeed] = useState(60)
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>VELOCITY = displacement ÷ time (with direction)</div>
        <svg viewBox="0 0 100 50" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <line x1="10" y1="35" x2="90" y2="35" stroke="#1A1D35" strokeWidth="0.5" />
          <text x="8" y="39" fontSize="2.5" fill="#6B7299" fontFamily="monospace">0</text>
          <text x="85" y="39" fontSize="2.5" fill="#6B7299" fontFamily="monospace">100m</text>
          <line x1="10" y1="28" x2={10 + speed * 0.8} y2="28" stroke="#00F0FF" strokeWidth="0.8" markerEnd="url(#varrow2)" />
          <text x="50" y="10" textAnchor="middle" fontSize="3.5" fill="#00F0FF" fontFamily="monospace" fontWeight="bold">v = {speed} km/h EAST</text>
          <text x="50" y="17" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">magnitude + direction = velocity</text>
          <defs><marker id="varrow2" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#00F0FF" /></marker></defs>
        </svg>
        <input type="range" min="10" max="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--cyan)' }} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>CIRCULAR MOTION — constant speed, changing velocity</div>
      <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', cursor: 'pointer' }} onClick={() => setShowVector(v => !v)}>
        <circle cx="50" cy="32" r="20" fill="none" stroke="#1A1D35" strokeWidth="0.5" />
        {[0, 90, 180, 270].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const x = 50 + 20 * Math.cos(rad), y = 32 + 20 * Math.sin(rad)
          const vx = -Math.sin(rad) * 8, vy = Math.cos(rad) * 8
          return (<g key={i}><circle cx={x} cy={y} r="3.5" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.4" /><text x={x} y={y + 1.2} textAnchor="middle" fontSize="3.5">🚗</text>{showVector && <line x1={x} y1={y} x2={x + vx} y2={y + vy} stroke="#00FF88" strokeWidth="0.6" markerEnd="url(#vcircle)" />}</g>)
        })}
        <defs><marker id="vcircle" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#00FF88" /></marker></defs>
        <text x="50" y="8" textAnchor="middle" fontSize="2.8" fill={showVector ? '#00FF88' : '#6B7299'} fontFamily="monospace">{showVector ? 'velocity always tangent to circle' : 'tap to show velocity vectors'}</text>
      </svg>
    </div>
  )
}

function MomentumDiagram({ visualFocus }: { visualFocus?: string }) {
  const [mass, setMass] = useState(5)
  const [vel, setVel] = useState(4)
  const momentum = (mass * vel).toFixed(1)

  if (visualFocus === 'definition') {
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>MOMENTUM = mass × velocity — hard to stop!</div>
        <svg viewBox="0 0 100 50" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
          <line x1="5" y1="40" x2="95" y2="40" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx="15" cy="40" r="3" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.6" />
          <text x="15" y="40.8" textAnchor="middle" fontSize="3.5">🏀</text>
          <line x1="18" y1="35" x2="30" y2="35" stroke="#00F0FF" strokeWidth="0.6" markerEnd="url(#marrow1)" />
          <text x="22" y="30" textAnchor="middle" fontSize="2.5" fill="#00F0FF" fontFamily="monospace">fast</text>
          <circle cx="65" cy="40" r="7" fill="#FF6B2B22" stroke="#FF6B2B" strokeWidth="0.6" />
          <text x="65" y="40.8" textAnchor="middle" fontSize="5">🏈</text>
          <line x1="72" y1="35" x2="80" y2="35" stroke="#FF6B2B" strokeWidth="0.6" markerEnd="url(#marrow2)" />
          <text x="76" y="30" textAnchor="middle" fontSize="2.5" fill="#FF6B2B" fontFamily="monospace">slow</text>
          <text x="50" y="15" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">which has more momentum?</text>
          <defs>
            <marker id="marrow1" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#00F0FF" /></marker>
            <marker id="marrow2" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#FF6B2B" /></marker>
          </defs>
        </svg>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>Both could have equal momentum — it depends on mass × velocity</div>
      </div>
    )
  }

  if (visualFocus === 'equation') {
    return (
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>p = mv — drag to explore</div>
        <svg viewBox="0 0 100 50" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
          <line x1="5" y1="35" x2="95" y2="35" stroke="#1A1D35" strokeWidth="0.5" />
          <circle cx="20" cy="35" r={mass * 0.8} fill="#FF6B2B22" stroke="#FF6B2B" strokeWidth="0.6" />
          <text x="20" y="35.5" textAnchor="middle" fontSize="2.5" fill="#FF6B2B" fontFamily="monospace">{mass}kg</text>
          <line x1={20 + mass * 0.8} y1="28" x2={20 + mass * 0.8 + vel * 4} y2="28" stroke="#00F0FF" strokeWidth="0.8" markerEnd="url(#meq)" />
          <text x="50" y="10" textAnchor="middle" fontSize="4" fill="#9B5DFF" fontFamily="monospace" fontWeight="bold">p = {momentum} kg·m/s</text>
          <text x="50" y="17" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">{mass}kg × {vel}m/s</text>
          <defs><marker id="meq" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#00F0FF" /></marker></defs>
        </svg>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>MASS: {mass}kg</div>
            <input type="range" min="1" max="10" value={mass} onChange={e => setMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#FF6B2B' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>VELOCITY: {vel}m/s</div>
            <input type="range" min="1" max="10" value={vel} onChange={e => setVel(Number(e.target.value))} style={{ width: '100%', accentColor: '#00F0FF' }} />
          </div>
        </div>
      </div>
    )
  }

  const [m1, setM1] = useState(5), [v1, setV1] = useState(4), [m2] = useState(3)
  const v2 = ((m1 * v1) / m2).toFixed(1)
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>CONSERVATION — total momentum before = after</div>
      <svg viewBox="0 0 100 50" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
        <line x1="5" y1="35" x2="95" y2="35" stroke="#1A1D35" strokeWidth="0.5" />
        <circle cx="20" cy="35" r={m1 * 0.7} fill="#9B5DFF22" stroke="#9B5DFF" strokeWidth="0.6" />
        <text x="20" y="35.5" textAnchor="middle" fontSize="2.5" fill="#9B5DFF">{m1}kg</text>
        <line x1={20 + m1 * 0.7} y1="28" x2={20 + m1 * 0.7 + v1 * 3} y2="28" stroke="#9B5DFF" strokeWidth="0.6" markerEnd="url(#mcons)" />
        <circle cx="70" cy="35" r={m2 * 0.7} fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.6" />
        <text x="70" y="35.5" textAnchor="middle" fontSize="2.5" fill="#00F0FF">{m2}kg</text>
        <text x="50" y="10" textAnchor="middle" fontSize="3" fill="#00FF88" fontFamily="monospace">p_before={Number(m1*v1).toFixed(0)} → v₂={v2}m/s after</text>
        <defs><marker id="mcons" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#9B5DFF" /></marker></defs>
      </svg>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>INITIAL VELOCITY: {v1}m/s</div>
      <input type="range" min="1" max="10" value={v1} onChange={e => setV1(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)' }} />
    </div>
  )
}

function OscillationDiagram() {
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const animRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (running) {
      const animate = () => { setTime(t => t + 0.05); animRef.current = requestAnimationFrame(animate) }
      animRef.current = requestAnimationFrame(animate)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [running])
  const x = 50 + 30 * Math.sin(time * 2)
  return (
    <div>
      <svg viewBox="0 0 100 55" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
        <line x1="5" y1="30" x2="95" y2="30" stroke="#1A1D35" strokeWidth="0.3" />
        <circle cx={x} cy="30" r="4" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.8" />
        <text x={x} y="30.8" textAnchor="middle" fontSize="4">⚡</text>
        <text x="50" y="10" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">x = A·sin(ωt)</text>
      </svg>
      <button onClick={() => setRunning(r => !r)} style={{ marginTop: 8, padding: '6px 16px', background: running ? 'var(--red-dim)' : 'var(--cyan-dim)', border: `1px solid ${running ? 'var(--red)' : 'var(--cyan)'}`, borderRadius: 4, color: running ? 'var(--red)' : 'var(--cyan)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>{running ? '⏹ STOP' : '▶ ANIMATE'}</button>
    </div>
  )
}

function GravityDiagram() {
  const [distance, setDistance] = useState(5)
  const force = (100 / (distance * distance)).toFixed(1)
  return (
    <div>
      <svg viewBox="0 0 100 70" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18', marginBottom: 8 }}>
        <circle cx="50" cy="38" r="8" fill="#FF6B2B22" stroke="#FF6B2B" strokeWidth="0.8" />
        <text x="50" y="38.8" textAnchor="middle" fontSize="6">🌍</text>
        <circle cx="50" cy="38" r={Math.min(distance * 6, 38)} fill="none" stroke="#1A1D35" strokeWidth="0.3" strokeDasharray="1 1" />
        <circle cx={50 + Math.min(distance * 6, 38)} cy="38" r="2.5" fill="#00F0FF22" stroke="#00F0FF" strokeWidth="0.6" />
        <text x={50 + Math.min(distance * 6, 38)} y="38.8" textAnchor="middle" fontSize="3">🛸</text>
        <text x="50" y="10" textAnchor="middle" fontSize="3.2" fill="#00F0FF" fontFamily="monospace" fontWeight="bold">F = {force} units</text>
        <text x="50" y="65" textAnchor="middle" fontSize="2.5" fill="#6B7299" fontFamily="monospace">inverse square law: F ∝ 1/r²</text>
      </svg>
      <input type="range" min="2" max="10" value={distance} onChange={e => setDistance(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)' }} />
    </div>
  )
}

function GenericDiagram({ lessonName }: { lessonName: string }) {
  return (
    <svg viewBox="0 0 100 60" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0A0C18' }}>
      <circle cx="50" cy="30" r="18" fill="#00F0FF11" stroke="#00F0FF" strokeWidth="0.5" />
      <text x="50" y="27" textAnchor="middle" fontSize="3.2" fill="#E8EEFF" fontFamily="monospace" fontWeight="bold">{lessonName}</text>
      <text x="50" y="35" textAnchor="middle" fontSize="2.8" fill="#6B7299" fontFamily="monospace">Interactive diagram</text>
    </svg>
  )
}

const DIAGRAMS: Record<string, React.FC<{ lessonName: string; visualFocus?: string }>> = {
  motion: ({ visualFocus }) => <MotionDiagram visualFocus={visualFocus} />,
  force: ({ visualFocus }) => <ForceDiagram visualFocus={visualFocus} />,
  kinetic: ({ visualFocus }) => <KineticEnergyDiagram visualFocus={visualFocus} />,
  potential: ({ visualFocus }) => <EnergyDiagram visualFocus={visualFocus} />,
  conservation: ({ visualFocus }) => <ConservationDiagram visualFocus={visualFocus} />,
  energy: ({ visualFocus }) => <EnergyDiagram visualFocus={visualFocus} />,
  work: ({ visualFocus }) => <EnergyDiagram visualFocus={visualFocus} />,
  velocity: ({ visualFocus }) => <VelocityDiagram visualFocus={visualFocus} />,
  momentum: ({ visualFocus }) => <MomentumDiagram visualFocus={visualFocus} />,
  oscillation: () => <OscillationDiagram />,
  gravity: () => <GravityDiagram />,
  generic: GenericDiagram,
}

// ─────────────────────────────────────────────
// CARD RENDERERS
// ─────────────────────────────────────────────
function HookCardView({ card, onNext }: { card: HookCard; onNext: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 80, marginBottom: 24, animation: 'bossAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        {card.visual}
      </div>
      <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 16 }}>
        DID YOU KNOW?
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 20, lineHeight: 1.3 }}>
        {card.title}
      </h2>
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 32, textAlign: 'left' }}>
        <p style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.8 }}>{card.content}</p>
      </div>
      <button onClick={onNext} style={{
        padding: '14px 48px',
        background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
        border: 'none', borderRadius: 4,
        color: 'var(--bg-base)', fontSize: 15, fontWeight: 900,
        fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
        letterSpacing: 1, boxShadow: '0 0 20px var(--cyan-glow)',
      }}>
        TELL ME MORE →
      </button>
    </div>
  )
}

function ConceptCardView({ card, diagramType, lessonName, onNext }: { card: ConceptCard; diagramType: string; lessonName: string; onNext: () => void }) {
  const DiagramComponent = DIAGRAMS[diagramType] || GenericDiagram
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 32 }}>{card.visual}</span>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>{card.title}</h2>
      </div>

      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.8, marginBottom: card.equation ? 16 : 0 }}>
          {card.content}
        </p>
        {card.equation && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--cyan)',
            borderRadius: 8, padding: '12px 16px', marginTop: 12,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 16, color: 'var(--cyan)', textAlign: 'center',
            boxShadow: '0 0 12px var(--cyan-dim)',
          }}>
            {card.equation}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 12 }}>
          INTERACTIVE DIAGRAM
        </div>
        <DiagramComponent lessonName={lessonName} visualFocus={(card as any).visualFocus} />
      </div>

      <button onClick={onNext} style={{
        width: '100%', padding: '14px',
        background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
        border: 'none', borderRadius: 4,
        color: 'var(--bg-base)', fontSize: 14, fontWeight: 900,
        fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
        letterSpacing: 1, boxShadow: '0 0 20px var(--cyan-glow)',
      }}>
        GOT IT — NEXT →
      </button>
    </div>
  )
}

function CheckCardView({ card, onNext, onSubmit, onQuestionChange, onAnswerSubmit }: {
  card: CheckCard
  onNext: () => void
  onSubmit?: () => void
  onQuestionChange?: (question: string, title: string) => void
  onAnswerSubmit?: (answer: string, correct: boolean) => void
}) {
  const [stage, setStage] = useState<'first' | 'followup'>('first')
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [firstWasWrong, setFirstWasWrong] = useState(false)

  const activeQuestion = stage === 'first' ? card : {
    question: card.followUp?.question || card.question,
    options: card.followUp?.options || card.options,
    correct: card.followUp?.correct ?? card.correct,
    explanation: card.followUp?.explanation || card.explanation,
  }

  const isCorrect = submitted && selected === activeQuestion.correct

  const handleSubmit = () => {
    setSubmitted(true)
    onSubmit?.()
    if (selected !== null) {
      const selectedAnswer = activeQuestion.options[selected]
      const correct = selected === activeQuestion.correct
      onAnswerSubmit?.(selectedAnswer, correct)
    }
  }

  const handleContinueAfterFirst = () => {
    if (isCorrect) {
      onNext()
    } else if (card.followUp) {
      setFirstWasWrong(true)
      setStage('followup')
      setSelected(null)
      setSubmitted(false)
      setShowHint(false)
      onQuestionChange?.(card.followUp.question, '🔄 Second Chance Question')
    } else {
      onNext()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          background: stage === 'followup' ? 'var(--purple-dim)' : 'var(--cyan-dim)',
          border: `1px solid ${stage === 'followup' ? 'var(--purple)' : 'var(--cyan)'}`,
          borderRadius: 20, padding: '4px 14px',
          fontSize: 11, color: stage === 'followup' ? 'var(--purple)' : 'var(--cyan)',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1,
        }}>
          {stage === 'followup' ? '🔄 SECOND CHANCE' : '✓ QUICK CHECK'}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {stage === 'followup' ? 'Same concept, new question' : 'Must answer correctly to continue'}
        </span>
      </div>

      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 20, boxShadow: '0 0 30px var(--cyan-dim)' }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 24 }}>
          {activeQuestion.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeQuestion.options.map((opt, i) => {
            let borderColor = 'var(--border-hi)'
            let bgColor = 'var(--bg-surface-hi)'
            let textColor = 'var(--text-primary)'
            if (submitted && i === activeQuestion.correct) { borderColor = 'var(--green)'; bgColor = 'rgba(0,255,136,0.1)'; textColor = 'var(--green)' }
            else if (submitted && selected === i && i !== activeQuestion.correct) { borderColor = 'var(--red)'; bgColor = 'rgba(255,0,68,0.1)'; textColor = 'var(--red)' }
            else if (selected === i && !submitted) { borderColor = 'var(--cyan)'; bgColor = 'var(--cyan-dim)'; textColor = 'var(--cyan)' }
            return (
              <button key={i} onClick={() => !submitted && setSelected(i)} disabled={submitted}
                style={{ background: bgColor, border: `1px solid ${borderColor}`, borderLeft: `3px solid ${borderColor}`, borderRadius: 4, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: submitted ? 'default' : 'pointer', transition: 'var(--transition)', textAlign: 'left' }}>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', minWidth: 20 }}>{['A', 'B', 'C', 'D'][i]}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{opt}</span>
                {submitted && i === activeQuestion.correct && <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>✓</span>}
                {submitted && selected === i && i !== activeQuestion.correct && <span style={{ marginLeft: 'auto', color: 'var(--red)' }}>✗</span>}
              </button>
            )
          })}
        </div>
      </div>

      {submitted && (
        <div style={{ background: isCorrect ? 'rgba(0,255,136,0.08)' : 'rgba(255,0,68,0.08)', border: `1px solid ${isCorrect ? 'var(--green)' : 'var(--red)'}`, borderRadius: 4, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isCorrect ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>
            {isCorrect ? '🎯 Correct! Great understanding.' : `💡 The correct answer was: "${activeQuestion.options[activeQuestion.correct]}"`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{activeQuestion.explanation}</div>
        </div>
      )}

      {!submitted && stage === 'first' && (
        <button onClick={() => setShowHint(h => !h)} style={{ background: 'transparent', border: '1px solid var(--purple)', borderRadius: 4, padding: '8px 16px', color: 'var(--purple)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', marginBottom: showHint ? 12 : 0 }}>
          🦉 {showHint ? 'HIDE HINT' : 'NEED A HINT?'}
        </button>
      )}

      {showHint && !submitted && stage === 'first' && (
        <div style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          🦉 {card.hint}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {!submitted ? (
          <button onClick={handleSubmit} disabled={selected === null}
            style={{ flex: 1, padding: '13px', background: selected !== null ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--border)', border: 'none', borderRadius: 4, color: selected !== null ? 'var(--bg-base)' : 'var(--text-muted)', fontSize: 14, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: selected !== null ? 'pointer' : 'not-allowed' }}>
            CHECK ANSWER →
          </button>
        ) : stage === 'first' && !isCorrect && card.followUp ? (
          <button onClick={handleContinueAfterFirst}
            style={{ flex: 1, padding: '13px', background: 'var(--purple)', border: 'none', borderRadius: 4, color: 'white', fontSize: 14, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--purple-glow)' }}>
            🔄 TRY A NEW QUESTION →
          </button>
        ) : (
          <button onClick={onNext}
            style={{ flex: 1, padding: '13px', background: isCorrect ? 'var(--cyan)' : 'var(--orange)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 14, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: isCorrect ? '0 0 20px var(--cyan-glow)' : 'none' }}>
            {isCorrect ? 'CONTINUE →' : 'GOT IT — CONTINUE →'}
          </button>
        )}
      </div>
    </div>
  )
}

function SummaryCardView({ card, onNext }: { card: SummaryCard; onNext: () => void }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 48 }}>{card.visual}</span>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginTop: 12 }}>{card.title}</h2>
      </div>

      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 16 }}>
          KEY TAKEAWAYS
        </div>
        {card.points.map((point, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'var(--bg-base)', flexShrink: 0, marginTop: 2 }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{point}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(155,93,255,0.08)', border: '1px solid var(--purple)', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 8 }}>
          🎓 AP EXAM CONNECTION
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{card.apNote}</p>
      </div>

      <button onClick={onNext} style={{
        width: '100%', padding: '14px',
        background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
        border: 'none', borderRadius: 4,
        color: 'var(--bg-base)', fontSize: 14, fontWeight: 900,
        fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
        letterSpacing: 1, boxShadow: '0 0 20px var(--cyan-glow)',
      }}>
        TAKE FINAL QUIZ →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// FINAL QUIZ (3 questions from check cards)
// ─────────────────────────────────────────────
function FinalQuiz({
  cards, diagramType, lessonName, unitId, lessonId, attemptNumber, masteryScore,
  onComplete, onQuestionChange, onAnswerSubmit
}: {
  cards: CheckCard[]
  diagramType: string
  lessonName: string
  unitId: string
  lessonId: string
  attemptNumber: number
  masteryScore: number
  onComplete: (stars: number, xp: number, coins: number) => void
  onQuestionChange?: (question: string, title: string) => void
  onAnswerSubmit?: (answer: string, correct: boolean, submitted: boolean) => void
}) {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [passedCount, setPassedCount] = useState(0)
  const passedRef = useRef(0)
  const [showHint, setShowHint] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (cards.length > 0) {
      onQuestionChange?.(cards[0].question, `Final Quiz — Question 1 of ${cards.length}`)
    }
  }, [])

  const question = cards[currentQ]

  const handleSubmit = () => {
    setSubmitted(true)
    const isCorrect = selected === question.correct
    if (isCorrect) {
      passedRef.current += 1
      setPassedCount(passedRef.current)
    }
    if (selected !== null) {
      onAnswerSubmit?.(question.options[selected], isCorrect, true)
    }
  }

  const handleNext = async () => {
    if (currentQ + 1 < cards.length) {
      const nextIndex = currentQ + 1
      setCurrentQ(nextIndex)
      setSelected(null)
      setSubmitted(false)
      setShowHint(false)
      onAnswerSubmit?.('', false, false)
      onQuestionChange?.(cards[nextIndex].question, `Final Quiz — Question ${nextIndex + 1} of ${cards.length}`)
    } else {
      const finalPassed = passedRef.current
      const stars = finalPassed
      const xp = stars === 3 ? 180 : stars === 2 ? 120 : stars === 1 ? 40 : 0
      const coins = stars === 3 ? 150 : stars === 2 ? 50 : stars === 1 ? 10 : 0

      if (xp > 0) {
        try {
          const newMastery = Math.min(100, Math.round(masteryScore + (stars === 3 ? 5 : stars === 2 ? 2 : 0)))
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'lesson', unitId: Number(unitId), lessonId: Number(lessonId), stars, xpEarned: xp, coinsEarned: coins, attemptNumber, newMastery }),
          })
          if (res.ok) {
            const result = await res.json()
            if (result && !result.error) {
              window.dispatchEvent(new CustomEvent('progress-updated', { detail: result }))
            }
          }
        } catch (err) {
          console.error('Failed to save:', err)
        }
      }

      setDone(true)
      onComplete(stars, xp, coins)
    }
  }

  if (!question) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>
          FINAL QUIZ — QUESTION {currentQ + 1} OF {cards.length}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {cards.map((_, i) => (
            <div key={i} style={{ width: 28, height: 5, borderRadius: 2, background: i < currentQ ? 'var(--cyan)' : i === currentQ ? 'var(--cyan)' : 'var(--border)', opacity: i === currentQ ? 1 : i < currentQ ? 0.6 : 0.3 }} />
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 24 }}>
          {question.question}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options.map((opt, i) => {
            let borderColor = 'var(--border-hi)', bgColor = 'var(--bg-surface-hi)', textColor = 'var(--text-primary)'
            if (submitted && i === question.correct) { borderColor = 'var(--green)'; bgColor = 'rgba(0,255,136,0.1)'; textColor = 'var(--green)' }
            else if (submitted && selected === i && i !== question.correct) { borderColor = 'var(--red)'; bgColor = 'rgba(255,0,68,0.1)'; textColor = 'var(--red)' }
            else if (selected === i && !submitted) { borderColor = 'var(--cyan)'; bgColor = 'var(--cyan-dim)'; textColor = 'var(--cyan)' }
            return (
              <button key={i} onClick={() => !submitted && setSelected(i)} disabled={submitted}
                style={{ background: bgColor, border: `1px solid ${borderColor}`, borderLeft: `3px solid ${borderColor}`, borderRadius: 4, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: submitted ? 'default' : 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', minWidth: 20 }}>{['A', 'B', 'C', 'D'][i]}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{opt}</span>
                {submitted && i === question.correct && <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>✓</span>}
                {submitted && selected === i && i !== question.correct && <span style={{ marginLeft: 'auto', color: 'var(--red)' }}>✗</span>}
              </button>
            )
          })}
        </div>
      </div>

      {submitted && (
        <div style={{ background: selected === question.correct ? 'rgba(0,255,136,0.08)' : 'rgba(255,0,68,0.08)', border: `1px solid ${selected === question.correct ? 'var(--green)' : 'var(--red)'}`, borderRadius: 4, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: selected === question.correct ? 'var(--green)' : 'var(--red)', marginBottom: 4 }}>
            {selected === question.correct ? '🎯 Correct!' : '💡 Not quite'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{question.explanation}</div>
        </div>
      )}

      {!submitted && (
        <button onClick={() => setShowHint(h => !h)} style={{ background: 'transparent', border: '1px solid var(--purple)', borderRadius: 4, padding: '8px 16px', color: 'var(--purple)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', marginBottom: showHint ? 12 : 0 }}>
          🦉 {showHint ? 'HIDE HINT' : 'ASK PARALLAX'}
        </button>
      )}
      {showHint && !submitted && (
        <div style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          🦉 {question.hint}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {!submitted ? (
          <button onClick={handleSubmit} disabled={selected === null}
            style={{ width: '100%', padding: '13px', background: selected !== null ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--border)', border: 'none', borderRadius: 4, color: selected !== null ? 'var(--bg-base)' : 'var(--text-muted)', fontSize: 14, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: selected !== null ? 'pointer' : 'not-allowed' }}>
            SUBMIT ANSWER →
          </button>
        ) : (
          <button onClick={handleNext}
            style={{ width: '100%', padding: '13px', background: 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 14, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
            {currentQ + 1 >= cards.length ? 'FINISH LESSON →' : 'NEXT QUESTION →'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// LESSON AI DRAWER
// ─────────────────────────────────────────────
function LessonAIDrawer({
  isOpen,
  onClose,
  lessonName,
  unitName,
  currentCardType,
  currentCardTitle,
  currentCardContent,
  cardSubmitted,
  masteryScore,
  userAnswer,
  wasCorrect,
}: {
  isOpen: boolean
  onClose: () => void
  lessonName: string
  unitName: string
  currentCardType: string
  currentCardTitle: string
  currentCardContent: string
  cardSubmitted: boolean
  masteryScore: number
  userAnswer?: string
  wasCorrect?: boolean
}) {
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, streaming])

  const greetingSent = useRef(false)
  const lastQuestionRef = useRef('')

  useEffect(() => {
    if (isOpen && !greetingSent.current) {
      greetingSent.current = true
      lastQuestionRef.current = currentCardContent
      const greeting = currentCardType === 'check'
        ? `I'm studying "${lessonName}" and I'm on a check question titled "${currentCardTitle}". The actual question is: "${currentCardContent}". Please help me think through this without giving the answer.`
        : `I'm learning "${lessonName}" — specifically the section "${currentCardTitle}". The content says: "${currentCardContent}". Please explain this concept in a way that builds real understanding.`
      sendMessage(greeting, true)
    }
  }, [isOpen])

  const lastAnswerRef = useRef('')

  useEffect(() => {
    if (!isOpen || !greetingSent.current) return
    if (currentCardContent && currentCardContent !== lastQuestionRef.current) {
      lastQuestionRef.current = currentCardContent
      lastAnswerRef.current = ''
      const contextUpdate = currentCardType === 'check'
        ? `New question: "${currentCardContent}". Please help me think through this without giving the answer.`
        : `New section: "${currentCardTitle}". Content: "${currentCardContent}". Please explain this.`
      sendMessage(contextUpdate, true)
    }
  }, [currentCardContent])

  // When user submits an answer — tell AI what they chose
  useEffect(() => {
    if (!isOpen || !cardSubmitted || !userAnswer) return
    if (userAnswer === lastAnswerRef.current) return
    lastAnswerRef.current = userAnswer

    const answerContext = wasCorrect
      ? `I just answered "${userAnswer}" and I got it correct! Can you explain WHY that answer is right and help me understand the concept more deeply?`
      : `I just answered "${userAnswer}" but I got it wrong. The question was: "${currentCardContent}". Can you explain why my answer was incorrect and help me understand what the right thinking is?`
    sendMessage(answerContext, true)
  }, [cardSubmitted, userAnswer])

  const sendMessage = async (text: string, isAuto = false) => {
    const newConversation = [
      ...conversation,
      { role: 'user' as const, content: text }
    ]
    setConversation(newConversation)
    setLoading(true)
    setStreaming('')

    try {
      const res = await fetch('/api/quiz/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newConversation,
          questionContext: {
            question: currentCardTitle,
            concept: lessonName,
            difficulty: 'medium',
            questionNumber: 1,
            totalQuestions: 1,
          },
          masteryScore,
          correctCount: 0,
          totalCount: 1,
          submitted: currentCardType !== 'check' || cardSubmitted,
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
      setConversation(prev => [...prev, { role: 'assistant' as const, content: full }])
      setStreaming('')
    } catch {
      setConversation(prev => [...prev, { role: 'assistant' as const, content: 'Lost signal momentarily — try again! ⚡' }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 360,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
      animation: 'slideInRight 0.3s ease',
    }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', background: 'var(--purple-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🦉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)' }}>Parallax AI</div>
            <div style={{ fontSize: 9, color: loading ? 'var(--orange)' : 'var(--green)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
              {loading ? '● THINKING...' : currentCardType === 'check' && !cardSubmitted ? '● SOCRATIC MODE' : '● READY TO EXPLAIN'}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
      </div>

      <div style={{ padding: '8px 20px', background: currentCardType === 'check' && !cardSubmitted ? 'rgba(155,93,255,0.08)' : 'rgba(0,255,136,0.06)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: currentCardType === 'check' && !cardSubmitted ? 'var(--purple)' : 'var(--green)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
          {currentCardType === 'check' && !cardSubmitted
            ? '🔒 ASSESSMENT MODE — hints only, no direct answers'
            : '📖 LEARNING MODE — full explanations available'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {conversation.length === 0 && !loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: 20 }}>
            Ask me anything about this lesson ⚡
          </div>
        )}
        {conversation.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              maxWidth: '88%',
              background: msg.role === 'user' ? 'var(--cyan-dim)' : 'var(--bg-surface-hi)',
              border: `1px solid ${msg.role === 'user' ? 'var(--cyan)' : 'var(--border-hi)'}`,
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--text-primary)',
              lineHeight: 1.7,
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && streaming && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ maxWidth: '88%', background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
              {streaming}<span style={{ color: 'var(--purple)', animation: 'pulse-glow 0.8s infinite' }}>▋</span>
            </div>
          </div>
        )}
        {loading && !streaming && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Thinking across the cosmos...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {conversation.length <= 2 && !loading && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(currentCardType === 'check' && !cardSubmitted
            ? ['Give me a hint', 'What concept is this testing?', 'Can you give an analogy?']
            : ['Explain this more simply', 'Give me a real world example', 'How does this appear on AP exams?', 'What comes after this?']
          ).map(prompt => (
            <button key={prompt} onClick={() => { sendMessage(prompt) }} style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: 20, padding: '4px 10px', fontSize: 10, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', transition: 'var(--transition)' }}>
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && input.trim() && !loading) {
                sendMessage(input.trim())
                setInput('')
              }
            }}
            placeholder={currentCardType === 'check' && !cardSubmitted ? 'Ask for a hint...' : 'Ask anything...'}
            style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-hi)', borderRadius: 4, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
          />
          <button
            onClick={() => { if (input.trim() && !loading) { sendMessage(input.trim()); setInput('') } }}
            disabled={!input.trim() || loading}
            style={{ background: input.trim() ? 'var(--purple)' : 'var(--border)', border: 'none', borderRadius: 4, width: 44, cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ▶
          </button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 6, textAlign: 'center' }}>
          Press Enter or ▶ to send
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// AI REVIEW POPUP
// ─────────────────────────────────────────────
function AIReviewPopup({
  lessonName, missedQuestions, onClose, onRetry,
}: {
  lessonName: string
  missedQuestions: string[]
  onClose: () => void
  onRetry: () => void
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')

  useEffect(() => {
    sendMessage(`I just completed the lesson on "${lessonName}" but struggled. I got these wrong: ${missedQuestions.join('; ')}. Can you explain what I'm missing?`)
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
          questionContext: { question: `Lesson: ${lessonName}`, concept: lessonName, difficulty: 'medium', questionNumber: 1, totalQuestions: 1 },
          masteryScore: 50, correctCount: 0, totalCount: missedQuestions.length,
          submitted: true, isCorrect: false,
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
      setMessages(prev => [...prev, { role: 'assistant' as const, content: 'Lost signal — keep going! You can retry the lesson. ⚡' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 560, background: 'var(--bg-surface)', border: '1px solid var(--purple)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 60px var(--purple-glow)', animation: 'bossAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--purple-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🦉</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>Parallax AI — Review Session</div>
              <div style={{ fontSize: 10, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>{loading ? '● EXPLAINING...' : '● READY TO HELP'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ height: 320, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '88%', background: msg.role === 'user' ? 'var(--purple-dim)' : 'var(--bg-surface-hi)', border: `1px solid ${msg.role === 'user' ? 'var(--purple)' : 'var(--border-hi)'}`, borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{msg.content}</div>
            </div>
          ))}
          {loading && streaming && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><div style={{ maxWidth: '88%', background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{streaming}<span style={{ color: 'var(--purple)' }}>▋</span></div></div>}
          {loading && !streaming && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><div style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Parallax AI is thinking...</div></div>}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && input.trim() && !loading) { sendMessage(input.trim()); setInput('') } }} placeholder="Ask a follow-up..." style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-hi)', borderRadius: 4, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
          <button onClick={() => { if (input.trim() && !loading) { sendMessage(input.trim()); setInput('') } }} style={{ background: 'var(--purple)', border: 'none', borderRadius: 4, width: 44, cursor: 'pointer', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>CLOSE</button>
          <button onClick={onRetry} style={{ flex: 2, padding: '12px', background: 'var(--purple)', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 16px var(--purple-glow)' }}>↺ RETRY LESSON</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPLETION SCREEN
// ─────────────────────────────────────────────
const UNIT_LESSON_COUNTS: Record<string, number> = { '1': 5, '2': 4, '3': 5, '4': 5, '5': 4, '6': 5, '7': 4, '8': 5 }

function CompletionScreen({ stars, xp, coins, lessonName, unitId, lessonId, onRetry, onReviewWithAI }: {
  stars: number; xp: number; coins: number; lessonName: string; unitId: string; lessonId: string; onRetry: () => void; onReviewWithAI: () => void
}) {
  const router = useRouter()

  const lessonNum = Number(lessonId) % 100
  const isLastLesson = lessonNum === (UNIT_LESSON_COUNTS[unitId] || 0)

  const getNextLessonId = () => {
    const current = Number(lessonId)
    const unitBase = Math.floor(current / 100) * 100
    return unitBase + lessonNum + 1
  }

  const nextLessonId = getNextLessonId()

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <StarDisplay count={stars} size={52} />
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
        {stars === 3 ? '🌟 Full Mastery!' : stars === 2 ? '✅ Lesson Passed!' : stars === 1 ? '💡 Keep Going!' : '🔄 Try Again!'}
      </h1>

      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{lessonName}</div>

      <div style={{ fontSize: 13, color: stars >= 2 ? 'var(--green)' : 'var(--orange)', marginBottom: 32, fontFamily: 'JetBrains Mono, monospace' }}>
        {stars >= 2 ? '⚡ Next lesson unlocked!' : 'Review and try again to unlock the next lesson'}
      </div>

      {xp > 0 && (
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '20px 28px' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--cyan)', animation: 'bossAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}>
              +{xp} XP
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
              {stars === 3 ? 'MASTERY BONUS' : 'COMPLETION'}
            </div>
          </div>
          {coins > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 12, padding: '20px 24px', animation: 'bossAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both' }}>
              <span style={{ fontSize: 24 }}>🪙</span>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', fontFamily: 'JetBrains Mono, monospace' }}>+{coins}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>COINS</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => router.push(isLastLesson ? `/galaxy?enter=${unitId}` : '/galaxy')}
          style={{ padding: '14px 24px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
          ← GALAXY
        </button>
        {stars <= 1 && (
          <>
            <button onClick={onReviewWithAI}
              style={{ padding: '14px 24px', background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, color: 'var(--purple)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
              🦉 REVIEW WITH AI
            </button>
            <button onClick={onRetry}
              style={{ padding: '14px 24px', background: 'var(--orange)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
              ↺ RETRY
            </button>
          </>
        )}
        {stars >= 2 && (
          isLastLesson
            ? <button onClick={() => router.push(`/boss/${unitId}`)}
                style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #FF0044, var(--purple))', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px #FF004466' }}>
                ⚔️ GO TO BOSS →
              </button>
            : <button onClick={() => router.push(`/learn/${unitId}/${nextLessonId}`)}
                style={{ padding: '14px 28px', background: stars === 3 ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
                {stars === 3 ? '🌟 NEXT LESSON →' : 'NEXT LESSON →'}
              </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.lessonId as string
  const unitId = params.unitId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lessonData, setLessonData] = useState<LessonData | null>(null)
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [missedConcepts, setMissedConcepts] = useState<string[]>([])
  const [learningStyle] = useState<LearningStyle>('intuitive')
  const masteryScore = 67

  // Card navigation
  const [cardIndex, setCardIndex] = useState(0)
  const [phase, setPhase] = useState<'cards' | 'quiz' | 'complete'>('cards')

  // Completion state
  const [finalStars, setFinalStars] = useState(0)
  const [finalXP, setFinalXP] = useState(0)
  const [finalCoins, setFinalCoins] = useState(0)
  const [showReview, setShowReview] = useState(false)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [aiCardSubmitted, setAiCardSubmitted] = useState(false)
  const [liveQuestionContent, setLiveQuestionContent] = useState<string>('')
  const [liveQuestionTitle, setLiveQuestionTitle] = useState<string>('')
  const [userAnswer, setUserAnswer] = useState<string>('')
  const [wasCorrect, setWasCorrect] = useState<boolean | undefined>(undefined)

  const fetchLesson = async (attempt: number, missed: string[], style: LearningStyle) => {
    setLoading(true)
    setError(null)
    setCardIndex(0)
    setPhase('cards')
    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, attemptNumber: attempt, masteryScore, missedConcepts: missed, preferredStyle: style }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setLessonData(data)
    } catch (err) {
      setError('Failed to load lesson. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setAttemptNumber(1)
    setMissedConcepts([])
    setFinalStars(0)
    setFinalXP(0)
    setFinalCoins(0)
    setShowReview(false)
    setAiDrawerOpen(false)
    setAiCardSubmitted(false)
    setLiveQuestionContent('')
    setLiveQuestionTitle('')
    setUserAnswer('')
    setWasCorrect(undefined)
    fetchLesson(1, [], learningStyle)
  }, [lessonId])

  const handleNextCard = () => {
    if (!lessonData) return
    setLiveQuestionContent('')
    setLiveQuestionTitle('')
    setAiCardSubmitted(false)
    if (cardIndex + 1 < lessonData.cards.length) {
      setCardIndex(i => i + 1)
    } else {
      setPhase('quiz')
    }
  }

  const handleComplete = (stars: number, xp: number, coins: number) => {
    setFinalStars(stars)
    setFinalXP(xp)
    setFinalCoins(coins)
    setPhase('complete')
    if (stars <= 1) {
      const wrongCards = lessonData?.cards
        .filter((c): c is CheckCard => c.type === 'check')
        .map(c => c.question) || []
      setMissedConcepts(wrongCards)
      setTimeout(() => setShowReview(true), 1200)
    }
  }

  const handleRetry = () => {
    const newAttempt = attemptNumber + 1
    setAttemptNumber(newAttempt)
    fetchLesson(newAttempt, missedConcepts, learningStyle)
  }

  // Loading screen
  if (loading) {
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
                {attemptNumber > 1 ? `ADAPTING LESSON... ATTEMPT ${attemptNumber}` : 'BUILDING YOUR LESSON...'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                Parallax AI is preparing interactive content
              </div>
            </>
          )}
        </main>
      </div>
    )
  }

  if (!lessonData) return null

  const currentCard = lessonData.cards[cardIndex]
  const checkCards = lessonData.cards.filter((c): c is CheckCard => c.type === 'check')
  const totalCards = lessonData.cards.length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      {/* Floating AI tutor button — always visible during lesson */}
      {phase !== 'complete' && (
        <button
          onClick={() => setAiDrawerOpen(o => !o)}
          style={{
            position: 'fixed',
            bottom: 32,
            right: aiDrawerOpen ? 376 : 24,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: aiDrawerOpen ? 'var(--purple)' : 'var(--purple-dim)',
            border: '2px solid var(--purple)',
            cursor: 'pointer',
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px var(--purple-glow)',
            transition: 'right 0.3s ease',
            zIndex: 51,
          }}>
          🦉
        </button>
      )}

      {/* AI Drawer */}
      {aiDrawerOpen && lessonData && (() => {
        const activeCard = phase === 'quiz'
          ? null
          : lessonData.cards[cardIndex]
        const cardContent = liveQuestionContent || (activeCard
          ? activeCard.type === 'check'
            ? (activeCard as CheckCard).question
            : activeCard.type === 'concept'
            ? (activeCard as ConceptCard).content
            : activeCard.type === 'hook'
            ? (activeCard as HookCard).content
            : activeCard.type === 'summary'
            ? (activeCard as SummaryCard).points.join(' | ')
            : ''
          : 'Final Quiz — testing all concepts from this lesson')

        return (
          <LessonAIDrawer
            isOpen={aiDrawerOpen}
            onClose={() => setAiDrawerOpen(false)}
            lessonName={lessonData.meta.lessonName}
            unitName={lessonData.meta.unitName}
            currentCardType={phase === 'quiz' ? 'check' : (activeCard?.type || 'concept')}
            currentCardTitle={liveQuestionTitle || (phase === 'quiz' ? 'Final Quiz' : (activeCard?.title || lessonData.meta.lessonName))}
            currentCardContent={cardContent}
            cardSubmitted={aiCardSubmitted}
            masteryScore={masteryScore}
            userAnswer={userAnswer}
            wasCorrect={wasCorrect}
          />
        )
      })()}

      {showReview && (
        <AIReviewPopup
          lessonName={lessonData.meta.lessonName}
          missedQuestions={missedConcepts}
          onClose={() => setShowReview(false)}
          onRetry={() => { setShowReview(false); handleRetry() }}
        />
      )}
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title={`${lessonData.meta.unitName.toUpperCase()} · ${lessonData.meta.lessonName.toUpperCase()}`} activeTab="Energy" />

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: 720 }}>

            {/* Progress bar — cards phase */}
            {phase === 'cards' && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
                    {lessonData.meta.lessonName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {cardIndex + 1} / {totalCards}
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${((cardIndex + 1) / totalCards) * 100}%`, background: 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: 2, transition: 'width 0.5s ease', boxShadow: '0 0 8px var(--cyan-glow)' }} />
                </div>
              </div>
            )}

            {/* Cards phase */}
            {phase === 'cards' && currentCard && (
              <>
                {currentCard.type === 'hook' && <HookCardView card={currentCard} onNext={handleNextCard} />}
                {currentCard.type === 'concept' && <ConceptCardView card={currentCard} diagramType={lessonData.diagramType} lessonName={lessonData.meta.lessonName} onNext={handleNextCard} />}
                {currentCard.type === 'check' && (
                <CheckCardView
                  card={currentCard}
                  onNext={() => { setAiCardSubmitted(false); setLiveQuestionContent(''); setLiveQuestionTitle(''); setUserAnswer(''); setWasCorrect(undefined); handleNextCard() }}
                  onSubmit={() => setAiCardSubmitted(true)}
                  onQuestionChange={(q, t) => { setLiveQuestionContent(q); setLiveQuestionTitle(t) }}
                  onAnswerSubmit={(answer, correct) => { setUserAnswer(answer); setWasCorrect(correct) }}
                />
              )}
                {currentCard.type === 'summary' && <SummaryCardView card={currentCard} onNext={handleNextCard} />}
              </>
            )}

            {/* Final quiz phase */}
            {phase === 'quiz' && (
              <FinalQuiz
                cards={lessonData.finalQuiz || checkCards}
                diagramType={lessonData.diagramType}
                lessonName={lessonData.meta.lessonName}
                unitId={unitId}
                lessonId={lessonId}
                attemptNumber={attemptNumber}
                masteryScore={masteryScore}
                onComplete={handleComplete}
                onQuestionChange={(q, t) => { setLiveQuestionContent(q); setLiveQuestionTitle(t); setUserAnswer(''); setWasCorrect(undefined) }}
                onAnswerSubmit={(answer, correct, submitted) => {
                  setUserAnswer(answer)
                  setWasCorrect(correct)
                  setAiCardSubmitted(submitted)
                }}
              />
            )}

            {/* Completion phase */}
            {phase === 'complete' && (
              <CompletionScreen
                stars={finalStars}
                xp={finalXP}
                coins={finalCoins}
                lessonName={lessonData.meta.lessonName}
                unitId={unitId}
                lessonId={lessonId}
                onRetry={handleRetry}
                onReviewWithAI={() => setShowReview(true)}
              />
            )}

          </div>
        </div>
      </main>

      <style>{`
        @keyframes bossAppear { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 60% { transform: scale(1.2) rotate(10deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes starPop { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 70% { transform: scale(1.3) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
