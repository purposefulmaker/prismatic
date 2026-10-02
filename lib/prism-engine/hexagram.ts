// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — Hexagram geometry
// The triangle meeting the inverted triangle, as a planar glyph on the
// sphere's camera-facing face. Pure geometry: no rendering, no DOM.
// ═══════════════════════════════════════════════════════════════

/** Circumradius of each triangle in unit-sphere node space (ox, oy). */
export const HEXAGRAM_RADIUS = 0.84

/** Half-width of the lit edge band in node space (~0.6 of mean node spacing). */
export const HEXAGRAM_BAND = 0.055

type Vec2 = readonly [number, number]
type Edge = readonly [Vec2, Vec2]

function triangle(startDeg: number, r: number): Edge[] {
  const pts: Vec2[] = [0, 1, 2].map(k => {
    const a = ((startDeg + k * 120) * Math.PI) / 180
    return [Math.cos(a) * r, Math.sin(a) * r] as const
  })
  return [
    [pts[0], pts[1]],
    [pts[1], pts[2]],
    [pts[2], pts[0]],
  ]
}

/** Six edges: upright triangle (apex at +Y) then inverted (apex at −Y). */
export function hexagramEdges(r: number = HEXAGRAM_RADIUS): Edge[] {
  return [...triangle(90, r), ...triangle(270, r)]
}

const UNIT_EDGES = hexagramEdges(1)

function distToSegment(px: number, py: number, [a, b]: Edge): number {
  const abx = b[0] - a[0]
  const aby = b[1] - a[1]
  const apx = px - a[0]
  const apy = py - a[1]
  const len2 = abx * abx + aby * aby
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / len2))
  const dx = apx - abx * t
  const dy = apy - aby * t
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Shortest distance from a planar point to any hexagram edge, for a
 * hexagram of circumradius r. Scales the unit edges rather than
 * rebuilding them so the per-node call is allocation-free.
 */
export function hexagramEdgeDistance(px: number, py: number, r: number): number {
  const ux = px / r
  const uy = py / r
  let best = Infinity
  for (let i = 0; i < UNIT_EDGES.length; i++) {
    const d = distToSegment(ux, uy, UNIT_EDGES[i])
    if (d < best) best = d
  }
  return best * r
}
