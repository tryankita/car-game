import { useState, useRef, useEffect } from 'react'
import useGameStore from '../../store'
import audioManager from '../../audioManager'

const LEVELS_PER_PAGE = 6

export default function Levels() {
  const levels = useGameStore((s) => s.levels)
  const selectedLevel = useGameStore((s) => s.selectedLevel)
  const completedLevels = useGameStore((s) => s.completedLevels)
  const levelStars = useGameStore((s) => s.levelStars)
  const isLevelUnlocked = useGameStore((s) => s.isLevelUnlocked)
  const selectLevel = useGameStore((s) => s.selectLevel)
  const startRace = useGameStore((s) => s.startRace)
  const setScreen = useGameStore((s) => s.setScreen)
  const [hoveredLevel, setHoveredLevel] = useState(null)

  const totalPages = Math.ceil(levels.length / LEVELS_PER_PAGE)
  const initPage = Math.floor((selectedLevel - 1) / LEVELS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(initPage)
  const slideRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'ArrowLeft') setCurrentPage((p) => Math.max(0, p - 1))
      if (e.code === 'ArrowRight') setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [totalPages])

  const handleLevelSelect = (levelId) => {
    if (!isLevelUnlocked(levelId)) return
    audioManager.enableAudio()
    selectLevel(levelId)
  }

  const handleStart = () => {
    if (!isLevelUnlocked(selectedLevel)) return
    audioManager.enableAudio()
    startRace()
  }

  const handleBack = () => {
    audioManager.enableAudio()
    setScreen('home')
  }

  const getDifficultyColor = (d) => {
    switch (d) {
      case 'Easy': return '#00ff88'
      case 'Medium': return '#00b4ff'
      case 'Hard': return '#ff9500'
      case 'Very Hard': return '#ff3250'
      case 'Extreme': return '#ff00ff'
      default: return '#888'
    }
  }

  const renderStars = (levelId) => {
    const stars = levelStars[levelId] || 0
    return (
      <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
        {[1, 2, 3].map((i) => (
          <span key={i} style={{ fontSize: '0.85rem', color: '#ffeb3b', textShadow: '0 0 6px rgba(255,235,59,0.7)', opacity: i <= stars ? 1 : 0.2 }}>
            ★
          </span>
        ))}
      </div>
    )
  }

  const pages = []
  for (let i = 0; i < totalPages; i++) {
    pages.push(levels.slice(i * LEVELS_PER_PAGE, (i + 1) * LEVELS_PER_PAGE))
  }

  return (
    <div style={containerStyle}>
      <div style={bgLayer1} />
      <div style={bgLayer2} />
      <div style={gridOverlay} />

      <div style={contentWrapper}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <span style={whiteText}>SELECT</span>{' '}
            <span style={gradientText}>LEVEL</span>
          </h1>
          <div style={pageIndicatorTextStyle}>Page {currentPage + 1} / {totalPages}</div>
        </div>

        <div style={slideshowContainer}>
          <button style={{ ...arrowBtn, opacity: currentPage > 0 ? 1 : 0.25 }} onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>◄</button>

          <div style={slideViewport}>
            <div ref={slideRef} style={{ ...slideTrack, transform: `translateX(-${currentPage * 100}%)` }}>
              {pages.map((page, pageIdx) => (
                <div key={pageIdx} style={slidePage}>
                  <div style={levelsGrid}>
                    {page.map((level) => {
                      const isSelected = level.id === selectedLevel
                      const isHovered = level.id === hoveredLevel
                      const isUnlocked = isLevelUnlocked(level.id)
                      const isCompleted = completedLevels.includes(level.id)
                      const diffColor = getDifficultyColor(level.difficulty)

                      return (
                        <div key={level.id} style={{ ...levelCard, ...(!isUnlocked ? lockedCardStyle : {}), ...(isSelected && isUnlocked ? selectedCardStyle(diffColor) : {}), ...(isHovered && isUnlocked && !isSelected ? hoverCardStyle(diffColor) : {}), cursor: isUnlocked ? 'pointer' : 'not-allowed' }} onClick={() => handleLevelSelect(level.id)} onMouseEnter={() => setHoveredLevel(level.id)} onMouseLeave={() => setHoveredLevel(null)}>
                          {!isUnlocked && <div style={lockOverlay}>🔒</div>}
                          <div style={levelNumStyle(diffColor)}>{level.id}</div>
                          <div style={levelNameStyle}>{level.name}</div>
                          <span style={diffBadge(diffColor)}>{level.difficulty}</span>
                          <div style={statsRow}>
                            <span style={statItem}>{level.laps} Laps</span>
                            <span style={statItem}>{level.topSpeed} km/h</span>
                          </div>
                          {isCompleted && renderStars(level.id)}
                          {isSelected && isUnlocked && <div style={tickBadge}>✓</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button style={{ ...arrowBtn, opacity: currentPage < totalPages - 1 ? 1 : 0.25 }} onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}>►</button>
        </div>

        <div style={dotsRow}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setCurrentPage(i)} style={dotStyle(i === currentPage)} />
          ))}
        </div>

        <div style={buttonsContainer}>
          <button style={backButton} onClick={handleBack}>← BACK</button>
          <button style={{ ...startButton, opacity: isLevelUnlocked(selectedLevel) ? 1 : 0.4, cursor: isLevelUnlocked(selectedLevel) ? 'pointer' : 'not-allowed' }} onClick={handleStart}>START RACE →</button>
        </div>
      </div>
    </div>
  )
}

const containerStyle = { position: 'fixed', inset: 0, overflow: 'hidden', background: '#050510', fontFamily: "'Orbitron', sans-serif", zIndex: 10 }
const bgLayer1 = { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 80% at 0% 50%, rgba(0,180,255,0.25) 0%, transparent 50%), radial-gradient(ellipse 100% 80% at 100% 50%, rgba(255,50,80,0.3) 0%, transparent 50%)', pointerEvents: 'none' }
const bgLayer2 = { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,15,0.6) 0%, rgba(5,5,20,0.8) 50%, rgba(0,0,0,0.9) 100%)', pointerEvents: 'none' }
const gridOverlay = { position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,255,0.03) 2px, rgba(0,180,255,0.03) 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,50,80,0.03) 2px, rgba(255,50,80,0.03) 3px)', backgroundSize: '60px 60px', opacity: 0.4, pointerEvents: 'none' }
const contentWrapper = { position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', gap: '1rem', boxSizing: 'border-box' }
const headerStyle = { textAlign: 'center' }
const titleStyle = { fontSize: 'clamp(1.6rem, 3.5vw, 3rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, fontStyle: 'italic' }
const whiteText = { color: '#fff', textShadow: '0 0 20px rgba(0,180,255,0.8), 0 0 40px rgba(0,180,255,0.6), 2px 2px 4px rgba(0,0,0,0.8)' }
const gradientText = { background: 'linear-gradient(90deg, #00b4ff 0%, #ff3250 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
const pageIndicatorTextStyle = { color: '#555', fontSize: '0.7rem', letterSpacing: '0.2em', marginTop: '0.35rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }
const slideshowContainer = { display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', maxWidth: '1100px' }
const arrowBtn = { flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', transition: 'all .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', sans-serif" }
const slideViewport = { flex: 1, overflow: 'hidden', borderRadius: '16px' }
const slideTrack = { display: 'flex', transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)' }
const slidePage = { minWidth: '100%', padding: '0.5rem', boxSizing: 'border-box' }
const levelsGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(0.6rem, 1vw, 1.2rem)', width: '100%' }
const levelCard = { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: 'clamp(0.7rem, 1.2vw, 1.2rem)', background: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(10px)', border: '2px solid rgba(100,100,100,0.25)', borderRadius: '14px', transition: 'all 0.3s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', textAlign: 'center' }
const lockedCardStyle = { filter: 'brightness(0.45)', border: '2px solid rgba(255,50,80,0.2)', background: 'rgba(20,5,10,0.5)' }
const selectedCardStyle = (color) => ({ border: '2px solid ' + color, background: 'rgba(0,180,255,0.1)', boxShadow: '0 0 20px ' + color + '55, 0 4px 24px rgba(0,0,0,0.6)', transform: 'translateY(-3px)' })
const hoverCardStyle = (color) => ({ transform: 'translateY(-3px)', border: '2px solid ' + color + '88', boxShadow: '0 0 14px ' + color + '44, 0 4px 20px rgba(0,0,0,0.6)' })
const lockOverlay = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', zIndex: 2, borderRadius: '12px' }
const levelNumStyle = (color) => ({ fontSize: 'clamp(1.6rem, 2.5vw, 2.5rem)', fontWeight: 900, color: '#fff', textShadow: '0 0 10px ' + color + '88', lineHeight: 1 })
const levelNameStyle = { fontSize: 'clamp(0.65rem, 0.9vw, 0.85rem)', fontWeight: 700, color: '#ddd', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }
const diffBadge = (color) => ({ fontSize: '0.55rem', fontWeight: 600, padding: '0.15rem 0.55rem', border: '1px solid ' + color, borderRadius: '20px', color: color, textTransform: 'uppercase', letterSpacing: '0.06em' })
const statsRow = { display: 'flex', gap: '0.6rem', alignItems: 'center' }
const statItem = { fontSize: '0.6rem', color: '#888', letterSpacing: '0.03em', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }
const tickBadge = { position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,180,255,0.2)', border: '2px solid #00b4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#00b4ff', boxShadow: '0 0 8px rgba(0,180,255,0.4)' }
const dotsRow = { display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }
const dotStyle = (active) => ({ width: active ? '24px' : '10px', height: '10px', borderRadius: '5px', background: active ? '#00b4ff' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: active ? '0 0 10px rgba(0,180,255,0.5)' : 'none', padding: 0 })
const buttonsContainer = { display: 'flex', gap: '1.5rem' }
const backButton = { minWidth: '140px', padding: '0.85rem 2rem', fontSize: '0.9rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", color: '#fff', background: 'rgba(10,10,20,0.7)', backdropFilter: 'blur(10px)', border: '2px solid rgba(100,100,100,0.5)', borderRadius: '8px', cursor: 'pointer', transition: 'all .3s', textTransform: 'uppercase', letterSpacing: '0.12em', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', outline: 'none' }
const startButton = { minWidth: '180px', padding: '0.85rem 2rem', fontSize: '0.9rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", color: '#fff', background: 'rgba(0,180,255,0.2)', backdropFilter: 'blur(10px)', border: '2px solid #00b4ff', borderRadius: '8px', transition: 'all .3s', textTransform: 'uppercase', letterSpacing: '0.12em', boxShadow: '0 0 20px rgba(0,180,255,0.4), 0 4px 20px rgba(0,0,0,0.5)', outline: 'none' }
