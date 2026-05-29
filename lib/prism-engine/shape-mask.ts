// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — POV Shape Formation
// V(θ,φ,t) = ∫ Sᵢ(t')·δ(θ-θᵢ(t'),φ-φᵢ(t'))·e^(-(t-t')/τ) dt'
// ═══════════════════════════════════════════════════════════════

import type { PrismNode } from './types'

/**
 * Generate a bitmap mask from text for sphere projection
 */
export function createShapeMask(
  text: string,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): Uint8ClampedArray | null {
  if (!text) return null

  const txt = text

  canvas.width = 256
  canvas.height = 128

  // Clear and draw text
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 256, 128)
  ctx.fillStyle = '#fff'

  // Fit the text to the canvas width so it stays bold and readable even
  // for short strings like "v0". Start large, shrink until it fits.
  let fontSize = 96
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  do {
    ctx.font = `900 ${fontSize}px Arial, sans-serif`
    const w = ctx.measureText(txt).width
    if (w <= 220) break
    fontSize -= 4
  } while (fontSize > 24)

  ctx.font = `900 ${fontSize}px Arial, sans-serif`
  ctx.fillText(txt, 128, 64)

  // Extract image data
  const img = ctx.getImageData(0, 0, 256, 128)
  return img.data
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
  const base = 0.85 * shapeScale
  const u = 0.5 + node.ox * (base * 0.5)
  const v = 0.5 - node.oy * base // flip Y (texture is top-down)

  if (u < 0 || u > 1 || v < 0 || v > 1) return false

  const px = Math.floor(u * 256)
  const py = Math.floor(v * 128)

  if (px < 0 || px >= 256 || py < 0 || py >= 128) return false

  // Check pixel brightness (R channel)
  const idx = (py * 256 + px) * 4
  return shapeMask[idx] > 128
}
