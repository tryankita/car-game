import { useState, useEffect } from 'react'
import useGameStore from '../../store'
import { getStarThresholds } from '../../store'
import audioManager from '../../audioManager'

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function PreRace() {
  const levels = useGameStore((s) => s.levels)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const selectedCar = useGameStore((s) => s.selectedCar)
  const cars = useGameStore((s) => s.cars)
  const launchRace = useGameStore((s) => s.launchRace)
  const setScreen = useGameStore((s) => s.setScreen)

  const level = levels.find((l) => l.id === selectedLevel)
  const car = cars[selectedCar]
  const thresholds = getStarThresholds(selectedLevel, level?.difficulty)

  const [ready, setReady] = useState(false)

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleGo = () => {
    audioManager.enableAudio()
    launchRace()
  }

  const handleBack = () => {
    audioManager.enableAudio()
    setScreen('levels')
  }

  if (!level) return null

  return (
    <div style={backdrop}>
      <div style={{ ...panel, opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(30px)' }}>

        {/* Track title */}
        <div style={trackHeader}>
          <div style={levelBadgeStyle}>{level.id}</div>
          <div>
            <h2 style={trackNameStyle}>{level.name}</h2>
            <div style={diffRow}>
              <span style={diffBadge(getDiffColor(level.difficulty))}>{level.difficulty}</span>
              <span style={lapsBadge}>{level.laps} Laps</span>
            </div>
          </div>
        </div>

        <div style={divider} />

        {/* Star targets */}
        <h3 style={sectionTitle}>⏱ LAP TIME TARGETS</h3>

        <div style={starsGrid}>
          <StarCard stars={3} label="Gold" time={thresholds.s3} color="#ffeb3b" desc={`Under ${fmt(thresholds.s3)}`} />
          <StarCard stars={2} label="Silver" time={thresholds.s2} color="#b0bec5" desc={`Under ${fmt(thresholds.s2)}`} />
          <StarCard stars={1} label="Bronze" time={null} color="#cd7f32" desc={`Finish the race`} />
        </div>

        <div style={divider} />

        {/* Car info */}
        <div style={carInfoRow}>
          <div style={carColorDot(car.color)} />
          <span style={carNameText}>{car.name}</span>
          <span style={carStat}>⚡{Math.round(car.topSpeed * 3.6)} km/h</span>
          <span style={carStat}>🎯{car.handling.toFixed(1)}</span>
        </div>

        <div style={tipBox}>
          💡 <strong>Tip:</strong> Your <em>best single lap</em> determines your star rating. Focus on one clean lap!
        </div>

        {/* Buttons */}
        <div style={btnRow}>
          <button style={backBtn} onClick={handleBack}>← BACK</button>
          <button style={goBtn} onClick={handleGo}>
            🏁 RACE!
          </button>
        </div>
      </div>
    </div>
  )
}

function StarCard({ stars, label, time, color, desc }) {
  return (
    <div style={starCard}>
      <div style={starIcons}>
        {[1, 2, 3].map((i) => (
          <span key={i} style={{ fontSize: '1.3rem', color: i <= stars ? color : '#333', textShadow: i <= stars ? `0 0 8px ${color}88` : 'none' }}>★</span>
        ))}
      </div>
      <div style={starLabel(color)}>{label}</div>
      <div style={starDesc}>{desc}</div>
    </div>
  )
}

function getDiffColor(d) {
  switch (d) {
    case 'Easy': return '#00ff88'
    case 'Medium': return '#00b4ff'
    case 'Hard': return '#ff9500'
    case 'Very Hard': return '#ff3250'
    case 'Extreme': return '#ff00ff'
    default: return '#888'
  }
}

/* ══════════ STYLES ══════════ */

const backdrop = {
  position: 'fixed',
  inset: 0,
  background: 'radial-gradient(ellipse at center, #0a0e27 0%, #050510 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Orbitron', sans-serif",
  zIndex: 10,
}

const panel = {
  width: 'min(520px, 94vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'linear-gradient(145deg, #0e1230 0%, #1a1a3e 50%, #111528 100%)',
  border: '1px solid rgba(0,180,255,0.25)',
  borderRadius: '20px',
  padding: 'clamp(1.2rem, 4vw, 2rem) clamp(1rem, 4vw, 2.2rem)',
  boxShadow: '0 0 60px rgba(0,180,255,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
  transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
  scrollbarWidth: 'none',
}

const trackHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.2rem',
}

const levelBadgeStyle = {
  fontSize: '2.2rem',
  fontWeight: 900,
  color: '#fff',
  textShadow: '0 0 15px rgba(0,180,255,0.6)',
  background: 'rgba(0,180,255,0.1)',
  border: '2px solid rgba(0,180,255,0.3)',
  borderRadius: '14px',
  width: '60px',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const trackNameStyle = {
  margin: 0,
  fontSize: 'clamp(1rem, 3vw, 1.4rem)',
  fontWeight: 800,
  color: '#fff',
  letterSpacing: '0.08em',
}

const diffRow = {
  display: 'flex',
  gap: '0.7rem',
  marginTop: '0.4rem',
  alignItems: 'center',
}

const diffBadge = (color) => ({
  fontSize: '0.6rem',
  fontWeight: 600,
  padding: '0.2rem 0.7rem',
  border: `1px solid ${color}`,
  borderRadius: '20px',
  color,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
})

const lapsBadge = {
  fontSize: '0.65rem',
  color: '#888',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
  letterSpacing: '0.05em',
}

const divider = {
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.2), transparent)',
  margin: '1.2rem 0',
}

const sectionTitle = {
  fontSize: '0.75rem',
  color: '#00b4ff',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  margin: '0 0 1rem 0',
  fontWeight: 700,
  textAlign: 'center',
}

const starsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 'clamp(0.4rem, 1.5vw, 0.8rem)',
}

const starCard = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '1rem 0.6rem',
  textAlign: 'center',
  transition: 'all .3s',
}

const starIcons = {
  display: 'flex',
  justifyContent: 'center',
  gap: '2px',
  marginBottom: '0.4rem',
}

const starLabel = (color) => ({
  fontSize: '0.7rem',
  fontWeight: 700,
  color,
  letterSpacing: '0.1em',
  marginBottom: '0.3rem',
})

const starDesc = {
  fontSize: '0.65rem',
  color: '#999',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
}

const carInfoRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  padding: '0.8rem 1rem',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.06)',
  marginBottom: '0.8rem',
}

const carColorDot = (color) => ({
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  background: color,
  boxShadow: `0 0 8px ${color}88`,
  flexShrink: 0,
})

const carNameText = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#fff',
  flex: 1,
  letterSpacing: '0.06em',
}

const carStat = {
  fontSize: '0.7rem',
  color: '#aaa',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
}

const tipBox = {
  fontSize: '0.7rem',
  color: '#888',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 500,
  background: 'rgba(0,180,255,0.05)',
  border: '1px solid rgba(0,180,255,0.12)',
  borderRadius: '8px',
  padding: '0.7rem 1rem',
  marginBottom: '1.2rem',
  lineHeight: 1.5,
  textAlign: 'center',
}

const btnRow = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
}

const backBtn = {
  padding: '0.8rem 1.8rem',
  fontSize: '0.85rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 600,
  color: '#aaa',
  background: 'rgba(255,255,255,0.04)',
  border: '2px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  cursor: 'pointer',
  letterSpacing: '0.1em',
  transition: 'all .3s',
  textTransform: 'uppercase',
}

const goBtn = {
  padding: '0.8rem 3rem',
  fontSize: '1.05rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 800,
  color: '#fff',
  background: 'linear-gradient(135deg, #00b4ff 0%, #0088cc 100%)',
  border: '2px solid #00b4ff',
  borderRadius: '10px',
  cursor: 'pointer',
  letterSpacing: '0.15em',
  transition: 'all .3s',
  textTransform: 'uppercase',
  boxShadow: '0 4px 25px rgba(0,180,255,0.45), 0 0 40px rgba(0,180,255,0.15)',
}
