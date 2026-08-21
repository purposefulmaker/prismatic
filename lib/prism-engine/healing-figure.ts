// ═══════════════════════════════════════════════════════════════
// HEALING FIGURE — the field draws a human
//
// The nodes are a hollow Fibonacci SPHERE SHELL. Masking a 2D silhouette out
// of that gives a rim-heavy blob, never a readable person. So instead we do
// what a particle engine is FOR: we REPOSITION each dot to actually build a
// standing human body — feet on the floor — wrapped in a breathing golden-egg
// aura, with roots below, a turtle dome, and a crown beam.
//
// Every mapping is a PURE function of a node's fixed sphere coords (ox,oy,oz),
// so each dot keeps its target frame-to-frame (no popping); only the breath
// and the per-region glow animate. z of a Fibonacci sphere is uniform, so
// (oz+1)/2 is a perfect uniform seed; the azimuth gives a second one.
// ═══════════════════════════════════════════════════════════════

import type { HealingViz, HealingRegion } from './types'

function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v
}
function fract(x: number): number {
  return x - Math.floor(x)
}
function hash(x: number): number {
  return fract(Math.sin(x) * 43758.5453)
}

// Warm sacred palette (RGB 0..1)
const GOLD: [number, number, number] = [1.0, 0.75, 0.32]
const GOLD_BRIGHT: [number, number, number] = [1.0, 0.93, 0.66]
const BONE: [number, number, number] = [0.85, 0.78, 0.6]
const WHITE_GOLD: [number, number, number] = [1.0, 0.98, 0.9]

// ─── Human skeleton in screen space (x right, y up). Feet ~ y=-0.86. ───
// Each part carries a node-budget share so thin limbs still get enough dots
// to read (area-proportional would starve the arms/legs).
type Seg = { ax: number; ay: number; bx: number; by: number; r: number; share: number }
const HEAD = { cx: 0, cy: 0.72, r: 0.15, share: 0.15 }
const SEGS: Seg[] = [
  { ax: 0, ay: 0.57, bx: 0, by: 0.5, r: 0.05, share: 0.03 }, // neck
  { ax: -0.2, ay: 0.5, bx: 0.2, by: 0.5, r: 0.06, share: 0.06 }, // shoulders
  { ax: 0, ay: 0.5, bx: 0, by: 0.0, r: 0.15, share: 0.24 }, // torso
  { ax: -0.2, ay: 0.49, bx: -0.27, by: 0.04, r: 0.05, share: 0.09 }, // left arm
  { ax: 0.2, ay: 0.49, bx: 0.27, by: 0.04, r: 0.05, share: 0.09 }, // right arm
  { ax: -0.09, ay: 0.02, bx: -0.11, by: -0.78, r: 0.07, share: 0.13 }, // left leg
  { ax: 0.09, ay: 0.02, bx: 0.11, by: -0.78, r: 0.07, share: 0.13 }, // right leg
  { ax: -0.11, ay: -0.78, bx: -0.2, by: -0.82, r: 0.045, share: 0.04 }, // left foot
  { ax: 0.11, ay: -0.78, bx: 0.2, by: -0.82, r: 0.045, share: 0.04 }, // right foot
]

const REGION_Y: Record<Exclude<HealingRegion, 'whole' | 'none'>, number> = {
  feet: -0.8,
  legs: -0.4,
  core: 0.08,
  heart: 0.3,
  head: 0.72,
  crown: 0.95,
}

export interface FigureSample {
  x: number
  y: number
  z: number
  intensity: number
  r: number
  g: number
  b: number
}

/** Place a node inside a capsule cross-section (disk of radius r). */
function inCapsule(s: Seg, t: number, ca: number, cr: number): [number, number, number] {
  const mx = s.ax + (s.bx - s.ax) * t
  const my = s.ay + (s.by - s.ay) * t
  // perpendicular direction in screen plane
  const dx = s.bx - s.ax
  const dy = s.by - s.ay
  const len = Math.hypot(dx, dy) || 1
  const px = -dy / len
  const py = dx / len
  const lateral = Math.cos(ca) * cr * s.r
  const depth = Math.sin(ca) * cr * s.r
  return [mx + px * lateral, my + py * lateral, depth]
}

/**
 * Reposition + light a single node. (ox,oy,oz) are its fixed unit-sphere
 * coords; returns where the dot should sit and what light it carries so the
 * whole cloud reads as the living human described by `viz`.
 */
export function sampleHealingFigure(ox: number, oy: number, oz: number, viz: HealingViz): FigureSample {
  // Three decorrelated uniforms from the fixed sphere position.
  const u1 = (oz + 1) / 2 // uniform in [0,1]
  const phi = Math.atan2(oy, ox)
  const u2 = (phi + Math.PI) / (2 * Math.PI)
  const u3 = hash(u1 * 91.7 + u2 * 47.3)
  const u4 = hash(u1 * 13.1 + u2 * 71.9 + 3.7)
  const role = hash(u1 * 39.3 + u2 * 11.1 + 1.3) // partition seed

  const breath = viz.breath
  const rise = 0.015 * (breath - 0.5) // whole figure lifts a touch on inhale

  // Node-role partition (stable per node): body gets the lion's share.
  // body 0.55 | aura 0.22 | roots 0.09 | shell 0.09 | crown 0.05
  let x = 0
  let y = 0
  let z = 0
  let col = GOLD
  let intensity = 0

  if (role < 0.55) {
    // ── BODY ── pick a part by budget share, then fill its cross-section.
    let acc = 0
    let placed = false
    const pick = u1 // part selector
    const tot = HEAD.share + SEGS.reduce((s, g) => s + g.share, 0)
    const target = pick * tot
    acc = HEAD.share
    if (target <= acc) {
      // head disk
      const ang = u2 * 2 * Math.PI
      const rad = Math.sqrt(u3) * HEAD.r
      x = HEAD.cx + Math.cos(ang) * rad
      y = HEAD.cy + Math.sin(ang) * rad
      z = (u4 - 0.5) * HEAD.r
      placed = true
    } else {
      for (const s of SEGS) {
        if (!placed && target <= acc + s.share) {
          const t = u2
          const ca = u3 * 2 * Math.PI
          const cr = Math.sqrt(u4)
          const p = inCapsule(s, t, ca, cr)
          x = p[0]
          y = p[1]
          z = p[2]
          placed = true
        }
        acc += s.share
      }
    }
    if (!placed) {
      x = 0
      y = 0.25
      z = 0
    }
    y += rise

    // Region glow: brighten the body band the guidance is speaking to, and let
    // the breath pulse move through it (calming from the inside, out and back).
    let focus = 0
    if (viz.region === 'whole') focus = 1
    else if (viz.region !== 'none') {
      const c = REGION_Y[viz.region]
      const dv = (y - c) / 0.18
      focus = Math.exp(-dv * dv)
    }
    const base = 0.4
    const glow = focus * (0.45 + 0.75 * breath)
    intensity = base + glow
    col = focus > 0.35 ? GOLD_BRIGHT : GOLD
  } else if (role < 0.77) {
    // ── GOLDEN EGG AURA ── ovoid shell that breathes in and out.
    const swell = 1 + 0.06 * (breath - 0.4)
    const ea = 0.56 * swell
    const eb = 0.98 * swell
    const ang = u2 * 2 * Math.PI
    const thick = 1 + (u3 - 0.5) * 0.06
    x = Math.cos(ang) * ea * thick
    y = Math.sin(ang) * eb * thick + rise
    z = Math.sin(u4 * 2 * Math.PI) * 0.12 * ea
    intensity = viz.aura * (0.55 + 0.5 * breath)
    col = GOLD
  } else if (role < 0.86) {
    // ── ROOTS ── strands streaming down from the feet into the earth.
    const side = u3 < 0.5 ? -1 : 1
    const t = u2 // 0 at feet → 1 deep
    const topX = side * 0.11
    const botX = side * 0.16
    x = topX + (botX - topX) * t + (u4 - 0.5) * 0.03
    y = -0.8 - t * 0.35
    z = (u4 - 0.5) * 0.06
    intensity = viz.roots * (0.5 + 0.3 * (1 - t)) * (0.7 + 0.3 * breath)
    col = GOLD
  } else if (role < 0.95) {
    // ── TURTLE DOME ── arc shell arcing over head and shoulders.
    const a = (u2 - 0.5) * Math.PI // -π/2..π/2 across the top
    const ea = 0.5
    const eb = 0.66
    const jitter = 1 + (u3 - 0.5) * 0.05
    x = Math.sin(a) * ea * jitter
    y = (0.3 + Math.cos(a) * eb) * jitter + rise
    z = (u4 - 0.5) * 0.14
    intensity = viz.shell * (0.5 + 0.35 * breath)
    col = BONE
  } else {
    // ── CROWN BEAM ── soft vertical shaft of light entering the head.
    const t = u2 // 0 at head top → 1 high above
    x = (u3 - 0.5) * (0.12 - 0.06 * t)
    y = 0.86 + t * 0.5 + rise
    z = (u4 - 0.5) * 0.08
    intensity = viz.crown * (0.4 + 0.6 * (1 - t)) * (0.6 + 0.4 * breath)
    col = WHITE_GOLD
  }

  intensity = clamp(intensity, 0, 1.4) * viz.reveal
  return { x, y, z, intensity, r: col[0], g: col[1], b: col[2] }
}
