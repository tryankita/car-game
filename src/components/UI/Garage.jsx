import { useState, useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../../store'
import audioManager from '../../audioManager'

const MODEL_PATH = '/models/muscle_car.glb'

/* ── 3D Car Preview (auto-rotating) ────────────────────────── */
function CarPreview({ color }) {
  const groupRef = useRef()
  const { scene } = useGLTF(MODEL_PATH)

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
      <primitive object={clonedScene} scale={0.9} />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)

export default function Garage() {
  const cars = useGameStore((s) => s.cars)
  const selectedCar = useGameStore((s) => s.selectedCar)
  const selectCar = useGameStore((s) => s.selectCar)
  const setScreen = useGameStore((s) => s.setScreen)
  const startRace = useGameStore((s) => s.startRace)

  const currentCar = cars[selectedCar]

  const goNext = () => selectCar((selectedCar + 1) % cars.length)
  const goPrev = () => selectCar((selectedCar - 1 + cars.length) % cars.length)

  const handleBack = () => {
    audioManager.enableAudio()
    setScreen('home')
  }

  const handleStartRace = () => {
    audioManager.enableAudio()
    startRace()
  }

  return (
    <div style={containerStyle}>
      {/* Animated background overlay */}
      <div style={bgOverlayStyle} />
      
      {/* Content wrapper */}
      <div style={contentWrapperStyle}>
        {/* Header section */}
        <div style={headerSectionStyle}>
          <div style={headerLineStyle} />
          <h1 style={titleStyle}>
            ⚡ GARAGE
          </h1>
          <div style={headerLineStyle} />
        </div>
        <p style={subtitleStyle}>CHOOSE YOUR MACHINE</p>

        {/* Main showcase area */}
        <div style={showcaseAreaStyle}>
          {/* Navigation arrows */}
          <button onClick={goPrev} style={arrowBtnStyle} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            ◄
          </button>

          {/* Center panel with glass effect */}
          <div style={glassPanelStyle}>
            {/* 3D Showcase */}
            <div style={canvasContainerStyle}>
              <div style={platformGlowStyle(currentCar.color)} />
              <Canvas camera={{ position: [9, 4, 9], fov: 40 }} shadows>
                <Suspense fallback={null}>
                  <CarPreview color={currentCar.color} />
                </Suspense>
                <ambientLight intensity={0.6} />
                <spotLight position={[10, 15, 10]} angle={0.25} intensity={1.5} castShadow />
                <spotLight position={[-10, 10, -10]} angle={0.3} intensity={0.8} />
                <pointLight position={[0, -2, 0]} intensity={0.3} color={currentCar.color} />
                <Environment preset="night" />
              </Canvas>
            </div>

            {/* Car info badge */}
            <div style={infoBadgeStyle(currentCar.color)}>
              <h2 style={carNameStyle}>{currentCar.name}</h2>
              <div style={modelNumberStyle}>MODEL #{selectedCar + 1}</div>
            </div>

            {/* Description */}
            <p style={carDescStyle}>{currentCar.description}</p>

            {/* Stats grid */}
            <div style={statsGridStyle}>
              <StatCard icon="⚡" label="TOP SPEED" value={`${Math.round(currentCar.topSpeed * 3.6)}`} unit="KM/H" color="#ff3366" />
              <StatCard icon="🎯" label="HANDLING" value={currentCar.handling.toFixed(1)} unit="/5.0" color="#00d4ff" />
              <StatCard icon="🚀" label="ACCELERATION" value={currentCar.acceleration} unit="HP" color="#00ff88" />
            </div>

            {/* Indicator dots */}
            <div style={dotsContainerStyle}>
              {cars.map((car, i) => (
                <div
                  key={i}
                  onClick={() => selectCar(i)}
                  style={dotStyle(i === selectedCar, currentCar.color)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>

          <button onClick={goNext} style={arrowBtnStyle} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            ►
          </button>
        </div>

        {/* Action buttons */}
        <div style={actionBtnsStyle}>
          <button 
            onClick={handleBack} 
            style={backBtnStyle}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ← BACK TO HOME
          </button>
          <button 
            onClick={handleStartRace} 
            style={raceBtnStyle(currentCar.color)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>▶</span>
            START RACE
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Stat Card component ───────────────────────────────────── */
function StatCard({ icon, label, value, unit, color }) {
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={statLabelStyle}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.3rem' }}>
        <span style={{ ...statValueStyle, color }}>{value}</span>
        <span style={statUnitStyle}>{unit}</span>
      </div>
    </div>
  )
}

/* ── Styles ────────────────────────────────────────────────── */
const containerStyle = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  background: 'linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #0f1419 100%)',
  fontFamily: "'Orbitron', sans-serif",
  overflow: 'hidden',
}

const bgOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: `
    radial-gradient(circle at 20% 50%, rgba(52, 152, 219, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(231, 76, 60, 0.08) 0%, transparent 50%)
  `,
  animation: 'pulse 8s ease-in-out infinite',
}

const contentWrapperStyle = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
}

const headerSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  marginBottom: '0.5rem',
}

const headerLineStyle = {
  width: '80px',
  height: '2px',
  background: 'linear-gradient(90deg, transparent, #3498db, transparent)',
}

const titleStyle = {
  fontSize: '3rem',
  color: '#fff',
  fontWeight: 900,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  textShadow: `
    0 0 20px rgba(52, 152, 219, 0.5),
    0 0 40px rgba(52, 152, 219, 0.3),
    0 4px 8px rgba(0, 0, 0, 0.5)
  `,
}

const subtitleStyle = {
  color: '#888',
  fontFamily: "'Rajdhani', sans-serif",
  marginBottom: '2.5rem',
  fontSize: '0.9rem',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  opacity: 0.7,
}

const showcaseAreaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '3rem',
  maxWidth: '1200px',
  width: '100%',
}

const glassPanelStyle = {
  flex: 1,
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '24px',
  padding: '2.5rem',
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1)
  `,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const canvasContainerStyle = {
  position: 'relative',
  width: '100%',
  height: '380px',
  borderRadius: '16px',
  overflow: 'hidden',
  marginBottom: '1.5rem',
  background: 'radial-gradient(ellipse at center, rgba(30, 30, 60, 0.4) 0%, rgba(10, 10, 20, 0.8) 70%)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.6)',
}

const platformGlowStyle = (color) => ({
  position: 'absolute',
  bottom: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '40%',
  height: '8px',
  background: `radial-gradient(ellipse, ${color}66 0%, transparent 70%)`,
  filter: 'blur(15px)',
  zIndex: 0,
})

const infoBadgeStyle = (color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '0.5rem',
  padding: '0.8rem 2rem',
  background: `linear-gradient(135deg, ${color}22, ${color}11)`,
  border: `1px solid ${color}44`,
  borderRadius: '50px',
  boxShadow: `0 0 20px ${color}33`,
})

const carNameStyle = {
  fontSize: '2rem',
  color: '#fff',
  fontWeight: 900,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  margin: 0,
}

const modelNumberStyle = {
  fontSize: '0.75rem',
  color: '#888',
  letterSpacing: '0.2em',
  fontFamily: "'Rajdhani', sans-serif",
}

const carDescStyle = {
  color: '#bbb',
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: '1rem',
  marginBottom: '2rem',
  fontStyle: 'italic',
  textAlign: 'center',
  opacity: 0.8,
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '1.5rem',
  width: '100%',
  marginBottom: '2rem',
}

const statCardStyle = {
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '1.2rem',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  cursor: 'default',
}

const statLabelStyle = {
  fontSize: '0.65rem',
  color: '#888',
  letterSpacing: '0.15em',
  marginBottom: '0.5rem',
  fontWeight: 600,
}

const statValueStyle = {
  fontSize: '2rem',
  fontWeight: 900,
  letterSpacing: '-0.02em',
}

const statUnitStyle = {
  fontSize: '0.85rem',
  color: '#666',
  fontWeight: 500,
}

const dotsContainerStyle = {
  display: 'flex',
  gap: '0.7rem',
  alignItems: 'center',
}

const dotStyle = (isActive, color) => ({
  width: isActive ? '14px' : '10px',
  height: isActive ? '14px' : '10px',
  borderRadius: '50%',
  background: isActive ? color : '#333',
  border: isActive ? `2px solid ${color}` : '2px solid transparent',
  boxShadow: isActive ? `0 0 12px ${color}88` : 'none',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
})

const arrowBtnStyle = {
  fontSize: '2rem',
  color: '#fff',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '50%',
  width: '80px',
  height: '80px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: "'Orbitron', sans-serif",
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const actionBtnsStyle = {
  display: 'flex',
  gap: '1.5rem',
  marginTop: '2.5rem',
}

const backBtnStyle = {
  padding: '1rem 2.5rem',
  fontSize: '0.95rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 600,
  color: '#aaa',
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  cursor: 'pointer',
  letterSpacing: '0.1em',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
}

const raceBtnStyle = (color) => ({
  padding: '1rem 3rem',
  fontSize: '1.1rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  color: '#fff',
  background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
  border: `2px solid ${color}`,
  borderRadius: '12px',
  cursor: 'pointer',
  letterSpacing: '0.1em',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  boxShadow: `
    0 4px 20px ${color}66,
    0 0 40px ${color}33
  `,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})
