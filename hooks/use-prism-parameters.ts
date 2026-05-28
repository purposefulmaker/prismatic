'use client'

import { useCallback, useRef, useState } from 'react'
import type { PrismParameters, PrismPreset, BeamPattern, LatticeParameters } from '@/lib/prism-engine'
import { DEFAULT_PARAMETERS, PRESETS } from '@/lib/prism-engine'

export interface UsePrismParametersReturn {
  params: PrismParameters
  setParam: <K extends keyof PrismParameters>(key: K, value: PrismParameters[K]) => void
  setParams: (newParams: Partial<PrismParameters>) => void
  applyPreset: (presetName: string) => void
  setPattern: (pattern: BeamPattern) => void
  setShapeText: (text: string) => void
  setLatticeParam: <K extends keyof LatticeParameters>(key: K, value: LatticeParameters[K]) => void
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
    const preset = PRESETS.find(p => p.name === presetName)
    if (preset) {
      setParamsState(prev => {
        const newParams = { ...prev, ...preset.params }
        // Deep merge lattice if preset includes it
        if (preset.params.lattice) {
          newParams.lattice = { ...prev.lattice, ...preset.params.lattice }
        }
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
    presets: PRESETS,
    resetToDefaults,
  }
}
