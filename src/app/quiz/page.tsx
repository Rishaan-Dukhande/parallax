'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'

// ─────────────────────────────────────────────
// DATA
// Each question has: the question text, 4 options,
// the index of the correct answer, and an AI hint.
// The hint uses the Socratic method — it never
// gives the answer, only the next logical step.
// ─────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    topic: "Newton's Laws",
    subtopic: 'QUANTUM CALCULATION 04-A',
    question: 'A 5 kg block accelerates at 3 m/s². What net force acts on it?',
    options: ['10 Newtons', '15 Newtons', '8 Newtons', '2 Newtons'],
    correct: 1,
    hint: "Consider Newton's Second Law: F = ma. You have the mass (m) and the acceleration (a). What happens when you multiply them? ⚡",
    socraticHint: 'Think about the relationship between mass and force. Does a heavier object require more or less force to accelerate at the same rate?',
    xp: 120,
  },
  {
    id: 2,
    topic: "Newton's Laws",
    subtopic: 'QUANTUM CALCULATION 04-B',
    question: 'An object moves at constant velocity. What is the net force acting on it?',
    options: ['Equal to gravity', 'Greater than friction', 'Zero', 'Cannot be determined'],
    correct: 2,
    hint: "Constant velocity means no change in motion. Newton's First Law tells us something important about this. What does it say about objects that aren't accelerating? ⚡",
    socraticHint: 'If something is not speeding up or slowing down, what must be true about the forces acting on it?',
    xp: 100,
  },
  {
    id: 3,
    topic: "Newton's Laws",
    subtopic: 'QUANTUM CALCULATION 04-C',
    question: 'A 10 kg object has a net force of 50 N applied. What is its acceleration?',
    options: ['500 m/s²', '0.2 m/s²', '5 m/s²', '60 m/s²'],
    correct: 2,
    hint: "You have F and m. Newton's Second Law is F = ma. Try rearranging that equation to solve for acceleration (a). What do you get? ⚡",
    socraticHint: 'If F = ma, and you need to find a, what operation would isolate a on one side of the equation?',
    xp: 130,
  },
  {
    id: 4,
    topic: "Newton's Laws",
    subtopic: 'QUANTUM CALCULATION 04-D',
    question: 'Two forces act on an object: 30 N right and 10 N left. What is the net force?',
    options: ['40 N right', '20 N left', '20 N right', '30 N left'],
    correct: 2,
    hint: 'Forces are vectors — they have direction. When forces oppose each other, think about what you do with numbers that go in opposite directions on a number line. ⚡',
    socraticHint: 'If you walk 30 steps right then 10 steps left, where do you end up relative to your start?',
    xp: 110,
  },
  {
    id: 5,
    topic: "Newton's Laws",
    subtopic: 'QUANTUM CALCULATION 04-E',
    question: 'A rocket ejects gas downward. In which direction does the rocket move?',
    options: ['Downward', 'Sideways', 'Upward', 'It stays still'],
    correct: 2,
    hint: "This is Newton's Third Law territory. For every action there is an equal and opposite... what? Think about what 'opposite' means here. ⚡",
    socraticHint: 'If the gas goes down, and Newton says every action has an equal and opposite reaction, which direction must the rocket go?',
    xp: 140,
  },
]

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// These are small reusable pieces.
// Notice how each one accepts props — data passed
// in from the parent — and renders based on them.
// ─────────────────────────────────────────────

// AnswerButton: renders one answer option
// Props: label, option, isSelected, isCorrect, isWrong, submitted, onClick
function AnswerButton({
  label, option, isSelected, isCorrect, isWrong, submitted, onClick
}: {
  label: string, option: string, isSelected: boolean,
  isCorrect: boolean, isWrong: boolean, submitted: boolean,
  onClick: () => void
}) {
  // Determine the color based on state
  let borderColor = 'var(--border-hi)'
  let bgColor = 'var(--bg-surface-hi)'
  let textColor = 'var(--text-primary)'

  if (submitted && isCorrect) {
    borderColor = 'var(--green)'
    bgColor = 'rgba(0,255,136,0.1)'
    textColor = 'var(--green)'
  } else if (submitted && isWrong) {
    borderColor = 'var(--red)'
    bgColor = 'rgba(255,0,68,0.1)'
    textColor = 'var(--red)'
  } else if (isSelected && !submitted) {
    borderColor = 'var(--cyan)'
    bgColor = 'var(--cyan-dim)'
    textColor = 'var(--cyan)'
  }

  return (
    <button
      onClick={onClick}
      disabled={submitted}
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 4,
        padding: '18px 20px',
        cursor: submitted ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'var(--transition)',
        width: '100%', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', minWidth: 20 }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 600, color: textColor }}>
        {option}
      </span>
      {submitted && isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>✓</span>}
      {submitted && isWrong && <span style={{ marginLeft: 'auto', color: 'var(--red)' }}>✗</span>}
    </button>
  )
}

// TimerRing: the circular countdown clock in the top right
// Props: timeLeft, totalTime
function TimerRing({ timeLeft, totalTime }: { timeLeft: number, totalTime: number }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const progress = timeLeft / totalTime
  const color = timeLeft > 20 ? 'var(--cyan)' : timeLeft > 10 ? 'var(--orange)' : 'var(--red)'

  return (
    <div style={{ position: 'relative', width: 52, height: 52 }}>
      <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r={radius} fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle cx="26" cy="26" r={radius} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
        {timeLeft}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
export default function QuizPage() {
  // State variables — the "memory" of this page
  const [currentQ, setCurrentQ] = useState(0)        // which question we're on
  const [selected, setSelected] = useState<number | null>(null)  // which answer was clicked
  const [submitted, setSubmitted] = useState(false)   // has the user hit Submit?
  const [drawerOpen, setDrawerOpen] = useState(false) // is the AI hint panel open?
  const [timeLeft, setTimeLeft] = useState(45)        // countdown timer
  const [score, setScore] = useState(0)               // total XP earned
  const [showResult, setShowResult] = useState(false) // show end-of-quiz screen?

  const question = QUESTIONS[currentQ]
  const isCorrect = selected === question.correct

  // useEffect: runs side-effects outside the render
  // Here: starts the countdown timer, cleans up when component unmounts
  // The [currentQ, submitted] means: re-run this whenever those values change
  useEffect(() => {
    if (submitted || showResult) return
    if (timeLeft <= 0) {
      setSubmitted(true)
      return
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer) // cleanup: stop timer when question changes
  }, [timeLeft, submitted, showResult, currentQ])

  // Move to next question
  const handleNext = () => {
    if (isCorrect) setScore(s => s + question.xp)
    if (currentQ + 1 >= QUESTIONS.length) {
      setShowResult(true)
    } else {
      setCurrentQ(q => q + 1)
      setSelected(null)
      setSubmitted(false)
      setTimeLeft(45)
      setDrawerOpen(false)
    }
  }

  // End-of-quiz results screen
  if (showResult) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar />
        <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🎯</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>Session Complete</h1>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>Newton's Laws · 5 Questions</div>
            <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--cyan)', marginBottom: 4 }}>{score}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>TOTAL XP EARNED</div>
            </div>
            <button
              onClick={() => { setCurrentQ(0); setSelected(null); setSubmitted(false); setTimeLeft(45); setScore(0); setShowResult(false) }}
              style={{ width: '100%', padding: '16px', background: 'var(--cyan)', border: 'none', borderRadius: 4, color: 'var(--bg-base)', fontSize: 14, fontWeight: 900, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', boxShadow: '0 0 20px var(--cyan-glow)' }}>
              RETRY SESSION →
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />

      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOP BAR */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace' }}>ADAPTIVE QUIZ — NEWTON'S LAWS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              Score: <span style={{ color: 'var(--cyan)' }}>{score} XP</span>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>VELOCITY</span>
          </div>
        </div>

        {/* CONTENT AREA — splits into main quiz + optional AI drawer */}
        <div style={{ flex: 1, display: 'flex' }}>

          {/* QUIZ AREA */}
          <div style={{ flex: 1, padding: '40px', maxWidth: drawerOpen ? 'calc(100% - 340px)' : '100%', transition: 'max-width 0.3s ease' }}>

            {/* Progress pips + timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {QUESTIONS.map((_, i) => (
                  <div key={i} style={{
                    width: 32, height: 6, borderRadius: 3,
                    background: i < currentQ ? 'var(--cyan)' : i === currentQ ? 'var(--cyan)' : 'var(--border)',
                    opacity: i === currentQ ? 1 : i < currentQ ? 0.6 : 0.3,
                    boxShadow: i === currentQ ? '0 0 8px var(--cyan-glow)' : 'none',
                  }} />
                ))}
              </div>
              <TimerRing timeLeft={timeLeft} totalTime={45} />
            </div>

            {/* Question card */}
            <div className="glass-card" style={{ padding: '32px', marginBottom: 28, boxShadow: '0 0 40px var(--cyan-dim)' }}>
              <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 16 }}>
                {question.subtopic}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {question.question}
              </h2>
            </div>

            {/* 2x2 Answer grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              {question.options.map((opt, i) => (
                <AnswerButton
                  key={i}
                  label={['OPTION A', 'OPTION B', 'OPTION C', 'OPTION D'][i]}
                  option={opt}
                  isSelected={selected === i}
                  isCorrect={submitted && i === question.correct}
                  isWrong={submitted && selected === i && i !== question.correct}
                  submitted={submitted}
                  onClick={() => !submitted && setSelected(i)}
                />
              ))}
            </div>

            {/* Result feedback */}
            {submitted && (
              <div style={{
                background: isCorrect ? 'rgba(0,255,136,0.08)' : 'rgba(255,0,68,0.08)',
                border: `1px solid ${isCorrect ? 'var(--green)' : 'var(--red)'}`,
                borderRadius: 4, padding: '16px 20px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <span style={{ fontSize: 24 }}>{isCorrect ? '🎯' : '💡'}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isCorrect ? 'var(--green)' : 'var(--red)', marginBottom: 2 }}>
                    {isCorrect ? `Correct! +${question.xp} XP` : 'Not quite — review the hint below'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {isCorrect ? 'Excellent application of Newton\'s Second Law ⚡' : question.socraticHint}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setDrawerOpen(o => !o)}
                style={{
                  background: drawerOpen ? 'var(--purple-dim)' : 'transparent',
                  border: '1px solid var(--purple)',
                  borderRadius: 4, padding: '12px 24px',
                  color: 'var(--purple)', fontSize: 13, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                💬 {drawerOpen ? 'HIDE QUANTA' : 'ASK QUANTA'}
              </button>

              {!submitted ? (
                <button
                  onClick={() => selected !== null && setSubmitted(true)}
                  disabled={selected === null}
                  style={{
                    background: selected !== null ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'var(--border)',
                    border: 'none', borderRadius: 4, padding: '12px 32px',
                    color: selected !== null ? 'var(--bg-base)' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: 900, letterSpacing: 2,
                    fontFamily: 'JetBrains Mono, monospace',
                    cursor: selected !== null ? 'pointer' : 'not-allowed',
                    boxShadow: selected !== null ? '0 0 20px var(--cyan-glow)' : 'none',
                  }}>
                  SUBMIT ANSWER
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  style={{
                    background: 'var(--cyan)', border: 'none', borderRadius: 4,
                    padding: '12px 32px', color: 'var(--bg-base)',
                    fontSize: 13, fontWeight: 900, letterSpacing: 2,
                    fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                    boxShadow: '0 0 20px var(--cyan-glow)',
                  }}>
                  {currentQ + 1 >= QUESTIONS.length ? 'FINISH SESSION →' : 'NEXT QUESTION →'}
                </button>
              )}
            </div>
          </div>

          {/* AI HINT DRAWER — slides in from the right */}
          {/* This is conditional rendering — the && means */}
          {/* "only show this panel if drawerOpen is true" */}
          {drawerOpen && (
            <div style={{
              width: 340, borderLeft: '1px solid var(--border)',
              background: 'var(--bg-surface)', display: 'flex',
              flexDirection: 'column', padding: 28,
              animation: 'slideIn 0.3s ease',
            }}>
              {/* Drawer header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>Quantum AI</div>
                  <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>● READY FOR INQUIRY</div>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              {/* Owl mascot */}
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--purple-dim)', border: '2px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px', boxShadow: '0 0 20px var(--purple-glow)' }}>
                🦉
              </div>

              {/* Primary hint bubble */}
              <div style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                  {question.hint}
                </div>
              </div>

              {/* Socratic hint label */}
              <div style={{ fontSize: 10, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2, marginBottom: 8 }}>
                SOCRATIC HINT
              </div>
              <div style={{ background: 'var(--bg-surface-hi)', border: '1px solid var(--border-hi)', borderRadius: 8, padding: 16, marginBottom: 'auto' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {question.socraticHint}
                </div>
              </div>

              {/* Follow-up input */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    placeholder="Ask a follow-up..."
                    style={{
                      flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-hi)',
                      borderRadius: 4, padding: '10px 14px',
                      color: 'var(--text-primary)', fontSize: 13,
                      fontFamily: 'DM Sans, sans-serif', outline: 'none',
                    }}
                  />
                  <button style={{ background: 'var(--cyan)', border: 'none', borderRadius: 4, width: 40, cursor: 'pointer', fontSize: 16 }}>▶</button>
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, cursor: 'pointer' }}>
                  CLEAR BUFFER
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
