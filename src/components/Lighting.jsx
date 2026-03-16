// Shared night factor — always 0 (permanent daytime)
// Still exported so Car.jsx / Track.jsx that reference it don't break
export const nightFactorRef = { current: 0 }

/* ═══════════════════════════════════════════════════════════════
   DAYTIME LIGHTING  (PRD §6)
   Strong directional sun + soft ambient fill + sky hemisphere.
   No day/night cycle — the game is always set at bright midday.
   ═══════════════════════════════════════════════════════════════ */
export default function Lighting({ lowQuality = false }) {
  return (
    <>
      {/* Soft fill — prevents any surface going pitch black */}
      <ambientLight intensity={0.55} color="#dce8f0" />

      {/* Sky / ground hemisphere — gives blue sky tint on top surfaces */}
      <hemisphereLight args={['#87ceeb', '#3d6b35', 0.7]} />

      {/* Primary SUN — angled across the track for strong shadows */}
      <directionalLight
        position={[150, 200, 100]}
        intensity={2.2}
        color="#fff8e8"
        castShadow={!lowQuality}
        shadow-mapSize-width={lowQuality ? 1024 : 4096}
        shadow-mapSize-height={lowQuality ? 1024 : 4096}
        shadow-camera-far={600}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={350}
        shadow-camera-bottom={-300}
        shadow-bias={-0.0003}
      />

      {/* Secondary fill light — softens shadow harshness on the opposite side */}
      <directionalLight
        position={[-80, 60, -120]}
        intensity={0.35}
        color="#c8d8f0"
      />
    </>
  )
}
