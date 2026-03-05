import { create } from 'zustand'
import audioManager from './audioManager'
import { LEVEL_TRACKS, makeCurve } from './trackData'

// Load persisted progress from localStorage
function loadProgress() {
  try {
    const saved = localStorage.getItem('carRacingProgress')
    if (saved) {
      const { completedLevels, levelStars, coins } = JSON.parse(saved)
      return { 
        completedLevels: completedLevels || [1], 
        levelStars: levelStars || {},
        coins: coins || 0 
      }
    }
  } catch (e) { /* ignore */ }
  return { completedLevels: [1], levelStars: {}, coins: 0 }
}

function saveProgress(completedLevels, levelStars, coins) {
  try {
    localStorage.setItem('carRacingProgress', JSON.stringify({ completedLevels, levelStars, coins }))
  } catch (e) { /* ignore */ }
}

// Default key bindings
const DEFAULT_KEYBINDS = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  brake: 'Space',
}

// Load persisted settings from localStorage
function loadSettings() {
  try {
    const saved = localStorage.getItem('carRacingSettings')
    if (saved) {
      const { keybinds, musicVolume, sfxVolume, musicMuted, sfxMuted } = JSON.parse(saved)
      return {
        keybinds: keybinds || { ...DEFAULT_KEYBINDS },
        musicVolume: musicVolume ?? 0.3,
        sfxVolume: sfxVolume ?? 0.5,
        musicMuted: musicMuted ?? false,
        sfxMuted: sfxMuted ?? false,
      }
    }
  } catch (e) { /* ignore */ }
  return {
    keybinds: { ...DEFAULT_KEYBINDS },
    musicVolume: 0.3,
    sfxVolume: 0.5,
    musicMuted: false,
    sfxMuted: false,
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem('carRacingSettings', JSON.stringify(settings))
  } catch (e) { /* ignore */ }
}

const savedProgress = loadProgress()
const savedSettings = loadSettings()

// ── Dynamic star thresholds based on track length ───────────
// Computes the spline length for a level and derives moderate
// lap-time targets from it.  Cached so the curve is only built once.

const _starCache = {}

// Difficulty → expected avg speed (world-units/s) for an experienced player
const DIFF_SPEED = {
  'Easy':      22,
  'Medium':    26,
  'Hard':      30,
  'Very Hard': 34,
  'Extreme':   38,
}

// Tighter star cut-offs: 3-star = clean fast, 2-star = a few mistakes
export function getStarThresholds(levelId, difficulty) {
  const key = `${levelId}_${difficulty}`
  if (_starCache[key]) return _starCache[key]

  const trackCfg = LEVEL_TRACKS[levelId - 1]
  let trackLength = 600
  if (trackCfg) {
    try {
      const curve = makeCurve(trackCfg.cp)
      trackLength = curve.getLength()
    } catch { /* use fallback */ }
  }

  const avgSpeed = DIFF_SPEED[difficulty] || 26
  const baseLap = Math.round(trackLength / avgSpeed)

  const result = {
    s3: Math.max(12, Math.round(baseLap * 0.85)),   // tight — needs near-perfect driving
    s2: Math.max(18, Math.round(baseLap * 1.15)),   // moderate — small mistakes OK
  }

  _starCache[key] = result
  return result
}

// Time limit for the whole race (all laps combined), by difficulty
// These are tight: you need consistent clean laps to not run out of time.
const _timeLimitCache = {}
export function getRaceTimeLimit(levelId, difficulty, totalLaps) {
  const key = `${levelId}_${difficulty}_${totalLaps}`
  if (_timeLimitCache[key]) return _timeLimitCache[key]

  const trackCfg = LEVEL_TRACKS[levelId - 1]
  let trackLength = 600
  if (trackCfg) {
    try {
      const curve = makeCurve(trackCfg.cp)
      trackLength = curve.getLength()
    } catch { /* use fallback */ }
  }

  const avgSpeed = DIFF_SPEED[difficulty] || 26
  // Give a multiplier based on level — early levels (1-6) get more breathing room
  const timeMult = levelId <= 6 ? 1.6 : 1.3
  const lapTime = trackLength / avgSpeed
  const limit = Math.round(lapTime * totalLaps * timeMult)

  _timeLimitCache[key] = Math.max(30, limit)
  return _timeLimitCache[key]
}

const useGameStore = create((set, get) => ({
  // --- Screens ---
  screen: 'home', // 'home' | 'garage' | 'levels' | 'playing'

  // --- Level Selection ---
  selectedLevel: 1,
  completedLevels: savedProgress.completedLevels,
  levelStars: savedProgress.levelStars,
  coins: savedProgress.coins,
  lastRaceReward: 0,
  levels: [
    { id: 1,  name: 'Rookie Run',        difficulty: 'Easy',      laps: 2, topSpeed: 40 },
    { id: 2,  name: 'City Circuit',       difficulty: 'Easy',      laps: 2, topSpeed: 42 },
    { id: 3,  name: 'Coastal Drive',      difficulty: 'Easy',      laps: 2, topSpeed: 44 },
    { id: 4,  name: 'Park Lane',          difficulty: 'Easy',      laps: 2, topSpeed: 46 },
    { id: 5,  name: 'Sunset Strip',       difficulty: 'Easy',      laps: 2, topSpeed: 48 },
    { id: 6,  name: 'River Bend',         difficulty: 'Medium',    laps: 3, topSpeed: 50 },
    { id: 7,  name: 'Mountain Pass',      difficulty: 'Medium',    laps: 3, topSpeed: 52 },
    { id: 8,  name: 'Desert Storm',       difficulty: 'Medium',    laps: 3, topSpeed: 54 },
    { id: 9,  name: 'Canyon Rush',        difficulty: 'Medium',    laps: 3, topSpeed: 55 },
    { id: 10, name: 'Lakeside Loop',      difficulty: 'Medium',    laps: 3, topSpeed: 56 },
    { id: 11, name: 'Night Rush',         difficulty: 'Medium',    laps: 3, topSpeed: 57 },
    { id: 12, name: 'Speed Valley',       difficulty: 'Medium',    laps: 3, topSpeed: 58 },
    { id: 13, name: 'Forest Trail',       difficulty: 'Medium',    laps: 3, topSpeed: 59 },
    { id: 14, name: 'Harbor Sprint',      difficulty: 'Medium',    laps: 3, topSpeed: 60 },
    { id: 15, name: 'Metro Dash',         difficulty: 'Medium',    laps: 3, topSpeed: 61 },
    { id: 16, name: 'Thunder Road',       difficulty: 'Hard',      laps: 4, topSpeed: 62 },
    { id: 17, name: 'Frost Circuit',      difficulty: 'Hard',      laps: 4, topSpeed: 63 },
    { id: 18, name: 'Volcano Loop',       difficulty: 'Hard',      laps: 4, topSpeed: 64 },
    { id: 19, name: 'Skyline Run',        difficulty: 'Hard',      laps: 4, topSpeed: 65 },
    { id: 20, name: 'Iron Gauntlet',      difficulty: 'Hard',      laps: 4, topSpeed: 66 },
    { id: 21, name: 'Serpent Trail',       difficulty: 'Hard',      laps: 4, topSpeed: 67 },
    { id: 22, name: 'Ghost Highway',      difficulty: 'Hard',      laps: 4, topSpeed: 68 },
    { id: 23, name: 'Blizzard Pass',      difficulty: 'Hard',      laps: 4, topSpeed: 69 },
    { id: 24, name: 'Lava Circuit',       difficulty: 'Hard',      laps: 4, topSpeed: 70 },
    { id: 25, name: 'Neon Strip',         difficulty: 'Hard',      laps: 4, topSpeed: 71 },
    { id: 26, name: 'Elite Track',        difficulty: 'Very Hard', laps: 5, topSpeed: 72 },
    { id: 27, name: 'Apex Rally',         difficulty: 'Very Hard', laps: 5, topSpeed: 73 },
    { id: 28, name: 'Razor Edge',         difficulty: 'Very Hard', laps: 5, topSpeed: 74 },
    { id: 29, name: 'Storm Chaser',       difficulty: 'Very Hard', laps: 5, topSpeed: 75 },
    { id: 30, name: 'Vortex Run',         difficulty: 'Very Hard', laps: 5, topSpeed: 76 },
    { id: 31, name: 'Twilight Drift',     difficulty: 'Very Hard', laps: 5, topSpeed: 77 },
    { id: 32, name: 'Dark Circuit',       difficulty: 'Very Hard', laps: 5, topSpeed: 78 },
    { id: 33, name: 'Quantum Loop',       difficulty: 'Very Hard', laps: 5, topSpeed: 79 },
    { id: 34, name: 'Shadow Valley',      difficulty: 'Very Hard', laps: 5, topSpeed: 80 },
    { id: 35, name: 'Phantom Circuit',    difficulty: 'Very Hard', laps: 5, topSpeed: 81 },
    { id: 36, name: 'Champion Circuit',   difficulty: 'Extreme',   laps: 5, topSpeed: 82 },
    { id: 37, name: 'Inferno Road',       difficulty: 'Extreme',   laps: 5, topSpeed: 83 },
    { id: 38, name: 'Warp Speed',         difficulty: 'Extreme',   laps: 5, topSpeed: 84 },
    { id: 39, name: 'Death Valley',       difficulty: 'Extreme',   laps: 5, topSpeed: 85 },
    { id: 40, name: 'Omega Circuit',      difficulty: 'Extreme',   laps: 5, topSpeed: 86 },
    { id: 41, name: 'Nightmare Run',      difficulty: 'Extreme',   laps: 6, topSpeed: 87 },
    { id: 42, name: 'Titan Sprint',       difficulty: 'Extreme',   laps: 6, topSpeed: 88 },
    { id: 43, name: 'Zero Gravity',       difficulty: 'Extreme',   laps: 6, topSpeed: 89 },
    { id: 44, name: 'Hyper Loop',         difficulty: 'Extreme',   laps: 6, topSpeed: 90 },
    { id: 45, name: 'Plasma Trail',       difficulty: 'Extreme',   laps: 6, topSpeed: 91 },
    { id: 46, name: 'Nebula Run',         difficulty: 'Extreme',   laps: 6, topSpeed: 92 },
    { id: 47, name: 'Singularity',        difficulty: 'Extreme',   laps: 6, topSpeed: 93 },
    { id: 48, name: 'Event Horizon',      difficulty: 'Extreme',   laps: 6, topSpeed: 94 },
    { id: 49, name: 'Final Frontier',     difficulty: 'Extreme',   laps: 7, topSpeed: 95 },
    { id: 50, name: 'Legend Road',         difficulty: 'Extreme',   laps: 7, topSpeed: 100 },
  ],

  // --- Audio ---
  musicMuted: savedSettings.musicMuted,
  musicVolume: savedSettings.musicVolume,
  sfxVolume: savedSettings.sfxVolume,
  sfxMuted: savedSettings.sfxMuted,

  // --- Controls / Keybinds ---
  keybinds: savedSettings.keybinds,
  showSettings: false,

  // --- Car selection ---
  selectedCar: 0,
  cars: [
    { name: 'Speedster', color: '#e74c3c', topSpeed: 55, handling: 3.2, acceleration: 28, description: 'Built for pure speed', model: '/models/muscle_car.glb', scale: 1.5, previewScale: 0.9, modelRotY: 0, modelPosY: 0.35 },
    { name: 'Phantom', color: '#3498db', topSpeed: 48, handling: 4.0, acceleration: 22, description: 'Best handling on the track', model: '/models/sport_car.glb', scale: 0.28, previewScale: 0.22, modelRotY: -Math.PI / 2, modelPosY: 0.0 },
    { name: 'Viper', color: '#2ecc71', topSpeed: 60, handling: 2.8, acceleration: 32, description: 'Raw acceleration power', model: '/models/muscle_car.glb', scale: 1.5, previewScale: 0.9, modelRotY: 0, modelPosY: 0.35 },
    { name: 'Shadow', color: '#9b59b6', topSpeed: 52, handling: 3.5, acceleration: 26, description: 'Balanced all-rounder', model: '/models/muscle_car.glb', scale: 1.5, previewScale: 0.9, modelRotY: 0, modelPosY: 0.35 },
  ],

  // --- Race state ---
  carPosition: { x: 150, z: 0 },
  carRotation: 0,
  speed: 0,
  raceTime: 0,
  raceTimeLimit: 120,
  timeFailed: false,
  currentLap: 0,
  totalLaps: 3,
  bestLap: Infinity,
  lapTimes: [],
  raceStarted: false,
  raceFinished: false,
  paused: false,
  countdown: 0,

  // --- Actions ---
  setScreen: (screen) => set({ screen }),
  selectCar: (idx) => set({ selectedCar: idx }),
  selectLevel: (levelId) => set({ selectedLevel: levelId }),
  setSpeed: (speed) => set({ speed }),
  setRaceTime: (t) => {
    const s = get()
    if (s.raceFinished || s.timeFailed) return
    set({ raceTime: t })
    // Check time-out
    if (t >= s.raceTimeLimit && s.raceStarted && !s.raceFinished) {
      set({ timeFailed: true, raceFinished: true })
    }
  },
  setCarPosition: (x, z, ry) => set({ carPosition: { x, z }, carRotation: ry }),

  startRace: () => {
    const level = get().levels.find(l => l.id === get().selectedLevel)
    const laps = level ? level.laps : 3
    const timeLimit = getRaceTimeLimit(
      get().selectedLevel,
      level ? level.difficulty : 'Easy',
      laps
    )
    set({
      screen: 'prerace',
      speed: 0,
      raceTime: 0,
      raceTimeLimit: timeLimit,
      timeFailed: false,
      currentLap: 0,
      totalLaps: laps,
      bestLap: Infinity,
      lapTimes: [],
      raceStarted: false,
      raceFinished: false,
      paused: false,
      countdown: 3,
      lastRaceReward: 0,
    })
  },

  // Go from prerace screen to actual playing
  launchRace: () => set({ screen: 'playing' }),

  setCountdown: (c) => set({ countdown: c }),
  setRaceStarted: (v) => set({ raceStarted: v }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setPaused: (v) => set({ paused: v }),

  completeLap: (lapTime) => {
    const s = get()
    const newLapTimes = [...s.lapTimes, lapTime]
    const newBest = Math.min(s.bestLap, lapTime)
    const newLap = s.currentLap + 1

    if (newLap >= s.totalLaps) {
      set({ currentLap: newLap, lapTimes: newLapTimes, bestLap: newBest, raceFinished: true })
    } else {
      set({ currentLap: newLap, lapTimes: newLapTimes, bestLap: newBest })
    }
  },

  // Calculate star rating based on best lap time and level difficulty
  calculateStars: () => {
    const s = get()
    const level = s.levels.find(l => l.id === s.selectedLevel)
    if (!level || s.bestLap === Infinity) return 1

    const t = getStarThresholds(s.selectedLevel, level.difficulty)
    if (s.bestLap < t.s3) return 3
    if (s.bestLap < t.s2) return 2
    return 1
  },

  // Complete a level with stars
  completeLevel: () => {
    const s = get()
    const levelId = s.selectedLevel
    const stars = get().calculateStars()

    const newCompleted = new Set(s.completedLevels)
    newCompleted.add(levelId)

    // If not last level, also unlock next level
    if (levelId < 50) {
      newCompleted.add(levelId + 1)
    }

    const newCompletedArr = Array.from(newCompleted)
    const newLevelStars = { ...s.levelStars, [levelId]: stars }

    // Reward coins
    const reward = stars * 50
    const newCoins = (s.coins || 0) + reward

    // Save to localStorage
    saveProgress(newCompletedArr, newLevelStars, newCoins)

    set({
      completedLevels: newCompletedArr,
      levelStars: newLevelStars,
      coins: newCoins,
      lastRaceReward: reward,
    })
  },

  // Check if a level is unlocked
  isLevelUnlocked: (levelId) => {
    const s = get()
    return s.completedLevels.includes(levelId)
  },

  goHome: () => set({ screen: 'home', raceFinished: false, speed: 0 }),

  // --- Audio Actions ---
  toggleMute: () => {
    const muted = audioManager.toggleMute()
    set({ musicMuted: muted })
  },

  setVolume: (vol) => {
    audioManager.setVolume(vol)
    set({ musicVolume: vol })
  },

  setSfxVolume: (vol) => set({ sfxVolume: vol }),
  toggleSfxMute: () => set((s) => ({ sfxMuted: !s.sfxMuted })),

  // --- Settings overlay ---
  setShowSettings: (v) => set({ showSettings: v }),

  // --- Keybind Actions ---
  setKeybind: (action, keyCode) => set((s) => ({
    keybinds: { ...s.keybinds, [action]: keyCode },
  })),
  resetKeybinds: () => set({ keybinds: { ...DEFAULT_KEYBINDS } }),

  // --- Save all settings to localStorage ---
  saveSettings: () => {
    const s = get()
    saveSettings({
      keybinds: s.keybinds,
      musicVolume: s.musicVolume,
      sfxVolume: s.sfxVolume,
      musicMuted: s.musicMuted,
      sfxMuted: s.sfxMuted,
    })
  },
}))

export { DEFAULT_KEYBINDS }
export default useGameStore
