import { useState, useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../../store'
import audioManager from '../../audioManager'

/* ── 3D Car Preview (auto-rotating) ────────────────────────── */
function CarPreview({ color, modelPath, previewScale }) {
  const groupRef = useRef()
  const { scene } = useGLTF(modelPath)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          child.material = child.material.clone()
          if (child.material.name?.toLowerCase().includes('body') ||
              child.material.name?.toLowerCase().includes('paint') ||
              child.material.name?.toLowerCase().includes('car')) {
            child.material.color = new THREE.Color(color)
          }
        }
      }
    })
    return clone
  }, [scene, color])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={previewScale || 0.9} />
    </group>
  )
}

useGLTF.preload('/models/muscle_car.glb')
useGLTF.preload('/models/sport_car.glb')

/* ── Fieldset-style section header with lines ────────────── */
function SectionHeader({ children }) {
  return (
    <div style={sectionHeaderStyle}>
      <div style={sectionLineStyle} />
      <span style={sectionLabelStyle}>{children}</span>
      <div style={sectionLineStyle} />
    </div>
  )
}

export default function Garage() {
  const cars = useGameStore((s) => s.cars)
  const selectedCar = useGameStore((s) => s.selectedCar)
  const selectCar = useGameStore((s) => s.selectCar)
  const setScreen = useGameStore((s) => s.setScreen)
  const coins = useGameStore((s) => s.coins)
  const completedLevels = useGameStore((s) => s.completedLevels)
  const levels = useGameStore((s) => s.levels)
  const levelStars = useGameStore((s) => s.levelStars)
  const musicMuted = useGameStore((s) => s.musicMuted)
  const toggleMute = useGameStore((s) => s.toggleMute)

  const currentCar = cars[selectedCar]

  // Progress calculations
  const totalLevels = levels.length
  const completedCount = completedLevels.length
  const completionPct = Math.round((completedCount / totalLevels) * 100)
  const totalStars = Object.values(levelStars).reduce((sum, s) => sum + s, 0)

  const goNext = () => selectCar((selectedCar + 1) % cars.length)
  const goPrev = () => selectCar((selectedCar - 1 + cars.length) % cars.length)

  const handleBack = () => {
    audioManager.enableAudio()
    setScreen('home')
  }

  const handleStartRace = () => {
    audioManager.enableAudio()
    setScreen('levels')
  }

  const handleToggleSound = () => {
    if (toggleMute) toggleMute()
  }

  return (
    <div style={containerStyle}>
      {/* Animated background */}
      <div style={bgOverlayStyle} />

      {/* ── Top Bar ─────────────────────────────── */}
      <div style={topBarStyle}>
        <button onClick={handleBack} style={backBtnTopStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
          ‹ BACK
        </button>

        <div style={topCenterStyle}>
          <h1 style={titleStyle}>GARAGE</h1>
          <p style={subtitleStyle}>CHOOSE YOUR MACHINE</p>
        </div>

        <div style={topRightStyle}>
          <div style={coinBadgeStyle}>🪙 {coins}</div>
          <button onClick={handleToggleSound} style={soundBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            {musicMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────── */}
      <div style={mainContentStyle}>
        <div style={showcaseRowStyle}>
          {/* Left arrow */}
          <button onClick={goPrev} style={arrowBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'scale(1.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1)' }}>
            ◄
          </button>

          {/* Center column */}
          <div style={centerColumnStyle}>
            {/* ── Showcase Panel ── */}
            <div style={showcasePanelStyle(currentCar.color)}>
              {/* 3D car */}
              <div style={canvasContainerStyle}>
                <div style={platformGlowStyle(currentCar.color)} />
                <Canvas camera={{ position: [9, 4, 9], fov: 40 }} shadows>
                  <Suspense fallback={null}>
                    <CarPreview color={currentCar.color} modelPath={currentCar.model} previewScale={currentCar.previewScale} />
                  </Suspense>
                  <ambientLight intensity={0.6} />
                  <spotLight position={[10, 15, 10]} angle={0.25} intensity={1.5} castShadow />
                  <spotLight position={[-10, 10, -10]} angle={0.3} intensity={0.8} />
                  <pointLight position={[0, -2, 0]} intensity={0.3} color={currentCar.color} />
                  <Environment preset="night" />
                </Canvas>
              </div>

              {/* Car name with decorative lines */}
              <div style={carNameRowStyle}>
                <div style={nameLine(currentCar.color)} />
                <h2 style={carNameStyle}>{currentCar.name}</h2>
                <div style={nameLine(currentCar.color)} />
              </div>
              <p style={carDescStyle}>{currentCar.description}</p>
            </div>

            {/* ── Stats Section ── */}
            <SectionHeader>STATS</SectionHeader>
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <span style={statIconStyle}>⚡</span>
                <div>
                  <div style={statValueRow}>
                    <span style={{ ...statValue, color: '#ff3366' }}>{Math.round(currentCar.topSpeed * 3.6)}</span>
                    <span style={statUnit}>KM/H</span>
                  </div>
                  <div style={statLabel}>TOP SPEED</div>
                </div>
              </div>
              <div style={statCardStyle}>
                <span style={statIconStyle}>🎯</span>
                <div>
                  <div style={statValueRow}>
                    <span style={{ ...statValue, color: '#00d4ff' }}>{currentCar.handling.toFixed(1)}</span>
                    <span style={statUnit}>/5.0</span>
                  </div>
                  <div style={statLabel}>HANDLING</div>
                </div>
              </div>
              <div style={statCardStyle}>
                <span style={statIconStyle}>🚀</span>
                <div>
                  <div style={statValueRow}>
                    <span style={{ ...statValue, color: '#00ff88' }}>{currentCar.acceleration}</span>
                    <span style={statUnit}>HP</span>
                  </div>
                  <div style={statLabel}>ACCELERATION</div>
                </div>
              </div>
            </div>

            {/* ── Rewards Section ── */}
            <SectionHeader>REWARDS</SectionHeader>
            <div style={rewardsBoxStyle}>
              <div style={rewardsTopRow}>
                <div style={rewardsStatBlock}>
                  <span style={rewardsLabelText}>COINS EARNED</span>
                  <span style={rewardsCoinValue}>🪙 {coins}</span>
                </div>
                <div style={rewardsStatBlock}>
                  <span style={rewardsPct}>{completionPct}%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div style={claimBtnStyle}>
                    CLAIM {totalStars * 10} COINS
                  </div>
                  <button onClick={handleStartRace} style={miniRaceBtnStyle}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}>
                    🪙 START RACE
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={progressRowStyle}>
                <span style={progressLevelBadge}>{completedCount}</span>
                <div style={progressBarTrack}>
                  <div style={progressBarFill(completionPct, currentCar.color)} />
                </div>
                <span style={progressLevelBadge}>{totalLevels}</span>
              </div>
            </div>
          </div>

          {/* Right arrow */}
          <button onClick={goNext} style={arrowBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'scale(1.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1)' }}>
            ►
          </button>
        </div>
      </div>

      {/* ── Bottom Action Buttons ─────────────────── */}
      <div style={bottomBarStyle}>
        <button onClick={handleBack} style={bottomBackBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
          ‹ BACK TO HOME
        </button>
        <button onClick={handleStartRace} style={bottomRaceBtn(currentCar.color)}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)' }}>
          ▶ START RACE
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */

const containerStyle = {
  position: 'fixed', inset: 0,
  width: '100vw', height: '100vh',
  background: 'linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #0f1419 100%)',
  fontFamily: "'Orbitron', sans-serif",
  overflow: 'hidden', zIndex: 10,
  display: 'flex', flexDirection: 'column',
}

const bgOverlayStyle = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  background: `
    radial-gradient(circle at 20% 50%, rgba(52,152,219,0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(231,76,60,0.08) 0%, transparent 50%)
  `,
}

/* ── Top Bar ── */
const topBarStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0.6rem 1.5rem', position: 'relative', zIndex: 2,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  flexShrink: 0,
}

const backBtnTopStyle = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
  color: '#ccc', fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem',
  padding: '0.4rem 1.2rem', borderRadius: 8, cursor: 'pointer',
  letterSpacing: '0.1em', transition: 'all 0.2s',
}

const topCenterStyle = { textAlign: 'center' }

const titleStyle = {
  fontSize: 'clamp(1.2rem, 2.5vw, 2.2rem)', color: '#fff', fontWeight: 900,
  letterSpacing: '0.35em', margin: 0,
  textShadow: '0 0 20px rgba(52,152,219,0.5), 0 0 40px rgba(52,152,219,0.3), 0 4px 8px rgba(0,0,0,0.5)',
}

const subtitleStyle = {
  color: '#888', fontFamily: "'Rajdhani', sans-serif",
  fontSize: '0.75rem', letterSpacing: '0.4em', textTransform: 'uppercase',
  margin: '2px 0 0', opacity: 0.7,
}

const topRightStyle = { display: 'flex', alignItems: 'center', gap: 10 }

const coinBadgeStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'linear-gradient(135deg, rgba(255,200,0,0.18), rgba(255,160,0,0.10))',
  border: '1px solid rgba(255,200,0,0.40)', borderRadius: 20,
  padding: '5px 16px', fontSize: '0.95rem', fontWeight: 700,
  color: '#ffd700', letterSpacing: '0.05em',
  textShadow: '0 0 8px rgba(255,215,0,0.5)',
}

const soundBtnStyle = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
  color: '#ccc', fontSize: '1.1rem', width: 36, height: 36,
  borderRadius: '50%', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
  padding: 0,
}

/* ── Main Content ── */
const mainContentStyle = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
  overflow: 'hidden', position: 'relative', zIndex: 1,
  padding: '0.5rem 1rem',
}

const showcaseRowStyle = {
  display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 2rem)',
  maxWidth: 1100, width: '100%', height: '100%',
}

const centerColumnStyle = {
  flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem',
  height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingBottom: 4,
  scrollbarWidth: 'none',
}

const arrowBtnStyle = {
  fontSize: '1.6rem', color: '#fff',
  background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255,255,255,0.15)', borderRadius: '50%',
  width: 64, height: 64, cursor: 'pointer', flexShrink: 0,
  transition: 'all 0.3s', fontFamily: "'Orbitron', sans-serif",
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

/* ── Showcase Panel ── */
const showcasePanelStyle = (color) => ({
  background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 18, padding: '0.8rem 1.2rem',
  boxShadow: `0 0 40px ${color}11, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
})

const canvasContainerStyle = {
  position: 'relative', width: '100%',
  height: 'clamp(140px, 22vh, 300px)',
  borderRadius: 14, overflow: 'hidden',
  background: 'radial-gradient(ellipse at center, rgba(30,30,60,0.4) 0%, rgba(10,10,20,0.8) 70%)',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)',
}

const platformGlowStyle = (color) => ({
  position: 'absolute', bottom: '10%', left: '50%',
  transform: 'translateX(-50%)', width: '40%', height: 8,
  background: `radial-gradient(ellipse, ${color}66 0%, transparent 70%)`,
  filter: 'blur(15px)', zIndex: 0,
})

const carNameRowStyle = {
  display: 'flex', alignItems: 'center', gap: '1rem',
  marginTop: '0.6rem', width: '80%',
}

const nameLine = (color) => ({
  flex: 1, height: 1,
  background: `linear-gradient(90deg, transparent, ${color}88, transparent)`,
})

const carNameStyle = {
  fontSize: 'clamp(1.1rem, 2vw, 1.8rem)', color: '#fff', fontWeight: 900,
  letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap',
}

const carDescStyle = {
  color: '#bbb', fontFamily: "'Rajdhani', sans-serif",
  fontSize: '0.85rem', marginTop: 2, marginBottom: 0,
  fontStyle: 'italic', textAlign: 'center', opacity: 0.8,
}

/* ── Section Header ── */
const sectionHeaderStyle = {
  display: 'flex', alignItems: 'center', gap: '0.8rem',
  width: '100%', margin: '0.3rem 0 0.2rem',
}

const sectionLineStyle = {
  flex: 1, height: 1,
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
}

const sectionLabelStyle = {
  fontSize: '0.65rem', color: '#888', letterSpacing: '0.3em',
  fontFamily: "'Orbitron', sans-serif", fontWeight: 600,
  textTransform: 'uppercase', whiteSpace: 'nowrap',
}

/* ── Stats Grid ── */
const statsGridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '0.6rem', width: '100%',
}

const statCardStyle = {
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: '0.7rem 1rem',
  display: 'flex', alignItems: 'center', gap: '0.7rem',
}

const statIconStyle = { fontSize: '1.4rem' }

const statValueRow = {
  display: 'flex', alignItems: 'baseline', gap: 4,
}

const statValue = {
  fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.02em',
}

const statUnit = {
  fontSize: '0.7rem', color: '#666', fontWeight: 500,
}

const statLabel = {
  fontSize: '0.55rem', color: '#888', letterSpacing: '0.12em',
  fontWeight: 600, marginTop: 2,
}

/* ── Rewards Box ── */
const rewardsBoxStyle = {
  background: 'rgba(0,0,0,0.30)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14, padding: '0.7rem 1rem',
  width: '100%', boxSizing: 'border-box',
}

const rewardsTopRow = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: '1rem', flexWrap: 'wrap',
}

const rewardsStatBlock = {
  display: 'flex', flexDirection: 'column', gap: 2,
}

const rewardsLabelText = {
  fontSize: '0.55rem', color: '#888', letterSpacing: '0.15em', fontWeight: 600,
}

const rewardsCoinValue = {
  fontSize: '1.1rem', fontWeight: 800, color: '#ffd700',
  textShadow: '0 0 6px rgba(255,215,0,0.3)',
}

const rewardsPct = {
  fontSize: '1.5rem', fontWeight: 900, color: '#fff',
  letterSpacing: '-0.02em',
}

const claimBtnStyle = {
  background: 'linear-gradient(135deg, #e6940a, #d47b00)',
  border: '1px solid #f0a830', borderRadius: 8,
  color: '#fff', fontFamily: "'Orbitron', sans-serif",
  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
  padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s',
  textTransform: 'uppercase', textAlign: 'center',
}

const miniRaceBtnStyle = {
  background: 'linear-gradient(135deg, #e6940a, #d47b00)',
  border: '1px solid #f0a830', borderRadius: 8,
  color: '#fff', fontFamily: "'Orbitron', sans-serif",
  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
  padding: '5px 12px', cursor: 'pointer', transition: 'all 0.2s',
}

const progressRowStyle = {
  display: 'flex', alignItems: 'center', gap: '0.6rem',
  marginTop: '0.5rem',
}

const progressLevelBadge = {
  fontSize: '0.75rem', fontWeight: 800, color: '#aaa',
  minWidth: 20, textAlign: 'center',
}

const progressBarTrack = {
  flex: 1, height: 8, borderRadius: 4,
  background: 'rgba(255,255,255,0.06)',
  overflow: 'hidden', position: 'relative',
}

const progressBarFill = (pct, color) => ({
  width: `${pct}%`, height: '100%', borderRadius: 4,
  background: `linear-gradient(90deg, #3b6fd4, ${color || '#a855f7'})`,
  transition: 'width 0.6s ease',
  boxShadow: `0 0 8px ${color || '#a855f7'}66`,
})

/* ── Bottom Bar ── */
const bottomBarStyle = {
  display: 'flex', justifyContent: 'center', gap: '1.2rem',
  padding: '0.7rem 1.5rem', position: 'relative', zIndex: 2,
  borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
}

const bottomBackBtn = {
  padding: '0.7rem 2rem', fontSize: '0.8rem',
  fontFamily: "'Orbitron', sans-serif", fontWeight: 600,
  color: '#aaa', background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
  cursor: 'pointer', letterSpacing: '0.1em', transition: 'all 0.2s',
  textTransform: 'uppercase',
}

const bottomRaceBtn = (color) => ({
  padding: '0.7rem 2.5rem', fontSize: '0.9rem',
  fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
  color: '#fff',
  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
  border: `1px solid ${color}`, borderRadius: 10,
  cursor: 'pointer', letterSpacing: '0.12em', transition: 'all 0.2s',
  textTransform: 'uppercase',
  boxShadow: `0 4px 20px ${color}44, 0 0 30px ${color}22`,
})
