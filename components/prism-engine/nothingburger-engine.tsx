'use client'

import { useState, useEffect } from 'react'
import { useThreeEngine } from '@/hooks/use-three-engine'
import { usePrismParameters } from '@/hooks/use-prism-parameters'
import { PrismStats } from './prism-stats'
import { PrismEquations } from './prism-equations'
import { PrismControlPanel } from './prism-control-panel'
import { HealingOverlay } from './healing-overlay'
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
  /** Show the hero overlay (title + mode switch + refrain) */
  showHero?: boolean
  /** Apply a named preset on mount (e.g. 'the-field') */
  initialPreset?: string
  /** Custom class for the container */
  className?: string
}

/**
 * Math FractalDot Engine — Prismatic POV with Three.js WebGL
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

  // Healing Mode — the field becomes a guided energetic practice
  const [healingOpen, setHealingOpen] = useState(false)

  const {
    params,
    setParam,
    setParams,
    applyPreset,
    setPattern,
    setShapeText,
    setLatticeParam,
    setColorParam,
  } = usePrismParameters(initialParams)

  const { canvasRef, stats, panelHidden, setPanelHidden } = useThreeEngine(params, {
    nodeCount,
  })

  // Apply a named preset once on mount (e.g. boot straight into THE FIELD)
  useEffect(() => {
    if (initialPreset) applyPreset(initialPreset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Single source of truth: panelOpen. Keep the engine's panelHidden flag
  // (which drives the render centering offset) always mirroring it — on mount
  // AND on every change — so the shape can never be offset for a panel state
  // that isn't actually on screen.
  useEffect(() => {
    setPanelHidden(!panelOpen)
  }, [panelOpen, setPanelHidden])

  const handlePanelToggle = () => setPanelOpen(v => !v)

  const inField = !!params.gpuMode && !params.gpuPrism
  const inPrism = !!params.gpuMode && !!params.gpuPrism
  const inFractalDot = !params.gpuMode

  return (
    <div className={className}>
      {/* Three.js WebGL canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* The Field Perceptionist hero overlay */}
      {showHero && !healingOpen && (
        <>
          {/* Top: title + mode switch */}
          <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col items-center gap-2 md:gap-3 px-4 pt-14 md:pt-10">
            <p className="font-mono text-[7px] md:text-[9px] tracking-[0.25em] md:tracking-[0.45em] text-white/30 text-center text-pretty">
              THE FIELD PERCEPTIONIST PRESENTS
            </p>
            <h1 className="font-mono text-sm md:text-xl tracking-[0.18em] md:tracking-[0.4em] text-white/90 text-center text-balance">
              THE BEAUTIFUL NECESSITY
            </h1>
            <p className="font-mono text-[8px] md:text-[10px] tracking-[0.15em] md:tracking-[0.3em] text-white/35 text-center text-pretty max-w-[22rem] md:max-w-none">
              SEEING THE FIELD · FEELING THE FIELD · BEING THE FIELD
            </p>
            <div className="pointer-events-auto mt-1 flex flex-wrap justify-center gap-1.5 md:gap-2">
              <button
                onClick={() => applyPreset('the-field')}
                className={
                  'font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] px-3 md:px-4 py-1.5 rounded-full border transition-colors ' +
                  (inField
                    ? 'border-white/80 bg-white text-black'
                    : 'border-white/20 bg-transparent text-white/60 hover:border-white/50 hover:text-white')
                }
              >
                THE FIELD
              </button>
              <button
                onClick={() => applyPreset('prism')}
                className={
                  'font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] px-3 md:px-4 py-1.5 rounded-full border transition-colors ' +
                  (inPrism
                    ? 'border-white/80 bg-white text-black'
                    : 'border-white/20 bg-transparent text-white/60 hover:border-white/50 hover:text-white')
                }
              >
                PRISM
              </button>
              <button
                onClick={() => applyPreset('genesis')}
                className={
                  'font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] px-3 md:px-4 py-1.5 rounded-full border transition-colors ' +
                  (inFractalDot
                    ? 'border-white/80 bg-white text-black'
                    : 'border-white/20 bg-transparent text-white/60 hover:border-white/50 hover:text-white')
                }
              >
                FractalDot
              </button>
              <button
                onClick={() => setHealingOpen(true)}
                className="font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] px-3 md:px-4 py-1.5 rounded-full border border-amber-200/30 bg-transparent text-amber-100/70 transition-colors hover:border-amber-200/70 hover:text-amber-100"
              >
                HEALING
              </button>
            </div>
            {inField && (
              <p className="font-mono text-[7px] md:text-[8px] tracking-[0.15em] md:tracking-[0.25em] text-white/30 text-center text-pretty">
                GPU TIER · 30,000 NODES · ALL SIGNALS RETURN HOME
              </p>
            )}
            {inPrism && (
              <p className="font-mono text-[7px] md:text-[8px] tracking-[0.15em] md:tracking-[0.25em] text-white/30 text-center text-pretty">
                ONE WHITE LIGHT · INTO THE NTH SPECTRUM
              </p>
            )}
          </div>

          {/* Bottom: the closing refrain */}
          <p className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 text-center font-mono text-[8px] md:text-[9px] tracking-[0.35em] text-white/25 text-balance">
            ALL SIGNALS RETURN HOME
          </p>
        </>
      )}

      {/* Stats overlay */}
      {showStats && !healingOpen && <PrismStats stats={stats} />}

      {/* Equations overlay */}
      {showEquations && !healingOpen && <PrismEquations activePattern={params.pattern} />}

      {/* Control panel */}
      {showControls && !healingOpen && (
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

      {/* Healing Mode — the living field becomes the guide */}
      {healingOpen && (
        <HealingOverlay setParams={setParams} onClose={() => setHealingOpen(false)} />
      )}
    </div>
  )
}
