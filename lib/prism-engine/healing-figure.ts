// ═══════════════════════════════════════════════════════════════
// HEALING FIGURE — the field draws a human
//
// No geometry is added. Like field-forms.ts, this is a per-node SOURCE: for a
// node's frozen, camera-facing position (u = right, v = up) it returns how
// much light that node should carry so the dot cloud RESOLVES into a standing
// human figure — feet on the floor — with gold flowing through the body region
// the guidance is speaking to, roots below, a turtle dome above, a crown beam,
// and a breathing golden-egg aura around the whole body.
//
// The engine's own dots, its own breath, its own persistence. We only say
// which of them are bright, and in what warmth.
// ═══════════════════════════════════════════════════════════════

import type { HealingViz, HealingRegion } from './types'

function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v
}

/** Distance from point (px,py) to the line segment a→b. */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy || 1e-6
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1)
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

// ─── The seven parts of the body, in screen space (u ∈ ±0.6, v ∈ ±0.95) ───
// v = +up. Head near the top, feet at the bottom. Capsule = [ax,ay,bx,by,r].
type Capsule = [number, number, number, number, number]

const HEAD: [number, number, number] = [0, 0.72, 0.145] // cx, cy, r
const BODY: Capsule[] = [
  [0, 0.57, 0, 0.5, 0.055], // neck
  [-0.19, 0.49, 0.19, 0.49, 0.075], // shoulders
  [0, 0.5, 0, 0.02, 0.15], // torso
  [-0.19, 0.48, -0.25, 0.0, 0.06], // left arm
  [0.19, 0.48, 0.25, 0.0, 0.06], // right arm
  [-0.08, 0.02, -0.1, -0.8, 0.075], // left leg
  [0.08, 0.02, 0.1, -0.8, 0.075], // right leg
  [-0.1, -0.8, -0.2, -0.84, 0.05], // left foot
  [0.1, -0.8, 0.2, -0.84, 0.05], // right foot
]

/** Body membership 0..1: solid inside the silhouette, soft halo just outside. */
function bodyMask(u: number, v: number): number {
  // signed distance to the union (negative inside)
  let d = 1e3
  const dh = Math.hypot(u - HEAD[0], v - HEAD[1]) - HEAD[2]
  if (dh < d) d = dh
  for (const c of BODY) {
    const ds = segDist(u, v, c[0], c[1], c[2], c[3]) - c[4]
    if (ds < d) d = ds
  }
  if (d <= 0) return 1
  // soft rim so the figure edge isn't a hard cutout
  return Math.exp(-((d / 0.05) * (d / 0.05))) * 0.5
}

// ─── Region focus: a vertical band of the body the guidance is addressing ───
const REGION_V: Record<Exclude<HealingRegion, 'whole' | 'none'>, number> = {
  feet: -0.8,
  legs: -0.4,
  core: 0.08,
  heart: 0.3,
  head: 0.72,
  crown: 0.9,
}

/** How strongly a node at height v belongs to the focused region (0..1). */
function regionFocus(v: number, region: HealingRegion): number {
  if (region === 'none') return 0
  if (region === 'whole') return 1
  const center = REGION_V[region]
  const w = 0.16
  const dv = (v - center) / w
  return Math.exp(-dv * dv)
}

/** Roots: two tapering strands streaming below the feet. */
function rootsMask(u: number, v: number): number {
  if (v > -0.78) return 0
  const d = Math.min(
    segDist(u, v, -0.1, -0.8, -0.13, -1.05),
    segDist(u, v, 0.1, -0.8, 0.13, -1.05)
  )
  const taper = clamp((v + 1.05) / 0.27, 0, 1) // thinner as it descends
  const r = 0.02 + 0.05 * taper
  return Math.exp(-((d / r) * (d / r)))
}

/** Turtle dome: an arc shell over the head and shoulders. */
function shellMask(u: number, v: number): number {
  if (v < 0.05) return 0
  const ea = 0.42
  const eb = 0.62
  const r = Math.hypot(u / ea, (v - 0.28) / eb)
  return Math.exp(-(((r - 1) / 0.12) * ((r - 1) / 0.12)))
}

/** Crown beam: a soft vertical shaft entering the top of the head. */
function crownMask(u: number, v: number): number {
  if (v < 0.55) return 0
  const w = 0.09 + 0.05 * clamp((1 - v) / 0.4, 0, 1)
  const fall = clamp((v - 0.55) / 0.5, 0, 1)
  return Math.exp(-((u / w) * (u / w))) * (0.5 + 0.5 * fall)
}

/** Golden egg: an ovoid shell around the whole body, breathing in and out. */
function auraMask(u: number, v: number, breath: number): number {
  // breathe from the inside out and flow back in: shell swells on the inhale
  const s = 1 + 0.05 * (breath - 0.4)
  const ea = 0.52 * s
  const eb = 0.92 * s
  const r = Math.hypot(u / ea, v / eb)
  return Math.exp(-(((r - 1) / 0.07) * ((r - 1) / 0.07)))
}

// Warm sacred palette (linear-ish RGB 0..1)
const GOLD: [number, number, number] = [1.0, 0.78, 0.4]
const GOLD_BRIGHT: [number, number, number] = [1.0, 0.92, 0.66]
const BONE: [number, number, number] = [0.86, 0.79, 0.63]
const WHITE_GOLD: [number, number, number] = [1.0, 0.97, 0.86]

export interface FigureSample {
  intensity: number
  r: number
  g: number
  b: number
}

/**
 * Full per-node healing sample. (u,v) is the node's frozen screen position
 * (u right, v up). Returns the light this node should carry so the field reads
 * as the living human figure described by `viz`.
 */
export function sampleHealingFigure(u: number, v: number, viz: HealingViz): FigureSample {
  const body = bodyMask(u, v)
  const focus = regionFocus(v, viz.region)

  // The breath lifts the whole body a touch and swells the focused region so
  // you can SEE the breath move through (head on the inhale, feet on ground).
  const regionGlow = body * focus * (0.35 + 0.65 * viz.breath)

  const rootsG = viz.roots * rootsMask(u, v)
  const shellG = viz.shell * shellMask(u, v)
  const crownG = viz.crown * crownMask(u, v)
  const auraG = viz.aura * auraMask(u, v, viz.breath)

  // Weighted color accumulation — each contribution paints in its own warmth.
  let wr = 0
  let wg = 0
  let wb = 0
  let wsum = 0
  const add = (w: number, c: [number, number, number]) => {
    if (w <= 0) return
    wr += c[0] * w
    wg += c[1] * w
    wb += c[2] * w
    wsum += w
  }

  const bodyBase = body * 0.4
  add(bodyBase, GOLD)
  add(regionGlow * 0.9, GOLD_BRIGHT)
  add(rootsG * 0.7, GOLD)
  add(shellG * 0.7, BONE)
  add(crownG * 0.95, WHITE_GOLD)
  add(auraG * 0.8, GOLD)

  let intensity = (bodyBase + regionGlow * 0.9 + rootsG * 0.7 + shellG * 0.7 + crownG * 0.95 + auraG * 0.8)
  intensity = clamp(intensity, 0, 1.4) * viz.reveal

  // A faint warm ambient so the surrounding field is present, not dead black.
  const ambient = 0.05 * viz.reveal
  if (intensity < ambient) {
    return { intensity: ambient, r: 0.45, g: 0.32, b: 0.16 }
  }

  const inv = wsum > 1e-4 ? 1 / wsum : 0
  return { intensity, r: wr * inv, g: wg * inv, b: wb * inv }
}
