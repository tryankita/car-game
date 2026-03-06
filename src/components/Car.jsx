import { useRef, useEffect, Suspense, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../store'
import audioManager from '../audioManager'
import { nearestTrackInfo, WALL_D, setActiveLevel, getActiveTrack } from '../trackData'
import { nightFactorRef } from './Lighting'

const pressedKeys = {}

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

/* ── Main Car component ────────────────────────────────────── */
export default function Car() {
  const carRef = useRef()
  const velocity = useRef(0)
  const { camera } = useThree()
  const prevZ = useRef(0)
  const lapStartTime = useRef(0)
  const hasLeftStart = useRef(false)
  const raceStartTimeRef = useRef(0)

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
      carRef.current.position.set(track.spawn[0], 0.5, track.spawn[1])
      carRef.current.rotation.set(0, 0, 0)
      velocity.current = 0
      prevZ.current = track.spawn[1]
      hasLeftStart.current = false
      lapStartTime.current = 0
      raceStartTimeRef.current = 0
    }
  }, [selectedCar, selectedLevel])

  /* Physics & camera — every frame  jg uyfyfuytf  */
  useFrame((state, delta) => {
    if (!carRef.current) return
    const car = carRef.current
    const dt = Math.min(delta, 0.05)

    // Camera follow even when not racing
    const camOff = new THREE.Vector3(0, 7, -15)
    camOff.applyQuaternion(car.quaternion)
    camera.position.lerp(car.position.clone().add(camOff), 4 * dt)
    camera.lookAt(car.position.x, 1, car.position.z)

    if (!raceStarted || raceFinished || paused) return

    // Record race start time
    if (raceStartTimeRef.current === 0) {
      raceStartTimeRef.current = state.clock.getElapsedTime()
      lapStartTime.current = state.clock.getElapsedTime()
    }

    const { topSpeed, handling, acceleration: accel } = carConfig

    // --- Input (using customizable keybinds) ---
    const fwd = pressedKeys[keybinds.forward] || pressedKeys['ArrowUp']
    const back = pressedKeys[keybinds.backward] || pressedKeys['ArrowDown']
    const left = pressedKeys[keybinds.left] || pressedKeys['ArrowLeft']
    const right = pressedKeys[keybinds.right] || pressedKeys['ArrowRight']
    const brake = pressedKeys[keybinds.brake]

    // Acceleration
    if (fwd) velocity.current += accel * dt
    else if (back) velocity.current -= accel * 0.6 * dt

    // Brake
    if (brake) velocity.current *= 1 - 5 * dt

    // Friction
    if (!fwd && !back) velocity.current *= 1 - 1.5 * dt

    // Clamp
    velocity.current = THREE.MathUtils.clamp(velocity.current, -topSpeed * 0.3, topSpeed)
    if (Math.abs(velocity.current) < 0.05) velocity.current = 0

    // Keep car above ground
    if (car.position.y < 0.5) car.position.y = 0.5

    // Steering
    const speedRatio = Math.abs(velocity.current) / topSpeed
    const steerAmt = handling * dt * Math.min(speedRatio * 3, 1)
    const steerSign = velocity.current >= 0 ? 1 : -1
    if (left) car.rotation.y += steerAmt * steerSign
    if (right) car.rotation.y -= steerAmt * steerSign

    // Movement
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion)
    car.position.addScaledVector(forward, velocity.current * dt)
    car.position.y = 0.5

    // ── Barrier collision (slide along walls) ────────────────
    const info = nearestTrackInfo(car.position.x, car.position.z)
    const absDist = Math.abs(info.signedDist)
    const maxDist = WALL_D - 1.4  // car half-width buffer

    if (absDist > maxDist) {
      // 1) Clamp position back to wall surface
      const sign = info.signedDist > 0 ? 1 : -1
      const push = absDist - maxDist + 0.05        // small extra margin
      car.position.x -= info.nx * push * sign
      car.position.z -= info.nz * push * sign

      // 2) Remove the velocity component going INTO the wall
      //    so the car slides along it instead of getting stuck
      const wallNx = info.nx * sign
      const wallNz = info.nz * sign
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion)
      const dotIntoWall = fwd.x * wallNx + fwd.z * wallNz
      if ((dotIntoWall > 0 && velocity.current > 0) ||
          (dotIntoWall < 0 && velocity.current < 0)) {
        // Reduce speed proportional to how head-on the collision is
        const factor = Math.abs(dotIntoWall)   // 0 = parallel, 1 = head-on
        velocity.current *= Math.max(1 - factor * 0.85, 0.08)
      }
    }

    // Store updates
    setSpeed(Math.abs(velocity.current))
    setRaceTime(state.clock.getElapsedTime() - raceStartTimeRef.current)
    setCarPosition(car.position.x, car.position.z, car.rotation.y)

    // Update engine sound based on speed relative to top speed (0 to 1)
    audioManager.updateEngineSound(Math.abs(velocity.current), topSpeed)

    // --- Lap detection (cross Z=0 on the start straight) ---
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
  })

  return (
    <group ref={carRef} position={[track.spawn[0], 0.5, track.spawn[1]]}>
      <CarModel color={carConfig.color} modelPath={carConfig.model} modelScale={carConfig.scale} modelRotY={carConfig.modelRotY} modelPosY={carConfig.modelPosY} />
      <CarLights velocityRef={velocity} />
    </group>
  )
}
