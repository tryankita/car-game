import { useEffect, useState } from 'react'
import useGameStore from '../../store'
import audioManager from '../../audioManager'
import { aiProgress, playerProgress } from '../../raceProgress'

export default function RaceFinish() {
  const raceFinished = useGameStore((s) => s.raceFinished)
  const timeFailed = useGameStore((s) => s.timeFailed)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const levels = useGameStore((s) => s.levels)
  const bestLap = useGameStore((s) => s.bestLap)
  const completeLevel = useGameStore((s) => s.completeLevel)
  const calculateStars = useGameStore((s) => s.calculateStars)
  const setScreen = useGameStore((s) => s.setScreen)
  const startRace = useGameStore((s) => s.startRace)
  const goHome = useGameStore((s) => s.goHome)
  const lastRaceReward = useGameStore((s) => s.lastRaceReward)

  const [levelCompleted, setLevelCompleted] = useState(false)
  const [finishPosition, setFinishPosition] = useState(null)
  const level = levels.find(l => l.id === selectedLevel)
  const stars = timeFailed ? 0 : calculateStars()

  useEffect(() => {
    if (raceFinished && !levelCompleted && !timeFailed) {
      // Compute final race position
      const all = [
        { name: 'YOU', score: playerProgress.lap + playerProgress.t },
        ...aiProgress.map(a => ({ name: a.name, score: a.lap + a.t })),
      ].sort((a, b) => b.score - a.score)
      const pos = all.findIndex(e => e.name === 'YOU') + 1
      setFinishPosition(pos)

      // Only complete level (unlock next + reward coins) if top 3
      if (pos <= 3) {
        completeLevel()
        setLevelCompleted(true)
      }
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
          color: timeFailed ? '#ff4444' : levelCompleted ? '#ffffff' : '#ffcc00',
          textShadow: timeFailed
            ? '0 0 20px rgba(255, 50, 50, 0.6)'
            : levelCompleted
              ? '0 0 20px rgba(0, 180, 255, 0.6)'
              : '0 0 20px rgba(255, 200, 0, 0.6)',
        }}>
          {timeFailed ? "TIME'S UP!" : levelCompleted ? 'RACE COMPLETE' : 'RACE FINISHED'}
        </h1>

        {/* Level name */}
        <div style={levelNameStyle}>{level?.name}</div>

        {/* Finish position badge */}
        {!timeFailed && finishPosition !== null && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
          }}>
            <div style={{
              fontSize: finishPosition <= 3 ? '3.5rem' : '2.5rem',
              fontWeight: 900,
              color: finishPosition === 1 ? '#ffd700'
                : finishPosition === 2 ? '#c0c0c0'
                : finishPosition === 3 ? '#cd7f32'
                : '#ff6666',
              textShadow: `0 0 30px ${finishPosition <= 3 ? 'rgba(255,200,0,0.7)' : 'rgba(255,80,80,0.5)'}`,
              lineHeight: 1,
            }}>
              P{finishPosition}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#aaa', letterSpacing: '2px' }}>
              {finishPosition === 1 ? '🏆 WINNER' : finishPosition <= 3 ? 'PODIUM FINISH' : 'FINISH TOP 3 TO UNLOCK NEXT LEVEL'}
            </div>
          </div>
        )}

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
            <div style={statLabel}>Best Lap</div>
            <div style={statValue}>
              {isFinite(bestLap) ? bestLap.toFixed(2) + 's' : '--'}
            </div>
          </div>
        </div>

        {/* Star message (only on success) */}
        {!timeFailed && levelCompleted && (
          <div style={messageStyle}>
            {stars === 3 && '🏆 PERFECT PERFORMANCE! 🏆'}
            {stars === 2 && '⭐ GREAT JOB! ⭐'}
            {stars === 1 && '✓ LEVEL COMPLETED'}
          </div>
        )}

        {/* Reward (only on success) */}
        {levelCompleted && !timeFailed && (
          <div style={{
            fontSize: '24px',
            color: '#ffd700',
            fontWeight: 'bold',
            marginTop: '15px',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          }}>
            +{lastRaceReward} COINS
          </div>
        )}

        {/* No reward message on fail */}
        {timeFailed && (
          <div style={{
            fontSize: '0.85rem',
            color: '#666',
            marginTop: '0.5rem',
          }}>
            No coins awarded — try again!
          </div>
        )}

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
  padding: '3rem',
  maxWidth: '500px',
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
  fontSize: '2.5rem',
  fontWeight: 900,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  margin: 0,
  textShadow: '0 0 20px rgba(0, 180, 255, 0.6)',
  color: '#ffffff',
}

const levelNameStyle = {
  fontSize: '1.2rem',
  color: '#00b4ff',
  letterSpacing: '0.1em',
  fontWeight: 600,
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

const messageStyle = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#ffeb3b',
  textAlign: 'center',
  letterSpacing: '0.05em',
  textShadow: '0 0 10px rgba(255, 235, 59, 0.4)',
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
