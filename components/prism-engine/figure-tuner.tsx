'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TUNE_FIELDS, type FigureTune } from '@/lib/healing/figure-tuning'

interface FigureTunerProps {
  phaseKey: string
  tune: FigureTune
  locked: boolean
  onChange: (key: keyof FigureTune, value: number) => void
  onReset: () => void
  onExport: () => string
}

const GROUPS: { id: 'form' | 'light' | 'layers'; label: string }[] = [
  { id: 'form', label: 'Form' },
  { id: 'light', label: 'Light' },
  { id: 'layers', label: 'Layers' },
]

export function FigureTuner({
  phaseKey,
  tune,
  locked,
  onChange,
  onReset,
  onExport,
}: FigureTunerProps) {
  const [open, setOpen] = useState(false)
  const [group, setGroup] = useState<'form' | 'light' | 'layers'>('light')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(onExport())
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto flex items-center gap-2 border border-white/10 bg-black/80 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.25em] text-white/70 backdrop-blur-xl transition-colors hover:border-white/30 hover:text-white"
      >
        Tune
        {locked && <span className="h-1 w-1 rounded-full bg-heal-accent" />}
      </button>
    )
  }

  const fields = TUNE_FIELDS.filter(f => f.group === group)

  return (
    <div className="pointer-events-auto w-52 border border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <div className="min-w-0">
          <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
            Tuning
          </p>
          <p className="truncate font-mono text-[9px] tracking-[0.1em] text-heal-accent">
            {phaseKey}
            {locked && ' •'}
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close tuner"
          className="ml-2 shrink-0 border border-white/10 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-white/30 hover:text-white"
        >
          Hide
        </button>
      </div>

      <div className="flex border-b border-white/8">
        {GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => setGroup(g.id)}
            className={cn(
              'flex-1 py-2 font-mono text-[8px] uppercase tracking-[0.2em] transition-colors',
              group === g.id
                ? 'bg-white/[0.06] text-heal-accent'
                : 'text-white/45 hover:text-white/75'
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="max-h-[46vh] overflow-y-auto px-3 py-2">
        {fields.map(f => (
          <label key={f.key} className="mb-2.5 block">
            <span className="flex items-baseline justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">
                {f.label}
              </span>
              <span className="font-mono text-[9px] tabular-nums text-heal-accent">
                {tune[f.key].toFixed(2)}
              </span>
            </span>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={tune[f.key]}
              onChange={e => onChange(f.key, Number(e.target.value))}
              className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-heal-accent"
            />
          </label>
        ))}
      </div>

      <div className="flex gap-1.5 border-t border-white/8 p-2">
        <button
          onClick={onReset}
          className="flex-1 border border-white/10 py-2 font-mono text-[8px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-white/30 hover:text-white"
        >
          Reset
        </button>
        <button
          onClick={copy}
          className="flex-1 border border-heal-accent/50 bg-heal-accent/10 py-2 font-mono text-[8px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-heal-accent/20"
        >
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>
    </div>
  )
}
