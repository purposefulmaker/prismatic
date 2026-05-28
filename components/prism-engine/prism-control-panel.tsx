'use client'

import { cn } from '@/lib/utils'
import type { BeamPattern, PrismParameters, LatticeBase, LatticeShape } from '@/lib/prism-engine'
import { PRESETS } from '@/lib/prism-engine'

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

// ─── Main Control Panel ───
export interface PrismControlPanelProps {
  params: PrismParameters
  onParamChange: <K extends keyof PrismParameters>(key: K, value: PrismParameters[K]) => void
  onPatternChange: (pattern: BeamPattern) => void
  onPresetApply: (presetName: string) => void
  onShapeTextChange: (text: string) => void
  onLatticeChange: <K extends keyof PrismParameters['lattice']>(key: K, value: PrismParameters['lattice'][K]) => void
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
    { name: 'v0', label: 'v0' },
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
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 w-5 h-[50px] z-[101]',
          'bg-white/5 border border-white/8 border-r-0 rounded-l-sm',
          'cursor-pointer flex items-center justify-center text-[10px] text-white/60',
          'hover:bg-white/10 transition-all',
          isOpen ? 'right-[300px]' : 'right-0'
        )}
      >
        {isOpen ? '▶' : '◀'}
      </button>

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 w-[300px] h-screen z-[100]',
          'bg-black/94 border-l border-white/8 p-3.5 overflow-y-auto',
          'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent',
          'font-mono text-[#ddd] select-none transition-transform duration-300',
          !isOpen && 'translate-x-full',
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
          MATH DISCO ENGINE
        </div>
        <div className="text-[8px] text-white/30 text-center tracking-[2px] mb-3.5">
          PRISMATIC POV
        </div>

        {/* POV Shape */}
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
