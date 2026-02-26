import { useEffect, useState } from 'react'
import useGameStore from '../../store'
import audioManager from '../../audioManager'

export default function Home() {
  const startRace = useGameStore((s) => s.startRace)
  const setScreen = useGameStore((s) => s.setScreen)
  const [hoverStart, setHoverStart] = useState(false)
  const [hoverGarage, setHoverGarage] = useState(false)

  // Try to play music when component mounts
  useEffect(() => {
    audioManager.enableAudio()
    audioManager.playMenuMusic()
  }, [])

  const handleStartRace = () => {
    audioManager.enableAudio()
    startRace()
  }

  const handleGarage = () => {
    audioManager.enableAudio()
    audioManager.playMenuMusic()
    setScreen('garage')
  }

  const handleEnableAudio = () => {
    audioManager.enableAudio()
    audioManager.playMenuMusic()
  }

  return (
    <div style={containerStyle}>
      {/* Animated background layers */}
      <div style={bgLayer1} />
      <div style={bgLayer2} />
      <div style={gridOverlay} />

      {/* Content */}
      <div style={contentWrapper}>
        {/* Top decorative line */}
        <div style={topLineStyle} />

        {/* Logo/Title Section */}
        <div style={logoSection}>
          <h1 style={titleStyle}>
            <span style={glitchText}>CAR</span>
            {' '}
            <span style={{ ...glitchText, 
              background: 'linear-gradient(90deg, #00b4ff 0%, #ff3250 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>RACING</span>
          </h1>
        </div>

        {/* Main Action Buttons */}
        <div style={cardsContainer}>
          <button
            style={{
              ...neonButton,
              ...(hoverStart ? neonButtonHover('#00b4ff') : {}),
            }}
            onClick={handleStartRace}
            onMouseEnter={() => setHoverStart(true)}
            onMouseLeave={() => setHoverStart(false)}
          >
            START GAME
          </button>

          <button
            style={{
              ...neonButton,
              ...(hoverGarage ? neonButtonHover('#888') : {}),
            }}
            onClick={handleGarage}
            onMouseEnter={() => setHoverGarage(true)}
            onMouseLeave={() => setHoverGarage(false)}
          >
            GARAGE
          </button>

          <button
            style={{
              ...neonButton,
              ...(hoverStart ? neonButtonHover('#888') : {}),
            }}
            onClick={handleEnableAudio}
          >
            MAP
          </button>
        </div>

        {/* Bottom Info */}
        <div style={bottomInfo}>
          <div style={controlHint}>
            <span style={hintKey}>WASD</span> / <span style={hintKey}>ARROWS</span> to drive
          </div>
          <div style={controlHint}>
            <span style={hintKey}>SPACE</span> to brake
          </div>
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
    radial-gradient(ellipse 100% 80% at 0% 50%, rgba(0, 180, 255, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse 100% 80% at 100% 50%, rgba(255, 50, 80, 0.35) 0%, transparent 50%)
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
  justifyContent: 'center',
  padding: '2rem',
  gap: '3rem',
}

const topLineStyle = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  height: '0px',
  display: 'none',
}

const logoSection = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0rem',
  marginBottom: '3rem',
}

const titleStyle = {
  fontSize: '6rem',
  fontWeight: 900,
  textAlign: 'center',
  lineHeight: 1,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  margin: 0,
  fontFamily: "'Orbitron', sans-serif",
  fontStyle: 'italic',
}

const glitchText = {
  color: '#ffffff',
  textShadow: `
    0 0 20px rgba(0, 180, 255, 0.8),
    0 0 40px rgba(0, 180, 255, 0.6),
    0 0 60px rgba(0, 180, 255, 0.4),
    2px 2px 4px rgba(0, 0, 0, 0.8)
  `,
  filter: 'drop-shadow(0 4px 20px rgba(255, 50, 80, 0.4))',
}

const subtitleBadge = {
  display: 'none',
}

const badgeLine = {
  display: 'none',
}

const subtitleText = {
  display: 'none',
}

const cardsContainer = {
  display: 'flex',
  gap: '2rem',
  flexWrap: 'wrap',
  justifyContent: 'center',
  maxWidth: '1000px',
}

const neonButton = {
  position: 'relative',
  minWidth: '200px',
  padding: '1.2rem 3rem',
  fontSize: '1.1rem',
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
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  outline: 'none',
}

const neonButtonHover = (color) => ({
  border: `2px solid ${color}`,
  boxShadow: `
    0 0 20px ${color},
    0 0 40px ${color}88,
    0 4px 30px rgba(0, 0, 0, 0.7),
    inset 0 0 15px ${color}33
  `,
  textShadow: `0 0 10px ${color}`,
  transform: 'translateY(-2px)',
})

const cardGlow = (color) => ({ display: 'none' })
const cardIconWrapper = (color) => ({ display: 'none' })
const cardIcon = { display: 'none' }
const cardTitle = { display: 'none' }
const cardDesc = { display: 'none' }
const cardArrow = { display: 'none' }
const actionCard = { display: 'none' }
const actionCardHover = { display: 'none' }

const audioBtn = {
  display: 'none',
}

const bottomInfo = {
  position: 'absolute',
  bottom: '2rem',
  display: 'none',
}

const controlHint = {
  display: 'none',
}

const hintKey = {
  display: 'none',
}
