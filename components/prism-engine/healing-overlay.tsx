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
    <div className="pointer-events-auto relative flex h-full w-full flex-col px-4 py-5 md:px-7 md:py-6">
      {/* Edge-only shading preserves the sphere as the unobstructed guide. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgba(0,0,0,0.38)_76%,rgba(0,0,0,0.82)_100%)]" />

      <header className="relative flex items-start justify-between gap-4">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-[0.45em] text-heal-accent">
            Healing Mode
          </p>
          <h1 className="mt-2 font-cinzel text-lg font-semibold tracking-[0.12em] text-heal-fg md:text-xl">
            The Egg &amp; The Turtle
          </h1>
        </div>
        <button
          onClick={onClose}
          aria-label="Return to the field"
          className="border border-heal-line bg-black/70 px-3 py-2 font-cinzel text-[9px] uppercase tracking-[0.25em] text-heal-fg transition-colors hover:border-heal-accent"
        >
          Exit
        </button>
      </header>

      {/* The center remains completely clear for the living prism sphere. */}
      <div className="min-h-0 flex-1" aria-hidden="true" />

      <section className="relative mx-auto w-full max-w-4xl border border-heal-line bg-heal-card p-3 shadow-[0_12px_48px_rgba(0,0,0,0.75)] backdrop-blur-xl md:p-4">
        <div className="mb-3 flex items-end justify-between gap-4">
          <p className="font-cormorant text-base italic text-heal-muted">
            Choose a practice. The sphere will guide the field.
          </p>
          <span className="hidden font-cinzel text-[8px] uppercase tracking-[0.3em] text-heal-accent md:block">
            Four guided flows
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PRACTICE_META.map(p => (
            <button
              key={p.mode}
              onClick={() => onSelect(p.mode)}
              className="group min-h-24 border border-heal-line bg-black/70 p-3 text-left transition-colors hover:border-heal-accent hover:bg-black/90 focus:outline-none focus-visible:border-heal-accent"
            >
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-xs text-heal-accent">{p.numeral}</span>
                <h2 className="font-cinzel text-[10px] tracking-[0.08em] text-heal-fg md:text-xs">
                  {p.title}
                </h2>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-snug text-heal-muted">
                {p.desc}
              </p>
              <p className="mt-2 font-cinzel text-[8px] uppercase tracking-[0.2em] text-heal-accent">
                {p.time}
              </p>
            </button>
          ))}
        </div>
      </section>
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
    <div className="pointer-events-auto flex h-full w-full flex-col px-4 py-5 md:px-7 md:py-6">
      {/* Sparse top rail; the middle of the viewport belongs to the sphere. */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="border border-heal-line bg-black/70 px-3 py-2 font-cinzel text-[9px] uppercase tracking-[0.25em] text-heal-fg transition-colors hover:border-heal-accent"
        >
          Back
        </button>
        <div className="flex items-center gap-1.5" aria-label={`Step ${stepIndex + 1} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i === stepIndex
                  ? 'w-5 bg-heal-accent'
                  : i < stepIndex
                    ? 'w-1.5 bg-heal-accent/60'
                    : 'w-1.5 bg-white/25'
              )}
            />
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1" aria-hidden="true" />

      {/* Compact guidance rail: never reaches into the sphere's center. */}
      <section className="mx-auto w-full max-w-4xl border border-heal-line bg-heal-card p-4 shadow-[0_12px_48px_rgba(0,0,0,0.8)] backdrop-blur-xl md:p-5">
        <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
          <div>
            <div className="flex items-center gap-3">
              <p className="font-cinzel text-[9px] uppercase tracking-[0.35em] text-heal-accent">
                {step.label}
              </p>
              {breathPhase && (
                <span className="flex items-center gap-2 font-cinzel text-[9px] uppercase tracking-[0.25em] text-heal-accent">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full bg-heal-accent transition-transform duration-1000',
                      breathPhase === 'inhale' && 'scale-150',
                      breathPhase === 'hold' && 'scale-150',
                      breathPhase === 'exhale' && 'scale-75'
                    )}
                  />
                  {breathText}
                </span>
              )}
            </div>
            <p className="mt-2 text-pretty text-base leading-relaxed text-heal-fg md:text-lg">
              {step.main}
            </p>
            {step.speak && (
              <p className="mt-2 border-l border-heal-accent pl-3 text-pretty text-base italic leading-relaxed text-heal-accent">
                {step.speak}
              </p>
            )}
            {step.detail && (
              <p className="mt-2 text-pretty text-sm italic leading-relaxed text-heal-muted">
                {step.detail}
              </p>
            )}
          </div>

          <button
            onClick={onAdvance}
            disabled={!btnEnabled}
            className={cn(
              'w-full border py-3 font-cinzel text-[10px] uppercase tracking-[0.3em] transition-colors',
              btnEnabled
                ? 'border-heal-accent bg-heal-accent/15 text-heal-fg hover:bg-heal-accent/25'
                : 'cursor-default border-heal-line bg-black/40 text-heal-muted',
              btnPulsing && 'animate-pulse'
            )}
          >
            {btnLabel}
            {timerText && <span className="ml-2 text-heal-muted">{timerText}</span>}
          </button>
        </div>
      </section>
    </div>
  )
}
