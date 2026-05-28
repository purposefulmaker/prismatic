'use client'

import { cn } from '@/lib/utils'
import type { BeamPattern } from '@/lib/prism-engine'
import { EQUATION_MAP } from '@/lib/prism-engine'

interface PrismEquationsProps {
  activePattern: BeamPattern
  className?: string
}

/**
 * Displays the physics equations used by the engine
 */
export function PrismEquations({ activePattern, className }: PrismEquationsProps) {
  return (
    <div
      className={cn(
        'fixed left-3.5 bottom-3.5 z-50 max-w-[400px] font-mono text-[8px] text-white/20 leading-[1.6]',
        className
      )}
    >
      <div>θᵢ = arccos(1 − 2(i+0.5)/N) · φᵢ = 2π·φ·i</div>
      <div className="text-white/40">
        R(t) = cos(ωt)I + sin(ωt)[n̂]ₓ + (1−cos(ωt))(n̂⊗n̂)
      </div>
      <div className="text-white/40">λ(θ) = 380 + (θ/π)·320nm → RGB via Planck</div>
      <div className="text-white/40">
        {"V(θ,φ,t) = ∫ Sᵢ(t')·e^(-(t-t')/τ) dt'"}
      </div>
      <div className="text-white/40">F_k = F_k^even + F_k^odd = 0 (net-zero)</div>
      <div className="text-white/40" id="eqActive">
        {EQUATION_MAP[activePattern]}
      </div>
    </div>
  )
}
