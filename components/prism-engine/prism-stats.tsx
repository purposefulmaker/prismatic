'use client'

import { cn } from '@/lib/utils'
import type { EngineStats } from '@/lib/prism-engine'

interface PrismStatsProps {
  stats: EngineStats
  className?: string
}

/**
 * Displays real-time engine statistics
 */
export function PrismStats({ stats, className }: PrismStatsProps) {
  return (
    <div
      className={cn(
        'fixed left-3.5 top-3.5 z-50 font-mono text-[9px] text-white/30 leading-[1.9]',
        className
      )}
    >
      <div>
        NODES <span className="text-white/80 font-bold">{stats.nodeCount}</span>
      </div>
      <div>
        ACTIVE BEAMS <span className="text-white/80 font-bold">{stats.activeBeams}</span>
      </div>
      <div>
        RPM <span className="text-white/80 font-bold">{stats.rpm}</span>
      </div>
      <div>
        λ RANGE <span className="text-white/80 font-bold">{stats.wavelengthRange}</span>
      </div>
      <div>
        POV τ <span className="text-white/80 font-bold">{stats.povTau}</span>
      </div>
      <div>
        FPS <span className="text-white/80 font-bold">{stats.fps}</span>
      </div>
    </div>
  )
}
