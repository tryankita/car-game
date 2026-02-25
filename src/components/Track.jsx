import { useMemo } from 'react'
import * as THREE from 'three'

export default function Track() {
  /* ── Road surface (ring) ───────────────────────────────── */
  const roadGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, 90, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(0, 0, 50, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    return new THREE.ShapeGeometry(shape, 128)
  }, [])

  /* ── Curbs ─────────────────────────────────────────────── */
  const innerCurbGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.absarc(0, 0, 52, 0, Math.PI * 2, false)
    const h = new THREE.Path()
    h.absarc(0, 0, 50, 0, Math.PI * 2, true)
    s.holes.push(h)
    return new THREE.ShapeGeometry(s, 128)
  }, [])

  const outerCurbGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.absarc(0, 0, 90, 0, Math.PI * 2, false)
    const h = new THREE.Path()
    h.absarc(0, 0, 88, 0, Math.PI * 2, true)
    s.holes.push(h)
    return new THREE.ShapeGeometry(s, 128)
  }, [])

  /* ── Dashed centre line ────────────────────────────────── */
  const dashes = useMemo(() => {
    const arr = []
    const dashCount = 40
    for (let i = 0; i < dashCount; i += 2) {
      const a = (i / dashCount) * Math.PI * 2
      arr.push(a)
    }
    return arr
  }, [])

  /* ── Checkered start / finish ──────────────────────────── */
  const checkers = useMemo(() => {
    const cells = []
    const cols = 10
    const rows = 3
    const cellW = 4
    const cellH = 1
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if ((c + r) % 2 === 0) {
          cells.push({
            x: 50 + c * cellW + cellW / 2,
            z: -1.5 + r * cellH + cellH / 2,
          })
        }
      }
    }
    return cells
  }, [])

  return (
    <group>
      {/* Road */}
      <mesh geometry={roadGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <meshStandardMaterial color="#333" roughness={0.85} />
      </mesh>

      {/* Inner curb */}
      <mesh geometry={innerCurbGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <meshStandardMaterial color="#cc0000" />
      </mesh>

      {/* Outer curb */}
      <mesh geometry={outerCurbGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <meshStandardMaterial color="#cc0000" />
      </mesh>

      {/* Centre dashes */}
      {dashes.map((angle, i) => (
        <group
          key={i}
          position={[70 * Math.cos(angle), 0.04, 70 * Math.sin(angle)]}
          rotation={[0, -angle + Math.PI / 2, 0]}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[5.5, 0.4]} />
            <meshStandardMaterial color="white" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Start / Finish — white base */}
      <mesh position={[70, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 3]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Start / Finish — black checkers */}
      {checkers.map((c, i) => (
        <mesh key={i} position={[c.x, 0.05, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4, 1]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
    </group>
  )
}
