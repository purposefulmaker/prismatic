// laws.ts — The laws of The Beautiful Necessity as field operators
//
// Each of Bragdon's laws becomes a real transformation on the node sphere.
// The laws multiply the beam-pattern field (set Pattern to ALL to see a law
// pure) except Polarity / Trinity / Diversity, which act on color, and
// Latent Geometry, which acts on position. All angles are taken from the
// node's *rotated* coordinates, so every law rides the spin.
//
//   Unity & Polarity    → the Yo/In split: warm north, cool south
//   Trinity             → the third born where the two meet: equatorial gold
//   Consonance          → as is the small, so is the great: motif at 3φ × 9φ
//   Diversity in Monot. → one law, each node its own seeded variation
//   Balance             → bilateral fold of the field's longitude
//   Rhythmic Change     → equiangular spiral on the sphere (the loxodrome —
//                         the shell's and wave-band's own curve)
//   Radiation           → rays from the pole, veining the sphere
//   The Bodily Temple   → the vesica piscis: two caps, sep = radius, lens lit
//   Latent Geometry     → the cloud condenses onto N meridians (3…6)
//   Frozen Music        → two azimuthal waves in an exact interval p:q

import type { PrismParameters } from './types'

const TWO_PI = Math.PI * 2

function hash(i: number, s: number): number {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function wrapAngle(a: number): number {
  let x = a % TWO_PI
  if (x > Math.PI) x -= TWO_PI
  if (x < -Math.PI) x += TWO_PI
  return x
}

/** LATENT GEOMETRY — pull node azimuths onto N great meridians. */
export function applyLatentGeometry(
  x: number,
  y: number,
  z: number,
  n: number,
  amt: number
): [number, number, number] {
  if (n < 3 || amt <= 0) return [x, y, z]
  const rxz = Math.sqrt(x * x + z * z)
  if (rxz < 1e-6) return [x, y, z]
  const phi = Math.atan2(z, x)
  const stepA = TWO_PI / n
  const target = Math.round(phi / stepA) * stepA
  const phi2 = phi + wrapAngle(target - phi) * amt
  return [Math.cos(phi2) * rxz, y, Math.sin(phi2) * rxz]
}

/** The intensity laws — a multiplicative field L(θ, φ, t) in [0, 1]. */
export function lawsField(
  x: number,
  y: number,
  z: number,
  t: number,
  P: PrismParameters
): number {
  const active =
    P.lawConsonance > 0 ||
    P.lawRhythm > 0 ||
    P.lawRadiation > 0 ||
    P.lawVesica > 0 ||
    (P.lawIntervalAmt > 0 && P.lawIntervalP > 0)
  if (!active) return 1

  const yy = Math.max(-1, Math.min(1, y))
  const theta = Math.acos(yy)
  let phi = Math.atan2(z, x)

  // BALANCE — bilateral symmetry: fold longitude about the x–y plane
  if (P.lawBalance > 0) {
    const folded = Math.abs(phi)
    phi = phi + (folded - phi) * P.lawBalance
  }

  let L = 1

  // CONSONANCE — the same motif at nested scales (3φ within 9φ)
  if (P.lawConsonance > 0) {
    const m = 0.5 + 0.5 * Math.sin(3 * phi) * Math.sin(9 * phi + t * 0.25)
    L *= 1 - P.lawConsonance + P.lawConsonance * m
  }

  // RHYTHMIC CHANGE — loxodrome: equiangular spiral arms, diminishing
  if (P.lawRhythm > 0) {
    const th = Math.min(Math.max(theta * 0.5, 0.06), 1.51)
    const u = Math.log(Math.tan(th))
    const s = 0.5 + 0.5 * Math.sin(4 * phi + 6 * u + t * 0.2)
    L *= 1 - P.lawRhythm + P.lawRhythm * s
  }

  // RADIATION — rays from the pole, brightest at the sweep of the fan
  if (P.lawRadiation > 0) {
    const rays = 0.5 + 0.5 * Math.sin(8 * phi)
    const fan = 0.35 + 0.65 * Math.sin(theta)
    L *= 1 - P.lawRadiation + P.lawRadiation * rays * fan
  }

  // THE BODILY TEMPLE — vesica piscis: two caps, separation = radius
  if (P.lawVesica > 0) {
    const rho = 0.62
    const ca = Math.cos(rho * 0.5)
    const sa = Math.sin(rho * 0.5)
    // Cap centers straddle the front pole (+z) so the lens faces camera
    const d1 = Math.acos(Math.max(-1, Math.min(1, x * sa + z * ca)))
    const d2 = Math.acos(Math.max(-1, Math.min(1, -x * sa + z * ca)))
    const inside =
      (1 - smooth(rho - 0.07, rho + 0.07, d1)) * (1 - smooth(rho - 0.07, rho + 0.07, d2))
    const ring =
      Math.exp(-Math.pow((d1 - rho) / 0.05, 2)) + Math.exp(-Math.pow((d2 - rho) / 0.05, 2))
    const val = Math.min(1, inside * 0.8 + ring * 0.95)
    L *= 1 - P.lawVesica + P.lawVesica * val
  }

  // FROZEN MUSIC — two azimuthal waves at an exact interval p:q
  if (P.lawIntervalAmt > 0 && P.lawIntervalP > 0 && P.lawIntervalQ > 0) {
    const fm =
      0.5 +
      0.25 * (Math.sin(P.lawIntervalP * phi + t * 0.3) + Math.sin(P.lawIntervalQ * phi + t * 0.3))
    L *= 1 - P.lawIntervalAmt + P.lawIntervalAmt * fm
  }

  return Math.max(0, Math.min(1, L))
}

function smooth(a: number, b: number, x: number): number {
  const k = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

/** The color laws — Polarity (Yo/In), Trinity, Diversity in Monotony. */
export function lawsColor(
  r: number,
  g: number,
  b: number,
  y: number,
  idx: number,
  P: PrismParameters
): [number, number, number] {
  let rr = r
  let gg = g
  let bb = b

  // UNITY & POLARITY — warm north (Yo), cool south (In)
  if (P.lawPolarity > 0) {
    const s = Math.tanh(y * 3)
    const a = P.lawPolarity * (0.35 + 0.55 * Math.abs(s))
    const tw = s > 0
    const wr = tw ? 1.0 : 0.35
    const wg = tw ? 0.55 : 0.6
    const wb = tw ? 0.3 : 1.0
    rr = rr * (1 - a) + wr * a
    gg = gg * (1 - a) + wg * a
    bb = bb * (1 - a) + wb * a
  }

  // TRINITY — the third at the meeting plane: an equatorial gold band
  if (P.lawTrinity > 0) {
    const band = Math.exp(-Math.pow(y / 0.16, 2)) * P.lawTrinity
    rr = Math.min(1, rr + 1.0 * band * 0.85)
    gg = Math.min(1, gg + 0.88 * band * 0.85)
    bb = Math.min(1, bb + 0.55 * band * 0.85)
  }

  // DIVERSITY IN MONOTONY — one law, per-node seeded variation
  if (P.lawDiversity > 0) {
    const d = P.lawDiversity
    rr = Math.min(1, Math.max(0, rr * (1 + d * 0.6 * (hash(idx, 1) - 0.5))))
    gg = Math.min(1, Math.max(0, gg * (1 + d * 0.6 * (hash(idx, 2) - 0.5))))
    bb = Math.min(1, Math.max(0, bb * (1 + d * 0.6 * (hash(idx, 3) - 0.5))))
  }

  return [rr, gg, bb]
}
