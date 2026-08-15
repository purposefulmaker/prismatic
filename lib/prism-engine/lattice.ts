// ═══════════════════════════════════════════════════════════════
// MATH FractalDot ENGINE — Volumetric Shell System
// Concentric Fibonacci shells collapsing inward
// White light from behind projects through 3D shape mask
// ═══════════════════════════════════════════════════════════════

import type { PrismNode, LatticeParameters, LatticeShape } from './types'
import { GOLDEN_RATIO } from './constants'

// ─── 3D Shape SDFs ───
// Signed distance functions for volumetric shapes
// Negative = inside, Positive = outside

/**
 * Pyramid (Tetrahedron) SDF
 */
function sdfPyramid(x: number, y: number, z: number): number {
  const h = 0.8 // Height
  const scale = 0.7

  // Shift so apex is at top
  const py = (y - 0.3) * scale
  const px = x * scale
  const pz = z * scale

  // Simple cone approximation
  const baseRadius = (h - py) * 0.6
  const r = Math.sqrt(px * px + pz * pz)

  if (py > h) return py - h
  if (py < -h * 0.3) return -py - h * 0.3

  return r - baseRadius
}

/**
 * Cube SDF
 */
function sdfCube(x: number, y: number, z: number): number {
  const size = 0.5
  const dx = Math.abs(x) - size
  const dy = Math.abs(y) - size
  const dz = Math.abs(z) - size

  return Math.max(dx, dy, dz)
}

/**
 * Diamond (Octahedron) SDF
 */
function sdfDiamond(x: number, y: number, z: number): number {
  const scale = 0.65
  return (Math.abs(x) + Math.abs(y) + Math.abs(z) - scale)
}

/**
 * Star (Stellated) SDF
 */
function sdfStar(x: number, y: number, z: number): number {
  const r = Math.sqrt(x * x + y * y + z * z)

  // Spikes along each axis
  const spikeX = Math.abs(x) * 2.5 - 0.8
  const spikeY = Math.abs(y) * 2.5 - 0.8
  const spikeZ = Math.abs(z) * 2.5 - 0.8

  // Core sphere
  const core = r - 0.3

  // Union of core and inverse spikes
  return Math.max(core, Math.min(spikeX, spikeY, spikeZ))
}

/**
 * Evaluate shape SDF at a point
 * Returns signed distance (negative = inside shape)
 */
export function evaluateShapeSDF(
  x: number,
  y: number,
  z: number,
  shape: LatticeShape
): number {
  switch (shape) {
    case 'sphere':
      return Math.sqrt(x * x + y * y + z * z) - 1.0
    case 'pyramid':
      return sdfPyramid(x, y, z)
    case 'cube':
      return sdfCube(x, y, z)
    case 'diamond':
      return sdfDiamond(x, y, z)
    case 'star':
      return sdfStar(x, y, z)
    default:
      return -1 // Always inside
  }
}

/**
 * Create volumetric shell nodes
 * Multiple concentric Fibonacci spheres at decreasing radii
 */
export function createVolumetricShells(
  baseNodes: PrismNode[],
  params: LatticeParameters
): PrismNode[] {
  if (!params.enabled) return baseNodes

  const shells = Math.max(1, Math.min(params.shells, 32))
  const volumetricNodes: PrismNode[] = []

  // Light source position (behind the prism, -Z direction)
  const lightZ = -2.0
  const lightIntensity = 1.0

  for (let shellIdx = 0; shellIdx < shells; shellIdx++) {
    // Radius decreases from 1.0 to a small core
    // Use sqrt for more even distribution of volume
    const shellProgress = shellIdx / (shells - 1)
    const radius = 1.0 - (shellProgress * (1.0 - params.collapse * 0.8))

    // Fewer nodes on inner shells (proportional to surface area)
    const nodeRatio = radius * radius
    const shellNodeCount = Math.max(8, Math.floor(baseNodes.length * nodeRatio))

    // Sample nodes for this shell using golden angle
    for (let i = 0; i < shellNodeCount; i++) {
      // Golden angle distribution
      const theta = Math.acos(1 - 2 * (i + 0.5) / shellNodeCount)
      // Negate phi to match text direction (left-to-right)
      const phi = -2 * Math.PI * i / GOLDEN_RATIO

      // Spherical to Cartesian at this radius
      const sinTheta = Math.sin(theta)
      const x = sinTheta * Math.cos(phi) * radius
      const y = Math.cos(theta) * radius
      const z = sinTheta * Math.sin(phi) * radius

      // Check if point is inside the 3D shape
      const sdf = evaluateShapeSDF(x, y, z, params.shape)

      // Only include points inside or on surface of shape
      // Slightly expand for outer shell visibility
      const threshold = shellIdx === 0 ? 0.05 : 0.0
      if (sdf > threshold) continue

      // Calculate distance from light source
      const dx = x
      const dy = y
      const dz = z - lightZ
      const lightDist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      // Light attenuation (inverse square, clamped)
      const attenuation = lightIntensity / (1 + lightDist * lightDist * 0.3)

      // Surface proximity boost (brighter near shape surface)
      const surfaceBoost = sdf > -0.1 ? 1.5 : 1.0

      // Shell depth coloring (outer shells = cooler, inner = warmer)
      const wavelength = 380 + shellProgress * 320 // Violet to red

      // Create volumetric node
      const node: PrismNode = {
        idx: volumetricNodes.length,
        theta,
        phi,
        ox: x,
        oy: y,
        oz: z,
        x,
        y,
        z,
        intensity: attenuation * surfaceBoost * (0.3 + Math.random() * 0.2),
        wavelength,
        r: 1,
        g: 1,
        b: 1,
        shell: shellIdx,
        radius,
      }

      volumetricNodes.push(node)
    }
  }

  return volumetricNodes
}

/**
 * Update volumetric node positions with rotation
 * Applies Rodrigues rotation to all shell nodes
 */
export function rotateVolumetricNodes(
  nodes: PrismNode[],
  axis: [number, number, number],
  angle: number
): void {
  const [kx, ky, kz] = axis
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  const oneMinusCos = 1 - cosA

  for (const node of nodes) {
    const { ox, oy, oz } = node

    // Rodrigues rotation formula
    const dot = kx * ox + ky * oy + kz * oz
    const crossX = ky * oz - kz * oy
    const crossY = kz * ox - kx * oz
    const crossZ = kx * oy - ky * ox

    node.x = ox * cosA + crossX * sinA + kx * dot * oneMinusCos
    node.y = oy * cosA + crossY * sinA + ky * dot * oneMinusCos
    node.z = oz * cosA + crossZ * sinA + kz * dot * oneMinusCos
  }
}

/**
 * Apply white light projection from behind
 * Illuminates nodes based on their Z position and shape surface
 */
export function applyLightProjection(
  nodes: PrismNode[],
  params: LatticeParameters
): void {
  const lightZ = -2.0
  const lightX = 0
  const lightY = 0

  for (const node of nodes) {
    // Ray from light to node
    const dx = node.x - lightX
    const dy = node.y - lightY
    const dz = node.z - lightZ
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // Normalize ray direction
    const rayX = dx / dist
    const rayY = dy / dist
    const rayZ = dz / dist

    // Check if node is on the "lit" side (facing the light)
    // Approximate normal from position on sphere/shape
    const normalDot = -(node.x * rayX + node.y * rayY + node.z * rayZ)

    // Front-facing gets more light
    const facing = Math.max(0, normalDot)

    // Distance falloff
    const falloff = 1 / (1 + dist * 0.2)

    // Shell depth factor (outer shells slightly brighter)
    const shellFactor = node.radius ? 0.7 + node.radius * 0.3 : 1.0

    // Combine factors
    const lightAmount = facing * falloff * shellFactor * params.innerGlow

    // Blend toward white based on light
    node.intensity = Math.min(1, node.intensity + lightAmount * 0.5)

    // Shift color toward white for lit areas
    const whiteMix = lightAmount * 0.6
    node.r = node.r * (1 - whiteMix) + whiteMix
    node.g = node.g * (1 - whiteMix) + whiteMix
    node.b = node.b * (1 - whiteMix) + whiteMix
  }
}

/**
 * Check if a base node is inside the lattice shape
 * Used for filtering in non-volumetric mode
 */
export function isInLatticeShape(node: PrismNode, shape: LatticeShape): boolean {
  const sdf = evaluateShapeSDF(node.ox, node.oy, node.oz, shape)
  return sdf <= 0.05
}

// Legacy exports for compatibility
export function buildLatticeEdges(): never[] {
  return [] // No longer using edges
}

export function updateEdgeIntensities(): void {
  // No-op for compatibility
}

// Math.clamp polyfill
if (!Math.clamp) {
  Math.clamp = function (val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max)
  }
}

declare global {
  interface Math {
    clamp(val: number, min: number, max: number): number
  }
}
