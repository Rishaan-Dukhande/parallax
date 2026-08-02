'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { useProgress } from '@/hooks/useProgress'

const LEAGUE_TIERS = [
  { name: 'Nebula', color: '#6B7299', min: 0 },
  { name: 'Pulsar', color: '#00F0FF', min: 2000 },
  { name: 'Quasar', color: '#9B5DFF', min: 5000 },
  { name: 'Singularity', color: '#FFD700', min: 10000 },
]

export default function LeaguePage() {
  const router = useRouter()
  const { progress, loading } = useProgress()

  const [rawLeaderboard, setRawLeaderboard] = useState<{ user_id: string; display_name: string | null; xp: number; streak_days: number }[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/league').then(res => res.json()).then(data => {
      setRawLeaderboard(data.leaderboard || [])
      setCurrentUserId(data.currentUserId || null)
    })
  }, [])

  function tierForXp(xp: number) {
    return [...LEAGUE_TIERS].reverse().find(t => xp >= t.min)?.name ?? LEAGUE_TIERS[0].name
  }

  const myTier = tierForXp(progress.xp)

  const leaderboard = rawLeaderboard
    .sort((a, b) => b.xp - a.xp)
    .map((p, i) => ({
      rank: i + 1,
      name: p.display_name || 'Navigator',
      xp: p.xp,
      streak: p.streak_days,
      league: tierForXp(p.xp),
      isYou: p.user_id === currentUserId,
    }))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title={`${myTier.toUpperCase()} LEAGUE`} activeTab="Mass" />
        <div style={{ flex: 1, padding: '40px' }}>

          {/* Siege Battle CTA */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,0,68,0.15), rgba(155,93,255,0.1))', border: '1px solid rgba(255,0,68,0.3)', borderRadius: 12, padding: '24px 28px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#FF0044', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 8 }}>⚔️ MULTIPLAYER MODE</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>Siege Battle</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Fight a boss alongside another player. Real-time co-op — same boss, shared HP pool.</div>
            </div>
            <button onClick={() => router.push('/league/siege')}
              style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #FF0044, #FF6B2B)', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,0,68,0.4)', whiteSpace: 'nowrap', letterSpacing: 1 }}>
              ⚔️ ENTER SIEGE
            </button>
          </div>

          {/* League tiers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
            {LEAGUE_TIERS.map(tier => {
              const isCurrentTier = myTier === tier.name
              return (
                <div key={tier.name} style={{ background: isCurrentTier ? `${tier.color}18` : 'var(--bg-surface)', border: `1px solid ${isCurrentTier ? tier.color : 'var(--border)'}`, borderRadius: 8, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isCurrentTier ? tier.color : 'var(--text-muted)', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>{tier.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{tier.min.toLocaleString()}+ XP</div>
                  {isCurrentTier && <div style={{ fontSize: 10, color: tier.color, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>← YOU ARE HERE</div>}
                </div>
              )
            })}
          </div>

          {/* Leaderboard */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace' }}>THIS WEEK'S RANKINGS</h2>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Resets Sunday midnight</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leaderboard.length <= 1 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                You're the only navigator so far — invite friends to fill out the leaderboard.
              </div>
            )}
            {leaderboard.map((player) => {
              const isYou = player.isYou
              const rankColor = player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : 'var(--text-muted)'
              return (
                <div key={player.rank} style={{ background: isYou ? 'rgba(0,240,255,0.06)' : 'var(--bg-surface)', border: `1px solid ${isYou ? 'var(--cyan)' : 'var(--border)'}`, borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 32, textAlign: 'center', fontSize: 16, fontWeight: 900, color: rankColor, fontFamily: 'JetBrains Mono, monospace' }}>
                    {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isYou ? 'var(--cyan)' : 'var(--text-primary)' }}>
                      {player.name} {isYou && <span style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>(YOU)</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{player.league} · {player.streak}d streak</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {player.xp.toLocaleString()} XP
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
