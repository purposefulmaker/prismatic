// ═══════════════════════════════════════════════════════════════
// FIGURE TUNING — hand-adjustable knobs for the particle human
//
// Every phase of every practice can be dialed in by hand and LOCKED. The
// tuner panel writes into these values live; "Lock Phase" stores the result
// for that phase, and "Copy JSON" emits a block that can be pasted into
// LOCKED_TUNES below to bake it in permanently.
// ═══════════════════════════════════════════════════════════════

import type { FigureTune } from '@/lib/prism-engine'

export type { FigureTune }

// Dots are drawn additively, so overlapping body dots saturate fast — these
// defaults are deliberately dim so the figure reads as a dot field, not a
// solid white silhouette. Dial up per phase with the tuner as needed.
export const DEFAULT_TUNE: FigureTune = {
  scale: 1,
  scatter: 1,
  exposure: 0.55,

  bodyShare: 0.5,
  auraShare: 0.24,
  rootsShare: 0.1,
  shellShare: 0.1,
  crownShare: 0.06,

  bodyBase: 0.1,
  bodyGlow: 0.4,
  auraGain: 0.5,
  rootsGain: 0.55,
  shellGain: 0.5,
  crownGain: 0.55,

  glowWidth: 0.2,
  breathDepth: 1,

  eggW: 0.56,
  eggH: 0.98,
}

/** Slider definitions for the tuner panel. */
export const TUNE_FIELDS: {
  key: keyof FigureTune
  label: string
  min: number
  max: number
  step: number
  group: 'form' | 'light' | 'layers'
}[] = [
  { key: 'scale', label: 'Figure Scale', min: 0.5, max: 1.5, step: 0.01, group: 'form' },
  { key: 'scatter', label: 'Body Tightness', min: 0.2, max: 1.6, step: 0.01, group: 'form' },
  { key: 'eggW', label: 'Egg Width', min: 0.3, max: 1.1, step: 0.01, group: 'form' },
  { key: 'eggH', label: 'Egg Height', min: 0.4, max: 1.4, step: 0.01, group: 'form' },

  { key: 'exposure', label: 'Exposure', min: 0.2, max: 2, step: 0.01, group: 'light' },
  { key: 'bodyBase', label: 'Body Ambient', min: 0, max: 1, step: 0.01, group: 'light' },
  { key: 'bodyGlow', label: 'Region Glow', min: 0, max: 2, step: 0.01, group: 'light' },
  { key: 'glowWidth', label: 'Glow Spread', min: 0.05, max: 0.5, step: 0.01, group: 'light' },
  { key: 'breathDepth', label: 'Breath Depth', min: 0, max: 2, step: 0.01, group: 'light' },

  { key: 'bodyShare', label: 'Body Dots', min: 0.1, max: 0.9, step: 0.01, group: 'layers' },
  { key: 'auraShare', label: 'Egg Dots', min: 0, max: 0.6, step: 0.01, group: 'layers' },
  { key: 'auraGain', label: 'Egg Bright', min: 0, max: 2, step: 0.01, group: 'layers' },
  { key: 'rootsShare', label: 'Roots Dots', min: 0, max: 0.4, step: 0.01, group: 'layers' },
  { key: 'rootsGain', label: 'Roots Bright', min: 0, max: 2, step: 0.01, group: 'layers' },
  { key: 'shellShare', label: 'Shell Dots', min: 0, max: 0.4, step: 0.01, group: 'layers' },
  { key: 'shellGain', label: 'Shell Bright', min: 0, max: 2, step: 0.01, group: 'layers' },
  { key: 'crownShare', label: 'Crown Dots', min: 0, max: 0.4, step: 0.01, group: 'layers' },
  { key: 'crownGain', label: 'Crown Bright', min: 0, max: 2, step: 0.01, group: 'layers' },
]

/**
 * Hand-locked per-phase overrides. Paste blocks from the tuner's "Copy JSON"
 * here to make a tuning permanent for that phase.
 */
export const LOCKED_TUNES: Record<string, Partial<FigureTune>> = {}

/** Resolve the effective tune for a phase: defaults ← baked ← session edits. */
export function resolveTune(
  visual: string,
  session: Record<string, Partial<FigureTune>>
): FigureTune {
  return {
    ...DEFAULT_TUNE,
    ...(LOCKED_TUNES[visual] ?? {}),
    ...(session[visual] ?? {}),
  }
}
