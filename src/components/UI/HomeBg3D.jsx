import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { Earcut } from 'three/src/extras/Earcut.js'

/* ═══════════════════════════════════════════════════════════════
   3D animated background for the Home screen.
   A car races continuously around a showcase loop while the
   camera orbits cinematically.
   ═══════════════════════════════════════════════════════════════ */

// ── Track loop (a flowing figure-8-ish showcase circuit) ────
const SHOW_CP = [
  [50, -35],  [55, 25],
  [35, 52],   [0, 55],
  [-35, 40],  [-52, 10],
  [-50, -20], [-30, -48],
  [10, -50],  [38, -42],
]

function makeShowCurve() {
  return new THREE.CatmullRomCurve3(
    SHOW_CP.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true, 'centripetal', 0.5,
  )
}

const SHOW_CURVE = makeShowCurve()

// ── Build road mesh from the curve ──────────────────────────
function ShowRoad() {
  const geo = useMemo(() => {
    const N = 300
    const HW = 8
    const pos = new Float32Array(N * 6)
    const idx = []
    for (let i = 0; i < N; i++) {
      const t = i / N
      const p = SHOW_CURVE.getPointAt(t)
      const tg = SHOW_CURVE.getTangentAt(t).normalize()
      const nm = new THREE.Vector3(-tg.z, 0, tg.x)
      const j = i * 6
      pos[j]     = p.x + nm.x * HW; pos[j+1] = 0.01; pos[j+2] = p.z + nm.z * HW
      pos[j+3]   = p.x - nm.x * HW; pos[j+4] = 0.01; pos[j+5] = p.z - nm.z * HW
      const nx = (i + 1) % N
      idx.push(i*2, nx*2, i*2+1, i*2+1, nx*2, nx*2+1)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#222" roughness={0.9} />
    </mesh>
  )
}

// ── Barrier walls ───────────────────────────────────────────
function ShowBarriers() {
  const geo = useMemo(() => {
    const sides = []
    const N = 200, HW = 9.5, H = 0.8
    for (const sign of [1, -1]) {
      const pos = new Float32Array(N * 6)
      const idx = []
      for (let i = 0; i < N; i++) {
        const t = i / N
        const p = SHOW_CURVE.getPointAt(t)
        const tg = SHOW_CURVE.getTangentAt(t).normalize()
        const nm = new THREE.Vector3(-tg.z, 0, tg.x)
        const x = p.x + nm.x * HW * sign
        const z = p.z + nm.z * HW * sign
        const j = i * 6
        pos[j] = x; pos[j+1] = 0; pos[j+2] = z
        pos[j+3] = x; pos[j+4] = H; pos[j+5] = z
        const nx = (i + 1) % N
        idx.push(i*2, nx*2, i*2+1, i*2+1, nx*2, nx*2+1)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      g.setIndex(idx)
      g.computeVertexNormals()
      sides.push(g)
    }
    return sides
  }, [])

  return (
    <>
      {geo.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#aaa" metalness={0.2} roughness={0.5}
            side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  )
}

// ── Showcase buildings (simple, atmospheric) ────────────────
function ShowBuildings() {
  const blds = useMemo(() => {
    const seed = 777
    let s = seed
    const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
    const PAL = ['#3a4a5c','#4e5e70','#2e3e55','#5a6a80','#1e2e40']
    const ACCENT = ['#ff4466','#00ccff','#ffaa00','#44ff88','#cc66ff']
    const list = []

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2
      const dist = 90 + rng() * 45
      const bx = Math.cos(angle) * dist
      const bz = Math.sin(angle) * dist
      const w = 4 + rng() * 10
      const h = 8 + rng() * 45
      const d = 4 + rng() * 10
      list.push({
        x: bx, z: bz, w, h, d,
        c: PAL[Math.floor(rng() * PAL.length)],
        accent: ACCENT[Math.floor(rng() * ACCENT.length)],
        neon: rng() > 0.4,
        antenna: h > 30 && rng() > 0.5,
      })
    }
    return list
  }, [])

  return (
    <>
      {blds.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          {/* Body */}
          <mesh position={[0, b.h / 2, 0]} castShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.c} roughness={0.8} />
          </mesh>
          {/* Roof cap */}
          <mesh position={[0, b.h + 0.08, 0]}>
            <boxGeometry args={[b.w + 0.2, 0.15, b.d + 0.2]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Windows (glow) */}
          {Array.from({ length: Math.floor(b.h / 5) }, (_, r) => (
            <mesh key={r} position={[0, 2.5 + r * 5, b.d / 2 + 0.03]}>
              <planeGeometry args={[b.w * 0.6, 1]} />
              <meshStandardMaterial color="#ffeeaa" emissive="#ffeeaa"
                emissiveIntensity={0.7} transparent opacity={0.6} />
            </mesh>
          ))}
          {/* Neon strip */}
          {b.neon && (
            <mesh position={[0, b.h - 0.3, b.d / 2 + 0.05]}>
              <planeGeometry args={[b.w * 0.85, 0.15]} />
              <meshStandardMaterial color={b.accent} emissive={b.accent}
                emissiveIntensity={2} />
            </mesh>
          )}
          {/* Antenna blinking light */}
          {b.antenna && (
            <mesh position={[b.w * 0.25, b.h + 5, 0]}>
              <sphereGeometry args={[0.12, 6, 6]} />
              <meshStandardMaterial color="#ff2200" emissive="#ff2200"
                emissiveIntensity={3} />
            </mesh>
          )}
        </group>
      ))}
    </>
  )
}

// ── GLB car auto-driving on the curve ───────────────────────
const MODEL_PATH = '/models/muscle_car.glb'
const CAR_SPEED = 0.03  // loops / second

function AutoCar() {
  const { scene } = useGLTF(MODEL_PATH)
  const ref = useRef()

  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(ch => {
      if (ch.isMesh) {
        ch.castShadow = true
        if (ch.material) {
          ch.material = ch.material.clone()
          if (ch.material.name?.toLowerCase().includes('body') ||
              ch.material.name?.toLowerCase().includes('paint') ||
              ch.material.name?.toLowerCase().includes('car')) {
            ch.material.color = new THREE.Color('#e74c3c')
          }
        }
      }
    })
    return c
  }, [scene])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.getElapsedTime() * CAR_SPEED) % 1
    const pos = SHOW_CURVE.getPointAt(t)
    const tg  = SHOW_CURVE.getTangentAt(t).normalize()

    ref.current.position.set(pos.x, 0.35, pos.z)
    ref.current.rotation.y = Math.atan2(-tg.x, tg.z)
  })

  // Wrap in group so we can add a local Y offset for the model
  return (
    <group ref={ref} position={[50, 0.35, -35]}>
      <primitive object={cloned} scale={1.5} position={[0, 0.35, 0]} />
    </group>
  )
}

function FallbackCar() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.getElapsedTime() * CAR_SPEED) % 1
    const pos = SHOW_CURVE.getPointAt(t)
    const tg  = SHOW_CURVE.getTangentAt(t).normalize()
    ref.current.position.set(pos.x, 0.35, pos.z)
    ref.current.rotation.y = Math.atan2(-tg.x, tg.z)
  })
  return (
    <group ref={ref}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[2, 0.5, 4]} />
        <meshStandardMaterial color="#e74c3c" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ── Cinematic chase camera — always behind the car, elevated ─
const _chaseOff = new THREE.Vector3()
const _chaseTgt = new THREE.Vector3()

function CinematicCamera() {
  useFrame(({ camera, clock }) => {
    const elapsed = clock.getElapsedTime()
    const t = (elapsed * CAR_SPEED) % 1

    const carPos = SHOW_CURVE.getPointAt(t)
    const carTan = SHOW_CURVE.getTangentAt(t).normalize()

    // Position camera behind and above the car
    const camDist = 24 + Math.sin(elapsed * 0.18) * 3
    const camH    = 10 + Math.sin(elapsed * 0.13) * 2
    // Slight lateral sway so it isn't perfectly rigid
    const sway    = Math.sin(elapsed * 0.22) * 4

    const right = new THREE.Vector3(-carTan.z, 0, carTan.x)
    _chaseOff.copy(carTan).multiplyScalar(-camDist)
    _chaseOff.addScaledVector(right, sway)
    _chaseOff.y = camH

    _chaseTgt.set(carPos.x + _chaseOff.x, _chaseOff.y, carPos.z + _chaseOff.z)
    camera.position.lerp(_chaseTgt, 0.035)
    camera.lookAt(carPos.x, 1.5, carPos.z)
  })
  return null
}

// ── Streetlights ────────────────────────────────────────────
function ShowLamps() {
  const lamps = useMemo(() => {
    const arr = []
    for (let i = 0; i < 16; i++) {
      const t = i / 16
      const p = SHOW_CURVE.getPointAt(t)
      const tg = SHOW_CURVE.getTangentAt(t).normalize()
      const nm = new THREE.Vector3(-tg.z, 0, tg.x)
      arr.push([p.x - nm.x * 12, 0, p.z - nm.z * 12])
    }
    return arr
  }, [])

  return (
    <>
      {lamps.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 7, 5]} />
            <meshStandardMaterial color="#555" metalness={0.8} />
          </mesh>
          <mesh position={[0, 7.2, 0]}>
            <sphereGeometry args={[0.25, 6, 6]} />
            <meshStandardMaterial color="#ffeedd" emissive="#ffeedd"
              emissiveIntensity={0.9} />
          </mesh>
          <pointLight position={[0, 7, 0]} intensity={0.3} distance={20}
            color="#ffeedd" />
        </group>
      ))}
    </>
  )
}

// ── Ground ──────────────────────────────────────────────────
function ShowGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#1a2a18" roughness={1} />
    </mesh>
  )
}

// ── Scene wrapper ───────────────────────────────────────────
function ShowScene() {
  return (
    <>
      {/* Lighting: warm sunset vibe */}
      <ambientLight intensity={0.35} color="#ffd4a0" />
      <hemisphereLight args={['#ff8844', '#2a3a20', 0.45]} />
      {/* Main sun — low on the horizon, warm orange */}
      <directionalLight
        position={[-60, 18, 80]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        color="#ff9944"
      />
      {/* Fill light from opposite side — cool purple tint */}
      <directionalLight position={[50, 30, -60]} intensity={0.3} color="#8866cc" />

      <fog attach="fog" args={['#2a1520', 80, 220]} />
      <Sky distance={450000} sunPosition={[-60, 8, 80]}
        rayleigh={1.5} turbidity={8} mieCoefficient={0.005} mieDirectionalG={0.8} />

      <ShowGround />
      <ShowRoad />
      <ShowBarriers />
      <ShowBuildings />
      <ShowLamps />

      <Suspense fallback={<FallbackCar />}>
        <AutoCar />
      </Suspense>

      <CinematicCamera />
    </>
  )
}

// ── Exported component (full-screen Canvas) ─────────────────
export default function HomeBg3D() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 0,
    }}>
      <Canvas
        shadows
        camera={{ position: [60, 15, 0], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1a0a12' }}
      >
        <ShowScene />
      </Canvas>
    </div>
  )
}
/*







  */
