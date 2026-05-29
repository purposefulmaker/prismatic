// ═══════════════════════════════════════════════════════════════
// MATH DISCO ENGINE — Color Resolution
// Spectrum · Single · Palette · Gradient
// ═══════════════════════════════════════════════════════════════

import type { PrismNode, ColorParameters } from './types'
import { nodeWavelength, wavelengthToRGB } from './physics'

// ─── Hex parsing (cached) ───

const hexCache = new Map<string, [number, number, number]>()

/**
 * Parse a hex color string ("#ff8800" or "#f80") into normalized RGB (0-1).
 */
export function hexToRGB(hex: string): [number, number, number] {
  const cached = hexCache.get(hex)
  if (cached) return cached

  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  const int = parseInt(h, 16)
  let rgb: [number, number, number]
  if (Number.isNaN(int) || h.length !== 6) {
    rgb = [1, 1, 1]
  } else {
    rgb = [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255]
  }
  hexCache.set(hex, rgb)
  return rgb
}

/**
 * Convert normalized RGB (0-1) to a hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * 255)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

// ─── Gradient interpolation ───

/**
 * Sample a multi-stop gradient at position t (0-1), returning normalized RGB.
 */
function sampleGradient(stops: [number, number, number][], t: number): [number, number, number] {
  if (stops.length === 0) return [1, 1, 1]
  if (stops.length === 1) return stops[0]

  const clamped = Math.max(0, Math.min(1, t))
  const scaled = clamped * (stops.length - 1)
  const i = Math.min(Math.floor(scaled), stops.length - 2)
  const f = scaled - i
  const a = stops[i]
  const b = stops[i + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

// ─── Main color resolution ───

/**
 * Resolve the RGB color for a node based on the active color mode.
 * Returns normalized RGB (0-1). Applies saturation adjustment.
 */
export function resolveNodeColor(
  node: PrismNode,
  color: ColorParameters,
  refIdx: number,
  dispersion: number
): [number, number, number] {
  let r: number, g: number, b: number

  switch (color.mode) {
    case 'single': {
      ;[r, g, b] = hexToRGB(color.single)
      break
    }

    case 'palette': {
      const pal = color.palette.length > 0 ? color.palette : ['#ffffff']
      // Each dot gets one discrete color from the palette (confetti style)
      ;[r, g, b] = hexToRGB(pal[node.idx % pal.length])
      break
    }

    case 'gradient': {
      const stops = (color.gradient.length > 0 ? color.gradient : ['#ffffff']).map(hexToRGB)
      // Map node position along chosen axis to gradient t (0-1)
      let t: number
      switch (color.gradientAxis) {
        case 'x':
          t = (node.x + 1) / 2
          break
        case 'z':
          t = (node.z + 1) / 2
          break
        case 'radial':
          t = Math.min(1, Math.sqrt(node.x * node.x + node.y * node.y))
          break
        case 'y':
        default:
          t = (node.y + 1) / 2
          break
      }
      ;[r, g, b] = sampleGradient(stops, t)
      break
    }

    case 'spectrum':
    default: {
      const nm = nodeWavelength(node, refIdx, dispersion)
      ;[r, g, b] = wavelengthToRGB(nm)
      break
    }
  }

  // Apply saturation: blend toward/away from luminance
  const sat = color.saturation ?? 1
  if (sat !== 1) {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    r = lum + (r - lum) * sat
    g = lum + (g - lum) * sat
    b = lum + (b - lum) * sat
  }

  return [r, g, b]
}
