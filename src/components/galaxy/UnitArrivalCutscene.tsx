'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  unitName: string
  onComplete: () => void
}

export default function UnitArrivalCutscene({ unitName, onComplete }: Props) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 300)
    const t2 = setTimeout(() => setPhase('exit'), 3000)
    const t3 = setTimeout(() => onCompleteRef.current(), 3600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      onClick={onComplete}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 50%, #0D0A2A 0%, #07080F 100%)',
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 0.6s ease' : 'none',
        cursor: 'pointer',
      }}
    >
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 53 + 7) % 100}%`,
          width: i % 5 === 0 ? 2 : 1,
          height: i % 5 === 0 ? 2 : 1,
          borderRadius: '50%',
          background: 'white',
          animation: `arrival-twinkle ${2 + (i % 3)}s ease-in-out infinite`,
          animationDelay: `${(i % 4) * 0.5}s`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{
        textAlign: 'center',
        transform: phase === 'enter' ? 'translateY(16px) scale(0.92)' : 'translateY(0) scale(1)',
        opacity: phase === 'enter' ? 0 : 1,
        transition: 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: 10, letterSpacing: 6, color: '#00F0FF',
          fontFamily: 'JetBrains Mono, monospace', marginBottom: 24,
          opacity: 0.6,
        }}>
          ENTERING CONSTELLATION
        </div>
        <div style={{
          fontSize: 44, fontWeight: 900, color: '#E8EEFF',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: 3,
          textShadow: '0 0 60px #00F0FF66, 0 0 20px #00F0FF44',
          marginBottom: 28,
        }}>
          {unitName.toUpperCase()}
        </div>
        <div style={{
          width: 240, height: 1,
          background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)',
          margin: '0 auto 28px',
        }} />
        <div style={{
          fontSize: 10, color: '#3D4266',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: 3,
        }}>
          TAP ANYWHERE TO SKIP
        </div>
      </div>

      <style>{`
        @keyframes arrival-twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
