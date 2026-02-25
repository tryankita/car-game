import useGameStore from '../../store'

export default function Home() {
  const startRace = useGameStore((s) => s.startRace)
  const setScreen = useGameStore((s) => s.setScreen)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        fontFamily: "'Orbitron', sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: '5rem',
          color: '#fff',
          textShadow: '0 0 30px rgba(231,76,60,0.8), 0 0 60px rgba(231,76,60,0.4)',
          marginBottom: '0.5rem',
          letterSpacing: '0.15em',
        }}
      >
        TURBO RACER
      </h1>

      <p
        style={{
          color: '#aaa',
          fontSize: '1.2rem',
          marginBottom: '3rem',
          fontFamily: "'Rajdhani', sans-serif",
          letterSpacing: '0.3em',
        }}
      >
        CIRCUIT CHAMPIONSHIP
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button onClick={startRace} style={btn('#e74c3c')}>
          ▶ START RACE
        </button>
        <button onClick={() => setScreen('garage')} style={btn('#3498db')}>
          🔧 GARAGE
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          color: '#555',
          fontSize: '0.9rem',
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        WASD or Arrow Keys to drive &bull; Space to brake
      </div>
    </div>
  )
}

const btn = (color) => ({
  padding: '1rem 3rem',
  fontSize: '1.3rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  color: '#fff',
  background: `linear-gradient(135deg, ${color}, ${color}88)`,
  border: `2px solid ${color}`,
  borderRadius: '8px',
  cursor: 'pointer',
  letterSpacing: '0.1em',
  transition: 'all 0.2s',
  minWidth: '280px',
})
