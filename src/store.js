import { create } from 'zustand'

const useGameStore = create((set, get) => ({
  // --- Screens ---
  screen: 'home', // 'home' | 'garage' | 'playing'

  // --- Car selection ---
  selectedCar: 0,
  cars: [
    { name: 'Speedster', color: '#e74c3c', topSpeed: 55, handling: 3.2, acceleration: 28, description: 'Built for pure speed' },
    { name: 'Phantom', color: '#3498db', topSpeed: 48, handling: 4.0, acceleration: 22, description: 'Best handling on the track' },
    { name: 'Viper', color: '#2ecc71', topSpeed: 60, handling: 2.8, acceleration: 32, description: 'Raw acceleration power' },
    { name: 'Shadow', color: '#9b59b6', topSpeed: 52, handling: 3.5, acceleration: 26, description: 'Balanced all-rounder' },
  ],

  // --- Race state ---
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
  setSpeed: (speed) => set({ speed }),
  setRaceTime: (t) => set({ raceTime: t }),

  startRace: () =>
    set({
      screen: 'playing',
      speed: 0,
      raceTime: 0,
      currentLap: 0,
      bestLap: Infinity,
      lapTimes: [],
      raceStarted: false,
      raceFinished: false,
      countdown: 3,
    }),

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

  goHome: () => set({ screen: 'home', raceFinished: false, speed: 0 }),
}))

export default useGameStore
