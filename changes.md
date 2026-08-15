# Bidirectional flux — the conjugate pair

One new parameter, `counter: boolean`, wired through both render tiers. Off by default; nothing changes until the toggle is on.

## What it does

Splits the field into two interleaved populations, one riding `R(+ωt)`, the other `R(−ωt)` — same lattice, opposite hands. Form renders as the standing agreement of two opposed currents: turn it on, spin up, and watch what holds.

## Where it lives

- `lib/prism-engine/types.ts` — `counter: boolean` added to `PrismParameters`.
- `lib/prism-engine/constants.ts` — defaults `counter: false`.
- `hooks/use-three-engine.ts` — DISCO/CPU path: odd Fibonacci indices get the sign-flipped Rodrigues rotation (`arx·dir, ary·dir, arz·dir`, `dir = −1` for odd `idx`). Index parity on the golden-angle lattice interleaves the two populations evenly over the sphere. Disabled while static or volumetric (the lattice-shell + text-wrap path keeps its single frame for now — counter-rotating shells are a clean follow-up).
- `lib/prism-engine/three-renderer.ts` — THE FIELD/GPU path: new `uCounter` uniform; the vertex shader flips spin sign for half the 30,000 nodes by seed (`aSeed < 0.5 → sdir = −1`). Synced per-frame from `params.counter`.
- `components/prism-engine/prism-control-panel.tsx` — `Bidirectional (conjugate pair)` toggle in both the ⟳ Rodrigues Rotation section (disco) and ⌁ The Field · GPU section, in the house ON/OFF button idiom.
- `README.md` — documented under Controls.

## The demo that matters

DISCO mode → pattern `HELIX` (`F_even + F_odd = 0`) → Bidirectional ON → raise ωy. The helix pattern already runs two strands π apart; now the substrate itself runs two ways. Two opposed currents, one body, and the pattern is what they agree on.

All touched files pass esbuild syntax checks. No dependencies added, no behavior changed while the toggle is off.


# CHAMBER — the architecture, rendered

New parameter `chamber: boolean` (default off), toggle labeled `Chamber (369 tetractys)` in the ⟳ Rodrigues Rotation section. Works in both DISCO and THE FIELD.

What it draws, and what each piece is:

- **Two dual tetrahedra** (circumradius 1.6, caging the node sphere), one warm, one cool, counter-rotating on a shared axis — `R(+ωt)` and `R(−ωt)`, rate seeded by ωy. The conjugate pair as architecture.
- **Tetractys sequencer**: every face carries the ten points (rows 1-2-3-4, apex→base). The activation sequence is the cycle **3 6 9 18 36 18 9 6** at 4 steps/s — each step lights point `n` on all four faces with intensity `value/36`, decaying as `e^(−dt/0.35)`. The points never move; the wave is the sequence. The upright tetra runs apex→base; the inverted runs base→apex — the forward and backward pulse.
- **Anchoring spheres** at all eight vertices, pulsing with the live cycle value.
- **The void**: the central octahedron is deliberately unrendered, and while the chamber runs the prism core is extinguished (`prismMesh.visible = false`). The center is not a light; the light is the projection of the whole.

Full stack demo: DISCO → Helix → Bidirectional ON → **Chamber ON** → raise ωy. Substrate counter-rotates, cage counter-rotates, chant steps the faces, core stays dark.

Files: `three-renderer.ts` (ChamberRig + createChamberRig/updateChamber + wiring in both render branches), `types.ts`, `constants.ts`, `prism-control-panel.tsx`. All pass esbuild.


# THE LAWS — every law of The Beautiful Necessity as a field operator

New module `lib/prism-engine/laws.ts` + a full sidebar section (⚖ THE LAWS · BEAUTIFUL NECESSITY, in the disco panel below Rodrigues Rotation). Thirteen flat params, all default off. The intensity laws multiply the beam field — set Pattern to ALL to see any law pure. The color laws ride every mode; Latent Geometry moves the nodes themselves.

| Law | Plate | Operator |
|---|---|---|
| Unity & Polarity | the Yo/In rose windows | warm north / cool south color split, seam at the equator |
| Trinity | "in every duality a third is latent" | gold band born exactly at the meeting plane |
| Consonance | the colonial bedspread | the same motif nested at 3φ inside 9φ — as is the small, so is the great |
| Diversity in Monotony | Temple of Apollo bases | one law for all nodes, each with its own seeded variation |
| Balance | bilateral plates | folds the field's longitude — full slider = perfect bilateral symmetry |
| Rhythmic Change | entasis, wave-band, shell | a loxodrome — the equiangular spiral on the sphere, the shell's own curve |
| Radiation | leaf veins, Last Supper, antefix | rays from the pole; with Rhythmic Change up, the two together are the peacock plate |
| The Bodily Temple | vesica piscis / Chartres | two spherical caps, separation = radius; the lens and its edge rings light |
| Latent Geometry | hexagram in nature, the plans | the node cloud condenses onto N great meridians — 3, 4, 5, 6 |
| Frozen Music | Architecture as Harmony | two azimuthal waves at an exact interval — 1:2, 2:3, 3:4, 4:5, 4:7 — the window ratios as interference |

Wiring: `types.ts` (13 params), `constants.ts` (defaults), `use-three-engine.ts` (latent snap after rotation; color laws after resolveNodeColor; lawsField multiplying the pattern input), `prism-control-panel.tsx` (8 sliders + latent buttons + interval buttons). CPU/disco path; all files pass esbuild.


# PUMP — fluid dynamics as light

New parameter `pump: boolean`, toggle `Pump (Jerry's weave)` under Chamber. Renders the pump as built: six strands of each hand on one cylinder (6+6, two full turns), counter-rotating at `R(+ωt)` / `R(−ωt)`; hexagonal flanges top and bottom holding still while the weave spins; funnel inlet narrowing to the throat; three shaft rods on the axis. The flow is rendered as light: 144 particles riding the strand paths — the warm family ascending, the cool family descending — two opposed streams threading one cage, inheriting the counter-rotation. Kinematic streamlines (light as the working fluid), not a Navier–Stokes solve. The prism core stays extinguished while pump or chamber runs — the axis keeps its void. Flow and spin rates seed from ωy. Composable with Helix, Bidirectional, Chamber, and all Laws.
