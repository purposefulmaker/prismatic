// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — Physics Module
// Real Math: Wavelength → RGB, Cauchy dispersion, Snell's law
// ═══════════════════════════════════════════════════════════════

import type { PrismNode, PrismParameters, BeamPattern } from './types'
import { GOLDEN_RATIO, DEFAULT_NODE_COUNT } from './constants'

/**
 * Convert wavelength (nanometers) to RGB using CIE approximation
 * λ(θ) = 380 + (θ/π)·320nm → RGB via Planck
 */
export function wavelengthToRGB(nm: number): [number, number, number] {
  let r = 0,
    g = 0,
    b = 0

  // Clamp to visible spectrum
  nm = Math.max(380, Math.min(700, nm))

  if (nm < 440) {
    r = -(nm - 440) / (440 - 380)
    b = 1
  } else if (nm < 490) {
    g = (nm - 440) / (490 - 440)
    b = 1
  } else if (nm < 510) {
    g = 1
    b = -(nm - 510) / (510 - 490)
  } else if (nm < 580) {
    r = (nm - 510) / (580 - 510)
    g = 1
  } else if (nm < 645) {
    r = 1
    g = -(nm - 645) / (645 - 580)
  } else {
    r = 1
  }

  // Intensity falloff at spectrum edges
  let factor: number
  if (nm < 420) {
    factor = 0.3 + (0.7 * (nm - 380)) / (420 - 380)
  } else if (nm > 645) {
    factor = 0.3 + (0.7 * (700 - nm)) / (700 - 645)
  } else {
    factor = 1.0
  }

  return [r * factor, g * factor, b * factor]
}

/**
 * Cauchy dispersion equation: refraction index varies with wavelength
 * n(λ) = A + B/λ² (Cauchy equation)
 */
export function cauchyRefraction(nm: number, refIdx: number, dispersion: number): number {
  return refIdx + (dispersion * 1e5) / (nm * nm)
}

/**
 * Snell's refraction angle
 * sin(θ₂) = (n₁/n₂) × sin(θ₁)
 */
export function snellAngle(n1: number, n2: number, thetaIn: number): number | null {
  const sinOut = (n1 / n2) * Math.sin(thetaIn)
  if (Math.abs(sinOut) > 1) return null // total internal reflection
  return Math.asin(sinOut)
}

/**
 * Calculate wavelength based on node position via prism refraction
 */
export function nodeWavelength(node: PrismNode, refIdx: number, dispersion: number): number {
  // Angle from polar axis determines refraction angle through prism
  // theta: 0=top, pi=bottom → maps to spectrum
  const normAngle = node.theta / Math.PI // 0 to 1
  const baseNm = 380 + normAngle * 320

  // Apply Cauchy dispersion shift
  const n = cauchyRefraction(baseNm, refIdx, dispersion)
  const shift = (n - refIdx) * 800

  return Math.max(380, Math.min(700, baseNm + shift))
}

/**
 * Rodrigues' rotation formula
 * R(t) = cos(ωt)I + sin(ωt)[n̂]ₓ + (1-cos(ωt))(n̂⊗n̂)
 */
export function rodriguesRotate(
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number
): [number, number, number] {
  // Rotate around X axis
  const y1 = y * Math.cos(rx) - z * Math.sin(rx)
  const z1 = y * Math.sin(rx) + z * Math.cos(rx)

  // Rotate around Y axis
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry)
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry)

  // Rotate around Z axis
  const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz)
  const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz)

  return [x3, y3, z2]
}

/**
 * Generate Fibonacci sphere nodes
 * θᵢ = arccos(1 − 2(i+0.5)/N) · φᵢ = 2π·φ·i
 */
export function createFibonacciSphere(nodeCount: number = DEFAULT_NODE_COUNT): PrismNode[] {
  const nodes: PrismNode[] = []

  for (let i = 0; i < nodeCount; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / nodeCount)
    const phi = 2 * Math.PI * GOLDEN_RATIO * i

    nodes.push({
      ox: Math.sin(theta) * Math.cos(phi),
      oy: Math.sin(theta) * Math.sin(phi),
      oz: Math.cos(theta),
      x: 0,
      y: 0,
      z: 0,
      theta,
      phi,
      idx: i,
      intensity: 0,
      r: 0,
      g: 0,
      b: 0,
    })
  }

  return nodes
}

/**
 * DFT / Gabor / Sinc / Helix / Fibonacci beam patterns
 * F_k = Σ x[n]·e^(-j2πkn/N)
 */
export function calculateBeamPattern(
  node: PrismNode,
  pattern: BeamPattern,
  t: number,
  params: PrismParameters,
  nodeCount: number
): number {
  const f = node.idx / nodeCount
  const pt = t * params.phaseV
  const k = params.harmK

  switch (pattern) {
    case 'dft': {
      // DFT: |X_k| = |Σ x[n]·e^(-j2πkn/N)|
      const phase = (2 * Math.PI * k * node.idx) / nodeCount + pt
      const real = Math.cos(phase)
      const imag = Math.sin(phase)
      const magnitude = Math.sqrt(real * real + imag * imag) * Math.cos(pt + f * k)
      return magnitude > 1 - (params.bc / nodeCount) * 2 ? 1 : 0
    }

    case 'gabor': {
      // Gabor atom: gaussian window × complex exponential
      const center = (pt * 0.1) % 1
      const dist = Math.min(Math.abs(f - center), Math.min(f + 1 - center, center + 1 - f))
      const sigma = (params.bc / nodeCount) * 0.5
      const gaussian = Math.exp((-dist * dist) / (2 * sigma * sigma))
      const carrier = Math.cos(2 * Math.PI * k * f + pt)
      return gaussian * (0.5 + 0.5 * carrier) > 0.3 ? 1 : 0
    }

    case 'helix': {
      // Double helix — DFT even/odd decomposition
      const h1 = Math.sin(node.theta * k + node.phi * 2 + pt)
      const h2 = Math.sin(node.theta * k + node.phi * 2 + pt + Math.PI)
      const combined = Math.max(h1, h2)
      return combined > 1 - (params.bc / nodeCount) * 2 ? 1 : 0
    }

    case 'sinc': {
      // Sinc interpolation: sin(πx)/(πx) — "all signals return home"
      const center = (pt * 0.05) % 1
      const x = (f - center) * k * 4
      const sincVal = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)
      return Math.abs(sincVal) > 1 - params.bc / nodeCount ? 1 : 0
    }

    case 'fib': {
      // Fibonacci spiral selection — golden angle stepping
      const fibIdx = Math.round(node.idx * GOLDEN_RATIO) % nodeCount
      const window = params.bc
      const offset = Math.floor(pt * 20) % nodeCount
      return (fibIdx + offset) % nodeCount < window ? 1 : 0
    }

    case 'all':
      return 1

    default:
      return f < params.bc / nodeCount ? 1 : 0
  }
}

/**
 * POV persistence exponential decay
 * V(θ,φ,t) = ∫ Sᵢ(t')·e^(-(t-t')/τ) dt'
 */
export function applyPovPersistence(currentIntensity: number, input: number, tau: number, dt: number): number {
  const decay = Math.exp(-dt / Math.max(tau, 0.01))
  return currentIntensity * decay + input * (1 - decay)
}
