import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../store'
import {
  ROAD_W, HW, CURB_W, SW_W, WALL_D, WALL_H, SAMPLES,
  setActiveLevel, getActiveTrack,
  makeCurve, sampleFrames, nearestTrackInfo,
} from '../trackData'

/* ═══════════════════════════════════════════════════════════════
   FORMULA-STYLE GRAND PRIX CIRCUIT  (visuals only)
   Collision is handled in Car.jsx via shared trackData.
   ═══════════════════════════════════════════════════════════════ */

// ────────────────────────────────────────────────────────────
//  Geometry builders
// ────────────────────────────────────────────────────────────
function flatStrip(frames, width, y) {
  const hw = width / 2, len = frames.length
  const pos = new Float32Array(len * 6)
  const idx = []
  for (let i = 0; i < len; i++) {
    const { p, nm } = frames[i]
    const j = i * 6
    pos[j]     = p.x + nm.x * hw; pos[j+1] = y; pos[j+2] = p.z + nm.z * hw
    pos[j+3] = p.x - nm.x * hw; pos[j+4] = y; pos[j+5] = p.z - nm.z * hw
    const nx = (i + 1) % len
    idx.push(i*2, nx*2, i*2+1, i*2+1, nx*2, nx*2+1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(idx); g.computeVertexNormals()
  return g
}

function ringStrip(frames, iOff, oOff, y) {
  const len = frames.length
  const pos = new Float32Array(len * 6)
  const idx = []
  for (let i = 0; i < len; i++) {
    const { p, nm } = frames[i]
    const j = i * 6
    pos[j]     = p.x + nm.x * oOff; pos[j+1] = y; pos[j+2] = p.z + nm.z * oOff
    pos[j+3] = p.x + nm.x * iOff; pos[j+4] = y; pos[j+5] = p.z + nm.z * iOff
    const nx = (i + 1) % len
    idx.push(i*2, nx*2, i*2+1, i*2+1, nx*2, nx*2+1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(idx); g.computeVertexNormals()
  return g
}

function wallGeo(frames, off, h) {
  const len = frames.length
  const pos = new Float32Array(len * 6)
  const idx = []
  for (let i = 0; i < len; i++) {
    const { p, nm } = frames[i]
    const x = p.x + nm.x * off, z = p.z + nm.z * off
    const j = i * 6
    pos[j] = x; pos[j+1] = 0; pos[j+2] = z
    pos[j+3] = x; pos[j+4] = h; pos[j+5] = z
    const nx = (i + 1) % len
    idx.push(i*2, nx*2, i*2+1, i*2+1, nx*2, nx*2+1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(idx); g.computeVertexNormals()
  return g
}

// ── PRNG ───────────────────────────────────────────────────
function prng(s) {
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

// ────────────────────────────────────────────────────────────
//  Building generator — validates against ALL track points
// ────────────────────────────────────────────────────────────
function genBuildings(frames, levelSeed) {
  const r = prng(42 + (levelSeed || 0) * 7)
  const list = []
  const PAL = [
    '#5c6b7a','#4a5968','#6e7f90','#38485a','#8494a4',
    '#3e5060','#7a8a9a','#90a0b0','#4d6070','#2e3e50',
  ]
  const ACCENT = ['#ff4466','#00ccff','#ffaa00','#44ff88','#cc66ff','#ff6622']
  const GLASS  = ['#88bbdd','#6699bb','#aaccdd','#7799aa']

  const MIN_CLEARANCE = WALL_D + 15

  function isSafe(bx, bz, bw, bd) {
    const halfW = bw / 2 + 2
    const halfD = bd / 2 + 2
    
    // Check center and corners
    const checkPoints = [
      [bx, bz],
      [bx - halfW, bz - halfD],
      [bx + halfW, bz - halfD],
      [bx - halfW, bz + halfD],
      [bx + halfW, bz + halfD],
    ]
    
    // Add edge midpoints for better coverage
    checkPoints.push(
      [bx - halfW, bz],
      [bx + halfW, bz],
      [bx, bz - halfD],
      [bx, bz + halfD]
    )
    
    for (const [cx, cz] of checkPoints) {
      const info = nearestTrackInfo(cx, cz)
      if (Math.abs(info.signedDist) < MIN_CLEARANCE) return false
    }
    return true
  }

  const step = Math.floor(frames.length / 50)

  for (let i = 0; i < frames.length; i += step + Math.floor(r() * step * 0.4)) {
    const f = frames[i % frames.length]

    const d1 = WALL_D + 8 + r() * 28
    const bx1 = f.p.x - f.nm.x * d1
    const bz1 = f.p.z - f.nm.z * d1
    const w1 = 6 + r() * 14, d1b = 6 + r() * 14
    if (isSafe(bx1, bz1, w1, d1b)) {
      const h = 10 + r() * 55
      list.push({
        x: bx1, z: bz1,
        w: w1, h, d: d1b,
        c: PAL[Math.floor(r() * PAL.length)],
        glass: GLASS[Math.floor(r() * GLASS.length)],
        accent: ACCENT[Math.floor(r() * ACCENT.length)],
        win: true,
        antenna: h > 35 && r() > 0.4,
        roofLight: h > 25,
        neonStrip: r() > 0.5,
        acUnits: r() > 0.6,
        billboard: h > 40 && r() > 0.6,
      })
    }

    if (r() > 0.65) {
      const d2 = WALL_D + 8 + r() * 18
      const bx2 = f.p.x + f.nm.x * d2
      const bz2 = f.p.z + f.nm.z * d2
      const w2 = 5 + r() * 10, d2b = 5 + r() * 10
      if (isSafe(bx2, bz2, w2, d2b)) {
        const h = 8 + r() * 30
        list.push({
          x: bx2, z: bz2,
          w: w2, h, d: d2b,
          c: PAL[Math.floor(r() * PAL.length)],
          glass: GLASS[Math.floor(r() * GLASS.length)],
          accent: ACCENT[Math.floor(r() * ACCENT.length)],
          win: r() > 0.3,
          antenna: h > 30 && r() > 0.5,
          roofLight: h > 20,
          neonStrip: r() > 0.55,
          acUnits: r() > 0.7,
          billboard: false,
        })
      }
    }
  }
  return list
}

// ── Day/night cycle helper (same constant as Lighting.jsx) ─
const CYCLE_DUR = 90
const TWO_PI = Math.PI * 2

// ── Sub-components ─────────────────────────────────────────

/* ── Cinematic Building ─────────────────────────────────────── */
function Bld({ b, winMat, neonMat }) {
  const rows = Math.floor(b.h / 4.5)
  const winCols = Math.max(1, Math.floor(b.w / 3))

  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main body */}
      <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial color={b.c} roughness={0.82} metalness={0.05} />
      </mesh>

      {/* Glass facade stripe */}
      <mesh position={[0, b.h * 0.55, b.d / 2 + 0.03]}>
        <planeGeometry args={[b.w * 0.92, b.h * 0.35]} />
        <meshStandardMaterial color={b.glass} metalness={0.4} roughness={0.15}
          transparent opacity={0.35} />
      </mesh>

      {/* Roof cap */}
      <mesh position={[0, b.h + 0.1, 0]}>
        <boxGeometry args={[b.w + 0.3, 0.25, b.d + 0.3]} />
        <meshStandardMaterial color="#222" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Lobby / base accent */}
      <mesh position={[0, 1.2, b.d / 2 + 0.03]}>
        <planeGeometry args={[b.w * 0.95, 2.2]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* ── Windows on front face ─────────────────────────── */}
      {b.win && rows > 0 && Array.from({ length: rows }, (_, r) =>
        Array.from({ length: winCols }, (_, c) => (
          <mesh key={`wf${r}_${c}`}
            position={[
              -b.w * 0.4 + c * (b.w * 0.8 / winCols) + (b.w * 0.4 / winCols),
              2.5 + r * 4.5,
              b.d / 2 + 0.04,
            ]}
          >
            <planeGeometry args={[b.w * 0.6 / winCols, 1.2]} />
            {winMat ? <primitive object={winMat} attach="material" /> :
              <meshStandardMaterial color="#ffeeaa" emissive="#ffeeaa"
                emissiveIntensity={0.2} transparent opacity={0.5} />}
          </mesh>
        ))
      ).flat()}

      {/* ── Windows on side face ──────────────────────────── */}
      {b.win && rows > 0 && Array.from({ length: rows }, (_, r) => (
        <mesh key={`ws${r}`}
          position={[b.w / 2 + 0.04, 2.5 + r * 4.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[b.d * 0.5, 1.2]} />
          {winMat ? <primitive object={winMat} attach="material" /> :
            <meshStandardMaterial color="#ffeeaa" emissive="#ffeeaa"
              emissiveIntensity={0.2} transparent opacity={0.5} />}
        </mesh>
      ))}

      {/* ── Neon accent strip along roof edge ─────────────── */}
      {b.neonStrip && (
        <mesh position={[0, b.h - 0.2, b.d / 2 + 0.06]}>
          <planeGeometry args={[b.w * 0.9, 0.18]} />
          {neonMat ? <primitive object={neonMat} attach="material" /> :
            <meshStandardMaterial color={b.accent} emissive={b.accent}
              emissiveIntensity={1.5} />}
        </mesh>
      )}

      {/* ── Antenna / Mast ────────────────────────────────── */}
      {b.antenna && (
        <group position={[b.w * 0.3, b.h, b.d * 0.2]}>
          <mesh position={[0, 4, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.08, 8, 5]} />
            <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Blinking red light at top */}
          <mesh position={[0, 8.2, 0]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={2} />
          </mesh>
        </group>
      )}

      {/* ── Rooftop light ─────────────────────────────────── */}
      {b.roofLight && (
        <pointLight
          position={[0, b.h + 1.5, 0]}
          intensity={0.15} distance={b.h * 0.8} color="#ffeedd"
        />
      )}

      {/* ── AC units on side ──────────────────────────────── */}
      {b.acUnits && Array.from({ length: Math.min(3, Math.floor(b.h / 15)) }, (_, i) => (
        <mesh key={`ac${i}`}
          position={[-b.w / 2 - 0.4, 5 + i * 12, b.d * 0.2]}
          castShadow
        >
          <boxGeometry args={[0.7, 0.5, 0.8]} />
          <meshStandardMaterial color="#aaa" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* ── Billboard on tall buildings ───────────────────── */}
      {b.billboard && (
        <group position={[0, b.h * 0.7, b.d / 2 + 0.15]}>
          <mesh>
            <planeGeometry args={[b.w * 0.7, b.h * 0.12]} />
            <meshStandardMaterial color={b.accent} emissive={b.accent}
              emissiveIntensity={0.8} />
          </mesh>
          {/* Frame */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[b.w * 0.72, b.h * 0.13, 0.08]} />
            <meshStandardMaterial color="#222" metalness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/* ── Streetlight (self-contained day/night reaction) ──────── */
function Lamp({ pos }) {
  const bulbMatRef = useRef()
  const lightRef   = useRef()

  useFrame(({ clock }) => {
    const t    = (clock.getElapsedTime() / CYCLE_DUR) % 1
    const dayF = THREE.MathUtils.clamp(Math.sin(t * TWO_PI) * 1.3 + 0.15, 0, 1)
    const nf   = 1 - dayF
    const glow = nf > 0.3
    if (bulbMatRef.current) {
      bulbMatRef.current.emissive.set(glow ? '#ffd060' : '#221800')
      bulbMatRef.current.emissiveIntensity = glow
        ? THREE.MathUtils.lerp(0.1, 1.2, (nf - 0.3) / 0.7)
        : 0.04
    }
    if (lightRef.current) {
      lightRef.current.intensity = glow
        ? THREE.MathUtils.lerp(0, 1.2, (nf - 0.3) / 0.7)
        : 0
    }
  })

  return (
    <group position={pos}>
      {/* Pole */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 7, 6]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.6, 7.1, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <cylinderGeometry args={[0.045, 0.045, 1.3, 5]} />
        <meshStandardMaterial color="#555" metalness={0.8} />
      </mesh>
      {/* Lamp head housing */}
      <mesh position={[1.1, 7.4, 0]}>
        <boxGeometry args={[0.55, 0.22, 0.55]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Bulb */}
      <mesh position={[1.1, 7.28, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial ref={bulbMatRef} color="#ffe8a0"
          emissive="#221800" emissiveIntensity={0.04} />
      </mesh>
      {/* Light source */}
      <pointLight ref={lightRef}
        position={[1.1, 7.1, 0]}
        intensity={0} distance={40} color="#ffd580" />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN TRACK COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Track() {
  const selectedLevel = useGameStore((s) => s.selectedLevel)

  // Activate the correct level's track data
  setActiveLevel(selectedLevel)

  const curve  = useMemo(() => { setActiveLevel(selectedLevel); return makeCurve() }, [selectedLevel])
  const frames = useMemo(() => sampleFrames(curve, SAMPLES), [curve])

  // ── Shared materials that respond to day/night ──────────
  const winMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffeeaa', emissive: '#ffeeaa', emissiveIntensity: 0.2,
    transparent: true, opacity: 0.5,
  }), [])
  const neonMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00ccff', emissive: '#00ccff', emissiveIntensity: 1.5,
  }), [])
  const nightFRef = useRef(0)

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() / CYCLE_DUR) % 1
    const dayF = THREE.MathUtils.clamp(Math.sin(t * TWO_PI) * 1.3 + 0.15, 0, 1)
    const nf = 1 - dayF  // night factor

    nightFRef.current = nf

    // Windows glow brighter at night
    winMat.emissiveIntensity = THREE.MathUtils.lerp(0.05, 0.8, nf)
    winMat.opacity = THREE.MathUtils.lerp(0.25, 0.75, nf)

    // Neon strips pulse at night
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.3
    neonMat.emissiveIntensity = nf > 0.3 ? 1.5 * pulse : 0.15
  })

  const roadG   = useMemo(() => flatStrip(frames, ROAD_W, 0.01), [frames])
  const innerSW = useMemo(() => ringStrip(frames, HW, HW + SW_W, 0.05), [frames])
  const outerSW = useMemo(() => ringStrip(frames, -(HW + SW_W), -HW, 0.05), [frames])
  const innerW  = useMemo(() => wallGeo(frames, WALL_D, WALL_H), [frames])
  const outerW  = useMemo(() => wallGeo(frames, -WALL_D, WALL_H), [frames])

  const dashes = useMemo(() => {
    const arr = []
    for (let i = 0; i < frames.length; i += 8)
      if (Math.floor(i / 8) % 2 === 0) {
        const f = frames[i]
        arr.push({ x: f.p.x, z: f.p.z, ry: f.ry })
      }
    return arr
  }, [frames])

  const kerbs = useMemo(() => {
    const arr = []
    for (let i = 0; i < frames.length; i += 6) {
      const f  = frames[i]
      const red = Math.floor(i / 6) % 2 === 0
      arr.push({
        x: f.p.x + f.nm.x * (HW - CURB_W / 2),
        z: f.p.z + f.nm.z * (HW - CURB_W / 2),
        ry: f.ry, red,
      })
      arr.push({
        x: f.p.x - f.nm.x * (HW - CURB_W / 2),
        z: f.p.z - f.nm.z * (HW - CURB_W / 2),
        ry: f.ry, red,
      })
    }
    return arr
  }, [frames])

  const sfIdx = useMemo(() => {
    const track = getActiveTrack()
    let best = 0, bestD = Infinity
    frames.forEach((f, i) => {
      const d = (f.p.x - track.sfX) ** 2 + f.p.z ** 2
      if (d < bestD) { bestD = d; best = i }
    })
    return best
  }, [frames])
  const sf = frames[sfIdx]

  const lamps = useMemo(() => {
    const arr = []
    const step = Math.floor(frames.length / 24)
    for (let i = 0; i < frames.length; i += step) {
      const f = frames[i]
      arr.push([
        f.p.x - f.nm.x * (WALL_D + 2),
        0,
        f.p.z - f.nm.z * (WALL_D + 2),
      ])
    }
    return arr
  }, [frames])

  const blds = useMemo(() => genBuildings(frames, selectedLevel), [frames, selectedLevel])

  const checks = useMemo(() => {
    const cells = []
    const cols = 8, rows = 4
    const cw = ROAD_W / cols, ch = 1.4
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++)
        if ((c + r) % 2 === 0) {
          const nOff = -HW + c * cw + cw / 2
          const tOff = -(rows * ch) / 2 + r * ch + ch / 2
          cells.push({
            x: sf.p.x + sf.nm.x * nOff + sf.tg.x * tOff,
            z: sf.p.z + sf.nm.z * nOff + sf.tg.z * tOff,
            w: cw, h: ch,
          })
        }
    return cells
  }, [sf])

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#1a3210" roughness={1} />
      </mesh>

      {/* Road */}
      <mesh geometry={roadG} receiveShadow>
        <meshStandardMaterial color="#2a2a2a" roughness={0.92} />
      </mesh>

      {/* Sidewalks */}
      <mesh geometry={innerSW} receiveShadow>
        <meshStandardMaterial color="#777" roughness={0.95} />
      </mesh>
      <mesh geometry={outerSW} receiveShadow>
        <meshStandardMaterial color="#777" roughness={0.95} />
      </mesh>

      {/* Barriers */}
      <mesh geometry={innerW}>
        <meshStandardMaterial color="#b0b0b0" roughness={0.6} metalness={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={outerW}>
        <meshStandardMaterial color="#b0b0b0" roughness={0.6} metalness={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Centre-line dashes */}
      {dashes.map((d, i) => (
        <mesh key={`d${i}`} position={[d.x, 0.02, d.z]} rotation={[-Math.PI / 2, d.ry, 0]}>
          <planeGeometry args={[0.22, 3]} />
          <meshBasicMaterial color="white" transparent opacity={0.45} />
        </mesh>
      ))}

      {/* Kerb stripes */}
      {kerbs.map((k, i) => (
        <mesh key={`k${i}`} position={[k.x, 0.055, k.z]} rotation={[-Math.PI / 2, k.ry, 0]}>
          <planeGeometry args={[CURB_W, 2.4]} />
          <meshBasicMaterial color={k.red ? '#cc2200' : '#ffffff'} />
        </mesh>
      ))}

      {/* Start / Finish white base */}
      <mesh position={[sf.p.x, 0.02, sf.p.z]} rotation={[-Math.PI / 2, sf.ry, 0]}>
        <planeGeometry args={[ROAD_W + 0.5, 6]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Checkerboard */}
      {checks.map((c, i) => (
        <mesh key={`sf${i}`} position={[c.x, 0.025, c.z]} rotation={[-Math.PI / 2, sf.ry, 0]}>
          <planeGeometry args={[c.w, c.h]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      ))}

      {/* Start gantry */}
      <group position={[sf.p.x, 0, sf.p.z]} rotation={[0, sf.ry, 0]}>
        <mesh position={[-(HW + 0.6), 4.5, 0]} castShadow>
          <boxGeometry args={[0.5, 9, 0.5]} />
          <meshStandardMaterial color="#dd2222" />
        </mesh>
        <mesh position={[(HW + 0.6), 4.5, 0]} castShadow>
          <boxGeometry args={[0.5, 9, 0.5]} />
          <meshStandardMaterial color="#dd2222" />
        </mesh>
        <mesh position={[0, 9.1, 0]} castShadow>
          <boxGeometry args={[ROAD_W + 1.8, 0.7, 0.9]} />
          <meshStandardMaterial color="#dd2222" />
        </mesh>
        <mesh position={[0, 9.1, 0.5]}>
          <planeGeometry args={[6, 0.5]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>

      {/* Grandstand */}
      <group
        position={[
          sf.p.x - sf.nm.x * (WALL_D + 10), 0,
          sf.p.z - sf.nm.z * (WALL_D + 10),
        ]}
        rotation={[0, sf.ry, 0]}
      >
        {[0, 1, 2, 3].map(row => (
          <mesh key={row} position={[row * 2.5, row * 1.5 + 0.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 1.5, 50]} />
            <meshStandardMaterial color={row % 2 === 0 ? '#334' : '#445'} />
          </mesh>
        ))}
        <mesh position={[5, 7.5, 0]} castShadow>
          <boxGeometry args={[12, 0.3, 52]} />
          <meshStandardMaterial color="#555" metalness={0.5} />
        </mesh>
      </group>

      {/* Pit-lane building */}
      <group
        position={[
          sf.p.x + sf.nm.x * (WALL_D + 6), 2.5,
          sf.p.z + sf.nm.z * (WALL_D + 6),
        ]}
        rotation={[0, sf.ry, 0]}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 5, 60]} />
          <meshStandardMaterial color="#4a5568" roughness={0.7} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[-(8 / 2 + 0.02), 0.5, -25 + i * 5.5]}>
            <planeGeometry args={[4, 2]} />
            <meshStandardMaterial color="#aaddff" emissive="#aaddff"
              emissiveIntensity={0.15} transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* Streetlights */}
      {lamps.map((pos, i) => <Lamp key={`l${i}`} pos={pos} />)}

      {/* Buildings */}
      {blds.map((b, i) => <Bld key={`b${i}`} b={b} winMat={winMat} neonMat={neonMat} />)}

      {/* Decorative trees inside the circuit */}
      {useMemo(() => {
        const r = prng(99 + selectedLevel)
        // Compute track bounding box centre for tree placement
        const xs = frames.map(f => f.p.x), zs = frames.map(f => f.p.z)
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2
        const cz = (Math.min(...zs) + Math.max(...zs)) / 2
        const rx = (Math.max(...xs) - Math.min(...xs)) / 3
        const rz = (Math.max(...zs) - Math.min(...zs)) / 3
        return Array.from({ length: 20 }, (_, i) => {
          const angle = (i / 20) * Math.PI * 2
          const px = cx + (rx * 0.2 + r() * rx * 0.6) * Math.cos(angle)
          const pz = cz + (rz * 0.2 + r() * rz * 0.6) * Math.sin(angle)
          const h  = 3 + r() * 4
          // Skip if too close to the track
          const info = nearestTrackInfo(px, pz)
          if (Math.abs(info.signedDist) < WALL_D + 4) return null
          return (
            <group key={`t${i}`} position={[px, 0, pz]}>
              <mesh position={[0, h / 2, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.18, h, 6]} />
                <meshStandardMaterial color="#5a3a1a" />
              </mesh>
              <mesh position={[0, h + 1, 0]} castShadow>
                <sphereGeometry args={[1 + r() * 0.8, 8, 8]} />
                <meshStandardMaterial color={`hsl(${100 + r() * 40}, 50%, ${22 + r() * 12}%)`} />
              </mesh>
            </group>
          )
        })
      }, [frames, selectedLevel])}
    </group>
  )
}
