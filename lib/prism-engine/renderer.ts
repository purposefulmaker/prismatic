// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — Canvas Renderer
// ═══════════════════════════════════════════════════════════════

import type { PrismNode, PrismParameters, EngineState } from './types'
import { wavelengthToRGB } from './physics'

/**
 * Draw the central prism with rainbow halo and white core
 */
export function drawCentralPrism(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  prismInt: number
): void {
  const prismSize = 18 * prismInt

  // Rainbow halo
  for (let a = 0; a < Math.PI * 2; a += 0.02) {
    const nm = 380 + (a / (Math.PI * 2)) * 320
    const [pr, pg, pb] = wavelengthToRGB(nm)
    const dist = prismSize + 15

    ctx.fillStyle = `rgba(${(pr * 255) | 0},${(pg * 255) | 0},${(pb * 255) | 0},0.15)`
    ctx.beginPath()
    ctx.arc(centerX + Math.cos(a) * dist, centerY + Math.sin(a) * dist, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // White core with radial gradient
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, prismSize)
  gradient.addColorStop(0, `rgba(255,255,255,${0.95 * prismInt})`)
  gradient.addColorStop(0.4, `rgba(220,230,255,${0.6 * prismInt})`)
  gradient.addColorStop(0.7, `rgba(180,200,255,${0.2 * prismInt})`)
  gradient.addColorStop(1, 'rgba(100,150,255,0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, prismSize, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Draw beam from center to a node
 */
export function drawBeam(
  ctx: CanvasRenderingContext2D,
  node: PrismNode,
  centerX: number,
  centerY: number,
  radius: number,
  params: PrismParameters
): void {
  if (node.intensity < 0.05 || node.z < -0.2) return

  const px = centerX + node.x * radius
  const py = centerY + node.y * radius
  const depth = (node.z + 1) / 2
  const alpha = node.intensity * params.bo * depth

  if (alpha < 0.02) return

  // Gradient from white at center to spectrum color at dot
  const gradient = ctx.createLinearGradient(centerX, centerY, px, py)
  gradient.addColorStop(0, `rgba(255,255,255,${alpha * 0.3})`)
  gradient.addColorStop(0.3, `rgba(${(node.r * 255) | 0},${(node.g * 255) | 0},${(node.b * 255) | 0},${alpha * 0.6})`)
  gradient.addColorStop(1, `rgba(${(node.r * 255) | 0},${(node.g * 255) | 0},${(node.b * 255) | 0},${alpha})`)

  ctx.beginPath()
  ctx.moveTo(centerX, centerY)
  ctx.lineTo(px, py)
  ctx.strokeStyle = gradient
  ctx.lineWidth = params.bw * (0.3 + depth * 0.7)
  ctx.stroke()
}

/**
 * Draw a node (dot) on the sphere
 */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: PrismNode,
  centerX: number,
  centerY: number,
  radius: number,
  params: PrismParameters
): void {
  const px = centerX + node.x * radius
  const py = centerY + node.y * radius
  const depth = (node.z + 1) / 2

  // Base dim dot (always visible)
  const baseAlpha = 0.08 + depth * 0.12
  const baseSize = params.dr * (0.3 + depth * 0.7) * 0.5

  ctx.fillStyle = `rgba(${(node.r * 180) | 0},${(node.g * 180) | 0},${(node.b * 180) | 0},${baseAlpha})`
  ctx.beginPath()
  ctx.arc(px, py, baseSize, 0, Math.PI * 2)
  ctx.fill()

  // Illuminated dot (when beam hits it)
  if (node.intensity > 0.05) {
    const s = params.dr * (0.4 + depth * 0.6) * (0.5 + node.intensity * 0.5)
    const a = node.intensity * (0.3 + depth * 0.7)

    // Glow effect
    if (params.gr > 0 && a > 0.1) {
      const glowGradient = ctx.createRadialGradient(px, py, 0, px, py, s + params.gr * node.intensity)
      glowGradient.addColorStop(0, `rgba(${(node.r * 255) | 0},${(node.g * 255) | 0},${(node.b * 255) | 0},${a * 0.4})`)
      glowGradient.addColorStop(1, `rgba(${(node.r * 255) | 0},${(node.g * 255) | 0},${(node.b * 255) | 0},0)`)

      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(px, py, s + params.gr * node.intensity, 0, Math.PI * 2)
      ctx.fill()
    }

    // Bright dot core
    ctx.fillStyle = `rgba(${Math.min(255, (node.r * 255 + 80) | 0)},${Math.min(255, (node.g * 255 + 80) | 0)},${Math.min(255, (node.b * 255 + 80) | 0)},${a})`
    ctx.beginPath()
    ctx.arc(px, py, s, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Full frame render
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  nodes: PrismNode[],
  state: EngineState,
  params: PrismParameters
): void {
  const { width, height, centerX, centerY, radius } = state

  // Clear canvas
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  // Sort nodes by z-depth (back to front)
  const sorted = [...nodes].sort((a, b) => a.z - b.z)

  // Draw central prism
  drawCentralPrism(ctx, centerX, centerY, params.prismInt)

  // Draw beams from center to nodes
  for (const node of sorted) {
    drawBeam(ctx, node, centerX, centerY, radius, params)
  }

  // Draw nodes
  for (const node of sorted) {
    drawNode(ctx, node, centerX, centerY, radius, params)
  }
}
