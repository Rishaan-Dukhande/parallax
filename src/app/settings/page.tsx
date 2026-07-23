'use client'
import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default function SettingsPage() {
  const [learningStyle, setLearningStyle] = useState<'intuitive' | 'visual' | 'mathematical'>('intuitive')
  const [notifications, setNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="SETTINGS" activeTab="Mass" />
        <div style={{ flex: 1, padding: '40px', maxWidth: 640 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>Settings</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>Customize your Parallax experience</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Learning style */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>LEARNING STYLE</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>How lessons explain concepts to you</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['intuitive', 'visual', 'mathematical'] as const).map(style => (
                  <button key={style} onClick={() => setLearningStyle(style)}
                    style={{ flex: 1, padding: '10px', background: learningStyle === style ? 'var(--cyan-dim)' : 'var(--bg-surface)', border: `1px solid ${learningStyle === style ? 'var(--cyan)' : 'var(--border)'}`, borderRadius: 4, color: learningStyle === style ? 'var(--cyan)' : 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', fontWeight: learningStyle === style ? 700 : 400, letterSpacing: 1 }}>
                    {style.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 10 }}>
                {learningStyle === 'intuitive' && 'Analogies and real-world examples — great for beginners'}
                {learningStyle === 'visual' && 'Diagrams, animations, and spatial reasoning'}
                {learningStyle === 'mathematical' && 'Full equations and calculus-based AP Physics C treatment'}
              </div>
            </div>

            {/* Notifications */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>STREAK REMINDERS</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Daily reminder to maintain your streak</div>
              </div>
              <button onClick={() => setNotifications(n => !n)}
                style={{ width: 52, height: 28, borderRadius: 14, background: notifications ? 'var(--cyan)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
                <div style={{ position: 'absolute', top: 4, left: notifications ? 28 : 4, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.3s' }} />
              </button>
            </div>

            {/* Account info */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', marginBottom: 16 }}>ACCOUNT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'User ID', value: 'sandeep-default' },
                  { label: 'Plan', value: 'Parallax Free' },
                  { label: 'Data', value: 'Stored in Supabase' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <button onClick={handleSave}
              style={{ padding: '14px', background: saved ? 'var(--green)' : 'linear-gradient(135deg, var(--cyan), var(--purple))', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 14, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', letterSpacing: 1, transition: 'background 0.3s' }}>
              {saved ? '✓ SAVED' : 'SAVE SETTINGS'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
