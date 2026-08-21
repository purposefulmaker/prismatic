'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { PrismParameters } from '@/lib/prism-engine'
import { PRACTICE_META, type HealingMode } from '@/lib/healing/practices'
import { useHealingSession } from '@/hooks/use-healing-session'

interface HealingOverlayProps {
  setParams: (p: Partial<PrismParameters>) => void
  onClose: () => void
}

/**
 * The Healing Mode surface. The prism field is NOT covered — the overlay is a
 * translucent scrim with the guidance text, so the living sphere behind it is
 * the actual guide. On the landing the field breathes calmly; inside a flow it
 * embodies each step and breathes in lockstep with the practitioner.
 */
export function HealingOverlay({ setParams, onClose }: HealingOverlayProps) {
  const {
    mode,
    step,
    stepIndex,
    totalSteps,
    btnLabel,
    btnEnabled,
    btnPulsing,
    breathPhase,
    timerText,
    start,
    advance,
    exit,
  } = useHealingSession(setParams)

  // Escape key: leave the current flow, or close Healing Mode from the landing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (mode) exit()
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, exit, onClose])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col font-cormorant text-heal-fg">
      {mode === null ? (
        <HealingLanding onSelect={start} onClose={onClose} />
      ) : (
        <HealingSession
          key={mode}
          step={step}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          btnLabel={btnLabel}
          btnEnabled={btnEnabled}
          btnPulsing={btnPulsing}
          breathPhase={breathPhase}
          timerText={timerText}
          onAdvance={advance}
          onBack={exit}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Landing — choose a practice
// ─────────────────────────────────────────────────────────────
function HealingLanding({
  onSelect,
  onClose,
}: {
  onSelect: (m: HealingMode) => void
  onClose: () => void
}) {
  return (
    <div className="pointer-events-auto relative flex h-full w-full flex-col overflow-y-auto px-5 py-8 md:px-8">
      {/* Gentle vignette so text reads over the luminous field, egg still visible */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.7)_100%)]" />
      <header className="relative mx-auto mb-8 max-w-2xl text-center">
        <p className="font-cinzel text-[10px] uppercase tracking-[0.5em] text-heal-accent/70">
          Healing Mode
        </p>
        <h1 className="mt-4 font-cinzel text-2xl font-semibold tracking-[0.15em] text-heal-fg md:text-3xl">
          The Egg &amp; The Turtle
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-base italic leading-relaxed text-heal-fg/70">
          Energetic sovereignty, guided by the living field. Choose a practice.
          Let the sphere breathe with you.
        </p>
      </header>

      <div className="relative mx-auto grid w-full max-w-2xl gap-3 md:grid-cols-2">
        {PRACTICE_META.map(p => (
          <button
            key={p.mode}
            onClick={() => onSelect(p.mode)}
            className={cn(
              'group relative overflow-hidden rounded-lg border border-heal-line bg-heal-card/75 p-5 text-left',
              'shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500',
              'hover:border-heal-accent/60 hover:bg-heal-card/90 focus:outline-none focus-visible:border-heal-accent'
            )}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-cinzel text-lg text-heal-accent/80">{p.numeral}</span>
              <h2 className="font-cinzel text-base tracking-[0.12em] text-heal-fg">
                {p.title}
              </h2>
            </div>
            <p className="mt-2 text-pretty text-[15px] leading-relaxed text-heal-fg/65">
              {p.desc}
            </p>
            <p className="mt-3 font-cinzel text-[9px] uppercase tracking-[0.3em] text-heal-accent/50">
              {p.time}
            </p>
          </button>
        ))}
      </div>

      <div className="relative mx-auto mt-8 max-w-2xl text-center">
        <button
          onClick={onClose}
          className="font-cinzel text-[10px] uppercase tracking-[0.35em] text-heal-fg/40 transition-colors hover:text-heal-fg/80"
        >
          Return to the Field
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Session — one guided step at a time
// ─────────────────────────────────────────────────────────────
function HealingSession({
  step,
  stepIndex,
  totalSteps,
  btnLabel,
  btnEnabled,
  btnPulsing,
  breathPhase,
  timerText,
  onAdvance,
  onBack,
}: {
  step: ReturnType<typeof useHealingSession>['step']
  stepIndex: number
  totalSteps: number
  btnLabel: string
  btnEnabled: boolean
  btnPulsing: boolean
  breathPhase: ReturnType<typeof useHealingSession>['breathPhase']
  timerText: string
  onAdvance: () => void
  onBack: () => void
}) {
  if (!step) return null

  const breathText =
    breathPhase === 'inhale'
      ? 'Breathe in'
      : breathPhase === 'hold'
        ? 'Hold'
        : breathPhase === 'exhale'
          ? 'Breathe out'
          : ''

  return (
    <div className="pointer-events-auto flex h-full w-full flex-col">
      {/* Top bar: back + progress */}
      <div className="flex items-center justify-between px-5 pt-6 md:px-8">
        <button
          onClick={onBack}
          className="font-cinzel text-[10px] uppercase tracking-[0.3em] text-heal-fg/45 transition-colors hover:text-heal-fg/85"
        >
          ← Back
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i === stepIndex
                  ? 'w-5 bg-heal-accent'
                  : i < stepIndex
                    ? 'w-1.5 bg-heal-accent/50'
                    : 'w-1.5 bg-heal-fg/20'
              )}
            />
          ))}
        </div>
      </div>

      {/* Guidance — anchored to the bottom so the sphere breathes in the open space above */}
      <div className="mt-auto px-5 pb-8 md:px-8">
        <div className="mx-auto max-w-xl rounded-xl border border-heal-line bg-heal-card/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl md:p-8">
          <p className="font-cinzel text-[10px] uppercase tracking-[0.4em] text-heal-accent/70">
            {step.label}
          </p>

          <p className="mt-4 text-pretty text-lg leading-relaxed text-heal-fg md:text-xl">
            {step.main}
          </p>

          {step.speak && (
            <p className="mt-4 border-l-2 border-heal-accent/40 pl-4 text-pretty text-lg italic leading-relaxed text-heal-accent">
              {step.speak}
            </p>
          )}

          {step.detail && (
            <p className="mt-4 text-pretty text-base italic leading-relaxed text-heal-fg/55">
              {step.detail}
            </p>
          )}

          {/* Breath indicator */}
          {breathPhase && (
            <div className="mt-6 flex items-center gap-3">
              <span
                className={cn(
                  'h-3 w-3 rounded-full bg-heal-accent transition-transform duration-1000 ease-in-out',
                  breathPhase === 'inhale' && 'scale-150',
                  breathPhase === 'hold' && 'scale-150',
                  breathPhase === 'exhale' && 'scale-75'
                )}
              />
              <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-heal-accent/80">
                {breathText}
              </span>
            </div>
          )}

          {/* Advance button */}
          <button
            onClick={onAdvance}
            disabled={!btnEnabled}
            className={cn(
              'mt-7 w-full rounded-md border py-3 font-cinzel text-[11px] uppercase tracking-[0.35em] transition-all duration-300',
              btnEnabled
                ? 'border-heal-accent/60 bg-heal-accent/15 text-heal-fg hover:bg-heal-accent/30'
                : 'cursor-default border-heal-line bg-transparent text-heal-fg/35',
              btnPulsing && 'animate-pulse'
            )}
          >
            {btnLabel}
            {timerText && <span className="ml-2 text-heal-fg/50">{timerText}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
