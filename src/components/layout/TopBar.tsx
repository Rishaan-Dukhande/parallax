'use client'

// TopBar accepts two props:
// - title: the page name shown on the left
// - activeTab: which subject tab is highlighted on the right
export default function TopBar({
  title,
  activeTab = 'Velocity'
}: {
  title: string
  activeTab?: string
}) {
  const TABS = ['Velocity', 'Mass', 'Energy', 'Entropy']

  return (
    <div style={{
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {TABS.map(tab => (
          <span key={tab} style={{
            fontSize: 12,
            fontFamily: 'JetBrains Mono, monospace',
            color: tab === activeTab ? 'var(--cyan)' : 'var(--text-muted)',
            borderBottom: tab === activeTab ? '1px solid var(--cyan)' : 'none',
            paddingBottom: 2,
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}>
            {tab.toUpperCase()}
          </span>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <span style={{ fontSize: 18, cursor: 'pointer' }}>🔔</span>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--cyan-dim)',
          border: '1px solid var(--cyan)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, cursor: 'pointer',
        }}>👤</div>
      </div>
    </div>
  )
}
