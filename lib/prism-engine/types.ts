// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — Type Definitions
// Prismatic POV · 318 Equations
// ═══════════════════════════════════════════════════════════════

export interface PrismNode {
  // Original Fibonacci sphere coordinates
  ox: number
  oy: number
  oz: number
  // Current transformed coordinates
  x: number
  y: number
  z: number
  // Spherical coordinates
  theta: number
  phi: number
  // Index in node array
  idx: number
  // POV persistence
  intensity: number
  // RGB color components (0-1)
  r: number
  g: number
  b: number
}

export interface PrismParameters {
  // POV persistence time constant
  tau: number
  // Shape scale for text formation
  shapeScale: number
  // Snell's law refraction index (crown glass ≈ 1.52)
  refIdx: number
  // Cauchy dispersion coefficient
  dispersion: number
  // Prism visual intensity
  prismInt: number
  // Rotation velocities (Rodrigues)
  rx: number
  ry: number
  rz: number
  // Beam parameters
  bc: number // beam count
  bw: number // beam width
  bo: number // beam opacity
  // Pattern mode
  pattern: BeamPattern
  // DFT harmonic k
  harmK: number
  // Phase velocity
  phaseV: number
  // Dot rendering
  dr: number // dot radius
  gr: number // glow radius
  ba: number // breathing amplitude
  // Shape text
  shapeTxt: string
  // Lattice mode parameters
  lattice: LatticeParameters
}

export type BeamPattern = 'dft' | 'gabor' | 'helix' | 'sinc' | 'fib' | 'all'

// ═══════════════════════════════════════════════════════════════
// LATTICE MODE — Polyhedra from Fibonacci Sphere
// ═══════════════════════════════════════════════════════════════

export type LatticeBase = 'tri' | 'quad' | 'hex' | 'off'
export type LatticeShape = 'sphere' | 'v0' | 'pyramid' | 'cube' | 'diamond' | 'star'

export interface LatticeEdge {
  // Indices of connected nodes
  a: number
  b: number
  // Edge intensity (for POV persistence)
  intensity: number
  // Midpoint wavelength for color
  wavelength: number
}

export interface LatticeParameters {
  // Lattice mode enabled
  enabled: boolean
  // Base polygon type for edge connections
  base: LatticeBase
  // Target shape to constrain lattice
  shape: LatticeShape
  // Number of concentric shells (1-32)
  shells: number
  // Edge width multiplier
  edgeWidth: number
  // Edge opacity
  edgeOpacity: number
  // Static mode (no rotation)
  static: boolean
  // Shell collapse animation (0-1)
  collapse: number
  // Inner glow intensity
  innerGlow: number
}

export interface PrismPreset {
  name: string
  label: string
  params: Partial<PrismParameters>
}

export interface EngineStats {
  nodeCount: number
  activeBeams: number
  rpm: number
  wavelengthRange: string
  povTau: string
  fps: number
}

export interface EngineState {
  // Accumulated rotation angles
  ax: number
  ay: number
  az: number
  // Drag rotation offset
  dragX: number
  dragY: number
  // Animation time
  t: number
  // Viewport dimensions
  width: number
  height: number
  centerX: number
  centerY: number
  radius: number
  // Zoom level
  zoom: number
  // Interaction state
  dragging: boolean
  lastMouseX: number
  lastMouseY: number
}

// Equation display mapping
export const EQUATION_MAP: Record<BeamPattern, string> = {
  dft: 'DFT: X_k = Σ x[n]·e^(-j2πkn/N) · (1,j,-1,-j)',
  gabor: 'GABOR: g(t−nT)·e^(j2πmFt) · Gaussian×Carrier',
  helix: 'HELIX: F_k^even + F_k^odd = 0 · Double decomposition',
  sinc: 'SINC: sin(πx)/(πx) · All signals return home',
  fib: 'FIBONACCI: φ = (1+√5)/2 · Golden angle stepping',
  all: 'ALL: Every node illuminated · Full spectrum',
}

// Lattice shape display mapping
export const LATTICE_SHAPE_MAP: Record<LatticeShape, string> = {
  sphere: 'SPHERE: Fibonacci uniform distribution',
  v0: 'v0: Vercel triangle · AI emergence',
  pyramid: 'PYRAMID: Tetrahedron · Fire element',
  cube: 'CUBE: Hexahedron · Earth element',
  diamond: 'DIAMOND: Octahedron · Air element',
  star: 'STAR: Stellated polyhedron · Cosmic',
}
