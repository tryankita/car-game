import * as THREE from 'three'

/* ═══════════════════════════════════════════════════════════════
   Shared track geometry data — used by Track.jsx (visuals)
   and Car.jsx (collision).
   Supports 50 levels with progressive difficulty.
   ═══════════════════════════════════════════════════════════════ */

// ── Level track configurations ──────────────────────────────
//    cp       – control points [x, z]
//    spawn    – car spawn [x, z]
//    sfX      – start/finish centre X
//    sfRange  – ± range for lap detection on X axis
//    sfLeaveZ – how far from z=0 car must travel before a lap counts

// ── 10 hand-crafted base tracks ─────────────────────────────
const BASE_TRACKS = [
  /* ── Level 1: Rookie Run – L-shaped kink ────────────────── */
  {
    cp: [
      [120, -25],  [120, 65],
      [88, 110],   [24, 98],
      [-40, 105],  [-88, 56],
      [-88, -40],  [-32, -82],
    ],
    spawn: [120, -5], sfX: 120, sfRange: 15, sfLeaveZ: 30,
  },

  /* ── Level 2: City Circuit – P-shaped hook ────────────────
 
jkj kjh kjh khkhjfgkuf uyfiu fiufiuyfi uyfiuyfiuyf  iufiuyfiu yfu iyfuiyfiuy ffiufufifiuf uf

dgsgs dg d s sg sdg sd gsd dsg ds gd dfg dfg dfgdfdfhfhdhgfng gg gh gh hg g g

gfouomumuouuii u  ouoo  uo  uo uoyyftyutnt rturtrtut tru rty rtyu uurutyuur rtutyurtr ty yyyyyyyyyy y  y ruy

greg erge rgergerg eg erg egeg ergerge r ergeregr45er r erg rg e er ergefwfvervevewvevevkrnvje kj vkjev  gthih this the main part oof the mlsit is that it iwas the best way to describe that i was only  falling the last four mounth int hemin paet idt hy this is the tetete the t hte the the the teh eth eth ethet et eth eteth eth eth eth eth teth thet th teht teh teh eth eth eth th eth teh tht teh the the th eth efdg dfg dsg sdf hfdh sdfh sdfh sdhsdfh d
  */








  {
    cp: [
      [130, -15],  [130, 85],
      [78, 125],   [-8, 118],
      [-78, 86],   [-115, 24],
      [-62, -48],  [16, -95],
    ],
    spawn: [130, -5], sfX: 130, sfRange: 15, sfLeaveZ: 35,
  },

  /* ── Level 3: Coastal Drive – angular zigzag ────────────── */
  {
    cp: [
      [140, -30],  [140, 68],
      [82, 128],   [8, 84],
      [-68, 122],  [-128, 76],
      [-105, -15], [-45, -84],
      [30, -115],  [105, -68],
    ],
    spawn: [140, -5], sfX: 140, sfRange: 15, sfLeaveZ: 35,
  },

  /* ── Level 4: Mountain Pass – boomerang sweep ───────────── */
  {
    cp: [
      [150, -38],  [150, 75],
      [95, 142],   [8, 158],
      [-82, 120],  [-135, 60],
      [-112, -30], [-45, -90],
      [38, -128],  [90, -82],
      [135, -98],  [148, -60],
    ],
    spawn: [150, -5], sfX: 150, sfRange: 15, sfLeaveZ: 38,
  },

  /* ── Level 5: Desert Storm – chicane section ───────────── */
  {
    cp: [
      [120, -60], [120, 70],
      [80, 115],  [20, 120],
      [-30, 100], [-70, 125],
      [-100, 90], [-120, 40],
      [-120, -35],[-85, -80],
      [-30, -95], [20, -70],
      [60, -100], [95, -80],
    ],
    spawn: [120, -5], sfX: 120, sfRange: 15, sfLeaveZ: 35,
  },

  /* ── Level 6: Night Rush – multiple direction changes ──── */
  {
    cp: [
      [130, -70], [130, 70],
      [95, 125],  [35, 135],
      [-20, 115], [-55, 140],
      [-95, 115], [-120, 60],
      [-120, -15],[-100, -70],
      [-55, -105],[0, -80],
      [40, -105], [80, -85],
      [110, -95], [125, -78],
    ],
    spawn: [130, -5], sfX: 130, sfRange: 15, sfLeaveZ: 35,
  },

  /* ── Level 7: Speed Valley – long straights + tight turns ─ */
  {
    cp: [
      [140, -80], [140, 80],
      [105, 140], [40, 155],
      [-15, 140], [-55, 160],
      [-95, 135], [-125, 75],
      [-125, -10],[-108, -65],
      [-65, -105],[-10, -80],
      [30, -110], [75, -125],
      [115, -115],[133, -95],
    ],
    spawn: [140, -5], sfX: 140, sfRange: 15, sfLeaveZ: 38,
  },

  /* ── Level 8: Elite Track – hairpin + esses ────────────── */
  {
    cp: [
      [145, -90], [145, 90],
      [115, 150], [55, 170],
      [-5, 155],  [-45, 175],
      [-85, 150], [-115, 105],
      [-128, 35], [-128, -35],
      [-108, -85],[-60, -115],
      [-5, -88],  [30, -115],
      [75, -95],  [105, -125],
      [130, -120],[142, -100],
    ],
    spawn: [145, -5], sfX: 145, sfRange: 15, sfLeaveZ: 40,
  },

  /* ── Level 9: Champion Circuit – highly technical ──────── */
  {
    cp: [
      [148, -95], [148, 95],
      [128, 155], [75, 185],
      [25, 175],  [-15, 192],
      [-55, 168], [-88, 182],
      [-118, 148],[-133, 85],
      [-133, -15],[-115, -78],
      [-72, -118],[-25, -90],
      [10, -118], [48, -88],
      [78, -120], [118, -138],
      [140, -122],[148, -105],
    ],
    spawn: [148, -5], sfX: 148, sfRange: 15, sfLeaveZ: 40,
  },

  /* ── Level 10: Legend Road – ultimate F1 circuit ────────── */
  {
    cp: [
      [150, -100],[150, 100],
      [140, 160], [100, 200],
      [50, 195],  [20, 168],  [-5, 195],
      [-45, 168], [-75, 190],
      [-105, 165],[-125, 110],
      [-125, -20],
      [-110, -85],[-75, -125],[-35, -95],
      [-5, -125], [35, -88],  [65, -118],
      [105, -138],[142, -128],
    ],
    spawn: [150, -5], sfX: 150, sfRange: 15, sfLeaveZ: 40,
  },
]

/* ── Procedurally generate levels 11-50 from the 10 base tracks ──
   Each set of 10 uses a different transform:
     11-20: mirrored X + scaled 1.1
     21-30: rotated 90° + scaled 1.15
     31-40: mirrored Z + scaled 1.2
     41-50: rotated ~45° + scaled 1.3
*/
function transformTrack(base, scale, angleDeg, mirrorX, mirrorZ) {
  const a = (angleDeg * Math.PI) / 180
  const cosA = Math.cos(a), sinA = Math.sin(a)
  const mX = mirrorX ? -1 : 1
  const mZ = mirrorZ ? -1 : 1

  const transformPt = ([x, z]) => {
    const sx = x * scale * mX
    const sz = z * scale * mZ
    const rx = sx * cosA - sz * sinA
    const rz = sx * sinA + sz * cosA
    return [Math.round(rx), Math.round(rz)]
  }

  const newCp = base.cp.map(transformPt)
  const newSpawn = transformPt(base.spawn)
  return {
    cp: newCp,
    spawn: newSpawn,
    sfX: newSpawn[0],
    sfRange: base.sfRange,
    sfLeaveZ: Math.round(base.sfLeaveZ * scale),
  }
}

const TRANSFORMS = [
  { scale: 1.1,  angle: 0,   mX: true,  mZ: false }, // 11-20
  { scale: 1.15, angle: 90,  mX: false, mZ: false },  // 21-30
  { scale: 1.2,  angle: 0,   mX: false, mZ: true },   // 31-40
  { scale: 1.3,  angle: 45,  mX: false, mZ: false },  // 41-50
]

export const LEVEL_TRACKS = [...BASE_TRACKS]

for (let batch = 0; batch < 4; batch++) {
  const t = TRANSFORMS[batch]
  for (let i = 0; i < 10; i++) {
    LEVEL_TRACKS.push(transformTrack(BASE_TRACKS[i], t.scale, t.angle, t.mX, t.mZ))
  }
}

// ── Track dimension constants (same for all levels) ─────────
export const ROAD_W  = 22
export const HW      = ROAD_W / 2
export const CURB_W  = 1.2
export const SW_W    = 3.0
export const WALL_D  = HW + SW_W + 0.5   // barrier offset from centre-line
export const WALL_H  = 1.2
export const SAMPLES = 600

// ── Active level management ─────────────────────────────────
let _activeLevel = 1
let _curve  = null
let _frames = null

export function setActiveLevel(lvl) {
  if (lvl !== _activeLevel) {
    _activeLevel = lvl
    _curve  = null
    _frames = null
  }
}

export function getActiveLevel() { return _activeLevel }

export function getActiveTrack() {
  return LEVEL_TRACKS[_activeLevel - 1]
}

// ── Curve ───────────────────────────────────────────────────
export function makeCurve(cp) {
  const points = cp || getActiveTrack().cp
  return new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true, 'centripetal', 0.5,
  )
}

// ── Sample frames along the curve ───────────────────────────
export function sampleFrames(curve, n) {
  const out = []
  for (let i = 0; i < n; i++) {
    const t  = i / n
    const p  = curve.getPointAt(t)
    const tg = curve.getTangentAt(t).normalize()
    const nm = new THREE.Vector3(-tg.z, 0, tg.x)
    out.push({ p, tg, nm, ry: Math.atan2(-tg.x, tg.z) })
  }
  return out
}

// ── Singleton: lazily created per-level and cached ──────────
export function getCurve()  { if (!_curve)  _curve  = makeCurve();                       return _curve  }
export function getFrames() { if (!_frames) _frames = sampleFrames(getCurve(), SAMPLES); return _frames }

/* ═══════════════════════════════════════════════════════════════
   nearestTrackInfo(x, z)
   Returns { dist, signedDist, frameIdx, px, pz, nx, nz }
   ═══════════════════════════════════════════════════════════════ */
export function nearestTrackInfo(x, z) {
  const frames = getFrames()
  let best = 0, bestD2 = Infinity
  for (let i = 0; i < frames.length; i++) {
    const dx = x - frames[i].p.x
    const dz = z - frames[i].p.z
    const d2 = dx * dx + dz * dz
    if (d2 < bestD2) { bestD2 = d2; best = i }
  }
  const f = frames[best]
  const dx = x - f.p.x
  const dz = z - f.p.z
  const dist = Math.sqrt(bestD2)
  const signedDist = dx * f.nm.x + dz * f.nm.z
  return {
    dist,
    signedDist,
    frameIdx: best,
    px: f.p.x, pz: f.p.z,
    nx: f.nm.x, nz: f.nm.z,
  }
}

/* ═══════════════════════════════════════════════════════════════
   isOnTrack(x, z) — true if point is within the barrier walls
   ═══════════════════════════════════════════════════════════════ */
export function isOnTrack(x, z) {
  const { signedDist } = nearestTrackInfo(x, z)
  return Math.abs(signedDist) < WALL_D
}
