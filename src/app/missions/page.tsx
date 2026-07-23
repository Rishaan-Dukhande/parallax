'use client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

const ALL_MISSIONS = [
  {
    category: 'KINEMATICS',
    color: 'var(--cyan)',
    missions: [
      { title: 'Motion Fundamentals', desc: 'Complete the What is Motion lesson', xp: 80, href: '/learn/1/101', icon: '🚀' },
      { title: 'Velocity vs Speed', desc: 'Master the difference between scalar and vector quantities', xp: 100, href: '/learn/1/102', icon: '⚡' },
      { title: 'Kinematic Drill', desc: 'Score 5 correct answers in Kinematics quiz mode', xp: 150, href: '/quiz', icon: '🎯' },
    ],
  },
  {
    category: "NEWTON'S LAWS",
    color: 'var(--purple)',
    missions: [
      { title: 'Force Basics', desc: 'Complete the Force Basics lesson with 2+ stars', xp: 100, href: '/learn/2/201', icon: '💪' },
      { title: 'Free Body Diagrams', desc: 'Master the FBD lesson', xp: 120, href: '/learn/2/202', icon: '📐' },
      { title: 'Newton Boss Battle', desc: "Defeat the Newton's Laws unit boss", xp: 500, href: '/boss/2', icon: '👾' },
    ],
  },
  {
    category: 'WORK & ENERGY',
    color: 'var(--green)',
    missions: [
      { title: 'Potential Energy Master', desc: 'Complete Potential Energy with 3 stars', xp: 180, href: '/learn/3/303', icon: '🔋' },
      { title: 'Conservation Quest', desc: 'Complete Conservation of Energy lesson', xp: 200, href: '/learn/3/304', icon: '♻️' },
      { title: 'Energy Boss Battle', desc: 'Defeat the Work & Energy unit boss', xp: 500, href: '/boss/3', icon: '👾' },
    ],
  },
  {
    category: 'SIEGE BATTLES',
    color: '#FF0044',
    missions: [
      { title: 'First Siege', desc: 'Complete your first multiplayer siege battle', xp: 300, href: '/league/siege', icon: '⚔️' },
      { title: 'Siege Victor', desc: 'Win a siege battle with a teammate', xp: 500, href: '/league/siege', icon: '🏆' },
    ],
  },
]

export default function MissionsPage() {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="MISSIONS" activeTab="Mass" />
        <div style={{ flex: 1, padding: '40px', maxWidth: 900 }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>Mission Control</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>Complete missions to earn bonus XP and unlock achievements</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {ALL_MISSIONS.map(category => (
              <div key={category.category}>
                <div style={{ fontSize: 11, color: category.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>
                  {category.category}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {category.missions.map(mission => (
                    <div key={mission.title}
                      className="glass-card"
                      style={{ padding: '18px 22px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16 }}
                      onClick={() => router.push(mission.href)}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = category.color }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: `${category.color}18`, border: `1px solid ${category.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {mission.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{mission.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{mission.desc}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: category.color, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                        +{mission.xp} XP →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
