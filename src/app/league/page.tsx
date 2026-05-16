import Sidebar from '@/components/layout/Sidebar'
export default function LeaguePage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, padding: '40px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        🏆 League — coming soon
      </main>
    </div>
  )
}
