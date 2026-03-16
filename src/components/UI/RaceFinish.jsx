import { useEffect, useState } from 'react'
import useGameStore from '../../store'
import audioManager from '../../audioManager'

export default function RaceFinish() {
  const raceFinished = useGameStore((s) => s.raceFinished)
  const timeFailed = useGameStore((s) => s.timeFailed)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const levels = useGameStore((s) => s.levels)
  const raceTime = useGameStore((s) => s.raceTime)
  const bestLap = useGameStore((s) => s.bestLap)
  const completeLevel = useGameStore((s) => s.completeLevel)
  const calculateStars = useGameStore((s) => s.calculateStars)
  const setScreen = useGameStore((s) => s.setScreen)
  const startRace = useGameStore((s) => s.startRace)
  const goHome = useGameStore((s) => s.goHome)

  const [levelCompleted, setLevelCompleted] = useState(false)
  const stars = timeFailed ? 0 : calculateStars()

  useEffect(() => {
    if (raceFinished && !levelCompleted && !timeFailed) {
      completeLevel()
      setLevelCompleted(true)
    }
  }, [raceFinished, levelCompleted, timeFailed])

  const handleNextLevel = () => {
    audioManager.stopRaceMusic()
    if (selectedLevel < 10) {
      useGameStore.setState({ selectedLevel: selectedLevel + 1 })
      setTimeout(() => {
        useGameStore.getState().startRace()
      }, 100)
    } else {
      goHome()
    }
  }

  const handleRetry = () => {
    audioManager.stopRaceMusic()
    startRace()
  }

  const handleHome = () => {
    audioManager.stopRaceMusic()
    goHome()
  }

  if (!raceFinished) return null

  return (
    <div style={containerStyle}>
      <div style={overlayStyle} />
      
      <div style={cardStyle}>
        {/* Title */}
        <h1 style={{
          ...titleStyle,
          color: timeFailed ? '#ff4444' : '#ffffff',
          textShadow: timeFailed
            ? '0 0 20px rgba(255, 50, 50, 0.6)'
            : '0 0 20px rgba(0, 180, 255, 0.6)',
        }}>
          {timeFailed ? "TIME'S UP!" : 'WON'}
        </h1>

        {/* Stars (only on top-3 finish) */}
        {!timeFailed && levelCompleted && (
          <div style={starsDisplayStyle}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{...starStyle, opacity: i <= stars ? 1 : 0.2}}>
                ★
              </div>
            ))}
          </div>
        )}

        {/* Time-out message */}
        {timeFailed && (
          <div style={{
            fontSize: '1.2rem',
            color: '#ff6666',
            fontWeight: 700,
            textAlign: 'center',
            marginTop: '0.5rem',
          }}>
            You ran out of time!<br />
            <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 400 }}>
              Drive faster and brake less to beat the clock.
            </span>
          </div>
        )}

        {/* Stats */}
        <div style={statsStyle}>
          <div style={statItem}>
            <div style={statLabel}>Time</div>
            <div style={statValue}>{raceTime.toFixed(2)}s</div>
          </div>
          <div style={statItem}>
            <div style={statLabel}>Best Lap</div>
            <div style={statValue}>
              {isFinite(bestLap) ? bestLap.toFixed(2) + 's' : '--'}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={buttonsStyle}>
          <button style={retryBtn} onClick={handleRetry}>
            ↻ RETRY
          </button>
          {levelCompleted && selectedLevel < 10 ? (
            <button style={nextBtn} onClick={handleNextLevel}>
              NEXT LEVEL →
            </button>
          ) : levelCompleted ? (
            <button style={nextBtn} onClick={handleHome}>
              ALL LEVELS CLEARED! →
            </button>
          ) : null}
        </div>

        {/* Home button */}
        <button style={homeBtn} onClick={handleHome}>
          ← HOME
        </button>
      </div>
    </div>
  )
}

const containerStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  fontFamily: "'Orbitron', sans-serif",
}

const overlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(10px)',
}

const cardStyle = {
  position: 'relative',
  zIndex: 2001,
  background: 'linear-gradient(145deg, rgba(10, 10, 20, 0.95) 0%, rgba(5, 5, 15, 0.95) 100%)',
  border: '2px solid rgba(0, 180, 255, 0.5)',
  borderRadius: '20px',
  padding: 'clamp(1.5rem, 4vw, 3rem)',
  width: 'min(500px, 94vw)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.5rem',
  boxShadow: `
    0 0 40px rgba(0, 180, 255, 0.3),
    0 8px 40px rgba(0, 0, 0, 0.8)
  `,
}

const titleStyle = {
  fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
  fontWeight: 900,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  margin: 0,
  textShadow: '0 0 20px rgba(0, 180, 255, 0.6)',
  color: '#ffffff',
}

const starsDisplayStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  margin: '1rem 0',
}

const starStyle = {
  fontSize: '3rem',
  color: '#ffeb3b',
  textShadow: '0 0 15px rgba(255, 235, 59, 0.8)',
  transition: 'all 0.3s ease',
}

const statsStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  gap: '2rem',
  padding: '1rem',
  background: 'rgba(0, 180, 255, 0.05)',
  borderRadius: '10px',
  border: '1px solid rgba(0, 180, 255, 0.2)',
}

const statItem = {
  textAlign: 'center',
}

const statLabel = {
  fontSize: '0.8rem',
  color: '#888',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '0.5rem',
}

const statValue = {
  fontSize: '1.5rem',
  color: '#00b4ff',
  fontWeight: 700,
}

const buttonsStyle = {
  display: 'flex',
  gap: '1rem',
  width: '100%',
  marginTop: '1rem',
}

const retryBtn = {
  flex: 1,
  padding: '0.9rem 1.5rem',
  fontSize: '0.95rem',
  fontWeight: 700,
  fontFamily: "'Orbitron', sans-serif",
  color: '#ffffff',
  background: 'rgba(100, 100, 100, 0.2)',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(100, 100, 100, 0.5)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
}

const nextBtn = {
  flex: 1,
  padding: '0.9rem 1.5rem',
  fontSize: '0.95rem',
  fontWeight: 700,
  fontFamily: "'Orbitron', sans-serif",
  color: '#ffffff',
  background: 'rgba(0, 180, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  border: '2px solid #00b4ff',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  boxShadow: '0 0 15px rgba(0, 180, 255, 0.3)',
}

const homeBtn = {
  width: '100%',
  padding: '0.8rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  fontFamily: "'Orbitron', sans-serif",
  color: '#888',
  background: 'transparent',
  border: '1px solid rgba(100, 100, 100, 0.3)',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
