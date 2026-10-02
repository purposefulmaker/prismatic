// ═══════════════════════════════════════════════════════════════
// MATH FractalDot ENGINE — Module Exports
// Prismatic POV · Lattice Mode
// ═══════════════════════════════════════════════════════════════

// Types
export * from './types'

// Constants
export * from './constants'

// Physics
export {
  wavelengthToRGB,
  cauchyRefraction,
  snellAngle,
  nodeWavelength,
  rodriguesRotate,
  createFibonacciSphere,
  calculateBeamPattern,
  applyPovPersistence,
} from './physics'

// Renderer
export { drawCentralPrism, drawBeam, drawNode, drawLatticeEdge, drawLatticeVertex, renderFrame } from './renderer'

// Shape Mask
export { createShapeMask, isNodeInShape } from './shape-mask'

// Color Resolution
export { resolveNodeColor, hexToRGB, rgbToHex } from './color'

// Lattice / Volumetric Shells
export { HEXAGRAM_EDGE_VERTS, HEXAGRAM_VERTEX_COUNT } from './hexagram'

export {
  createVolumetricShells,
  VOLUMETRIC_NODE_BUDGET,
  rotateVolumetricNodes,
  applyLightProjection,
  evaluateShapeSDF,
  isInLatticeShape,
  buildLatticeEdges,
  updateEdgeIntensities
} from './lattice'

// Three.js WebGL Renderer
export {
  createThreeScene,
  updateViewport,
  renderThreeFrame,
  disposeThreeScene,
  updateGpuMask,
  type ThreeScene,
} from './three-renderer'
