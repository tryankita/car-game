import React, { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import useGameStore from './store'
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
    </div>
  )
}

export default function App() {
  const screen = useGameStore((s) => s.screen)
  if (screen === 'home') return <Home />
  if (screen === 'garage') return <Garage />
  return <GameScene />
}
