export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#87ceeb', '#2d5a27', 0.5]} />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={250}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
    </>
  )
}
