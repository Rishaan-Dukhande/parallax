'use client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  return (
    <div style={{
      minHeight: '100vh',
      background: '#07080F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>🌌</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#E8EEFF', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>
          PARALLAX
        </h1>
        <p style={{ fontSize: 13, color: '#6B7299', marginBottom: 32, fontFamily: 'JetBrains Mono, monospace' }}>
          AP Physics C Learning System
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00F0FF, #9B5DFF)', border: 'none', borderRadius: 4, color: '#07080F', fontSize: 14, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
          ⚡ ENTER PARALLAX
        </button>
        <p style={{ fontSize: 11, color: '#3D4266', marginTop: 16, fontFamily: 'JetBrains Mono, monospace' }}>
          Real auth coming soon — click to continue
        </p>
      </div>
    </div>
  )
}
