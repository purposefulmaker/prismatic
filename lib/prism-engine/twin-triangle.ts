// NOTHINGBURGER ENGINE — Twin-triangle geometry
// An upright triangle sitting on an inverted triangle, meeting base to
// base on a shared horizontal line: a diamond split through its middle.
// Planar glyph on the sphere's camera-facing face. Pure geometry: no
// rendering, no DOM.
// ═══════════════════════════════════════════════════════════════

/** Half-height of the full diamond (apex to center) in unit-sphere node space. */
export const TWIN_TRIANGLE_HEIGHT = 0.84

/** Half-width of the lit edge band in node space (~0.6 of mean node spacing). */
export const TWIN_TRIANGLE_BAND = 0.055

type Vec2 = readonly [number, number]
type Edge = readonly [Vec2, Vec2]

/**
 * Five edges: the shared baseline through the center, the two sides of
 * the upright triangle to the +Y apex, and the two sides of the inverted
 * triangle to the −Y apex. Each triangle is equilateral, so the half-base
 * is h / √3 for apex height h.
 */
export function twinTriangleEdges(h: number = TWIN_TRIANGLE_HEIGHT): Edge[] {
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

const UNIT_EDGES = twinTriangleEdges(1)

function segmentDistance(px: number, py: number, a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  let t = ((px - a[0]) * dx + (py - a[1]) * dy) / len2
  t = t < 0 ? 0 : t > 1 ? 1 : t
  const cx = a[0] + t * dx - px
  const cy = a[1] + t * dy - py
  return Math.sqrt(cx * cx + cy * cy)
}

/**
 * Shortest distance from a planar point to any twin-triangle edge, for a
 * glyph of apex height h. Scales the unit edges rather than
 * reallocating so the per-node test is allocation-free.
 */
export function twinTriangleEdgeDistance(px: number, py: number, h: number): number {
  let best = Infinity
  for (const [a, b] of UNIT_EDGES) {
    const d = segmentDistance(px, py, [a[0] * h, a[1] * h], [b[0] * h, b[1] * h])
    if (d < best) best = d
  }
  return best
}
