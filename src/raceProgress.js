/* ── Shared AI race-progress data ─────────────────────────────
   Written every frame by AIRacers.jsx and Car.jsx.
   Read (polled) by HUD Leaderboard — plain object, NOT reactive.
   ─────────────────────────────────────────────────────────── */

export const AI_CONFIG = [
  { name: 'HAMILTON',   color: '#1e90ff', speedFactor: 0.92, startT: 0.10 },
  { name: 'LECLERC',    color: '#dc143c', speedFactor: 0.88, startT: 0.06 },
  { name: 'VERSTAPPEN', color: '#0039a6', speedFactor: 0.95, startT: 0.08 },
  { name: 'ALONSO',     color: '#ff8c00', speedFactor: 0.85, startT: 0.12 },
  { name: 'SAINZ',      color: '#e87122', speedFactor: 0.82, startT: 0.04 },
  { name: 'NORRIS',     color: '#ff8800', speedFactor: 0.90, startT: 0.14 },
  { name: 'RUSSELL',    color: '#00b1d2', speedFactor: 0.87, startT: 0.16 },
]

// Live mutable state — mutated each frame, never triggers React re-renders
export const aiProgress = AI_CONFIG.map((cfg) => ({
  name: cfg.name,
  t:    cfg.startT,
  lap:  0,
}))

// World-space positions for minimap display — written by AIRacers.jsx each frame
export const aiWorldPositions = AI_CONFIG.map(() => ({ x: 0, z: 0 }))

export const playerProgress = { t: 0, lap: 0 }

export function resetProgress() {
  AI_CONFIG.forEach((cfg, i) => {
    aiProgress[i].t   = cfg.startT
    aiProgress[i].lap = 0
    aiWorldPositions[i].x = 0
    aiWorldPositions[i].z = 0
  })
  playerProgress.t   = 0
  playerProgress.lap = 0
}
