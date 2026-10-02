// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — Hexagram inscribed in the sphere
// The triangle meeting the upside-down triangle, drawn on the great circle
// that faces the camera. It rides the sphere's rotation, so at rest it is
// the flat glyph and under drag it tilts through the field as a plane.
// ═══════════════════════════════════════════════════════════════

type Vec3 = [number, number, number]

const H = Math.sqrt(3) / 2

// Node space: the renderer negates Y when drawing, so an apex at y = -1 here
// lands at the TOP of the screen.
const TRI_UP: Vec3[] = [
  [0, -1, 0],
  [H, 0.5, 0],
  [-H, 0.5, 0],
]

const TRI_DOWN: Vec3[] = TRI_UP.map(([x, y, z]) => [-x, -y, z] as Vec3)

function closedEdges(tri: Vec3[]): Vec3[] {
  return [tri[0], tri[1], tri[1], tri[2], tri[2], tri[0]]
}

/** 6 edges × 2 endpoints = 12 unit vectors on the z = 0 great circle. */
export const HEXAGRAM_EDGE_VERTS: Vec3[] = [...closedEdges(TRI_UP), ...closedEdges(TRI_DOWN)]

export const HEXAGRAM_VERTEX_COUNT = HEXAGRAM_EDGE_VERTS.length
