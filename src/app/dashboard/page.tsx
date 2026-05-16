'use client'
import Sidebar from '@/components/layout/Sidebar'

const MISSIONS = [
  { icon: '◎', title: 'Wave-Particle Duality Analysis', desc: 'Simulate the double-slit experiment using 5 different photon configurations', xp: 450, progress: 50 },
  { icon: '⊕', title: 'Entropy Gradient Mapping', desc: 'Calibrate the heat-sink sensors in the virtual thermodynamics lab', xp: 320, progress: 25 },
  { icon: '△', title: 'Gravity Well Stabilization', desc: 'Apply general relativity tensors to correct the orbital decay simulation', xp: 600, progress: 0 },
]

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Top Bar */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>⊞</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace' }}>PARALLAX COMMAND</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {['Velocity', 'Mass', 'Energy', 'Entropy'].map((tab, i) => (
              <span key={tab} style={{ fontSize: 12, color: i === 0 ? 'var(--cyan)' : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', borderBottom: i === 0 ? '1px solid var(--cyan)' : 'none', paddingBottom: 2 }}>{tab}</span>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <span style={{ fontSize: 18, cursor: 'pointer' }}>🔔</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '40px', flex: 1 }}>

          {/* Greeting */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
              Welcome back, Sandeep ⚡
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              Navigation integrity: 98.4%. Orbital drift within acceptable bounds.
            </p>
          </div>

          {/* Stat Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>

            {/* XP Card */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>LEVEL 12 PROGRESSION</span>
                <span style={{ color: 'var(--cyan)', fontSize: 16 }}>📈</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--cyan)', marginBottom: 4 }}>3,240</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: 'JetBrains Mono, monospace' }}>/ 4,000 XP</div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: '81%', background: 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: 2, boxShadow: '0 0 8px var(--cyan-glow)' }} />
              </div>
            </div>

            {/* Streak Card */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>STABILITY STREAK</span>
                <span style={{ fontSize: 16 }}>🔥</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>14-Day Streak</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>CONSISTENT OBSERVATION PROTOCOL</div>
            </div>

            {/* League Card */}
            <div className="glass-card glass-card-purple" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>QUASAR LEAGUE</span>
                <span style={{ fontSize: 16 }}>🏆</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--purple)', marginBottom: 4 }}>Rank #2</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>TOP 1% OF SOLAR SYSTEM SECTOR</div>
            </div>
          </div>

          {/* Bottom Two Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

            {/* Missions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace' }}>TODAY'S MISSIONS</h2>
                <span style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>View Buffer</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {MISSIONS.map((m, i) => (
                  <div key={i} className="glass-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 4, background: 'var(--cyan-dim)', border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{m.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</span>
                          <span style={{ fontSize: 12, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, marginLeft: 12 }}>+{m.xp} XP</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{m.desc}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${m.progress}%`, background: 'var(--cyan)', borderRadius: 2, boxShadow: m.progress > 0 ? '0 0 6px var(--cyan-glow)' : 'none' }} />
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{m.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Boss Battle */}
            <div className="glass-card glass-card-red" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 180, background: 'radial-gradient(ellipse at center, #3D0015 0%, #1A000A 60%, var(--bg-card) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, var(--red-dim) 0%, transparent 70%)', animation: 'pulse-red 2s ease-in-out infinite' }} />
                🌑
              </div>
              <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 8 }}>⚡ BOSS BATTLE</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>Singularity Siege</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
                  A massive gravitational distortion has been detected in Sector 4-B. Coordinate with other physicists to stabilize the event horizon before information loss occurs.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>Threat Level</div>
                    <div style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>OMEGA</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>T-Minus</div>
                    <div style={{ fontSize: 12, color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>04:12:33</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {['👤', '👤', '👤', '🔴'].map((a, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{a}</div>
                  ))}
                </div>
                <button style={{ width: '100%', padding: '14px', background: 'var(--red)', border: 'none', borderRadius: 4, color: 'white', fontSize: 13, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--red-glow)' }}>
                  ⚡ ENTER PARALLAX BATTLE
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
