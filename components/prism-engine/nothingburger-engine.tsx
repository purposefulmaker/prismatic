'use client'

import { useState } from 'react'
import { useThreeEngine } from '@/hooks/use-three-engine'
import { usePrismParameters } from '@/hooks/use-prism-parameters'
import { PrismStats } from './prism-stats'
import { PrismEquations } from './prism-equations'
import { PrismControlPanel } from './prism-control-panel'
import type { PrismParameters } from '@/lib/prism-engine'

export interface NothingburgerEngineProps {
  /** Initial parameters (optional) */
  initialParams?: Partial<PrismParameters>
  /** Number of Fibonacci sphere nodes */
  nodeCount?: number
  /** Width of control panel */
  panelWidth?: number
  /** Show stats overlay */
  showStats?: boolean
  /** Show equations overlay */
  showEquations?: boolean
  /** Show control panel */
  showControls?: boolean
  /** Initial panel open state */
  defaultPanelOpen?: boolean
  /** Custom class for the container */
  className?: string
}

/**
 * Math Disco Engine — Prismatic POV with Three.js WebGL
 *
 * A modular, importable component that renders the full engine with:
 * - 1000-node Fibonacci sphere
 * - Real physics (Cauchy dispersion, Snell's law, Rodrigues rotation)
 * - DFT/Gabor/Helix/Sinc/Fibonacci beam patterns
 * - POV persistence with exponential decay
 * - Three.js WebGL rendering with glowing particles
 * - Beam threads from prism to lit dots
 * - Rotating rainbow prism core
 * - Starfield background
 * - Interactive controls
 */
export function NothingburgerEngine({
  initialParams,
  nodeCount = 1000,
  panelWidth = 300,
  showStats = true,
  showEquations = true,
  showControls = true,
  defaultPanelOpen = true,
  className,
}: NothingburgerEngineProps) {
  const [panelOpen, setPanelOpen] = useState(defaultPanelOpen)

  const {
    params,
    setParam,
    applyPreset,
    setPattern,
    setShapeText,
    setLatticeParam,
  } = usePrismParameters(initialParams)

  const { canvasRef, stats, panelHidden, setPanelHidden } = useThreeEngine(params, {
    nodeCount,
  })

  // Sync panel state
  const handlePanelToggle = () => {
    setPanelOpen(v => !v)
    setPanelHidden(!panelOpen)
  }

  return (
    <div className={className}>
      {/* Three.js WebGL canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Stats overlay */}
      {showStats && <PrismStats stats={stats} />}

      {/* Equations overlay */}
      {showEquations && <PrismEquations activePattern={params.pattern} />}

      {/* Control panel */}
      {showControls && (
        <PrismControlPanel
          params={params}
          onParamChange={setParam}
          onPatternChange={setPattern}
          onPresetApply={applyPreset}
          onShapeTextChange={setShapeText}
          onLatticeChange={setLatticeParam}
          isOpen={panelOpen}
          onToggle={handlePanelToggle}
        />
      )}
    </div>
  )
}
