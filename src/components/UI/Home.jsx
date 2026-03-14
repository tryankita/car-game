import { useEffect, useState, Suspense, lazy } from 'react'
import useGameStore from '../../store'
import audioManager from '../../audioManager'
import SettingsOverlay from './SettingsOverlay'

const HomeBg3D = lazy(() => import('./HomeBg3D'))

export default function Home() {
  const setScreen = useGameStore((s) => s.setScreen)
  const setShowSettings = useGameStore((s) => s.setShowSettings)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    audioManager.enableAudio()
    audioManager.playMenuMusic()
  }, [])

  const go = (screen) => {
    audioManager.enableAudio()
    setScreen(screen)
  }

  const btn = (id, label, color, onClick) => (
    <button
      style={{ ...modeBtn, borderColor: hover === id ? color : 'rgba(255,255,255,0.12)',
        boxShadow: hover === id ? `0 0 18px ${color}88, inset 0 0 10px ${color}22` : 'none',
        color: hover === id ? '#fff' : 'rgba(255,255,255,0.82)',
        textShadow: hover === id ? `0 0 10px ${color}` : 'none',
        transform: hover === id ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHover(id)}
      onMouseLeave={() => setHover(null)}
      onClick={onClick}
    >
      {label}
    </button>
  )

  return (
    <div style={containerStyle}>
      <Suspense fallback={null}><HomeBg3D /></Suspense>
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
          <span style={titleSub}>SELECT MODE</span>
        </div>

        {/* Two mode panels */}
        <div style={modesRow}>

          {/* ── TRACK RACE ── */}
          <div style={{ ...modeCard, borderColor: hover && hover.startsWith('tr') ? '#00b4ff44' : 'rgba(0,180,255,0.18)' }}>
            <div style={modeHeader}>
              <div style={{ ...modeIcon, background: 'linear-gradient(135deg,#003a55,#005f8a)' }}>🏁</div>
              <h2 style={{ ...modeName, color: '#00b4ff' }}>TRACK RACE</h2>
              <p style={modeDesc}>Circuit racing on defined tracks.<br/>Compete against AI opponents.</p>
            </div>
            <div style={modeDivider} />
            <div style={modeBtns}>
              {btn('tr-start', 'START GAME', '#00b4ff', () => go('levels'))}
              {btn('tr-garage', 'GARAGE', '#00b4ff', () => go('garage'))}
              {btn('tr-settings', 'SETTINGS', '#00b4ff', () => { audioManager.enableAudio(); setShowSettings(true) })}
            </div>
          </div>

          {/* vertical separator */}
          <div style={vertDivider} />

          {/* ── ARCADE MODE ── */}
          <div style={{ ...modeCard, borderColor: hover && hover.startsWith('ac') ? '#facc1544' : 'rgba(250,204,21,0.18)' }}>
            <div style={modeHeader}>
              <div style={{ ...modeIcon, background: 'linear-gradient(135deg,#3b2800,#7a5400)' }}>🕹</div>
              <h2 style={{ ...modeName, color: '#facc15' }}>ARCADE MODE</h2>
              <p style={modeDesc}>Dodge traffic &amp; collect coins.<br/>4 maps · nitro boost · high score.</p>
            </div>
            <div style={modeDivider} />
            <div style={modeBtns}>
              {btn('ac-start', 'START GAME', '#facc15', () => go('arcade'))}
            </div>
          </div>

        </div>
      </div>

      <SettingsOverlay />
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

const modesRow = {
  display: 'flex', flexDirection: 'row', alignItems: 'stretch',
  gap: '0', flexWrap: 'wrap', justifyContent: 'center',
  maxWidth: '900px', width: '100%',
}

const modeCard = {
  flex: '1 1 280px', maxWidth: '380px', minWidth: '240px',
  display: 'flex', flexDirection: 'column', gap: '1.2rem',
  padding: '2rem 2.4rem',
  background: 'rgba(8,12,22,0.72)', backdropFilter: 'blur(14px)',
  border: '1px solid', borderRadius: '16px',
  transition: 'border-color 0.3s',
}

const modeHeader = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', textAlign: 'center',
}

const modeIcon = {
  width: '56px', height: '56px', borderRadius: '12px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.8rem',
}

const modeName = {
  margin: 0, fontSize: '1.4rem', fontWeight: 900,
  letterSpacing: '0.12em', textTransform: 'uppercase',
}

const modeDesc = {
  margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.04em', lineHeight: 1.6, textAlign: 'center',
  fontFamily: "'Outfit', sans-serif",
}

const modeDivider = {
  height: '1px', background: 'rgba(255,255,255,0.08)',
}

const modeBtns = {
  display: 'flex', flexDirection: 'column', gap: '0.75rem',
}

const modeBtn = {
  width: '100%', padding: '0.9rem 1.5rem',
  fontSize: '0.78rem', fontWeight: 700,
  fontFamily: "'Orbitron', sans-serif",
  color: 'rgba(255,255,255,0.82)',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px', cursor: 'pointer',
  letterSpacing: '0.16em', textTransform: 'uppercase',
  transition: 'all 0.25s ease', outline: 'none',
}

const vertDivider = {
  width: '1px', alignSelf: 'stretch', margin: '0 0.5rem',
  background: 'rgba(255,255,255,0.07)',
  flexShrink: 0,
}
