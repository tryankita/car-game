import { useMemo } from 'react'
import useGameStore from '../../store'
import { getActiveTrack, setActiveLevel } from '../../trackData'

function fmt(seconds) {
  if (!seconds || !isFinite(seconds)) return '--:--.---'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

/* ── Minimap constants ────────────────────────────────────── */
const MAP_SIZE = 160
const PAD = 14

/* ── Minimap component ────────────────────────────────────── */
function Minimap() {
  const carPos = useGameStore((s) => s.carPosition)
  const selectedLevel = useGameStore((s) => s.selectedLevel)

  const { trackPath, sfSvg, toSvg } = useMemo(() => {
    setActiveLevel(selectedLevel)
    const track = getActiveTrack()
    const cp = track.cp

    const allX = cp.map(p => p[0])
    const allZ = cp.map(p => p[1])
    const minX = Math.min(...allX), maxX = Math.max(...allX)
    const minZ = Math.min(...allZ), maxZ = Math.max(...allZ)
    const rangeX = maxX - minX || 1
    const rangeZ = maxZ - minZ || 1
    const sc = (MAP_SIZE - PAD * 2) / Math.max(rangeX, rangeZ)
    const oX = PAD + (MAP_SIZE - PAD * 2 - rangeX * sc) / 2
    const oZ = PAD + (MAP_SIZE - PAD * 2 - rangeZ * sc) / 2

    function toSvg(wx, wz) {
      return [oX + (wx - minX) * sc, oZ + (wz - minZ) * sc]
    }

    // Build smooth closed SVG path (Catmull-Rom → cubic Bézier)
    const pts = cp.map(([x, z]) => toSvg(x, z))
    const n = pts.length
    const tension = 0.3
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} `
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n]
      const p1 = pts[i]
      const p2 = pts[(i + 1) % n]
      const p3 = pts[(i + 2) % n]
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension
      d += `C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} `
    }
    d += 'Z'

    const sfSvg = toSvg(track.sfX, 0)

    return { trackPath: d, sfSvg, toSvg }
  }, [selectedLevel])

  const [cx, cy] = toSvg(carPos.x, carPos.z)

  return (
    <div style={minimapContainer}>
      <svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
        {/* Track outline */}
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={trackPath} fill="none" stroke="rgba(100,100,100,0.6)" strokeWidth="5"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Centre line */}
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"
          strokeDasharray="3 4" />
        {/* Start/Finish mark */}
        <rect x={sfSvg[0] - 3} y={sfSvg[1] - 1.5} width={6} height={3}
          fill="white" opacity={0.7} rx={0.5} />
        {/* Car dot */}
        <circle cx={cx} cy={cy} r={4} fill="#00ccff"
          stroke="#fff" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={7} fill="none"
          stroke="rgba(0,204,255,0.35)" strokeWidth={1} />
      </svg>
      {/* Label */}
      <div style={minimapLabel}>MAP</div>
    </div>
  )
}

const minimapContainer = {
  position: 'absolute',
  top: '5rem',
  right: '1rem',
  width: MAP_SIZE + 'px',
  height: MAP_SIZE + 'px',
  background: 'rgba(0, 0, 0, 0.55)',
  backdropFilter: 'blur(6px)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  overflow: 'hidden',
  pointerEvents: 'none',
}

const minimapLabel = {
  position: 'absolute',
  bottom: '4px',
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '0.55rem',
  color: 'rgba(255,255,255,0.35)',
  letterSpacing: '0.2em',
  fontFamily: "'Orbitron', sans-serif",
}

export default function HUD() {
  const speed = useGameStore((s) => s.speed)
  const raceTime = useGameStore((s) => s.raceTime)
  const currentLap = useGameStore((s) => s.currentLap)
  const totalLaps = useGameStore((s) => s.totalLaps)
  const bestLap = useGameStore((s) => s.bestLap)
  const countdown = useGameStore((s) => s.countdown)
  const raceStarted = useGameStore((s) => s.raceStarted)
  const raceFinished = useGameStore((s) => s.raceFinished)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: "'Orbitron', sans-serif",
      }}
    >
      {/* ── Countdown ──────────────────────────────────────── */}
      {countdown > 0 && (
        <div style={centerMsg}>
          <span
            style={{
              fontSize: '8rem',
              color: countdown === 1 ? '#2ecc71' : '#e74c3c',
              textShadow: `0 0 50px ${countdown === 1 ? '#2ecc71' : '#e74c3c'}`,
              fontWeight: 900,
            }}
          >
            {countdown}
          </span>
        </div>
      )}

      {/* ── GO! flash ──────────────────────────────────────── */}
      {countdown === 0 && raceStarted && raceTime < 1 && (
        <div style={centerMsg}>
          <span
            style={{
              fontSize: '5rem',
              color: '#2ecc71',
              textShadow: '0 0 50px #2ecc71',
              fontWeight: 900,
            }}
          >
            GO!
          </span>
        </div>
      )}

      {/* ── Speed ──────────────────────────────────────────── */}
      {raceStarted && (
        <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', textAlign: 'right' }}>
          <div style={{ fontSize: '3.5rem', color: '#fff', fontWeight: 900, lineHeight: 1 }}>
            {Math.round(speed * 3.6)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888', letterSpacing: '0.15em' }}>KM/H</div>
        </div>
      )}

      {/* ── Time & Lap ─────────────────────────────────────── */}
      {raceStarted && (
        <div
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', color: '#fff', fontWeight: 700 }}>{fmt(raceTime)}</div>
          <div
            style={{ fontSize: '1rem', color: '#e74c3c', marginTop: '0.3rem', letterSpacing: '0.2em' }}
          >
            LAP {Math.min(currentLap + 1, totalLaps)} / {totalLaps}
          </div>
        </div>
      )}

      {/* ── Best Lap ───────────────────────────────────────── */}
      {raceStarted && isFinite(bestLap) && (
        <div style={{ position: 'absolute', top: '1.5rem', right: '12rem', textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '0.15em' }}>BEST LAP</div>
          <div style={{ fontSize: '1.2rem', color: '#2ecc71', fontWeight: 700 }}>{fmt(bestLap)}</div>
        </div>
      )}

      {/* ── Minimap ────────────────────────────────────── */}
      {raceStarted && <Minimap />}

      {/* ── Controls hint ──────────────────────────────────── */}
      {raceStarted && raceTime < 5 && (
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '2rem',
            color: '#666',
            fontSize: '0.7rem',
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: '0.1em',
          }}
        >
          WASD / Arrows &mdash; Space to brake
        </div>
      )}

      {/* Race finish is handled by RaceFinish component */}
    </div>
  )
}

const centerMsg = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
}
