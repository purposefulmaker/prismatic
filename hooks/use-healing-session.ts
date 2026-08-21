'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PrismParameters, HealingViz, HealingRegion } from '@/lib/prism-engine'
import {
  PRACTICES,
  visualToScene,
  HEALING_STATIC_PARAMS,
  BREATH_TIMING,
  type HealingMode,
  type HealingStep,
  type DriveTargets,
  type FigureTargets,
  type BreathPhase,
} from '@/lib/healing/practices'

type SetParams = (p: Partial<PrismParameters>) => void

export interface UseHealingSessionReturn {
  mode: HealingMode | null
  step: HealingStep | null
  stepIndex: number
  totalSteps: number
  isLast: boolean
  btnLabel: string
  btnEnabled: boolean
  btnPulsing: boolean
  breathPhase: BreathPhase | null
  timerText: string
  start: (mode: HealingMode) => void
  advance: () => void
  exit: () => void
}

const CALM_START: DriveTargets = {
  prismInt: 0.7,
  gr: 9,
  dr: 3.2,
  bo: 0.28,
  ry: 0.1,
  ba: 0.04,
  saturation: 1,
}

const easeCos = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)))

// The calm "home" field shown on the mode-select landing.
const HOME_SCENE = visualToScene('egg-complete')

/**
 * Drives a guided healing session and — crucially — the prism field itself.
 * A single rAF loop smoothly tweens the engine's brightness/size/motion between
 * steps and, during breath steps, modulates them to breathe in lockstep with
 * the practitioner (4s in · 2s hold · 6s out). Exiting a flow returns to the
 * calm landing; leaving Healing Mode entirely is handled by the caller.
 */
export function useHealingSession(setParams: SetParams): UseHealingSessionReturn {
  const [mode, setMode] = useState<HealingMode | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [btnLabel, setBtnLabel] = useState('Begin')
  const [btnEnabled, setBtnEnabled] = useState(true)
  const [btnPulsing, setBtnPulsing] = useState(false)
  const [breathPhase, setBreathPhase] = useState<BreathPhase | null>(null)
  const [timerText, setTimerText] = useState('')

  const steps = mode ? PRACTICES[mode] : []
  const totalSteps = steps.length
  const step = mode ? steps[stepIndex] ?? null : null
  const isLast = mode ? stepIndex >= totalSteps - 1 : false

  // ─── Live refs (read inside rAF without re-subscribing) ───
  const setParamsRef = useRef(setParams)
  setParamsRef.current = setParams
  const isLastRef = useRef(isLast)
  isLastRef.current = isLast

  const runningRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)

  // drive tween state
  const driveRef = useRef<DriveTargets>({ ...CALM_START })
  const targetRef = useRef<DriveTargets>({ ...CALM_START })
  const baseDriveRef = useRef<DriveTargets>({ ...CALM_START })
  const appliedRef = useRef<DriveTargets | null>(null)

  // Human-figure viz state. The dots draw a standing figure; these drive where
  // gold light concentrates and which structures (roots/shell/crown/egg) show.
  // Feature amounts tween in slowly so the egg/roots/shell build gracefully;
  // `region` snaps so the glow moves to the body part the words address.
  const IDLE_FIGURE: FigureTargets = { region: 'none', aura: 1, roots: 0, shell: 0, crown: 0 }
  const regionRef = useRef<HealingRegion>('none')
  const figRef = useRef({ aura: 1, roots: 0, shell: 0, crown: 0 })
  const figTargetRef = useRef({ aura: 1, roots: 0, shell: 0, crown: 0 })
  const revealRef = useRef(0)
  const breathLevelRef = useRef(0.5)

  // breath state machine
  const breathActiveRef = useRef(false)
  const breathCyclesRef = useRef(0)
  const breathTargetRef = useRef(0)
  const breathPhaseRef = useRef<BreathPhase>('inhale')
  const breathPhaseStartRef = useRef(0)

  // timers
  const stepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (stepTimeoutRef.current) { clearTimeout(stepTimeoutRef.current); stepTimeoutRef.current = null }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
  }, [])

  // ─── The single animation loop ───
  const loop = useCallback(() => {
    if (!runningRef.current) return
    const now = performance.now()
    const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000 || 0.016)
    lastFrameRef.current = now

    // Determine the current drive target (breath modulates around base)
    let tgt = targetRef.current
    if (breathActiveRef.current) {
      const L = advanceBreath(now)
      breathLevelRef.current = L
      const b = baseDriveRef.current
      // Gentle swell: the field expands (ba) and warms slightly on the inhale,
      // but glow/intensity stay modest so the dot texture never blows to white.
      tgt = {
        prismInt: b.prismInt * (1 + 0.22 * L),
        gr: b.gr * (1 + 0.28 * L),
        dr: b.dr * (1 + 0.12 * L),
        bo: Math.min(1, b.bo * (1 + 0.3 * L)),
        ry: b.ry,
        ba: b.ba + 0.06 * L,
        saturation: b.saturation,
      }
    }

    // Ease current → target
    const k = Math.min(1, dt * 3.2)
    const d = driveRef.current
    d.prismInt += (tgt.prismInt - d.prismInt) * k
    d.gr += (tgt.gr - d.gr) * k
    d.dr += (tgt.dr - d.dr) * k
    d.bo += (tgt.bo - d.bo) * k
    d.ry += (tgt.ry - d.ry) * k
    d.ba += (tgt.ba - d.ba) * k

    // When no breath gate is active, the egg still breathes on its own — a
    // slow autonomous ~8s cycle so the field is always gently alive.
    if (!breathActiveRef.current) {
      breathLevelRef.current = 0.5 - 0.5 * Math.cos((now / 8000) * 2 * Math.PI)
    }

    // Ease figure features toward their targets (slow — the egg / roots /
    // shell / crown build gracefully over ~1.5s), and fade the figure in.
    const fk = Math.min(1, dt * 1.6)
    const f = figRef.current
    const ft = figTargetRef.current
    f.aura += (ft.aura - f.aura) * fk
    f.roots += (ft.roots - f.roots) * fk
    f.shell += (ft.shell - f.shell) * fk
    f.crown += (ft.crown - f.crown) * fk
    revealRef.current += (1 - revealRef.current) * Math.min(1, dt * 1.5)

    const viz: HealingViz = {
      region: regionRef.current,
      breath: breathLevelRef.current,
      aura: f.aura,
      roots: f.roots,
      shell: f.shell,
      crown: f.crown,
      reveal: revealRef.current,
    }

    // In figure mode the field breathes continuously, so push every frame.
    setParamsRef.current({
      prismInt: d.prismInt,
      gr: d.gr,
      dr: d.dr,
      bo: d.bo,
      ry: d.ry,
      ba: d.ba,
      healingFigure: true,
      healingViz: viz,
    })
    appliedRef.current = { ...d }

    rafRef.current = requestAnimationFrame(loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Breath phase clock — returns inhale level L in [0,1]
  const advanceBreath = useCallback((now: number): number => {
    const elapsed = now - breathPhaseStartRef.current
    const phase = breathPhaseRef.current
    if (phase === 'inhale') {
      if (elapsed >= BREATH_TIMING.inhale) {
        breathPhaseRef.current = 'hold'
        breathPhaseStartRef.current = now
        setBreathPhase('hold')
        return 1
      }
      return easeCos(elapsed / BREATH_TIMING.inhale)
    }
    if (phase === 'hold') {
      if (elapsed >= BREATH_TIMING.hold) {
        breathPhaseRef.current = 'exhale'
        breathPhaseStartRef.current = now
        setBreathPhase('exhale')
        return 1
      }
      return 1
    }
    // exhale
    if (elapsed >= BREATH_TIMING.exhale) {
      breathCyclesRef.current += 1
      if (breathCyclesRef.current >= breathTargetRef.current) {
        // Breath complete → release the gate
        breathActiveRef.current = false
        setBreathPhase(null)
        setBtnEnabled(true)
        setBtnPulsing(false)
        setBtnLabel(isLastRef.current ? 'Finish' : 'Continue')
        return 0
      }
      breathPhaseRef.current = 'inhale'
      breathPhaseStartRef.current = now
      setBreathPhase('inhale')
      return 0
    }
    return easeCos(1 - elapsed / BREATH_TIMING.exhale)
  }, [])

  // ─── Apply a step whenever mode / stepIndex changes ───
  useEffect(() => {
    if (!mode) return
    const s = PRACTICES[mode][stepIndex]
    if (!s) return

    const scene = visualToScene(s.visual)

    // Move the gold light to the body part the words address (snaps), and set
    // the structural feature targets (aura / roots / shell / crown) which the
    // loop eases in gracefully.
    regionRef.current = scene.figure.region
    figTargetRef.current = {
      aura: scene.figure.aura,
      roots: scene.figure.roots,
      shell: scene.figure.shell,
      crown: scene.figure.crown,
    }

    // Static + color applied immediately (color fades via POV tau)
    setParamsRef.current({
      ...HEALING_STATIC_PARAMS,
      color: scene.color,
      lattice: scene.lattice,
    })

    // Numeric drive is tweened by the loop
    targetRef.current = { ...scene.drive }
    baseDriveRef.current = { ...scene.drive }

    // Reset breath + timers for this step
    clearTimers()
    breathActiveRef.current = false
    setBreathPhase(null)
    setTimerText('')

    const last = stepIndex >= PRACTICES[mode].length - 1

    if (s.breath > 0) {
      breathActiveRef.current = true
      breathTargetRef.current = s.breath
      breathCyclesRef.current = 0
      breathPhaseRef.current = 'inhale'
      breathPhaseStartRef.current = performance.now()
      setBreathPhase('inhale')
      setBtnLabel('Breathing')
      setBtnEnabled(false)
      setBtnPulsing(true)
    } else if (s.duration > 0) {
      setBtnLabel('Continue')
      setBtnEnabled(false)
      setBtnPulsing(true)
      let remaining = Math.ceil(s.duration / 1000)
      setTimerText(`${remaining}s`)
      countdownRef.current = setInterval(() => {
        remaining -= 1
        setTimerText(remaining > 0 ? `${remaining}s` : '')
        if (remaining <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
      }, 1000)
      stepTimeoutRef.current = setTimeout(() => {
        setBtnEnabled(true)
        setBtnPulsing(false)
        setTimerText('')
      }, s.duration)
    } else {
      setBtnLabel(last ? 'Finish' : 'Continue')
      setBtnEnabled(true)
      setBtnPulsing(false)
    }
  }, [mode, stepIndex, clearTimers])

  // Paint the calm "home" field on the landing — the figure resting inside a
  // fully-formed, slowly breathing golden egg.
  const paintHome = useCallback(() => {
    breathActiveRef.current = false
    targetRef.current = { ...HOME_SCENE.drive }
    baseDriveRef.current = { ...HOME_SCENE.drive }
    regionRef.current = IDLE_FIGURE.region
    figTargetRef.current = {
      aura: IDLE_FIGURE.aura,
      roots: IDLE_FIGURE.roots,
      shell: IDLE_FIGURE.shell,
      crown: IDLE_FIGURE.crown,
    }
    figRef.current = { ...figTargetRef.current }
    setParamsRef.current({
      ...HEALING_STATIC_PARAMS,
      color: HOME_SCENE.color,
      lattice: HOME_SCENE.lattice,
    })
  }, [IDLE_FIGURE])

  // ─── Public actions ───
  const start = useCallback((m: HealingMode) => {
    clearTimers()
    appliedRef.current = null
    setMode(m)
    setStepIndex(0)
  }, [clearTimers])

  // Exiting a flow returns to the calm landing (the field keeps breathing).
  const exit = useCallback(() => {
    clearTimers()
    breathActiveRef.current = false
    setMode(null)
    setStepIndex(0)
    setBreathPhase(null)
    setTimerText('')
    setBtnLabel('Begin')
    setBtnEnabled(true)
    setBtnPulsing(false)
    paintHome()
  }, [clearTimers, paintHome])

  const advance = useCallback(() => {
    clearTimers()
    breathActiveRef.current = false
    setBreathPhase(null)
    if (isLastRef.current) {
      exit()
      return
    }
    setStepIndex(i => i + 1)
  }, [clearTimers, exit])

  // Start the single drive loop on mount, paint the calm landing field, and
  // tear everything down on unmount (leaving Healing Mode).
  useEffect(() => {
    runningRef.current = true
    lastFrameRef.current = performance.now()
    appliedRef.current = null
    paintHome()
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      runningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      // Leaving Healing Mode: turn off the figure so the explorer field
      // returns to its normal pattern lighting.
      setParamsRef.current({ healingFigure: false })
    }
  }, [loop, paintHome])

  return {
    mode,
    step,
    stepIndex,
    totalSteps,
    isLast,
    btnLabel,
    btnEnabled,
    btnPulsing,
    breathPhase,
    timerText,
    start,
    advance,
    exit,
  }
}
