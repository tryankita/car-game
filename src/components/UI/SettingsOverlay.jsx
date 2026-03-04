import { useState, useEffect, useCallback } from 'react'
import useGameStore, { DEFAULT_KEYBINDS } from '../../store'
import audioManager from '../../audioManager'

/* Map e.code → readable label */
function keyLabel(code) {
  if (!code) return '—'
  if (code === 'Space') return 'SPACE'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Arrow')) return '↑↓←→'.charAt(['Up','Down','Left','Right'].indexOf(code.slice(5))) || code.slice(5)
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT'
  if (code === 'ControlLeft' || code === 'ControlRight') return 'CTRL'
  if (code === 'AltLeft' || code === 'AltRight') return 'ALT'
  return code.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase()
}

const ACTION_LABELS = {
  forward: '⬆ Forward',
  backward: '⬇ Backward',
  left: '⬅ Left',
  right: '➡ Right',
  brake: '🛑 Brake',
}

export default function SettingsOverlay() {
  const showSettings = useGameStore((s) => s.showSettings)
  const setShowSettings = useGameStore((s) => s.setShowSettings)
  const musicVolume = useGameStore((s) => s.musicVolume)
  const sfxVolume = useGameStore((s) => s.sfxVolume)
  const musicMuted = useGameStore((s) => s.musicMuted)
  const sfxMuted = useGameStore((s) => s.sfxMuted)
  const keybinds = useGameStore((s) => s.keybinds)
  const setVolume = useGameStore((s) => s.setVolume)
  const setSfxVolume = useGameStore((s) => s.setSfxVolume)
  const toggleMute = useGameStore((s) => s.toggleMute)
  const toggleSfxMute = useGameStore((s) => s.toggleSfxMute)
  const setKeybind = useGameStore((s) => s.setKeybind)
  const resetKeybinds = useGameStore((s) => s.resetKeybinds)
  const saveSettingsAction = useGameStore((s) => s.saveSettings)

  const [listening, setListening] = useState(null) // which action is being rebound
  const [saved, setSaved] = useState(false)

  // Listen for key press when rebinding
  const handleKeyDown = useCallback((e) => {
    if (!listening) return
    e.preventDefault()
    e.stopPropagation()
    setKeybind(listening, e.code)
    setListening(null)
  }, [listening, setKeybind])

  useEffect(() => {
    if (listening) {
      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [listening, handleKeyDown])

  // Close on Escape (if not rebinding)
  useEffect(() => {
    const onEsc = (e) => {
      if (e.code === 'Escape' && !listening) {
        setShowSettings(false)
      }
    }
    if (showSettings) {
      window.addEventListener('keydown', onEsc)
      return () => window.removeEventListener('keydown', onEsc)
    }
  }, [showSettings, listening, setShowSettings])

  if (!showSettings) return null

  const handleSave = () => {
    audioManager.setVolume(musicVolume)
    saveSettingsAction()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleClose = () => {
    setListening(null)
    setShowSettings(false)
  }

  return (
    <div style={backdropStyle} onClick={handleClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>⚙ SETTINGS</h2>
          <button style={closeBtnStyle} onClick={handleClose}>✕</button>
        </div>

        {/* Scrollable content */}
        <div style={scrollAreaStyle}>

          {/* ── SOUND SECTION ──────────────────── */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>🔊 SOUND</h3>

            {/* Music Volume */}
            <div style={rowStyle}>
              <button
                style={muteBtnStyle(musicMuted)}
                onClick={toggleMute}
              >
                {musicMuted ? '🔇' : '🎵'}
              </button>
              <span style={labelStyle}>Music</span>
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={musicMuted ? 0 : musicVolume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  setVolume(v)
                  if (musicMuted && v > 0) toggleMute()
                }}
                style={sliderStyle}
              />
              <span style={percentStyle}>{musicMuted ? '0' : Math.round(musicVolume * 100)}%</span>
            </div>

            {/* SFX Volume */}
            <div style={rowStyle}>
              <button
                style={muteBtnStyle(sfxMuted)}
                onClick={toggleSfxMute}
              >
                {sfxMuted ? '🔇' : '🔔'}
              </button>
              <span style={labelStyle}>SFX</span>
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={sfxMuted ? 0 : sfxVolume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  setSfxVolume(v)
                  if (sfxMuted && v > 0) toggleSfxMute()
                }}
                style={sliderStyle}
              />
              <span style={percentStyle}>{sfxMuted ? '0' : Math.round(sfxVolume * 100)}%</span>
            </div>
          </div>

          {/* ── CONTROLS SECTION ───────────────── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>🎮 CONTROLS</h3>
              <button style={resetBtnStyle} onClick={resetKeybinds}>
                Reset Defaults
              </button>
            </div>

            <p style={hintStyle}>Click a key box, then press the new key to rebind.</p>

            {Object.entries(ACTION_LABELS).map(([action, label]) => (
              <div key={action} style={keybindRowStyle}>
                <span style={keybindLabelStyle}>{label}</span>
                <button
                  style={keybindBtnStyle(listening === action)}
                  onClick={() => setListening(listening === action ? null : action)}
                >
                  {listening === action ? '⏳ Press a key…' : keyLabel(keybinds[action])}
                </button>
                {action !== 'brake' && (
                  <span style={altKeyStyle}>
                    + Arrow
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button style={saveBtnStyle} onClick={handleSave}>
            {saved ? '✅ SAVED!' : '💾 SAVE'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════════════ */

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Orbitron', sans-serif",
}

const panelStyle = {
  width: 'min(520px, 92vw)',
  maxHeight: '88vh',
  background: 'linear-gradient(145deg, #0e1230 0%, #1a1a3e 50%, #111528 100%)',
  border: '1px solid rgba(0, 180, 255, 0.3)',
  borderRadius: '20px',
  boxShadow: '0 0 60px rgba(0, 180, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.4rem 1.8rem',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}

const titleStyle = {
  margin: 0,
  fontSize: '1.5rem',
  color: '#fff',
  fontWeight: 800,
  letterSpacing: '0.2em',
}

const closeBtnStyle = {
  background: 'none',
  border: '2px solid rgba(255,255,255,0.15)',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  color: '#aaa',
  fontSize: '1rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all .2s',
  fontFamily: 'inherit',
}

const scrollAreaStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '1.2rem 1.8rem',
}

const sectionStyle = {
  marginBottom: '1.8rem',
}

const sectionTitleStyle = {
  color: '#00b4ff',
  fontSize: '0.85rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  marginBottom: '1rem',
  fontWeight: 700,
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  marginBottom: '0.9rem',
}

const muteBtnStyle = (muted) => ({
  background: muted ? 'rgba(255,50,80,0.15)' : 'rgba(0,180,255,0.1)',
  border: `1px solid ${muted ? 'rgba(255,50,80,0.3)' : 'rgba(0,180,255,0.2)'}`,
  borderRadius: '8px',
  width: '38px',
  height: '38px',
  fontSize: '1.1rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all .2s',
})

const labelStyle = {
  color: '#ccc',
  fontSize: '0.85rem',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
  letterSpacing: '0.1em',
  width: '50px',
}

const sliderStyle = {
  flex: 1,
  accentColor: '#00b4ff',
  height: '6px',
  cursor: 'pointer',
}

const percentStyle = {
  color: '#888',
  fontSize: '0.8rem',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
  width: '40px',
  textAlign: 'right',
}

const hintStyle = {
  color: '#666',
  fontSize: '0.75rem',
  fontFamily: "'Rajdhani', sans-serif",
  marginBottom: '1rem',
  fontStyle: 'italic',
}

const resetBtnStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  color: '#888',
  fontSize: '0.65rem',
  fontFamily: "'Orbitron', sans-serif",
  padding: '0.4rem 0.8rem',
  cursor: 'pointer',
  letterSpacing: '0.08em',
  transition: 'all .2s',
}

const keybindRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  marginBottom: '0.7rem',
  padding: '0.5rem 0.8rem',
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.05)',
}

const keybindLabelStyle = {
  color: '#ccc',
  fontSize: '0.8rem',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 600,
  width: '130px',
  letterSpacing: '0.05em',
}

const keybindBtnStyle = (active) => ({
  flex: 1,
  padding: '0.55rem 1rem',
  background: active ? 'rgba(0,180,255,0.15)' : 'rgba(255,255,255,0.04)',
  border: `2px solid ${active ? '#00b4ff' : 'rgba(255,255,255,0.12)'}`,
  borderRadius: '8px',
  color: active ? '#00b4ff' : '#fff',
  fontSize: active ? '0.7rem' : '0.85rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  textAlign: 'center',
  cursor: 'pointer',
  letterSpacing: '0.1em',
  transition: 'all .2s',
  animation: active ? 'pulse 1s infinite' : 'none',
})

const altKeyStyle = {
  color: '#555',
  fontSize: '0.65rem',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 500,
  letterSpacing: '0.05em',
}

const footerStyle = {
  padding: '1.2rem 1.8rem',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  justifyContent: 'center',
}

const saveBtnStyle = {
  padding: '0.85rem 3rem',
  fontSize: '1rem',
  fontFamily: "'Orbitron', sans-serif",
  fontWeight: 700,
  color: '#fff',
  background: 'linear-gradient(135deg, #00b4ff 0%, #0088cc 100%)',
  border: '2px solid #00b4ff',
  borderRadius: '12px',
  cursor: 'pointer',
  letterSpacing: '0.15em',
  transition: 'all .3s ease',
  boxShadow: '0 4px 20px rgba(0,180,255,0.4), 0 0 40px rgba(0,180,255,0.15)',
  textTransform: 'uppercase',
}
