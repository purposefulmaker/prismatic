// ═══════════════════════════════════════════════════════════════
// MATH DISCO ENGINE — Three.js WebGL Renderer
// Glowing dots · Beam threads · Prism core · Starfield
// ═══════════════════════════════════════════════════════════════

import * as THREE from 'three'
import type { PrismNode, PrismParameters } from './types'
import { wavelengthToRGB } from './physics'

// ─── Shader Sources ───

const DOT_VERTEX = `
attribute float aInt;
attribute float aDepth;
uniform float uPR, uSize, uBreath, uGlow;
varying vec3 vCol;
varying float vInt;
varying float vDepth;

void main() {
  vCol = color;
  vInt = aInt;
  vDepth = aDepth;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float depthF = 0.5 + aDepth * 0.6;
  float intF = 0.55 + aInt * 1.7;
  float glowF = 1.0 + aInt * uGlow * 0.04;
  float sz = uSize * depthF * intF * glowF * uBreath;
  gl_PointSize = clamp(sz * uPR * 22.0 / (-mv.z), 1.0, 170.0);
  gl_Position = projectionMatrix * mv;
}
`

const DOT_FRAGMENT = `
precision highp float;
uniform float uGlow;
varying vec3 vCol;
varying float vInt;
varying float vDepth;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float core = exp(-d * d * 7.0);
  float mid = exp(-d * d * 2.0) * 0.4;
  float halo = exp(-d * 1.6) * (0.10 + uGlow * 0.02);
  float shape = core + mid + halo;
  float baseB = 0.10 + vDepth * 0.10;
  float litB = vInt;
  vec3 col = vCol * (mid + halo) * (0.7 + litB * 1.8) + vCol * core * (0.35 + litB * 0.5) + vec3(1.0, 0.96, 0.9) * core * litB * 1.3;
  gl_FragColor = vec4(col, shape * (baseB + litB * 0.95));
}
`

const BEAM_VERTEX = `
attribute float aAlpha;
varying vec3 vC;
varying float vA;

void main() {
  vC = color;
  vA = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const BEAM_FRAGMENT = `
precision highp float;
varying vec3 vC;
varying float vA;

void main() {
  gl_FragColor = vec4(vC, vA);
}
`

const PRISM_VERTEX = `
attribute float aSize;
uniform float uPR, uPrism;
varying vec3 vC;

void main() {
  vC = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(aSize * uPrism * uPR * 22.0 / (-mv.z), 1.0, 280.0);
  gl_Position = projectionMatrix * mv;
}
`

const PRISM_FRAGMENT = `
precision highp float;
varying vec3 vC;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float core = exp(-d * d * 5.0);
  float halo = exp(-d * 1.4) * 0.25;
  gl_FragColor = vec4(vC * (core * 1.4 + halo), core + halo);
}
`

const STAR_VERTEX = `
attribute float aS;
attribute float aPh;
uniform float t, uPR;
varying float vT;

void main() {
  vT = 0.5 + 0.5 * sin(t * (0.3 + aS * 0.2) + aPh);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aS * (0.6 + vT * 0.6) * uPR * 40.0 / (-mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const STAR_FRAGMENT = `
precision highp float;
varying float vT;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float b = exp(-d * d * 5.0);
  gl_FragColor = vec4(vec3(0.7, 0.78, 1.0) * b, b * vT * 0.5);
}
`

// ─── REALITY BENDER: full GPU tier ───
// All per-node math (warp, rotation, spectral color, interference waves)
// runs in the vertex shader. Positions upload ONCE; per frame the CPU only
// updates a handful of uniforms. This is what lets node counts hit 30k+.
const GPU_VERTEX = `
attribute float aSeed;
uniform float uTime, uPR, uSize, uHarmK, uPhaseV, uWarp, uHueShift, uSpin, uV0;
uniform sampler2D uMask;
varying vec3 vCol;
varying float vInt;
varying float vDepth;

// IQ cosine palette — full spectral sweep
vec3 spectral(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec3 p = position;
  float theta = acos(clamp(p.z, -1.0, 1.0));
  float phi = atan(p.y, p.x);

  // V0 PRISM mode freezes warp and spin so the glyph holds still
  float live = 1.0 - uV0;

  // Reality warp: the sphere surface undulates along its own normal
  float warp = 1.0 + uWarp * live * sin(phi * 3.0 + uTime * 1.2) * sin(theta * 4.0 - uTime * 0.9);
  p *= warp;

  // GPU rotation (Y then X axis), scaled by spin control
  float ay = uTime * 0.22 * uSpin * live;
  float ax = uTime * 0.09 * uSpin * live;
  float cy = cos(ay), sy = sin(ay);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
  float cx = cos(ax), sx = sin(ax);
  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);

  // GPU interference field — two traveling harmonic waves + product term
  float w1 = 0.5 + 0.5 * cos(uHarmK * phi - uTime * uPhaseV * 3.0 + theta * 2.0);
  float w2 = 0.5 + 0.5 * cos((uHarmK + 2.0) * theta + uTime * uPhaseV * 2.0 + aSeed * 6.28318);
  float inten = pow(w1, 5.0) * 0.9 + pow(w2, 7.0) * 0.55 + pow(w1 * w2, 3.0) * 0.5;

  // Spectral color by latitude, hue drifting through time
  vec3 col = spectral(theta / 3.14159 + uHueShift * uTime);

  // ── V0 PRISM: sample the text mask on the front hemisphere ──
  // The white beam hits the central prism; the spectrum fans out and paints
  // the glyph in rainbow across the mesh. Hue runs left-to-right like the
  // Dark Side of the Moon dispersion fan.
  if (uV0 > 0.5) {
    float m = 0.0;
    vec2 uvm = vec2(0.5 + p.x * 0.36, 0.5 - p.y * 0.72);
    if (p.z > 0.15 && uvm.x > 0.0 && uvm.x < 1.0 && uvm.y > 0.0 && uvm.y < 1.0) {
      m = step(0.5, texture2D(uMask, uvm).r);
    }
    // Glyph nodes blaze in spectral rainbow; background holds a dim shell
    inten = m * (1.1 + 0.15 * sin(uTime * 2.0 + p.x * 4.0)) + 0.045;
    col = mix(vec3(0.42, 0.45, 0.5), spectral(uvm.x * 0.75 + 0.02), m);
  }

  vInt = clamp(inten, 0.0, 1.5);
  vCol = col;
  vDepth = (p.z + 1.0) * 0.5;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depthF = 0.5 + vDepth * 0.6;
  float intF = 0.45 + vInt * 1.5;
  float sz = uSize * depthF * intF;
  gl_PointSize = clamp(sz * uPR * 22.0 / (-mv.z), 1.0, 60.0);
  gl_Position = projectionMatrix * mv;
}
`

const GPU_FRAGMENT = `
precision highp float;
varying vec3 vCol;
varying float vInt;
varying float vDepth;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float core = exp(-d * d * 7.0);
  float mid = exp(-d * d * 2.0) * 0.4;
  float shape = core + mid;
  float baseB = 0.05 + vDepth * 0.07;
  vec3 col = vCol * (mid * (0.7 + vInt * 1.6) + core * (0.3 + vInt * 0.6)) + vec3(1.0, 0.97, 0.92) * core * vInt * 0.9;
  gl_FragColor = vec4(col, shape * (baseB + vInt * 0.85));
}
`

// Fullscreen tone-mapping pass — compresses HDR highlights (ACES filmic)
// so dense additive regions keep their color/pattern instead of clipping to white.
const TONE_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const TONE_FRAGMENT = `
precision highp float;
uniform sampler2D tScene;
uniform float uExposure;
uniform float uWhite;
varying vec2 vUv;

// Extended Reinhard tone mapping applied to LUMINANCE only.
// Color ratios (hue/saturation) are preserved, so dense additive regions
// keep their spectral color instead of clipping to flat white. uWhite sets
// the luminance that maps to pure white.
void main() {
  vec3 hdr = texture2D(tScene, vUv).rgb * uExposure;
  float luma = dot(hdr, vec3(0.2126, 0.7152, 0.0722));
  float w2 = uWhite * uWhite;
  float mappedLuma = (luma * (1.0 + luma / w2)) / (1.0 + luma);
  vec3 mapped = hdr * (mappedLuma / max(luma, 1e-4));
  gl_FragColor = vec4(clamp(mapped, 0.0, 1.0), 1.0);
}
`

// ─── Three.js Scene Setup ───

export interface ThreeScene {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  dotGeometry: THREE.BufferGeometry
  dotMaterial: THREE.ShaderMaterial
  beamGeometry: THREE.BufferGeometry
  beamMaterial: THREE.ShaderMaterial
  prismMesh: THREE.Points
  prismMaterial: THREE.ShaderMaterial
  starMaterial: THREE.ShaderMaterial
  dotPoints: THREE.Points
  beamLines: THREE.LineSegments
  gpuPoints: THREE.Points
  gpuMaterial: THREE.ShaderMaterial
  gpuMaskTexture: THREE.DataTexture
  floydBeams: THREE.LineSegments
  dotPositions: Float32Array
  dotColors: Float32Array
  dotIntensities: Float32Array
  dotDepths: Float32Array
  beamPositions: Float32Array
  beamColors: Float32Array
  beamAlphas: Float32Array
  // HDR tone-mapping pass
  rt: THREE.WebGLRenderTarget
  postScene: THREE.Scene
  postCamera: THREE.OrthographicCamera
  toneMaterial: THREE.ShaderMaterial
  zoom: number
  camDist: number
  viewWidth: number
  viewHeight: number
  canvasWidth: number
  canvasHeight: number
}

const FOV = 50
const PRISM_RING_COUNT = 64
const STAR_COUNT = 1100
export const GPU_NODE_COUNT = 30000

export function createThreeScene(canvas: HTMLCanvasElement, nodeCount: number): ThreeScene {
  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setClearColor(0x000000, 1)
  renderer.autoClear = false

  // Scene and camera
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 200)
  camera.position.set(0, 0, 4)

  // ─── Dot particles ───
  const dotPositions = new Float32Array(nodeCount * 3)
  const dotColors = new Float32Array(nodeCount * 3)
  const dotIntensities = new Float32Array(nodeCount)
  const dotDepths = new Float32Array(nodeCount)

  const dotGeometry = new THREE.BufferGeometry()
  dotGeometry.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3))
  dotGeometry.setAttribute('color', new THREE.BufferAttribute(dotColors, 3))
  dotGeometry.setAttribute('aInt', new THREE.BufferAttribute(dotIntensities, 1))
  dotGeometry.setAttribute('aDepth', new THREE.BufferAttribute(dotDepths, 1))

  const dotMaterial = new THREE.ShaderMaterial({
    vertexShader: DOT_VERTEX,
    fragmentShader: DOT_FRAGMENT,
    uniforms: {
      uPR: { value: 2 },
      uSize: { value: 3.0 },
      uBreath: { value: 1 },
      uGlow: { value: 10 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    vertexColors: true,
  })

  const dotPoints = new THREE.Points(dotGeometry, dotMaterial)
  scene.add(dotPoints)

  // ─── Beam threads ───
  const beamPositions = new Float32Array(nodeCount * 2 * 3)
  const beamColors = new Float32Array(nodeCount * 2 * 3)
  const beamAlphas = new Float32Array(nodeCount * 2)

  const beamGeometry = new THREE.BufferGeometry()
  beamGeometry.setAttribute('position', new THREE.BufferAttribute(beamPositions, 3))
  beamGeometry.setAttribute('color', new THREE.BufferAttribute(beamColors, 3))
  beamGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(beamAlphas, 1))
  beamGeometry.setDrawRange(0, 0)

  const beamMaterial = new THREE.ShaderMaterial({
    vertexShader: BEAM_VERTEX,
    fragmentShader: BEAM_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    vertexColors: true,
  })

  const beamLines = new THREE.LineSegments(beamGeometry, beamMaterial)
  scene.add(beamLines)

  // ─── REALITY BENDER GPU layer: 30k Fibonacci nodes, math lives on GPU ───
  const gpuPositions = new Float32Array(GPU_NODE_COUNT * 3)
  const gpuSeeds = new Float32Array(GPU_NODE_COUNT)
  const GA = Math.PI * (3 - Math.sqrt(5)) // golden angle
  for (let i = 0; i < GPU_NODE_COUNT; i++) {
    const z = 1 - (2 * (i + 0.5)) / GPU_NODE_COUNT
    const r = Math.sqrt(Math.max(0, 1 - z * z))
    const phi = i * GA
    gpuPositions[i * 3] = Math.cos(phi) * r
    gpuPositions[i * 3 + 1] = Math.sin(phi) * r
    gpuPositions[i * 3 + 2] = z
    gpuSeeds[i] = i / GPU_NODE_COUNT
  }

  const gpuGeometry = new THREE.BufferGeometry()
  gpuGeometry.setAttribute('position', new THREE.BufferAttribute(gpuPositions, 3))
  gpuGeometry.setAttribute('aSeed', new THREE.BufferAttribute(gpuSeeds, 1))

  // Text mask texture for V0 PRISM mode (256×128, RGBA — uploaded on demand)
  const gpuMaskTexture = new THREE.DataTexture(
    new Uint8Array(256 * 128 * 4),
    256,
    128,
    THREE.RGBAFormat
  )
  gpuMaskTexture.minFilter = THREE.LinearFilter
  gpuMaskTexture.magFilter = THREE.LinearFilter
  gpuMaskTexture.needsUpdate = true

  const gpuMaterial = new THREE.ShaderMaterial({
    vertexShader: GPU_VERTEX,
    fragmentShader: GPU_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPR: { value: 2 },
      uSize: { value: 2.0 },
      uHarmK: { value: 3 },
      uPhaseV: { value: 1.0 },
      uWarp: { value: 0.16 },
      uHueShift: { value: 0.02 },
      uSpin: { value: 1.0 },
      uV0: { value: 0 },
      uMask: { value: gpuMaskTexture },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })

  const gpuPoints = new THREE.Points(gpuGeometry, gpuMaterial)
  gpuPoints.visible = false
  scene.add(gpuPoints)

  // ─── Pink Floyd beams: single white light in, spectrum fan out ───
  const FAN_RAYS = 14
  const floydVerts = (1 + FAN_RAYS) * 2
  const floydPositions = new Float32Array(floydVerts * 3)
  const floydColors = new Float32Array(floydVerts * 3)
  const floydAlphas = new Float32Array(floydVerts)

  // White beam: enters from lower-left, terminates at the prism core
  floydPositions.set([-3.4, -1.25, 0.25, 0, 0, 0.25], 0)
  floydColors.set([1, 1, 1, 1, 1, 1], 0)
  floydAlphas[0] = 0.06
  floydAlphas[1] = 0.95

  // Spectral fan: from the prism out to the front face of the mesh, hues
  // matching the glyph rainbow left (red) to right (violet)
  for (let i = 0; i < FAN_RAYS; i++) {
    const t = i / (FAN_RAYS - 1)
    const ex = -1.0 + t * 2.0
    const ey = 0.12 - Math.abs(ex) * 0.18
    const ez = Math.sqrt(Math.max(0.05, 1 - ex * ex - ey * ey))
    const [r, g, b] = wavelengthToRGB(700 - t * 320)
    const base = (1 + i) * 2
    floydPositions.set([0, 0, 0.05, ex * 0.97, ey, ez], base * 3)
    floydColors.set([r, g, b, r, g, b], base * 3)
    floydAlphas[base] = 0.85
    floydAlphas[base + 1] = 0.18
  }

  const floydGeometry = new THREE.BufferGeometry()
  floydGeometry.setAttribute('position', new THREE.BufferAttribute(floydPositions, 3))
  floydGeometry.setAttribute('color', new THREE.BufferAttribute(floydColors, 3))
  floydGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(floydAlphas, 1))

  const floydBeams = new THREE.LineSegments(
    floydGeometry,
    new THREE.ShaderMaterial({
      vertexShader: BEAM_VERTEX,
      fragmentShader: BEAM_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      vertexColors: true,
    })
  )
  floydBeams.visible = false
  scene.add(floydBeams)

  // ─── Prism core (white-blue glow + rotating rainbow ring) ───
  const prismPositions = new Float32Array((PRISM_RING_COUNT + 1) * 3)
  const prismColors = new Float32Array((PRISM_RING_COUNT + 1) * 3)
  const prismSizes = new Float32Array(PRISM_RING_COUNT + 1)

  // Center point (white)
  prismPositions[0] = 0
  prismPositions[1] = 0
  prismPositions[2] = 0
  prismColors[0] = 0.85
  prismColors[1] = 0.9
  prismColors[2] = 1.0
  prismSizes[0] = 8

  // Rainbow ring
  for (let i = 0; i < PRISM_RING_COUNT; i++) {
    const angle = (i / PRISM_RING_COUNT) * Math.PI * 2
    const ringRadius = 0.1
    const wavelength = 380 + (i / PRISM_RING_COUNT) * 320
    const [r, g, b] = wavelengthToRGB(wavelength)
    const k = (i + 1) * 3

    prismPositions[k] = Math.cos(angle) * ringRadius
    prismPositions[k + 1] = Math.sin(angle) * ringRadius
    prismPositions[k + 2] = 0
    prismColors[k] = r
    prismColors[k + 1] = g
    prismColors[k + 2] = b
    prismSizes[i + 1] = 3.2
  }

  const prismGeometry = new THREE.BufferGeometry()
  prismGeometry.setAttribute('position', new THREE.BufferAttribute(prismPositions, 3))
  prismGeometry.setAttribute('color', new THREE.BufferAttribute(prismColors, 3))
  prismGeometry.setAttribute('aSize', new THREE.BufferAttribute(prismSizes, 1))

  const prismMaterial = new THREE.ShaderMaterial({
    vertexShader: PRISM_VERTEX,
    fragmentShader: PRISM_FRAGMENT,
    uniforms: {
      uPR: { value: 2 },
      uPrism: { value: 1.0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    vertexColors: true,
  })

  const prismMesh = new THREE.Points(prismGeometry, prismMaterial)
  scene.add(prismMesh)

  // ─── Starfield ───
  const starPositions = new Float32Array(STAR_COUNT * 3)
  const starSizes = new Float32Array(STAR_COUNT)
  const starPhases = new Float32Array(STAR_COUNT)

  for (let i = 0; i < STAR_COUNT; i++) {
    const phi = Math.random() * Math.PI * 2
    const theta = Math.acos(Math.random() * 2 - 1)
    const r = 18 + Math.random() * 42
    starPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi)
    starPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
    starPositions[i * 3 + 2] = r * Math.cos(theta)
    starSizes[i] = 0.4 + Math.random() * 1.6
    starPhases[i] = Math.random() * Math.PI * 2
  }

  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  starGeometry.setAttribute('aS', new THREE.BufferAttribute(starSizes, 1))
  starGeometry.setAttribute('aPh', new THREE.BufferAttribute(starPhases, 1))

  const starMaterial = new THREE.ShaderMaterial({
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    uniforms: {
      t: { value: 0 },
      uPR: { value: 2 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })

  scene.add(new THREE.Points(starGeometry, starMaterial))

  // ─── HDR render target + tone-mapping post pass ───
  const dpr0 = Math.min(window.devicePixelRatio || 1, 2)
  const rt = new THREE.WebGLRenderTarget(
    Math.max(2, Math.floor(window.innerWidth * dpr0)),
    Math.max(2, Math.floor(window.innerHeight * dpr0)),
    {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    }
  )

  const toneMaterial = new THREE.ShaderMaterial({
    vertexShader: TONE_VERTEX,
    fragmentShader: TONE_FRAGMENT,
    uniforms: {
      tScene: { value: rt.texture },
      uExposure: { value: 1.0 },
      uWhite: { value: 3.0 },
    },
    depthTest: false,
    depthWrite: false,
  })

  const postScene = new THREE.Scene()
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), toneMaterial)
  postScene.add(postQuad)

  return {
    renderer,
    scene,
    camera,
    dotGeometry,
    dotMaterial,
    beamGeometry,
    beamMaterial,
    prismMesh,
    prismMaterial,
    starMaterial,
    dotPoints,
    beamLines,
    gpuPoints,
    gpuMaterial,
    gpuMaskTexture,
    floydBeams,
    dotPositions,
    dotColors,
    dotIntensities,
    dotDepths,
    beamPositions,
    beamColors,
    beamAlphas,
    rt,
    postScene,
    postCamera,
    toneMaterial,
    zoom: 1,
    camDist: 4,
    viewWidth: window.innerWidth,
    viewHeight: window.innerHeight,
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
  }
}

export function updateViewport(
  threeScene: ThreeScene,
  width: number,
  height: number,
  panelHidden: boolean
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  threeScene.renderer.setPixelRatio(dpr)
  threeScene.renderer.setSize(width, height)

  // DETERMINISTIC CENTERING: always center the field in the FULL window, with
  // no panel-aware view offset. The control panel is a right-side overlay; the
  // field's optical center (world origin) sits at the true window center at all
  // times, so it can never desync from panel open/close state or DPR. `panelHidden`
  // is intentionally unused for positioning — it's kept in the signature so the
  // resize/toggle callers don't need to change.
  void panelHidden
  threeScene.viewWidth = width
  threeScene.viewHeight = height
  threeScene.canvasWidth = width
  threeScene.canvasHeight = height

  // HDR render target spans the full drawing buffer
  threeScene.rt.setSize(
    Math.max(2, Math.floor(width * dpr)),
    Math.max(2, Math.floor(height * dpr))
  )

  threeScene.camera.aspect = width / height
  // No sub-window sampling — the origin projects to the exact center of the canvas.
  threeScene.camera.clearViewOffset()
  threeScene.camera.updateProjectionMatrix()

  // Size the shape against the full window (min of width/height keeps it framed)
  const halfTan = Math.tan((FOV * Math.PI) / 360)
  const targetPx = Math.min(width, height) * 0.33
  threeScene.camDist = (height * 0.5) / (targetPx * halfTan) / threeScene.zoom

  threeScene.camera.position.set(0, 0, threeScene.camDist)
  threeScene.camera.lookAt(0, 0, 0)

  threeScene.renderer.setViewport(0, 0, width, height)

  // Update uniforms
  threeScene.dotMaterial.uniforms.uPR.value = dpr
  threeScene.prismMaterial.uniforms.uPR.value = dpr
  threeScene.starMaterial.uniforms.uPR.value = dpr
}

/**
 * Upload the 256×128 text shape mask into the GPU mask texture used by
 * V0 PRISM mode. Pass null to clear (glyph disappears).
 */
export function updateGpuMask(
  threeScene: ThreeScene,
  mask: Uint8ClampedArray | null
): void {
  const data = threeScene.gpuMaskTexture.image.data as Uint8Array
  if (mask && mask.length === data.length) {
    data.set(mask)
  } else {
    data.fill(0)
  }
  threeScene.gpuMaskTexture.needsUpdate = true
}

export function renderThreeFrame(
  threeScene: ThreeScene,
  nodes: PrismNode[],
  params: PrismParameters,
  time: number,
  dt: number,
  breath: number
): number {
  const {
    dotGeometry,
    dotMaterial,
    beamGeometry,
    prismMesh,
    prismMaterial,
    starMaterial,
    dotPositions,
    dotColors,
    dotIntensities,
    dotDepths,
    beamPositions,
    beamColors,
    beamAlphas,
    renderer,
    scene,
    camera,
  } = threeScene

  // ── REALITY BENDER fast path: GPU does everything per-node ──
  if (params.gpuMode) {
    const { gpuPoints, gpuMaterial, dotPoints, beamLines, floydBeams } = threeScene
    gpuPoints.visible = true
    dotPoints.visible = false
    beamLines.visible = false
    // PRISM mode shows the single-white-light-to-spectrum fan
    floydBeams.visible = !!params.gpuPrism

    gpuMaterial.uniforms.uTime.value = time
    gpuMaterial.uniforms.uPR.value = renderer.getPixelRatio()
    gpuMaterial.uniforms.uSize.value = params.dr * 0.7
    gpuMaterial.uniforms.uHarmK.value = Math.max(1, params.harmK)
    gpuMaterial.uniforms.uPhaseV.value = params.phaseV
    gpuMaterial.uniforms.uWarp.value = params.gpuWarp
    gpuMaterial.uniforms.uHueShift.value = params.gpuHue
    gpuMaterial.uniforms.uSpin.value = params.gpuSpin
    // No text-glyph projection in this build — keep the mesh spectral
    gpuMaterial.uniforms.uV0.value = 0

    prismMaterial.uniforms.uPrism.value = params.prismInt
    prismMesh.rotation.z += dt * (params.gpuPrism ? 0.12 : 0.3)
    starMaterial.uniforms.t.value = time

    const { rt: grt, postScene: gps, postCamera: gpc, canvasWidth: gcw, canvasHeight: gch } = threeScene
    // Full-canvas pipeline; camera view-offset handles visible-region centering
    renderer.setRenderTarget(grt)
    renderer.setViewport(0, 0, gcw, gch)
    renderer.setClearColor(0x000000, 1)
    renderer.clear()
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    renderer.setViewport(0, 0, gcw, gch)
    renderer.clear()
    renderer.render(gps, gpc)
    return GPU_NODE_COUNT
  }

  // CPU path: hide the GPU layer, show dots/beams
  threeScene.gpuPoints.visible = false
  threeScene.floydBeams.visible = false
  threeScene.dotPoints.visible = true
  threeScene.beamLines.visible = true

  let beamIndex = 0

  // Update dot and beam buffers
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    const bx = n.x * breath
    const by = -n.y * breath // Y negated to match original orientation
    const bz = n.z * breath

    // Dot positions and colors
    dotPositions[i * 3] = bx
    dotPositions[i * 3 + 1] = by
    dotPositions[i * 3 + 2] = bz
    dotColors[i * 3] = n.r
    dotColors[i * 3 + 1] = n.g
    dotColors[i * 3 + 2] = n.b
    dotIntensities[i] = n.intensity
    dotDepths[i] = (n.z + 1) / 2

    // Beam from prism center to lit dots
    if (n.intensity > 0.05 && n.z > -0.35) {
      const depth = (n.z + 1) / 2
      // In lattice mode the beams ARE the lattice's connective edges, so the
      // Edge Width / Edge Opacity controls modulate them here (WebGL can't vary
      // per-segment line width, so edgeWidth boosts the additive glow instead).
      const edgeFactor = params.lattice?.enabled
        ? params.lattice.edgeOpacity * (0.4 + params.lattice.edgeWidth * 0.45)
        : 1
      const alpha = n.intensity * params.bo * depth * (0.4 + params.bw * 0.3) * edgeFactor
      const j = beamIndex * 6

      // Start at center
      beamPositions[j] = 0
      beamPositions[j + 1] = 0
      beamPositions[j + 2] = 0
      // End at dot
      beamPositions[j + 3] = bx
      beamPositions[j + 4] = by
      beamPositions[j + 5] = bz

      // White at prism
      beamColors[j] = 0.9
      beamColors[j + 1] = 0.95
      beamColors[j + 2] = 1.0
      // Spectrum at dot
      beamColors[j + 3] = n.r
      beamColors[j + 4] = n.g
      beamColors[j + 5] = n.b

      beamAlphas[beamIndex * 2] = alpha * 0.25
      beamAlphas[beamIndex * 2 + 1] = alpha

      beamIndex++
    }
  }

  // Mark buffers for update
  dotGeometry.attributes.position.needsUpdate = true
  dotGeometry.attributes.color.needsUpdate = true
  ;(dotGeometry.attributes.aInt as THREE.BufferAttribute).needsUpdate = true
  ;(dotGeometry.attributes.aDepth as THREE.BufferAttribute).needsUpdate = true

  beamGeometry.setDrawRange(0, beamIndex * 2)
  beamGeometry.attributes.position.needsUpdate = true
  beamGeometry.attributes.color.needsUpdate = true
  ;(beamGeometry.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true

  // Update uniforms
  dotMaterial.uniforms.uSize.value = params.dr
  dotMaterial.uniforms.uBreath.value = breath
  dotMaterial.uniforms.uGlow.value = params.gr
  prismMaterial.uniforms.uPrism.value = params.prismInt

  // Rotate prism ring
  prismMesh.rotation.z += dt * 0.3

  // Star twinkle
  starMaterial.uniforms.t.value = time

  const { rt, postScene, postCamera, canvasWidth, canvasHeight } = threeScene

  // Full-canvas pipeline: the camera's view-offset (set in updateViewport)
  // handles centering in the visible region, so both passes span the canvas.
  // ── Pass 1: render scene into HDR float buffer ──
  renderer.setRenderTarget(rt)
  renderer.setViewport(0, 0, canvasWidth, canvasHeight)
  renderer.setClearColor(0x000000, 1)
  renderer.clear()
  renderer.render(scene, camera)

  // ── Pass 2: tone-map HDR buffer to the full screen ──
  renderer.setRenderTarget(null)
  renderer.setViewport(0, 0, canvasWidth, canvasHeight)
  renderer.clear()
  renderer.render(postScene, postCamera)

  return beamIndex
}

export function disposeThreeScene(threeScene: ThreeScene): void {
  threeScene.renderer.dispose()
  threeScene.dotGeometry.dispose()
  threeScene.dotMaterial.dispose()
  threeScene.beamGeometry.dispose()
  threeScene.beamMaterial.dispose()
  threeScene.prismMaterial.dispose()
  threeScene.starMaterial.dispose()
  threeScene.toneMaterial.dispose()
  threeScene.rt.dispose()
  threeScene.gpuPoints.geometry.dispose()
  threeScene.gpuMaterial.dispose()
  threeScene.gpuMaskTexture.dispose()
  threeScene.floydBeams.geometry.dispose()
  ;(threeScene.floydBeams.material as THREE.Material).dispose()
}
