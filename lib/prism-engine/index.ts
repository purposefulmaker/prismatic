// ═══════════════════════════════════════════════════════════════
// NOTHINGBURGER ENGINE — Module Exports
// Prismatic POV · 318 Equations
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
export { drawCentralPrism, drawBeam, drawNode, renderFrame } from './renderer'

// Shape Mask
export { createShapeMask, isNodeInShape } from './shape-mask'
