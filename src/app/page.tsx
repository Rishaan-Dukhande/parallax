'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
      setCheckingAuth(false)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07080F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
        {!checkingAuth && (
          userEmail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'rgba(232,238,255,0.6)' }}>{userEmail}</span>
              <button onClick={handleSignOut}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #23263D', borderRadius: 4, color: '#E8EEFF', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                SIGN OUT
              </button>
            </div>
          ) : (
            <button onClick={() => router.push('/login')}
              style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #00F0FF', borderRadius: 4, color: '#00F0FF', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
              SIGN IN
            </button>
          )
        )}
      </div>

      {/* Star field */}
      {Array.from({ length: 60 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 53 + 7) % 100}%`,
          width: i % 5 === 0 ? 2 : 1,
          height: i % 5 === 0 ? 2 : 1,
          borderRadius: '50%',
          background: 'white',
          opacity: 0.05 + (i % 5) * 0.04,
        }} />
      ))}

      {/* Glow orb */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', maxWidth: 680, padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{
          fontSize: 13,
          color: 'rgba(0,240,255,0.6)',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: 6,
          marginBottom: 24,
        }}>
          ✦ PARALLAX LEARNING SYSTEM
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 11vw, 72px)',
          fontWeight: 900,
          color: '#E8EEFF',
          marginBottom: 8,
          fontFamily: 'Orbitron, monospace',
          letterSpacing: 4,
          textShadow: '0 0 60px rgba(0,240,255,0.3)',
          lineHeight: 1.1,
        }}>
          PARALLAX
        </h1>

        <div style={{
          fontSize: 'clamp(14px, 4vw, 18px)',
          color: 'rgba(232,238,255,0.6)',
          marginBottom: 16,
          fontFamily: 'DM Sans, sans-serif',
          letterSpacing: 2,
        }}>
          Master AP Physics C Through Combat
        </div>

        <div style={{
          fontSize: 'clamp(11px, 3vw, 13px)',
          color: 'rgba(107,114,153,0.8)',
          marginBottom: 56,
          fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 1.8,
        }}>
          AI-powered lessons · Boss battles · Infinite drill mode<br />
          Adaptive difficulty · Real AP Physics C content
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <button
            onClick={() => router.push('/galaxy')}
            style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #00F0FF, #9B5DFF)',
              border: 'none',
              borderRadius: 4,
              color: '#07080F',
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: 2,
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(0,240,255,0.4)',
            }}>
            ⚡ START LEARNING
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '16px 48px',
              background: 'transparent',
              border: '1px solid rgba(0,240,255,0.3)',
              borderRadius: 4,
              color: '#00F0FF',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
            }}>
            VIEW DASHBOARD
          </button>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '🦉', label: 'AI Tutor' },
            { icon: '👾', label: 'Boss Battles' },
            { icon: '⚡', label: 'Infinite Quiz' },
            { icon: '🌌', label: 'Progress Galaxy' },
            { icon: '🏆', label: 'Leaderboards' },
          ].map(f => (
            <div key={f.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              color: 'rgba(232,238,255,0.5)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;500&display=swap');
      `}</style>
    </div>
  )
}
