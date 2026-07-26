'use client'
import { useRouter } from 'next/navigation'

// The tabs correspond to AP science subjects Parallax will eventually cover:
// Velocity  → AP Physics C: Mechanics (current — kinematics, forces, energy)
// Mass      → AP Physics C: Electricity & Magnetism (E&M fields, circuits)
// Energy    → AP Chemistry (thermodynamics, reactions, equilibrium)
// Entropy   → AP Thermodynamics / Statistical Mechanics (advanced, future)

export default function TopBar({
  title,
  activeTab = 'Velocity'
}: {
  title: string
  activeTab?: string
}) {
  const router = useRouter()
  const TABS = [
    { label: 'Velocity', subject: 'AP Physics C: Mechanics', available: true, href: '/galaxy' },
    { label: 'Mass', subject: 'AP Physics C: E&M', available: false, href: '#' },
    { label: 'Energy', subject: 'AP Chemistry', available: false, href: '#' },
    { label: 'Entropy', subject: 'AP Thermodynamics', available: false, href: '#' },
  ]

  return (
    <div className="app-topbar" style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 40px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-sidebar)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>

      {/* LEFT: Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--cyan)',
          boxShadow: '0 0 6px var(--cyan)',
        }} />
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: 2,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {title}
        </span>
      </div>

      {/* RIGHT: Subject tabs + icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {TABS.map(tab => {
          const isActive = tab.label === activeTab
          return (
            <div
              key={tab.label}
              title={`${tab.subject}${tab.available ? '' : ' — Coming Soon'}`}
              onClick={() => tab.available && router.push(tab.href)}
              style={{
                position: 'relative',
                padding: '4px 12px',
                cursor: tab.available ? 'pointer' : 'default',
                borderRadius: 4,
              }}
            >
              <span style={{
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
                color: isActive ? 'var(--cyan)' : tab.available ? 'var(--text-secondary)' : 'var(--text-muted)',
                borderBottom: isActive ? '1px solid var(--cyan)' : 'none',
                paddingBottom: 2,
                transition: 'var(--transition)',
                opacity: tab.available ? 1 : 0.5,
              }}>
                {tab.label.toUpperCase()}
              </span>
              {!tab.available && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: 2,
                  fontSize: 6,
                  color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  SOON
                </span>
              )}
            </div>
          )
        })}

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />

        {/* Bell */}
        <span style={{ fontSize: 18, cursor: 'pointer', padding: '0 4px' }} title="Notifications">🔔</span>

        {/* Profile */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--cyan-dim)',
          border: '1px solid var(--cyan)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, cursor: 'pointer',
          marginLeft: 4,
        }} title="Profile" onClick={() => router.push('/settings')}>
          👤
        </div>
      </div>
    </div>
  )
}
