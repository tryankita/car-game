import { useState, Suspense, lazy } from 'react'
import useGameStore from '../../store'
import audioManager from '../../audioManager'

const HomeBg3D = lazy(() => import('./HomeBg3D'))

export default function ModeSelect() {
  const setScreen = useGameStore((s) => s.setScreen)
  const [hover, setHover] = useState(null)

  const go = (screen) => {
    audioManager.enableAudio()
    setScreen(screen)
  }

  return (
    <div style={containerStyle}>
      <Suspense fallback={null}><HomeBg3D /></Suspense>
      <div style={darkOverlay} />

      <div style={contentWrapper}>
        {/* Back */}
        <button
          style={{
            ...backBtn,
            opacity: hover === 'back' ? 1 : 0.7,
            transform: hover === 'back' ? 'translateX(-4px)' : 'none',
          }}
          onMouseEnter={() => setHover('back')}
          onMouseLeave={() => setHover(null)}
          onClick={() => go('home')}
        >
          ← BACK
        </button>

        {/* Two big cards */}
        <div style={cardsRow}>

          {/* TRACK RACE */}
          <button
            style={{
              ...card,
              borderColor: hover === 'track' ? '#00b4ff' : 'rgba(0,180,255,0.2)',
              boxShadow: hover === 'track'
                ? '0 0 40px rgba(0,180,255,0.35), inset 0 0 30px rgba(0,180,255,0.08)'
                : '0 0 15px rgba(0,180,255,0.1)',
              transform: hover === 'track' ? 'translateY(-6px) scale(1.03)' : 'none',
            }}
            onMouseEnter={() => setHover('track')}
            onMouseLeave={() => setHover(null)}
            onClick={() => go('levels')}
          >
            <span style={cardIcon}>🏁</span>
            <span style={{ ...cardLabel, color: '#00b4ff' }}>TRACK RACE</span>
          </button>

          {/* ARCADE */}
          <button
            style={{
              ...card,
              borderColor: hover === 'arcade' ? '#facc15' : 'rgba(250,204,21,0.2)',
              boxShadow: hover === 'arcade'
                ? '0 0 40px rgba(250,204,21,0.35), inset 0 0 30px rgba(250,204,21,0.08)'
                : '0 0 15px rgba(250,204,21,0.1)',
              transform: hover === 'arcade' ? 'translateY(-6px) scale(1.03)' : 'none',
            }}
            onMouseEnter={() => setHover('arcade')}
            onMouseLeave={() => setHover(null)}
            onClick={() => go('arcade')}
          >
            <span style={cardIcon}>🕹</span>
            <span style={{ ...cardLabel, color: '#facc15' }}>ARCADE</span>
          </button>

        </div>
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

const contentWrapper = {
  position: 'relative', zIndex: 2, height: '100%',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  padding: '2rem',
}

const backBtn = {
  position: 'absolute', top: '2rem', left: '2rem',
  background: 'none', border: 'none',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '0.85rem', fontWeight: 700,
  fontFamily: "'Orbitron', sans-serif",
  letterSpacing: '0.15em', cursor: 'pointer',
  transition: 'all 0.25s ease',
}

const cardsRow = {
  display: 'flex', gap: '2rem',
  flexWrap: 'wrap', justifyContent: 'center',
  alignItems: 'center',
}

const card = {
  width: '220px', height: '220px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: '1.2rem',
  background: 'rgba(8,12,22,0.75)', backdropFilter: 'blur(14px)',
  border: '2px solid', borderRadius: '20px',
  cursor: 'pointer', outline: 'none',
  transition: 'all 0.3s ease',
}

const cardIcon = {
  fontSize: '3rem',
}

const cardLabel = {
  fontSize: '0.95rem', fontWeight: 900,
  fontFamily: "'Orbitron', sans-serif",
  letterSpacing: '0.15em', textTransform: 'uppercase',
}
