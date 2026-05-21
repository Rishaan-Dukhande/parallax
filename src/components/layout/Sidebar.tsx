'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
  { label: 'Progress Galaxy', href: '/galaxy', icon: '✦' },
  { label: 'Quick Quiz', href: '/quiz', icon: '🎯' },
  { label: 'Missions', href: '/missions', icon: '◎' },
  { label: 'Research Lab', href: '/lab', icon: '⚗' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
]
export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside style={{ width: 'var(--sidebar-width)', minHeight: '100vh', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 50 }}>
      <div style={{ padding: '28px 24px 20px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--cyan)', letterSpacing: 3, textShadow: '0 0 20px var(--cyan-glow)', fontFamily: 'Orbitron, monospace' }}>PARALLAX</div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 2, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>LEVEL 42 NAVIGATOR</div>
      </div>
      <div style={{ height: 1, background: 'var(--border)', margin: '0 16px 20px' }} />
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 4, marginBottom: 2, background: isActive ? 'var(--cyan-dim)' : 'transparent', borderLeft: isActive ? '2px solid var(--cyan)' : '2px solid transparent', color: isActive ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: 12, fontWeight: isActive ? 700 : 500, letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', transition: 'var(--transition)' }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label.toUpperCase()}
              </div>
            </Link>
          )
        })}
      </nav>
      <div style={{ padding: '0 16px 20px' }}>
        <button style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--cyan)', borderRadius: 4, color: 'var(--cyan)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>ENTER PARALLAX</button>
      </div>
      <div style={{ height: 1, background: 'var(--border)', margin: '0 16px 16px' }} />
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 4, background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Sandeep</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace' }}>SENIOR NAVIGATOR</div>
        </div>
      </div>
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {['SYSTEM STATUS', 'HELP'].map(label => (
          <div key={label} style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: label === 'SYSTEM STATUS' ? 'var(--green)' : 'var(--text-muted)', boxShadow: label === 'SYSTEM STATUS' ? '0 0 6px var(--green)' : 'none' }} />
            {label}
          </div>
        ))}
      </div>
    </aside>
  )
}
