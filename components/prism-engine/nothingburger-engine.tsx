'use client'

import { useState, useEffect } from 'react'
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
  /** Show the v0 spotlight hero overlay (title + mode switch + sponsor badge) */
  showHero?: boolean
  /** Apply a named preset on mount (e.g. 'v0-spotlight') */
  initialPreset?: string
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
  showHero = false,
  initialPreset,
  className,
}: NothingburgerEngineProps) {
  // Start with panel closed on mobile
  const [panelOpen, setPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? defaultPanelOpen : false
    }
    return defaultPanelOpen
  })

  const {
    params,
    setParam,
    applyPreset,
    setPattern,
    setShapeText,
    setLatticeParam,
    setColorParam,
  } = usePrismParameters(initialParams)

  const { canvasRef, stats, panelHidden, setPanelHidden } = useThreeEngine(params, {
    nodeCount,
  })

  // Apply a named preset once on mount (e.g. boot straight into V0 spotlight)
  useEffect(() => {
    if (initialPreset) applyPreset(initialPreset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync panel state
  const handlePanelToggle = () => {
    setPanelOpen(v => !v)
    setPanelHidden(!panelOpen)
  }

  const inSpotlight = !!params.spotlight
  const inBender = !!params.gpuMode

  return (
    <div className={className}>
      {/* Three.js WebGL canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* v0 Spotlight hero overlay */}
      {showHero && (
        <>
          {/* Top: title + mode switch */}
          <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col items-center gap-3 pt-6 md:pt-10">
            <h1 className="font-mono text-sm md:text-base tracking-[0.5em] text-white/90 text-balance">
              v0 AS PHYSICS
            </h1>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.3em] text-white/35 text-balance">
              FIBONACCI LATTICE · GOLDEN ANGLE · POV PERSISTENCE
            </p>
            <div className="pointer-events-auto mt-1 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => applyPreset('v0-spotlight')}
                className={
                  'font-mono text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-full border transition-colors ' +
                  (inSpotlight
                    ? 'border-white/80 bg-white text-black'
                    : 'border-white/20 bg-transparent text-white/60 hover:border-white/50 hover:text-white')
                }
              >
                SPOTLIGHT
              </button>
              <button
                onClick={() => applyPreset('genesis')}
                className={
                  'font-mono text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-full border transition-colors ' +
                  (!inSpotlight && !inBender
                    ? 'border-white/80 bg-white text-black'
                    : 'border-white/20 bg-transparent text-white/60 hover:border-white/50 hover:text-white')
                }
              >
                DISCO
              </button>
              <button
                onClick={() => applyPreset('reality-bender')}
                className={
                  'font-mono text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-full border transition-colors ' +
                  (inBender
                    ? 'border-white/80 bg-white text-black'
                    : 'border-white/20 bg-transparent text-white/60 hover:border-white/50 hover:text-white')
                }
              >
                REALITY BENDER
              </button>
            </div>
            {inBender && (
              <p className="font-mono text-[8px] tracking-[0.25em] text-white/30">
                GPU TIER · 30,000 NODES · ZERO CPU LOOP
              </p>
            )}
          </div>

          {/* Bottom-left: sponsored by Vercel */}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-20 left-3 md:bottom-3 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 font-mono text-[9px] tracking-[0.15em] text-white/50 transition-colors hover:border-white/30 hover:text-white/90"
          >
            <svg width="11" height="10" viewBox="0 0 76 65" fill="currentColor" aria-hidden="true">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            SPONSORED BY VERCEL
          </a>
        </>
      )}

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
          onColorChange={setColorParam}
          isOpen={panelOpen}
          onToggle={handlePanelToggle}
        />
      )}
    </div>
  )
}
