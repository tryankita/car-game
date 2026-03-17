import { useEffect, useState, Suspense, lazy } from 'react'
import useGameStore from '../../store'
import audioManager from '../../audioManager'

const HomeBg3D = lazy(() => import('./HomeBg3D'))

export default function Home() {
  const setScreen = useGameStore((s) => s.setScreen)
  const [hover, setHover] = useState(null)
  const [showBg3D, setShowBg3D] = useState(false)

  useEffect(() => {
    let idleId = null
    let timeoutId = null

    const hasTouch = ('ontouchstart' in window) || ((navigator.maxTouchPoints || 0) > 0)
    const smallSide = Math.min(window.innerWidth, window.innerHeight)
    const isCompactDevice = hasTouch && smallSide <= 1024
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const lowMemoryDevice = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4

    if (!isCompactDevice && !prefersReducedMotion && !lowMemoryDevice) {
      const revealBg = () => setShowBg3D(true)
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(revealBg, { timeout: 1200 })
      } else {
        timeoutId = window.setTimeout(revealBg, 450)
      }
    }

    const unlockAudio = () => {
      audioManager.enableAudio()
      audioManager.playMenuMusic()
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }

    window.addEventListener('pointerdown', unlockAudio, { once: true })
    window.addEventListener('keydown', unlockAudio, { once: true })

    return () => {
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  const handleStart = () => {
    audioManager.enableAudio()
    setScreen('modeselect')
  }

  return (
    <div style={containerStyle}>
      {showBg3D && (
        <Suspense fallback={null}><HomeBg3D /></Suspense>
      )}
      <div style={darkOverlay} />
      <div style={gridOverlay} />

      <div style={contentWrapper}>
        {/* Title */}
        <div style={titleSection}>
          <h1 style={titleStyle}>
            <span style={titleWhite}>CAR</span>
            {' '}
            <span style={titleGrad}>RACING</span>
          </h1>
          <div style={titleDivider} />
          <span style={titleSub}>SPEED · DRIFT · DOMINATE</span>
        </div>

        {/* Single Start Game Button */}
        <button
          style={{
            ...startBtn,
            borderColor: hover === 'start' ? '#00b4ff' : 'rgba(0,180,255,0.35)',
            boxShadow: hover === 'start'
              ? '0 0 30px rgba(0,180,255,0.5), 0 0 60px rgba(0,180,255,0.2), inset 0 0 20px rgba(0,180,255,0.15)'
              : '0 0 20px rgba(0,180,255,0.2), inset 0 0 10px rgba(0,180,255,0.05)',
            transform: hover === 'start' ? 'translateY(-3px) scale(1.03)' : 'none',
            background: hover === 'start'
              ? 'linear-gradient(135deg, rgba(0,180,255,0.2), rgba(255,50,80,0.15))'
              : 'rgba(255,255,255,0.04)',
          }}
          onMouseEnter={() => setHover('start')}
          onMouseLeave={() => setHover(null)}
          onClick={handleStart}
        >
          <span style={startBtnIcon}>▶</span>
          START GAME
        </button>

        {/* Tagline */}
        <span style={tagline}>Choose your mode and hit the track</span>
      </div>
    </div>
  )
}

/* ── Styles ── */

const containerStyle = {
  position: 'relative', width: '100vw', height: '100vh',
  overflow: 'hidden', background: '#050510',
  fontFamily: "'Orbitron', sans-serif",
}

const darkOverlay = {
  position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
  background: `
    radial-gradient(ellipse 120% 70% at 50% 40%, transparent 30%, rgba(20,5,10,0.65) 100%),
    linear-gradient(to bottom, rgba(15,5,10,0.1) 0%, rgba(15,5,10,0.45) 60%, rgba(10,2,8,0.8) 100%)
  `,
}

const gridOverlay = {
  position: 'absolute', inset: 0, zIndex: 1, opacity: 0.4, pointerEvents: 'none',
  backgroundImage: `
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,255,0.03) 2px, rgba(0,180,255,0.03) 3px),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,50,80,0.03) 2px, rgba(255,50,80,0.03) 3px)
  `,
  backgroundSize: '60px 60px',
}

const contentWrapper = {
  position: 'relative', zIndex: 2, height: '100%',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  padding: '2rem', gap: '2.5rem',
}

const titleSection = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
}

const titleStyle = {
  fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 900, textAlign: 'center',
  lineHeight: 1, letterSpacing: '0.08em', textTransform: 'uppercase',
  margin: 0, fontFamily: "'Orbitron', sans-serif", fontStyle: 'italic',
}

const titleWhite = {
  color: '#ffffff',
  textShadow: '0 0 20px rgba(0,180,255,0.8), 0 0 40px rgba(0,180,255,0.4)',
  filter: 'drop-shadow(0 4px 20px rgba(255,50,80,0.4))',
}

const titleGrad = {
  background: 'linear-gradient(90deg,#00b4ff 0%,#ff3250 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  filter: 'drop-shadow(0 4px 20px rgba(0,180,255,0.5))',
}

const titleDivider = {
  width: '120px', height: '2px', marginTop: '0.4rem',
  background: 'linear-gradient(90deg, transparent, #00b4ff, #ff3250, transparent)',
}

const titleSub = {
  fontSize: '0.72rem', letterSpacing: '0.45em', color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase', marginTop: '0.2rem',
}

const startBtn = {
  padding: '1.2rem 3.5rem',
  fontSize: '1.1rem', fontWeight: 900,
  fontFamily: "'Orbitron', sans-serif",
  color: '#ffffff',
  background: 'rgba(255,255,255,0.04)',
  border: '2px solid rgba(0,180,255,0.35)',
  borderRadius: '14px', cursor: 'pointer',
  letterSpacing: '0.2em', textTransform: 'uppercase',
  transition: 'all 0.3s ease', outline: 'none',
  display: 'flex', alignItems: 'center', gap: '0.8rem',
  textShadow: '0 0 15px rgba(0,180,255,0.6)',
}

const startBtnIcon = {
  fontSize: '1.3rem',
  filter: 'drop-shadow(0 0 8px rgba(0,180,255,0.8))',
}

const tagline = {
  fontSize: '0.7rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase',
  fontFamily: "'Outfit', sans-serif",
}
