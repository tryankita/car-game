import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
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

// ── Procedural asphalt texture ─────────────────────────────
function makeAsphaltTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')

  // Base dark grey asphalt
  ctx.fillStyle = '#1c1c1c'
  ctx.fillRect(0, 0, size, size)

  // Noise grain — random light/dark pixels to simulate aggregate
  const imgData = ctx.getImageData(0, 0, size, size)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22
    d[i]     = Math.max(0, Math.min(255, d[i]     + noise))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise))
  }
  ctx.putImageData(imgData, 0, 0)

  // Subtle tire marks (long faint dark streaks along V axis)
  ctx.globalAlpha = 0.12
  ctx.strokeStyle = '#0a0a0a'
  ctx.lineWidth = 3
  for (let t = 0; t < 6; t++) {
    const x = 100 + Math.random() * (size - 200)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (Math.random() - 0.5) * 8, size)
    ctx.stroke()
  }
  ctx.globalAlpha = 1.0

  // Subtle patching — lighter grey rectangles
  ctx.globalAlpha = 0.06
  for (let p = 0; p < 3; p++) {
    const px = Math.random() * size
    const py = Math.random() * size
    ctx.fillStyle = '#3a3a3a'
    ctx.fillRect(px, py, 30 + Math.random() * 50, 60 + Math.random() * 120)
  }
  ctx.globalAlpha = 1.0

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  tex.anisotropy = 4
  return tex
}

// ── Procedural normal map for asphalt bumps ────────────────
function makeAsphaltNormal() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')

  // Flat normal base (128, 128, 255) = pointing up
  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, size, size)

  const imgData = ctx.getImageData(0, 0, size, size)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    d[i]     = 128 + (Math.random() - 0.5) * 18  // R = X normal
    d[i + 1] = 128 + (Math.random() - 0.5) * 18  // G = Y normal
    // B stays ~255 (pointing up)
  }
  ctx.putImageData(imgData, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  return tex
}

// ────────────────────────────────────────────────────────────
//  Geometry builders
// ────────────────────────────────────────────────────────────
function flatStrip(frames, width, y) {
  const hw = width / 2, len = frames.length
  const pos = new Float32Array(len * 6)
  const uv  = new Float32Array(len * 4)
  const idx = []
  for (let i = 0; i < len; i++) {
    const { p, nm } = frames[i]
    const j = i * 6
    pos[j]     = p.x + nm.x * hw; pos[j+1] = y; pos[j+2] = p.z + nm.z * hw
    pos[j+3] = p.x - nm.x * hw; pos[j+4] = y; pos[j+5] = p.z - nm.z * hw
    // UVs: u across road (0→1), v along track (repeats every ~20 segments)
    const v = i / 20
    uv[i * 4]     = 0; uv[i * 4 + 1] = v
    uv[i * 4 + 2] = 1; uv[i * 4 + 3] = v
    const nx = (i + 1) % len
    idx.push(i*2, nx*2, i*2+1, i*2+1, nx*2, nx*2+1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
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

  function isSafe(bx, bz, bw, bd, hintIdx) {
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
      const info = nearestTrackInfo(cx, cz, hintIdx)
      if (Math.abs(info.signedDist) < MIN_CLEARANCE) return false
    }
    return true
  }

  const step = Math.floor(frames.length / 120)

  for (let i = 0; i < frames.length; i += step + Math.floor(r() * step * 0.2)) {
    const f = frames[i % frames.length]

    // Inner side — close row
    const d1 = WALL_D + 6 + r() * 20
    const bx1 = f.p.x - f.nm.x * d1
    const bz1 = f.p.z - f.nm.z * d1
    const w1 = 6 + r() * 14, d1b = 6 + r() * 14
    if (isSafe(bx1, bz1, w1, d1b, i % frames.length)) {
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

    // Outer side — close row (always try, not gated by probability)
    const d2 = WALL_D + 6 + r() * 20
    const bx2 = f.p.x + f.nm.x * d2
    const bz2 = f.p.z + f.nm.z * d2
    const w2 = 5 + r() * 12, d2b = 5 + r() * 12
    if (isSafe(bx2, bz2, w2, d2b, i % frames.length)) {
      const h = 8 + r() * 40
      list.push({
        x: bx2, z: bz2,
        w: w2, h, d: d2b,
        c: PAL[Math.floor(r() * PAL.length)],
        glass: GLASS[Math.floor(r() * GLASS.length)],
        accent: ACCENT[Math.floor(r() * ACCENT.length)],
        win: r() > 0.2,
        antenna: h > 30 && r() > 0.5,
        roofLight: h > 20,
        neonStrip: r() > 0.55,
        acUnits: r() > 0.6,
        billboard: h > 35 && r() > 0.5,
      })
    }

    // Inner side — far row (second layer behind first)
    if (r() > 0.3) {
      const d3 = WALL_D + 30 + r() * 25
      const bx3 = f.p.x - f.nm.x * d3
      const bz3 = f.p.z - f.nm.z * d3
      const w3 = 8 + r() * 16, d3b = 8 + r() * 16
      if (isSafe(bx3, bz3, w3, d3b, i % frames.length)) {
        const h = 15 + r() * 50
        list.push({
          x: bx3, z: bz3,
          w: w3, h, d: d3b,
          c: PAL[Math.floor(r() * PAL.length)],
          glass: GLASS[Math.floor(r() * GLASS.length)],
          accent: ACCENT[Math.floor(r() * ACCENT.length)],
          win: r() > 0.3,
          antenna: h > 35 && r() > 0.4,
          roofLight: h > 25,
          neonStrip: r() > 0.5,
          acUnits: r() > 0.5,
          billboard: false,
        })
      }
    }

    // Outer side — far row
    if (r() > 0.3) {
      const d4 = WALL_D + 30 + r() * 25
      const bx4 = f.p.x + f.nm.x * d4
      const bz4 = f.p.z + f.nm.z * d4
      const w4 = 8 + r() * 16, d4b = 8 + r() * 16
      if (isSafe(bx4, bz4, w4, d4b, i % frames.length)) {
        const h = 15 + r() * 50
        list.push({
          x: bx4, z: bz4,
          w: w4, h, d: d4b,
          c: PAL[Math.floor(r() * PAL.length)],
          glass: GLASS[Math.floor(r() * GLASS.length)],
          accent: ACCENT[Math.floor(r() * ACCENT.length)],
          win: r() > 0.3,
          antenna: h > 35 && r() > 0.4,
          roofLight: h > 25,
          neonStrip: r() > 0.5,
          acUnits: r() > 0.5,
          billboard: false,
        })
      }
    }
  }
  return list
}

/* ── Shared window material (created once, reused by all buildings) ── */
const _winMat = new THREE.MeshStandardMaterial({
  color: '#c8ddf0', emissive: '#c8ddf0', emissiveIntensity: 0.05,
  transparent: true, opacity: 0.55, depthWrite: false,
})

/* ── Cinematic Building with optimized windows ─────────────────── */
function Bld({ b, neonMat }) {
  // Reduced caps: max 4 rows, 3 cols per face, only front + back faces
  const rows    = Math.min(Math.floor(b.h / 3.2), 4)
  const winCols = Math.min(Math.max(1, Math.floor(b.w / 2.5)), 3)

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

      {/* ── Windows on front face (+Z) ─────────────────────── */}
      {b.win && rows > 0 && Array.from({ length: rows }, (_, r) =>
        Array.from({ length: winCols }, (_, c) => (
          <mesh key={`wf${r}_${c}`}
            position={[
              -b.w * 0.4 + c * (b.w * 0.8 / winCols) + (b.w * 0.4 / winCols),
              2.5 + r * 3.2,
              b.d / 2 + 0.04,
            ]}
            material={_winMat}
          >
            <planeGeometry args={[b.w * 0.55 / winCols, 1.4]} />
          </mesh>
        ))
      ).flat()}

      {/* ── Windows on back face (-Z) ──────────────────────── */}
      {b.win && rows > 0 && Array.from({ length: rows }, (_, r) =>
        Array.from({ length: winCols }, (_, c) => (
          <mesh key={`wb${r}_${c}`}
            position={[
              -b.w * 0.4 + c * (b.w * 0.8 / winCols) + (b.w * 0.4 / winCols),
              2.5 + r * 3.2,
              -(b.d / 2 + 0.04),
            ]}
            rotation={[0, Math.PI, 0]}
            material={_winMat}
          >
            <planeGeometry args={[b.w * 0.55 / winCols, 1.4]} />
          </mesh>
        ))
      ).flat()}

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

      {/* Rooftop light removed — daytime scene, always 0 intensity */}

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

/* ── Streetlight — self-contained, reads nightFactorRef each frame ── */
/* Daytime-only lamp pole — no dynamic lighting (nightFactor always 0) */
function Lamp({ pos }) {
  return (
    <group position={pos}>
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 7, 6]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 7.1, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <cylinderGeometry args={[0.045, 0.045, 1.3, 5]} />
        <meshStandardMaterial color="#555" metalness={0.8} />
      </mesh>
      <mesh position={[1.1, 7.4, 0]}>
        <boxGeometry args={[0.55, 0.22, 0.55]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

/* ── Shopping Mall — wide glass-front building ─────────────── */
function ShoppingMall({ pos, ry }) {
  return (
    <group position={pos} rotation={[0, ry, 0]}>
      {/* Main body */}
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[28, 10, 18]} />
        <meshStandardMaterial color="#d4cfc8" roughness={0.7} />
      </mesh>
      {/* Glass facade front */}
      <mesh position={[0, 5.5, 9.05]}>
        <planeGeometry args={[26, 8]} />
        <meshStandardMaterial color="#88ccee" metalness={0.5} roughness={0.1}
          transparent opacity={0.6} />
      </mesh>
      {/* Glass facade back */}
      <mesh position={[0, 5.5, -9.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[26, 8]} />
        <meshStandardMaterial color="#88ccee" metalness={0.5} roughness={0.1}
          transparent opacity={0.6} />
      </mesh>
      {/* Entrance canopy */}
      <mesh position={[0, 1.8, 9.5]} castShadow>
        <boxGeometry args={[8, 0.3, 3]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 10.2, 0]}>
        <boxGeometry args={[28.4, 0.4, 18.4]} />
        <meshStandardMaterial color="#888" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Sign panel on front */}
      <mesh position={[0, 9, 9.08]}>
        <planeGeometry args={[14, 1.8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={0.6} />
      </mesh>
      {/* "MALL" white text strip */}
      <mesh position={[0, 9, 9.1]}>
        <planeGeometry args={[10, 0.7]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Parking lot ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 16]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ── Hospital — white building with red cross ─────────────── */
function Hospital({ pos, ry }) {
  return (
    <group position={pos} rotation={[0, ry, 0]}>
      {/* Main building */}
      <mesh position={[0, 8, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 16, 14]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>
      {/* Red stripe accent at top */}
      <mesh position={[0, 15.5, 7.05]}>
        <planeGeometry args={[20, 1.2]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.4} />
      </mesh>
      {/* Red cross — vertical bar */}
      <mesh position={[0, 10, 7.06]}>
        <planeGeometry args={[1.5, 6]} />
        <meshStandardMaterial color="#dd0000" emissive="#dd0000" emissiveIntensity={0.8} />
      </mesh>
      {/* Red cross — horizontal bar */}
      <mesh position={[0, 10, 7.07]}>
        <planeGeometry args={[6, 1.5]} />
        <meshStandardMaterial color="#dd0000" emissive="#dd0000" emissiveIntensity={0.8} />
      </mesh>
      {/* Windows grid */}
      {Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => (
          <mesh key={`hw${row}_${col}`}
            position={[-8 + col * 4, 4 + row * 3.5, 7.04]}
          >
            <planeGeometry args={[2.2, 1.8]} />
            <meshStandardMaterial color="#aaddee" metalness={0.3} roughness={0.2}
              transparent opacity={0.5} />
          </mesh>
        ))
      ).flat()}
      {/* Entrance */}
      <mesh position={[0, 2.5, 7.08]}>
        <planeGeometry args={[4, 5]} />
        <meshStandardMaterial color="#88bbcc" metalness={0.4} roughness={0.2}
          transparent opacity={0.6} />
      </mesh>
      {/* Entrance canopy */}
      <mesh position={[0, 5.2, 8]} castShadow>
        <boxGeometry args={[6, 0.3, 2.5]} />
        <meshStandardMaterial color="#ccc" metalness={0.5} />
      </mesh>
      {/* Helipad on roof */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 16.05, 0]}>
        <circleGeometry args={[3, 24]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 16.06, 0]}>
        <ringGeometry args={[2.4, 3, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

/* ── Eiffel Tower — iconic lattice structure ──────────────── */
function EiffelTower({ pos }) {
  const baseW = 12
  const totalH = 65
  return (
    <group position={pos}>
      {/* 4 legs */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={`leg${i}`}
          position={[sx * baseW / 3, totalH * 0.22, sz * baseW / 3]}
          rotation={[sz * 0.15, 0, sx * -0.15]}
          castShadow
        >
          <boxGeometry args={[1.2, totalH * 0.5, 1.2]} />
          <meshStandardMaterial color="#8B7355" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Platform 1 (lower) */}
      <mesh position={[0, totalH * 0.3, 0]} castShadow>
        <boxGeometry args={[baseW * 0.7, 0.8, baseW * 0.7]} />
        <meshStandardMaterial color="#7a6a50" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Mid section — 4 converging pillars */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={`mid${i}`}
          position={[sx * baseW / 6, totalH * 0.48, sz * baseW / 6]}
          castShadow
        >
          <boxGeometry args={[0.8, totalH * 0.3, 0.8]} />
          <meshStandardMaterial color="#8B7355" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Platform 2 (mid) */}
      <mesh position={[0, totalH * 0.58, 0]} castShadow>
        <boxGeometry args={[baseW * 0.4, 0.6, baseW * 0.4]} />
        <meshStandardMaterial color="#7a6a50" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Upper column */}
      <mesh position={[0, totalH * 0.77, 0]} castShadow>
        <boxGeometry args={[1.5, totalH * 0.35, 1.5]} />
        <meshStandardMaterial color="#8B7355" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Antenna/spire */}
      <mesh position={[0, totalH - 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.35, 6, 8]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Red light at top */}
      <mesh position={[0, totalH + 1, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={3} />
      </mesh>
      {/* Cross-braces (decorative) */}
      {[0.15, 0.35, 0.55].map((t, i) => (
        <mesh key={`brace${i}`} position={[0, totalH * t, 0]}>
          <boxGeometry args={[baseW * (0.7 - t * 0.7), 0.3, baseW * (0.7 - t * 0.7)]} />
          <meshStandardMaterial color="#6a5a44" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

/* ── Sponsor board — trackside advertising banner ─────────── */
const SPONSOR_COLORS = ['#e8001c', '#0055a4', '#ffcc00', '#00a651', '#ff6600', '#9b1dff']
const SPONSOR_LABELS = ['FORMULA RACE', 'APEX ENERGY', 'CARBON SPEED', 'TRACK MASTER', 'RACE PRO', 'TURBO FUEL']

function SponsorBoard({ pos, ry, idx }) {
  const col = SPONSOR_COLORS[idx % SPONSOR_COLORS.length]
  return (
    <group position={pos} rotation={[0, ry, 0]}>
      {/* Post left */}
      <mesh position={[-2.2, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 3, 6]} />
        <meshStandardMaterial color="#555" metalness={0.7} />
      </mesh>
      {/* Post right */}
      <mesh position={[2.2, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 3, 6]} />
        <meshStandardMaterial color="#555" metalness={0.7} />
      </mesh>
      {/* Banner board */}
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[4.8, 1.2, 0.14]} />
        <meshStandardMaterial color={col} roughness={0.5} />
      </mesh>
      {/* White label stripe */}
      <mesh position={[0, 3.1, 0.08]}>
        <planeGeometry args={[4.4, 0.55]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  )
}

/* ── Camera lattice tower ─────────────────────────────────── */
function CameraLattice({ pos, ry }) {
  return (
    <group position={pos} rotation={[0, ry, 0]}>
      {/* Main vertical pole */}
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 10, 6]} />
        <meshStandardMaterial color="#778899" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Horizontal arm */}
      <mesh position={[1.2, 10.5, 0]} rotation={[0, 0, -Math.PI / 10]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.8, 6]} />
        <meshStandardMaterial color="#666" metalness={0.7} />
      </mesh>
      {/* Camera housing */}
      <mesh position={[2.4, 10.2, 0]}>
        <boxGeometry args={[0.35, 0.25, 0.45]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Camera lens */}
      <mesh position={[2.4, 10.2, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.12, 10]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Diagonal brace */}
      <mesh position={[0.4, 7.5, 0]} rotation={[0, 0, Math.PI / 5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 5.5, 5]} />
        <meshStandardMaterial color="#778899" metalness={0.6} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN TRACK COMPONENT
   ═══════════════════════════════════════════════════════════════ */
/* ── Instanced centerline dashes (1 draw call) ───────────── */
function InstancedDashes({ dashes }) {
  const ref = useRef()
  const geo = useMemo(() => new THREE.PlaneGeometry(0.22, 3), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: 'white', transparent: true, opacity: 0.45 }), [])
  useEffect(() => {
    const mesh = ref.current
    if (!mesh || !dashes.length) return
    const dummy = new THREE.Object3D()
    dashes.forEach((d, i) => {
      dummy.position.set(d.x, 0.02, d.z)
      dummy.rotation.set(-Math.PI / 2, d.ry, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [dashes])
  return <instancedMesh ref={ref} geometry={geo} material={mat} count={dashes.length} />
}

/* ── Instanced lane lines (dashed + solid edge lines) ─────── */
function InstancedLaneLines({ lines }) {
  const ref = useRef()
  const geo = useMemo(() => new THREE.PlaneGeometry(0.18, 2.8), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: 'white', transparent: true, opacity: 0.55 }), [])
  useEffect(() => {
    const mesh = ref.current
    if (!mesh || !lines.length) return
    const dummy = new THREE.Object3D()
    lines.forEach((l, i) => {
      dummy.position.set(l.x, 0.025, l.z)
      dummy.rotation.set(-Math.PI / 2, l.ry, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [lines])
  return <instancedMesh ref={ref} geometry={geo} material={mat} count={lines.length} />
}

function InstancedEdgeLines({ lines }) {
  const ref = useRef()
  const geo = useMemo(() => new THREE.PlaneGeometry(0.14, 1.6), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: 'white', transparent: true, opacity: 0.4 }), [])
  useEffect(() => {
    const mesh = ref.current
    if (!mesh || !lines.length) return
    const dummy = new THREE.Object3D()
    lines.forEach((l, i) => {
      dummy.position.set(l.x, 0.025, l.z)
      dummy.rotation.set(-Math.PI / 2, l.ry, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [lines])
  return <instancedMesh ref={ref} geometry={geo} material={mat} count={lines.length} />
}

/* ── Instanced kerb stripes (2 draw calls) ────────────────── */
function InstancedKerbs({ kerbs }) {
  const redRef   = useRef()
  const whiteRef = useRef()
  const geo      = useMemo(() => new THREE.PlaneGeometry(CURB_W, 2.4), [])
  const redMat   = useMemo(() => new THREE.MeshBasicMaterial({ color: '#cc2200' }), [])
  const whiteMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff' }), [])
  const reds   = useMemo(() => kerbs.filter(k =>  k.red), [kerbs])
  const whites = useMemo(() => kerbs.filter(k => !k.red), [kerbs])
  useEffect(() => {
    const dummy = new THREE.Object3D()
    const fill = (mesh, arr) => {
      if (!mesh || !arr.length) return
      arr.forEach((k, i) => {
        dummy.position.set(k.x, 0.055, k.z)
        dummy.rotation.set(-Math.PI / 2, k.ry, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    fill(redRef.current, reds)
    fill(whiteRef.current, whites)
  }, [kerbs, reds, whites])
  return (
    <>
      <instancedMesh ref={redRef}   geometry={geo} material={redMat}   count={reds.length} />
      <instancedMesh ref={whiteRef} geometry={geo} material={whiteMat} count={whites.length} />
    </>
  )
}

/* ── Instanced trees (2 draw calls) ─────────────────────────── */
function InstancedTrees({ frames, selectedLevel }) {
  const trunkRef  = useRef()
  const canopyRef = useRef()
  const trunkGeo  = useMemo(() => new THREE.CylinderGeometry(0.12, 0.18, 1, 6), [])
  const canopyGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])
  const trunkMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5a3a1a' }), [])
  const canopyMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: false, color: '#4a7a2a' }), [])

  const trees = useMemo(() => {
    const r = prng(99 + selectedLevel)
    const xs = frames.map(f => f.p.x), zs = frames.map(f => f.p.z)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2
    const rx = (Math.max(...xs) - Math.min(...xs)) / 3
    const rz = (Math.max(...zs) - Math.min(...zs)) / 3
    const list = []
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2
      const px = cx + (rx * 0.2 + r() * rx * 0.6) * Math.cos(angle)
      const pz = cz + (rz * 0.2 + r() * rz * 0.6) * Math.sin(angle)
      const h  = 3 + r() * 4
      const hintFrame = Math.floor((i / 20) * frames.length) % frames.length
      const info = nearestTrackInfo(px, pz, hintFrame)
      if (Math.abs(info.signedDist) < WALL_D + 4) continue
      list.push({ px, pz, h, radius: 1 + r() * 0.8, hue: 100 + r() * 40, light: 22 + r() * 12 })
    }
    return list
  }, [frames, selectedLevel])

  useEffect(() => {
    if (!trunkRef.current || !canopyRef.current || !trees.length) return
    const dummy = new THREE.Object3D()
    const col   = new THREE.Color()
    trees.forEach((t, i) => {
      dummy.position.set(t.px, t.h / 2, t.pz)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, t.h, 1)
      dummy.updateMatrix()
      trunkRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(t.px, t.h + 1, t.pz)
      dummy.scale.set(t.radius, t.radius, t.radius)
      dummy.updateMatrix()
      canopyRef.current.setMatrixAt(i, dummy.matrix)
      col.setHSL(t.hue / 360, 0.5, t.light / 100)
      canopyRef.current.setColorAt(i, col)
    })
    trunkRef.current.instanceMatrix.needsUpdate  = true
    canopyRef.current.instanceMatrix.needsUpdate = true
    if (canopyRef.current.instanceColor) canopyRef.current.instanceColor.needsUpdate = true
  }, [trees])

  if (!trees.length) return null
  return (
    <>
      <instancedMesh ref={trunkRef}  geometry={trunkGeo}  material={trunkMat}  count={trees.length} castShadow />
      <instancedMesh ref={canopyRef} geometry={canopyGeo} material={canopyMat} count={trees.length} castShadow />
    </>
  )
}

// ── F1 Start / Finish Gantry with animated lights ───────────
function StartLightsGantry({ sf }) {
  const matRefs = useRef([])

  useFrame(() => {
    const { countdown, raceStarted } = useGameStore.getState()
    // Map countdown to pods lit (0 = leftmost pod index)
    // 3 → 1 pod, 2 → 3 pods, 1 or 0 → 5 pods; raceStarted → 0
    let numLit
    if (raceStarted) numLit = 0
    else if (countdown >= 3) numLit = 1
    else if (countdown === 2) numLit = 3
    else numLit = 5

    matRefs.current.forEach((mat, idx) => {
      if (!mat) return
      const target = Math.floor(idx / 2) < numLit ? 5.5 : 0.05
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, target, 0.18)
    })
  })

  return (
    <group position={[sf.p.x, 0, sf.p.z]} rotation={[0, sf.ry, 0]}>
      {/* Left column */}
      <mesh position={[-(HW + 1.2), 6, 0]} castShadow>
        <boxGeometry args={[0.7, 12, 0.7]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right column */}
      <mesh position={[(HW + 1.2), 6, 0]} castShadow>
        <boxGeometry args={[0.7, 12, 0.7]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Horizontal truss beam */}
      <mesh position={[0, 12.15, 0]} castShadow>
        <boxGeometry args={[ROAD_W + 4, 0.55, 0.9]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Truss detail strips */}
      <mesh position={[0, 12.45, 0]}>
        <boxGeometry args={[ROAD_W + 4.2, 0.12, 0.7]} />
        <meshStandardMaterial color="#444" metalness={0.8} />
      </mesh>
      {/* Timing-screen banner */}
      <mesh position={[0, 13.0, 0.5]}>
        <planeGeometry args={[12, 1.2]} />
        <meshStandardMaterial color="#001133" emissive="#002266" emissiveIntensity={0.6} />
      </mesh>
      {/* "FORMULA RACE" text-mock on board — white strip */}
      <mesh position={[0, 13.0, 0.52]}>
        <planeGeometry args={[10, 0.45]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* 5 red start-light pods hanging from beam */}
      {[-8, -4, 0, 4, 8].map((xOff, i) => (
        <group key={i} position={[xOff, 11.5, 0]}>
          {/* Pod housing */}
          <mesh>
            <boxGeometry args={[1.6, 0.55, 0.55]} />
            <meshStandardMaterial color="#111" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* 2 light circles per pod */}
          {[-0.4, 0.4].map((lx, j) => (
            <mesh key={j} position={[lx, 0, 0.32]}>
              <circleGeometry args={[0.2, 12]} />
              <meshStandardMaterial
                ref={el => { matRefs.current[i * 2 + j] = el }}
                color="#cc0000"
                emissive="#ff0000"
                emissiveIntensity={0.05}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

export default function Track() {
  const selectedLevel = useGameStore((s) => s.selectedLevel)

  const curve  = useMemo(() => { setActiveLevel(selectedLevel); return makeCurve() }, [selectedLevel])
  const frames = useMemo(() => sampleFrames(curve, SAMPLES), [curve])

  // Shared neon material (day only)
  const neonMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00ccff', emissive: '#00ccff', emissiveIntensity: 0.15,
  }), [])

  // Procedural asphalt textures
  const asphaltMap    = useMemo(() => makeAsphaltTexture(), [])
  const asphaltNormal = useMemo(() => makeAsphaltNormal(), [])

  const roadG      = useMemo(() => flatStrip(frames, ROAD_W, 0.01), [frames])
  const innerSW    = useMemo(() => ringStrip(frames, HW, HW + SW_W, 0.05), [frames])
  const outerSW    = useMemo(() => ringStrip(frames, -(HW + SW_W), -HW, 0.05), [frames])
  const innerW     = useMemo(() => wallGeo(frames, WALL_D, WALL_H), [frames])
  const outerW     = useMemo(() => wallGeo(frames, -WALL_D, WALL_H), [frames])
  // Safety fencing — thin 1.8 m tall strip just outside the barriers
  const innerFence = useMemo(() => wallGeo(frames, WALL_D + 1.2, 1.8), [frames])
  const outerFence = useMemo(() => wallGeo(frames, -(WALL_D + 1.2), 1.8), [frames])

  const dashes = useMemo(() => {
    const arr = []
    for (let i = 0; i < frames.length; i += 8)
      if (Math.floor(i / 8) % 2 === 0) {
        const f = frames[i]
        arr.push({ x: f.p.x, z: f.p.z, ry: f.ry })
      }
    return arr
  }, [frames])

  // Lane divider dashes — two dashed lines at ±HW/3 from center
  const laneLines = useMemo(() => {
    const arr = []
    const offsets = [HW / 3, -HW / 3]  // two lane dividers
    for (let i = 0; i < frames.length; i += 8) {
      if (Math.floor(i / 8) % 2 === 0) {
        const f = frames[i]
        for (const off of offsets) {
          arr.push({
            x: f.p.x + f.nm.x * off,
            z: f.p.z + f.nm.z * off,
            ry: f.ry,
          })
        }
      }
    }
    return arr
  }, [frames])

  // Edge lines — continuous solid lines near the road edges
  const edgeLines = useMemo(() => {
    const arr = []
    const edgeOff = HW - 0.8  // just inside the curbs
    for (let i = 0; i < frames.length; i += 3) {
      const f = frames[i]
      arr.push({
        x: f.p.x + f.nm.x * edgeOff,
        z: f.p.z + f.nm.z * edgeOff,
        ry: f.ry,
      })
      arr.push({
        x: f.p.x - f.nm.x * edgeOff,
        z: f.p.z - f.nm.z * edgeOff,
        ry: f.ry,
      })
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

  // ── Sponsor boards — outer side every ~16 frames ──────────
  const sponsorBoards = useMemo(() => {
    const arr = []
    const step = Math.floor(frames.length / 18)
    for (let i = 0; i < frames.length; i += step) {
      const f = frames[i]
      const off = WALL_D + 5
      arr.push({
        pos: [f.p.x + f.nm.x * off, 0, f.p.z + f.nm.z * off],
        ry: f.ry + Math.PI / 2,
        idx: Math.floor(i / step),
      })
    }
    return arr
  }, [frames])

  // ── Camera towers — inner side every ~30 frames ───────────
  const cameraTowers = useMemo(() => {
    const arr = []
    const step = Math.floor(frames.length / 10)
    for (let i = 0; i < frames.length; i += step) {
      const f = frames[i]
      const off = WALL_D + 4
      arr.push({
        pos: [f.p.x - f.nm.x * off, 0, f.p.z - f.nm.z * off],
        ry: f.ry,
      })
    }
    return arr
  }, [frames])

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
      {/* Ground — bright race-day grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#3a7a2a" roughness={0.95} />
      </mesh>

      {/* Road — textured asphalt with tyre marks and specular sheen */}
      <mesh geometry={roadG} receiveShadow castShadow>
        <meshStandardMaterial
          map={asphaltMap}
          normalMap={asphaltNormal}
          normalScale={[0.3, 0.3]}
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>

      {/* Run-off / kerb shoulder — matches F1 circuit green tarmac */}
      <mesh geometry={innerSW} receiveShadow>
        <meshStandardMaterial color="#4a8c3a" roughness={0.9} />
      </mesh>
      <mesh geometry={outerSW} receiveShadow>
        <meshStandardMaterial color="#4a8c3a" roughness={0.9} />
      </mesh>

      {/* Barriers */}
      {/* Inner barrier — bright white F1 concrete wall */}
      <mesh geometry={innerW}>
        <meshStandardMaterial color="#e8e8e8" roughness={0.5} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer barrier — bright white F1 concrete wall */}
      <mesh geometry={outerW}>
        <meshStandardMaterial color="#e8e8e8" roughness={0.5} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Safety fencing — chain-link style outside barriers */}
      <mesh geometry={innerFence}>
        <meshStandardMaterial color="#7aaa55" roughness={0.6} metalness={0.2}
          side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>
      <mesh geometry={outerFence}>
        <meshStandardMaterial color="#7aaa55" roughness={0.6} metalness={0.2}
          side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>

      {/* Centre-line dashes — single instanced draw call */}
      <InstancedDashes dashes={dashes} />

      {/* Lane divider lines */}
      <InstancedLaneLines lines={laneLines} />

      {/* Edge lines */}
      <InstancedEdgeLines lines={edgeLines} />

      {/* Kerb stripes — 2 instanced draw calls (red + white) */}
      <InstancedKerbs kerbs={kerbs} />

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

      {/* ── F1 Start / Finish Gantry with animated lights ── */}
      <StartLightsGantry sf={sf} />

      {/* Grandstand */}
      {/* ── Main Grandstand (Start/Finish side) ─────────────── */}
      <group
        position={[
          sf.p.x - sf.nm.x * (WALL_D + 14), 0,
          sf.p.z - sf.nm.z * (WALL_D + 14),
        ]}
        rotation={[0, sf.ry, 0]}
      >
        {/* Concrete structure — 8 rising tiers */}
        {[0,1,2,3,4,5,6,7].map(row => (
          <group key={row}>
            {/* Concrete step */}
            <mesh position={[row * 3.2, row * 1.8 + 0.9, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.5, 1.8, 80]} />
              <meshStandardMaterial color="#c8c0b8" roughness={0.85} />
            </mesh>
            {/* Seat row — alternating orange / blue like F1 stands */}
            <mesh position={[row * 3.2 + 1.2, row * 1.8 + 1.85, 0]} rotation={[Math.PI * 0.12, 0, 0]}>
              <boxGeometry args={[1.2, 0.15, 79]} />
              <meshStandardMaterial
                color={row % 2 === 0 ? '#e8460a' : '#1a4fa0'}
                roughness={0.6}
              />
            </mesh>
          </group>
        ))}
        {/* Roof canopy over top rows */}
        <mesh position={[23, 16.2, 0]} castShadow>
          <boxGeometry args={[10, 0.4, 82]} />
          <meshStandardMaterial color="#e0dcd4" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Canopy support struts */}
        {[-36, -18, 0, 18, 36].map((z, i) => (
          <mesh key={i} position={[25.5, 10, z]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 14, 6]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* Back wall */}
        <mesh position={[28.5, 7, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 16, 82]} />
          <meshStandardMaterial color="#a8a09a" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Opposite grandstand (smaller, other side) ───────── */}
      <group
        position={[
          sf.p.x + sf.nm.x * (WALL_D + 14), 0,
          sf.p.z + sf.nm.z * (WALL_D + 14),
        ]}
        rotation={[0, sf.ry + Math.PI, 0]}
      >
        {[0,1,2,3,4].map(row => (
          <group key={row}>
            <mesh position={[row * 3.0, row * 1.7 + 0.85, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.2, 1.7, 60]} />
              <meshStandardMaterial color="#c0b8b0" roughness={0.85} />
            </mesh>
            <mesh position={[row * 3.0 + 1.1, row * 1.7 + 1.72, 0]} rotation={[Math.PI * 0.12, 0, 0]}>
              <boxGeometry args={[1.1, 0.15, 59]} />
              <meshStandardMaterial color={row % 2 === 0 ? '#cc3300' : '#f0a500'} roughness={0.6} />
            </mesh>
          </group>
        ))}
        <mesh position={[14, 9.8, 0]} castShadow>
          <boxGeometry args={[8, 0.35, 62]} />
          <meshStandardMaterial color="#ddd8d0" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>

      {/* ── Pit-lane building (PRD §5 Race Infrastructure) ─── */}
      <group
        position={[
          sf.p.x + sf.nm.x * (WALL_D + 6), 0,
          sf.p.z + sf.nm.z * (WALL_D + 6),
        ]}
        rotation={[0, sf.ry, 0]}
      >
        {/* Main pit building */}
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <boxGeometry args={[9, 8, 70]} />
          <meshStandardMaterial color="#3a4a5a" roughness={0.7} />
        </mesh>
        {/* Pit garage doors */}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-(9 / 2 + 0.02), 1.5, -31.5 + i * 5.8]}>
            <planeGeometry args={[4.5, 3]} />
            <meshStandardMaterial color="#223344" roughness={0.3} metalness={0.6} />
          </mesh>
        ))}
        {/* Pit wall balcony rail */}
        <mesh position={[-(9 / 2 + 0.3), 4.5, 0]}>
          <boxGeometry args={[0.15, 1, 70]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Pit building roof deck */}
        <mesh position={[0, 8.15, 0]}>
          <boxGeometry args={[9.4, 0.3, 70.4]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>

      {/* Streetlights — each self-contained with own useFrame */}
      {lamps.map((pos, i) => (
        <Lamp key={`l${i}`} pos={pos} />
      ))}

      {/* ── Trackside sponsor boards (PRD §5) ──────────────── */}
      {sponsorBoards.map((b, i) => (
        <SponsorBoard key={`sb${i}`} pos={b.pos} ry={b.ry} idx={b.idx} />
      ))}

      {/* ── Camera lattice towers (PRD §5) ─────────────────── */}
      {cameraTowers.map((ct, i) => (
        <CameraLattice key={`ct${i}`} pos={ct.pos} ry={ct.ry} />
      ))}

      {/* Buildings — windows included with reduced counts for performance */}
      {blds.map((b, i) => <Bld key={`b${i}`} b={b} neonMat={neonMat} />)}

      {/* ── Landmark Buildings ────────────────────────────────── */}
      {(() => {
        // Place landmarks at 25%, 50%, 75% around the track, on the outer side
        const landmarkFrames = [Math.floor(frames.length * 0.25), Math.floor(frames.length * 0.5), Math.floor(frames.length * 0.75)]
        const lmOff = WALL_D + 30
        const lm = landmarkFrames.map(idx => {
          const f = frames[idx]
          return {
            pos: [f.p.x + f.nm.x * lmOff, 0, f.p.z + f.nm.z * lmOff],
            ry: f.ry + Math.PI / 2,
          }
        })
        return (
          <>
            <ShoppingMall pos={lm[0].pos} ry={lm[0].ry} />
            <Hospital pos={lm[1].pos} ry={lm[1].ry} />
            <EiffelTower pos={lm[2].pos} />
          </>
        )
      })()}

      {/* Decorative trees — 2 instanced draw calls */}
      <InstancedTrees frames={frames} selectedLevel={selectedLevel} />
    </group>
  )
}
