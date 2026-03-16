import { useEffect, useState, Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import useGameStore from '../store'
import audioManager from '../audioManager'

const HUD = lazy(() => import('./UI/HUDPhoto'))
const RaceFinish = lazy(() => import('./UI/RaceFinish'))
const Car = lazy(() => import('./Car'))
const Track = lazy(() => import('./Track'))
const Terrain = lazy(() => import('./Terrain'))
const Lighting = lazy(() => import('./Lighting'))

export default function GameScene() {
  const setCountdown = useGameStore((s) => s.setCountdown)
  const setRaceStarted = useGameStore((s) => s.setRaceStarted)
  const raceFinished = useGameStore((s) => s.raceFinished)
  const [isMobileDevice, setIsMobileDevice] = useState(false)

  useEffect(() => {
    const updateDeviceTier = () => {
      const hasTouch = ('ontouchstart' in window) || ((navigator.maxTouchPoints || 0) > 0)
      const smallSide = Math.min(window.innerWidth, window.innerHeight)
      setIsMobileDevice(hasTouch && smallSide <= 1024)
    }

    updateDeviceTier()
    window.addEventListener('resize', updateDeviceTier)
    window.addEventListener('orientationchange', updateDeviceTier)
    return () => {
      window.removeEventListener('resize', updateDeviceTier)
      window.removeEventListener('orientationchange', updateDeviceTier)
    }
  }, [])

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
      <Canvas
        shadows={!isMobileDevice}
        dpr={isMobileDevice ? [1, 1.25] : [1, 2]}
        camera={{ position: [155, 12, -20], fov: 60 }}
        gl={{ antialias: !isMobileDevice, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#87ceeb']} />
        <Suspense fallback={null}>
          <Lighting lowQuality={isMobileDevice} />
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
    </div>
  )
}
