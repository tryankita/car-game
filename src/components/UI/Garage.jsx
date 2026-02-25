import { useState } from 'react'
import useGameStore from '../../store'

export default function Garage() {
  const cars = useGameStore((s) => s.cars)
  const selectedCar = useGameStore((s) => s.selectedCar)
  const selectCar = useGameStore((s) => s.selectCar)
  const setScreen = useGameStore((s) => s.setScreen)
  const startRace = useGameStore((s) => s.startRace)
  const [hovered, setHovered] = useState(null)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
        fontFamily: "'Orbitron', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
      }}
    >
      <h1
        style={{
          fontSize: '2.5rem',
          color: '#fff',
          marginBottom: '0.5rem',
          textShadow: '0 0 20px rgba(52,152,219,0.6)',
        }}
      >
        GARAGE
      </h1>
      <p
        style={{
          color: '#888',
          fontFamily: "'Rajdhani', sans-serif",
          marginBottom: '2rem',
          fontSize: '1.1rem',
        }}
      >
        Select your ride
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1.5rem',
          maxWidth: '700px',
          width: '100%',
          marginBottom: '2rem',
        }}
      >
        {cars.map((car, i) => (
          <div
            key={i}
            onClick={() => selectCar(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background:
                selectedCar === i
                  ? `linear-gradient(135deg, ${car.color}33, ${car.color}11)`
                  : 'rgba(255,255,255,0.03)',
              border: `2px solid ${selectedCar === i ? car.color : '#333'}`,
              borderRadius: '12px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s',
              transform: hovered === i ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            {/* Color preview */}
            <div
              style={{
                width: '100%',
                height: '80px',
                background: `linear-gradient(135deg, ${car.color}, ${car.color}66)`,
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}
            >
              🏎️
            </div>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.3rem' }}>
              {car.name}
            </h3>
            <p
              style={{
                color: '#888',
                fontSize: '0.75rem',
                fontFamily: "'Rajdhani', sans-serif",
                marginBottom: '0.8rem',
              }}
            >
              {car.description}
            </p>

            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem' }}>
              <StatBar label="Speed" value={car.topSpeed} max={65} color="#e74c3c" />
              <StatBar label="Handling" value={car.handling} max={5} color="#3498db" />
              <StatBar label="Accel" value={car.acceleration} max={35} color="#2ecc71" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={() => setScreen('home')} style={btnStyle('#666')}>
          ← BACK
        </button>
        <button onClick={startRace} style={btnStyle('#e74c3c')}>
          ▶ RACE
        </button>
      </div>
    </div>
  )
}

function StatBar({ label, value, max, color }) {
  const pct = (value / max) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
      <span style={{ color: '#aaa', width: '65px', fontSize: '0.8rem' }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: '6px',
          background: '#222',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px' }} />
      </div>
    </div>
  )
}

const btnStyle = (color) => ({
  padding: '0.8rem 2.5rem',
  fontSize: '1rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  color: '#fff',
  background: `linear-gradient(135deg, ${color}, ${color}88)`,
  border: `2px solid ${color}`,
  borderRadius: '8px',
  cursor: 'pointer',
  letterSpacing: '0.1em',
})
