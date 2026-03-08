import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useGameStore from '../store'
import { makeCurve, setActiveLevel, getActiveTrack } from '../trackData'
import { AI_CONFIG, aiProgress, aiWorldPositions, resetProgress } from '../raceProgress'

const N = AI_CONFIG.length

// Pre-allocated scratch objects — avoids per-frame GC pressure
const _pos    = new THREE.Vector3()
const _tan    = new THREE.Vector3()
const _dummy  = new THREE.Object3D()
const _qY     = new THREE.Quaternion()
const _qZ     = new THREE.Quaternion()
const _wQ     = new THREE.Quaternion()
const _axisY  = new THREE.Vector3(0, 1, 0)
const _axisZ  = new THREE.Vector3(0, 0, 1)

const WHEEL_OFFSETS = [
  [-1.1, 0.28,  1.3],
  [ 1.1, 0.28,  1.3],
  [-1.1, 0.28, -1.3],
  [ 1.1, 0.28, -1.3],
]

// Transform local car-space offset to world space (Y-rotation only)
function carWorld(lx, ly, lz, cx, cz, ry) {
  const c = Math.cos(ry), s = Math.sin(ry)
  return [cx + c * lx - s * lz, 0.5 + ly, cz + s * lx + c * lz]
}

export default function AIRacers() {
  const bodyRef  = useRef()
  const cabinRef = useRef()
  const wheelRef = useRef()
  const tailRef  = useRef()

  const aiT       = useRef(AI_CONFIG.map((cfg) => cfg.startT))
  const aiLap     = useRef(AI_CONFIG.map(() => 0))
  const prevLevel = useRef(null)

  const raceStarted   = useGameStore((s) => s.raceStarted)
  const raceFinished  = useGameStore((s) => s.raceFinished)
  const paused        = useGameStore((s) => s.paused)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const selectedCar   = useGameStore((s) => s.selectedCar)
  const cars          = useGameStore((s) => s.cars)
  const totalLaps     = useGameStore((s) => s.totalLaps)

  setActiveLevel(selectedLevel)
  const track = getActiveTrack()

  const { curve, curveLength } = useMemo(() => {
    const c = makeCurve(track.cp)
    return { curve: c, curveLength: c.getLength() }
  }, [selectedLevel]) // eslint-disable-line react-hooks/exhaustive-deps

  if (prevLevel.current !== selectedLevel) {
    prevLevel.current = selectedLevel
    AI_CONFIG.forEach((cfg, i) => {
      aiT.current[i]   = cfg.startT
      aiLap.current[i] = 0
    })
    resetProgress()
  }

  const playerTopSpeed = cars[selectedCar]?.topSpeed ?? 55

  // Geometries & materials
  const bodyGeo  = useMemo(() => new THREE.BoxGeometry(1.9, 0.48, 4.0), [])
  const cabinGeo = useMemo(() => new THREE.BoxGeometry(1.5, 0.42, 1.8), [])
  const wheelGeo = useMemo(() => new THREE.CylinderGeometry(0.3, 0.3, 0.24, 10), [])
  const tailGeo  = useMemo(() => new THREE.BoxGeometry(1.5, 0.12, 0.05), [])
  const carMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white', metalness: 0.65, roughness: 0.3 }), [])
  const wheelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a' }), [])
  const tailMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 1.5 }), [])

  // Write all 4 instanced meshes for car i at world position (cx, cz) with heading ry
  function writeCar(i, cx, cz, ry) {
    _qY.setFromAxisAngle(_axisY, ry)

    // Body
    const [bx,,bz] = carWorld(0, 0.55, 0, cx, cz, ry)
    _dummy.position.set(bx, 0.5 + 0.55, bz)
    _dummy.quaternion.copy(_qY)
    _dummy.scale.set(1, 1, 1)
    _dummy.updateMatrix()
    bodyRef.current?.setMatrixAt(i, _dummy.matrix)

    // Cabin
    const [cabX,,cabZ] = carWorld(0, 0.98, -0.2, cx, cz, ry)
    _dummy.position.set(cabX, 0.5 + 0.98, cabZ)
    _dummy.updateMatrix()
    cabinRef.current?.setMatrixAt(i, _dummy.matrix)

    // Wheels — combined rotation: Y(ry) * Z(PI/2)
    _qZ.setFromAxisAngle(_axisZ, Math.PI / 2)
    _wQ.multiplyQuaternions(_qY, _qZ)
    WHEEL_OFFSETS.forEach(([lx, ly, lz], j) => {
      const [wx,,wz] = carWorld(lx, ly, lz, cx, cz, ry)
      _dummy.position.set(wx, 0.5 + ly, wz)
      _dummy.quaternion.copy(_wQ)
      _dummy.updateMatrix()
      wheelRef.current?.setMatrixAt(i * 4 + j, _dummy.matrix)
    })

    // Tail light
    const [tx,,tz] = carWorld(0, 0.7, -2.05, cx, cz, ry)
    _dummy.position.set(tx, 0.5 + 0.7, tz)
    _dummy.quaternion.copy(_qY)
    _dummy.updateMatrix()
    tailRef.current?.setMatrixAt(i, _dummy.matrix)
  }

  function flushAll() {
    [bodyRef, cabinRef, wheelRef, tailRef].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true
    })
  }

  // Set per-instance colors and initial positions after mount
  useEffect(() => {
    const col = new THREE.Color()
    AI_CONFIG.forEach((cfg, i) => {
      col.set(cfg.color)
      bodyRef.current?.setColorAt(i, col)
      cabinRef.current?.setColorAt(i, col)
    })
    if (bodyRef.current?.instanceColor)  bodyRef.current.instanceColor.needsUpdate  = true
    if (cabinRef.current?.instanceColor) cabinRef.current.instanceColor.needsUpdate = true

    // Spawn at starting positions
    AI_CONFIG.forEach((cfg, i) => {
      curve.getPointAt(cfg.startT, _pos)
      curve.getTangentAt(cfg.startT, _tan)
      writeCar(i, _pos.x, _pos.z, Math.atan2(-_tan.x, _tan.z))
    })
    flushAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (!raceStarted || raceFinished || paused) return
    const dt = Math.min(delta, 0.05)

    AI_CONFIG.forEach((cfg, i) => {
      aiT.current[i] += (playerTopSpeed * cfg.speedFactor * dt) / curveLength
      if (aiT.current[i] >= 1) {
        aiT.current[i] -= 1
        if (aiLap.current[i] < totalLaps) aiLap.current[i]++
      }
      aiProgress[i].t        = aiT.current[i]
      aiProgress[i].lap      = aiLap.current[i]

      curve.getPointAt(aiT.current[i], _pos)
      curve.getTangentAt(aiT.current[i], _tan)
      // Write world position for minimap
      aiWorldPositions[i].x = _pos.x
      aiWorldPositions[i].z = _pos.z
      writeCar(i, _pos.x, _pos.z, Math.atan2(-_tan.x, _tan.z))
    })
    flushAll()
  })

  return (
    <>
      <instancedMesh ref={bodyRef}  geometry={bodyGeo}  material={carMat}   count={N}     castShadow />
      <instancedMesh ref={cabinRef} geometry={cabinGeo} material={carMat}   count={N}     castShadow />
      <instancedMesh ref={wheelRef} geometry={wheelGeo} material={wheelMat} count={N * 4} castShadow />
      <instancedMesh ref={tailRef}  geometry={tailGeo}  material={tailMat}  count={N} />
    </>
  )
}
