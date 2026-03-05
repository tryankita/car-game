import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Day / Night cycle constants ────────────────────────────── */
export const CYCLE_DURATION = 90   // seconds for a full day + night
const TWO_PI = Math.PI * 2

// Shared night factor — written here, read by Lamp / CarLights
export const nightFactorRef = { current: 0.85 }

// Color helpers
const dayAmbient   = new THREE.Color('#e8e0d4')
const nightAmbient = new THREE.Color('#0a0a1a')
const daySky       = new THREE.Color('#87ceeb')
const nightSky     = new THREE.Color('#060612')
const dayGround    = new THREE.Color('#2d5a27')
const nightGround  = new THREE.Color('#0a120a')
const daySun       = new THREE.Color('#fff5e0')
const nightSun     = new THREE.Color('#334')

const tmpA = new THREE.Color()
const tmpB = new THREE.Color()

export default function Lighting() {
  const dirRef  = useRef()
  const ambRef  = useRef()
  const hemiRef = useRef()

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() / CYCLE_DURATION) % 1  // 0 → 1
    const sunAngle = t * TWO_PI

    // Sun position — orbit
    const sunY = Math.sin(sunAngle) * 120
    const sunX = Math.cos(sunAngle) * 80
    const sunZ = 50

    // Day factor: 1 at noon, 0 at midnight, smooth
    const dayF = THREE.MathUtils.clamp(Math.sin(sunAngle) * 1.3 + 0.15, 0, 1)
    nightFactorRef.current = 1 - dayF

    if (dirRef.current) {
      dirRef.current.position.set(sunX, Math.max(sunY, 5), sunZ)
      dirRef.current.intensity = THREE.MathUtils.lerp(0.08, 1.6, dayF)
      dirRef.current.color.copy(tmpA.copy(nightSun).lerp(daySun, dayF))
    }
    if (ambRef.current) {
      ambRef.current.intensity = THREE.MathUtils.lerp(0.12, 0.45, dayF)
      ambRef.current.color.copy(tmpA.copy(nightAmbient).lerp(dayAmbient, dayF))
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.15, 0.55, dayF)
      hemiRef.current.color.copy(tmpA.copy(nightSky).lerp(daySky, dayF))
      hemiRef.current.groundColor.copy(tmpB.copy(nightGround).lerp(dayGround, dayF))
    }
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.4} />
      <hemisphereLight ref={hemiRef} args={['#87ceeb', '#2d5a27', 0.5]} />
      <directionalLight
        ref={dirRef}
        position={[80, 120, 50]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={500}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={300}
        shadow-camera-bottom={-250}
      />
    </>
  )
}
