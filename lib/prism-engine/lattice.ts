// ═══════════════════════════════════════════════════════════════
// MATH DISCO ENGINE — Lattice Module
// Polyhedra from Fibonacci Sphere: edge connections, shape constraints
// ═══════════════════════════════════════════════════════════════

import type { PrismNode, LatticeEdge, LatticeParameters, LatticeBase, LatticeShape } from './types'

/**
 * Calculate distance between two nodes on the sphere
 */
function nodeDistance(a: PrismNode, b: PrismNode): number {
  const dx = a.ox - b.ox
  const dy = a.oy - b.oy
  const dz = a.oz - b.oz
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Find k nearest neighbors for a node
 */
function findNeighbors(node: PrismNode, nodes: PrismNode[], k: number): number[] {
  const distances: { idx: number; dist: number }[] = []
  
  for (const other of nodes) {
    if (other.idx === node.idx) continue
    distances.push({
      idx: other.idx,
      dist: nodeDistance(node, other),
    })
  }
  
  distances.sort((a, b) => a.dist - b.dist)
  return distances.slice(0, k).map(d => d.idx)
}

/**
 * Get neighbor count based on lattice base type
 * tri = 3 edges, quad = 4 edges, hex = 6 edges
 */
function getNeighborCount(base: LatticeBase): number {
  switch (base) {
    case 'tri': return 3
    case 'quad': return 4
    case 'hex': return 6
    case 'off': return 0
  }
}

/**
 * Check if a point is inside the v0 triangle shape
 * The triangle points up with a small notch at bottom for the "0"
 */
function isInV0Shape(x: number, y: number, z: number): boolean {
  // Project to 2D (front view, x-y plane when z > 0)
  // Triangle vertices (normalized, pointing up)
  const scale = 0.9
  
  // Main triangle bounds
  const top = 0.8 * scale
  const bottom = -0.6 * scale
  const width = 0.7 * scale
  
  // Check if in front hemisphere (mostly)
  if (z < -0.3) return false
  
  // Triangle: top point, bottom-left, bottom-right
  const height = top - bottom
  const progress = (top - y) / height // 0 at top, 1 at bottom
  
  if (y > top || y < bottom) return false
  
  const halfWidthAtY = progress * width
  if (Math.abs(x) > halfWidthAtY) return false
  
  // Cut out inner triangle (smaller, creates the outline effect)
  const innerScale = 0.65
  const innerTop = top * innerScale
  const innerBottom = bottom * innerScale * 0.8
  const innerWidth = width * innerScale
  
  if (y < innerTop && y > innerBottom) {
    const innerHeight = innerTop - innerBottom
    const innerProgress = (innerTop - y) / innerHeight
    const innerHalfWidth = innerProgress * innerWidth
    
    if (Math.abs(x) < innerHalfWidth * 0.85) {
      // Inside the cutout - but keep some structure
      // Create a subtle "0" shape in the lower center
      const zeroY = -0.15
      const zeroRadius = 0.12
      const distFromZero = Math.sqrt((x * x) + ((y - zeroY) * (y - zeroY)))
      
      // Ring for the "0"
      if (distFromZero > zeroRadius * 0.5 && distFromZero < zeroRadius) {
        return true
      }
      
      return false
    }
  }
  
  return true
}

/**
 * Check if a point is inside a pyramid (tetrahedron) shape
 */
function isInPyramidShape(x: number, y: number, z: number): boolean {
  const scale = 0.85
  const apex = 0.9 * scale
  const base = -0.5 * scale
  
  if (y > apex || y < base) return false
  
  const progress = (apex - y) / (apex - base)
  const radius = progress * 0.8 * scale
  
  // Triangular cross-section
  const angle = Math.atan2(z, x)
  const r = Math.sqrt(x * x + z * z)
  const triRadius = radius / Math.cos((angle % (Math.PI * 2 / 3)) - Math.PI / 3)
  
  return r < Math.abs(triRadius) * 1.2
}

/**
 * Check if a point is inside a cube shape
 */
function isInCubeShape(x: number, y: number, z: number): boolean {
  const size = 0.6
  return Math.abs(x) < size && Math.abs(y) < size && Math.abs(z) < size
}

/**
 * Check if a point is inside a diamond (octahedron) shape
 */
function isInDiamondShape(x: number, y: number, z: number): boolean {
  const size = 0.75
  return (Math.abs(x) + Math.abs(y) + Math.abs(z)) < size * 1.5
}

/**
 * Check if a point is inside a star shape (stellated)
 */
function isInStarShape(x: number, y: number, z: number): boolean {
  const r = Math.sqrt(x * x + y * y + z * z)
  if (r > 0.95) return false
  
  // Create spikes along axes
  const axialDist = Math.min(
    Math.abs(x),
    Math.abs(y),
    Math.abs(z)
  )
  
  // Points along axes extend further
  const threshold = 0.25 + (0.7 - axialDist) * 0.5
  return r < threshold
}

/**
 * Check if node is within the target lattice shape
 */
export function isInLatticeShape(node: PrismNode, shape: LatticeShape): boolean {
  const { ox, oy, oz } = node
  
  switch (shape) {
    case 'sphere':
      return true // All nodes valid
    case 'v0':
      return isInV0Shape(ox, oy, oz)
    case 'pyramid':
      return isInPyramidShape(ox, oy, oz)
    case 'cube':
      return isInCubeShape(ox, oy, oz)
    case 'diamond':
      return isInDiamondShape(ox, oy, oz)
    case 'star':
      return isInStarShape(ox, oy, oz)
    default:
      return true
  }
}

/**
 * Build lattice edges from Fibonacci sphere nodes
 * Connects each node to its k nearest neighbors based on base type
 */
export function buildLatticeEdges(
  nodes: PrismNode[],
  params: LatticeParameters
): LatticeEdge[] {
  if (!params.enabled || params.base === 'off') return []
  
  const edges: LatticeEdge[] = []
  const edgeSet = new Set<string>() // Prevent duplicates
  const k = getNeighborCount(params.base)
  
  // Filter nodes by shape
  const validNodes = nodes.filter(n => isInLatticeShape(n, params.shape))
  const validIdxSet = new Set(validNodes.map(n => n.idx))
  
  for (const node of validNodes) {
    const neighbors = findNeighbors(node, nodes, k * 2) // Get extra to filter
    
    let connected = 0
    for (const neighborIdx of neighbors) {
      if (connected >= k) break
      if (!validIdxSet.has(neighborIdx)) continue
      
      // Create unique edge key (smaller idx first)
      const edgeKey = node.idx < neighborIdx 
        ? `${node.idx}-${neighborIdx}` 
        : `${neighborIdx}-${node.idx}`
      
      if (edgeSet.has(edgeKey)) continue
      edgeSet.add(edgeKey)
      
      // Calculate midpoint wavelength
      const other = nodes[neighborIdx]
      const midTheta = (node.theta + other.theta) / 2
      const wavelength = 380 + (midTheta / Math.PI) * 320
      
      edges.push({
        a: node.idx,
        b: neighborIdx,
        intensity: 1.0,
        wavelength,
      })
      
      connected++
    }
  }
  
  return edges
}

/**
 * Apply shell collapse - moves nodes inward based on their shell layer
 */
export function applyShellCollapse(
  nodes: PrismNode[],
  collapse: number,
  shells: number
): void {
  if (collapse <= 0) return
  
  for (const node of nodes) {
    // Determine shell based on theta (latitude)
    const shellIdx = Math.floor((node.theta / Math.PI) * shells)
    const shellProgress = shellIdx / shells // 0 at top, 1 at bottom
    
    // Collapse factor increases toward center shells
    const centerDist = Math.abs(shellProgress - 0.5) * 2 // 0 at equator, 1 at poles
    const collapseFactor = 1 - (collapse * (1 - centerDist) * 0.5)
    
    // Scale original coordinates inward
    node.ox *= collapseFactor
    node.oy *= collapseFactor
    node.oz *= collapseFactor
  }
}

/**
 * Update edge intensities with POV persistence
 */
export function updateEdgeIntensities(
  edges: LatticeEdge[],
  nodes: PrismNode[],
  tau: number,
  dt: number
): void {
  for (const edge of edges) {
    const nodeA = nodes[edge.a]
    const nodeB = nodes[edge.b]
    
    // Edge intensity is average of connected node intensities
    const targetIntensity = (nodeA.intensity + nodeB.intensity) / 2
    const decay = Math.exp(-dt / Math.max(tau, 0.01))
    edge.intensity = edge.intensity * decay + targetIntensity * (1 - decay)
  }
}
