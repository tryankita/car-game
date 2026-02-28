import { useState } from 'react'
import useGameStore from '../../store'
import audioManager from '../../audioManager'

export default function Levels() {
  const levels = useGameStore((s) => s.levels)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const completedLevels = useGameStore((s) => s.completedLevels)
  const levelStars = useGameStore((s) => s.levelStars)
  const isLevelUnlocked = useGameStore((s) => s.isLevelUnlocked)
  const selectLevel = useGameStore((s) => s.selectLevel)
  const startRace = useGameStore((s) => s.startRace)
  const setScreen = useGameStore((s) => s.setScreen)
  const [hoveredLevel, setHoveredLevel] = useState(null)

  const handleLevelSelect = (levelId) => {
    if (!isLevelUnlocked(levelId)) return
    audioManager.enableAudio()
    selectLevel(levelId)
  }

  const handleStart = () => {
    if (!isLevelUnlocked(selectedLevel)) return
    audioManager.enableAudio()
    startRace()
  }

  const handleBack = () => {
    audioManager.enableAudio()
    setScreen('home')
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#00ff88'
      case 'Medium': return '#00b4ff'
      case 'Hard': return '#ff9500'
      case 'Very Hard': return '#ff3250'
      case 'Extreme': return '#ff00ff'
      default: return '#888'
    }
  }

  const renderStars = (levelId) => {
    const stars = levelStars[levelId] || 0
    return (
      <div style={starsContainerStyle}>
        {[1, 2, 3].map((i) => (
          <span key={i} style={{ ...starStyle, opacity: i <= stars ? 1 : 0.2 }}>★</span>
        ))}
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Background layers */}
      <div style={bgLayer1} />
      <div style={bgLayer2} />
      <div style={gridOverlay} />

      {/* Content */}
      <div style={contentWrapper}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <span style={whiteText}>SELECT</span>
            {' '}
            <span style={gradientText}>LEVEL</span>
          </h1>
        </div>

        {/* Levels Grid */}
        <div style={levelsGrid}>
          {levels.map((level) => {
            const isSelected = level.id === selectedLevel
            const isHovered = level.id === hoveredLevel
            const isUnlocked = isLevelUnlocked(level.id)
            const isCompleted = completedLevels.includes(level.id)
            const diffColor = getDifficultyColor(level.difficulty)

            let cardStyle = { ...levelCard }
            if (!isUnlocked) cardStyle = { ...cardStyle, ...lockedCardStyle }
            if (isSelected && isUnlocked) cardStyle = { ...cardStyle, ...selectedCard }
            if (isHovered && isUnlocked) {
              cardStyle = {
                ...cardStyle,
                transform: 'translateY(-4px)',
                border: `2px solid ${diffColor}`,
                boxShadow: `0 0 25px ${diffColor}88, 0 6px 30px rgba(0, 0, 0, 0.7)`,
              }
            }

            return (
              <div
                key={level.id}
                style={{
                  ...cardStyle,
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                }}
                onClick={() => handleLevelSelect(level.id)}
                onMouseEnter={() => setHoveredLevel(level.id)}
                onMouseLeave={() => setHoveredLevel(null)}
              >
                {/* Lock icon for locked levels */}
                {!isUnlocked && (
                  <div style={lockIconStyle}>🔒</div>
                )}

                {/* Level Number */}
                <div style={levelNumber}>{level.id}</div>

                {/* Level Info */}
                <div style={levelInfo}>
                  <h3 style={levelName}>{level.name}</h3>
                  <div style={levelStats}>
                    <span style={{ ...difficultyBadge, borderColor: diffColor, color: diffColor }}>
                      {level.difficulty}
                    </span>
                    <span style={levelDetail}>{level.laps} Laps</span>
                    <span style={levelDetail}>Max: {level.topSpeed} km/h</span>
                  </div>
                  {/* Stars for completed levels */}
                  {isCompleted && renderStars(level.id)}
                </div>

                {/* Selection indicator */}
                {isSelected && isUnlocked && (
                  <div style={selectedIndicator}>
                    <span style={{ fontSize: '1.2rem', color: '#00b4ff' }}>✓</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div style={buttonsContainer}>
          <button style={backButton} onClick={handleBack}>
            ← BACK
          </button>
          <button
            style={{
              ...startButton,
              opacity: isLevelUnlocked(selectedLevel) ? 1 : 0.4,
              cursor: isLevelUnlocked(selectedLevel) ? 'pointer' : 'not-allowed',
            }}
            onClick={handleStart}
          >
            START RACE →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════════════════ */

const containerStyle = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  background: '#050510',
  fontFamily: "'Orbitron', sans-serif",
}

const bgLayer1 = {
  position: 'absolute',
  inset: 0,
  background: `
    radial-gradient(ellipse 100% 80% at 0% 50%, rgba(0, 180, 255, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse 100% 80% at 100% 50%, rgba(255, 50, 80, 0.3) 0%, transparent 50%)
  `,
}

const bgLayer2 = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, rgba(0, 0, 15, 0.6) 0%, rgba(5, 5, 20, 0.8) 50%, rgba(0, 0, 0, 0.9) 100%)',
}

const gridOverlay = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 180, 255, 0.03) 2px, rgba(0, 180, 255, 0.03) 3px),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 50, 80, 0.03) 2px, rgba(255, 50, 80, 0.03) 3px)
  `,
  backgroundSize: '60px 60px',
  opacity: 0.4,
}

const contentWrapper = {
  position: 'relative',
  zIndex: 1,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '3rem 2rem',
  gap: '2rem',
  overflow: 'auto',
}

const headerStyle = {
  textAlign: 'center',
}

const titleStyle = {
  fontSize: '3.5rem',
  fontWeight: 900,
  textAlign: 'center',
  lineHeight: 1,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  margin: 0,
  fontFamily: "'Orbitron', sans-serif",
  fontStyle: 'italic',
}

const whiteText = {
  color: '#ffffff',
  textShadow: `
    0 0 20px rgba(0, 180, 255, 0.8),
    0 0 40px rgba(0, 180, 255, 0.6),
    2px 2px 4px rgba(0, 0, 0, 0.8)
  `,
}

const gradientText = {
  background: 'linear-gradient(90deg, #00b4ff 0%, #ff3250 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const levelsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
  width: '100%',
  maxWidth: '1400px',
  padding: '1rem',
}

const levelCard = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  padding: '1.5rem',
  background: 'rgba(10, 10, 20, 0.6)',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(100, 100, 100, 0.3)',
  borderRadius: '10px',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
}

const lockedCardStyle = {
  filter: 'brightness(0.55)',
  border: '2px solid rgba(255, 50, 80, 0.3)',
  background: 'rgba(20, 5, 10, 0.6)',
}

const selectedCard = {
  border: '2px solid #00b4ff',
  background: 'rgba(0, 180, 255, 0.1)',
  boxShadow: `
    0 0 20px rgba(0, 180, 255, 0.4),
    0 4px 30px rgba(0, 0, 0, 0.6)
  `,
}

const lockIconStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '2.5rem',
  zIndex: 2,
  opacity: 0.8,
}

const levelNumber = {
  fontSize: '3rem',
  fontWeight: 900,
  color: '#ffffff',
  textShadow: '0 0 10px rgba(0, 180, 255, 0.6)',
  minWidth: '60px',
  textAlign: 'center',
}

const levelInfo = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
}

const levelName = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#ffffff',
  margin: 0,
  letterSpacing: '0.05em',
}

const levelStats = {
  display: 'flex',
  gap: '0.8rem',
  flexWrap: 'wrap',
  alignItems: 'center',
}

const difficultyBadge = {
  fontSize: '0.7rem',
  fontWeight: 600,
  padding: '0.2rem 0.6rem',
  border: '1px solid',
  borderRadius: '20px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const levelDetail = {
  fontSize: '0.75rem',
  color: '#999',
  letterSpacing: '0.03em',
}

const starsContainerStyle = {
  display: 'flex',
  gap: '0.2rem',
  marginTop: '0.2rem',
}

const starStyle = {
  fontSize: '1rem',
  color: '#ffeb3b',
  textShadow: '0 0 8px rgba(255, 235, 59, 0.7)',
}

const selectedIndicator = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: 'rgba(0, 180, 255, 0.2)',
  border: '2px solid #00b4ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 10px rgba(0, 180, 255, 0.4)',
}

const buttonsContainer = {
  display: 'flex',
  gap: '2rem',
  marginTop: '1rem',
}

const backButton = {
  minWidth: '160px',
  padding: '1rem 2.5rem',
  fontSize: '1rem',
  fontWeight: 700,
  fontFamily: "'Orbitron', sans-serif",
  color: '#ffffff',
  background: 'rgba(10, 10, 20, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(100, 100, 100, 0.5)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  outline: 'none',
}

const startButton = {
  minWidth: '200px',
  padding: '1rem 2.5rem',
  fontSize: '1rem',
  fontWeight: 700,
  fontFamily: "'Orbitron', sans-serif",
  color: '#ffffff',
  background: 'rgba(0, 180, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  border: '2px solid #00b4ff',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  boxShadow: `
    0 0 20px rgba(0, 180, 255, 0.4),
    0 4px 20px rgba(0, 0, 0, 0.5)
  `,
  outline: 'none',
}
