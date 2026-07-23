'use client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { useProgress } from '@/hooks/useProgress'

const MISSIONS = [
  { icon: '🚀', title: 'Kinematic Equations Drill', desc: 'Master the four kinematic equations with 10 practice problems', xp: 120, progress: 0, href: '/learn/1/104' },
  { icon: '⚡', title: "Newton's Laws Challenge", desc: "Test your understanding of all three of Newton's Laws", xp: 180, progress: 0, href: '/quiz' },
  { icon: '🔋', title: 'Energy Conservation Quest', desc: 'Apply conservation of energy to solve 5 real-world scenarios', xp: 240, progress: 50, href: '/learn/3/304' },
]

const QUICK_ACTIONS = [
  { icon: '🌌', label: 'Progress Galaxy', desc: 'View your learning map', href: '/galaxy', color: 'var(--cyan)' },
  { icon: '🎯', label: 'Quick Quiz', desc: 'Infinite drill mode', href: '/quiz', color: 'var(--green)' },
  { icon: '👾', label: 'Boss Battle', desc: 'Fight the unit boss', href: '/boss/1', color: '#FF0044' },
  { icon: '⚔️', label: 'Siege Battle', desc: 'Multiplayer — coming soon', href: '/league/siege', color: 'var(--purple)' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { progress, loading } = useProgress()

  const xpToNextLevel = 1000
  const currentLevelXP = progress.xp % xpToNextLevel
  const xpPct = Math.round((currentLevelXP / xpToNextLevel) * 100)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="PARALLAX COMMAND" activeTab="Velocity" />
        <main style={{ flex: 1, padding: '40px', maxWidth: 1100 }}>

          {/* Welcome */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
              Welcome back ⚡
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              Level {loading ? '...' : progress.level} Navigator · {loading ? '...' : progress.streak_days}-day streak
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>

            {/* XP card — clickable → galaxy */}
            <div className="glass-card" style={{ padding: 24, cursor: 'pointer' }} onClick={() => router.push('/galaxy')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>LEVEL {loading ? '...' : progress.level} PROGRESSION</span>
                <span style={{ fontSize: 16 }}>📈</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--cyan)', marginBottom: 4 }}>
                {loading ? '...' : progress.xp.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                {currentLevelXP} / {xpToNextLevel} to next level
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: 2, boxShadow: '0 0 8px var(--cyan-glow)' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 8 }}>Click to view Galaxy →</div>
            </div>

            {/* Streak card */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>DAILY STREAK</span>
                <span style={{ fontSize: 16 }}>🔥</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
                {loading ? '...' : progress.streak_days} Days
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                Keep it going — come back tomorrow
              </div>
            </div>

            {/* League rank card — clickable → league */}
            <div className="glass-card" style={{ padding: 24, cursor: 'pointer', borderColor: 'rgba(155,93,255,0.3)' }} onClick={() => router.push('/league')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>{loading ? '...' : progress.league_rank.toUpperCase()} LEAGUE</span>
                <span style={{ fontSize: 16 }}>🏆</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--purple)', marginBottom: 4 }}>
                {loading ? '...' : progress.league_rank}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 8 }}>Click to view Leaderboard →</div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', marginBottom: 16 }}>QUICK ACTIONS</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {QUICK_ACTIONS.map(action => (
                <button key={action.href} onClick={() => router.push(action.href)}
                  style={{ background: 'var(--bg-surface)', border: `1px solid ${action.color}33`, borderRadius: 8, padding: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${action.color}0D`; (e.currentTarget as HTMLElement).style.borderColor = `${action.color}66` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLElement).style.borderColor = `${action.color}33` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{action.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{action.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{action.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Missions + sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace' }}>TODAY'S MISSIONS</h2>
                <button onClick={() => router.push('/missions')} style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MISSIONS.map((m, i) => (
                  <div key={i} className="glass-card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => router.push(m.href)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 4, background: 'var(--cyan-dim)', border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{m.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</span>
                          <span style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>+{m.xp} XP</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{m.desc}</div>
                        <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${m.progress}%`, background: 'var(--cyan)', borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Coins */}
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 10, color: '#FFD700', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 10 }}>PARALLAX COINS</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', marginBottom: 4 }}>
                  🪙 {loading ? '...' : progress.coins.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Spend on power-ups in boss battles</div>
              </div>

              {/* Mastery */}
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 10 }}>PHYSICS MASTERY</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--green)', marginBottom: 8 }}>
                  {loading ? '...' : progress.mastery_score}%
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${loading ? 0 : progress.mastery_score}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))', borderRadius: 3, boxShadow: '0 0 8px rgba(0,255,136,0.4)' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {progress.mastery_score < 50 ? 'Keep practicing — you\'re building a foundation' : progress.mastery_score < 75 ? 'Good progress — tackle harder questions' : 'Excellent mastery — ready for AP exam'}
                </div>
              </div>

              {/* Start learning CTA */}
              <button onClick={() => router.push('/galaxy')}
                style={{ padding: '14px', background: 'linear-gradient(135deg, var(--cyan), var(--purple))', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 13, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)', letterSpacing: 1 }}>
                🌌 ENTER GALAXY →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
