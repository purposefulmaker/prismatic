'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface PrismCanvasProps {
  className?: string
}

/**
 * Main canvas element for prism rendering
 */
export const PrismCanvas = forwardRef<HTMLCanvasElement, PrismCanvasProps>(
  ({ className }, ref) => {
    return (
      <canvas
        ref={ref}
        className={cn('block absolute top-0 left-0', className)}
      />
    )
  }
)

PrismCanvas.displayName = 'PrismCanvas'

/**
 * Hidden canvas for text-to-shape rendering
 */
export const PrismTextCanvas = forwardRef<HTMLCanvasElement, { className?: string }>(
  ({ className }, ref) => {
    return <canvas ref={ref} className={cn('hidden', className)} />
  }
)

PrismTextCanvas.displayName = 'PrismTextCanvas'
