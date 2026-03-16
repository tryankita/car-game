import { useRef, useEffect, Suspense, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../store'
import audioManager from '../audioManager'
import { nearestTrackInfo, WALL_D, setActiveLevel, getActiveTrack, SAMPLES } from '../trackData'
import { nightFactorRef } from './Lighting'
import { playerProgress, resetProgress } from '../raceProgress'
import { touchKeys } from '../touchControls'

const pressedKeys = {}
const SPEED_FEEL_MULT = 1.75

/* ── GLB Car Model ─────────────────────────────────────────── */
function GLBCarModel({ color, modelPath, modelScale, modelRotY, modelPosY }) {
  const { scene } = useGLTF(modelPath || '/models/muscle_car.glb')

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Tint the car body with the selected color
        if (child.material) {
          child.material = child.material.clone()
          // Apply color tint to larger body parts
          if (child.material.name?.toLowerCase().includes('body') ||
              child.material.name?.toLowerCase().includes('paint') ||
              child.material.name?.toLowerCase().includes('car')) {
            child.material.color = new THREE.Color(color)
          }
        }
      }
    })
    return clone
  }, [scene, color])

  return (
    <primitive
      object={clonedScene}
      scale={modelScale || 1.5}
      rotation={[0, modelRotY || 0, 0]}
      position={[0, modelPosY ?? 0.35, 0]}
    />
  )
}

/* ── Fallback box car (shown while model loads) ────────────── */
function FallbackCar({ color }) {
  return (
    <group position={[0, 0.35, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.1, 0.5, 4.2]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.0, -0.2]} castShadow>
        <boxGeometry args={[1.7, 0.45, 2.0]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
      {[[-1.15, 0.3, 1.35], [1.15, 0.3, 1.35], [-1.15, 0.3, -1.35], [1.15, 0.3, -1.35]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.26, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  )
}

/* ── Car wrapper with Suspense ─────────────────────────────── */
function CarModel({ color, modelPath, modelScale, modelRotY, modelPosY }) {
  return (
    <Suspense fallback={<FallbackCar color={color} />}>
      <GLBCarModel color={color} modelPath={modelPath} modelScale={modelScale} modelRotY={modelRotY} modelPosY={modelPosY} />
    </Suspense>
  )
}

// Preload models
useGLTF.preload('/models/muscle_car.glb')
useGLTF.preload('/models/sport_car.glb')

/* ── Vehicle Lights (headlights + taillights, night-reactive) ─ */
function CarLights({ velocityRef }) {
  const hlLL = useRef()   // headlight PointLight left
  const hlRL = useRef()   // headlight PointLight right
  const hlML = useRef()   // headlight bulb material left
  const hlMR = useRef()   // headlight bulb material right
  const tlML = useRef()   // taillight material left
  const tlMR = useRef()   // taillight material right
  const tlLL = useRef()   // taillight PointLight left
  const tlLR = useRef()   // taillight PointLight right

  useFrame(() => {
    const nf      = nightFactorRef.current
    const isNight = nf > 0.3
    const headI   = isNight ? THREE.MathUtils.lerp(0.2, 4.0, (nf - 0.3) / 0.7) : 0
    const headEI  = isNight ? THREE.MathUtils.lerp(0.1, 3.0, (nf - 0.3) / 0.7) : 0

    if (hlLL.current) hlLL.current.intensity = headI
    if (hlRL.current) hlRL.current.intensity = headI
    if (hlML.current) hlML.current.emissiveIntensity = headEI
    if (hlMR.current) hlMR.current.emissiveIntensity = headEI

    const speed  = velocityRef ? Math.abs(velocityRef.current) : 0
    const tailI  = 0.4 + (speed > 0.1 ? 1.0 : 0)
    const tailEI = 0.8 + (speed > 0.1 ? 1.6 : 0)
    if (tlLL.current) tlLL.current.intensity = tailI
    if (tlLR.current) tlLR.current.intensity = tailI
    if (tlML.current) tlML.current.emissiveIntensity = tailEI
    if (tlMR.current) tlMR.current.emissiveIntensity = tailEI
  })

  return (
    <group>
      {/* Headlight lens — no emissiveIntensity prop, driven purely by useFrame */}
      <mesh position={[-0.72, 0.9, 2.15]}>
        <circleGeometry args={[0.18, 12]} />
        <meshStandardMaterial ref={hlML} color="#ffffee"
          emissive="#ffffee" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.72, 0.9, 2.15]}>
        <circleGeometry args={[0.18, 12]} />
        <meshStandardMaterial ref={hlMR} color="#ffffee"
          emissive="#ffffee" side={THREE.DoubleSide} />
      </mesh>

      {/* Headlight beams — no intensity prop, driven by useFrame */}
      <pointLight ref={hlLL} position={[-0.72, 0.9, 5]} color="#fff4d0" distance={60} />
      <pointLight ref={hlRL} position={[ 0.72, 0.9, 5]} color="#fff4d0" distance={60} />

      {/* Taillight lens — no emissiveIntensity prop, driven by useFrame */}
      <mesh position={[-0.65, 0.9, -2.15]}>
        <boxGeometry args={[0.4, 0.14, 0.04]} />
        <meshStandardMaterial ref={tlML} color="#880000"
          emissive="#ff1100" />
      </mesh>
      <mesh position={[0.65, 0.9, -2.15]}>
        <boxGeometry args={[0.4, 0.14, 0.04]} />
        <meshStandardMaterial ref={tlMR} color="#880000"
          emissive="#ff1100" />
      </mesh>

      {/* Taillight glow — no intensity prop, driven by useFrame */}
      <pointLight ref={tlLL} position={[-0.65, 0.9, -3]} color="#ff2200" distance={12} />
      <pointLight ref={tlLR} position={[ 0.65, 0.9, -3]} color="#ff2200" distance={12} />
    </group>
  )
}

/* ── Tire smoke particle system ─────────────────────────────── */
const MAX_SMOKE = 120
const _scratchV3 = new THREE.Vector3()

function TireSmoke({ carRef, lateralVelRef, raceStarted }) {
  const geo = useRef(new THREE.BufferGeometry())
  const posArr = useRef(new Float32Array(MAX_SMOKE * 3))
  const particles = useRef([])

  useEffect(() => {
    geo.current.setAttribute('position',
      new THREE.BufferAttribute(posArr.current, 3))
    geo.current.setDrawRange(0, 0)
  }, [])

  useFrame((_, dt) => {
    if (!raceStarted || !carRef.current) return
    const slip = Math.abs(lateralVelRef.current)

    if (slip > 4.5 && particles.current.length < MAX_SMOKE) {
      _scratchV3.set(0, 0.1, -1.5).applyMatrix4(carRef.current.matrixWorld)
      const spawnCount = Math.min(3, MAX_SMOKE - particles.current.length)
      for (let k = 0; k < spawnCount; k++) {
        particles.current.push({
          x: _scratchV3.x + (Math.random() - 0.5) * 1.4,
          y: _scratchV3.y + Math.random() * 0.3,
          z: _scratchV3.z + (Math.random() - 0.5) * 0.6,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1.4 + Math.random() * 1.6,
          vz: (Math.random() - 0.5) * 1.2,
          life: 1,
          duration: 0.6 + Math.random() * 0.5,
        })
      }
    }

    const pos = posArr.current
    const alive = []
    let idx = 0
    for (const p of particles.current) {
      p.life -= dt / p.duration
      if (p.life <= 0) continue
      p.x += p.vx * dt; p.vx *= 0.96
      p.y += p.vy * dt; p.vy *= 0.95
      p.z += p.vz * dt; p.vz *= 0.96
      pos[idx * 3]     = p.x
      pos[idx * 3 + 1] = p.y
      pos[idx * 3 + 2] = p.z
      idx++
      alive.push(p)
    }
    particles.current = alive

    if (geo.current.attributes.position) {
      geo.current.attributes.position.needsUpdate = true
      geo.current.setDrawRange(0, idx)
    }
  })

  return (
    <points>
      <primitive object={geo.current} attach="geometry" />
      <pointsMaterial
        size={2.4}
        color="#c8c8c8"
        transparent
        opacity={0.38}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

/* ── Speed lines — peripheral streaks at high velocity ──────── */
const MAX_LINES = 60
const _lineV3   = new THREE.Vector3()

function SpeedLines({ carRef, velocityRef }) {
  const geo   = useRef(new THREE.BufferGeometry())
  const posA  = useRef(new Float32Array(MAX_LINES * 6))  // 2 verts × 3 coords per line
  const lines = useRef([])

  useEffect(() => {
    geo.current.setAttribute('position',
      new THREE.BufferAttribute(posA.current, 3))
    geo.current.setDrawRange(0, 0)
  }, [])

  useFrame((state, dt) => {
    if (!carRef.current) return
    const speed = Math.abs(velocityRef.current)
    const ratio = speed / 50                         // approximate normalisation

    // Only show at >40 % speed
    if (ratio > 0.4 && lines.current.length < MAX_LINES) {
      const car = carRef.current
      const cam = state.camera
      // Spawn a few lines around camera periphery each frame
      const spawnCount = Math.min(Math.ceil((ratio - 0.4) * 8), 4)
      for (let k = 0; k < spawnCount && lines.current.length < MAX_LINES; k++) {
        // Random angle around view direction
        const angle = Math.random() * Math.PI * 2
        const radius = 6 + Math.random() * 10
        const offX = Math.cos(angle) * radius
        const offY = Math.sin(angle) * radius * 0.4 + 2

        _lineV3.set(offX, offY, 8 + Math.random() * 6)
        _lineV3.applyQuaternion(cam.quaternion)
        _lineV3.add(car.position)

        lines.current.push({
          x: _lineV3.x, y: _lineV3.y, z: _lineV3.z,
          vx: 0, vy: 0, vz: 0,
          life: 1,
          duration: 0.15 + Math.random() * 0.15,
          length: 1.5 + Math.random() * 2.5,
        })
      }
    }

    const pos   = posA.current
    const alive = []
    let idx = 0
    const fwd = carRef.current
      ? new THREE.Vector3(0, 0, 1).applyQuaternion(carRef.current.quaternion)
      : new THREE.Vector3(0, 0, 1)

    for (const p of lines.current) {
      p.life -= dt / p.duration
      if (p.life <= 0) continue
      // Move streaks backward relative to the car
      p.x -= fwd.x * speed * dt * 1.4
      p.y -= fwd.y * speed * dt * 1.4
      p.z -= fwd.z * speed * dt * 1.4

      const stretch = p.length * p.life
      pos[idx * 6]     = p.x
      pos[idx * 6 + 1] = p.y
      pos[idx * 6 + 2] = p.z
      pos[idx * 6 + 3] = p.x + fwd.x * stretch
      pos[idx * 6 + 4] = p.y + fwd.y * stretch
      pos[idx * 6 + 5] = p.z + fwd.z * stretch
      idx++
      alive.push(p)
    }
    lines.current = alive

    if (geo.current.attributes.position) {
      geo.current.attributes.position.needsUpdate = true
      geo.current.setDrawRange(0, idx * 2)
    }
  })

  return (
    <lineSegments>
      <primitive object={geo.current} attach="geometry" />
      <lineBasicMaterial color="#ffffff" transparent opacity={0.18} depthWrite={false} />
    </lineSegments>
  )
}

/* ── Skid marks on the road ─────────────────────────────────── */
const MAX_SKIDS = 500
const _skidObj  = new THREE.Object3D()
const _skidPosL = new THREE.Vector3()
const _skidPosR = new THREE.Vector3()

function SkidMarks({ carRef, lateralVelRef, raceStarted }) {
  const meshRef = useRef()
  const nextIdx = useRef(0)

  useEffect(() => {
    if (!meshRef.current) return
    _skidObj.position.set(0, -100, 0)
    _skidObj.updateMatrix()
    for (let i = 0; i < MAX_SKIDS; i++) {
      meshRef.current.setMatrixAt(i, _skidObj.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame(() => {
    if (!raceStarted || !carRef.current || !meshRef.current) return
    const slip = Math.abs(lateralVelRef.current)
    if (slip > 4.0) {
      const car = carRef.current
      _skidPosL.set(-0.85, 0, -1.5).applyMatrix4(car.matrixWorld)
      _skidPosR.set( 0.85, 0, -1.5).applyMatrix4(car.matrixWorld)

      for (const pos of [_skidPosL, _skidPosR]) {
        const idx = nextIdx.current % MAX_SKIDS
        _skidObj.position.set(pos.x, 0.03, pos.z)
        _skidObj.rotation.set(-Math.PI / 2, car.rotation.y, 0)
        _skidObj.updateMatrix()
        meshRef.current.setMatrixAt(idx, _skidObj.matrix)
        nextIdx.current++
      }
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_SKIDS]} frustumCulled={false}>
      <planeGeometry args={[0.25, 0.55]} />
      <meshBasicMaterial color="#1a1a1a" transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

/* ── Main Car component ────────────────────────────────────── */
export default function Car() {
  const carRef = useRef()
  const velocity = useRef(0)
  const { camera } = useThree()
  const prevZ = useRef(0)
  const lapStartTime = useRef(0)
  const hasLeftStart = useRef(false)
  const raceStartTimeRef = useRef(0)
  const lateralVel   = useRef(0)          // sideways drift velocity
  const fovRef       = useRef(62)
  const prevGearRef  = useRef('N')        // for gear-shift SFX
  const bodyPitch    = useRef(0)           // nose tilt on accel/brake
  const bodyRoll     = useRef(0)           // lean on steering
  const camShake     = useRef(0)           // camera vibration timer
  const bodyGroupRef = useRef()            // inner group for pitch/roll
  const lastFrameIdx = useRef(-1)          // track segment hint for collision

  const selectedCar = useGameStore((s) => s.selectedCar)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const cars = useGameStore((s) => s.cars)
  const raceStarted = useGameStore((s) => s.raceStarted)
  const raceFinished = useGameStore((s) => s.raceFinished)
  const paused = useGameStore((s) => s.paused)
  const keybinds = useGameStore((s) => s.keybinds)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const setRaceTime = useGameStore((s) => s.setRaceTime)
  const setCarPosition = useGameStore((s) => s.setCarPosition)
  const completeLap = useGameStore((s) => s.completeLap)

  // Activate the correct level's track data
  setActiveLevel(selectedLevel)
  const track = getActiveTrack()

  const carConfig = cars[selectedCar]

  /* Keyboard listeners */
  useEffect(() => {
    const onDown = (e) => {
      pressedKeys[e.code] = true
      // C key toggles chase camera (cockpit removed)
    }
    const onUp = (e) => {
      pressedKeys[e.code] = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      Object.keys(pressedKeys).forEach((k) => delete pressedKeys[k])
    }
  }, [])

  /* Reset on car change or level change */
  useEffect(() => {
    if (carRef.current) {
      carRef.current.position.set(track.spawn[0], 0.85, track.spawn[1])
      carRef.current.rotation.set(0, 0, 0)
      velocity.current = 0
      lateralVel.current = 0
      prevZ.current = track.spawn[1]
      hasLeftStart.current = false
      lapStartTime.current = 0
      raceStartTimeRef.current = 0
      resetProgress()
    }
  }, [selectedCar, selectedLevel])

  /* ── Physics & camera — every frame (Phase 2) ────────────── */
  useFrame((state, delta) => {
    if (!carRef.current) return
    const car = carRef.current
    const dt = Math.min(delta, 0.05)

    const { topSpeed, handling, acceleration: accel } = carConfig
    const speedRatio = Math.min(1, (Math.abs(velocity.current) * SPEED_FEEL_MULT) / topSpeed)

    // ── Direction vectors ──────────────────────────────────────
    const fwdVec   = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion)
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(car.quaternion)

    // ── Camera (PRD §8) — chase camera ─────────────────────────
    {
      // Chase camera — smooth follow from behind and above
      const chaseOff = new THREE.Vector3(0, 7, -18)
      chaseOff.applyQuaternion(car.quaternion)
      const targetPos = car.position.clone().add(chaseOff)

      camera.position.lerp(targetPos, 4 * dt)
      camera.lookAt(car.position.x, car.position.y + 1.5, car.position.z)

      // Stronger speed impression at high velocity
      const targetFov = THREE.MathUtils.lerp(62, 80, speedRatio * speedRatio)
      fovRef.current = THREE.MathUtils.lerp(fovRef.current, targetFov, 3 * dt)
      if (Math.abs(camera.fov - fovRef.current) > 0.3) {
        camera.fov = fovRef.current
        camera.updateProjectionMatrix()
      }
    }

    if (!raceStarted || raceFinished || paused) return

    // Record race start time
    if (raceStartTimeRef.current === 0) {
      raceStartTimeRef.current = state.clock.getElapsedTime()
      lapStartTime.current = state.clock.getElapsedTime()
    }

    // ── Input (keyboard + mobile touch) ──────────────────────
    const isFwd   = pressedKeys[keybinds.forward]  || pressedKeys['ArrowUp']    || touchKeys['ArrowUp']
    const isBack  = pressedKeys[keybinds.backward] || pressedKeys['ArrowDown']  || touchKeys['ArrowDown']
    const isLeft  = pressedKeys[keybinds.left]     || pressedKeys['ArrowLeft']  || touchKeys['ArrowLeft']
    const isRight = pressedKeys[keybinds.right]    || pressedKeys['ArrowRight'] || touchKeys['ArrowRight']
    const isBrake = pressedKeys[keybinds.brake]    || touchKeys['Space']

    // ── Acceleration ──────────────────────────────────────────
    if (isFwd)       velocity.current += accel * dt
    else if (isBack) velocity.current -= accel * 0.6 * dt

    // ── Braking ───────────────────────────────────────────────
    if (isBrake) velocity.current *= 1 - 5.5 * dt

    // ── Friction ──────────────────────────────────────────────
    if (!isFwd && !isBack && !isBrake) velocity.current *= 1 - 1.8 * dt

    // ── Clamp & silence ───────────────────────────────────────
    velocity.current = THREE.MathUtils.clamp(velocity.current, -topSpeed * 0.3, topSpeed)
    if (Math.abs(velocity.current) < 0.05) velocity.current = 0

    if (car.position.y < 0.85) car.position.y = 0.85

    // ── Steering — less responsive at high speed (F1 feel) ────
    const steerSensitivity = handling * Math.min(speedRatio * 3, 1) * (1 - speedRatio * 0.28)
    const steerAmt  = steerSensitivity * dt
    const steerSign = velocity.current >= 0 ? 1 : -1
    if (isLeft)  car.rotation.y += steerAmt * steerSign
    if (isRight) car.rotation.y -= steerAmt * steerSign

    // ── Grip simulation — lateral inertia (PRD §7) ────────────
    // gripFactor: 0.45 (loose) → 0.85 (locked-in)
    const gripFactor = THREE.MathUtils.clamp(handling / 5.5, 0.45, 0.85)
    if ((isLeft || isRight) && Math.abs(velocity.current) > 2) {
      const slideForce = Math.abs(velocity.current) * steerAmt * 0.22 * (1 - gripFactor)
      lateralVel.current += (isRight ? -1 : 1) * slideForce
    }
    // Grip bleeds off lateral velocity each frame
    lateralVel.current *= Math.pow(1 - gripFactor, 60 * dt)
    lateralVel.current = THREE.MathUtils.clamp(lateralVel.current, -6, 6)

    // ── Movement (forward + lateral drift component) ───────────
    // Save pre-move position for rollback if we overshoot a barrier
    const prevPosX = car.position.x
    const prevPosZ = car.position.z

    car.position.addScaledVector(fwdVec, velocity.current * dt * SPEED_FEEL_MULT)
    car.position.addScaledVector(rightVec, lateralVel.current * dt)
    car.position.y = 0.85

    // ── Barrier collision ─────────────────────────────────────
    // Use local search around last known track segment to avoid snapping
    // to the wrong part of the track on tight curves.
    const hint = lastFrameIdx.current >= 0 ? lastFrameIdx.current : undefined
    const info = nearestTrackInfo(car.position.x, car.position.z, hint)
    lastFrameIdx.current = info.frameIdx

    const absDist = Math.abs(info.signedDist)
    const maxDist = WALL_D - 1.5

    if (absDist > maxDist) {
      const sign = info.signedDist > 0 ? 1 : -1
      const penetration = absDist - maxDist

      // Clamp push-back to a reasonable max per frame to avoid jitter
      const pushAmt = Math.min(penetration + 0.12, 2.0)
      car.position.x -= info.nx * pushAmt * sign
      car.position.z -= info.nz * pushAmt * sign

      // How head-on is the hit (0 = parallel, 1 = perpendicular)
      const wnx = info.nx * sign
      const wnz = info.nz * sign
      const fwdDotN = fwdVec.x * wnx + fwdVec.z * wnz
      const hitAngle = Math.abs(fwdDotN)

      // Velocity damping: glancing = keep most speed, head-on = big loss
      if (hitAngle > 0.05) {
        const damping = THREE.MathUtils.lerp(0.95, 0.4, hitAngle)
        velocity.current *= damping
      }

      // Damp lateral velocity toward wall
      lateralVel.current *= 0.2

      // If still outside after correction, hard rollback
      const recheck = nearestTrackInfo(car.position.x, car.position.z, info.frameIdx)
      if (Math.abs(recheck.signedDist) > WALL_D - 0.8) {
        car.position.x = prevPosX
        car.position.z = prevPosZ
        velocity.current *= 0.6
        lateralVel.current = 0
      }
    }

    // ── Store updates ─────────────────────────────────────────
    setSpeed(Math.abs(velocity.current))
    setRaceTime(state.clock.getElapsedTime() - raceStartTimeRef.current)
    setCarPosition(car.position.x, car.position.z, car.rotation.y)
    audioManager.updateEngineSound(Math.abs(velocity.current), topSpeed)

    // ── Gear-shift SFX ────────────────────────────────────────
    const spd = Math.abs(velocity.current)
    const r = spd / topSpeed
    const curGear = spd < 0.5 ? 'N'
      : r < 0.16 ? 1 : r < 0.32 ? 2 : r < 0.50 ? 3
      : r < 0.67 ? 4 : r < 0.84 ? 5 : 6
    if (curGear !== prevGearRef.current) {
      if (prevGearRef.current !== 'N' && curGear !== 'N') audioManager.playGearShift()
      prevGearRef.current = curGear
    }

    // ── Tire screech SFX ──────────────────────────────────────
    const slip = Math.abs(lateralVel.current)
    if (slip > 4.5 && raceStarted) {
      audioManager.playTireScreech(Math.min((slip - 4.5) / 8, 1))
    }

    // ── Player race progress (for leaderboard) ────────────────
    playerProgress.t   = lastFrameIdx.current / SAMPLES
    playerProgress.lap = useGameStore.getState().currentLap

    // ── Lap detection   ─────────────────────────────────────────
    const x = car.position.x
    const z = car.position.z

    if (!hasLeftStart.current) {
      if (z > track.sfLeaveZ || z < -track.sfLeaveZ) hasLeftStart.current = true
    }

    if (hasLeftStart.current
      && x > track.sfX - track.sfRange && x < track.sfX + track.sfRange
      && prevZ.current < 0 && z >= 0) {
      const now = state.clock.getElapsedTime()
      const lt = now - lapStartTime.current
      if (lt > 3) {
        completeLap(lt)
        lapStartTime.current = now
        hasLeftStart.current = false
      }
    }
    prevZ.current = z

    // ── Body pitch & roll animation ─────────────────────────
    const accelInput = isFwd ? 1 : isBrake ? -1 : isBack ? -0.6 : 0
    const pitchTarget = -accelInput * 0.035 * Math.min(speedRatio + 0.3, 1)
    bodyPitch.current = THREE.MathUtils.lerp(bodyPitch.current, pitchTarget, 6 * dt)

    const steerInput = isLeft ? 1 : isRight ? -1 : 0
    const rollTarget = steerInput * 0.04 * Math.min(speedRatio * 1.5, 1)
    bodyRoll.current = THREE.MathUtils.lerp(bodyRoll.current, rollTarget, 5 * dt)

    if (bodyGroupRef.current) {
      bodyGroupRef.current.rotation.x = bodyPitch.current
      bodyGroupRef.current.rotation.z = bodyRoll.current
    }
  })

  return (
    <>
      <group ref={carRef} position={[track.spawn[0], 0.5, track.spawn[1]]}>
        <group ref={bodyGroupRef}>
          <CarModel color={carConfig.color} modelPath={carConfig.model} modelScale={carConfig.scale} modelRotY={carConfig.modelRotY} modelPosY={carConfig.modelPosY} />
          <CarLights velocityRef={velocity} />
        </group>
      </group>
      <TireSmoke carRef={carRef} lateralVelRef={lateralVel} raceStarted={raceStarted} />
      <SkidMarks carRef={carRef} lateralVelRef={lateralVel} raceStarted={raceStarted} />
      <SpeedLines carRef={carRef} velocityRef={velocity} />
    </>
  )
}

/*

 ttyrdrty ytrd ytrdytrtrdtrdyrtdytd ytrd tr eur toiwuer tiuehr tiuhertiueriohoirht 
kdjsf ho iu he oiuh iweuhrt iuhe r

*/