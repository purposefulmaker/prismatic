'use client'

import { cn } from '@/lib/utils'
import type {
  BeamPattern,
  PrismParameters,
  LatticeBase,
  LatticeShape,
  ColorMode,
  ColorParameters,
  GradientAxis,
} from '@/lib/prism-engine'
import { PRESETS, COLOR_PALETTES, COLOR_GRADIENTS } from '@/lib/prism-engine'

// ─── Section Component ───
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3 pb-3 border-b border-white/5">
      <div className="text-[8px] tracking-[2px] text-white/35 mb-2 uppercase">{title}</div>
      {children}
    </div>
  )
}

// ─── Control Row ───
function ControlRow({
  label,
  value,
  children,
}: {
  label: string
  value: string | number
  children: React.ReactNode
}) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[9px] text-white/50">{label}</label>
        <span className="text-[9px] text-white font-bold min-w-[36px] text-right">{value}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Custom Slider ───
function PrismSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-0.5 bg-white/10 rounded-sm appearance-none outline-none mt-1 cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
        [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
    />
  )
}

// ─── Button Group ───
function ButtonGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1 flex-wrap mt-1.5">{children}</div>
}

// ─── Pattern/Preset Button ───
function PatternButton({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 min-w-[55px] px-0.5 py-1.5 text-[8px] tracking-[1px] text-center rounded-sm cursor-pointer transition-all',
        'font-mono border',
        active
          ? 'bg-white/12 border-white/30 text-white'
          : 'bg-white/4 border-white/10 text-white/60 hover:bg-white/8 hover:text-white'
      )}
    >
      {label}
    </button>
  )
}

// ─── Color Swatch (editable native color input) ───
function ColorSwatch({
  color,
  onChange,
  size = 'md',
  onRemove,
}: {
  color: string
  onChange: (hex: string) => void
  size?: 'sm' | 'md'
  onRemove?: () => void
}) {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
  return (
    <div className="relative group">
      <label
        className={cn(
          dim,
          'block rounded-sm border border-white/20 cursor-pointer overflow-hidden',
          'hover:border-white/50 transition-all'
        )}
        style={{ backgroundColor: color }}
      >
        <input
          type="color"
          value={color}
          onChange={e => onChange(e.target.value)}
          className="opacity-0 w-full h-full cursor-pointer"
        />
      </label>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-black border border-white/30
            text-white/70 text-[8px] leading-none flex items-center justify-center opacity-0
            group-hover:opacity-100 transition-opacity hover:bg-red-900/80"
          aria-label="Remove color"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ─── Small preset button (for palette/gradient presets) ───
function SwatchPreset({
  colors,
  label,
  gradient,
  onClick,
}: {
  colors: string[]
  label: string
  gradient?: boolean
  onClick: () => void
}) {
  const bg = gradient
    ? `linear-gradient(90deg, ${colors.join(', ')})`
    : undefined
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[60px] rounded-sm border border-white/10 overflow-hidden
        hover:border-white/40 transition-all"
      title={label}
    >
      {gradient ? (
        <div className="h-4 w-full" style={{ background: bg }} />
      ) : (
        <div className="flex h-4 w-full">
          {colors.map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
      )}
      <div className="text-[7px] tracking-[1px] text-white/50 text-center py-0.5">{label}</div>
    </button>
  )
}

// ─── Color Mode Section ───
function ColorSection({
  color,
  onColorChange,
}: {
  color: ColorParameters
  onColorChange: <K extends keyof ColorParameters>(key: K, value: ColorParameters[K]) => void
}) {
  const modes: { name: ColorMode; label: string }[] = [
    { name: 'spectrum', label: 'SPECTRUM' },
    { name: 'single', label: 'SINGLE' },
    { name: 'palette', label: 'PALETTE' },
    { name: 'gradient', label: 'GRADIENT' },
  ]

  const axes: { name: GradientAxis; label: string }[] = [
    { name: 'y', label: 'VERT' },
    { name: 'x', label: 'HORIZ' },
    { name: 'z', label: 'DEPTH' },
    { name: 'radial', label: 'RADIAL' },
  ]

  const updatePaletteColor = (idx: number, hex: string) => {
    const next = [...color.palette]
    next[idx] = hex
    onColorChange('palette', next)
  }
  const addPaletteColor = () => {
    if (color.palette.length < 8) onColorChange('palette', [...color.palette, '#ffffff'])
  }
  const removePaletteColor = (idx: number) => {
    if (color.palette.length > 1) {
      onColorChange('palette', color.palette.filter((_, i) => i !== idx))
    }
  }

  const updateGradientColor = (idx: number, hex: string) => {
    const next = [...color.gradient]
    next[idx] = hex
    onColorChange('gradient', next)
  }
  const addGradientColor = () => {
    if (color.gradient.length < 5) onColorChange('gradient', [...color.gradient, '#ffffff'])
  }
  const removeGradientColor = (idx: number) => {
    if (color.gradient.length > 2) {
      onColorChange('gradient', color.gradient.filter((_, i) => i !== idx))
    }
  }

  return (
    <Section title="◐ COLOR">
      {/* Mode selector */}
      <ButtonGroup>
        {modes.slice(0, 2).map(m => (
          <PatternButton
            key={m.name}
            label={m.label}
            active={color.mode === m.name}
            onClick={() => onColorChange('mode', m.name)}
          />
        ))}
      </ButtonGroup>
      <ButtonGroup>
        {modes.slice(2).map(m => (
          <PatternButton
            key={m.name}
            label={m.label}
            active={color.mode === m.name}
            onClick={() => onColorChange('mode', m.name)}
          />
        ))}
      </ButtonGroup>

      {/* SINGLE mode */}
      {color.mode === 'single' && (
        <div className="mt-3 flex items-center gap-2">
          <ColorSwatch color={color.single} onChange={v => onColorChange('single', v)} />
          <span className="text-[9px] text-white/50 font-mono uppercase">{color.single}</span>
        </div>
      )}

      {/* PALETTE mode */}
      {color.mode === 'palette' && (
        <div className="mt-3">
          <div className="text-[8px] text-white/35 mb-1.5">DOT COLORS (tap to edit)</div>
          <div className="flex gap-1.5 flex-wrap items-center">
            {color.palette.map((c, i) => (
              <ColorSwatch
                key={i}
                color={c}
                size="sm"
                onChange={v => updatePaletteColor(i, v)}
                onRemove={color.palette.length > 1 ? () => removePaletteColor(i) : undefined}
              />
            ))}
            {color.palette.length < 8 && (
              <button
                onClick={addPaletteColor}
                className="w-6 h-6 rounded-sm border border-dashed border-white/25 text-white/40
                  text-xs leading-none hover:border-white/50 hover:text-white/70 transition-all"
                aria-label="Add color"
              >
                +
              </button>
            )}
          </div>
          <div className="text-[8px] text-white/35 mb-1.5 mt-3">PRESETS</div>
          <div className="flex gap-1 flex-wrap">
            {COLOR_PALETTES.map(p => (
              <SwatchPreset
                key={p.name}
                colors={p.colors}
                label={p.name}
                onClick={() => onColorChange('palette', [...p.colors])}
              />
            ))}
          </div>
        </div>
      )}

      {/* GRADIENT mode */}
      {color.mode === 'gradient' && (
        <div className="mt-3">
          <div className="text-[8px] text-white/35 mb-1.5">GRADIENT STOPS</div>
          {/* Preview bar */}
          <div
            className="h-3 w-full rounded-sm border border-white/10 mb-2"
            style={{ background: `linear-gradient(90deg, ${color.gradient.join(', ')})` }}
          />
          <div className="flex gap-1.5 flex-wrap items-center">
            {color.gradient.map((c, i) => (
              <ColorSwatch
                key={i}
                color={c}
                size="sm"
                onChange={v => updateGradientColor(i, v)}
                onRemove={color.gradient.length > 2 ? () => removeGradientColor(i) : undefined}
              />
            ))}
            {color.gradient.length < 5 && (
              <button
                onClick={addGradientColor}
                className="w-6 h-6 rounded-sm border border-dashed border-white/25 text-white/40
                  text-xs leading-none hover:border-white/50 hover:text-white/70 transition-all"
                aria-label="Add stop"
              >
                +
              </button>
            )}
          </div>

          <div className="text-[8px] text-white/35 mb-1.5 mt-3">MAP ALONG AXIS</div>
          <ButtonGroup>
            {axes.map(a => (
              <PatternButton
                key={a.name}
                label={a.label}
                active={color.gradientAxis === a.name}
                onClick={() => onColorChange('gradientAxis', a.name)}
              />
            ))}
          </ButtonGroup>

          <div className="text-[8px] text-white/35 mb-1.5 mt-3">PRESETS</div>
          <div className="flex gap-1 flex-wrap">
            {COLOR_GRADIENTS.map(g => (
              <SwatchPreset
                key={g.name}
                colors={g.colors}
                label={g.name}
                gradient
                onClick={() => onColorChange('gradient', [...g.colors])}
              />
            ))}
          </div>
        </div>
      )}

      {/* Saturation (applies to all modes) */}
      <ControlRow label="Saturation" value={color.saturation.toFixed(2)}>
        <PrismSlider
          value={color.saturation * 100}
          min={0}
          max={150}
          onChange={v => onColorChange('saturation', v / 100)}
        />
      </ControlRow>
    </Section>
  )
}

// ─── Main Control Panel ───
export interface PrismControlPanelProps {
  params: PrismParameters
  onParamChange: <K extends keyof PrismParameters>(key: K, value: PrismParameters[K]) => void
  onPatternChange: (pattern: BeamPattern) => void
  onPresetApply: (presetName: string) => void
  onShapeTextChange: (text: string) => void
  onLatticeChange: <K extends keyof PrismParameters['lattice']>(key: K, value: PrismParameters['lattice'][K]) => void
  onColorChange: <K extends keyof ColorParameters>(key: K, value: ColorParameters[K]) => void
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function PrismControlPanel({
  params,
  onParamChange,
  onPatternChange,
  onPresetApply,
  onShapeTextChange,
  onLatticeChange,
  onColorChange,
  isOpen,
  onToggle,
  className,
}: PrismControlPanelProps) {
  const patterns: { name: BeamPattern; label: string }[] = [
    { name: 'dft', label: 'DFT' },
    { name: 'gabor', label: 'GABOR' },
    { name: 'helix', label: 'HELIX' },
    { name: 'sinc', label: 'SINC' },
    { name: 'fib', label: 'FIBONACCI' },
    { name: 'all', label: 'ALL ON' },
  ]

  const latticeShapes: { name: LatticeShape; label: string }[] = [
    { name: 'sphere', label: 'SPHERE' },
    { name: 'pyramid', label: 'PYRAMID' },
    { name: 'cube', label: 'CUBE' },
    { name: 'diamond', label: 'DIAMOND' },
    { name: 'star', label: 'STAR' },
  ]

  const latticeBases: { name: LatticeBase; label: string }[] = [
    { name: 'tri', label: 'TRI' },
    { name: 'quad', label: 'QUAD' },
    { name: 'hex', label: 'HEX' },
    { name: 'off', label: 'OFF' },
  ]

  return (
    <>
      {/* Toggle Button - positioned differently on mobile */}
      <button
        onClick={onToggle}
        className={cn(
          'fixed z-[101]',
          'bg-white/5 border border-white/8 cursor-pointer',
          'flex items-center justify-center text-white/60',
          'hover:bg-white/10 transition-all',
          // Desktop: right edge, vertical
          'md:top-1/2 md:-translate-y-1/2 md:w-5 md:h-[50px] md:border-r-0 md:rounded-l-sm md:text-[10px]',
          isOpen ? 'md:right-[300px]' : 'md:right-0',
          // Mobile: bottom center, horizontal pill
          'bottom-4 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:translate-x-0',
          'w-16 h-10 rounded-full text-xs md:w-5 md:h-[50px] md:rounded-l-sm md:rounded-r-none',
          'border-b md:border-b'
        )}
      >
        <span className="md:hidden">{isOpen ? 'CLOSE' : 'CTRL'}</span>
        <span className="hidden md:inline">{isOpen ? '▶' : '◀'}</span>
      </button>

      {/* Panel - full screen slide-up on mobile, right sidebar on desktop */}
      <div
        className={cn(
          'fixed z-[100] bg-black/94 border-white/8 overflow-y-auto',
          'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent',
          'font-mono text-[#ddd] select-none transition-transform duration-300',
          // Desktop: right sidebar (clear the mobile left:0 from inset-x-0)
          'md:left-auto md:right-0 md:top-0 md:w-[300px] md:h-screen md:border-l md:p-3.5',
          !isOpen && 'md:translate-x-full',
          // Mobile: bottom sheet (80% height)
          'inset-x-0 bottom-0 h-[80vh] md:h-screen rounded-t-2xl md:rounded-none border-t md:border-t-0 p-4 md:p-3.5',
          !isOpen && 'translate-y-full md:translate-y-0',
          className
        )}
      >
        {/* Header */}
        <div
          className="text-xs tracking-[4px] text-center mb-1 font-bold"
          style={{
            background: 'linear-gradient(90deg,#f0f,#ff0,#0ff,#0f0,#f0f)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          THE BEAUTIFUL NECESSITY
        </div>
        <div className="text-[8px] text-white/30 text-center tracking-[2px] mb-3.5">
          THE FIELD PERCEPTIONIST
        </div>

        {/* POV Shape — CPU (FractalDot) mode only; GPU field has no glyph projection */}
        {!params.gpuMode && (
          <Section title="◇ POV SHAPE FORMATION">
            <input
              type="text"
              value={params.shapeTxt}
              onChange={e => onShapeTextChange(e.target.value)}
              placeholder="TYPE TO FORM (e.g. CAT)"
              maxLength={8}
              spellCheck={false}
              className="w-full bg-white/6 border border-white/15 text-white font-mono text-xs p-2
                rounded-sm text-center tracking-[2px] mt-1.5 outline-none focus:border-white/40
                placeholder:text-white/20"
            />
            <ControlRow label="POV Persistence (τ)" value={params.tau.toFixed(2)}>
              <PrismSlider
                value={params.tau * 100}
                min={1}
                max={60}
                onChange={v => onParamChange('tau', v / 100)}
              />
            </ControlRow>
            <ControlRow label="Shape Scale" value={params.shapeScale.toFixed(1)}>
              <PrismSlider
                value={params.shapeScale * 10}
                min={2}
                max={30}
                onChange={v => onParamChange('shapeScale', v / 10)}
              />
            </ControlRow>
          </Section>
        )}

        {/* THE FIELD — GPU tier */}
        <Section title="⌁ THE FIELD · GPU">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[9px] text-white/50">GPU Mode (30k nodes)</label>
            <button
              onClick={() => onParamChange('gpuMode', !params.gpuMode)}
              className={cn(
                'px-3 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                params.gpuMode
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white/4 border-white/10 text-white/40'
              )}
            >
              {params.gpuMode ? 'ON' : 'OFF'}
            </button>
          </div>

          {params.gpuMode && (
            <>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] text-white/50">Prism (Floyd)</label>
                <button
                  onClick={() => onParamChange('gpuPrism', !params.gpuPrism)}
                  className={cn(
                    'px-3 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                    params.gpuPrism
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/4 border-white/10 text-white/40'
                  )}
                >
                  {params.gpuPrism ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] text-white/50">Bidirectional (conjugate pair)</label>
                <button
                  onClick={() => onParamChange('counter', !params.counter)}
                  className={cn(
                    'px-3 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                    params.counter
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/4 border-white/10 text-white/40'
                  )}
                >
                  {params.counter ? 'ON' : 'OFF'}
                </button>
              </div>
              <ControlRow label="Reality Warp" value={params.gpuWarp.toFixed(2)}>
                <PrismSlider
                  value={params.gpuWarp * 100}
                  min={0}
                  max={60}
                  onChange={v => onParamChange('gpuWarp', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Hue Drift" value={params.gpuHue.toFixed(3)}>
                <PrismSlider
                  value={params.gpuHue * 1000}
                  min={0}
                  max={200}
                  onChange={v => onParamChange('gpuHue', v / 1000)}
                />
              </ControlRow>
              <ControlRow label="Spin" value={params.gpuSpin.toFixed(1)}>
                <PrismSlider
                  value={params.gpuSpin * 10}
                  min={0}
                  max={30}
                  onChange={v => onParamChange('gpuSpin', v / 10)}
                />
              </ControlRow>

              {/* Shared params that DO drive the GPU field render */}
              <div className="text-[8px] text-white/35 mb-1.5 mt-3">FIELD DYNAMICS</div>
              <ControlRow label="Interference k" value={params.harmK}>
                <PrismSlider
                  value={params.harmK}
                  min={1}
                  max={32}
                  onChange={v => onParamChange('harmK', v)}
                />
              </ControlRow>
              <ControlRow label="Wave Velocity" value={params.phaseV.toFixed(1)}>
                <PrismSlider
                  value={params.phaseV * 10}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('phaseV', v / 10)}
                />
              </ControlRow>
              <ControlRow label="Node Size" value={params.dr.toFixed(1)}>
                <PrismSlider
                  value={params.dr * 10}
                  min={5}
                  max={80}
                  onChange={v => onParamChange('dr', v / 10)}
                />
              </ControlRow>
              <ControlRow label="Prism Intensity" value={params.prismInt.toFixed(1)}>
                <PrismSlider
                  value={params.prismInt * 10}
                  min={1}
                  max={30}
                  onChange={v => onParamChange('prismInt', v / 10)}
                />
              </ControlRow>
            </>
          )}
        </Section>

        {/* CPU (FractalDot) mode controls — these drive the CPU node loop, which is
            bypassed in GPU mode, so they are hidden while THE FIELD/PRISM run */}
        {!params.gpuMode && (
          <>
            {/* Color Mode */}
            <ColorSection color={params.color} onColorChange={onColorChange} />

            {/* Lattice Mode */}
            <Section title="◆ LATTICE MODE">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] text-white/50">Enable Lattice</label>
                <button
                  onClick={() => onLatticeChange('enabled', !params.lattice.enabled)}
                  className={cn(
                    'px-3 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                    params.lattice.enabled
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/4 border-white/10 text-white/40'
                  )}
                >
                  {params.lattice.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {params.lattice.enabled && (
                <>
                  <div className="text-[8px] text-white/35 mb-1.5">SHAPE</div>
                  <ButtonGroup>
                    {latticeShapes.slice(0, 3).map(s => (
                      <PatternButton
                        key={s.name}
                        label={s.label}
                        active={params.lattice.shape === s.name}
                        onClick={() => onLatticeChange('shape', s.name)}
                      />
                    ))}
                  </ButtonGroup>
                  <ButtonGroup>
                    {latticeShapes.slice(3).map(s => (
                      <PatternButton
                        key={s.name}
                        label={s.label}
                        active={params.lattice.shape === s.name}
                        onClick={() => onLatticeChange('shape', s.name)}
                      />
                    ))}
                  </ButtonGroup>

                  <div className="text-[8px] text-white/35 mb-1.5 mt-3">BASE POLYGON</div>
                  <ButtonGroup>
                    {latticeBases.map(b => (
                      <PatternButton
                        key={b.name}
                        label={b.label}
                        active={params.lattice.base === b.name}
                        onClick={() => onLatticeChange('base', b.name)}
                      />
                    ))}
                  </ButtonGroup>

                  <ControlRow label="Shells" value={params.lattice.shells}>
                    <PrismSlider
                      value={params.lattice.shells}
                      min={4}
                      max={32}
                      onChange={v => onLatticeChange('shells', v)}
                    />
                  </ControlRow>
                  <ControlRow label="Edge Width" value={params.lattice.edgeWidth.toFixed(1)}>
                    <PrismSlider
                      value={params.lattice.edgeWidth * 10}
                      min={5}
                      max={50}
                      onChange={v => onLatticeChange('edgeWidth', v / 10)}
                    />
                  </ControlRow>
                  <ControlRow label="Edge Opacity" value={params.lattice.edgeOpacity.toFixed(2)}>
                    <PrismSlider
                      value={params.lattice.edgeOpacity * 100}
                      min={10}
                      max={100}
                      onChange={v => onLatticeChange('edgeOpacity', v / 100)}
                    />
                  </ControlRow>
                  <ControlRow label="Inner Glow" value={params.lattice.innerGlow.toFixed(1)}>
                    <PrismSlider
                      value={params.lattice.innerGlow * 10}
                      min={0}
                      max={10}
                      onChange={v => onLatticeChange('innerGlow', v / 10)}
                    />
                  </ControlRow>
                </>
              )}
            </Section>

            {/* Prism */}
            <Section title="◈ CENTRAL PRISM">
              {params.color.mode !== 'spectrum' && (
                <div className="text-[8px] text-white/35 mb-1.5 leading-relaxed">
                  Refraction & Dispersion shape the SPECTRUM coloring — switch Color
                  mode to Spectrum to see them bend the light.
                </div>
              )}
              <ControlRow label="Refraction Index" value={params.refIdx.toFixed(2)}>
                <PrismSlider
                  value={params.refIdx * 100}
                  min={100}
                  max={250}
                  onChange={v => onParamChange('refIdx', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Dispersion" value={params.dispersion.toFixed(2)}>
                <PrismSlider
                  value={params.dispersion * 100}
                  min={1}
                  max={20}
                  onChange={v => onParamChange('dispersion', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Prism Intensity" value={params.prismInt.toFixed(1)}>
                <PrismSlider
                  value={params.prismInt * 10}
                  min={1}
                  max={30}
                  onChange={v => onParamChange('prismInt', v / 10)}
                />
              </ControlRow>
            </Section>

            {/* Rotation */}
            <Section title="⟳ RODRIGUES ROTATION">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] text-white/50">Bidirectional (conjugate pair)</label>
                <button
                  onClick={() => onParamChange('counter', !params.counter)}
                  className={cn(
                    'px-3 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                    params.counter
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/4 border-white/10 text-white/40'
                  )}
                >
                  {params.counter ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] text-white/50">Chamber (369 tetractys)</label>
                <button
                  onClick={() => onParamChange('chamber', !params.chamber)}
                  className={cn(
                    'px-3 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                    params.chamber
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/4 border-white/10 text-white/40'
                  )}
                >
                  {params.chamber ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] text-white/50">Vortex Pump (weave)</label>
                <button
                  onClick={() => onParamChange('pump', !params.pump)}
                  className={cn(
                    'px-3 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                    params.pump
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/4 border-white/10 text-white/40'
                  )}
                >
                  {params.pump ? 'ON' : 'OFF'}
                </button>
              </div>
              <ControlRow label="ωx" value={params.rx.toFixed(1)}>
                <PrismSlider
                  value={params.rx * 100}
                  min={0}
                  max={300}
                  onChange={v => onParamChange('rx', v / 100)}
                />
              </ControlRow>
              <ControlRow label="ωy" value={params.ry.toFixed(1)}>
                <PrismSlider
                  value={params.ry * 100}
                  min={0}
                  max={300}
                  onChange={v => onParamChange('ry', v / 100)}
                />
              </ControlRow>
              <ControlRow label="ωz" value={params.rz.toFixed(1)}>
                <PrismSlider
                  value={params.rz * 100}
                  min={0}
                  max={300}
                  onChange={v => onParamChange('rz', v / 100)}
                />
              </ControlRow>
            </Section>
            <Section title="⚖ THE LAWS · BEAUTIFUL NECESSITY">
              <ControlRow label="Polarity (Yo·In)" value={params.lawPolarity.toFixed(2)}>
                <PrismSlider
                  value={params.lawPolarity * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawPolarity', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Trinity" value={params.lawTrinity.toFixed(2)}>
                <PrismSlider
                  value={params.lawTrinity * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawTrinity', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Consonance" value={params.lawConsonance.toFixed(2)}>
                <PrismSlider
                  value={params.lawConsonance * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawConsonance', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Diversity" value={params.lawDiversity.toFixed(2)}>
                <PrismSlider
                  value={params.lawDiversity * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawDiversity', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Balance" value={params.lawBalance.toFixed(2)}>
                <PrismSlider
                  value={params.lawBalance * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawBalance', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Rhythmic change" value={params.lawRhythm.toFixed(2)}>
                <PrismSlider
                  value={params.lawRhythm * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawRhythm', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Radiation" value={params.lawRadiation.toFixed(2)}>
                <PrismSlider
                  value={params.lawRadiation * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawRadiation', v / 100)}
                />
              </ControlRow>
              <ControlRow label="Vesica (temple)" value={params.lawVesica.toFixed(2)}>
                <PrismSlider
                  value={params.lawVesica * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawVesica', v / 100)}
                />
              </ControlRow>
              <div className="mt-1 mb-1">
                <label className="text-[9px] text-white/50">Latent geometry</label>
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => { onParamChange('lawLatentN', 0) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawLatentN === 0
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    OFF
                  </button>
                  <button
                    onClick={() => { onParamChange('lawLatentN', 3) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawLatentN === 3
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    3
                  </button>
                  <button
                    onClick={() => { onParamChange('lawLatentN', 4) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawLatentN === 4
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    4
                  </button>
                  <button
                    onClick={() => { onParamChange('lawLatentN', 5) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawLatentN === 5
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    5
                  </button>
                  <button
                    onClick={() => { onParamChange('lawLatentN', 6) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawLatentN === 6
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    6
                  </button>
                </div>
              </div>
              <ControlRow label="Latent amount" value={params.lawLatentAmt.toFixed(2)}>
                <PrismSlider
                  value={params.lawLatentAmt * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawLatentAmt', v / 100)}
                />
              </ControlRow>
              <div className="mt-1 mb-1">
                <label className="text-[9px] text-white/50">Frozen music (interval p:q)</label>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <button
                    onClick={() => { onParamChange('lawIntervalP', 0); onParamChange('lawIntervalQ', 0) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawIntervalP === 0
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    OFF
                  </button>
                  <button
                    onClick={() => { onParamChange('lawIntervalP', 1); onParamChange('lawIntervalQ', 2) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawIntervalP === 1 && params.lawIntervalQ === 2
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    1:2
                  </button>
                  <button
                    onClick={() => { onParamChange('lawIntervalP', 2); onParamChange('lawIntervalQ', 3) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawIntervalP === 2 && params.lawIntervalQ === 3
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    2:3
                  </button>
                  <button
                    onClick={() => { onParamChange('lawIntervalP', 3); onParamChange('lawIntervalQ', 4) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawIntervalP === 3 && params.lawIntervalQ === 4
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    3:4
                  </button>
                  <button
                    onClick={() => { onParamChange('lawIntervalP', 4); onParamChange('lawIntervalQ', 5) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawIntervalP === 4 && params.lawIntervalQ === 5
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    4:5
                  </button>
                  <button
                    onClick={() => { onParamChange('lawIntervalP', 4); onParamChange('lawIntervalQ', 7) }}
                    className={cn(
                      'px-2 py-1 text-[8px] tracking-[1px] rounded-sm border transition-all',
                      params.lawIntervalP === 4 && params.lawIntervalQ === 7
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/4 border-white/10 text-white/40'
                    )}
                  >
                    4:7
                  </button>
                </div>
              </div>
              <ControlRow label="Interval amount" value={params.lawIntervalAmt.toFixed(2)}>
                <PrismSlider
                  value={params.lawIntervalAmt * 100}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('lawIntervalAmt', v / 100)}
                />
              </ControlRow>
            </Section>


            {/* Beams */}
            <Section title="⚡ BEAM PHYSICS">
              <ControlRow label="Beam Count" value={params.bc}>
                <PrismSlider
                  value={params.bc}
                  min={0}
                  max={1000}
                  step={10}
                  onChange={v => onParamChange('bc', v)}
                />
              </ControlRow>
              <ControlRow label="Beam Width" value={params.bw.toFixed(1)}>
                <PrismSlider
                  value={params.bw * 10}
                  min={1}
                  max={50}
                  onChange={v => onParamChange('bw', v / 10)}
                />
              </ControlRow>
              <ControlRow label="Beam Opacity" value={params.bo.toFixed(2)}>
                <PrismSlider
                  value={params.bo * 100}
                  min={5}
                  max={100}
                  onChange={v => onParamChange('bo', v / 100)}
                />
              </ControlRow>
            </Section>

            {/* DFT Pattern */}
            <Section title="∿ DFT BEAM PATTERN">
              <ButtonGroup>
                {patterns.slice(0, 3).map(p => (
                  <PatternButton
                    key={p.name}
                    label={p.label}
                    active={params.pattern === p.name}
                    onClick={() => onPatternChange(p.name)}
                  />
                ))}
              </ButtonGroup>
              <ButtonGroup>
                {patterns.slice(3).map(p => (
                  <PatternButton
                    key={p.name}
                    label={p.label}
                    active={params.pattern === p.name}
                    onClick={() => onPatternChange(p.name)}
                  />
                ))}
              </ButtonGroup>
              <ControlRow label="Harmonic k" value={params.harmK}>
                <PrismSlider
                  value={params.harmK}
                  min={1}
                  max={32}
                  onChange={v => onParamChange('harmK', v)}
                />
              </ControlRow>
              <ControlRow label="Phase Velocity" value={params.phaseV.toFixed(1)}>
                <PrismSlider
                  value={params.phaseV * 10}
                  min={0}
                  max={100}
                  onChange={v => onParamChange('phaseV', v / 10)}
                />
              </ControlRow>
            </Section>

            {/* Dots */}
            <Section title="● NODE PHYSICS">
              <ControlRow label="Dot Radius" value={params.dr.toFixed(1)}>
                <PrismSlider
                  value={params.dr * 10}
                  min={5}
                  max={80}
                  onChange={v => onParamChange('dr', v / 10)}
                />
              </ControlRow>
              <ControlRow label="Glow Radius" value={params.gr}>
                <PrismSlider
                  value={params.gr}
                  min={0}
                  max={40}
                  onChange={v => onParamChange('gr', v)}
                />
              </ControlRow>
              <ControlRow label="Breathing Amp" value={params.ba.toFixed(2)}>
                <PrismSlider
                  value={params.ba * 100}
                  min={0}
                  max={20}
                  onChange={v => onParamChange('ba', v / 100)}
                />
              </ControlRow>
            </Section>
          </>
        )}

        {/* Presets */}
        <Section title="★ PRESETS">
          <ButtonGroup>
            {PRESETS.slice(0, 3).map(p => (
              <PatternButton key={p.name} label={p.label} onClick={() => onPresetApply(p.name)} />
            ))}
          </ButtonGroup>
          <ButtonGroup>
            {PRESETS.slice(3).map(p => (
              <PatternButton key={p.name} label={p.label} onClick={() => onPresetApply(p.name)} />
            ))}
          </ButtonGroup>
        </Section>
      </div>
    </>
  )
}
