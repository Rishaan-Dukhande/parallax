'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setError('Check your email to confirm your account, then sign in.')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/galaxy')
    router.refresh()
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, width: '100%', padding: '0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>🌌</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#E8EEFF', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>PARALLAX</h1>
        <p style={{ fontSize: 13, color: '#6B7299', marginBottom: 32, fontFamily: 'JetBrains Mono, monospace' }}>AP Physics C Learning System</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <input type="email" required placeholder="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '12px', background: '#0F1120', border: '1px solid #23263D', borderRadius: 4, color: '#E8EEFF', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
          <input type="password" required placeholder="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding: '12px', background: '#0F1120', border: '1px solid #23263D', borderRadius: 4, color: '#E8EEFF', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
          {error && <div style={{ fontSize: 12, color: '#FF0044', fontFamily: 'JetBrains Mono, monospace' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00F0FF, #9B5DFF)', border: 'none', borderRadius: 4, color: '#07080F', fontSize: 14, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? '...' : mode === 'signup' ? '⚡ CREATE ACCOUNT' : '⚡ SIGN IN'}
          </button>
        </form>

        <button onClick={handleGoogle}
          style={{ width: '100%', padding: '12px', background: '#fff', border: 'none', borderRadius: 4, color: '#1F1F1F', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', marginBottom: 16 }}>
          Continue with Google
        </button>

        <p style={{ fontSize: 12, color: '#6B7299', fontFamily: 'JetBrains Mono, monospace' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')} style={{ color: '#00F0FF', cursor: 'pointer' }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}
