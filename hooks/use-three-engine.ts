'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PrismNode, PrismParameters, EngineState, EngineStats, ThreeScene } from '@/lib/prism-engine'
import {
  createFibonacciSphere,
  rodriguesRotate,
  calculateBeamPattern,
  applyPovPersistence,
  resolveNodeColor,
  DEFAULT_NODE_COUNT,
  createVolumetricShells,
  createThreeScene,
  updateViewport,
  renderThreeFrame,
  disposeThreeScene,
} from '@/lib/prism-engine'
import { createShapeMask, isNodeInShape } from '@/lib/prism-engine/shape-mask'

export interface UseThreeEngineOptions {
  nodeCount?: number
  initialParams?: Partial<PrismParameters>
}

export interface UseThreeEngineReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  stats: EngineStats
  isRunning: boolean
  panelHidden: boolean
  setPanelHidden: (hidden: boolean) => void
}

export function useThreeEngine(
  params: PrismParameters,
  options: UseThreeEngineOptions = {}
): UseThreeEngineReturn {
  const { nodeCount = DEFAULT_NODE_COUNT } = options

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const threeSceneRef = useRef<ThreeScene | null>(null)
  const nodesRef = useRef<PrismNode[]>([])
  const volumetricNodesRef = useRef<PrismNode[]>([])
  const stateRef = useRef<EngineState>({
    t: 0,
    radius: 1,
    phase: 0,
    rotation: { x: 0, y: 0, z: 0 },
  })
  const paramsRef = useRef<PrismParameters>(params)
  const shapeMaskRef = useRef<Uint8ClampedArray | null>(null)
  const fpsCounterRef = useRef({ count: 0, lastTime: 0 })
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Interaction state
  const dragRef = useRef({ x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 })

  const [stats, setStats] = useState<EngineStats>({
    nodeCount,
    activeBeams: 0,
    rpm: 0,
    fps: 60,
  })
  const [isRunning, setIsRunning] = useState(false)
  const [panelHidden, setPanelHidden] = useState(false)

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

    // Rebuild volumetric shells when lattice params change
    if (params.lattice?.enabled && nodesRef.current.length > 0) {
      volumetricNodesRef.current = createVolumetricShells(nodesRef.current, params.lattice)
    } else {
      volumetricNodesRef.current = []
    }
  }, [params])

  // Handle viewport updates when panel visibility changes
  useEffect(() => {
    if (threeSceneRef.current) {
      updateViewport(
        threeSceneRef.current,
        window.innerWidth,
        window.innerHeight,
        panelHidden
      )
    }
  }, [panelHidden])

  // Initialize Three.js scene
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create offscreen canvas for text rendering
    const textCanvas = document.createElement('canvas')
    textCanvas.width = 256
    textCanvas.height = 128
    textCanvasRef.current = textCanvas

    // Create Three.js scene
    threeSceneRef.current = createThreeScene(canvas, nodeCount * 8) // Extra capacity for volumetric

    // Create Fibonacci sphere nodes
    const nodes = createFibonacciSphere(nodeCount)
    nodesRef.current = nodes

    // Initialize shape mask
    const textCtx = textCanvas.getContext('2d')
    if (textCtx) {
      shapeMaskRef.current = createShapeMask(paramsRef.current.shapeTxt, textCanvas, textCtx)
    }

    // Set initial viewport
    updateViewport(threeSceneRef.current, window.innerWidth, window.innerHeight, false)

    // Resize handler
    const handleResize = () => {
      if (threeSceneRef.current) {
        updateViewport(
          threeSceneRef.current,
          window.innerWidth,
          window.innerHeight,
          panelHidden
        )
      }
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    const animate = (timestamp: number) => {
      if (!threeSceneRef.current) return

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = timestamp

      const state = stateRef.current
      const P = paramsRef.current
      const nodes = nodesRef.current
      const drag = dragRef.current
      const threeScene = threeSceneRef.current

      state.t += dt

      // Calculate rotation from params + drag
      const arx = (P.rx + drag.y * 0.001) * state.t
      const ary = (P.ry + drag.x * 0.001) * state.t
      const arz = P.rz * state.t

      // Breathing animation
      const breath = 1 + Math.sin(state.t * 1.5) * P.ba

      // Choose which node set to use
      const isVolumetric = P.lattice?.enabled && volumetricNodesRef.current.length > 0
      const activeNodes = isVolumetric ? volumetricNodesRef.current : nodes

      // Transform nodes and calculate
      let beamCount = 0
      for (const node of activeNodes) {
        // Rodrigues rotation
        const [rx, ry, rz] = rodriguesRotate(node.ox, node.oy, node.oz, arx, ary, arz)
        node.x = rx
        node.y = ry
        node.z = rz

        // Resolve color based on active color mode
        const [cr, cg, cb] = resolveNodeColor(node, P.color, P.refIdx, P.dispersion)

        // Store base color
        node.r = cr
        node.g = cg
        node.b = cb

        if (isVolumetric) {
          // Volumetric mode: apply text shape mask if present
          const inShape = isNodeInShape(node, shapeMaskRef.current, P.shapeScale)
          if (shapeMaskRef.current && P.shapeTxt) {
            node.intensity = inShape ? 0.8 + node.z * 0.2 : 0.0
          } else {
            node.intensity = 0.5 + node.z * 0.3
          }
          if (node.intensity > 0.1) beamCount++
        } else {
          // Standard mode: beam pattern and shape mask
          const bp = calculateBeamPattern(node, P.pattern, state.t, P, nodeCount)
          const inShape = isNodeInShape(node, shapeMaskRef.current, P.shapeScale)
          const input = bp && inShape ? 1.0 : 0.0
          node.intensity = applyPovPersistence(node.intensity, input, P.tau, dt)
          if (input > 0) beamCount++
        }
      }

      // Render with Three.js
      renderThreeFrame(threeScene, activeNodes, P, state.t, dt, breath)

      // FPS calculation
      fpsCounterRef.current.count++
      if (timestamp - fpsCounterRef.current.lastTime >= 1000) {
        const fps = fpsCounterRef.current.count
        const rpm = ((P.ry + drag.x * 0.001) / (Math.PI * 2)) * 60
        setStats({
          nodeCount: activeNodes.length,
          activeBeams: beamCount,
          rpm: Math.abs(rpm),
          fps,
        })
        fpsCounterRef.current.count = 0
        fpsCounterRef.current.lastTime = timestamp
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    setIsRunning(true)
    lastTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationRef.current)
      if (threeSceneRef.current) {
        disposeThreeScene(threeSceneRef.current)
        threeSceneRef.current = null
      }
      setIsRunning(false)
    }
  }, [nodeCount, panelHidden])

  // Mouse/touch interaction handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      dragRef.current.dragging = true
      dragRef.current.lastX = e.clientX
      dragRef.current.lastY = e.clientY
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return
      dragRef.current.x += e.clientX - dragRef.current.lastX
      dragRef.current.y += e.clientY - dragRef.current.lastY
      dragRef.current.lastX = e.clientX
      dragRef.current.lastY = e.clientY
    }

    const handleMouseUp = () => {
      dragRef.current.dragging = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      dragRef.current.dragging = true
      dragRef.current.lastX = e.touches[0].clientX
      dragRef.current.lastY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current.dragging) return
      dragRef.current.x += e.touches[0].clientX - dragRef.current.lastX
      dragRef.current.y += e.touches[0].clientY - dragRef.current.lastY
      dragRef.current.lastX = e.touches[0].clientX
      dragRef.current.lastY = e.touches[0].clientY
    }

    const handleTouchEnd = () => {
      dragRef.current.dragging = false
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (threeSceneRef.current) {
        threeSceneRef.current.zoom = Math.max(
          0.3,
          Math.min(4, threeSceneRef.current.zoom - e.deltaY * 0.001)
        )
        updateViewport(
          threeSceneRef.current,
          window.innerWidth,
          window.innerHeight,
          panelHidden
        )
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true })
    canvas.addEventListener('touchend', handleTouchEnd)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [panelHidden])

  return {
    canvasRef,
    stats,
    isRunning,
    panelHidden,
    setPanelHidden,
  }
}
