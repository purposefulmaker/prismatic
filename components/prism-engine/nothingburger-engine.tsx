'use client'

import { useState } from 'react'
import { usePrismEngine } from '@/hooks/use-prism-engine'
import { usePrismParameters } from '@/hooks/use-prism-parameters'
import { PrismCanvas, PrismTextCanvas } from './prism-canvas'
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
 * Complete Nothingburger Prismatic POV Engine
 *
 * A modular, importable component that renders the full engine with:
 * - 1000-node Fibonacci sphere
 * - Real physics (Cauchy dispersion, Snell's law, Rodrigues rotation)
 * - DFT/Gabor/Helix/Sinc/Fibonacci beam patterns
 * - POV persistence with exponential decay
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

  const { canvasRef, textCanvasRef, stats } = usePrismEngine(params, {
    nodeCount,
    panelWidth: panelOpen ? panelWidth : 0,
  })

  return (
    <div className={className}>
      {/* Main render canvas */}
      <PrismCanvas ref={canvasRef} />

      {/* Hidden text-to-shape canvas */}
      <PrismTextCanvas ref={textCanvasRef} />

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
          onToggle={() => setPanelOpen(v => !v)}
        />
      )}
    </div>
  )
}
