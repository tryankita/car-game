import React, { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import useGameStore from './store'
import audioManager from './audioManager'
import Car from './components/Car'
import Track from './components/Track'
import Terrain from './components/Terrain'
import Lighting from './components/Lighting'
import Home from './components/UI/Home'
import Garage from './components/UI/Garage'
import HUD from './components/UI/HUD'

function GameScene() {
  const setCountdown = useGameStore((s) => s.setCountdown)
  const setRaceStarted = useGameStore((s) => s.setRaceStarted)

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
      <Canvas shadows camera={{ position: [85, 15, -20], fov: 55 }}>
        <Lighting />
        <Track />
        <Terrain />
        <Car />
      </Canvas>
      <HUD />
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

export default function App() {
  const screen = useGameStore((s) => s.screen)

  // Play appropriate music for each screen
  useEffect(() => {
    if (screen === 'home' || screen === 'garage') {
      audioManager.playMenuMusic()
    }
  }, [screen])

  if (screen === 'home') return <><Home /><MusicToggle /></>
  if (screen === 'garage') return <><Garage /><MusicToggle /></>
  return <GameScene />
}
