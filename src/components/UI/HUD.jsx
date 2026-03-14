import { useMemo, useEffect, useState } from 'react'
import useGameStore from '../../store'
import { getActiveTrack, setActiveLevel } from '../../trackData'
import { aiProgress, aiWorldPositions, playerProgress } from '../../raceProgress'

function fmt(seconds) {
  if (!seconds || !isFinite(seconds)) return '--:--.---'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

function fmtShort(seconds) {
  if (!seconds || !isFinite(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  const ms = Math.floor((seconds % 1) * 100).toString().padStart(2, '0')
  return `${m}:${s}.${ms}`
}

// â”€â”€ Speedometer arc helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function arcPath(cx, cy, r, startDeg, endDeg) {
  const rad = d => d * Math.PI / 180
  const sx = cx + r * Math.cos(rad(startDeg))
  const sy = cy + r * Math.sin(rad(startDeg))
  const ex = cx + r * Math.cos(rad(endDeg))
  const ey = cy + r * Math.sin(rad(endDeg))
  const large = (endDeg - startDeg) > 180 ? 1 : 0
  return `M${sx.toFixed(2)} ${sy.toFixed(2)} A${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

function getGear(speed, topSpeed) {
  if (speed < 0.5) return 'N'
  const r = speed / topSpeed
  if (r < 0.16) return 1
  if (r < 0.32) return 2
  if (r < 0.50) return 3
  if (r < 0.67) return 4
  if (r < 0.84) return 5
  return 6
}

/* â”€â”€ F1 Speedometer (bottom-right) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Speedometer({ speed, topSpeed }) {
  const ratio  = Math.min(speed / topSpeed, 1)
  const kmh    = Math.round(speed * 3.6)
  const gear   = getGear(speed, topSpeed)
  const CX = 70, CY = 70, R_out = 58, R_in = 46
  const START  = 150
  const SWEEP  = 240
  const fillEnd = START + ratio * SWEEP
  const trackArc = arcPath(CX, CY, R_out, START, START + SWEEP)
  const fillArc  = ratio > 0.004 ? arcPath(CX, CY, R_out, START, fillEnd) : null
  const speedColor = ratio < 0.55
    ? `hsl(${144 - ratio * 30}, 90%, 55%)`
    : ratio < 0.82
      ? `hsl(${54 - (ratio - 0.55) * 90}, 95%, 55%)`
      : '#ff3d3d'

  // Tick marks at 0%, 25%, 50%, 75%, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const deg = START + t * SWEEP
    const rad = deg * Math.PI / 180
    const x1 = CX + R_in  * Math.cos(rad)
    const y1 = CY + R_in  * Math.sin(rad)
    const x2 = CX + (R_out + 4) * Math.cos(rad)
    const y2 = CY + (R_out + 4) * Math.sin(rad)
    return { x1, y1, x2, y2 }
  })

  return (
    <div style={spedometerWrap}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {/* Background ring */}
        <path d={trackArc} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} strokeLinecap="butt" />
        {/* Fill ring */}
        {fillArc && (
          <path d={fillArc} fill="none" stroke={speedColor} strokeWidth={12}
            strokeLinecap="butt"
            style={{ filter: `drop-shadow(0 0 4px ${speedColor})` }} />
        )}
        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1.toFixed(2)} y1={t.y1.toFixed(2)}
            x2={t.x2.toFixed(2)} y2={t.y2.toFixed(2)}
            stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
        ))}
        {/* Speed number */}
        <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="26" fontWeight="900" fontFamily="'Orbitron', sans-serif">
          {kmh}
        </text>
        {/* KM/H label */}
        <text x={CX} y={CY + 24} textAnchor="middle"
          fill="rgba(255,255,255,0.4)" fontSize="7.5" fontFamily="'Orbitron', sans-serif"
          letterSpacing="1.5">KM/H</text>
      </svg>
      {/* Gear panel â€” sits just below the arc bottom */}
      <div style={gearWrap}>
        <span style={gearLabel}>GEAR</span>
        <span style={{ ...gearNum, color: speedColor }}>{gear}</span>
      </div>
    </div>
  )
}

const spedometerWrap = {
  position: 'absolute',
  bottom: '1.8rem',
  right: '1.8rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
}
const gearWrap = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  background: 'rgba(0,0,0,0.55)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  padding: '3px 10px',
  backdropFilter: 'blur(6px)',
}
const gearLabel = {
  fontSize: '0.52rem',
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.18em',
  fontFamily: "'Orbitron', sans-serif",
}
const gearNum = {
  fontSize: '1.55rem',
  fontWeight: 900,
  fontFamily: "'Orbitron', sans-serif",
  lineHeight: 1,
  minWidth: '1ch',
  textAlign: 'center',
}

/* dynamic Leaderboard — live-sorted race positions */
function Leaderboard() {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    function compute() {
      const all = [
        { name: 'YOU', sort: playerProgress.lap + playerProgress.t, isPlayer: true },
        ...aiProgress.map((ai) => ({ name: ai.name, sort: ai.lap + ai.t, isPlayer: false })),
      ]
      all.sort((a, b) => b.sort - a.sort)
      setEntries(all)
    }
    compute()
    const id = setInterval(compute, 600)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={lbPanel}>
      <div style={lbTitle}>RACE</div>
      {entries.map((e, i) => (
        <div key={e.name} style={e.isPlayer
          ? { ...lbRow, background: 'rgba(0,230,118,0.12)', borderColor: 'rgba(0,230,118,0.45)' }
          : lbRow}>
          <span style={lbPos}>P{i + 1}</span>
          <span style={{ ...lbName, color: e.isPlayer ? '#00e676' : 'rgba(255,255,255,0.8)' }}>{e.name}</span>
          {e.isPlayer && <span style={lbDot} />}
        </div>
      ))}
    </div>
  )
}

const lbPanel = {
  position: 'absolute',
  top: '50%',
  left: '1.2rem',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
  background: 'rgba(0,0,0,0.52)',
  backdropFilter: 'blur(8px)',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '8px 8px',
  minWidth: '130px',
  pointerEvents: 'none',
}
const lbTitle = {
  fontSize: '0.52rem',
  color: 'rgba(255,255,255,0.35)',
  letterSpacing: '0.25em',
  fontFamily: "'Orbitron', sans-serif",
  textAlign: 'center',
  paddingBottom: '4px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  marginBottom: '2px',
}
const lbRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '3px 6px',
  borderRadius: '5px',
  border: '1px solid transparent',
}
const lbPos = {
  fontSize: '0.6rem',
  color: 'rgba(255,255,255,0.5)',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  minWidth: '22px',
}
const lbName = {
  fontSize: '0.65rem',
  color: 'rgba(255,255,255,0.8)',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  letterSpacing: '0.04em',
  flex: 1,
}
const lbDot = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#00e676',
  flexShrink: 0,
}

/* â”€â”€ Lap / BestLap panel (top-right) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function LapPanel({ currentLap, totalLaps, bestLap }) {
  return (
    <div style={lapPanel}>
      {/* Current lap */}
      <div style={lapSection}>
        <span style={lapSectionLabel}>LAP</span>
        <span style={lapSectionValue}>{Math.min(currentLap + 1, totalLaps)}<span style={lapTotal}>/{totalLaps}</span></span>
      </div>
      <div style={lapDivider} />
      {/* Best lap */}
      <div style={lapSection}>
        <span style={lapSectionLabel}>BEST</span>
        <span style={{ ...lapSectionValue, fontSize: '0.88rem', color: isFinite(bestLap) ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
          {isFinite(bestLap) ? fmtShort(bestLap) : '--:--.--'}
        </span>
      </div>
    </div>
  )
}

const lapPanel = {
  position: 'absolute',
  top: '1.8rem',
  right: '1.8rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  background: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(8px)',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '8px 14px',
  minWidth: '110px',
  pointerEvents: 'none',
}
const lapSection = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '2px 0',
}
const lapSectionLabel = {
  fontSize: '0.52rem',
  color: 'rgba(255,255,255,0.38)',
  fontFamily: "'Orbitron', sans-serif",
  letterSpacing: '0.2em',
}
const lapSectionValue = {
  fontSize: '1.15rem',
  fontWeight: 900,
  color: 'white',
  fontFamily: "'Orbitron', sans-serif",
  lineHeight: 1.1,
}
const lapTotal = {
  fontSize: '0.65rem',
  color: 'rgba(255,255,255,0.4)',
  fontWeight: 400,
}
const lapDivider = {
  height: '1px',
  background: 'rgba(255,255,255,0.08)',
  margin: '4px 0',
}

/* â”€â”€ Minimap constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const MAP_SIZE = 150
const PAD = 14

/* â”€â”€ Minimap component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Minimap() {
  const carPos = useGameStore((s) => s.carPosition)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const [aiDots, setAiDots] = useState([])

  // Poll AI world positions at ~10 Hz for minimap dots
  useEffect(() => {
    function updateDots() {
      setAiDots(aiWorldPositions.map((p) => ({ x: p.x, z: p.z })))
    }
    updateDots()
    const id = setInterval(updateDots, 100)
    return () => clearInterval(id)
  }, [])

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

    // Build smooth closed SVG path (Catmull-Rom â†’ cubic BÃ©zier)
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
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={trackPath} fill="none" stroke="rgba(50,50,70,0.75)" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Start/Finish mark */}
        <rect x={sfSvg[0] - 3} y={sfSvg[1] - 1.5} width={6} height={3}
          fill="white" opacity={0.7} rx={0.5} />
        {/* AI car dots — amber, drawn under player dot */}
        {aiDots.map((ai, i) => {
          const [ax, ay] = toSvg(ai.x, ai.z)
          return (
            <circle key={i} cx={ax} cy={ay} r={2.5}
              fill="rgba(255,180,50,0.9)" stroke="rgba(0,0,0,0.5)" strokeWidth={0.8} />
          )
        })}
        {/* Player dot — green, always on top */}
        <circle cx={cx} cy={cy} r={4.5} fill="#00e676" stroke="#fff" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={8} fill="none" stroke="rgba(0,230,118,0.3)" strokeWidth={1} />
      </svg>
      {/* Label */}
      <div style={minimapLabel}>MAP</div>
    </div>
  )
}

const minimapContainer = {
  position: 'absolute',
  bottom: '1.8rem',
  left: '1.2rem',
  width: MAP_SIZE + 'px',
  height: MAP_SIZE + 'px',
  background: 'rgba(0,0,0,0.52)',
  backdropFilter: 'blur(8px)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  overflow: 'hidden',
  pointerEvents: 'none',
}

const minimapLabel = {
  position: 'absolute',
  bottom: '4px',
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '0.5rem',
  color: 'rgba(255,255,255,0.3)',
  letterSpacing: '0.25em',
  fontFamily: "'Orbitron', sans-serif",
}

export default function HUD() {
  const speed      = useGameStore((s) => s.speed)
  const raceTime   = useGameStore((s) => s.raceTime)
  const raceTimeLimit = useGameStore((s) => s.raceTimeLimit)
  const currentLap = useGameStore((s) => s.currentLap)
  const totalLaps  = useGameStore((s) => s.totalLaps)
  const bestLap    = useGameStore((s) => s.bestLap)
  const countdown  = useGameStore((s) => s.countdown)
  const raceStarted  = useGameStore((s) => s.raceStarted)
  const raceFinished = useGameStore((s) => s.raceFinished)
  const paused       = useGameStore((s) => s.paused)
  const togglePause  = useGameStore((s) => s.togglePause)
  const goHome       = useGameStore((s) => s.goHome)
  const startRace    = useGameStore((s) => s.startRace)
  const musicMuted   = useGameStore((s) => s.musicMuted)
  const musicVolume  = useGameStore((s) => s.musicVolume)
  const toggleMute   = useGameStore((s) => s.toggleMute)
  const setVolume    = useGameStore((s) => s.setVolume)
  const selectedCar  = useGameStore((s) => s.selectedCar)
  const cars         = useGameStore((s) => s.cars)

  const topSpeed   = cars[selectedCar]?.topSpeed ?? 55
  const timeLeft   = Math.max(0, raceTimeLimit - raceTime)
  const timeFrac   = raceTimeLimit > 0 ? Math.max(0, Math.min(1, timeLeft / raceTimeLimit)) : 1
  const isUrgent   = timeLeft < 15 && timeLeft > 0
  const isCritical = timeLeft < 8  && timeLeft > 0
  const countdownColor = countdown === 1 ? '#00e676' : '#ff3d3d'

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Escape' && raceStarted && !raceFinished) togglePause()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [raceStarted, raceFinished, togglePause])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: "'Orbitron', sans-serif" }}>
      <style>{`
        @keyframes countPulse {
          0% { opacity: 0; transform: scale(0.8); }
          35% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0.1; transform: scale(1.12); }
        }
        @keyframes countRing {
          0% { opacity: 0.65; transform: scale(0.6); }
          100% { opacity: 0; transform: scale(1.35); }
        }
        @keyframes goPulse {
          0% { opacity: 0; transform: scale(0.88); }
          30% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.18); }
        }
      `}</style>

      {/* â”€â”€ Timer bar (top edge) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {raceStarted && !raceFinished && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'rgba(0,0,0,0.5)', zIndex: 5 }}>
          <div style={{
            height: '100%',
            width: `${timeFrac * 100}%`,
            background: isCritical ? '#ff2222' : isUrgent ? '#ffaa00' : 'linear-gradient(90deg, #00b4ff, #00e676)',
            transition: 'width 0.3s linear',
            boxShadow: isCritical ? '0 0 10px #ff2222' : isUrgent ? '0 0 10px #ffaa00' : 'none',
          }} />
        </div>
      )}

      {/* â”€â”€ Race time + TIME counter (top center) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {raceStarted && !raceFinished && (
        <div style={topCenterPanel}>
          <span style={raceTimeValue}>{fmt(raceTime)}</span>
          <span style={{
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            color: isCritical ? '#ff4444' : isUrgent ? '#ffcc00' : 'rgba(255,255,255,0.38)',
            marginTop: '1px',
          }}>
            {`${Math.floor(timeLeft / 60)}:${(Math.floor(timeLeft) % 60).toString().padStart(2, '0')} LEFT`}
          </span>
        </div>
      )}

      {/* â”€â”€ Countdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {countdown > 0 && (
        <div key={`count-${countdown}`} style={countdownWrap}>
          <div style={{ ...countdownRing, borderColor: `${countdownColor}66`, boxShadow: `0 0 24px ${countdownColor}33` }} />
          <span style={{
            ...countdownText,
            color: countdownColor,
            textShadow: `0 0 16px ${countdownColor}99`,
          }}>{countdown}</span>
          <span style={countdownSub}>READY</span>
        </div>
      )}

      {/* â”€â”€ GO! â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {countdown === 0 && raceStarted && raceTime < 1.2 && (
        <div key="count-go" style={goWrap}>
          <span style={goText}>GO!</span>
        </div>
      )}

      {/* â”€â”€ RACE OVER flash â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {raceFinished && (
        <div style={centerMsg}>
          <span style={{ fontSize: '3.5rem', color: '#ffea00', textShadow: '0 0 40px #ffea00', fontWeight: 900, letterSpacing: '0.2em' }}>FINISH!</span>
        </div>
      )}

      {raceStarted && (
        <>
          {/* â”€â”€ Leaderboard â€” left side â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <Leaderboard />

          {/* â”€â”€ Lap + Best lap panel â€” top right â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <LapPanel currentLap={currentLap} totalLaps={totalLaps} bestLap={bestLap} />

          {/* â”€â”€ Speedometer + Gear â€” bottom right â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <Speedometer speed={speed} topSpeed={topSpeed} />

          {/* â”€â”€ Minimap â€” bottom left â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <Minimap />

          {/* â”€â”€ Camera hint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {raceTime < 6 && (
            <div style={controlsHint}>
              WASD / Arrows | Space = Brake | ESC = Pause
            </div>
          )}
        </>
      )}

      {/* â”€â”€ Pause button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {raceStarted && !raceFinished && (
        <button
          onClick={togglePause}
          style={paused ? { ...pauseBtn, borderColor: 'rgba(0,230,118,0.75)', boxShadow: '0 0 22px rgba(0,230,118,0.26)' } : pauseBtn}
          title={paused ? 'Resume race (ESC)' : 'Pause race (ESC)'}
          aria-label={paused ? 'Resume race' : 'Pause race'}
        >
          <span style={pauseBtnText}>{paused ? 'RESUME' : 'PAUSE'}</span>
          <span style={pauseBtnKey}>ESC</span>
        </button>
      )}

      {/* â”€â”€ Pause overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {paused && (
        <div style={pauseOverlay}>
          <div style={pausePanel}>
            <div style={pauseTitle}>PAUSED</div>
            <button style={pauseMenuBtn} onClick={togglePause}>RESUME</button>
            <button style={{ ...pauseMenuBtn, borderColor: 'rgba(255,180,0,0.5)' }} onClick={() => { togglePause(); startRace() }}>RESTART</button>
            <button style={{ ...pauseMenuBtn, borderColor: 'rgba(255,50,80,0.5)' }} onClick={goHome}>QUIT TO MENU</button>
            <div style={volumeSection}>
              <button style={volumeToggleBtn} onClick={toggleMute}>{musicMuted ? 'ðŸ”‡' : 'ðŸ”Š'}</button>
              <input type="range" min={0} max={1} step={0.05}
                value={musicMuted ? 0 : musicVolume}
                onChange={(e) => { const v = parseFloat(e.target.value); if (musicMuted && v > 0) toggleMute(); setVolume(v) }}
                style={volumeSlider} />
              <span style={volumeLabel}>{musicMuted ? 'MUTED' : `${Math.round(musicVolume * 100)}%`}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const countdownWrap = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: '0.45rem',
  pointerEvents: 'none',
  animation: 'countPulse 940ms cubic-bezier(0.2, 0.7, 0.15, 1) forwards',
}

const countdownRing = {
  position: 'absolute',
  width: '176px',
  height: '176px',
  borderRadius: '50%',
  border: '2px solid',
  animation: 'countRing 940ms ease-out forwards',
}

const countdownText = {
  fontSize: '8rem',
  fontWeight: 900,
  lineHeight: 0.9,
  letterSpacing: '0.02em',
}

const countdownSub = {
  marginTop: '0.2rem',
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.55)',
  letterSpacing: '0.35em',
}

const goWrap = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  animation: 'goPulse 760ms cubic-bezier(0.2, 0.7, 0.15, 1) forwards',
}

const goText = {
  fontSize: '5.2rem',
  color: '#00e676',
  textShadow: '0 0 16px rgba(0,230,118,0.65)',
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: '0.03em',
}

/* â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const topCenterPanel = {
  position: 'absolute',
  top: '10px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(8px)',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '5px 16px',
  zIndex: 6,
  pointerEvents: 'none',
}
const raceTimeValue = {
  fontSize: '1.3rem',
  fontWeight: 900,
  color: 'white',
  fontFamily: "'Orbitron', sans-serif",
  letterSpacing: '0.05em',
  lineHeight: 1.2,
}
const controlsHint = {
  position: 'absolute',
  bottom: '11.5rem',
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '0.62rem',
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.1em',
  fontFamily: "'Orbitron', sans-serif",
  background: 'rgba(0,0,0,0.4)',
  padding: '4px 12px',
  borderRadius: '4px',
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
}
const pauseBtn = {
  position: 'absolute',
  top: '1.5rem',
  left: '1.5rem',
  height: '44px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, rgba(16,26,38,0.95), rgba(8,13,22,0.95))',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(0,180,255,0.55)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.55rem',
  padding: '0 0.7rem 0 1rem',
  pointerEvents: 'auto',
  zIndex: 10,
  fontFamily: "'Orbitron', sans-serif",
  letterSpacing: '0.1em',
  boxShadow: '0 0 20px rgba(0,180,255,0.16)',
}
const pauseBtnText = {
  fontSize: '0.68rem',
  fontWeight: 800,
  lineHeight: 1,
}
const pauseBtnKey = {
  fontSize: '0.56rem',
  fontWeight: 800,
  lineHeight: 1,
  padding: '0.2rem 0.35rem',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.26)',
  color: 'rgba(255,255,255,0.78)',
  background: 'rgba(255,255,255,0.08)',
}
const pauseOverlay = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 20,
  pointerEvents: 'auto',
}
const pausePanel = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.4rem',
  padding: '3rem 4rem',
  background: 'rgba(8,10,18,0.9)',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.1)',
}
const pauseTitle = {
  fontSize: '2.2rem',
  fontWeight: 900,
  color: '#fff',
  letterSpacing: '0.25em',
  fontFamily: "'Orbitron', sans-serif",
}
const pauseMenuBtn = {
  minWidth: '220px',
  padding: '0.85rem 2rem',
  fontSize: '0.9rem',
  fontWeight: 700,
  fontFamily: "'Orbitron', sans-serif",
  color: '#fff',
  background: 'rgba(20,20,40,0.9)',
  border: '2px solid rgba(0,180,255,0.4)',
  borderRadius: '8px',
  cursor: 'pointer',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
}
const volumeSection = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  marginTop: '0.4rem',
  padding: '0.6rem 1rem',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
}
const volumeToggleBtn = {
  width: '36px', height: '36px',
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: '1.1rem',
  cursor: 'pointer',
  flexShrink: 0,
}
const volumeSlider = { width: '120px', height: '4px', cursor: 'pointer', accentColor: '#00b4ff' }
const volumeLabel  = {
  fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.1em', fontFamily: "'Orbitron', sans-serif",
  minWidth: '40px', textAlign: 'right',
}
const centerMsg = {
  position: 'absolute',
  top: '50%', left: '50%',
  transform: 'translate(-50%,-50%)',
}
