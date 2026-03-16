import { useEffect, useMemo, useState } from 'react'
import useGameStore from '../../store'
import { getActiveTrack, setActiveLevel } from '../../trackData'
import { aiProgress, aiWorldPositions, playerProgress } from '../../raceProgress'
import { touchKeys } from '../../touchControls'

function fmtRace(seconds) {
  if (!seconds || !isFinite(seconds)) return '00:00.000'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`
}

function fmtDelta(seconds) {
  if (!isFinite(seconds)) return ''
  const sign = seconds >= 0 ? '+' : '-'
  const abs = Math.abs(seconds)
  return `${sign}${abs.toFixed(3)}`
}

function abbrev(name) {
  // Return up to 3 uppercase letters to match F1 broadcast style
  return name.length <= 3 ? name.toUpperCase() : name.slice(0, 3).toUpperCase()
}

function gearFor(speed, topSpeed) {
  if (speed < 0.6) return 'N'
  const r = speed / topSpeed
  if (r < 0.16) return '1'
  if (r < 0.32) return '2'
  if (r < 0.5) return '3'
  if (r < 0.67) return '4'
  if (r < 0.84) return '5'
  return '6'
}

function LeaderboardPanel() {
  const raceTime = useGameStore((s) => s.raceTime)
  const [entries, setEntries] = useState([])

  useEffect(() => {
    function compute() {
      const all = [
        { name: 'YOU', sort: playerProgress.lap + playerProgress.t, isPlayer: true },
        ...aiProgress.map((ai) => ({ name: ai.name, sort: ai.lap + ai.t, isPlayer: false })),
      ]
      all.sort((a, b) => b.sort - a.sort)
      const leader = all[0]?.sort ?? 0
      const mapped = all.map((e, i) => {
        const gap = leader - e.sort
        const sec = i === 0 ? null : Math.max(0, gap * 3.6 + (i * 0.05))
        return { ...e, pos: i + 1, gap: sec }
      })
      setEntries(mapped)
    }

    compute()
    const id = setInterval(compute, 250)
    return () => clearInterval(id)
  }, [raceTime])

  return (
    <div style={leftBoard}>
      <div style={leftBoardHeader}>
        <span style={f1Badge}>&#9632; RACE</span>
        <span style={lapSmall}>LIVE</span>
      </div>
      {entries.map((e) => (
        <div key={e.name} style={e.isPlayer ? { ...boardRow, ...boardRowYou } : boardRow}>
          <span style={boardPos}>P{e.pos}</span>
          <span style={boardName}>{abbrev(e.name)}</span>
          <span style={e.gap == null ? boardGapLeader : boardGap}>
            {e.gap == null ? 'LEADER' : `+${e.gap.toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  )
}

const MAP_SIZE = 220
const MAP_PAD = 20

function MinimapPanel() {
  const carPos = useGameStore((s) => s.carPosition)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const currentLap = useGameStore((s) => s.currentLap)
  const totalLaps = useGameStore((s) => s.totalLaps)
  const [aiDots, setAiDots] = useState([])

  useEffect(() => {
    function updateDots() {
      setAiDots(aiWorldPositions.map((p) => ({ x: p.x, z: p.z })))
    }
    updateDots()
    const id = setInterval(updateDots, 100)
    return () => clearInterval(id)
  }, [])

  const { path, toSvg } = useMemo(() => {
    setActiveLevel(selectedLevel)
    const track = getActiveTrack()
    const cp = track.cp

    const allX = cp.map((p) => p[0])
    const allZ = cp.map((p) => p[1])
    const minX = Math.min(...allX)
    const maxX = Math.max(...allX)
    const minZ = Math.min(...allZ)
    const maxZ = Math.max(...allZ)
    const rangeX = maxX - minX || 1
    const rangeZ = maxZ - minZ || 1
    const sc = (MAP_SIZE - MAP_PAD * 2) / Math.max(rangeX, rangeZ)
    const oX = MAP_PAD + (MAP_SIZE - MAP_PAD * 2 - rangeX * sc) / 2
    const oZ = MAP_PAD + (MAP_SIZE - MAP_PAD * 2 - rangeZ * sc) / 2

    function project(wx, wz) {
      return [oX + (wx - minX) * sc, oZ + (wz - minZ) * sc]
    }

    const pts = cp.map(([x, z]) => project(x, z))
    const n = pts.length
    const t = 0.28
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} `
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n]
      const p1 = pts[i]
      const p2 = pts[(i + 1) % n]
      const p3 = pts[(i + 2) % n]
      const c1x = p1[0] + (p2[0] - p0[0]) * t
      const c1y = p1[1] + (p2[1] - p0[1]) * t
      const c2x = p2[0] - (p3[0] - p1[0]) * t
      const c2y = p2[1] - (p3[1] - p1[1]) * t
      d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} `
    }
    d += 'Z'

    return { path: d, toSvg: project }
  }, [selectedLevel])

  const [px, py] = toSvg(carPos.x, carPos.z)

  return (
    <div style={mapCard}>
      <div style={mapHeader}>TRACK MAP</div>
      <svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
        <path d={path} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="rgba(24,34,48,0.95)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        {aiDots.map((ai, i) => {
          const [ax, ay] = toSvg(ai.x, ai.z)
          return <circle key={i} cx={ax} cy={ay} r={3.8} fill="#f8b133" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
        })}
        <circle cx={px} cy={py} r={5.2} fill="#00e676" stroke="#d6ffe9" strokeWidth={2} />
        <circle cx={px} cy={py} r={9.5} fill="none" stroke="rgba(0,230,118,0.45)" strokeWidth={1.2} />
      </svg>
      <div style={mapFooter}>LAP {Math.min(currentLap + 1, totalLaps)}/{totalLaps}</div>
    </div>
  )
}

function TelemetryPanel({ speed, topSpeed, raceTime, currentLap, totalLaps, bestLap }) {
  const ratio = Math.max(0, Math.min(1, speed / topSpeed))
  const kmh = Math.round(speed * 3.6)
  const gear = gearFor(speed, topSpeed)
  const ers = Math.max(12, 100 - Math.floor((raceTime * 6) % 88))
  const fuel = Math.max(8, 100 - Math.floor((raceTime * 2.5) % 92))
  const throttle = Math.round(ratio * 100)
  const SEG = 34
  const litSeg = Math.round(ratio * SEG)
  const litThrottle = Math.round(ratio * 18)
  const litErs = Math.round((ers / 100) * 18)

  return (
    <div style={telemetryWrap}>
      {/* Top row: ERS value | big speed | FUEL value */}
      <div style={telemetryTopRow}>
        <div style={telColLeft}>
          <span style={telChipLabel}>ERS</span>
          <span style={telChipVal}>{ers}<span style={telChipUnit}>%</span></span>
          <span style={telChipLabel} />  
          <span style={telChipVal}>{Math.floor(raceTime / 60).toString().padStart(2,'0')}:{(raceTime % 60).toFixed(0).padStart(2,'0')}<span style={telChipUnit}>s</span></span>
        </div>
        <div style={telColMid}>
          <span style={speedValue}>{kmh}</span>
          <span style={speedUnit}>KM/H</span>
        </div>
        <div style={telColRight}>
          <span style={telChipLabel}>FUEL</span>
          <span style={telChipVal}>{fuel}<span style={telChipUnit}>%</span></span>
          <span style={telChipLabel}>+{(fuel * 0.008).toFixed(1)}<span style={telChipUnit}> LAPS</span></span>
        </div>
      </div>

      {/* RPM-style multi-segment bar */}
      <div style={segmentRail}>
        {Array.from({ length: SEG }).map((_, i) => (
          <span key={i} style={i < litSeg ? {
            ...segmentCell,
            background: i < 20 ? '#23d26f' : i < 28 ? '#d8df47' : '#ff4a4a',
            boxShadow: i < 20 ? '0 0 4px #23d26f88' : i < 28 ? '0 0 4px #d8df4788' : '0 0 4px #ff4a4a88',
          } : segmentCell} />
        ))}
      </div>

      {/* Bottom rows: THROTTLE bar + labels */}
      <div style={telemetryBottomRow}>
        <div style={telBotLeft}>
          <span style={telBotChip}>
            <svg width="20" height="16"><rect x="1" y="2" width="18" height="12" rx="2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/><rect x="2" y="3" width="16" height="10" rx="1.5" fill="rgba(255,255,255,0.1)"/></svg>
          </span>
          <span style={telBotLabel}>ERS</span>
          <span style={telBotPct}>{ers}%</span>
          <div style={telMiniBar}>
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} style={{ ...miniSeg, background: i < litErs ? '#23d26f' : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>
        </div>
        <div style={telBotMid}>
          <span style={tiny}>GEAR <b style={{ color: '#fff', fontSize: '1.1rem' }}>{gear}</b></span>
          <span style={tiny}>LAP {Math.min(currentLap + 1, totalLaps)}/{totalLaps}</span>
        </div>
        <div style={telBotRight}>
          <span style={telBotLabel}>THROTTLE</span>
          <div style={telMiniBar}>
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} style={{ ...miniSeg, background: i < litThrottle ? '#4ADE80' : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>
          <span style={telBotPct}>{throttle}%</span>
        </div>
      </div>
    </div>
  )
}

function tyreColor(pct) {
  if (pct >= 80) return '#4ade80'
  if (pct >= 60) return '#facc15'
  return '#f87171'
}

function TyreCell({ label, pct }) {
  const col = tyreColor(pct)
  return (
    <div style={tyreCellWrap}>
      <span style={tyreCellLabel}>{label}</span>
      <span style={{ ...tyreCellPct, color: col }}>{pct}<span style={tyreCellUnit}>%</span></span>
      <div style={tyreCellBar}><div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 2 }} /></div>
    </div>
  )
}

function TyresPanel({ raceTime, speed, topSpeed }) {
  const wearBase = Math.min(45, Math.floor((raceTime / 6) + (speed / Math.max(topSpeed, 1)) * 18))
  const fl = Math.max(50, 100 - wearBase)
  const fr = Math.max(50, 100 - wearBase - 2)
  const rl = Math.max(45, 100 - wearBase - 5)
  const rr = Math.max(45, 100 - wearBase - 4)

  return (
    <div style={tyresCard}>
      <div style={tyresTitle}>TYRES</div>
      <div style={tyresGrid}>
        <TyreCell label="FL" pct={fl} />
        <TyreCell label="FR" pct={fr} />
        <TyreCell label="RL" pct={rl} />
        <TyreCell label="RR" pct={rr} />
      </div>
      <div style={modeDivider} />
      <div style={modeTitle}>ENGINE MODE</div>
      <div style={modeValue}>
        <span style={modeDot} />
        STANDARD
      </div>
    </div>
  )
}

export default function HUDPhoto() {
  const speed = useGameStore((s) => s.speed)
  const raceTime = useGameStore((s) => s.raceTime)
  const currentLap = useGameStore((s) => s.currentLap)
  const totalLaps = useGameStore((s) => s.totalLaps)
  const bestLap = useGameStore((s) => s.bestLap)
  const countdown = useGameStore((s) => s.countdown)
  const raceStarted = useGameStore((s) => s.raceStarted)
  const raceFinished = useGameStore((s) => s.raceFinished)
  const paused = useGameStore((s) => s.paused)
  const togglePause = useGameStore((s) => s.togglePause)
  const goHome = useGameStore((s) => s.goHome)
  const startRace = useGameStore((s) => s.startRace)
  const selectedCar = useGameStore((s) => s.selectedCar)
  const cars = useGameStore((s) => s.cars)

  const topSpeed = cars[selectedCar]?.topSpeed ?? 55
  const delta = isFinite(bestLap) ? raceTime - bestLap * Math.max(1, currentLap + 1) : raceTime

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Escape' && raceStarted && !raceFinished) togglePause()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [raceStarted, raceFinished, togglePause])

  return (
    <div style={hudRoot}>
      <style>{`
        @keyframes hudCountIn {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.75); }
          35% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.14); }
        }
        @keyframes hudGoIn {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.82); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.15); }
        }
        @media (max-width: 980px) {
          .hud-photo-hide-mobile { display: none !important; }
          .hud-touch-controls { display: flex !important; }
          .hud-telemetry { display: none !important; }
        }
        @media (min-width: 981px) {
          .hud-touch-controls { display: none !important; }
        }
      `}</style>

      <div style={topBar}>
        <div style={topBarLeft}>
          <span style={topBarLabel}>LAP</span>
          <span style={topBarBig}>{Math.min(currentLap + 1, totalLaps)}</span>
          <span style={topBarSlash}>/</span>
          <span style={topBarSub}>{totalLaps}</span>
        </div>
        <div style={topBarCenter}>
          <span style={topTime}>{fmtRace(raceTime)}</span>
        </div>
        <div style={topBarRight}>
          {isFinite(bestLap) && (
            <>
              <span style={topBarLabel}>BEST</span>
              <span style={topBarDelta}>{fmtRace(bestLap)}</span>
            </>
          )}
        </div>
      </div>

      {raceStarted && <div className="hud-photo-hide-mobile"><MinimapPanel /></div>}
      {raceStarted && !raceFinished && (
        <>
          <div className="hud-telemetry">
            <TelemetryPanel speed={speed} topSpeed={topSpeed} raceTime={raceTime} currentLap={currentLap} totalLaps={totalLaps} bestLap={bestLap} />
          </div>
          <div className="hud-photo-hide-mobile"><TyresPanel raceTime={raceTime} speed={speed} topSpeed={topSpeed} /></div>
        </>
      )}

      {/* Mobile touch controls — hidden on desktop via CSS */}
      {raceStarted && !raceFinished && !paused && (
        <div className="hud-touch-controls" style={touchControlsWrap}>
          <div style={touchControlsLeft}>
            <button
              style={touchBtn}
              onTouchStart={(e) => { e.preventDefault(); touchKeys['ArrowLeft'] = true }}
              onTouchEnd={() => { touchKeys['ArrowLeft'] = false }}
              onTouchCancel={() => { touchKeys['ArrowLeft'] = false }}
            >&#9668;</button>
            <button
              style={touchBtn}
              onTouchStart={(e) => { e.preventDefault(); touchKeys['ArrowRight'] = true }}
              onTouchEnd={() => { touchKeys['ArrowRight'] = false }}
              onTouchCancel={() => { touchKeys['ArrowRight'] = false }}
            >&#9658;</button>
          </div>
          <div style={touchControlsRight}>
            <button
              style={{ ...touchBtn, background: 'rgba(0,180,80,0.28)', borderColor: '#00e676' }}
              onTouchStart={(e) => { e.preventDefault(); touchKeys['ArrowUp'] = true }}
              onTouchEnd={() => { touchKeys['ArrowUp'] = false }}
              onTouchCancel={() => { touchKeys['ArrowUp'] = false }}
            >&#9650; GAS</button>
            <button
              style={{ ...touchBtn, background: 'rgba(255,60,60,0.28)', borderColor: '#ff4a4a' }}
              onTouchStart={(e) => { e.preventDefault(); touchKeys['Space'] = true }}
              onTouchEnd={() => { touchKeys['Space'] = false }}
              onTouchCancel={() => { touchKeys['Space'] = false }}
            >&#9632; BRAKE</button>
          </div>
        </div>
      )}

      {countdown > 0 && (
        <div style={countWrap} key={`count-${countdown}`}>
          <span style={countText}>{countdown}</span>
          <span style={countSub}>READY</span>
        </div>
      )}
      {countdown === 0 && raceStarted && raceTime < 1.2 && (
        <div style={goWrap} key="go-msg"><span style={goText}>GO!</span></div>
      )}

      {raceStarted && !raceFinished && (
        <button onClick={togglePause} style={pauseBtn} title="Pause race (ESC)">
          {paused ? 'RESUME' : 'PAUSE'} <span style={escTag}>ESC</span>
        </button>
      )}

      {paused && (
        <div style={pauseOverlay}>
          <div style={pausePanel}>
            <div style={pauseTitle}>PAUSED</div>
            <button style={pauseAction} onClick={togglePause}>RESUME</button>
            <button style={{ ...pauseAction, borderColor: 'rgba(255,192,64,0.6)' }} onClick={() => { togglePause(); startRace() }}>RESTART</button>
            <button style={{ ...pauseAction, borderColor: 'rgba(255,76,76,0.6)' }} onClick={goHome}>QUIT TO MENU</button>
          </div>
        </div>
      )}

      {raceFinished && <div style={finishLabel}>FINISH!</div>}
    </div>
  )
}

const hudRoot = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  fontFamily: "'Orbitron', sans-serif",
}

const touchControlsWrap = {
  position: 'absolute', bottom: '12px', left: 0, right: 0,
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
  padding: '0 14px', zIndex: 50, pointerEvents: 'auto',
}
const touchControlsLeft = { display: 'flex', gap: '10px', alignItems: 'flex-end' }
const touchControlsRight = { display: 'flex', gap: '10px', alignItems: 'flex-end' }
const touchBtn = {
  width: '76px', height: '68px', borderRadius: '14px',
  background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
  fontSize: '1.1rem', fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
  cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
  touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
  letterSpacing: '0.05em', gap: '4px', flexDirection: 'column',
}

const topBar = {
  position: 'absolute',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min(520px, 95vw)',
  height: '62px',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  padding: '0 18px',
  background: 'linear-gradient(180deg, rgba(8,14,22,0.97) 0%, rgba(14,22,34,0.95) 100%)',
  borderLeft: '1px solid rgba(255,255,255,0.14)',
  borderRight: '1px solid rgba(255,255,255,0.14)',
  borderBottom: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '0 0 12px 12px',
  boxShadow: '0 6px 28px rgba(0,0,0,0.55)',
}
const topBarLeft = { display: 'flex', alignItems: 'baseline', gap: '4px' }
const topBarCenter = { display: 'flex', justifyContent: 'center', alignItems: 'center' }
const topBarRight = { display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px' }
const topBarLabel = { color: 'rgba(255,205,0,0.85)', fontSize: '0.72rem', letterSpacing: '0.14em', fontWeight: 700 }
const topBarBig = { color: '#ffffff', fontSize: '2rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }
const topBarSlash = { color: 'rgba(255,255,255,0.35)', fontSize: '1.1rem' }
const topBarSub = { color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }
const topBarDelta = { color: '#ff9e4a', fontSize: '1.1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }
const topTime = { color: '#f3f6ff', fontSize: '2rem', fontWeight: 900, letterSpacing: '0.06em', lineHeight: 1, fontFamily: "'Orbitron', 'Courier New', monospace", fontVariantNumeric: 'tabular-nums', width: '220px', textAlign: 'center', display: 'inline-block' }

const leftBoard = {
  position: 'absolute',
  top: '80px',
  left: 0,
  width: '188px',
  background: 'rgba(5,9,15,0.91)',
  borderRight: '1px solid rgba(255,255,255,0.13)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0 0 10px 0',
  overflow: 'hidden',
  boxShadow: '4px 8px 24px rgba(0,0,0,0.5)',
}
const leftBoardHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '7px 12px',
  background: 'rgba(200,20,20,0.88)',
  borderBottom: '2px solid rgba(255,0,0,0.6)',
}
const f1Badge = { fontSize: '0.82rem', color: '#fff', fontWeight: 900, letterSpacing: '0.14em' }
const lapSmall = { fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }
const boardRow = {
  display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center',
  padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)'
}
const boardRowYou = { background: 'rgba(0,200,120,0.18)', borderLeft: '3px solid #00e676' }
const boardPos = { color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: 700 }
const boardName = { color: '#f7f8fb', fontSize: '0.92rem', fontWeight: 800, letterSpacing: '0.06em' }
const boardGap = { color: '#ff9e4a', fontSize: '0.72rem', fontWeight: 700 }
const boardGapLeader = { color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', letterSpacing: '0.04em' }

const mapCard = {
  position: 'absolute',
  left: 0,
  bottom: 0,
  width: '236px',
  background: 'rgba(6,10,16,0.92)',
  borderTop: '1px solid rgba(255,255,255,0.13)',
  borderRight: '1px solid rgba(255,255,255,0.11)',
  borderRadius: '0 10px 0 0',
  padding: '10px 10px 8px',
  boxShadow: '4px -4px 24px rgba(0,0,0,0.48)',
}
const mapHeader = {
  color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', letterSpacing: '0.16em',
  marginBottom: '4px', textTransform: 'uppercase',
}
const mapFooter = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginTop: '5px',
  color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', letterSpacing: '0.1em',
}

const telemetryWrap = {
  position: 'absolute',
  left: '50%',
  bottom: 0,
  transform: 'translateX(-50%)',
  width: 'min(60vw, 720px)',
  minWidth: 0,
  background: 'linear-gradient(180deg, rgba(8,14,22,0.97) 0%, rgba(5,9,15,0.95) 100%)',
  borderTop: '1px solid rgba(255,255,255,0.18)',
  borderLeft: '1px solid rgba(255,255,255,0.12)',
  borderRight: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px 12px 0 0',
  padding: '14px 20px 10px',
  boxShadow: '0 -8px 32px rgba(0,0,0,0.56)',
}
// inner layout
const telemetryTopRow = { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch', gap: '16px' }
const telColLeft = { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '12px' }
const telColMid = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }
const telColRight = { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '12px' }
const telChipLabel = { color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', letterSpacing: '0.12em', fontWeight: 700 }
const telChipVal = { color: '#f3f8ff', fontSize: '1.55rem', fontWeight: 800, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }
const telChipUnit = { fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginLeft: '2px' }
const speedValue = { color: '#eaf6ff', fontSize: '3.6rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', minWidth: '140px', textAlign: 'center', display: 'inline-block' }
const speedUnit = { color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', letterSpacing: '0.12em', marginTop: '2px' }
const segmentRail = { display: 'flex', gap: '3px', alignItems: 'center', margin: '10px 0 4px' }
const segmentCell = { display: 'inline-block', flex: '1', height: '14px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }
const telemetryBottomRow = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px', alignItems: 'center' }
const telBotLeft = { display: 'flex', alignItems: 'center', gap: '5px' }
const telBotMid = { display: 'flex', justifyContent: 'center', gap: '14px' }
const telBotRight = { display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }
const telBotLabel = { color: 'rgba(255,255,255,0.52)', fontSize: '0.66rem', letterSpacing: '0.1em' }
const telBotPct = { color: '#f0f6ff', fontSize: '0.8rem', fontWeight: 700 }
const telBotChip = { display: 'flex', alignItems: 'center' }
const telMiniBar = { display: 'flex', gap: '2px', alignItems: 'center' }
const miniSeg = { display: 'inline-block', width: '6px', height: '10px', borderRadius: '2px' }
const tiny = { color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', letterSpacing: '0.08em' }

const tyresCard = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: '252px',
  background: 'rgba(6,10,16,0.92)',
  borderTop: '1px solid rgba(255,255,255,0.13)',
  borderLeft: '1px solid rgba(255,255,255,0.11)',
  borderRadius: '10px 0 0 0',
  padding: '12px 14px 10px',
  boxShadow: '-4px -4px 24px rgba(0,0,0,0.48)',
}
const tyresTitle = { color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', letterSpacing: '0.16em', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }
const tyresGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }
const tyreCellWrap = { display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }
const tyreCellLabel = { color: 'rgba(255,255,255,0.55)', fontSize: '0.62rem', letterSpacing: '0.1em' }
const tyreCellPct = { fontSize: '1.15rem', fontWeight: 800, lineHeight: 1 }
const tyreCellUnit = { fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)' }
const tyreCellBar = { height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }
const modeDivider = { height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0 8px' }
const modeTitle = { color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase' }
const modeValue = { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', color: '#f4f9ff', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em' }
const modeDot = { width: '12px', height: '12px', borderRadius: '50%', background: '#facc15', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-block', flexShrink: 0 }

const pauseBtn = {
  pointerEvents: 'auto',
  position: 'absolute',
  left: '18px',
  top: '18px',
  height: '42px',
  borderRadius: '999px',
  border: '1px solid rgba(0,190,255,0.6)',
  background: 'linear-gradient(180deg, rgba(16,26,38,0.95), rgba(8,13,22,0.95))',
  color: '#f5fbff',
  fontFamily: "'Orbitron', sans-serif",
  letterSpacing: '0.08em',
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '0 0.75rem 0 1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.55rem',
  cursor: 'pointer',
  boxShadow: '0 0 20px rgba(0,180,255,0.2)',
  zIndex: 20,
}
const escTag = {
  fontSize: '0.58rem',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '4px',
  padding: '0.18rem 0.35rem',
  color: 'rgba(255,255,255,0.8)',
  background: 'rgba(255,255,255,0.08)',
}

const countWrap = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  animation: 'hudCountIn 950ms ease-out forwards',
}
const countText = { color: '#ff5a5a', fontSize: '8rem', fontWeight: 900, lineHeight: 1, textShadow: '0 0 26px rgba(255,90,90,0.6)' }
const countSub = { marginTop: '-0.4rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.34em', fontSize: '0.76rem' }
const goWrap = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  animation: 'hudGoIn 760ms ease-out forwards',
}
const goText = { color: '#00e676', fontSize: '5.5rem', fontWeight: 900, textShadow: '0 0 18px rgba(0,230,118,0.65)' }

const pauseOverlay = {
  pointerEvents: 'auto',
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
}
const pausePanel = {
  width: 'min(90vw, 420px)',
  background: 'linear-gradient(180deg, rgba(15,22,34,0.95), rgba(7,10,16,0.94))',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '14px',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  alignItems: 'stretch',
}
const pauseTitle = { textAlign: 'center', color: '#f3f8ff', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '0.16em', marginBottom: '8px' }
const pauseAction = {
  pointerEvents: 'auto',
  height: '44px',
  borderRadius: '8px',
  border: '1px solid rgba(0,180,255,0.55)',
  background: 'rgba(11,18,26,0.9)',
  color: '#f2f7ff',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  letterSpacing: '0.1em',
  cursor: 'pointer',
}
const finishLabel = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: '#ffea00',
  fontWeight: 900,
  fontSize: '3.5rem',
  letterSpacing: '0.12em',
  textShadow: '0 0 34px rgba(255,234,0,0.6)',
}
