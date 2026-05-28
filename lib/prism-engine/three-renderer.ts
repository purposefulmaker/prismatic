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
  dotPositions: Float32Array
  dotColors: Float32Array
  dotIntensities: Float32Array
  dotDepths: Float32Array
  beamPositions: Float32Array
  beamColors: Float32Array
  beamAlphas: Float32Array
  zoom: number
  camDist: number
  viewWidth: number
}

const FOV = 50
const PRISM_RING_COUNT = 64
const STAR_COUNT = 1100

export function createThreeScene(canvas: HTMLCanvasElement, nodeCount: number): ThreeScene {
  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setClearColor(0x000000, 1)

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

  scene.add(new THREE.Points(dotGeometry, dotMaterial))

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

  scene.add(new THREE.LineSegments(beamGeometry, beamMaterial))

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
    dotPositions,
    dotColors,
    dotIntensities,
    dotDepths,
    beamPositions,
    beamColors,
    beamAlphas,
    zoom: 1,
    camDist: 4,
    viewWidth: window.innerWidth,
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

  const panelW = panelHidden ? 0 : 300
  threeScene.viewWidth = Math.max(60, width - panelW)

  threeScene.camera.aspect = threeScene.viewWidth / height
  threeScene.camera.updateProjectionMatrix()

  const halfTan = Math.tan((FOV * Math.PI) / 360)
  const targetPx = Math.min(threeScene.viewWidth, height) * 0.33
  threeScene.camDist = (height * 0.5) / (targetPx * halfTan) / threeScene.zoom

  threeScene.camera.position.set(0, 0, threeScene.camDist)
  threeScene.camera.lookAt(0, 0, 0)

  threeScene.renderer.setViewport(0, 0, threeScene.viewWidth, height)

  // Update uniforms
  threeScene.dotMaterial.uniforms.uPR.value = dpr
  threeScene.prismMaterial.uniforms.uPR.value = dpr
  threeScene.starMaterial.uniforms.uPR.value = dpr
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
      const alpha = n.intensity * params.bo * depth * (0.4 + params.bw * 0.3)
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

  // Render
  renderer.render(scene, camera)

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
}
