import { useRef, useEffect, Suspense, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../store'
import audioManager from '../audioManager'

const pressedKeys = {}

const MODEL_PATH = '/models/muscle_car.glb'

/* ── GLB Car Model ─────────────────────────────────────────── */
function GLBCarModel({ color }) {
  const { scene } = useGLTF(MODEL_PATH)

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
      scale={1.5}
      rotation={[0, 0, 0]}
      position={[0, 0, 0]}
    />
  )
}

/* ── Fallback box car (shown while model loads) ────────────── */
function FallbackCar({ color }) {
  return (
    <group>
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
function CarModel({ color }) {
  return (
    <Suspense fallback={<FallbackCar color={color} />}>
      <GLBCarModel color={color} />
    </Suspense>
  )
}

// Preload the model
useGLTF.preload(MODEL_PATH)

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
  const cars = useGameStore((s) => s.cars)
  const raceStarted = useGameStore((s) => s.raceStarted)
  const raceFinished = useGameStore((s) => s.raceFinished)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const setRaceTime = useGameStore((s) => s.setRaceTime)
  const completeLap = useGameStore((s) => s.completeLap)

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

  /* Reset on car change */
  useEffect(() => {
    if (carRef.current) {
      carRef.current.position.set(70, 0, 0)
      carRef.current.rotation.set(0, 0, 0)
      velocity.current = 0
      prevZ.current = 0
      hasLeftStart.current = false
      lapStartTime.current = 0
      raceStartTimeRef.current = 0
    }
  }, [selectedCar])

  /* Physics & camera — every frame */
  useFrame((state, delta) => {
    if (!carRef.current) return
    const car = carRef.current
    const dt = Math.min(delta, 0.05)

    // Camera follow even when not racing
    const camOff = new THREE.Vector3(0, 7, -15)
    camOff.applyQuaternion(car.quaternion)
    camera.position.lerp(car.position.clone().add(camOff), 4 * dt)
    camera.lookAt(car.position.x, 1, car.position.z)

    if (!raceStarted || raceFinished) return

    // Record race start time
    if (raceStartTimeRef.current === 0) {
      raceStartTimeRef.current = state.clock.getElapsedTime()
      lapStartTime.current = state.clock.getElapsedTime()
    }

    const { topSpeed, handling, acceleration: accel } = carConfig

    // --- Input ---
    const fwd = pressedKeys['KeyW'] || pressedKeys['ArrowUp']
    const back = pressedKeys['KeyS'] || pressedKeys['ArrowDown']
    const left = pressedKeys['KeyA'] || pressedKeys['ArrowLeft']
    const right = pressedKeys['KeyD'] || pressedKeys['ArrowRight']
    const brake = pressedKeys['Space']

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

    // Off-track slowdown (inside or outside the ring road)
    const distFromCenter = Math.sqrt(car.position.x ** 2 + car.position.z ** 2)
    if (distFromCenter < 50 || distFromCenter > 90) {
      velocity.current *= 1 - 3 * dt
    }

    // Steering
    const speedRatio = Math.abs(velocity.current) / topSpeed
    const steerAmt = handling * dt * Math.min(speedRatio * 3, 1)
    const steerSign = velocity.current >= 0 ? 1 : -1
    if (left) car.rotation.y += steerAmt * steerSign
    if (right) car.rotation.y -= steerAmt * steerSign

    // Movement
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion)
    car.position.addScaledVector(forward, velocity.current * dt)
    car.position.y = 0

    // Store updates
    setSpeed(Math.abs(velocity.current))
    setRaceTime(state.clock.getElapsedTime() - raceStartTimeRef.current)

    // Update engine sound based on speed
    audioManager.updateEngineSound(Math.abs(velocity.current), topSpeed)

    // --- Lap detection ---
    const x = car.position.x
    const z = car.position.z

    if (!hasLeftStart.current) {
      if (Math.sqrt((x - 70) ** 2 + z ** 2) > 30) hasLeftStart.current = true
    }

    if (hasLeftStart.current && x > 50 && x < 90 && prevZ.current < 0 && z >= 0) {
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
    <group ref={carRef} position={[70, 0, 0]}>
      <CarModel color={carConfig.color} />
    </group>
  )
}
