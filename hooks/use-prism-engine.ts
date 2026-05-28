'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PrismNode, PrismParameters, EngineState, EngineStats, LatticeEdge } from '@/lib/prism-engine'
import {
  createFibonacciSphere,
  rodriguesRotate,
  nodeWavelength,
  wavelengthToRGB,
  calculateBeamPattern,
  applyPovPersistence,
  renderFrame,
  DEFAULT_NODE_COUNT,
  buildLatticeEdges,
  updateEdgeIntensities,
} from '@/lib/prism-engine'
import { createShapeMask, isNodeInShape } from '@/lib/prism-engine/shape-mask'

export interface UsePrismEngineOptions {
  nodeCount?: number
  panelWidth?: number
}

export interface UsePrismEngineReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  textCanvasRef: React.RefObject<HTMLCanvasElement | null>
  stats: EngineStats
  isRunning: boolean
  start: () => void
  stop: () => void
  updateParams: (params: PrismParameters) => void
}

/**
 * Core hook for running the prism engine animation loop
 */
export function usePrismEngine(
  params: PrismParameters,
  options: UsePrismEngineOptions = {}
): UsePrismEngineReturn {
  const { nodeCount = DEFAULT_NODE_COUNT, panelWidth = 300 } = options

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>(0)
  const nodesRef = useRef<PrismNode[]>([])
  const stateRef = useRef<EngineState>({
    ax: 0,
    ay: 0,
    az: 0,
    dragX: 0,
    dragY: 0,
    t: 0,
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    radius: 0,
    zoom: 1,
    dragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  })
  const paramsRef = useRef<PrismParameters>(params)
  const shapeMaskRef = useRef<Uint8ClampedArray | null>(null)
  const edgesRef = useRef<LatticeEdge[]>([])
  const fpsCounterRef = useRef({ count: 0, lastTime: 0 })

  const [isRunning, setIsRunning] = useState(false)
  const [stats, setStats] = useState<EngineStats>({
    nodeCount,
    activeBeams: 0,
    rpm: 0,
    wavelengthRange: '380–700nm',
    povTau: '0.12s',
    fps: 60,
  })

  // Update params ref when props change
  useEffect(() => {
    paramsRef.current = params

    // Update shape mask when text changes
    if (textCanvasRef.current) {
      const ctx = textCanvasRef.current.getContext('2d')
      if (ctx) {
        shapeMaskRef.current = createShapeMask(params.shapeTxt, textCanvasRef.current, ctx)
      }
    }
    
    // Rebuild lattice edges when lattice params change
    if (params.lattice?.enabled && nodesRef.current.length > 0) {
      edgesRef.current = buildLatticeEdges(nodesRef.current, params.lattice)
    } else {
      edgesRef.current = []
    }
  }, [params])

  // Initialize nodes
  useEffect(() => {
    nodesRef.current = createFibonacciSphere(nodeCount)
  }, [nodeCount])

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const W = window.innerWidth
    const H = window.innerHeight

    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const state = stateRef.current
    state.width = W
    state.height = H
    state.centerX = W / 2 - panelWidth / 2
    state.centerY = H / 2
    state.radius = Math.min(W - panelWidth, H) * 0.33 * state.zoom
  }, [panelWidth])

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      const dt = 1 / 60
      const state = stateRef.current
      const P = paramsRef.current
      const nodes = nodesRef.current

      state.t += dt

      // FPS counter
      fpsCounterRef.current.count++
      if (timestamp - fpsCounterRef.current.lastTime > 1000) {
        const fps = fpsCounterRef.current.count
        fpsCounterRef.current.count = 0
        fpsCounterRef.current.lastTime = timestamp

        setStats(prev => ({
          ...prev,
          fps,
          rpm: Math.round((P.ry + P.rx) * 30),
          povTau: `${P.tau.toFixed(2)}s`,
        }))
      }

      // Update rotation
      state.ax += P.rx * dt
      state.ay += P.ry * dt
      state.az += P.rz * dt

      const arx = state.ax + state.dragY * 0.003
      const ary = state.ay + state.dragX * 0.003
      const arz = state.az

      // Breathing animation
      const breath = 1 + Math.sin(state.t * 1.5) * P.ba
      const R = state.radius * breath

      // Transform nodes and calculate
      let beamCount = 0
      for (const node of nodes) {
        // Rodrigues rotation
        const [rx, ry, rz] = rodriguesRotate(node.ox, node.oy, node.oz, arx, ary, arz)
        node.x = rx
        node.y = ry
        node.z = rz

        // Calculate wavelength and color
        const nm = nodeWavelength(node, P.refIdx, P.dispersion)
        const [cr, cg, cb] = wavelengthToRGB(nm)

        // Beam pattern
        const bp = calculateBeamPattern(node, P.pattern, state.t, P, nodeCount)

        // Shape mask check
        const inShape = isNodeInShape(node, shapeMaskRef.current, P.shapeScale)

        // POV persistence with exponential decay
        const input = bp && inShape ? 1.0 : 0.0
        node.intensity = applyPovPersistence(node.intensity, input, P.tau, dt)

        if (input > 0) beamCount++

        // Store color
        node.r = cr
        node.g = cg
        node.b = cb
      }

      // Update active beams stat
      if (fpsCounterRef.current.count === 0) {
        setStats(prev => ({ ...prev, activeBeams: beamCount }))
      }

      // Update lattice edge intensities
      if (P.lattice?.enabled && edgesRef.current.length > 0) {
        updateEdgeIntensities(edgesRef.current, nodes, P.tau, dt)
      }

      // Render with updated radius
      const renderState = { ...state, radius: R }
      renderFrame(ctx, nodes, renderState, P, edgesRef.current)

      animationRef.current = requestAnimationFrame(animate)
    },
    [nodeCount]
  )

  // Mouse/touch handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = stateRef.current

    const onMouseDown = (e: MouseEvent) => {
      state.dragging = true
      state.lastMouseX = e.clientX
      state.lastMouseY = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!state.dragging) return
      state.dragX += e.clientX - state.lastMouseX
      state.dragY += e.clientY - state.lastMouseY
      state.lastMouseX = e.clientX
      state.lastMouseY = e.clientY
    }

    const onMouseUp = () => {
      state.dragging = false
    }

    const onTouchStart = (e: TouchEvent) => {
      state.dragging = true
      state.lastMouseX = e.touches[0].clientX
      state.lastMouseY = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!state.dragging) return
      state.dragX += e.touches[0].clientX - state.lastMouseX
      state.dragY += e.touches[0].clientY - state.lastMouseY
      state.lastMouseX = e.touches[0].clientX
      state.lastMouseY = e.touches[0].clientY
    }

    const onTouchEnd = () => {
      state.dragging = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      state.zoom = Math.max(0.3, Math.min(3, state.zoom - e.deltaY * 0.001))
      state.radius = Math.min(state.width - 300, state.height) * 0.33 * state.zoom
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [])

  const start = useCallback(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    setIsRunning(true)
    animationRef.current = requestAnimationFrame(animate)
  }, [animate, handleResize])

  const stop = useCallback(() => {
    window.removeEventListener('resize', handleResize)
    setIsRunning(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [handleResize])

  const updateParams = useCallback((newParams: PrismParameters) => {
    paramsRef.current = newParams
  }, [])

  // Auto-start and cleanup
  useEffect(() => {
    start()
    return () => stop()
  }, [start, stop])

  return {
    canvasRef,
    textCanvasRef,
    stats,
    isRunning,
    start,
    stop,
    updateParams,
  }
}
