'use client'

import { useCallback, useRef, useState } from 'react'
import type { PrismParameters, PrismPreset, BeamPattern, LatticeParameters, ColorParameters } from '@/lib/prism-engine'
import { DEFAULT_PARAMETERS, PRESETS } from '@/lib/prism-engine'

export interface UsePrismParametersReturn {
  params: PrismParameters
  setParam: <K extends keyof PrismParameters>(key: K, value: PrismParameters[K]) => void
  setParams: (newParams: Partial<PrismParameters>) => void
  applyPreset: (presetName: string) => void
  setPattern: (pattern: BeamPattern) => void
  setShapeText: (text: string) => void
  setLatticeParam: <K extends keyof LatticeParameters>(key: K, value: LatticeParameters[K]) => void
  setColorParam: <K extends keyof ColorParameters>(key: K, value: ColorParameters[K]) => void
  presets: PrismPreset[]
  resetToDefaults: () => void
}

/**
 * Hook for managing prism engine parameters with full reactivity
 */
export function usePrismParameters(
  initialParams: Partial<PrismParameters> = {}
): UsePrismParametersReturn {
  const [params, setParamsState] = useState<PrismParameters>({
    ...DEFAULT_PARAMETERS,
    ...initialParams,
  })

  // Ref for stable callback identity
  const paramsRef = useRef(params)
  paramsRef.current = params

  const setParam = useCallback(<K extends keyof PrismParameters>(key: K, value: PrismParameters[K]) => {
    setParamsState(prev => ({ ...prev, [key]: value }))
  }, [])

  const setParams = useCallback((newParams: Partial<PrismParameters>) => {
    setParamsState(prev => ({ ...prev, ...newParams }))
  }, [])

  const applyPreset = useCallback((presetName: string) => {
    console.log('[v0] applyPreset called with:', presetName)
    const preset = PRESETS.find(p => p.name === presetName)
    console.log('[v0] preset found:', preset?.name, 'has lattice:', !!preset?.params.lattice)
    if (preset) {
      setParamsState(prev => {
        const newParams = { ...prev, ...preset.params }
        // Deep merge lattice if preset includes it
        if (preset.params.lattice) {
          newParams.lattice = { ...prev.lattice, ...preset.params.lattice }
        }
        console.log('[v0] new params tau:', newParams.tau, 'ry:', newParams.ry, 'lattice.enabled:', newParams.lattice.enabled)
        return newParams
      })
    }
  }, [])

  const setPattern = useCallback((pattern: BeamPattern) => {
    setParamsState(prev => ({ ...prev, pattern }))
  }, [])

  const setShapeText = useCallback((text: string) => {
    setParamsState(prev => ({ ...prev, shapeTxt: text }))
  }, [])

  const setLatticeParam = useCallback(<K extends keyof LatticeParameters>(key: K, value: LatticeParameters[K]) => {
    setParamsState(prev => ({
      ...prev,
      lattice: { ...prev.lattice, [key]: value },
    }))
  }, [])

  const setColorParam = useCallback(<K extends keyof ColorParameters>(key: K, value: ColorParameters[K]) => {
    setParamsState(prev => ({
      ...prev,
      color: { ...prev.color, [key]: value },
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setParamsState(DEFAULT_PARAMETERS)
  }, [])

  return {
    params,
    setParam,
    setParams,
    applyPreset,
    setPattern,
    setShapeText,
    setLatticeParam,
    setColorParam,
    presets: PRESETS,
    resetToDefaults,
  }
}
