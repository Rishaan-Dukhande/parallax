'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

interface BossQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
  concept: string
  baseDamage: number
  difficulty: string
}

interface Power {
  id: string
  name: string
  icon: string
  description: string
  duration?: number
}

interface Bullet {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  owner: 'boss' | 'player'
  color: string
}

const AVAILABLE_POWERS: Power[] = [
  { id: 'speed_boost', name: 'SPEED BOOST', icon: '⚡', description: 'Your bullets move 2× faster for 20s', duration: 20 },
  { id: 'shield', name: 'SHIELD', icon: '🛡', description: 'Next wrong defense = no heart lost' },
  { id: 'overcharge', name: 'OVERCHARGE', icon: '💥', description: 'Next hit deals 3× damage' },
  { id: 'magnet', name: 'STAMINA MAGNET', icon: '🧲', description: 'Stamina drains slower for 15s', duration: 15 },
  { id: 'precision', name: 'PRECISION', icon: '🎯', description: '+10s on your next attack question' },
  { id: 'chain', name: 'CHAIN REACTION', icon: '🔥', description: '2 correct attacks in a row = auto 500 dmg' },
  { id: 'nova', name: 'NOVA BLAST', icon: '🌟', description: 'Instant 2000 damage to boss' },
  { id: 'rapid', name: 'RAPID FIRE', icon: '🌀', description: 'Bullets cost 0 stamina for 10s', duration: 10 },
]

const UNIT_HEARTS: Record<number, number> = {
  1: 5, 2: 5, 3: 4, 4: 4, 5: 3, 6: 3, 7: 3,
}

const BOSS_MAX_HP = 15000

function BossSprite({ phase, hit }: { phase: number; hit: boolean }) {
  const color = phase === 2 ? '#FF0044' : '#00F0FF'
  return (
    <div style={{
      animation: hit ? 'bossHit 0.3s ease' : phase === 2 ? 'bossRage 0.4s ease-in-out infinite' : 'bossFloat 3s ease-in-out infinite',
      filter: `drop-shadow(0 0 ${phase === 2 ? 20 : 12}px ${phase === 2 ? 'rgba(255,0,68,0.7)' : 'rgba(0,240,255,0.5)'})`,
    }}>
      <svg viewBox="0 0 64 48" width="110" height="82">
        <rect x="20" y="18" width="24" height="16" fill={`${color}33`} stroke={color} strokeWidth="1.5" rx="2" />
        <rect x="26" y="10" width="12" height="12" fill={`${color}55`} stroke={color} strokeWidth="1.5" rx="2" />
        <rect x="28" y="13" width="3" height="3" fill={phase === 2 ? '#FF0044' : color} />
        <rect x="33" y="13" width="3" height="3" fill={phase === 2 ? '#FF0044' : color} />
        <polygon points="20,26 6,36 10,18" fill={`${color}44`} stroke={color} strokeWidth="1" />
        <polygon points="44,26 58,36 54,18" fill={`${color}44`} stroke={color} strokeWidth="1" />
        <rect x="24" y="34" width="4" height="5" fill={phase === 2 ? '#FF6B2B' : '#9B5DFF'} rx="1" />
        <rect x="30" y="34" width="4" height="7" fill={phase === 2 ? '#FF0044' : '#00F0FF'} rx="1" />
        <rect x="36" y="34" width="4" height="5" fill={phase === 2 ? '#FF6B2B' : '#9B5DFF'} rx="1" />
        {phase === 2 && (
          <>
            <rect x="8" y="20" width="9" height="2.5" fill="#FF0044" rx="1" />
            <rect x="47" y="20" width="9" height="2.5" fill="#FF0044" rx="1" />
            <circle cx="12" cy="21" r="2" fill="#FF6B2B" />
            <circle cx="52" cy="21" r="2" fill="#FF6B2B" />
          </>
        )}
      </svg>
    </div>
  )
}

function PlayerShipSprite({ invincible }: { invincible: boolean }) {
  return (
    <div style={{
      filter: invincible ? 'drop-shadow(0 0 12px #FFD700) brightness(1.5)' : 'drop-shadow(0 0 8px rgba(0,240,255,0.8))',
      animation: invincible ? 'blink 0.2s ease-in-out infinite' : 'none',
    }}>
      <svg viewBox="0 0 32 32" width="52" height="52">
        <polygon points="16,2 24,26 16,22 8,26" fill="#00F0FF33" stroke="#00F0FF" strokeWidth="1.5" />
        <rect x="13" y="10" width="6" height="6" fill="#00F0FF" rx="1" />
        <rect x="14" y="26" width="4" height="6" fill="#9B5DFF" rx="1" />
      </svg>
    </div>
  )
}

function PowerSelection({ powers, onSelect }: { powers: Power[]; onSelect: (p: Power) => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 520, width: '100%', padding: '0 20px' }}>
        <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 3, marginBottom: 8 }}>🎯 BOSS HIT!</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 24 }}>Choose Your Upgrade</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {powers.map(power => (
            <button key={power.id} onClick={() => onSelect(power)}
              style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--cyan)', borderRadius: 12, padding: '18px 14px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cyan-dim)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{power.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 6 }}>{power.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{power.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuestionOverlay({
  question, timeLimit, mode, onAnswer,
}: {
  question: BossQuestion
  timeLimit: number
  mode: 'attack' | 'defense' | 'stamina'
  onAnswer: (correct: boolean, timeUsed: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (submitted) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); handleSubmit(-1); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [submitted])

  const handleSubmit = (idx: number) => {
    if (submitted) return
    setSubmitted(true)
    const timeUsed = (Date.now() - startTime.current) / 1000
    const correct = idx === question.correct
    setTimeout(() => onAnswer(correct, timeUsed), 1400)
  }

  const modeConfig = {
    attack: { label: '💥 DEAL DAMAGE', color: 'var(--cyan)', sub: 'Correct = damage boss + upgrade. Wrong = no damage.' },
    defense: { label: '🛡 INCOMING ATTACK', color: '#FF0044', sub: 'Correct = survive + stamina. Wrong = lose a heart.' },
    stamina: { label: '🧲 STAMINA RECHARGE', color: 'var(--purple)', sub: 'No hearts at risk. Correct = +35 stamina. Wrong = +10.' },
  }[mode]

  const timerPct = (timeLeft / timeLimit) * 100
  const timerColor = timeLeft > timeLimit * 0.5 ? modeConfig.color : timeLeft > timeLimit * 0.25 ? '#FF6B2B' : '#FF0044'
  const isCorrect = submitted && selected === question.correct

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 560, animation: 'slideUp 0.25s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${modeConfig.color}18`, border: `1px solid ${modeConfig.color}55`, borderRadius: 20, padding: '6px 18px' }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: modeConfig.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>{modeConfig.label}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{modeConfig.sub}</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{question.concept}</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: timerColor, fontFamily: 'JetBrains Mono, monospace' }}>{timeLeft}s</span>
          </div>
          <div style={{ height: 6, background: '#1A1D35', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: 3, transition: 'width 1s linear, background 0.3s', boxShadow: `0 0 8px ${timerColor}` }} />
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: `1px solid ${modeConfig.color}44`, borderRadius: 10, padding: '20px 24px', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>{question.question}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {question.options.map((opt, i) => {
            let bg = 'var(--bg-surface)', border = 'var(--border-hi)', color = 'var(--text-primary)'
            if (submitted && i === question.correct) { bg = 'rgba(0,255,136,0.1)'; border = 'var(--green)'; color = 'var(--green)' }
            else if (submitted && selected === i && i !== question.correct) { bg = 'rgba(255,0,68,0.1)'; border = '#FF0044'; color = '#FF0044' }
            else if (selected === i && !submitted) { bg = `${modeConfig.color}18`; border = modeConfig.color; color = modeConfig.color }
            return (
              <button key={i} onClick={() => { if (!submitted) { setSelected(i); handleSubmit(i) } }} disabled={submitted}
                style={{ background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${border}`, borderRadius: 6, padding: '13px 16px', cursor: submitted ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', minWidth: 18 }}>{['A', 'B', 'C', 'D'][i]}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color, flex: 1 }}>{opt}</span>
                {submitted && i === question.correct && <span style={{ color: 'var(--green)' }}>✓</span>}
                {submitted && selected === i && i !== question.correct && <span style={{ color: '#FF0044' }}>✗</span>}
              </button>
            )
          })}
        </div>
        {submitted && (
          <div style={{ background: isCorrect ? 'rgba(0,255,136,0.06)' : 'rgba(255,0,68,0.06)', border: `1px solid ${isCorrect ? 'var(--green)' : '#FF0044'}`, borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: isCorrect ? 'var(--green)' : '#FF0044' }}>
              {mode === 'attack' && (isCorrect ? '💥 Direct hit! ' : '❌ Missed — no damage. ')}
              {mode === 'defense' && (isCorrect ? '🛡 Dodged! ' : '💔 Hit! ')}
              {mode === 'stamina' && (isCorrect ? '🧲 Recharged! ' : '⚡ Partial. ')}
            </span>
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BossBattlePage() {
  const params = useParams()
  const router = useRouter()
  const unitId = Number(params.unitId)
  const maxHearts = UNIT_HEARTS[unitId] || 3
  const unitName = ['', 'Kinematics', "Newton's Laws", 'Work & Energy', 'Momentum', 'Universal Gravity', 'Oscillations', 'E&M Fields'][unitId] || 'Unknown'

  const [gamePhase, setGamePhase] = useState<'intro' | 'battle' | 'power' | 'victory' | 'defeat'>('intro')
  const [battlePhase, setBattlePhase] = useState<1 | 2>(1)
  const [bossHP, setBossHP] = useState(BOSS_MAX_HP)
  const [bossHit, setBossHit] = useState(false)

  // Boss movement
  const [bossX, setBossX] = useState(50)
  const bossXRef = useRef(50)
  const bossVXRef = useRef(0.3)  // boss horizontal velocity
  const [bossY, setBossY] = useState(12)
  const bossYRef = useRef(12)
  const bossVYRef = useRef(0)

  const [playerX, setPlayerX] = useState(50)
  const [hearts, setHearts] = useState(maxHearts)
  const [stamina, setStamina] = useState(100)
  const [invincible, setInvincible] = useState(false)

  const [activePowers, setActivePowers] = useState<string[]>([])
  const [pendingPowers, setPendingPowers] = useState<Power[]>([])
  const [shieldActive, setShieldActive] = useState(false)
  const [overchargeActive, setOverchargeActive] = useState(false)

  const [bullets, setBullets] = useState<Bullet[]>([])
  const bulletIdRef = useRef(0)
  const animFrameRef = useRef<number | undefined>(undefined)

  const [questions, setQuestions] = useState<BossQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [activeQuestion, setActiveQuestion] = useState<BossQuestion | null>(null)
  const [questionMode, setQuestionMode] = useState<'attack' | 'defense' | 'stamina'>('attack')
  const [loadingQ, setLoadingQ] = useState(false)
  const askedRef = useRef<string[]>([])

  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)
  const [startTime] = useState(Date.now())
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [savedBossHP, setSavedBossHP] = useState(BOSS_MAX_HP)
  const [boostedRetry, setBoostedRetry] = useState(false)
  const [boostedHearts, setBoostedHearts] = useState(maxHearts)

  // Input tracking
  const keysRef = useRef<Record<string, boolean>>({})
  const playerXRef = useRef(50)
  const staminaRef = useRef(100)
  const activePowersRef = useRef<string[]>([])
  const gamePhaseRef = useRef<string>('intro')
  const activeQuestionRef = useRef<BossQuestion | null>(null)
  const heartsRef = useRef(maxHearts)
  const invincibleRef = useRef(false)
  const battlePhaseRef = useRef<1 | 2>(1)
  const isMovingRef = useRef(false)
  const isFiringRef = useRef(false)
  const staminaAutoTriggeredRef = useRef(false)
  const qIndexRef = useRef(0)
  const questionsRef = useRef<BossQuestion[]>([])
  const bulletsRef = useRef<Bullet[]>([])

  // Sync refs
  useEffect(() => { playerXRef.current = playerX }, [playerX])
  useEffect(() => { staminaRef.current = stamina }, [stamina])
  useEffect(() => { activePowersRef.current = activePowers }, [activePowers])
  useEffect(() => { gamePhaseRef.current = gamePhase }, [gamePhase])
  useEffect(() => { activeQuestionRef.current = activeQuestion }, [activeQuestion])
  useEffect(() => { heartsRef.current = hearts }, [hearts])
  useEffect(() => { invincibleRef.current = invincible }, [invincible])
  useEffect(() => { qIndexRef.current = qIndex }, [qIndex])
  useEffect(() => { questionsRef.current = questions }, [questions])

  const loadQuestions = useCallback(async (phase: 1 | 2) => {
    setLoadingQ(true)
    try {
      const res = await fetch('/api/quiz/boss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, phase, previousQuestions: askedRef.current }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setQuestions(prev => {
        const updated = [...prev, ...(data.questions || [])]
        questionsRef.current = updated
        return updated
      })
    } catch (err) {
      console.error('Boss Q error:', err)
    } finally {
      setLoadingQ(false)
    }
  }, [unitId])

  const triggerQuestion = useCallback((mode: 'attack' | 'defense' | 'stamina') => {
    if (activeQuestionRef.current) return
    const idx = qIndexRef.current
    const q = questionsRef.current[idx]
    if (!q) return
    askedRef.current.push(q.question)
    setActiveQuestion(q)
    activeQuestionRef.current = q
    setQuestionMode(mode)
    setQIndex(i => {
      const next = i + 1
      qIndexRef.current = next
      if (next >= questionsRef.current.length - 2) {
        loadQuestions(battlePhase)
      }
      return next
    })
  }, [loadQuestions, battlePhase])

  const startBattle = async () => {
    // Only load questions and set phase
    // Don't reset hearts or stamina here — those are set before calling startBattle
    // or set by handleRetryFullBoost directly
    if (questions.length === 0) {
      await loadQuestions(1)
    }
    setGamePhase('battle')
    gamePhaseRef.current = 'battle'
  }

  // ── Keyboard input ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
      if (e.code === 'Space') {
        e.preventDefault()
        if (gamePhaseRef.current !== 'battle' || activeQuestionRef.current) return
        const cost = activePowersRef.current.includes('rapid') ? 0 : 12
        if (staminaRef.current < cost) return
        setStamina(s => { const n = Math.max(0, s - cost); staminaRef.current = n; return n })
        isFiringRef.current = true
        setTimeout(() => { isFiringRef.current = false }, 200)
        setBullets(prev => [...prev, {
          id: bulletIdRef.current++,
          x: playerXRef.current, y: 82,
          vx: 0, vy: -2.2,
          owner: 'player', color: '#00F0FF',
        }])
      }
    }
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  // ── Click to fire ──
  const handleArenaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gamePhaseRef.current !== 'battle' || activeQuestionRef.current) return
    const cost = activePowersRef.current.includes('rapid') ? 0 : 12
    if (staminaRef.current < cost) return
    setStamina(s => { const n = Math.max(0, s - cost); staminaRef.current = n; return n })
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const dx = clickX - playerXRef.current
    const dist = Math.sqrt(dx * dx + 70 * 70)
    setBullets(prev => [...prev, {
      id: bulletIdRef.current++,
      x: playerXRef.current, y: 82,
      vx: (dx / dist) * 2.5,
      vy: -(70 / dist) * 2.5,
      owner: 'player', color: '#00F0FF',
    }])
  }, [])

  // ── Manual stamina button ──
  const handleGetStamina = useCallback(() => {
    if (activeQuestionRef.current) return
    triggerQuestion('stamina')
  }, [triggerQuestion])

  // ── Stamina drain — only while moving or firing ──
  useEffect(() => {
    if (gamePhase !== 'battle') return
    const drain = setInterval(() => {
      const moving = isMovingRef.current
      const firing = isFiringRef.current
      const hasMagnet = activePowersRef.current.includes('magnet')
      // Only drain while actively moving or firing
      if (!moving && !firing) return
      const rate = hasMagnet ? 0.5 : firing ? 2.0 : 1.0
      setStamina(s => { const n = Math.max(0, s - rate); staminaRef.current = n; return n })
    }, 100)
    return () => clearInterval(drain)
  }, [gamePhase])

  // ── Boss movement ──
  useEffect(() => {
    if (gamePhase !== 'battle') return
    const xSpeed = battlePhase === 2 ? 0.55 : 0.3

    const move = setInterval(() => {
      // X movement — same for both phases
      setBossX(x => {
        let nx = x + bossVXRef.current * xSpeed
        if (nx > 82) { bossVXRef.current = -Math.abs(bossVXRef.current); nx = 82 }
        if (nx < 18) { bossVXRef.current = Math.abs(bossVXRef.current); nx = 18 }
        if (Math.random() < 0.008) bossVXRef.current *= -1
        bossXRef.current = nx
        return nx
      })

      // Y movement — only in Phase 2 (dodge incoming player bullets)
      if (battlePhase === 2) {
        setBossY(y => {
          // Find closest player bullet
          const playerBullets = bulletsRef.current.filter(b => b.owner === 'player')
          let dodgeVY = 0

          if (playerBullets.length > 0) {
            // Find the bullet closest to boss
            const closest = playerBullets.reduce((best, b) => {
              const distToBoss = Math.abs(b.x - bossXRef.current) + Math.abs(b.y - bossYRef.current)
              const distToBest = Math.abs(best.x - bossXRef.current) + Math.abs(best.y - bossYRef.current)
              return distToBoss < distToBest ? b : best
            })

            const bulletDist = Math.sqrt(
              Math.pow(closest.x - bossXRef.current, 2) +
              Math.pow(closest.y - bossYRef.current, 2)
            )

            // If bullet is within 30% range and heading toward boss
            if (bulletDist < 30 && closest.vy < 0) {
              // Dodge — move away from bullet's X trajectory
              dodgeVY = closest.x < bossXRef.current ? -0.3 : 0.3
              // Also move vertically to evade
              bossVYRef.current = closest.y < bossYRef.current ? 0.4 : -0.4
            }
          }

          // Apply velocity with dampening
          bossVYRef.current *= 0.95
          let ny = y + bossVYRef.current + dodgeVY

          // Keep boss in upper portion of screen (5% to 35%)
          if (ny > 32) { bossVYRef.current = -Math.abs(bossVYRef.current); ny = 32 }
          if (ny < 5) { bossVYRef.current = Math.abs(bossVYRef.current); ny = 5 }

          bossYRef.current = ny
          return ny
        })
      }
    }, 16)
    return () => clearInterval(move)
  }, [gamePhase, battlePhase])

  // ── Boss firing ──
  useEffect(() => {
    if (gamePhase !== 'battle') return
    const interval = battlePhase === 1 ? 1800 : 1100
    const fire = setInterval(() => {
      if (activeQuestionRef.current) return
      const bx = bossXRef.current
      const px = playerXRef.current
      // Direction vector from boss to player
      const dx = px - bx
      const dy = 82 - bossYRef.current  // boss Y is dynamic
      const dist = Math.sqrt(dx * dx + dy * dy)
      // Normalize and scale — use percentage units directly
      const speed = battlePhase === 1 ? 0.9 : 1.4
      const spread = battlePhase === 1 ? 0.1 : 0.2  // slight random spread
      const vx = (dx / dist) * speed + (Math.random() * spread * 2 - spread)
      const vy = (dy / dist) * speed

      const newBullets: Bullet[] = [{
        id: bulletIdRef.current++,
        x: bx, y: bossYRef.current + 8,
        vx, vy,
        owner: 'boss',
        color: battlePhase === 2 ? '#FF0044' : '#FF6B2B',
      }]

      // Phase 2: extra spread bullets
      if (battlePhase === 2) {
        newBullets.push(
          { id: bulletIdRef.current++, x: bx, y: bossYRef.current + 8, vx: vx + 0.4, vy, owner: 'boss', color: '#FF6B2B' },
          { id: bulletIdRef.current++, x: bx, y: bossYRef.current + 8, vx: vx - 0.4, vy, owner: 'boss', color: '#FF0044' },
        )
      }
      setBullets(prev => [...prev, ...newBullets])
    }, interval)
    return () => clearInterval(fire)
  }, [gamePhase, battlePhase])

  // ── Main game loop ──
  useEffect(() => {
    if (gamePhase !== 'battle') return
    const PLAYER_SPEED = 0.7

    const tick = () => {
      // Player movement — blocked when stamina is 0
      if (!activeQuestionRef.current) {
        const movingLeft = keysRef.current['ArrowLeft'] || keysRef.current['KeyA']
        const movingRight = keysRef.current['ArrowRight'] || keysRef.current['KeyD']
        const hasStamina = staminaRef.current > 0

        // Only move if stamina available
        if (hasStamina) {
          isMovingRef.current = movingLeft || movingRight
          if (movingLeft) {
            setPlayerX(x => { const nx = Math.max(5, x - PLAYER_SPEED); playerXRef.current = nx; return nx })
          }
          if (movingRight) {
            setPlayerX(x => { const nx = Math.min(95, x + PLAYER_SPEED); playerXRef.current = nx; return nx })
          }
        } else {
          isMovingRef.current = false
          // Stamina hit 0 — auto-trigger stamina question if not already showing
          if (!staminaAutoTriggeredRef.current) {
            staminaAutoTriggeredRef.current = true
            triggerQuestion('stamina')
          }
        }
      } else {
        isMovingRef.current = false
      }

      // Move bullets + collision
      bulletsRef.current = bullets
      setBullets(prev => {
        const remaining: Bullet[] = []
        for (const b of prev) {
          const nx = b.x + b.vx
          const ny = b.y + b.vy

          // Out of bounds
          if (ny < -5 || ny > 105 || nx < -10 || nx > 110) continue

          if (b.owner === 'player') {
            // Hit boss — check proximity to boss position
            const dbx = nx - bossXRef.current
            const dby = ny - bossYRef.current
            if (Math.sqrt(dbx * dbx + dby * dby) < 12) {
              if (!activeQuestionRef.current) {
                triggerQuestion('attack')
              }
              continue
            }
            remaining.push({ ...b, x: nx, y: ny })
          } else {
            // Hit player — tighter radius in Phase 2 (must nearly touch ship)
            const dpx = nx - playerXRef.current
            const dpy = ny - 84
            const hitRadius = battlePhaseRef.current === 2 ? 4.5 : 9
            if (Math.sqrt(dpx * dpx + dpy * dpy) < hitRadius) {
              if (!invincibleRef.current && !activeQuestionRef.current) {
                triggerQuestion('defense')
              }
              continue
            }
            remaining.push({ ...b, x: nx, y: ny })
          }
        }
        return remaining
      })

      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [gamePhase, triggerQuestion])

  // ── Phase transition ──
  useEffect(() => {
    if (bossHP <= BOSS_MAX_HP / 2 && battlePhase === 1) {
      setBattlePhase(2)
      battlePhaseRef.current = 2
      loadQuestions(2)
      // Phase 2: boss changes direction more erratically
      bossVXRef.current = 0.6
    }
    if (bossHP <= 0) setGamePhase('victory')
  }, [bossHP, battlePhase, loadQuestions])

  // ── Save victory to Supabase ──
  useEffect(() => {
    if (gamePhase !== 'victory') return
    const timeMinutes = Math.round((Date.now() - startTime) / 60000)
    const heartsBonus = hearts * 100
    const speedBonus = timeMinutes < 5 ? 200 : timeMinutes < 8 ? 100 : 0
    const finalXP = 500 + heartsBonus + speedBonus + Math.floor(score / 10)
    const finalCoins = Math.floor(finalXP / 3)
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'quiz',
        topic: `boss-unit-${unitId}`,
        score: correctCount,
        totalQuestions: totalCount,
        xpEarned: finalXP,
        masteryDelta: 10,
        newMastery: Math.min(100, 67 + 10),
      }),
    }).then(res => res.json()).then(updated => {
      if (updated && !updated.error) {
        window.dispatchEvent(new CustomEvent('progress-updated', { detail: updated }))
      }
    }).catch(console.error)
  }, [gamePhase])

  // ── Handle answer ──
  const handleAnswer = useCallback((correct: boolean, timeUsed: number) => {
    setActiveQuestion(null)
    activeQuestionRef.current = null
    setTotalCount(t => t + 1)

    if (questionMode === 'attack') {
      if (correct) {
        setCorrectCount(c => c + 1)
        let damage = 300
        const speedBonus = Math.max(0, 1 - timeUsed / 30)
        damage = Math.round(damage * (1 + speedBonus))
        if (overchargeActive) { damage *= 3; setOverchargeActive(false); setActivePowers(p => p.filter(x => x !== 'overcharge')) }
        setBossHP(hp => Math.max(0, hp - damage))
        setScore(s => s + damage)
        setConsecutiveCorrect(c => {
          const nc = c + 1
          if (activePowers.includes('chain') && nc >= 2) { setBossHP(hp => Math.max(0, hp - 500)); return 0 }
          return nc
        })
        setBossHit(true)
        setTimeout(() => setBossHit(false), 300)
        const stamGain = timeUsed < 5 ? 25 : timeUsed < 15 ? 15 : 8
        setStamina(s => Math.min(100, s + stamGain))
        const shuffled = [...AVAILABLE_POWERS].sort(() => Math.random() - 0.5).slice(0, 3)
        setPendingPowers(shuffled)
        setGamePhase('power')
      } else {
        setConsecutiveCorrect(0)
      }
    } else if (questionMode === 'defense') {
      if (correct) {
        setCorrectCount(c => c + 1)
        setStamina(s => Math.min(100, s + 20))
        staminaAutoTriggeredRef.current = false
      } else {
        if (shieldActive) {
          setShieldActive(false)
          setActivePowers(p => p.filter(x => x !== 'shield'))
        } else {
          setHearts(h => {
            const nh = h - 1
            heartsRef.current = nh
            if (nh <= 0) {
              setSavedBossHP(bossHP)
              setGamePhase('defeat')
            }
            return nh
          })
          setInvincible(true)
          invincibleRef.current = true
          setTimeout(() => { setInvincible(false); invincibleRef.current = false }, 2000)
        }
      }
    } else {
      // Stamina mode
      const gain = correct ? 35 : 10
      setStamina(s => { const n = Math.min(100, s + gain); staminaRef.current = n; return n })
      // Reset auto-trigger so it can fire again next time stamina runs out
      staminaAutoTriggeredRef.current = false
    }
  }, [questionMode, overchargeActive, activePowers, shieldActive])

  const handlePowerSelect = useCallback((power: Power) => {
    setActivePowers(prev => { const n = [...prev, power.id]; activePowersRef.current = n; return n })
    if (power.id === 'shield') setShieldActive(true)
    if (power.id === 'overcharge') setOverchargeActive(true)
    if (power.id === 'nova') setBossHP(hp => Math.max(0, hp - 2000))
    if (power.duration) {
      setTimeout(() => {
        setActivePowers(prev => prev.filter(p => p !== power.id))
        activePowersRef.current = activePowersRef.current.filter(p => p !== power.id)
      }, power.duration * 1000)
    }
    setPendingPowers([])
    setGamePhase('battle')
    gamePhaseRef.current = 'battle'
  }, [])

  // ── INTRO ──
  if (gamePhase === 'intro') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 540, padding: '0 20px' }}>
            <div style={{ fontSize: 11, color: '#FF0044', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 3, marginBottom: 16, animation: 'pulse-red 1s ease-in-out infinite' }}>⚠️ BOSS BATTLE DETECTED</div>
            <div style={{ marginBottom: 20 }}><BossSprite phase={1} hit={false} /></div>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: '#FF0044', marginBottom: 8, textShadow: '0 0 20px rgba(255,0,68,0.6)' }}>SINGULARITY SIEGE</h1>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Unit Boss — {unitName}</div>
            <div className="glass-card" style={{ padding: '18px 22px', marginBottom: 24, textAlign: 'left', borderColor: '#FF004444' }}>
              <div style={{ fontSize: 11, color: '#FF0044', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 10 }}>CONTROLS</div>
              {[
                { icon: '⬅️➡️', text: 'Arrow keys — move your ship (drains stamina)' },
                { icon: '🚀', text: 'Space / Click — fire bullets (costs 12 stamina each)' },
                { icon: '💥', text: 'Your bullet hits boss → answer to deal damage' },
                { icon: '🛡', text: 'Boss bullet hits you → answer to survive' },
                { icon: '🧲', text: '"GET STAMINA" button → answer questions to refuel' },
                { icon: '⬆️', text: 'Faster correct answers = more damage + stamina' },
              ].map(item => (
                <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 15, minWidth: 28 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
              {Array.from({ length: boostedRetry ? boostedHearts : maxHearts }, (_, i) => <span key={i} style={{ fontSize: 20 }}>❤️</span>)}
            </div>
            <button onClick={startBattle} disabled={loadingQ}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #FF0044, #FF6B2B)', border: 'none', borderRadius: 4, color: 'white', fontSize: 15, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: loadingQ ? 'not-allowed' : 'pointer', boxShadow: '0 0 30px rgba(255,0,68,0.5)' }}>
              {loadingQ ? '⚡ LOADING...' : '⚡ ENTER BATTLE'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── VICTORY ──
  const timeMinutes = Math.round((Date.now() - startTime) / 60000)
  const heartsBonus = hearts * 100
  const speedBonus = timeMinutes < 5 ? 200 : timeMinutes < 8 ? 100 : 0
  const totalXP = 500 + heartsBonus + speedBonus + Math.floor(score / 10)

  if (gamePhase === 'victory') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 500, padding: '0 20px' }}>
            <div style={{ fontSize: 80, marginBottom: 16, animation: 'bossAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>🏆</div>
            <h1 style={{ fontSize: 40, fontWeight: 900, color: 'var(--cyan)', marginBottom: 8, textShadow: '0 0 30px var(--cyan-glow)' }}>BOSS DEFEATED!</h1>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>{unitName} mastered</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total XP', value: `+${totalXP}`, color: 'var(--cyan)' },
                { label: 'Coins', value: `+${Math.floor(totalXP / 3)}`, color: '#FFD700' },
                { label: 'Accuracy', value: `${totalCount > 0 ? Math.round(correctCount / totalCount * 100) : 0}%`, color: 'var(--green)' },
              ].map(c => (
                <div key={c.label} className="glass-card" style={{ padding: '18px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: c.color, marginBottom: 4 }}>{c.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{c.label}</div>
                </div>
              ))}
            </div>
            {hearts === maxHearts && <div style={{ color: 'var(--green)', fontSize: 13, marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>⭐ PERFECT — No hearts lost!</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => router.push('/galaxy')} style={{ flex: 1, padding: '14px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>← GALAXY</button>
              <button onClick={() => router.push(`/boss/${unitId}`)} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #FF0044, var(--purple))', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>⚡ FIGHT AGAIN</button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (gamePhase === 'defeat') {
    const damagePct = Math.round(((BOSS_MAX_HP - savedBossHP) / BOSS_MAX_HP) * 100)
    const isFirstDefeat = attemptNumber === 1

    const handleRetryPartial = () => {
      // Option A: continue from where boss was left
      // Boss HP stays at savedBossHP
      setBossHP(savedBossHP)
      setBossX(50)
      setBossY(12)
      bossXRef.current = 50
      bossYRef.current = 12
      bossVXRef.current = 0.3
      bossVYRef.current = 0
      setHearts(maxHearts)
      heartsRef.current = maxHearts
      setStamina(100)
      staminaRef.current = 100
      setScore(0)
      setCorrectCount(0)
      setTotalCount(0)
      setConsecutiveCorrect(0)
      setActivePowers([])
      activePowersRef.current = []
      setShieldActive(false)
      setOverchargeActive(false)
      setBullets([])
      bulletsRef.current = []
      setActiveQuestion(null)
      activeQuestionRef.current = null
      setPendingPowers([])
      setBossHit(false)
      setInvincible(false)
      invincibleRef.current = false
      staminaAutoTriggeredRef.current = false
      // Keep questions loaded, just reset index
      setQIndex(0)
      qIndexRef.current = 0
      setAttemptNumber(2)
      setGamePhase('battle')
      gamePhaseRef.current = 'battle'
    }

    const handleRetryFullBoost = () => {
      const extraHearts = maxHearts + 1
      // Set boost tracking
      setBoostedRetry(true)
      setBoostedHearts(extraHearts)
      // Reset boss
      setBossHP(BOSS_MAX_HP)
      setSavedBossHP(BOSS_MAX_HP)
      setBossX(50)
      setBossY(12)
      bossXRef.current = 50
      bossYRef.current = 12
      bossVXRef.current = 0.3
      bossVYRef.current = 0
      // Apply boost — extra heart + magnet active from start
      setHearts(extraHearts)
      heartsRef.current = extraHearts
      setStamina(100)
      staminaRef.current = 100
      // Magnet = slower drain = effectively double stamina duration
      setActivePowers(['magnet'])
      activePowersRef.current = ['magnet']
      setShieldActive(false)
      setOverchargeActive(false)
      setBullets([])
      bulletsRef.current = []
      // Keep existing questions — just reset index
      setQIndex(0)
      qIndexRef.current = 0
      setActiveQuestion(null)
      activeQuestionRef.current = null
      setPendingPowers([])
      // Go to Phase 1 with full reset
      setBattlePhase(1)
      battlePhaseRef.current = 1
      setBossHit(false)
      setInvincible(false)
      invincibleRef.current = false
      staminaAutoTriggeredRef.current = false
      setScore(0)
      setCorrectCount(0)
      setTotalCount(0)
      setConsecutiveCorrect(0)
      setAttemptNumber(2)
      // Go straight to battle — skip intro so boost isn't overwritten
      setGamePhase('battle')
      gamePhaseRef.current = 'battle'
    }

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#020408' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,0,68,0.15) 0%, #020408 70%)', zIndex: 0 }} />

          <div style={{ textAlign: 'center', maxWidth: 560, padding: '0 20px', position: 'relative', zIndex: 1 }}>

            {/* Shattered ship */}
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <svg viewBox="0 0 16 16" width="28" height="28" style={{ transform: 'rotate(-45deg) translate(-10px, 8px)', opacity: 0.6, filter: 'drop-shadow(0 0 4px #FF0044)' }}>
                <polygon points="8,1 12,13 8,11 4,13" fill="#FF004433" stroke="#FF0044" strokeWidth="1" />
              </svg>
              <svg viewBox="0 0 16 16" width="44" height="44" style={{ filter: 'drop-shadow(0 0 8px #FF0044)', opacity: 0.8 }}>
                <polygon points="8,1 12,13 8,11 4,13" fill="#FF004422" stroke="#FF0044" strokeWidth="1.5" />
                <line x1="4" y1="4" x2="12" y2="12" stroke="#FF0044" strokeWidth="0.5" />
                <line x1="12" y1="4" x2="4" y2="12" stroke="#FF0044" strokeWidth="0.5" />
              </svg>
              <svg viewBox="0 0 16 16" width="24" height="24" style={{ transform: 'rotate(30deg) translate(8px, -4px)', opacity: 0.5, filter: 'drop-shadow(0 0 4px #FF0044)' }}>
                <polygon points="8,1 12,13 8,11 4,13" fill="#FF004433" stroke="#FF0044" strokeWidth="1" />
              </svg>
            </div>

            <div style={{ fontSize: 10, color: '#FF0044', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 4, marginBottom: 10, opacity: 0.8 }}>
              {isFirstDefeat ? 'SYSTEM FAILURE — ATTEMPT 1' : 'SYSTEM FAILURE — ATTEMPT 2'}
            </div>

            <h1 style={{ fontSize: 44, fontWeight: 900, color: '#FF0044', marginBottom: 8, textShadow: '0 0 40px rgba(255,0,68,0.8)', fontFamily: 'Orbitron, monospace', letterSpacing: 2 }}>
              DESTROYED
            </h1>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
              The {unitName} Boss survives...<br />
              <span style={{ color: '#FF6B2B', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                You dealt {damagePct}% damage · {correctCount}/{totalCount} correct
              </span>
            </div>

            {/* Damage bar */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>DAMAGE DEALT</span>
                <span style={{ fontSize: 10, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{damagePct}%</span>
              </div>
              <div style={{ height: 8, background: '#0A0C18', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,107,43,0.2)' }}>
                <div style={{ height: '100%', width: `${damagePct}%`, background: 'linear-gradient(90deg, #FF6B2B, #FF0044)', borderRadius: 4, boxShadow: '0 0 8px rgba(255,107,43,0.6)', transition: 'width 1s ease 0.3s' }} />
              </div>
            </div>

            {/* Retry options — only on first defeat */}
            {isFirstDefeat ? (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 14 }}>
                  CHOOSE YOUR RETRY
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>

                  {/* Option A — Partial reset */}
                  <button onClick={handleRetryPartial}
                    style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid var(--cyan)', borderRadius: 10, padding: '20px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cyan-dim)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,240,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>⚔️</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 8 }}>CONTINUE FROM HERE</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Boss stays at <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{100 - damagePct}% HP</span><br />
                      Full hearts + full stamina<br />
                      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Your damage counts</span>
                    </div>
                  </button>

                  {/* Option B — Full reset with boost */}
                  <button onClick={handleRetryFullBoost}
                    style={{ background: 'rgba(155,93,255,0.06)', border: '1px solid var(--purple)', borderRadius: 10, padding: '20px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--purple-dim)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(155,93,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🚀</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 8 }}>FRESH START + BOOST</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Boss resets to <span style={{ color: '#FF0044', fontWeight: 700 }}>full HP</span><br />
                      +1 extra heart · 2× stamina<br />
                      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Power-up advantage</span>
                    </div>
                  </button>
                </div>

                <button onClick={() => router.push('/galaxy')}
                  style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                  ← REVIEW LESSONS INSTEAD
                </button>
              </>
            ) : (
              /* Second defeat — no more retries */
              <>
                <div style={{ background: 'rgba(255,0,68,0.08)', border: '1px solid rgba(255,0,68,0.3)', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>📚</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Time to review the material
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    You've attempted this boss twice. The best move now is to revisit the lessons, strengthen your understanding, then come back stronger.
                  </div>
                </div>

                {damagePct >= 60 && (
                  <div style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid var(--cyan)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                    💡 You were at {damagePct}% — you clearly understand the material. Focus on the concepts you got wrong under time pressure.
                  </div>
                )}

                <button onClick={() => router.push('/galaxy')}
                  style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, var(--cyan), var(--purple))', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 14, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)', letterSpacing: 1 }}>
                  ← RETURN TO GALAXY
                </button>
              </>
            )}
          </div>
        </main>

        <style>{`
          @keyframes bossFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes bossRage { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-4px) rotate(1.5deg)} }
          @keyframes bossHit { 0%{filter:brightness(4) drop-shadow(0 0 24px #FF0044)} 100%{filter:none} }
          @keyframes bossAppear { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 60%{opacity:1;transform:translate(-50%,-50%) scale(1.1)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1)} }
          @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
          @keyframes pulse-red { 0%,100%{opacity:0.5} 50%{opacity:1} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        `}</style>
      </div>
    )
  }

  const bossHPPct = (bossHP / BOSS_MAX_HP) * 100
  const bossColor = battlePhase === 2 ? '#FF0044' : '#00F0FF'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020408' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {activeQuestion && (
          <QuestionOverlay
            question={activeQuestion}
            timeLimit={questionMode === 'attack' ? (battlePhase === 1 ? 30 : 20) : questionMode === 'defense' ? (battlePhase === 1 ? 25 : 15) : 30}
            mode={questionMode}
            onAnswer={handleAnswer}
          />
        )}

        {gamePhase === 'power' && pendingPowers.length > 0 && !activeQuestion && (
          <PowerSelection powers={pendingPowers} onSelect={handlePowerSelect} />
        )}

        {/* Boost active banner */}
        {boostedRetry && (
          <div style={{ padding: '8px 24px', background: 'linear-gradient(90deg, rgba(155,93,255,0.2), rgba(0,240,255,0.1))', borderBottom: '1px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 11 }}>
            <span style={{ fontSize: 11, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, fontWeight: 700 }}>
              🚀 BOOST ACTIVE
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              +1 extra heart · 🧲 stamina magnet · fresh boss
            </span>
          </div>
        )}

        {/* HUD top */}
        <div style={{ padding: '10px 24px', borderBottom: '1px solid rgba(255,0,68,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'rgba(2,4,8,0.92)' }}>
          <div style={{ fontSize: 11, color: battlePhase === 2 ? '#FF0044' : 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: 2 }}>
            {battlePhase === 2 ? '⚠️ PHASE 2 — CRITICAL' : '● PHASE 1'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{unitName.toUpperCase()} BOSS</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>DMG {score.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{correctCount}/{totalCount}</span>
          </div>
        </div>

        {/* ARENA */}
        <div onClick={handleArenaClick} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'crosshair', background: 'radial-gradient(ellipse at 50% 0%, #150010 0%, #020408 65%)' }}>

          {/* Stars */}
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`, width: i % 5 === 0 ? 2 : 1, height: i % 5 === 0 ? 2 : 1, borderRadius: '50%', background: 'white', opacity: 0.06 + (i % 5) * 0.03, pointerEvents: 'none' }} />
          ))}

          {/* Boss — moves horizontally and vertically */}
          <div style={{ position: 'absolute', top: `${bossY}%`, left: `${bossX}%`, transform: 'translateX(-50%)', zIndex: 5, pointerEvents: 'none' }}>
            <div style={{ width: 240, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: bossColor, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>BOSS HP</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{bossHP.toLocaleString()}</span>
              </div>
              <div style={{ height: 7, background: '#0A0C18', borderRadius: 4, overflow: 'hidden', border: `1px solid ${bossColor}44` }}>
                <div style={{ height: '100%', width: `${bossHPPct}%`, background: `linear-gradient(90deg, ${bossColor}, ${battlePhase === 2 ? '#FF6B2B' : '#9B5DFF'})`, borderRadius: 4, boxShadow: `0 0 8px ${bossColor}`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <BossSprite phase={battlePhase} hit={bossHit} />
            </div>
          </div>

          {/* Active powers display */}
          {activePowers.length > 0 && (
            <div style={{ position: 'absolute', top: 10, right: 14, display: 'flex', gap: 5, zIndex: 8, pointerEvents: 'none' }}>
              {[...new Set(activePowers)].map(p => {
                const power = AVAILABLE_POWERS.find(ap => ap.id === p)
                return power ? <div key={p} title={power.name} style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 6, padding: '4px 7px', fontSize: 13 }}>{power.icon}</div> : null
              })}
            </div>
          )}

          {/* Bullets */}
          {bullets.map(b => (
            <div key={b.id} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 6 }}>
              {b.owner === 'player' ? (
                <svg width="8" height="18" viewBox="0 0 8 18">
                  <ellipse cx="4" cy="9" rx="2.5" ry="6.5" fill="#00F0FF" style={{ filter: 'drop-shadow(0 0 4px #00F0FF)' }} />
                </svg>
              ) : (
                <svg width="10" height="20" viewBox="0 0 10 20">
                  <ellipse cx="5" cy="10" rx="3" ry="7" fill={b.color} style={{ filter: `drop-shadow(0 0 5px ${b.color})` }} />
                </svg>
              )}
            </div>
          ))}

          {/* Phase 2 warning */}
          {battlePhase === 2 && bossHPPct > 49 && bossHPPct < 51 && (
            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FF0044', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, textShadow: '0 0 30px rgba(255,0,68,0.9)', animation: 'bossAppear 0.4s ease forwards' }}>
                ⚠️ PHASE 2 ENGAGED
              </div>
            </div>
          )}

          {/* Player ship */}
          <div style={{ position: 'absolute', bottom: '14%', left: `${playerX}%`, transform: 'translateX(-50%)', zIndex: 7, pointerEvents: 'none' }}>
            <PlayerShipSprite invincible={invincible} />
          </div>

          {/* Bottom HUD */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 20px', background: 'rgba(2,4,8,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 9 }}>

            {/* Hearts — use boostedHearts when boost is active */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {Array.from({ length: boostedRetry ? boostedHearts : maxHearts }, (_, i) => (
                <span key={i} style={{ fontSize: 18, filter: i < hearts ? 'none' : 'grayscale(1) opacity(0.2)', transition: 'all 0.3s' }}>❤️</span>
              ))}
            </div>

            {/* Stamina + GET STAMINA button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 200 }}>
              <div style={{ fontSize: 9, color: stamina < 20 ? '#FF0044' : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, fontWeight: stamina < 20 ? 700 : 400 }}>
                {stamina < 20 ? '⚠️ LOW STAMINA' : '⚡ STAMINA'}
              </div>
              <div style={{ height: 6, width: 180, background: '#0A0C18', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stamina}%`, background: stamina < 20 ? '#FF0044' : stamina < 50 ? '#FF6B2B' : '#00FF88', borderRadius: 3, transition: 'width 0.15s ease, background 0.3s', boxShadow: `0 0 6px ${stamina < 20 ? 'rgba(255,0,68,0.8)' : 'rgba(0,255,136,0.5)'}` }} />
              </div>
              {/* GET STAMINA button */}
              <button
                onClick={e => { e.stopPropagation(); handleGetStamina() }}
                disabled={!!activeQuestion}
                style={{ padding: '5px 14px', background: activeQuestion ? 'var(--border)' : 'var(--purple-dim)', border: `1px solid ${activeQuestion ? 'var(--border)' : 'var(--purple)'}`, borderRadius: 4, color: activeQuestion ? 'var(--text-muted)' : 'var(--purple)', fontSize: 10, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: activeQuestion ? 'not-allowed' : 'pointer', letterSpacing: 1 }}>
                🧲 GET STAMINA
              </button>
            </div>

            {/* Controls hint */}
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', lineHeight: 1.8 }}>
              ← → MOVE<br />SPACE FIRE
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bossFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes bossRage { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-4px) rotate(1.5deg)} }
        @keyframes bossHit { 0%{filter:brightness(4) drop-shadow(0 0 24px #FF0044)} 100%{filter:none} }
        @keyframes bossAppear { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 60%{opacity:1;transform:translate(-50%,-50%) scale(1.1)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse-red { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}
