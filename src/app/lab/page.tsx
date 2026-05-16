import Sidebar from '@/components/layout/Sidebar'
export default function LabPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, padding: '40px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        ⚗ Research Lab — coming soon
      </main>
    </div>
  )
}
