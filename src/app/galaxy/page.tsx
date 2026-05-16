'use client'
import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

// ─────────────────────────────────────────────
// TOPIC DATA
// unlocks: which topic IDs get unlocked when
//          this topic reaches 80%+ mastery
// prereqs: which topics must be done first
//          (used to auto-lock/unlock nodes)
// ─────────────────────────────────────────────
const TOPICS = [
  {
    id: 1, name: 'Kinematics', x: 28, y: 28,
    state: 'done', mastery: 94,
    concepts: '5/5', labs: '3/3', assessment: 96,
    unlocks: [2, 3],   // completing this opens Newton's Laws AND Work & Energy
    prereqs: [],
    description: 'Motion, velocity, and acceleration — the language of moving objects.',
    simModules: ['Projectile Motion', 'Velocity Graphs', 'Free Fall'],
    unlockNote: 'Unlocks: Newton\'s Laws + Work & Energy',
  },
  {
    id: 2, name: "Newton's Laws", x: 44, y: 52,
    state: 'done', mastery: 81,
    concepts: '5/5', labs: '2/3', assessment: 82,
    unlocks: [4, 5],   // completing this opens Momentum AND Universal Gravity
    prereqs: [1],
    description: 'Force, mass, and acceleration — the rules that govern every push and pull.',
    simModules: ['Force Diagrams', 'Friction Lab', 'Tension Systems'],
    unlockNote: 'Unlocks: Momentum + Universal Gravity',
  },
  {
    id: 3, name: 'Work & Energy', x: 68, y: 30,
    state: 'active', mastery: 60,
    concepts: '3/5', labs: '2/3', assessment: 82,
    unlocks: [4],      // completing this opens only Momentum
    prereqs: [1],
    description: 'Explore kinetic energy, potential energy, and conservation principles.',
    simModules: ['Kinetic Calculations', 'Potential Wells', 'Elastic Collisions', 'Non-Conservative Forces'],
    unlockNote: 'Unlocks: Momentum',
  },
  {
    id: 4, name: 'Momentum', x: 58, y: 62,
    state: 'locked', mastery: 0,
    concepts: '0/5', labs: '0/3', assessment: 0,
    unlocks: [6],      // completing this opens Oscillations
    prereqs: [2, 3],   // needs BOTH Newton's Laws AND Work & Energy
    description: 'The physics of collisions and conservation in isolated systems.',
    simModules: ['Elastic Collisions', 'Impulse', 'Center of Mass'],
    unlockNote: 'Requires: Newton\'s Laws + Work & Energy',
  },
  {
    id: 5, name: 'Universal Gravity', x: 76, y: 50,
    state: 'locked', mastery: 0,
    concepts: '0/5', labs: '0/3', assessment: 0,
    unlocks: [],       // end of this branch
    prereqs: [2],
    description: 'Orbital mechanics and gravitational fields across the cosmos.',
    simModules: ['Orbital Paths', 'Escape Velocity', 'Tidal Forces'],
    unlockNote: 'Requires: Newton\'s Laws',
  },
  {
    id: 6, name: 'Oscillations', x: 35, y: 72,
    state: 'locked', mastery: 0,
    concepts: '0/5', labs: '0/3', assessment: 0,
    unlocks: [7],
    prereqs: [4],
    description: 'Springs, pendulums, and the mathematics of repeating motion.',
    simModules: ['Simple Harmonic Motion', 'Damping', 'Resonance'],
    unlockNote: 'Requires: Momentum',
  },
  {
    id: 7, name: 'E&M Fields', x: 72, y: 78,
    state: 'locked', mastery: 0,
    concepts: '0/5', labs: '0/3', assessment: 0,
    unlocks: [],
    prereqs: [6],
    description: 'Electric fields, magnetic forces, and the unified theory of electromagnetism.',
    simModules: ['Coulomb\'s Law', 'Field Lines', 'Lorentz Force'],
    unlockNote: 'Requires: Oscillations',
  },
]

// Draw edges between topics that share a prereq relationship
const EDGES = [
  [1, 2], [1, 3],
  [2, 4], [2, 5],
  [3, 4],
  [4, 6],
  [6, 7],
]

const stateColor = (state: string) => ({
  done: '#00F0FF',
  active: '#00FF88',
  locked: '#2A2D40',
}[state] || '#2A2D40')

export default function GalaxyPage() {
  const [selected, setSelected] = useState<number | null>(3)
  const activeTopic = TOPICS.find(t => t.id === selected)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOP BAR */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>PHYSICS MODULE</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace' }}>PARALLAX GALAXY</div>
            </div>
            <div style={{ width: 1, height: 30, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>
                Knowledge Score: <span style={{ color: 'var(--cyan)' }}>67</span> / 100
              </span>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} style={{ width: 20, height: 6, borderRadius: 1, background: i <= 6 ? (i <= 4 ? 'var(--cyan)' : 'var(--purple)') : 'var(--border)' }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {['VELOCITY', 'MASS', 'ENERGY', 'ENTROPY'].map((tab, i) => (
              <span key={tab} style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: i === 2 ? 'var(--cyan)' : 'var(--text-muted)', borderBottom: i === 2 ? '1px solid var(--cyan)' : 'none', paddingBottom: 2, cursor: 'pointer' }}>{tab}</span>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <span style={{ fontSize: 18 }}>🔔</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
          </div>
        </div>

        {/* STAR MAP + DETAIL PANEL */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px' }}>

          {/* LEFT: SVG STAR MAP */}
          <div style={{ position: 'relative', background: 'radial-gradient(ellipse at 60% 40%, #1A0A3022 0%, transparent 70%)' }}>

            {/* Twinkling stars */}
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${(i * 37 + 11) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                width: i % 4 === 0 ? 2 : 1, height: i % 4 === 0 ? 2 : 1,
                borderRadius: '50%', background: 'white',
                opacity: 0.1 + (i % 5) * 0.05,
                animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${(i % 4) * 0.5}s`,
                pointerEvents: 'none',
              }} />
            ))}

            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} preserveAspectRatio="xMidYMid meet">

              {/* Connection lines */}
              {EDGES.map(([aId, bId], i) => {
                const a = TOPICS.find(t => t.id === aId)!
                const b = TOPICS.find(t => t.id === bId)!
                const isLit = a.state !== 'locked' && b.state !== 'locked'
                return (
                  <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isLit ? '#00F0FF' : '#1A1D35'}
                    strokeWidth={isLit ? 0.3 : 0.2}
                    strokeOpacity={isLit ? 0.5 : 0.3}
                    strokeDasharray={isLit ? 'none' : '1 1'}
                  />
                )
              })}

              {/* Topic nodes */}
              {TOPICS.map(topic => {
                const isSelected = selected === topic.id
                const color = stateColor(topic.state)

                return (
                  <g key={topic.id}
                    style={{ cursor: topic.state === 'locked' ? 'not-allowed' : 'pointer' }}
                    onClick={() => topic.state !== 'locked' && setSelected(topic.id)}
                  >
                    {/* Unlock preview lines — shown when this node is selected */}
                    {/* This teaches the student what they will unlock next */}
                    {isSelected && topic.unlocks.map(unlockId => {
                      const target = TOPICS.find(t => t.id === unlockId)
                      if (!target) return null
                      return (
                        <line key={unlockId}
                          x1={topic.x} y1={topic.y}
                          x2={target.x} y2={target.y}
                          stroke="#9B5DFF"
                          strokeWidth="0.4"
                          strokeOpacity="0.6"
                          strokeDasharray="0.8 0.8"
                        />
                      )
                    })}

                    {/* Outer glow ring */}
                    {(isSelected || topic.state === 'active') && (
                      <circle cx={topic.x} cy={topic.y} r={isSelected ? 7.5 : 6.5}
                        fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.3"
                        style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                      />
                    )}

                    {/* Main circle */}
                    <circle cx={topic.x} cy={topic.y} r={5}
                      fill={topic.state === 'locked' ? '#0F1120' : `${color}22`}
                      stroke={color} strokeWidth={isSelected ? 0.9 : 0.5}
                    />

                    {/* Icon */}
                    <text x={topic.x} y={topic.y + 0.8}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="3.5" fill={color} fontWeight="bold"
                    >
                      {topic.state === 'done' ? '✓' : topic.state === 'active' ? '⚡' : '🔒'}
                    </text>

                    {/* Label */}
                    <text x={topic.x} y={topic.y + 8}
                      textAnchor="middle" fontSize="2.8"
                      fill={topic.state === 'locked' ? '#3D4266' : '#E8EEFF'}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {topic.name}
                    </text>

                    {/* Unlocks badge — small pill showing how many paths open */}
                    {topic.state !== 'locked' && topic.unlocks.length > 0 && (
                      <g>
                        <rect x={topic.x + 3.5} y={topic.y - 8} width={topic.unlocks.length > 1 ? 8 : 6} height={3.5} rx="1.5"
                          fill={topic.unlocks.length > 1 ? '#9B5DFF' : '#00F0FF'}
                          fillOpacity="0.9"
                        />
                        <text x={topic.x + 7.5} y={topic.y - 6.3}
                          textAnchor="middle" fontSize="2.2"
                          fill="white" fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          +{topic.unlocks.length}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Bottom status bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid var(--border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>Navigation Vector</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>Galactic Coordinate: 42.08.192</div>
              </div>
              <div style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔔</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace' }}>Parallax Shift Detected</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>You are in the top 5% of this module users.</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAIL PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>
            {activeTopic ? (
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', height: '100%' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                    Core Theory
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer' }}>ℹ</div>
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 20 }}>{activeTopic.name}</h2>

                {/* Mastery gauge */}
                <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                      <svg viewBox="0 0 80 80" width="80" height="80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="6" />
                        <circle cx="40" cy="40" r="32" fill="none"
                          stroke={stateColor(activeTopic.state)}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - activeTopic.mastery / 100)}`}
                          transform="rotate(-90 40 40)"
                          style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{activeTopic.mastery}%</div>
                        <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Mastery</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Concepts Learnt', value: activeTopic.concepts },
                        { label: 'Labs Completed', value: activeTopic.labs },
                        { label: 'Assessment Score', value: `${activeTopic.assessment}%` },
                      ].map(stat => (
                        <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{stat.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Objective Analysis</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{activeTopic.description}</div>
                </div>

                {/* Unlock path info */}
                <div style={{ background: activeTopic.unlocks.length > 1 ? 'var(--purple-dim)' : 'var(--cyan-dim)', border: `1px solid ${activeTopic.unlocks.length > 1 ? 'var(--purple)' : 'var(--cyan)'}`, borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 11, color: activeTopic.unlocks.length > 1 ? 'var(--purple)' : 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {activeTopic.state === 'locked' ? `🔒 ${activeTopic.unlockNote}` : activeTopic.unlocks.length > 0 ? `⚡ ${activeTopic.unlockNote}` : '✓ Final node in this branch'}
                </div>

                {/* Simulation modules */}
                <div style={{ marginBottom: 'auto' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Simulation Modules</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {activeTopic.simModules.map(mod => (
                      <div key={mod} style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                        {mod}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ marginTop: 24 }}>
                  <button style={{ width: '100%', padding: '14px', background: activeTopic.state === 'locked' ? 'var(--border)' : 'var(--cyan)', border: 'none', borderRadius: 4, color: activeTopic.state === 'locked' ? 'var(--text-muted)' : 'var(--bg-base)', fontSize: 14, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: activeTopic.state === 'locked' ? 'not-allowed' : 'pointer', boxShadow: activeTopic.state !== 'locked' ? '0 0 20px var(--cyan-glow)' : 'none' }}>
                    {activeTopic.state === 'locked' ? '🔒 LOCKED' : 'CONTINUE LEARNING →'}
                  </button>
                  {activeTopic.state === 'active' && (
                    <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      Next Unlock: {TOPICS.filter(t => activeTopic.unlocks.includes(t.id)).map(t => t.name).join(' + ')}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                ← Select a topic node
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
