import useGameStore from '../../store'

function fmt(seconds) {
  if (!seconds || !isFinite(seconds)) return '--:--.---'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
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
  const lapTimes = useGameStore((s) => s.lapTimes)
  const goHome = useGameStore((s) => s.goHome)
  const startRace = useGameStore((s) => s.startRace)

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
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '0.15em' }}>BEST LAP</div>
          <div style={{ fontSize: '1.2rem', color: '#2ecc71', fontWeight: 700 }}>{fmt(bestLap)}</div>
        </div>
      )}

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

      {/* ── Race Finished overlay ──────────────────────────── */}
      {raceFinished && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          <h1
            style={{
              fontSize: '3rem',
              color: '#f1c40f',
              textShadow: '0 0 30px rgba(241,196,15,0.5)',
              marginBottom: '1rem',
            }}
          >
            🏁 RACE COMPLETE!
          </h1>

          <div style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>
            Total: {fmt(raceTime)}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {lapTimes.map((t, i) => (
              <div
                key={i}
                style={{
                  color: t === bestLap ? '#2ecc71' : '#aaa',
                  fontSize: '1rem',
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                Lap {i + 1}: {fmt(t)} {t === bestLap && '⚡ Best'}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={startRace}
              style={{
                ...hudBtn,
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                border: '2px solid #e74c3c',
              }}
            >
              RESTART
            </button>
            <button
              onClick={goHome}
              style={{
                ...hudBtn,
                background: 'linear-gradient(135deg, #555, #333)',
                border: '2px solid #666',
              }}
            >
              HOME
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const centerMsg = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
}

const hudBtn = {
  padding: '0.8rem 2rem',
  fontSize: '1rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  color: '#fff',
  borderRadius: '8px',
  cursor: 'pointer',
  letterSpacing: '0.1em',
}
