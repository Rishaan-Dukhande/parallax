'use client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

const LAB_TOOLS = [
  {
    icon: '🔭',
    title: 'Projectile Motion Simulator',
    desc: 'Like PhET — adjust launch angle and initial velocity with sliders, watch the trajectory trace in real time. Shows x/y component separation visually.',
    detail: 'Connects to Kinematics unit',
    status: 'coming-soon',
  },
  {
    icon: '⚡',
    title: 'Force & Acceleration Sandbox',
    desc: 'Drag forces onto objects and watch them accelerate. Adjust mass, apply friction, see F=ma play out. Think of it as a free-body diagram that moves.',
    detail: "Connects to Newton's Laws unit",
    status: 'coming-soon',
  },
  {
    icon: '🔋',
    title: 'Energy Transformation Playground',
    desc: 'Drop a ball from any height, add springs, inclines, and friction. Watch the PE/KE/thermal energy bars shift in real time. Conservation of energy made visual.',
    detail: 'Connects to Work & Energy unit',
    status: 'coming-soon',
  },
  {
    icon: '🌊',
    title: 'Wave & Oscillation Visualizer',
    desc: 'Adjust spring constant and mass to change period. Layer two waves to see constructive/destructive interference. The Tacoma Narrows resonance demo is planned here.',
    detail: 'Connects to Oscillations unit',
    status: 'coming-soon',
  },
  {
    icon: '🧲',
    title: 'E&M Field Explorer',
    desc: 'Place positive and negative charges on a canvas — field lines draw themselves. Move charges and watch the field update. Based on Coulomb\'s Law rendered visually.',
    detail: 'Connects to E&M Fields unit',
    status: 'coming-soon',
  },
  {
    icon: '🪐',
    title: 'Orbital Mechanics Engine',
    desc: 'Set a planet\'s mass and initial velocity — watch it orbit, escape, or spiral inward. Demonstrates Kepler\'s laws and escape velocity with real gravitational physics.',
    detail: 'Connects to Universal Gravity unit',
    status: 'coming-soon',
  },
]

export default function LabPage() {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="RESEARCH LAB" activeTab="Mass" />
        <div style={{ flex: 1, padding: '40px' }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>Research Lab</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 620 }}>
              The Research Lab is Parallax's version of <strong style={{ color: 'var(--cyan)' }}>PhET Interactive Simulations</strong> —
              physics sandboxes where you can manipulate variables and watch real equations play out visually.
              Each tool connects directly to a unit in the Galaxy. No pressure, no scoring — just exploration.
            </p>
          </div>

          <div style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>🚧 IN DEVELOPMENT</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              These simulators are being built as standalone interactive React components.
              Each one will be unlocked when you complete its corresponding Galaxy unit.
              The Projectile Motion and Force Sandbox tools are coming first.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {LAB_TOOLS.map((tool, i) => (
              <div key={tool.title} className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 18, opacity: 0.75 }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{tool.title}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--border)', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      COMING SOON
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{tool.desc}</div>
                  <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
                    🔗 {tool.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button onClick={() => router.push('/galaxy')}
              style={{ padding: '12px 32px', background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 4, color: 'var(--cyan)', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
              ← BACK TO GALAXY
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
