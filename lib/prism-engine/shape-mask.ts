// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — POV Shape Formation
// V(θ,φ,t) = ∫ Sᵢ(t')·δ(θ-θᵢ(t'),φ-φᵢ(t'))·e^(-(t-t')/τ) dt'
// ═══════════════════════════════════════════════════════════════

import type { PrismNode } from './types'
import { HEXAGRAM_BAND, HEXAGRAM_RADIUS, hexagramEdgeDistance, hexagramEdges } from './hexagram'

/**
 * Generate the 256×128 shape mask: optional text, optional hexagram, both
 * composed into one bitmap so every consumer (CPU wrap, planar, GPU texture)
 * sees the same shape. Returns null when there is nothing to draw.
 */
export function createShapeMask(
  text: string,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  hexagram: boolean = false
): Uint8ClampedArray | null {
  if (!text && !hexagram) return null

  canvas.width = 256
  canvas.height = 128

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 256, 128)

  if (hexagram) {
    // The GPU shader maps node XY to the mask at 92.16 px per unit on both
    // axes (u = 0.5 + x·0.36 over 256, v = 0.5 − y·0.72 over 128), so a
    // regular hexagram in pixels is regular on the sphere. Radius is capped
    // so the apexes stay inside the 128px height.
    const pxPerUnit = 92.16
    const r = Math.min(HEXAGRAM_RADIUS * pxPerUnit, 60)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = Math.max(4, HEXAGRAM_BAND * 2 * pxPerUnit)
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (const [a, b] of hexagramEdges(r)) {
      // Texture Y is top-down; node +Y is up
      ctx.moveTo(128 + a[0], 64 - a[1])
      ctx.lineTo(128 + b[0], 64 - b[1])
    }
    ctx.stroke()
  }

  if (text) {
    ctx.fillStyle = '#fff'

    // Fit the text to the canvas width so it stays bold and readable even
    // for short strings like "v0". Start large, shrink until it fits.
    let fontSize = 96
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    do {
      ctx.font = `900 ${fontSize}px Arial, sans-serif`
      const w = ctx.measureText(text).width
      if (w <= 220) break
      fontSize -= 4
    } while (fontSize > 24)

    ctx.font = `900 ${fontSize}px Arial, sans-serif`
    ctx.fillText(text, 128, 64)
  }

  const img = ctx.getImageData(0, 0, 256, 128)
  return img.data
}

/**
 * HEXAGRAM in the POV field: true when a node's ORIGINAL position sits on
 * one of the six edges of the star drawn on the sphere's +Z face. Uses the
 * untransformed coords so the glyph is attached to the sphere — it tilts
 * with the field under drag — and the front-face gate keeps the back
 * hemisphere from drawing a second, mirrored star behind the first.
 *
 * Analytic (distance-to-edge) rather than bitmap so the band is crisp at
 * any node count and needs no canvas.
 */
export function isNodeInHexagram(node: PrismNode, shapeScale: number): boolean {
  if (node.oz <= 0.05) return false
  const r = HEXAGRAM_RADIUS * shapeScale
  return hexagramEdgeDistance(node.ox, node.oy, r) <= HEXAGRAM_BAND
}

/**
 * Check if a node falls within the shape mask
 * Maps sphere surface (theta, phi) to texture UV coordinates
 */
export function isNodeInShape(
  node: PrismNode,
  shapeMask: Uint8ClampedArray | null,
  shapeScale: number
): boolean {
  if (!shapeMask) return true // No shape = all visible

  // Map sphere surface (theta, phi) to texture UV
  // Flip U to correct text direction (left-to-right)
  const u = 1 - (((node.phi / (2 * Math.PI)) % 1 + 1) % 1)
  const v = node.theta / Math.PI

  // Apply scale from center
  const su = 0.5 + (u - 0.5) * shapeScale
  const sv = 0.5 + (v - 0.5) * shapeScale

  // Convert to pixel coordinates
  const px = Math.floor(su * 256) % 256
  const py = Math.floor(sv * 128) % 128

  if (px < 0 || py < 0) return false

  // Check pixel brightness (R channel)
  const idx = (py * 256 + px) * 4
  return shapeMask[idx] > 128
}

/**
 * SPOTLIGHT projection: planar-map the CURRENT (post-rotation) XY of a node
 * onto the text mask. Because it reads transformed coordinates, the glyph is
 * locked to the viewer — drag the sphere and the text keeps facing you like
 * a hologram. Aspect-correct for the 256×128 (2:1) texture: the horizontal
 * UV rate is exactly half the vertical rate so letters never stretch.
 */
export function isNodeInSpotlightShape(
  x: number,
  y: number,
  shapeMask: Uint8ClampedArray | null,
  shapeScale: number
): boolean {
  if (!shapeMask) return false

  // Unit sphere face spans roughly ±1 in X/Y. vRate sizes the glyph against
  // the sphere (smaller = larger glyph); uRate = vRate/2 preserves the 2:1
  // texture aspect so letters never stretch.
  const vRate = 0.72 * shapeScale
  const uRate = vRate * 0.5

  // Empirically verified against the render: node +X maps to texture-right
  // (left-to-right reading order) and node +Y maps to texture-DOWN (this
  // engine's screen-space Y is inverted vs. the naive +Z-camera assumption).
  const u = 0.5 + x * uRate
  const v = 0.5 + y * vRate

  if (u < 0 || u > 1 || v < 0 || v > 1) return false

  const px = Math.floor(u * 256)
  const py = Math.floor(v * 128)
  if (px < 0 || px >= 256 || py < 0 || py >= 128) return false

  const idx = (py * 256 + px) * 4
  return shapeMask[idx] > 128
}

/**
 * Check if a node falls within the shape mask using FLAT planar projection.
 * Maps the node's original XY position directly onto the texture, so text
 * appears on the face of a static, camera-facing shape (e.g. the v0 triangle)
 * rather than wrapped around a sphere.
 */
export function isNodeInPlanarShape(
  node: PrismNode,
  shapeMask: Uint8ClampedArray | null,
  shapeScale: number
): boolean {
  if (!shapeMask) return true // No shape = all visible

  // Use ORIGINAL (untransformed) XY so the text stays locked to the face.
  // The texture is 256×128 (2:1), so the horizontal node→UV rate must be HALF
  // the vertical rate to keep letters from stretching. We pick a base vertical
  // scale and derive the horizontal one as base/2 for aspect-correct text.
  // The triangle apex is narrow at the top, so the text is shifted DOWN into
  // the wide lower-center band where the lattice actually has nodes, and is
  // scaled so a full rectangular glyph fits inside the triangular silhouette.
  const yCenter = -0.18 // shift text down toward the wide base
  const hScale = 1.0 * shapeScale // vertical text rate (smaller = bigger text)
  const wScale = 0.55 * shapeScale // horizontal rate (texture is 2:1)

  // Camera sits at +Z looking toward origin, so +X is the viewer's RIGHT.
  // Map +X → larger U so characters run left-to-right (not mirrored).
  const u = 0.5 + node.ox * wScale
  const v = 0.5 - (node.oy - yCenter) * hScale // flip Y (texture is top-down)

  if (u < 0 || u > 1 || v < 0 || v > 1) return false

  const px = Math.floor(u * 256)
  const py = Math.floor(v * 128)

  if (px < 0 || px >= 256 || py < 0 || py >= 128) return false

  // Check pixel brightness (R channel)
  const idx = (py * 256 + px) * 4
  return shapeMask[idx] > 128
}
