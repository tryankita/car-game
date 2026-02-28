import { create } from 'zustand'
import audioManager from './audioManager'

// Load persisted progress from localStorage
function loadProgress() {
  try {
    const saved = localStorage.getItem('carRacingProgress')
    if (saved) {
      const { completedLevels, levelStars } = JSON.parse(saved)
      return { completedLevels: completedLevels || [1], levelStars: levelStars || {} }
    }
  } catch (e) { /* ignore */ }
  return { completedLevels: [1], levelStars: {} }
}

function saveProgress(completedLevels, levelStars) {
  try {
    localStorage.setItem('carRacingProgress', JSON.stringify({ completedLevels, levelStars }))
  } catch (e) { /* ignore */ }
}

const savedProgress = loadProgress()

const useGameStore = create((set, get) => ({
  // --- Screens ---
  screen: 'home', // 'home' | 'garage' | 'levels' | 'playing'

  // --- Level Selection ---
  selectedLevel: 1,
  completedLevels: savedProgress.completedLevels,
  levelStars: savedProgress.levelStars,
  levels: [
    { id: 1, name: 'Rookie Run', difficulty: 'Easy', laps: 2, topSpeed: 40 },
    { id: 2, name: 'City Circuit', difficulty: 'Easy', laps: 2, topSpeed: 45 },
    { id: 3, name: 'Coastal Drive', difficulty: 'Medium', laps: 3, topSpeed: 50 },
    { id: 4, name: 'Mountain Pass', difficulty: 'Medium', laps: 3, topSpeed: 52 },
    { id: 5, name: 'Desert Storm', difficulty: 'Medium', laps: 3, topSpeed: 55 },
    { id: 6, name: 'Night Rush', difficulty: 'Hard', laps: 4, topSpeed: 58 },
    { id: 7, name: 'Speed Valley', difficulty: 'Hard', laps: 4, topSpeed: 60 },
    { id: 8, name: 'Elite Track', difficulty: 'Very Hard', laps: 5, topSpeed: 65 },
    { id: 9, name: 'Champion Circuit', difficulty: 'Very Hard', laps: 5, topSpeed: 68 },
    { id: 10, name: 'Legend Road', difficulty: 'Extreme', laps: 5, topSpeed: 70 },
  ],

  // --- Audio ---
  musicMuted: false,
  musicVolume: 0.3,

  // --- Car selection ---
  selectedCar: 0,
  cars: [
    { name: 'Speedster', color: '#e74c3c', topSpeed: 55, handling: 3.2, acceleration: 28, description: 'Built for pure speed' },
    { name: 'Phantom', color: '#3498db', topSpeed: 48, handling: 4.0, acceleration: 22, description: 'Best handling on the track' },
    { name: 'Viper', color: '#2ecc71', topSpeed: 60, handling: 2.8, acceleration: 32, description: 'Raw acceleration power' },
    { name: 'Shadow', color: '#9b59b6', topSpeed: 52, handling: 3.5, acceleration: 26, description: 'Balanced all-rounder' },
  ],

  // --- Race state ---
  carPosition: { x: 150, z: 0 },
  carRotation: 0,
  speed: 0,
  raceTime: 0,
  currentLap: 0,
  totalLaps: 3,
  bestLap: Infinity,
  lapTimes: [],
  raceStarted: false,
  raceFinished: false,
  countdown: 0,

  // --- Actions ---
  setScreen: (screen) => set({ screen }),
  selectCar: (idx) => set({ selectedCar: idx }),
  selectLevel: (levelId) => set({ selectedLevel: levelId }),
  setSpeed: (speed) => set({ speed }),
  setRaceTime: (t) => set({ raceTime: t }),
  setCarPosition: (x, z, ry) => set({ carPosition: { x, z }, carRotation: ry }),

  startRace: () => {
    const level = get().levels.find(l => l.id === get().selectedLevel)
    set({
      screen: 'playing',
      speed: 0,
      raceTime: 0,
      currentLap: 0,
      totalLaps: level ? level.laps : 3,
      bestLap: Infinity,
      lapTimes: [],
      raceStarted: false,
      raceFinished: false,
      countdown: 3,
    })
  },

  setCountdown: (c) => set({ countdown: c }),
  setRaceStarted: (v) => set({ raceStarted: v }),

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

    // Star thresholds vary by difficulty
    const thresholds = {
      'Easy': { s3: 30, s2: 45 },      // 3 stars < 30s, 2 stars < 45s, 1 star else
      'Medium': { s3: 45, s2: 65 },    // 3 stars < 45s, 2 stars < 65s, 1 star else
      'Hard': { s3: 50, s2: 75 },
      'Very Hard': { s3: 55, s2: 85 },
      'Extreme': { s3: 60, s2: 95 },
    }

    const t = thresholds[level.difficulty] || { s3: 50, s2: 75 }
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
    if (levelId < 10) {
      newCompleted.add(levelId + 1)
    }

    const newCompletedArr = Array.from(newCompleted)
    const newLevelStars = { ...s.levelStars, [levelId]: stars }

    // Save to localStorage
    saveProgress(newCompletedArr, newLevelStars)

    set({
      completedLevels: newCompletedArr,
      levelStars: newLevelStars,
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
}))

export default useGameStore
