'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { supabase } from '@/lib/supabase'

const SIEGE_BOSS_HP = 20000
const ROOM_CODE_LENGTH = 4

interface SiegePlayer {
  id: string
  name: string
  hearts: number
  stamina: number
  isReady: boolean
}

interface SiegeState {
  bossHP: number
  phase: 1 | 2
  players: Record<string, SiegePlayer>
  status: 'waiting' | 'active' | 'victory' | 'defeat'
  currentQuestion: {
    question: string
    options: string[]
    correct: number
    concept: string
  } | null
  questionTimestamp: number
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

export default function SiegeBattlePage() {
  const router = useRouter()
  const [screen, setScreen] = useState<'lobby' | 'waiting' | 'battle' | 'victory' | 'defeat'>('lobby')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [playerId] = useState(`player_${Date.now()}`)
  const [playerName, setPlayerName] = useState('Navigator')
  const [isHost, setIsHost] = useState(false)
  const [siegeState, setSiegeState] = useState<SiegeState>({
    bossHP: SIEGE_BOSS_HP,
    phase: 1,
    players: {},
    status: 'waiting',
    currentQuestion: null,
    questionTimestamp: 0,
  })
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [myHearts, setMyHearts] = useState(4)
  const [myStamina, setMyStamina] = useState(100)
  const [damage, setDamage] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const createRoom = async () => {
    const code = generateRoomCode()
    setRoomCode(code)
    setIsHost(true)
    // Subscribe to Supabase Realtime channel
    const channel = supabase.channel(`siege_${code}`, {
      config: { broadcast: { self: true } }
    })
    channelRef.current = channel
    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setSiegeState(payload as SiegeState)
      })
      .on('broadcast', { event: 'player_join' }, ({ payload }) => {
        setSiegeState(prev => ({
          ...prev,
          players: { ...prev.players, [payload.id]: payload }
        }))
      })
      .subscribe()
    // Add yourself as host
    const hostPlayer: SiegePlayer = { id: playerId, name: playerName, hearts: 4, stamina: 100, isReady: true }
    setSiegeState(prev => ({
      ...prev,
      players: { [playerId]: hostPlayer }
    }))
    setScreen('waiting')
  }

  const joinRoom = async () => {
    if (joinCode.length !== ROOM_CODE_LENGTH) return
    const code = joinCode.toUpperCase()
    setRoomCode(code)
    setIsHost(false)
    const channel = supabase.channel(`siege_${code}`, {
      config: { broadcast: { self: true } }
    })
    channelRef.current = channel
    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setSiegeState(payload as SiegeState)
        if ((payload as SiegeState).status === 'active') setScreen('battle')
        if ((payload as SiegeState).status === 'victory') setScreen('victory')
        if ((payload as SiegeState).status === 'defeat') setScreen('defeat')
      })
      .subscribe()
    // Announce yourself
    const joinerPlayer: SiegePlayer = { id: playerId, name: playerName, hearts: 4, stamina: 100, isReady: true }
    channel.send({ type: 'broadcast', event: 'player_join', payload: joinerPlayer })
    setSiegeState(prev => ({
      ...prev,
      players: { ...prev.players, [playerId]: joinerPlayer }
    }))
    setScreen('waiting')
  }

  const startSiege = async () => {
    if (!isHost) return
    // Load first question
    const res = await fetch('/api/quiz/boss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: 1, phase: 1, previousQuestions: [] }),
    })
    const data = await res.json()
    const q = data.questions?.[0]
    const newState: SiegeState = {
      ...siegeState,
      status: 'active',
      currentQuestion: q ? { question: q.question, options: q.options, correct: q.correct, concept: q.concept } : null,
      questionTimestamp: Date.now(),
    }
    setSiegeState(newState)
    setScreen('battle')
    channelRef.current?.send({ type: 'broadcast', event: 'state_update', payload: newState })
  }

  const handleAnswer = async (idx: number) => {
    if (submitted || !siegeState.currentQuestion) return
    setSelected(idx)
    setSubmitted(true)
    const correct = idx === siegeState.currentQuestion.correct
    if (correct) {
      const dmg = 400
      setDamage(d => d + dmg)
      const newHP = Math.max(0, siegeState.bossHP - dmg)
      const newState: SiegeState = {
        ...siegeState,
        bossHP: newHP,
        status: newHP <= 0 ? 'victory' : siegeState.status,
        currentQuestion: null,
        questionTimestamp: 0,
      }
      setSiegeState(newState)
      if (isHost) {
        channelRef.current?.send({ type: 'broadcast', event: 'state_update', payload: newState })
        if (newHP > 0) {
          setTimeout(async () => {
            const res = await fetch('/api/quiz/boss', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ unitId: 1, phase: newHP < SIEGE_BOSS_HP / 2 ? 2 : 1, previousQuestions: [] }),
            })
            const data = await res.json()
            const q = data.questions?.[0]
            if (q) {
              const next: SiegeState = { ...newState, currentQuestion: { question: q.question, options: q.options, correct: q.correct, concept: q.concept }, questionTimestamp: Date.now() }
              setSiegeState(next)
              channelRef.current?.send({ type: 'broadcast', event: 'state_update', payload: next })
            }
          }, 2000)
        }
      }
    } else {
      setMyHearts(h => Math.max(0, h - 1))
    }
    setTimeout(() => { setSelected(null); setSubmitted(false) }, 1800)
  }

  useEffect(() => {
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  const bossHPPct = (siegeState.bossHP / SIEGE_BOSS_HP) * 100
  const playerList = Object.values(siegeState.players)

  // ── LOBBY ──
  if (screen === 'lobby') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 480, width: '100%', padding: '0 20px' }}>
            <div style={{ fontSize: 11, color: '#FF0044', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 3, marginBottom: 16 }}>⚔️ MULTIPLAYER MODE</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>Siege Battle</h1>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
              Team up with another player to fight a boss together. Answer the same questions — both your damage counts toward the shared boss HP.
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 8 }}>YOUR NAME</div>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Navigator"
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-hi)', borderRadius: 4, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button onClick={createRoom} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #FF0044, #FF6B2B)', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', letterSpacing: 1 }}>
                ⚔️ CREATE ROOM
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="ROOM CODE" maxLength={4}
                style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-hi)', borderRadius: 4, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 4, textAlign: 'center' }} />
              <button onClick={joinRoom} disabled={joinCode.length !== 4}
                style={{ padding: '12px 20px', background: joinCode.length === 4 ? 'var(--purple)' : 'var(--border)', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: joinCode.length === 4 ? 'pointer' : 'not-allowed' }}>
                JOIN →
              </button>
            </div>
            <button onClick={() => router.push('/league')} style={{ marginTop: 20, padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>← BACK TO LEAGUE</button>
          </div>
        </main>
      </div>
    )
  }

  // ── WAITING ROOM ──
  if (screen === 'waiting') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 3, marginBottom: 16 }}>WAITING FOR PLAYERS</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 8, marginBottom: 8, textShadow: '0 0 30px var(--cyan-glow)' }}>
              {roomCode}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Share this code with your teammate</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {playerList.map(p => (
                <div key={p.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${p.id === playerId ? 'var(--cyan)' : 'var(--border)'}`, borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
                  <span style={{ fontSize: 14, color: p.id === playerId ? 'var(--cyan)' : 'var(--text-primary)', fontWeight: 700 }}>{p.name} {p.id === playerId && '(You)'}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>READY</span>
                </div>
              ))}
              {playerList.length < 2 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Waiting for teammate...</span>
                </div>
              )}
            </div>
            {isHost && (
              <button onClick={startSiege}
                style={{ width: '100%', padding: '14px', background: playerList.length >= 1 ? 'linear-gradient(135deg, #FF0044, #FF6B2B)' : 'var(--border)', border: 'none', borderRadius: 4, color: 'white', fontSize: 14, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', letterSpacing: 1 }}>
                ⚔️ START SIEGE
              </button>
            )}
            {!isHost && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Waiting for host to start...</div>}
          </div>
        </main>
      </div>
    )
  }

  // ── BATTLE ──
  if (screen === 'battle') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#020408' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Boss HP */}
          <div style={{ padding: '12px 28px', borderBottom: '1px solid rgba(255,0,68,0.2)', background: 'rgba(2,4,8,0.9)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: bossHPPct < 50 ? '#FF0044' : '#FF6B2B', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                {bossHPPct < 50 ? '⚠️ PHASE 2' : 'SIEGE BOSS'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{siegeState.bossHP.toLocaleString()} / {SIEGE_BOSS_HP.toLocaleString()}</span>
            </div>
            <div style={{ height: 10, background: '#0A0C18', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bossHPPct}%`, background: `linear-gradient(90deg, ${bossHPPct < 50 ? '#FF0044, #FF6B2B' : '#FF6B2B, #FF0044'})`, borderRadius: 5, transition: 'width 0.5s ease', boxShadow: '0 0 10px rgba(255,0,68,0.5)' }} />
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: 24, padding: 24 }}>

            {/* Question area */}
            <div style={{ flex: 1 }}>
              {siegeState.currentQuestion ? (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 12 }}>
                    ⚔️ SIEGE QUESTION — {siegeState.currentQuestion.concept}
                  </div>
                  <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 16 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {siegeState.currentQuestion.question}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {siegeState.currentQuestion.options.map((opt, i) => {
                      let bg = 'var(--bg-surface)', border = 'var(--border-hi)', color = 'var(--text-primary)'
                      if (submitted && i === siegeState.currentQuestion!.correct) { bg = 'rgba(0,255,136,0.1)'; border = 'var(--green)'; color = 'var(--green)' }
                      else if (submitted && selected === i && i !== siegeState.currentQuestion!.correct) { bg = 'rgba(255,0,68,0.1)'; border = '#FF0044'; color = '#FF0044' }
                      else if (selected === i && !submitted) { bg = 'rgba(255,0,68,0.1)'; border = '#FF0044'; color = '#FF0044' }
                      return (
                        <button key={i} onClick={() => handleAnswer(i)} disabled={submitted}
                          style={{ background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${border}`, borderRadius: 6, padding: '14px 16px', cursor: submitted ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', minWidth: 18 }}>{['A', 'B', 'C', 'D'][i]}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color, flex: 1 }}>{opt}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 32 }}>⏳</div>
                  <div style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>Next question loading...</div>
                </div>
              )}
            </div>

            {/* Players sidebar */}
            <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 4 }}>TEAMMATES</div>
              {playerList.map(p => (
                <div key={p.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${p.id === playerId ? 'var(--cyan)' : 'var(--border)'}`, borderRadius: 8, padding: '14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.id === playerId ? 'var(--cyan)' : 'var(--text-primary)', marginBottom: 8 }}>
                    {p.name} {p.id === playerId && '(You)'}
                  </div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <span key={i} style={{ fontSize: 14, filter: i < (p.id === playerId ? myHearts : p.hearts) ? 'none' : 'grayscale(1) opacity(0.3)' }}>❤️</span>
                    ))}
                  </div>
                  <div style={{ height: 4, background: '#0A0C18', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${p.id === playerId ? myStamina : p.stamina}%`, background: 'var(--green)', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 'auto', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>TOTAL DAMAGE</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace' }}>{damage.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── VICTORY ──
  if (screen === 'victory') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 20px' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🏆</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: 'var(--cyan)', marginBottom: 8 }}>SIEGE COMPLETE!</h1>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>Your team defeated the boss together.</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => router.push('/galaxy')} style={{ flex: 1, padding: '14px', background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>← GALAXY</button>
            <button onClick={() => { setScreen('lobby'); setSiegeState({ bossHP: SIEGE_BOSS_HP, phase: 1, players: {}, status: 'waiting', currentQuestion: null, questionTimestamp: 0 }) }} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #FF0044, var(--purple))', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>⚔️ NEW SIEGE</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
