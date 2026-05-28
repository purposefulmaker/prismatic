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
  ctx.font = 'bold 80px Courier New'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
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
