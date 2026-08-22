// ═══════════════════════════════════════════════════════════════
// HEALING MODE — Guided Energetic Practices
// The Egg & The Turtle · driven by the prism physics engine
//
// Instead of a stick figure in a sphere, the living prism field IS the
// guide: each step maps to a prism-engine configuration (color, geometry,
// motion) via `visualToParams`, and breath steps drive the sphere to
// breathe in lockstep with the user (see hooks/use-healing-session.ts).
// ═══════════════════════════════════════════════════════════════

import type {
  PrismParameters,
  ColorParameters,
  LatticeParameters,
  HealingRegion,
} from '@/lib/prism-engine'
import { DEFAULT_COLOR, DEFAULT_LATTICE } from '@/lib/prism-engine'

export type HealingMode = 'egg' | 'turtle' | 'layered' | 'cord'

export interface HealingStep {
  /** Short ritual label (e.g. "Ground", "Build the Egg") */
  label: string
  /** Primary instruction shown to the practitioner */
  main: string
  /** Secondary, italic supporting line */
  detail: string
  /** Spoken invocation (quoted). Empty when the step has none. */
  speak: string
  /** Number of guided breath cycles (0 = no breath gate) */
  breath: number
  /** Auto-advance gate in ms (0 = advance immediately / on click) */
  duration: number
  /** Visual key → drives the prism engine (see visualToParams) */
  visual: string
}

export interface PracticeMeta {
  mode: HealingMode
  numeral: string
  title: string
  desc: string
  time: string
}

// ─── PRACTICE CARD METADATA (landing) ───
export const PRACTICE_META: PracticeMeta[] = [
  {
    mode: 'egg',
    numeral: 'I',
    title: 'The Luminous Egg',
    desc: 'Daily shield. Build your semi-permeable boundary of light. Filters harm, passes love. Use every morning.',
    time: '~3 minutes',
  },
  {
    mode: 'turtle',
    numeral: 'II',
    title: 'The Turtle Shell',
    desc: 'Active withdrawal. Pull your receptors inside. Roots down into earth, shell forms around you. Use when something is incoming.',
    time: '~3 minutes',
  },
  {
    mode: 'layered',
    numeral: 'III',
    title: 'Layered Defense',
    desc: 'Full architecture. Egg outside, shell inside, roots below, Christ-light above. Defense in depth. Use before spiritual work.',
    time: '~5 minutes',
  },
  {
    mode: 'cord',
    numeral: 'IV',
    title: 'Cord Severance',
    desc: 'Identify, acknowledge, dissolve, seal. Remove energetic attachments not ordained by the Father. Use when you feel pulled.',
    time: '~5 minutes',
  },
]

// ─── PRACTICE STEP DEFINITIONS (preserved verbatim) ───
export const PRACTICES: Record<HealingMode, HealingStep[]> = {
  egg: [
    {
      label: 'Ground',
      main: 'Place your feet flat on the floor. Feel the weight of your body. Feel gravity holding you.',
      detail: 'You are here. You are physical. You are real.',
      speak: '',
      breath: 0,
      duration: 8000,
      visual: 'ground',
    },
    {
      label: 'Breathe',
  main: 'Close your eyes. In through the nose for 4. Hold full for 4. Out through the mouth for 6. Rest empty for 2.',
  detail: 'Four rounds of the Golden Egg Breath. All four beats — the rest at the bottom matters as much as the breath in.',
      speak: '',
      breath: 4,
      duration: 0,
      visual: 'breathe',
    },
    {
      label: 'Invoke',
      main: 'Say this aloud or in your spirit — three times:',
      detail: 'The triple invocation seals the space. Nothing uninvited enters after the third declaration.',
      speak: '"In the name of Jesus Christ, I claim sovereignty over my energy, my field, and my body."',
      breath: 0,
      duration: 15000,
      visual: 'invoke',
    },
    {
      label: 'Build the Egg',
      main: 'Visualize a sphere of warm golden light forming 6 inches above your head. It streams downward — around your skull, your shoulders, your chest, your hips, your legs — and seals 6 inches below your feet.',
      detail: 'See it as a luminous egg. It pulses gently with your heartbeat.',
      speak: '',
      breath: 0,
      duration: 15000,
      visual: 'egg-build',
    },
    {
      label: 'Set the Mirror',
      main: 'The outer surface of the egg becomes reflective — like polished gold. Anything directed at you that is not love reflects back to sender, already transmuted. Not as attack. As return to origin.',
      detail: 'The inside stays warm. Soft. Yours.',
      speak: '',
      breath: 0,
      duration: 12000,
      visual: 'egg-mirror',
    },
    {
      label: 'Set Permeability',
      main: 'Now set the intention: this membrane passes love, truth, and what serves your highest good. Everything else reflects.',
      detail: 'Say this aloud:',
      speak: '"Only what is ordained by the Father passes through. I receive love. I give love. All else returns to source."',
      breath: 0,
      duration: 14000,
      visual: 'egg-perm',
    },
    {
      label: 'Seal',
      main: 'Take one deep breath. On the exhale, feel the egg solidify — not rigid, but alive. It breathes with you. It goes where you go.',
      detail: 'Open your eyes when ready. Your shield is active.',
      speak: '',
      breath: 1,
      duration: 0,
      visual: 'egg-seal',
    },
    {
      label: 'Complete',
      main: 'The Egg is set. It will hold for 8–12 hours in a peaceful environment. Refresh after stressful interactions or crowded spaces.',
      detail: 'This is your daily default. Every morning before you engage with the world.',
      speak: '',
      breath: 0,
      duration: 0,
      visual: 'egg-complete',
    },
  ],

  turtle: [
    {
      label: 'Ground',
      main: 'Sit or stand. Feel gravity. Feel the floor beneath you. You are here.',
      detail: 'The turtle begins on the earth. It never leaves the earth.',
      speak: '',
      breath: 0,
      duration: 7000,
      visual: 'ground',
    },
    {
      label: 'Breathe',
  main: 'Slow your breath. In through the nose for 4. Hold full for 4. Out through the mouth for 6. Rest empty for 2.',
  detail: '3 rounds. Slow down. The turtle does not rush — especially not through the stillness at the bottom.',
      speak: '',
      breath: 3,
      duration: 0,
      visual: 'breathe',
    },
    {
      label: 'Send Roots',
      main: 'Visualize roots growing from the base of your spine and the soles of your feet — down through the floor, through the foundation, into the soil, down into stone, into the deep earth.',
      detail: 'Feel them anchor. They hold you. Nothing can pull what is rooted.',
      speak: '',
      breath: 0,
      duration: 14000,
      visual: 'roots',
    },
    {
      label: 'Form the Shell',
      main: 'Now feel a hard protective dome forming over your back, your shoulders, curving over your head. It is bone. It is earth. It is part of you — not something external. You grew it.',
      detail: 'The shell is hexagonal — sacred geometry in nature. Each plate interlocks.',
      speak: '',
      breath: 0,
      duration: 14000,
      visual: 'shell-form',
    },
    {
      label: 'Withdraw',
      main: 'Pull your awareness inside. Your eyes close inward. Your hearing softens. Your sensing — all of it — comes home to the center of your chest.',
      detail: 'You are not shutting down. You are choosing not to receive. The passive radar goes quiet. You are safe inside.',
      speak: '',
      breath: 0,
      duration: 14000,
      visual: 'withdraw',
    },
    {
      label: 'Declare',
      main: 'Say this — once, from inside the shell:',
      detail: 'This is not defense. This is sovereignty. You choose what enters.',
      speak: '"I withdraw my receptors. I am unavailable to any signal I did not invite. I am home in my own body."',
      breath: 0,
      duration: 14000,
      visual: 'declare',
    },
    {
      label: 'Rest',
      main: 'Stay here as long as you need. The turtle does not emerge until it is safe. There is no rush.',
      detail: 'When you are ready, you will feel the shell soften — not disappear. It is always available.',
      speak: '',
      breath: 2,
      duration: 0,
      visual: 'rest',
    },
    {
      label: 'Complete',
      main: 'The shell remains. It thins but it does not leave. You can turtle up in two breaths once you have practiced this enough.',
      detail: 'Use this when you feel pulled. When something is incoming. When the moon wakes you. When you see things in breathwork that are not yours.',
      speak: '',
      breath: 0,
      duration: 0,
      visual: 'turtle-complete',
    },
  ],

  layered: [
    {
      label: 'Ground',
      main: 'Stand if you can. Feet on the floor. Arms at your sides. Close your eyes.',
      detail: 'You are about to build a full protection architecture. Three layers. Heaven to earth.',
      speak: '',
      breath: 0,
      duration: 8000,
      visual: 'ground',
    },
    {
      label: 'Breathe',
  main: 'Four rounds. Slow. In for 4. Hold full for 4. Out for 6. Rest empty for 2.',
  detail: 'Each exhale pushes tension out of the body. Each inhale draws in clean light. Each rest lets it settle.',
      speak: '',
      breath: 4,
      duration: 0,
      visual: 'breathe',
    },
    {
      label: 'Triple Invocation',
      main: 'Say three times — aloud if possible:',
      detail: 'Three times. This is not optional. The triple invocation seals the space from interference.',
      speak: '"In the name of Jesus Christ — I am sovereign. My field is my own. Only the Holy Spirit operates here."',
      breath: 0,
      duration: 18000,
      visual: 'invoke',
    },
    {
      label: 'Layer 1 — Roots',
      main: 'Send roots down first. From spine and feet, into the deep earth. This is your anchor. Nothing built above will hold without it.',
      detail: 'Feel the roots grip. You are Turtle Island. The earth carries you.',
      speak: '',
      breath: 0,
      duration: 13000,
      visual: 'roots',
    },
    {
      label: 'Layer 2 — The Shell',
      main: 'Now grow the shell. Bone and earth rising around your torso, your back, curving over. Hexagonal plates interlocking.',
      detail: 'This is your inner sanctum. The close protection. Nothing uninvited touches your body or psyche.',
      speak: '',
      breath: 0,
      duration: 13000,
      visual: 'shell-form',
    },
    {
      label: 'Layer 3 — The Egg',
      main: 'Now the outer membrane. Golden light streaming down from above — 6 inches beyond the shell in every direction. Semi-permeable. Mirrored on the outside.',
      detail: 'The egg filters the field. The shell protects the body. The roots hold the ground.',
      speak: '',
      breath: 0,
      duration: 13000,
      visual: 'egg-build',
    },
    {
      label: 'Crown — Christ Light',
      main: 'Now from above — a beam of pure white-gold light enters through the crown of your head. It fills the space between shell and egg. It fills you.',
      detail: 'This is the pneumatic layer. The Spirit of God. It does not need protection because it cannot be attacked.',
      speak: '"Greater is He that is in me than he that is in the world."',
      breath: 0,
      duration: 14000,
      visual: 'crown',
    },
    {
      label: 'Seal All Layers',
      main: 'One breath. On the exhale, all three layers lock. Roots grip. Shell hardens. Egg seals. Crown light holds.',
      detail: 'You are defended in depth. Enterprise-grade.',
      speak: '"I am rooted, shielded, sealed, and filled. In Jesus\' name. Amen."',
      breath: 1,
      duration: 0,
      visual: 'layered-seal',
    },
    {
      label: 'Complete',
      main: 'Full architecture active. Use this before any spiritual work, before sessions, before entering any space where you will be open or receptive.',
      detail: 'Defense in depth. No single point of failure.',
      speak: '',
      breath: 0,
      duration: 0,
      visual: 'layered-complete',
    },
  ],

  cord: [
    {
      label: 'Ground & Shield',
      main: 'Before cord work, you must be shielded first. If you have not done The Egg or Layered Defense today, do that first.',
      detail: 'Never do cord work unshielded. You are opening surgery on your energy body.',
      speak: '',
      breath: 0,
      duration: 10000,
      visual: 'ground',
    },
    {
      label: 'Breathe',
      main: 'Three slow breaths. Center yourself.',
      detail: 'You need to be calm and clear. Not angry. Not afraid. Neutral and sovereign.',
      speak: '',
      breath: 3,
      duration: 0,
      visual: 'breathe',
    },
    {
      label: 'Triple Invocation',
      main: 'Three times — this prevents interference from tricksters or competing energy:',
      detail: 'Three invocations. This is required. Do not skip this.',
      speak: '"In the name of Jesus Christ. In the name of Jesus Christ. In the name of Jesus Christ — I release all cords not ordained by the Father."',
      breath: 0,
      duration: 16000,
      visual: 'invoke',
    },
    {
      label: 'Scan — Head',
      main: 'Bring your attention to your head. Your third eye. Your temples. Is there a cord here? A pull? A presence that is not yours?',
      detail: 'If you see someone\'s face, feel a thought that is not your own, or feel pressure — there is a cord here. Acknowledge it.',
      speak: '"I see this connection. I honor what it taught me."',
      breath: 0,
      duration: 16000,
      visual: 'scan-head',
    },
    {
      label: 'Scan — Heart',
      main: 'Move to your chest. Your heart space. This is where soul ties attach. Is there a pull here? A longing that is not yours? A warmth that was placed, not grown?',
      detail: 'The heart is the most common attachment point. Be honest about what you find.',
      speak: '"I see this connection. I honor what it taught me."',
      breath: 0,
      duration: 16000,
      visual: 'scan-heart',
    },
    {
      label: 'Scan — Gut',
      main: 'Move to your gut. Your solar plexus. Power cords attach here — someone drawing on your energy, your motivation, your life force.',
      detail: 'If you feel drained after interactions, the cord is here.',
      speak: '"I see this connection. I honor what it taught me."',
      breath: 0,
      duration: 16000,
      visual: 'scan-gut',
    },
    {
      label: 'Dissolve',
      main: 'Now — do not rip. Do not cut with violence. Visualize each cord dissolving in golden-white light. It does not snap — it melts. It returns to source.',
      detail: 'As each cord dissolves, say:',
      speak: '"I release what no longer serves my sovereignty in Christ. I return your energy to you in love. I call my energy home."',
      breath: 0,
      duration: 18000,
      visual: 'dissolve',
    },
    {
      label: 'Seal the Void',
      main: 'THIS IS CRITICAL. Where each cord was, there is now an empty socket. Fill it immediately with Christ-light. Golden-white. Pure.',
      detail: 'Never leave a void. An empty socket will refill with the first thing that comes along.',
      speak: '"I fill this space with the light of the Holy Spirit. No cord re-attaches here without my sovereign consent."',
      breath: 0,
      duration: 16000,
      visual: 'seal',
    },
    {
      label: 'Final Breath',
      main: 'One deep breath. Feel your body lighter. Feel the space where the cords were — now filled with your own light.',
      detail: 'You are whole. You are clean. You are yours.',
      speak: '',
      breath: 1,
      duration: 0,
      visual: 'final-breath',
    },
    {
      label: 'Complete',
      main: 'Cord work done. If any cord was strong, it may attempt to re-attach in the coming days. Repeat this practice if you feel the pull return.',
      detail: 'Your actions must match your intentions — do not re-engage what you severed. The ritual is real. Treat it that way.',
      speak: '',
      breath: 0,
      duration: 0,
      visual: 'cord-complete',
    },
  ],
}

// ═══════════════════════════════════════════════════════════════
// VISUAL → PRISM ENGINE MAPPING
// Each ritual stage becomes a living prism configuration. The sacred
// palette (gold, bone, earth, spirit-violet, Christ-white, blood-red)
// is expressed through the engine's color + geometry + motion params.
// ═══════════════════════════════════════════════════════════════

// Sacred palette (mirrors the reference practice)
const GOLD = '#d4a853'
const GOLD_LIGHT = '#f0d68a'
const BONE = '#e8dcc8'
const EARTH = '#3d5a3a'
const SHELL = '#5c4a32'
const SPIRIT = '#c8b8ff'
const CHRIST = '#fff8e0'
const BLOOD = '#8b1a1a'

/** The subset of numeric params the session smoothly tweens between steps. */
export interface DriveTargets {
  prismInt: number
  gr: number
  dr: number
  bo: number
  ry: number
  ba: number
  saturation: number
}

/** The figure state a step drives: where light concentrates + which structural
 *  features (roots, turtle dome, crown beam, golden-egg aura) are present. */
export interface FigureTargets {
  region: HealingRegion
  aura: number
  roots: number
  shell: number
  crown: number
}

export interface HealingScene {
  /** Full color object (engine expects a complete ColorParameters) */
  color: ColorParameters
  /** Full lattice object (complete LatticeParameters) */
  lattice: LatticeParameters
  /** Smoothly-tweened numeric drive targets */
  drive: DriveTargets
  /** The human-figure state this step embodies */
  figure: FigureTargets
}

/**
 * Which part of the body each guidance step is speaking to, and which
 * structures are present. THIS is the feature: the dots draw a human, and the
 * gold light moves to wherever the words point — feet as you ground, head as
 * you breathe, the egg building around you as you seal it.
 */
const FIGURE_BY_VISUAL: Record<string, FigureTargets> = {
  // openings
  ground: { region: 'feet', aura: 0, roots: 0.2, shell: 0, crown: 0 },
  breathe: { region: 'head', aura: 0.15, roots: 0, shell: 0, crown: 0 },
  invoke: { region: 'whole', aura: 0.3, roots: 0, shell: 0, crown: 0.25 },
  // the egg
  'egg-build': { region: 'crown', aura: 1, roots: 0, shell: 0, crown: 0.35 },
  'egg-mirror': { region: 'whole', aura: 1, roots: 0, shell: 0, crown: 0 },
  'egg-perm': { region: 'heart', aura: 1, roots: 0, shell: 0, crown: 0 },
  'egg-seal': { region: 'whole', aura: 1, roots: 0, shell: 0, crown: 0 },
  'egg-complete': { region: 'none', aura: 1, roots: 0, shell: 0, crown: 0 },
  // the turtle
  roots: { region: 'feet', aura: 0, roots: 1, shell: 0, crown: 0 },
  'shell-form': { region: 'head', aura: 0, roots: 0.5, shell: 1, crown: 0 },
  withdraw: { region: 'heart', aura: 0, roots: 0.5, shell: 1, crown: 0 },
  declare: { region: 'heart', aura: 0, roots: 0.5, shell: 1, crown: 0 },
  rest: { region: 'core', aura: 0, roots: 0.5, shell: 1, crown: 0 },
  'turtle-complete': { region: 'none', aura: 0, roots: 0.6, shell: 1, crown: 0 },
  // layered defense
  crown: { region: 'crown', aura: 1, roots: 0.6, shell: 1, crown: 1 },
  'layered-seal': { region: 'whole', aura: 1, roots: 1, shell: 1, crown: 1 },
  'layered-complete': { region: 'none', aura: 1, roots: 0.6, shell: 0.8, crown: 0.7 },
  // cord severance
  'scan-head': { region: 'head', aura: 0.5, roots: 0, shell: 0, crown: 0 },
  'scan-heart': { region: 'heart', aura: 0.5, roots: 0, shell: 0, crown: 0 },
  'scan-gut': { region: 'core', aura: 0.5, roots: 0, shell: 0, crown: 0 },
  dissolve: { region: 'whole', aura: 0.7, roots: 0, shell: 0, crown: 0.4 },
  seal: { region: 'core', aura: 0.9, roots: 0, shell: 0, crown: 0.5 },
  'final-breath': { region: 'whole', aura: 0.9, roots: 0, shell: 0, crown: 0 },
  'cord-complete': { region: 'none', aura: 1, roots: 0, shell: 0, crown: 0 },
}

const DEFAULT_FIGURE: FigureTargets = { region: 'whole', aura: 0.5, roots: 0, shell: 0, crown: 0 }

function color(
  over: Partial<ColorParameters> & Pick<ColorParameters, 'mode'>
): ColorParameters {
  return { ...DEFAULT_COLOR, ...over }
}

function lattice(over: Partial<LatticeParameters> = {}): LatticeParameters {
  return { ...DEFAULT_LATTICE, ...over }
}

const CALM_DRIVE: DriveTargets = {
  prismInt: 0.7,
  gr: 9,
  dr: 3.2,
  bo: 0.28,
  ry: 0.1,
  ba: 0.04,
  saturation: 1,
}

/**
 * Map a step's `visual` key to a full prism scene. Unknown keys fall back to
 * the calm golden default. `visualToScene` wraps this to attach the geometric
 * form (see FORM_BY_VISUAL).
 */
function sceneBody(visual: string): Omit<HealingScene, 'figure'> {
  switch (visual) {
    // ─── Shared openings ───
    case 'ground':
      return {
        color: color({ mode: 'single', single: GOLD, saturation: 0.95 }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.5, gr: 7, dr: 3.0, bo: 0.22, ry: 0.06 },
      }
    case 'breathe':
      return {
        color: color({ mode: 'single', single: GOLD_LIGHT }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.7, gr: 9, dr: 3.2, bo: 0.26, ry: 0.08, ba: 0.05 },
      }
    case 'invoke':
      return {
        color: color({ mode: 'gradient', gradient: [GOLD, CHRIST], gradientAxis: 'radial', saturation: 1.05 }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.9, gr: 13, dr: 3.3, bo: 0.34, ry: 0.14, ba: 0.05 },
      }

    // ─── The Egg ───
    case 'egg-build':
      return {
        color: color({ mode: 'gradient', gradient: [CHRIST, GOLD, BONE], gradientAxis: 'radial' }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 1.0, gr: 14, dr: 3.6, bo: 0.4, ry: 0.16, ba: 0.06 },
      }
    case 'egg-mirror':
      return {
        color: color({ mode: 'single', single: GOLD_LIGHT, saturation: 1.2 }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 1.15, gr: 16, dr: 3.6, bo: 0.46, ry: 0.16 },
      }
    case 'egg-perm':
      return {
        color: color({ mode: 'gradient', gradient: [GOLD, SPIRIT], gradientAxis: 'radial' }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 1.0, gr: 14, dr: 3.5, bo: 0.42, ry: 0.22, ba: 0.06 },
      }
    case 'egg-seal':
      return {
        color: color({ mode: 'gradient', gradient: [CHRIST, GOLD], gradientAxis: 'radial' }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.9, gr: 13, dr: 3.4, bo: 0.38, ry: 0.12, ba: 0.05 },
      }
    case 'egg-complete':
      return {
        color: color({ mode: 'gradient', gradient: [GOLD, BONE], gradientAxis: 'radial' }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.85, gr: 12, dr: 3.4, bo: 0.36, ry: 0.1 },
      }

    // ─── The Turtle ───
    case 'roots':
      return {
        color: color({ mode: 'gradient', gradient: [GOLD, EARTH], gradientAxis: 'y' }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.7, gr: 10, dr: 3.2, bo: 0.3, ry: 0.07 },
      }
    case 'shell-form':
      return {
        // The hexagonal shell IS the lattice — sacred geometry made literal.
        color: color({ mode: 'gradient', gradient: [SHELL, EARTH], gradientAxis: 'radial' }),
        lattice: lattice({ enabled: true, base: 'hex', shape: 'sphere', shells: 7, edgeWidth: 1.4, edgeOpacity: 0.6, innerGlow: 0.5 }),
        drive: { ...CALM_DRIVE, prismInt: 0.7, gr: 9, dr: 2.8, bo: 0.3, ry: 0.1 },
      }
    case 'withdraw':
      return {
        color: color({ mode: 'single', single: EARTH, saturation: 0.9 }),
        lattice: lattice({ enabled: true, base: 'hex', shape: 'sphere', shells: 6, edgeWidth: 1.2, edgeOpacity: 0.5, innerGlow: 0.4 }),
        drive: { ...CALM_DRIVE, prismInt: 0.5, gr: 7, dr: 2.4, bo: 0.22, ry: 0.05 },
      }
    case 'declare':
      return {
        color: color({ mode: 'gradient', gradient: [EARTH, GOLD], gradientAxis: 'radial' }),
        lattice: lattice({ enabled: true, base: 'hex', shape: 'sphere', shells: 6, edgeWidth: 1.3, edgeOpacity: 0.55, innerGlow: 0.45 }),
        drive: { ...CALM_DRIVE, prismInt: 0.6, gr: 9, dr: 2.6, bo: 0.28, ry: 0.06 },
      }
    case 'rest':
      return {
        color: color({ mode: 'single', single: EARTH, saturation: 0.85 }),
        lattice: lattice({ enabled: true, base: 'hex', shape: 'sphere', shells: 6, edgeWidth: 1.2, edgeOpacity: 0.5, innerGlow: 0.4 }),
        drive: { ...CALM_DRIVE, prismInt: 0.45, gr: 6, dr: 2.4, bo: 0.2, ry: 0.04, ba: 0.04 },
      }
    case 'turtle-complete':
      return {
        color: color({ mode: 'gradient', gradient: [EARTH, GOLD], gradientAxis: 'radial' }),
        lattice: lattice({ enabled: true, base: 'hex', shape: 'sphere', shells: 7, edgeWidth: 1.3, edgeOpacity: 0.55, innerGlow: 0.5 }),
        drive: { ...CALM_DRIVE, prismInt: 0.55, gr: 8, dr: 2.6, bo: 0.26, ry: 0.06 },
      }

    // ─── Layered Defense ───
    case 'crown':
      return {
        color: color({ mode: 'gradient', gradient: [CHRIST, GOLD], gradientAxis: 'y', saturation: 1.1 }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 1.2, gr: 18, dr: 3.6, bo: 0.48, ry: 0.1, ba: 0.06 },
      }
    case 'layered-seal':
      return {
        color: color({ mode: 'gradient', gradient: [CHRIST, GOLD, SPIRIT], gradientAxis: 'radial', saturation: 1.05 }),
        lattice: lattice({ enabled: true, base: 'hex', shape: 'sphere', shells: 8, edgeWidth: 1.4, edgeOpacity: 0.6, innerGlow: 0.55 }),
        drive: { ...CALM_DRIVE, prismInt: 1.1, gr: 16, dr: 3.4, bo: 0.46, ry: 0.14 },
      }
    case 'layered-complete':
      return {
        color: color({ mode: 'gradient', gradient: [GOLD, CHRIST], gradientAxis: 'radial' }),
        lattice: lattice({ enabled: true, base: 'hex', shape: 'sphere', shells: 8, edgeWidth: 1.3, edgeOpacity: 0.55, innerGlow: 0.5 }),
        drive: { ...CALM_DRIVE, prismInt: 1.0, gr: 14, dr: 3.4, bo: 0.42, ry: 0.12 },
      }

    // ─── Cord Severance ───
    case 'scan-head':
      return {
        color: color({ mode: 'gradient', gradient: [BONE, BLOOD], gradientAxis: 'radial', saturation: 0.9 }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.5, gr: 8, dr: 2.8, bo: 0.26, ry: 0.16 },
      }
    case 'scan-heart':
      return {
        color: color({ mode: 'gradient', gradient: [BONE, BLOOD], gradientAxis: 'radial', saturation: 0.9 }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.5, gr: 8, dr: 2.8, bo: 0.26, ry: 0.11 },
      }
    case 'scan-gut':
      return {
        color: color({ mode: 'gradient', gradient: [BONE, BLOOD], gradientAxis: 'radial', saturation: 0.9 }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.5, gr: 8, dr: 2.8, bo: 0.26, ry: 0.07 },
      }
    case 'dissolve':
      return {
        color: color({ mode: 'gradient', gradient: [BLOOD, GOLD, CHRIST], gradientAxis: 'radial' }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.95, gr: 15, dr: 3.4, bo: 0.42, ry: 0.24, ba: 0.06 },
      }
    case 'seal':
      return {
        color: color({ mode: 'gradient', gradient: [CHRIST, GOLD], gradientAxis: 'radial', saturation: 1.1 }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 1.1, gr: 17, dr: 3.5, bo: 0.46, ry: 0.12 },
      }
    case 'final-breath':
      return {
        color: color({ mode: 'single', single: CHRIST }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.9, gr: 13, dr: 3.4, bo: 0.4, ry: 0.1, ba: 0.05 },
      }
    case 'cord-complete':
      return {
        color: color({ mode: 'gradient', gradient: [CHRIST, GOLD], gradientAxis: 'radial' }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE, prismInt: 0.85, gr: 12, dr: 3.3, bo: 0.38, ry: 0.1 },
      }

    default:
      return {
        color: color({ mode: 'single', single: GOLD }),
        lattice: lattice(),
        drive: { ...CALM_DRIVE },
      }
  }
}

export function visualToScene(visual: string): HealingScene {
  return { ...sceneBody(visual), figure: FIGURE_BY_VISUAL[visual] ?? DEFAULT_FIGURE }
}

/**
 * Static (non-tweened) params applied on every step so the field always stays
 * in the calm CPU dot mode with no leftover laws/flux from the explorer.
 */
export const HEALING_STATIC_PARAMS: Partial<PrismParameters> = {
  gpuMode: false,
  gpuPrism: false,
  spotlight: false,
  counter: false,
  chamber: false,
  pump: false,
  shapeTxt: '',
  pattern: 'dft',
  harmK: 3,
  phaseV: 0.6,
  bc: 120,
  bw: 0.9,
  rx: 0,
  rz: 0,
  tau: 0.18,
  lawPolarity: 0,
  lawTrinity: 0,
  lawConsonance: 0,
  lawDiversity: 0,
  lawBalance: 0,
  lawRhythm: 0,
  lawRadiation: 0,
  lawVesica: 0,
  lawLatentN: 0,
  lawIntervalP: 0,
  lawIntervalQ: 0,
}

/**
 * THE GOLDEN EGG BREATH — a complete four-beat round:
 *
 *   inhale 4  →  hold full 4  →  exhale 6  →  hold empty 2
 *
 * All four beats matter. The top hold is where the egg sits fully formed and
 * radiant; the bottom hold (`holdOut`) is the still point at the base of the
 * breath, where the egg rests contracted before the next inhale rebuilds it.
 * The long exhale is what actually settles the nervous system.
 */
export const BREATH_TIMING = {
  inhale: 4000,
  hold: 4000,
  exhale: 6000,
  holdOut: 2000,
} as const

export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdOut'

/** Total length of one full Golden Egg Breath round (ms) */
export const BREATH_CYCLE_MS =
  BREATH_TIMING.inhale + BREATH_TIMING.hold + BREATH_TIMING.exhale + BREATH_TIMING.holdOut
