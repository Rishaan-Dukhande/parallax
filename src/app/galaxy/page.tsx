'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

// ─────────────────────────────────────────────
// HELPER: Calculate star-branch positions
// Lesson 1 → center (50, 50)
// Lessons 2-N → evenly spaced around a circle
// ─────────────────────────────────────────────
function getStarPositions(count: number, radius = 28) {
  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return { x: 50, y: 50 } // first lesson always center
    const angle = ((i - 1) / (count - 1)) * 2 * Math.PI
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    }
  })
}

// ─────────────────────────────────────────────
// UNIT DATA
// subUnits no longer need x/y — positions are
// calculated automatically by getStarPositions
// ─────────────────────────────────────────────
const UNITS = [
  {
    id: 1, name: 'Kinematics', x: 28, y: 28,
    state: 'done', mastery: 94,
    concepts: '5/5', labs: '3/3', assessment: 96,
    unlocks: [2, 3], prereqs: [],
    description: 'Motion, velocity, and acceleration — the language of moving objects.',
    unlockNote: "Unlocks: Newton's Laws + Work & Energy",
    subUnits: [
      { id: 101, name: 'What is Motion?', state: 'done', type: 'lesson' },
      { id: 102, name: 'Velocity vs Speed', state: 'done', type: 'lesson' },
      { id: 103, name: 'Acceleration', state: 'done', type: 'lesson' },
      { id: 104, name: 'Kinematic Equations', state: 'done', type: 'lesson' },
      { id: 105, name: 'Projectile Motion', state: 'done', type: 'lesson' },
    ],
    bossState: 'done',
  },
  {
    id: 2, name: "Newton's Laws", x: 44, y: 52,
    state: 'done', mastery: 81,
    concepts: '5/5', labs: '2/3', assessment: 82,
    unlocks: [4, 5], prereqs: [1],
    description: 'Force, mass, and acceleration — the rules that govern every push and pull.',
    unlockNote: 'Unlocks: Momentum + Universal Gravity',
    subUnits: [
      { id: 201, name: 'Force Basics', state: 'done', type: 'lesson' },
      { id: 202, name: 'Free Body Diagrams', state: 'done', type: 'lesson' },
      { id: 203, name: "Newton's 1st Law", state: 'done', type: 'lesson' },
      { id: 204, name: "Newton's 2nd Law", state: 'active', type: 'lesson' },
      { id: 205, name: "Newton's 3rd Law", state: 'locked', type: 'lesson' },
      { id: 206, name: 'Force Intuition', state: 'locked', type: 'intermediate' },
    ],
    bossState: 'locked',
  },
  {
    id: 3, name: 'Work & Energy', x: 68, y: 30,
    state: 'active', mastery: 60,
    concepts: '3/5', labs: '2/3', assessment: 82,
    unlocks: [4], prereqs: [1],
    description: 'Explore kinetic energy, potential energy, and conservation principles.',
    unlockNote: 'Unlocks: Momentum',
    subUnits: [
      { id: 301, name: 'What is Work?', state: 'done', type: 'lesson' },
      { id: 302, name: 'Kinetic Energy', state: 'done', type: 'lesson' },
      { id: 303, name: 'Potential Energy', state: 'active', type: 'lesson' },
      { id: 304, name: 'Conservation of Energy', state: 'locked', type: 'lesson' },
      { id: 305, name: 'Work-Energy Theorem', state: 'locked', type: 'lesson' },
    ],
    bossState: 'locked',
  },
  {
    id: 4, name: 'Momentum', x: 58, y: 62,
    state: 'locked', mastery: 0,
    concepts: '0/5', labs: '0/3', assessment: 0,
    unlocks: [6], prereqs: [2, 3],
    description: 'The physics of collisions and conservation in isolated systems.',
    unlockNote: "Requires: Newton's Laws + Work & Energy",
    subUnits: [
      { id: 401, name: 'What is Momentum?', state: 'locked', type: 'lesson' },
      { id: 402, name: 'Impulse', state: 'locked', type: 'lesson' },
      { id: 403, name: 'Conservation Law', state: 'locked', type: 'lesson' },
      { id: 404, name: 'Elastic Collisions', state: 'locked', type: 'lesson' },
    ],
    bossState: 'locked',
  },
  {
    id: 5, name: 'Universal Gravity', x: 76, y: 50,
    state: 'locked', mastery: 0,
    concepts: '0/5', labs: '0/3', assessment: 0,
    unlocks: [], prereqs: [2],
    description: 'Orbital mechanics and gravitational fields across the cosmos.',
    unlockNote: "Requires: Newton's Laws",
    subUnits: [
      { id: 501, name: "Newton's Law of Gravity", state: 'locked', type: 'lesson' },
      { id: 502, name: 'Gravitational Fields', state: 'locked', type: 'lesson' },
      { id: 503, name: 'Orbital Motion', state: 'locked', type: 'lesson' },
      { id: 504, name: 'Escape Velocity', state: 'locked', type: 'lesson' },
    ],
    bossState: 'locked',
  },
  {
    id: 6, name: 'Oscillations', x: 35, y: 75,
    state: 'locked', mastery: 0,
    concepts: '0/5', labs: '0/3', assessment: 0,
    unlocks: [7], prereqs: [4],
    description: 'Springs, pendulums, and the mathematics of repeating motion.',
    unlockNote: 'Requires: Momentum',
    subUnits: [
      { id: 601, name: 'Simple Harmonic Motion', state: 'locked', type: 'lesson' },
      { id: 602, name: 'Spring Forces', state: 'locked', type: 'lesson' },
      { id: 603, name: 'Pendulums', state: 'locked', type: 'lesson' },
      { id: 604, name: 'Resonance', state: 'locked', type: 'lesson' },
    ],
    bossState: 'locked',
  },
  {
    id: 7, name: 'E&M Fields', x: 72, y: 78,
    state: 'locked', mastery: 0,
    concepts: '0/5', labs: '0/3', assessment: 0,
    unlocks: [], prereqs: [6],
    description: 'Electric fields, magnetic forces, and electromagnetism.',
    unlockNote: 'Requires: Oscillations',
    subUnits: [
      { id: 701, name: "Coulomb's Law", state: 'locked', type: 'lesson' },
      { id: 702, name: 'Electric Fields', state: 'locked', type: 'lesson' },
      { id: 703, name: 'Magnetic Forces', state: 'locked', type: 'lesson' },
      { id: 704, name: 'Lorentz Force', state: 'locked', type: 'lesson' },
    ],
    bossState: 'locked',
  },
]

const UNIT_EDGES = [
  [1, 2], [1, 3], [2, 4], [2, 5], [3, 4], [4, 6], [6, 7],
]

const stateColor = (state: string) => ({
  done: '#00F0FF', active: '#00FF88', locked: '#2A2D40',
}[state] || '#2A2D40')

const typeColor = (type: string) => ({
  lesson: '#00F0FF', intermediate: '#FF6B2B', boss: '#FF0044',
}[type] || '#00F0FF')

async function fetchUserStars(): Promise<Record<number, number>> {
  try {
    const res = await fetch('/api/progress/stars')
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

function getLessonVisualState(
  lessonId: number,
  userStars: Record<number, number>,
  hardcodedState: string
): { state: 'done' | 'active' | 'locked' | 'newly-unlocked', stars: number } {
  const stars = userStars[lessonId] || 0
  const lessonNum = lessonId % 100

  if (stars >= 2) return { state: 'done', stars }

  if (lessonNum === 1) {
    return { state: stars >= 1 ? 'active' : 'newly-unlocked', stars }
  }

  const previousId = lessonId - 1
  const previousStars = userStars[previousId] || 0

  if (previousStars >= 2) {
    return { state: stars >= 1 ? 'active' : 'newly-unlocked', stars }
  }

  return { state: 'locked', stars }
}

export default function GalaxyPage() {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)

  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)
  const [selectedSubUnit, setSelectedSubUnit] = useState<number | null>(null)
  const [zoomedUnit, setZoomedUnit] = useState<number | null>(null)
  const [isZooming, setIsZooming] = useState(false)
  const [showBossAnimation, setShowBossAnimation] = useState(false)
  const [userStars, setUserStars] = useState<Record<number, number>>({})

  useEffect(() => {
    fetchUserStars().then(stars => setUserStars(stars))

    const handleUpdate = () => {
      fetchUserStars().then(stars => setUserStars(stars))
    }
    window.addEventListener('progress-updated', handleUpdate)
    return () => window.removeEventListener('progress-updated', handleUpdate)
  }, [])

  // Pan state for scrollable canvas
  const [pan, setPan] = useState({ x: -10, y: -10 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const activeUnit = UNITS.find(u => u.id === selectedUnit)
  const zoomedUnitData = UNITS.find(u => u.id === zoomedUnit)
  const activeSubUnit = zoomedUnitData?.subUnits.find(s => s.id === selectedSubUnit)
  const activeSubUnitVisual = activeSubUnit
    ? getLessonVisualState(activeSubUnit.id, userStars, activeSubUnit.state)
    : null

  // Calculate star positions for current zoomed unit
  const subPositions = zoomedUnitData
    ? getStarPositions(zoomedUnitData.subUnits.length)
    : []

  // Check if all lessons in zoomed unit are done (enables boss)
  const allLessonsDone = zoomedUnitData
    ? zoomedUnitData.subUnits.every(s => {
        const { state } = getLessonVisualState(s.id, userStars, s.state)
        return state === 'done'
      })
    : false

  // Boss ring radius — wraps the entire constellation
  const BOSS_RING_RADIUS = 38

  const handleEnterUnit = (unitId: number) => {
    setIsZooming(true)
    setTimeout(() => {
      setZoomedUnit(unitId)
      setSelectedUnit(null)
      setSelectedSubUnit(null)
      setIsZooming(false)
      setPan({ x: -10, y: -10 })
    }, 1200)
  }

  const handleExitUnit = () => {
    setIsZooming(true)
    setShowBossAnimation(false)
    setTimeout(() => {
      setZoomedUnit(null)
      setSelectedUnit(null)
      setSelectedSubUnit(null)
      setIsZooming(false)
    }, 800)
  }

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = (e.clientX - dragStart.current.x) * 0.12
    const dy = (e.clientY - dragStart.current.y) * 0.12
    setPan({ x: dragStart.current.panX - dx, y: dragStart.current.panY - dy })
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          title={zoomedUnit ? `${zoomedUnitData?.name.toUpperCase()} — CONSTELLATION` : 'PARALLAX GALAXY'}
          activeTab="Energy"
        />

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px' }}>

          {/* ── LEFT: STAR MAP CANVAS ── */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'radial-gradient(ellipse at 50% 50%, #0D0A2A 0%, #07080F 100%)',
            borderRight: '1px solid var(--border)',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >

            {/* Back button */}
            {zoomedUnit && (
              <button onClick={handleExitUnit} style={{
                position: 'absolute', top: 16, left: 16, zIndex: 20,
                background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)',
                borderRadius: 4, padding: '8px 16px', color: 'var(--cyan)',
                fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer', letterSpacing: 1,
              }}>← OUTER GALAXY</button>
            )}

            {/* Drag hint */}
            <div style={{
              position: 'absolute', top: 16, right: 16, zIndex: 20,
              fontSize: 10, color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1,
            }}>
              DRAG TO EXPLORE
            </div>

            {/* Twinkling stars */}
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${(i * 37 + 11) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                width: i % 5 === 0 ? 2 : 1, height: i % 5 === 0 ? 2 : 1,
                borderRadius: '50%', background: 'white',
                opacity: 0.08 + (i % 5) * 0.04,
                animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${(i % 4) * 0.5}s`,
                pointerEvents: 'none',
              }} />
            ))}

            {/* Boss appearing animation overlay */}
            {showBossAnimation && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(ellipse at center, #3D000088 0%, transparent 70%)',
                animation: 'pulse-red 1s ease-in-out infinite',
              }}>
                <div style={{
                  textAlign: 'center',
                  animation: 'bossAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}>
                  <div style={{ fontSize: 80, marginBottom: 16, filter: 'drop-shadow(0 0 30px #FF0044)' }}>👾</div>
                  <div style={{ fontSize: 14, color: '#FF0044', fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, letterSpacing: 3 }}>BOSS DETECTED</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>All lessons mastered. Face the Singularity.</div>
                  <button
                    onClick={() => { setShowBossAnimation(false); router.push(`/boss/${zoomedUnit}`) }}
                    style={{
                      marginTop: 20, padding: '12px 32px',
                      background: '#FF0044', border: 'none', borderRadius: 4,
                      color: 'white', fontSize: 13, fontWeight: 900,
                      letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer', boxShadow: '0 0 30px #FF004488',
                    }}>
                    ⚡ ENTER BOSS BATTLE
                  </button>
                </div>
              </div>
            )}

            {/* SVG Canvas */}
            <svg
              ref={svgRef}
              viewBox={`${pan.x} ${pan.y} 120 120`}
              style={{
                width: '100%', height: '100%',
                position: 'absolute', inset: 0,
                transform: isZooming ? 'scale(2.5)' : 'scale(1)',
                transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none',
              }}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Glow filters */}
                <filter id="glow-cyan">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-red">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Boss ring gradient */}
                <radialGradient id="bossGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF0044" stopOpacity="0" />
                  <stop offset="85%" stopColor="#FF0044" stopOpacity="0" />
                  <stop offset="100%" stopColor="#FF0044" stopOpacity="0.15" />
                </radialGradient>
              </defs>

              {/* ── OUTER GALAXY ── */}
              {!zoomedUnit && (
                <>
                  {UNIT_EDGES.map(([aId, bId], i) => {
                    const a = UNITS.find(u => u.id === aId)!
                    const b = UNITS.find(u => u.id === bId)!
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

                  {UNITS.map(unit => {
                    const isSelected = selectedUnit === unit.id
                    const color = stateColor(unit.state)
                    return (
                      <g key={unit.id}
                        style={{ cursor: unit.state === 'locked' ? 'default' : 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (unit.state !== 'locked') setSelectedUnit(unit.id === selectedUnit ? null : unit.id)
                        }}
                      >
                        {isSelected && unit.unlocks.map(uid => {
                          const target = UNITS.find(u => u.id === uid)
                          if (!target) return null
                          return (
                            <line key={uid}
                              x1={unit.x} y1={unit.y} x2={target.x} y2={target.y}
                              stroke="#9B5DFF" strokeWidth="0.4"
                              strokeOpacity="0.7" strokeDasharray="0.8 0.8"
                            />
                          )
                        })}
                        {(isSelected || unit.state === 'active') && (
                          <circle cx={unit.x} cy={unit.y} r={isSelected ? 8 : 7}
                            fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.3"
                            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                          />
                        )}
                        <circle cx={unit.x} cy={unit.y} r={5.5}
                          fill={unit.state === 'locked' ? '#0F1120' : `${color}22`}
                          stroke={color} strokeWidth={isSelected ? 1 : 0.5}
                          filter={unit.state !== 'locked' ? 'url(#glow-cyan)' : undefined}
                        />
                        <text x={unit.x} y={unit.y + 1}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize="3.5" fill={color} fontWeight="bold"
                        >
                          {unit.state === 'done' ? '✓' : unit.state === 'active' ? '⚡' : '🔒'}
                        </text>
                        <text x={unit.x} y={unit.y + 9}
                          textAnchor="middle" fontSize="2.8"
                          fill={unit.state === 'locked' ? '#3D4266' : '#E8EEFF'}
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {unit.name}
                        </text>
                        {unit.state !== 'locked' && unit.unlocks.length > 0 && (
                          <g>
                            <rect x={unit.x + 4} y={unit.y - 9}
                              width={unit.unlocks.length > 1 ? 8 : 6} height={3.5} rx="1.5"
                              fill={unit.unlocks.length > 1 ? '#9B5DFF' : '#00F0FF'} fillOpacity="0.9"
                            />
                            <text x={unit.x + 8} y={unit.y - 7.3}
                              textAnchor="middle" fontSize="2.2"
                              fill="white" fontWeight="bold" fontFamily="JetBrains Mono, monospace"
                            >+{unit.unlocks.length}</text>
                          </g>
                        )}
                      </g>
                    )
                  })}
                </>
              )}

              {/* ── SUB-UNIT GALAXY ── */}
              {zoomedUnit && zoomedUnitData && (
                <>
                  {/* Boss ring — large circle around entire constellation */}
                  <circle cx="50" cy="50" r={BOSS_RING_RADIUS}
                    fill={allLessonsDone ? 'url(#bossGradient)' : 'none'}
                    stroke={allLessonsDone ? '#FF0044' : '#2A2D40'}
                    strokeWidth={allLessonsDone ? 0.6 : 0.3}
                    strokeDasharray={allLessonsDone ? 'none' : '2 2'}
                    strokeOpacity={allLessonsDone ? 0.8 : 0.3}
                    style={allLessonsDone ? { animation: 'pulse-red 2s ease-in-out infinite' } : {}}
                    filter={allLessonsDone ? 'url(#glow-red)' : undefined}
                  />

                  {/* Boss crown label on ring */}
                  <text x="50" y={50 - BOSS_RING_RADIUS - 2}
                    textAnchor="middle" fontSize="3"
                    fill={allLessonsDone ? '#FF0044' : '#3D4266'}
                    fontFamily="JetBrains Mono, monospace" fontWeight="bold"
                  >
                    {allLessonsDone ? '👑 BOSS UNLOCKED — TAP TO FIGHT' : '[ COMPLETE ALL LESSONS TO UNLOCK BOSS ]'}
                  </text>

                  {/* Clickable boss ring trigger */}
                  {allLessonsDone && (
                    <circle cx="50" cy="50" r={BOSS_RING_RADIUS}
                      fill="transparent" stroke="none"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); setShowBossAnimation(true) }}
                    />
                  )}

                  {/* Galactic mastery radius indicator */}
                  {(() => {
                    const doneCount = zoomedUnitData.subUnits.filter(s => s.state === 'done').length
                    const total = zoomedUnitData.subUnits.length
                    const radiusPct = 8 + (doneCount / total) * 22
                    return (
                      <circle cx="50" cy="50" r={radiusPct}
                        fill="none" stroke="#00F0FF"
                        strokeWidth="0.2" strokeOpacity="0.12"
                        strokeDasharray="1 2"
                      />
                    )
                  })()}

                  {/* Lines from center to each sub-unit */}
                  {subPositions.slice(1).map((pos, i) => {
                    const sub = zoomedUnitData.subUnits[i + 1]
                    const { state: centerState } = getLessonVisualState(zoomedUnitData.subUnits[0].id, userStars, zoomedUnitData.subUnits[0].state)
                    const { state: subState } = getLessonVisualState(sub.id, userStars, sub.state)
                    const isLit = centerState !== 'locked' && subState !== 'locked'
                    return (
                      <line key={i}
                        x1={50} y1={50}
                        x2={pos.x} y2={pos.y}
                        stroke={isLit ? typeColor(sub.type) : '#1A1D35'}
                        strokeWidth={isLit ? 0.3 : 0.2}
                        strokeOpacity={isLit ? 0.4 : 0.2}
                        strokeDasharray={isLit ? 'none' : '1 1'}
                      />
                    )
                  })}

                  {/* Sub-unit nodes */}
                  {zoomedUnitData.subUnits.map((sub, index) => {
                    const pos = subPositions[index]
                    const isSelected = selectedSubUnit === sub.id
                    const isCenter = index === 0
                    // Derive effective state from real Supabase stars + sequential unlock logic
                    const { state: effectiveState, stars: realStars } = getLessonVisualState(sub.id, userStars, sub.state)
                    const color = effectiveState === 'locked' ? '#2A2D40' : effectiveState === 'newly-unlocked' ? '#FF0044' : typeColor(sub.type)
                    const isIntermediate = sub.type === 'intermediate'
                    const nodeRadius = isCenter ? 6 : isIntermediate ? 3.5 : 4.5

                    return (
                      <g key={sub.id}
                        style={{ cursor: effectiveState === 'locked' ? 'default' : 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (effectiveState !== 'locked') {
                            setSelectedSubUnit(sub.id === selectedSubUnit ? null : sub.id)
                          }
                        }}
                      >
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeRadius + 6}
                          fill="transparent"
                          stroke="none"
                        />
                        {/* Glow ring */}
                        {(isSelected || effectiveState === 'active') && (
                          <circle cx={pos.x} cy={pos.y} r={nodeRadius + 3}
                            fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.3"
                            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                          />
                        )}

                        {/* Node circle */}
                        <circle cx={pos.x} cy={pos.y} r={nodeRadius}
                          fill={effectiveState === 'locked' ? '#0F1120' : `${color}22`}
                          stroke={color}
                          strokeWidth={isSelected ? 1 : isCenter ? 0.8 : 0.5}
                          strokeDasharray={isIntermediate ? '1 0.5' : 'none'}
                          filter={effectiveState !== 'locked' ? 'url(#glow-cyan)' : undefined}
                        />

                        {/* Center node has a special ring */}
                        {isCenter && effectiveState !== 'locked' && (
                          <circle cx={pos.x} cy={pos.y} r={nodeRadius + 1.5}
                            fill="none" stroke={color}
                            strokeWidth="0.3" strokeOpacity="0.4"
                          />
                        )}

                        {/* Icon */}
                        <text x={pos.x} y={pos.y + 1}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={isCenter ? 4 : 3}
                          fill={color} fontWeight="bold"
                        >
                          {effectiveState === 'done' ? '✓' : effectiveState === 'newly-unlocked' ? '🔓' : effectiveState === 'active' ? '⚡' : isIntermediate ? '↗' : '🔒'}
                        </text>

                        {/* Label — pushed further out for outer nodes */}
                        <text
                          x={pos.x}
                          y={pos.y + nodeRadius + (isCenter ? 4 : 3) + 2}
                          textAnchor="middle" fontSize="2.6"
                          fill={effectiveState === 'locked' ? '#3D4266' : '#E8EEFF'}
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {sub.name}
                        </text>

                        {/* Type tag for intermediate */}
                        {isIntermediate && effectiveState !== 'locked' && (
                          <text x={pos.x} y={pos.y + nodeRadius + 8}
                            textAnchor="middle" fontSize="2"
                            fill={color} fontFamily="JetBrains Mono, monospace"
                          >[ BRIDGE ]</text>
                        )}
                      </g>
                    )
                  })}
                </>
              )}
            </svg>

            {/* Legend */}
            {zoomedUnit && (
              <div style={{ position: 'absolute', bottom: 56, left: 16, display: 'flex', gap: 16 }}>
                {[
                  { color: '#00F0FF', label: 'Lesson' },
                  { color: '#FF6B2B', label: 'Bridge' },
                  { color: '#FF0044', label: 'Boss Ring' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom bar */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              borderTop: '1px solid var(--border)', padding: '10px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>Navigation Vector</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {zoomedUnit ? `Unit ${zoomedUnit} · ${zoomedUnitData?.subUnits.filter(s => s.state === 'done').length}/${zoomedUnitData?.subUnits.length} lessons complete` : 'Galactic Coordinate: 42.08.192'}
                </div>
              </div>
              <div style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: 4, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>🔔</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace' }}>Parallax Shift Detected</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Top 5% of this module's navigators.</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: DETAIL PANEL ── */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>

            {/* Outer galaxy — unit detail */}
            {!zoomedUnit && activeUnit && (
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                    Physics Unit
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {activeUnit.subUnits.length} lessons
                  </div>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>{activeUnit.name}</h2>
                <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                      <svg viewBox="0 0 80 80" width="80" height="80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="6" />
                        <circle cx="40" cy="40" r="32" fill="none"
                          stroke={stateColor(activeUnit.state)} strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - activeUnit.mastery / 100)}`}
                          transform="rotate(-90 40 40)"
                          style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{activeUnit.mastery}%</div>
                        <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Mastery</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Concepts Learnt', value: activeUnit.concepts },
                        { label: 'Labs Completed', value: activeUnit.labs },
                        { label: 'Assessment Score', value: `${activeUnit.assessment}%` },
                      ].map(stat => (
                        <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{stat.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{activeUnit.description}</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>LESSONS IN THIS UNIT</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeUnit.subUnits.map(sub => {
                      const { state: subEffectiveState, stars: subRealStars } = getLessonVisualState(sub.id, userStars, sub.state)
                      return (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'var(--bg-surface-hi)', borderRadius: 4, border: `1px solid ${subEffectiveState === 'locked' ? 'var(--border)' : typeColor(sub.type) + '44'}` }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: subEffectiveState === 'locked' ? 'var(--border-hi)' : typeColor(sub.type), flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: subEffectiveState === 'locked' ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1 }}>{sub.name}</span>
                        <span style={{ fontSize: 9, color: typeColor(sub.type), fontFamily: 'JetBrains Mono, monospace' }}>
                          {subEffectiveState === 'done' ? '✓' : subEffectiveState === 'active' ? '▶' : '🔒'}
                        </span>
                      </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                  ⚡ {activeUnit.unlockNote}
                </div>
                <button onClick={() => handleEnterUnit(activeUnit.id)} style={{
                  width: '100%', padding: '14px',
                  background: activeUnit.state === 'locked' ? 'var(--border)' : 'var(--cyan)',
                  border: 'none', borderRadius: 4,
                  color: activeUnit.state === 'locked' ? 'var(--text-muted)' : 'var(--bg-base)',
                  fontSize: 14, fontWeight: 900, letterSpacing: 2,
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: activeUnit.state === 'locked' ? 'not-allowed' : 'pointer',
                  boxShadow: activeUnit.state !== 'locked' ? '0 0 20px var(--cyan-glow)' : 'none',
                }}>
                  {activeUnit.state === 'locked' ? '🔒 LOCKED' : 'ENTER UNIT →'}
                </button>
              </div>
            )}

            {/* Sub-unit detail panel */}
            {zoomedUnit && activeSubUnit && (
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    background: activeSubUnit.type === 'boss' ? 'var(--red-dim)' : activeSubUnit.type === 'intermediate' ? 'rgba(255,107,43,0.12)' : 'var(--cyan-dim)',
                    border: `1px solid ${typeColor(activeSubUnit.type)}`,
                    borderRadius: 20, padding: '4px 12px', fontSize: 11,
                    color: typeColor(activeSubUnit.type), fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {activeSubUnit.type === 'intermediate' ? '↗ Bridge Lesson' : '📡 Core Lesson'}
                  </div>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>{activeSubUnit.name}</h2>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
                  {activeSubUnit.type === 'intermediate'
                    ? 'This bridge lesson appears when a concept needs reinforcement. Complete it to retry the main lesson.'
                    : 'This lesson will guide you through the concept with an AI tutor, diagrams, and checkpoint questions.'}
                </div>
                <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 12 }}>WHAT TO EXPECT</div>
                  {[
                    { icon: '🤖', label: 'AI Guide', desc: 'Parallax AI walks you through the concept' },
                    { icon: '📊', label: 'Visual Diagram', desc: 'Interactive diagram to build intuition' },
                    { icon: '✅', label: 'Checkpoint Quiz', desc: '2 questions to confirm understanding' },
                    { icon: '⚡', label: 'XP Reward', desc: '120 XP on completion' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginBottom: 6 }}>YOUR MASTERY SCORE</div>
                      <div style={{ height: 4, width: 160, background: 'var(--border)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: '67%', background: 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: 2, boxShadow: '0 0 6px var(--cyan-glow)' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace' }}>67</div>
                  </div>
                  <button
                    onClick={() => router.push(`/learn/${zoomedUnit}/${activeSubUnit.id}`)}
                    disabled={activeSubUnitVisual?.state === 'locked'}
                    style={{
                      width: '100%', padding: '14px',
                      background: activeSubUnitVisual?.state === 'locked' ? 'var(--border)' : typeColor(activeSubUnit.type),
                      border: 'none', borderRadius: 4,
                      color: activeSubUnitVisual?.state === 'locked' ? 'var(--text-muted)' : 'var(--bg-base)',
                      fontSize: 14, fontWeight: 900, letterSpacing: 2,
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: activeSubUnitVisual?.state === 'locked' ? 'not-allowed' : 'pointer',
                      boxShadow: activeSubUnitVisual?.state !== 'locked' ? `0 0 20px ${typeColor(activeSubUnit.type)}66` : 'none',
                    }}>
                    {activeSubUnitVisual?.state === 'locked' ? '🔒 LOCKED' : activeSubUnitVisual?.state === 'newly-unlocked' ? '🔓 START LESSON →' : 'START LESSON →'}
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {((zoomedUnit && !activeSubUnit) || (!zoomedUnit && !activeUnit)) && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, gap: 12 }}>
                <span style={{ fontSize: 32 }}>{zoomedUnit ? '📡' : '🌌'}</span>
                {zoomedUnit ? '← Select a lesson node' : '← Select a unit node'}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Boss animation keyframe */}
      <style>{`
        @keyframes bossAppear {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
