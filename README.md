# The Beautiful Necessity

**The Field Perceptionist presents** — a real-time prismatic physics engine that renders a field of light as a rotating Fibonacci lattice, decomposing a single white beam into the full spectrum through simulated optical dispersion.

> Seeing the field · Feeling the field · Being the field
> _All signals return home._

Built with Next.js 16, React 19, Three.js (WebGL), and Tailwind CSS v4.

---

## What it is

The Beautiful Necessity is an interactive visual instrument. Points of light are placed on a sphere using the Fibonacci golden-angle distribution, then lit by traveling interference patterns and colored by wavelength through a simulated prism. Everything you see is driven by actual physics equations, not decorative noise:

- **Wavelength → RGB** across the 380–700 nm visible spectrum (CIE-style piecewise approximation)
- **Cauchy dispersion** — refraction index varies with wavelength, `n(λ) = A + B/λ²`
- **Snell's law** refraction angles, with total-internal-reflection handling
- **Rodrigues rotation** for smooth 3D rotation about arbitrary axes
- **DFT / Gabor / Sinc / Helix / Fibonacci** beam-selection patterns
- **POV persistence** — exponential intensity decay, `V(t) = V·e^(−dt/τ) + input·(1−e^(−dt/τ))`

## The three modes

| Mode | Renderer | What happens |
|------|----------|--------------|
| **THE FIELD** | GPU (WebGL shader) | 30,000 nodes with all warp, rotation, color, and interference math computed per-node in the vertex shader — zero CPU node loop. |
| **PRISM** | GPU (WebGL shader) | Pink Floyd mode: a single white beam enters the prism and fans out into the spectrum across the mesh. Pure dispersion. |
| **FractalDot** | CPU (Three.js points) | The classic path — ~1,600 nodes with full control over color modes, volumetric lattice shells, beam physics, and DFT patterns. |

The control panel is **mode-aware**: it only shows the sliders that actually drive the active renderer, so every visible control produces a visible change.

## Controls

**Field / GPU** — Reality Warp, Hue Drift, Spin, Interference k, Wave Velocity, Node Size, Prism Intensity.

**Central Prism** — Refraction Index and Dispersion shape the spectral coloring (visible in **Spectrum** color mode); Prism Intensity always applies.

**Lattice Mode** — Shape (Sphere / Pyramid / Cube / Diamond / Star), Base Polygon (Tri / Quad / Hex), Shells, Edge Width, Edge Opacity, Inner Glow. Builds concentric volumetric shells connected by lit edges.

**Beam Physics / DFT** — Beam Count, Width, Opacity, and pattern selection (DFT, Gabor, Helix, Sinc, Fibonacci, All).

**Bidirectional (conjugate pair)** — splits the field into two interleaved populations riding `R(+ωt)` and `R(−ωt)`. In FractalDot it flips half the Fibonacci lattice's Rodrigues rotation by index parity; in THE FIELD it flips half the 30,000 GPU nodes by seed. Run it with the Helix pattern (`F_even + F_odd = 0`) and the render becomes the standing agreement of two opposed currents — form held while both flows pour through it.

## Project structure

```
app/
  layout.tsx              Metadata, fonts, root layout
  page.tsx                Mounts the engine
  icon.png                Favicon (mandala)
components/prism-engine/
  nothingburger-engine.tsx  Top-level component: canvas + hero overlay + panel
  prism-control-panel.tsx   Mode-aware control panel
hooks/
  use-three-engine.ts     RAF loop, node build, mask upload, param plumbing
lib/prism-engine/
  physics.ts              Fibonacci sphere, dispersion, Snell, Rodrigues, DFT, POV
  three-renderer.ts       Active WebGL renderer (GPU + CPU point paths, shaders)
  renderer.ts             Legacy Canvas2D renderer (reference)
  lattice.ts              Volumetric shells, SDF shapes, edge building
  color.ts                Wavelength/spectrum/palette/gradient color resolution
  shape-mask.ts           Text → node mask
  constants.ts            Presets, defaults, golden ratio
  types.ts                PrismParameters, PrismNode, EngineState
```

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
pnpm build   # production build
pnpm start   # serve the build
pnpm lint    # eslint
```

## Tech

- **Next.js 16** (App Router) · **React 19**
- **Three.js** ~0.184 for the WebGL render path, with custom GLSL vertex/fragment shaders
- **Tailwind CSS v4** with a dark, monospace, spectral theme
- **TypeScript** throughout

## Notes

- The engine renders across the full canvas and uses `camera.setViewOffset()` to bias the optical center into the visible region, so the field stays centered whether the control panel is open or closed, at any device pixel ratio.
- On mobile the control panel becomes a bottom sheet and the field uses the full width.
