import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'

const CYCLE_DURATION = 90
const TWO_PI = Math.PI * 2

const dayFog   = new THREE.Color('#b0c4de')
const nightFog = new THREE.Color('#050510')
const tmpF     = new THREE.Color()

export default function Terrain() {
  const skyRef = useRef()
  const { scene } = useThree()

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() / CYCLE_DURATION) % 1
    const sunAngle = t * TWO_PI
    const dayF = THREE.MathUtils.clamp(Math.sin(sunAngle) * 1.3 + 0.15, 0, 1)

    // Animate sky sun position
    if (skyRef.current) {
      const sunY = Math.sin(sunAngle) * 120
      const sunX = Math.cos(sunAngle) * 50
      skyRef.current.material.uniforms.sunPosition.value.set(sunX, Math.max(sunY, -20), 30)
    }

    // Animate fog color
    if (scene.fog) {
      scene.fog.color.copy(tmpF.copy(nightFog).lerp(dayFog, dayF))
      scene.fog.near = THREE.MathUtils.lerp(80, 350, dayF)
      scene.fog.far  = THREE.MathUtils.lerp(400, 900, dayF)
    }
  })

  return (
    <>
      <Sky ref={skyRef} distance={450000} sunPosition={[50, 80, 30]}
        inclination={0.6} azimuth={0.25} />
      <fog attach="fog" args={['#b0c4de', 350, 900]} />
    </>
  )
}

