// field-forms.ts — the pump and the chamber as expressions of the field itself.
//
// No geometry is added to the scene. Both forms are per-node sources computed
// on the existing sphere, so they are made of the engine's own particles,
// colored by its own dispersion engine, persisted by its own tau, breathing
// with the field, streamed through by the substrate's rotation, and
// multiplied by the Laws.
//
//   PUMP — two counter-flowing loxodrome families of opposite hand. Where the
//   hands cross, intensities sum: the knots brighten by interference, not by
//   drawing. Strand count rides Harmonic K; flow speed rides Phase Velocity.
//
//   CHAMBER — eight vertex directions, twelve great-circle edges, and the
//   live tetractys point of every face, as targets in pattern space. The two
//   tetra sets counter-rotate mathematically (seeded by ωy); the cycle
//   3-6-9-18-36-18-9-6 steps the active points at 4/s. Trails belong to tau.

import type { PrismParameters } from './types'

export const CHAMBER_CYCLE = [3, 6, 9, 18, 36, 18, 9, 6]

function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v
}

function sstep(a: number, b: number, x: number): number {
  const k = clamp((x - a) / (b - a), 0, 1)
  return k * k * (3 - 2 * k)
}

/** PUMP — counter-flowing weave in the field. Returns source intensity 0..1. */
export function pumpFieldAt(
  x: number,
  y: number,
  z: number,
  t: number,
  P: PrismParameters
): number {
  const yy = clamp(y, -0.999, 0.999)
  const theta = Math.acos(yy)
  const th = clamp(theta * 0.5, 0.06, 1.51)
  const u = Math.log(Math.tan(th))
  const phi = Math.atan2(z, x)

  const N = Math.max(2, Math.round(P.harmK || 6))
  const drift = t * (P.phaseV || 1) * 0.9

  // Two loxodrome families, opposite hand, opposite drift
  const a = 0.5 + 0.5 * Math.cos(N * phi + 4 * u - N * drift)
  const b = 0.5 + 0.5 * Math.cos(N * phi - 4 * u + N * drift)
  const fa = sstep(0.86, 0.985, a)
  const fb = sstep(0.86, 0.985, b)

  // Crossings sum and clamp — the interference knots emerge on their own
  return Math.min(1, fa + fb)
}

export interface ChamberCtx {
  verts: number[][] // 8 rotated unit vectors
  edgeN: number[][] // 12 great-circle normals
  edgeMid: number[][] // 12 arc midpoints (unit)
  edgeGate: number[] // segment gate: dot(p, mid) threshold
  active: number[][] // 8 live tetractys directions (one per face)
  amp: number // current cycle value / 36
}

const TETRA_FACES = [
  [0, 1, 2],
  [0, 1, 3],
  [0, 2, 3],
  [1, 2, 3],
]

// Tetractys barycentric weights, rows 1-2-3-4, ordered apex → base
const TETRACTYS_BARY: [number, number, number][] = (() => {
  const out: [number, number, number][] = []
  for (let i = 0; i <= 3; i++)
    for (let j = 0; j <= i; j++) out.push([(3 - i) / 3, (i - j) / 3, j / 3])
  return out
})()

function rotY(v: number[], ang: number): number[] {
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]
}

function norm(v: number[]): number[] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

/** Per-frame chamber context: rotate targets, advance the sequencer. */
export function computeChamberCtx(t: number, P: PrismParameters): ChamberCtx {
  const s = 1 / Math.sqrt(3)
  const baseA = [
    [s, s, s],
    [s, -s, -s],
    [-s, s, -s],
    [-s, -s, s],
  ]
  const w = 0.25 + 0.15 * (P.ry || 0)
  const verts: number[][] = []
  for (const v of baseA) verts.push(rotY(v, t * w))
  for (const v of baseA) verts.push(rotY([-v[0], -v[1], -v[2]], -t * w))

  const edgeN: number[][] = []
  const edgeMid: number[][] = []
  const edgeGate: number[] = []
  for (const base of [0, 4]) {
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        const a = verts[base + i]
        const b = verts[base + j]
        edgeN.push(
          norm([
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
          ])
        )
        const mid = norm([a[0] + b[0], a[1] + b[1], a[2] + b[2]])
        edgeMid.push(mid)
        edgeGate.push(mid[0] * a[0] + mid[1] * a[1] + mid[2] * a[2] - 0.02)
      }
    }
  }

  const step = Math.floor(t * 4)
  const amp = CHAMBER_CYCLE[((step % 8) + 8) % 8] / 36
  const pA = ((step % 10) + 10) % 10
  const pB = 9 - pA
  const active: number[][] = []
  for (const base of [0, 4]) {
    const [wa, wb, wc] = TETRACTYS_BARY[base === 0 ? pA : pB]
    for (const [fa, fb, fc] of TETRA_FACES) {
      const A = verts[base + fa]
      const B = verts[base + fb]
      const C = verts[base + fc]
      active.push(
        norm([
          wa * A[0] + wb * B[0] + wc * C[0],
          wa * A[1] + wb * B[1] + wc * C[1],
          wa * A[2] + wb * B[2] + wc * C[2],
        ])
      )
    }
  }

  return { verts, edgeN, edgeMid, edgeGate, active, amp }
}

/** CHAMBER — source intensity 0..1 for one node against the rotated targets. */
export function chamberFieldAt(x: number, y: number, z: number, ctx: ChamberCtx): number {
  let g = 0

  // Anchoring vertices
  for (const v of ctx.verts) {
    const d = clamp(x * v[0] + y * v[1] + z * v[2], -1, 1)
    const ang = Math.acos(d)
    if (ang < 0.3) g += Math.exp(-Math.pow(ang / 0.1, 2))
  }

  // Great-circle edges, gated to the arc segment
  for (let e = 0; e < 12; e++) {
    const m = ctx.edgeMid[e]
    if (x * m[0] + y * m[1] + z * m[2] < ctx.edgeGate[e]) continue
    const n = ctx.edgeN[e]
    const pd = Math.abs(x * n[0] + y * n[1] + z * n[2])
    if (pd < 0.12) g += 0.55 * Math.exp(-Math.pow(pd / 0.035, 2))
  }

  // The live tetractys point of each face, weighted by the cycle
  for (const a of ctx.active) {
    const d = clamp(x * a[0] + y * a[1] + z * a[2], -1, 1)
    const ang = Math.acos(d)
    if (ang < 0.28) g += 1.2 * ctx.amp * Math.exp(-Math.pow(ang / 0.09, 2))
  }

  return Math.min(1, g)
}
