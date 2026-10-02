// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — Two-triangle geometry
// An upright triangle sitting on an inverted triangle, meeting base to
// base on a shared horizontal line: a diamond split through its middle.
// Planar glyph on the sphere's camera-facing face. Pure geometry: no
// rendering, no DOM.
// ═══════════════════════════════════════════════════════════════

/** Half-height of the full diamond (apex to center) in unit-sphere node space. */
export const HEXAGRAM_RADIUS = 0.84

/** Half-width of the lit edge band in node space (~0.6 of mean node spacing). */
export const HEXAGRAM_BAND = 0.055

type Vec2 = readonly [number, number]
type Edge = readonly [Vec2, Vec2]

/**
 * Five edges: the shared baseline through the center, the two sides of
 * the upright triangle to the +Y apex, and the two sides of the inverted
 * triangle to the −Y apex. Each triangle is equilateral, so the half-base
 * is h / √3 for apex height h.
 */
export function hexagramEdges(h: number = HEXAGRAM_RADIUS): Edge[] {
  const half = h / Math.sqrt(3)
  const top: Vec2 = [0, h]
  const bottom: Vec2 = [0, -h]
  const left: Vec2 = [-half, 0]
  const right: Vec2 = [half, 0]
  return [
    [left, right],
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ]
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
