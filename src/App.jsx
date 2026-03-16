import React, { useEffect, useState, Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import useGameStore from './store'
import audioManager from './audioManager'

// Lazy-loaded UI pages
const Home = lazy(() => import('./components/UI/Home'))
const Garage = lazy(() => import('./components/UI/Garage'))
const Levels = lazy(() => import('./components/UI/Levels'))
const PreRace = lazy(() => import('./components/UI/PreRace'))
const HUD = lazy(() => import('./components/UI/HUDPhoto'))
const RaceFinish = lazy(() => import('./components/UI/RaceFinish'))
const ArcadeGame = lazy(() => import('./components/UI/ArcadeGame'))
const ModeSelect = lazy(() => import('./components/UI/ModeSelect'))

// Lazy-loaded 3D scene components
const Car = lazy(() => import('./components/Car'))
const Track = lazy(() => import('./components/Track'))
const Terrain = lazy(() => import('./components/Terrain'))
const Lighting = lazy(() => import('./components/Lighting'))

/* ── Loading Fallback ───────────────────────────────────────── */
function PageLoader({ label = 'LOADING' }) {
  return (
    <div style={loaderStyle}>
      <div style={loaderInner}>
        <div style={spinnerRing} />
        <div style={loaderText}>{label}</div>
        <div style={loaderDots}>
          <span style={{ ...dot, animationDelay: '0s' }} />
          <span style={{ ...dot, animationDelay: '0.2s' }} />
          <span style={{ ...dot, animationDelay: '0.4s' }} />
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:0.2} 50%{opacity:1} }
      `}</style>
    </div>
  )
}

const loaderStyle = {
  width: '100vw',
  height: '100vh',
  background: '#050510',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Orbitron', sans-serif",
}

const loaderInner = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.5rem',
}

const spinnerRing = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  border: '3px solid rgba(0, 180, 255, 0.15)',
  borderTop: '3px solid #00b4ff',
  animation: 'spin 0.9s linear infinite',
  boxShadow: '0 0 20px rgba(0, 180, 255, 0.4)',
}

const loaderText = {
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '0.3em',
  color: '#ffffff',
  textShadow: '0 0 15px rgba(0, 180, 255, 0.8)',
}

const loaderDots = {
  display: 'flex',
  gap: '0.5rem',
}

const dot = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#00b4ff',
  animation: 'blink 1s ease-in-out infinite',
  boxShadow: '0 0 8px rgba(0, 180, 255, 0.6)',
}

/* ── Game Scene ─────────────────────────────────────────────── */
function GameScene() {
  const setCountdown = useGameStore((s) => s.setCountdown)
  const setRaceStarted = useGameStore((s) => s.setRaceStarted)
  const raceFinished = useGameStore((s) => s.raceFinished)

  useEffect(() => {
    audioManager.playRaceMusic()

    const t1 = setTimeout(() => setCountdown(2), 1000)
    const t2 = setTimeout(() => setCountdown(1), 2000)
    const t3 = setTimeout(() => {
      setCountdown(0)
      setRaceStarted(true)
    }, 3000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      audioManager.stopEngineSound()
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas shadows camera={{ position: [155, 12, -20], fov: 60 }} gl={{ antialias: true }}>
        <color attach="background" args={['#87ceeb']} />
        <Suspense fallback={null}>
          <Lighting />
          <Track />
          <Terrain />
          <Car />
        </Suspense>
      </Canvas>
      <Suspense fallback={null}>
        <HUD />
      </Suspense>
      {raceFinished && (
        <Suspense fallback={null}>
          <RaceFinish />
        </Suspense>
      )}
      <MusicToggle />
    </div>
  )
}

/* ── Music Toggle Button ───────────────────────────────────── */
function MusicToggle() {
  const musicMuted = useGameStore((s) => s.musicMuted)
  const toggleMute = useGameStore((s) => s.toggleMute)

  return (
    <button
      onClick={toggleMute}
      style={{
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
        fontSize: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      title={musicMuted ? 'Unmute Music' : 'Mute Music'}
    >
      {musicMuted ? '🔇' : '🔊'}
    </button>
  )
}

function OrientationGate({ children }) {
  const [mustRotate, setMustRotate] = useState(false)

  useEffect(() => {
    const update = () => {
      const hasTouch = ('ontouchstart' in window) || ((navigator.maxTouchPoints || 0) > 0)
      const smallSide = Math.min(window.innerWidth, window.innerHeight)
      const isMobileOrTablet = hasTouch && smallSide <= 1024
      const isPortrait = window.innerHeight > window.innerWidth

      setMustRotate(isMobileOrTablet && isPortrait)

      if (isMobileOrTablet && !isPortrait && window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {})
      }
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  if (!mustRotate) return children

  return (
    <div style={rotateWrap}>
      <div style={rotateCard}>
        <div style={rotateTitle}>Rotate Device</div>
        <div style={rotateText}>This game is optimized for landscape mode on mobile and tablet.</div>
      </div>
    </div>
  )
}

const rotateWrap = {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 50% 40%, rgba(18,28,42,0.96), rgba(4,8,14,0.98))',
  padding: '1.5rem',
  fontFamily: "'Orbitron', sans-serif",
}

const rotateCard = {
  width: 'min(420px, 92vw)',
  border: '1px solid rgba(0,180,255,0.45)',
  borderRadius: '14px',
  background: 'rgba(8,14,24,0.82)',
  padding: '1.4rem 1.2rem',
  textAlign: 'center',
  boxShadow: '0 0 30px rgba(0,180,255,0.2)',
}

const rotateTitle = {
  color: '#f5fbff',
  fontSize: '1.25rem',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const rotateText = {
  marginTop: '0.8rem',
  color: 'rgba(230,240,255,0.82)',
  fontSize: '0.9rem',
  lineHeight: 1.5,
}

/* ── Root App ───────────────────────────────────────────────── */
export default function App() {
  const screen = useGameStore((s) => s.screen)

  useEffect(() => {
    if (screen === 'home' || screen === 'modeselect' || screen === 'garage' || screen === 'levels' || screen === 'prerace') {
      audioManager.playMenuMusic()
    } else if (screen === 'arcade') {
      audioManager.stopMenuMusic()
    }
  }, [screen])

  let content

  if (screen === 'arcade') {
    content = (
      <Suspense fallback={<PageLoader label="ARCADE" />}>
        <ArcadeGame />
      </Suspense>
    )
  } else if (screen === 'home') {
    content = (
      <Suspense fallback={<PageLoader label="LOADING" />}>
        <Home /><MusicToggle />
      </Suspense>
    )
  } else if (screen === 'modeselect') {
    content = (
      <Suspense fallback={<PageLoader label="LOADING" />}>
        <ModeSelect /><MusicToggle />
      </Suspense>
    )
  } else if (screen === 'garage') {
    content = (
      <Suspense fallback={<PageLoader label="GARAGE" />}>
        <Garage /><MusicToggle />
      </Suspense>
    )
  } else if (screen === 'levels') {
    content = (
      <Suspense fallback={<PageLoader label="LEVELS" />}>
        <Levels /><MusicToggle />
      </Suspense>
    )
  } else if (screen === 'prerace') {
    content = (
      <Suspense fallback={<PageLoader label="LOADING" />}>
        <PreRace /><MusicToggle />
      </Suspense>
    )
  } else {
    content = (
      <Suspense fallback={<PageLoader label="RACE" />}>
        <GameScene />
      </Suspense>
    )
  }

  return <OrientationGate>{content}</OrientationGate>
}
