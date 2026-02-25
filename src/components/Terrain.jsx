import { useMemo } from 'react'
import { Sky } from '@react-three/drei'

/* ── Simple tree from primitives ─────────────────────────── */
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[1.8, 2.5, 8]} />
        <meshStandardMaterial color="#1a5c1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[1.3, 2, 8]} />
        <meshStandardMaterial color="#227722" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.3, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#2a8a2a" roughness={0.8} />
      </mesh>
    </group>
  )
}

export default function Terrain() {
  /* Seeded pseudo-random so trees are deterministic */
  const trees = useMemo(() => {
    let seed = 42
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    const result = []
    // Outside the track
    for (let i = 0; i < 80; i++) {
      const a = rand() * Math.PI * 2
      const d = 95 + rand() * 120
      result.push({ pos: [Math.cos(a) * d, 0, Math.sin(a) * d], s: 0.6 + rand() })
    }
    // Inside the track
    for (let i = 0; i < 25; i++) {
      const a = rand() * Math.PI * 2
      const d = 5 + rand() * 42
      result.push({ pos: [Math.cos(a) * d, 0, Math.sin(a) * d], s: 0.5 + rand() * 0.7 })
    }
    return result
  }, [])

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#2d5a27" roughness={1} />
      </mesh>

      {/* Inner grass (different shade) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[50, 64]} />
        <meshStandardMaterial color="#357a2e" roughness={1} />
      </mesh>

      {/* Trees */}
      {trees.map((t, i) => (
        <Tree key={i} position={t.pos} scale={t.s} />
      ))}

      {/* Sky */}
      <Sky distance={450000} sunPosition={[50, 80, 30]} inclination={0.6} azimuth={0.25} />

      {/* Fog */}
      <fog attach="fog" args={['#b0c4de', 150, 400]} />
    </>
  )
}
