import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { afterDraw, detectSoftwareWebGL } from './glUtils';

export type ThemeMode = 'light' | 'dark';

export interface FuturisticController {
  setTheme: (theme: ThemeMode) => void;
  triggerPulse: () => void;
  dispose: () => void;
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _pointerNdc = new THREE.Vector2(0, 0);
const _raycaster = new THREE.Raycaster();
const _terrainPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 3.3);
const _hitPoint = new THREE.Vector3(0, -3.3, 0);
const _smoothHit = new THREE.Vector3(0, -3.3, 0);
const _dummy = new THREE.Object3D();

const LIGHT_BG = new THREE.Color('#F2F4F8');
const DARK_BG = new THREE.Color('#04060A');
const LIGHT_KEY_COLOR = new THREE.Color('#FFF8EE');
const DARK_KEY_COLOR = new THREE.Color('#EAF1FF');
const LIGHT_RIM_COLOR = new THREE.Color('#7AB3FF');
const DARK_RIM_COLOR = new THREE.Color('#3B82F6');

const LIGHT_TERRAIN_COLOR = new THREE.Color('#E8ECF2');
const DARK_TERRAIN_COLOR = new THREE.Color('#090C12');

const LIGHT_TITANIUM = new THREE.Color('#D5DCE6');
const DARK_TITANIUM = new THREE.Color('#273040');
const LIGHT_ANODIZED = new THREE.Color('#64748B');
const DARK_ANODIZED = new THREE.Color('#131924');
const LIGHT_CORE_COLOR = new THREE.Color('#1E293B');
const DARK_CORE_COLOR = new THREE.Color('#0B1018');
const LIGHT_GLASS_TINT = new THREE.Color('#E6F0FF');
const DARK_GLASS_TINT = new THREE.Color('#CFE4FF');

/**
 * Generates brushed anisotropic metal roughness & micro-groove bump maps.
 */
function createBrushedMetalMaps(maxAnisotropy: number): {
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(size, size);

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;
  const bImg = bCtx.createImageData(size, size);

  const hash = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };

  for (let y = 0; y < size; y++) {
    // Circumferential / linear fine lathe brushing lines
    const streak = hash(y * 1.37) * 0.45 + hash(Math.floor(y * 0.5) * 3.1) * 0.35;
    const fineLine = Math.sin(y * 0.85) * 0.1 + 0.1;

    for (let x = 0; x < size; x++) {
      const microGrain = hash(y * size + x) * 0.14;
      const val = THREE.MathUtils.clamp(0.32 + streak * 0.38 + fineLine + microGrain, 0, 1);

      const idx = (y * size + x) * 4;
      const rVal = Math.round(val * 255);
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;

      const bVal = Math.round(THREE.MathUtils.clamp(0.5 + (streak - 0.4) * 0.55 + (microGrain - 0.07), 0, 1) * 255);
      bImg.data[idx] = bVal;
      bImg.data[idx + 1] = bVal;
      bImg.data[idx + 2] = bVal;
      bImg.data[idx + 3] = 255;
    }
  }

  rCtx.putImageData(rImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 2);
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 2);
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  return { roughnessMap, bumpMap };
}

/**
 * Generates mineral basalt / honed ceramic surface micro-detail bump & roughness maps.
 */
function createMineralTerrainMaps(maxAnisotropy: number): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;
  const bImg = bCtx.createImageData(size, size);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(size, size);

  const hash2 = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return s - Math.floor(s);
  };

  const smoothNoise = (x: number, y: number, period: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % period) + period) % period;
    const x1 = (x0 + 1) % period;
    const y0 = ((yi % period) + period) % period;
    const y1 = (y0 + 1) % period;

    const a = hash2(x0, y0);
    const b = hash2(x1, y0);
    const c = hash2(x0, y1);
    const d = hash2(x1, y1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const n1 = smoothNoise(nx * 8, ny * 8, 8);
      const n2 = smoothNoise(nx * 24, ny * 24, 24) * 0.5;
      const n3 = smoothNoise(nx * 64, ny * 64, 64) * 0.25;
      const mineral = (n1 + n2 + n3) / 1.75;

      const idx = (y * size + x) * 4;
      const bVal = Math.round(THREE.MathUtils.clamp(mineral, 0, 1) * 255);
      bImg.data[idx] = bVal;
      bImg.data[idx + 1] = bVal;
      bImg.data[idx + 2] = bVal;
      bImg.data[idx + 3] = 255;

      const rVal = Math.round(THREE.MathUtils.clamp(0.42 + mineral * 0.44, 0, 1) * 255);
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;
    }
  }

  bCtx.putImageData(bImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(8, 6);
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(8, 6);
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  return { bumpMap, roughnessMap };
}

/**
 * Generates a soft radial contact shadow texture to ground the levitating sculpture.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a chamfered, stepped precision machined ring via LatheGeometry.
 */
function createBeveledRingGeometry(
  innerR: number,
  outerR: number,
  halfHeight: number,
  chamfer: number,
  segments: number
): THREE.LatheGeometry {
  const c = Math.min(chamfer, (outerR - innerR) * 0.35, halfHeight * 0.6);
  const pts = [
    new THREE.Vector2(innerR + c, -halfHeight),
    new THREE.Vector2(outerR - c, -halfHeight),
    new THREE.Vector2(outerR, -halfHeight + c),
    new THREE.Vector2(outerR, halfHeight - c),
    new THREE.Vector2(outerR - c, halfHeight),
    new THREE.Vector2(innerR + c, halfHeight),
    new THREE.Vector2(innerR, halfHeight - c),
    new THREE.Vector2(innerR, -halfHeight + c),
    new THREE.Vector2(innerR + c, -halfHeight),
  ];
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.computeVertexNormals();
  return geo;
}

export function initFuturisticScene(
  container: HTMLElement,
  initialTheme: ThemeMode,
  onContextLossChange?: (lost: boolean) => void
): FuturisticController {
  const isSoftwareGl = detectSoftwareWebGL();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetThemeMix = initialTheme === 'dark' ? 1 : 0;
  let currentThemeMix = targetThemeMix;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color().copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
  scene.fog = new THREE.FogExp2(
    new THREE.Color().copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix).getHex(),
    0.025
  );

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 120);
  camera.position.set(0, 1.45, 13.8);
  camera.lookAt(0, -0.2, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  // Studio IBL environment map for authentic metallic & glass reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  // 3-Point Natural Studio Rig + Softbox Area Lights
  const hemiLight = new THREE.HemisphereLight(0xeef5ff, 0x1a2230, 0.55);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.35);
  keyLight.position.set(10, 13, 8);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.025;
  }
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.15);
  rimLight.position.set(-10, 4, -8);
  scene.add(rimLight);

  let softboxA: THREE.RectAreaLight | null = null;
  let softboxB: THREE.RectAreaLight | null = null;
  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    softboxA = new THREE.RectAreaLight(0xffffff, 4.5, 6, 2.5);
    softboxA.position.set(7.5, 4.5, 5.5);
    softboxA.lookAt(4.2, 0.5, -2.2);
    scene.add(softboxA);

    softboxB = new THREE.RectAreaLight(0x93c5fd, 2.8, 5, 3);
    softboxB.position.set(-2.5, 2.5, 4.5);
    softboxB.lookAt(4.2, 0.5, -2.2);
    scene.add(softboxB);
  }

  // Shared Procedural PBR Textures
  const metalMaps = createBrushedMetalMaps(maxAnisotropy);
  const terrainMaps = createMineralTerrainMaps(maxAnisotropy);
  const shadowTex = createContactShadowTexture();

  // 1. Natural Sculpted Basalt / Honed Ceramic Wave Terrain (physically lit PBR + shadows)
  const terrainGeo = new THREE.PlaneGeometry(70, 52, 160, 120);
  terrainGeo.rotateX(-Math.PI * 0.5);

  const terrainUniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerStrength: { value: 0 },
    uPulseAge: { value: 10 },
    uPulseStrength: { value: 0 },
  };

  const terrainMat = new THREE.MeshPhysicalMaterial({
    color: DARK_TERRAIN_COLOR.clone(),
    bumpMap: terrainMaps.bumpMap,
    bumpScale: 0.045,
    roughnessMap: terrainMaps.roughnessMap,
    roughness: 0.72,
    metalness: 0.14,
    clearcoat: 0.15,
    clearcoatRoughness: 0.55,
    envMapIntensity: 0.48,
  });
  terrainMat.customProgramCacheKey = () => 'gvx-natural-terrain-v1';

  terrainMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = terrainUniforms.uTime;
    shader.uniforms.uPointer = terrainUniforms.uPointer;
    shader.uniforms.uPointerStrength = terrainUniforms.uPointerStrength;
    shader.uniforms.uPulseAge = terrainUniforms.uPulseAge;
    shader.uniforms.uPulseStrength = terrainUniforms.uPulseStrength;

    shader.vertexShader =
      `
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uPointerStrength;
      uniform float uPulseAge;
      uniform float uPulseStrength;

      float terrainHeight(vec2 xz) {
        float w1 = sin(xz.x * 0.19 + uTime * 0.42) * cos(xz.y * 0.16 - uTime * 0.31) * 0.58;
        float w2 = sin((xz.x * 0.34 - xz.y * 0.27) + uTime * 0.55) * 0.24;
        float w3 = cos(xz.x * 0.09 + xz.y * 0.11) * 0.45;
        float dP = length(xz - uPointer);
        float pointerSwell = exp(-dP * dP * 0.05) * 0.48 * uPointerStrength;
        float pulseR = uPulseAge * 12.0;
        float ripple = exp(-pow(dP - pulseR, 2.0) * 0.14) * sin((dP - pulseR) * 1.4) * uPulseStrength * 0.32;
        return w1 + w2 + w3 + pointerSwell + ripple;
      }
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>
      float eps = 0.18;
      float hL = terrainHeight(position.xz - vec2(eps, 0.0));
      float hR = terrainHeight(position.xz + vec2(eps, 0.0));
      float hD = terrainHeight(position.xz - vec2(0.0, eps));
      float hU = terrainHeight(position.xz + vec2(0.0, eps));
      objectNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      transformed.y += terrainHeight(position.xz);
      `
    );
  };

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.set(0, -3.3, -10);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // 2. Hero Tactile Precision Sculpture (9 physically realistic machined & optical parts)
  const assemblyGroup = new THREE.Group();
  assemblyGroup.position.set(4.2, 0.55, -2.2);
  scene.add(assemblyGroup);

  const titaniumMat = new THREE.MeshPhysicalMaterial({
    color: DARK_TITANIUM.clone(),
    roughnessMap: metalMaps.roughnessMap,
    bumpMap: metalMaps.bumpMap,
    bumpScale: 0.012,
    roughness: 0.24,
    metalness: 0.92,
    anisotropy: 0.85,
    clearcoat: 0.35,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.25,
  });

  const anodizedMat = new THREE.MeshPhysicalMaterial({
    color: DARK_ANODIZED.clone(),
    roughnessMap: metalMaps.roughnessMap,
    bumpMap: metalMaps.bumpMap,
    bumpScale: 0.01,
    roughness: 0.46,
    metalness: 0.78,
    clearcoat: 0.12,
    envMapIntensity: 0.95,
  });

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: DARK_CORE_COLOR.clone(),
    roughnessMap: terrainMaps.roughnessMap,
    bumpMap: terrainMaps.bumpMap,
    bumpScale: 0.02,
    roughness: 0.38,
    metalness: 0.45,
    clearcoat: 0.65,
    clearcoatRoughness: 0.14,
  });

  const opticalGlassMat = new THREE.MeshPhysicalMaterial({
    color: DARK_GLASS_TINT.clone(),
    metalness: 0.0,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: isSoftwareGl,
    opacity: isSoftwareGl ? 0.28 : 1.0,
    ior: 1.72,
    thickness: 1.4,
    attenuationDistance: 3.2,
    attenuationColor: new THREE.Color('#93C5FD'),
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.3,
  });

  const inlayAccentMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: new THREE.Color('#1677FF'),
    emissiveIntensity: 0.65,
    roughness: 0.22,
    metalness: 0.75,
  });

  // Part 1: Dense Honed Obsidian Inner Core
  const innerCoreGeo = new THREE.SphereGeometry(0.98, 64, 64);
  const innerCoreMesh = new THREE.Mesh(innerCoreGeo, coreMat);
  innerCoreMesh.castShadow = true;
  assemblyGroup.add(innerCoreMesh);

  // Part 2: Precision Recessed Equatorial Optical Inlay
  const equatorGeo = new THREE.TorusGeometry(0.995, 0.022, 16, 128);
  const equatorMesh = new THREE.Mesh(equatorGeo, inlayAccentMat);
  equatorMesh.rotation.x = Math.PI * 0.5;
  innerCoreMesh.add(equatorMesh);

  // Part 3: Thick Sapphire Optical Dome Shell
  const glassShellGeo = new THREE.SphereGeometry(1.32, 64, 64);
  const glassShellMesh = new THREE.Mesh(glassShellGeo, opticalGlassMat);
  glassShellMesh.renderOrder = 2;
  assemblyGroup.add(glassShellMesh);

  // Part 4: Machined Chamfered Inner Gimbal Ring (LatheGeometry)
  const innerGimbalGroup = new THREE.Group();
  const innerGimbalGeo = createBeveledRingGeometry(1.68, 1.88, 0.075, 0.024, 128);
  const innerGimbalMesh = new THREE.Mesh(innerGimbalGeo, titaniumMat);
  innerGimbalMesh.rotation.x = Math.PI * 0.5;
  innerGimbalMesh.castShadow = true;
  innerGimbalMesh.receiveShadow = true;
  innerGimbalGroup.add(innerGimbalMesh);

  // Part 5: Gimbal Axle Pins connecting glass assembly to inner ring
  const axleGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.42, 16);
  const axleLeft = new THREE.Mesh(axleGeo, anodizedMat);
  axleLeft.rotation.z = Math.PI * 0.5;
  axleLeft.position.set(-1.52, 0, 0);
  innerGimbalGroup.add(axleLeft);

  const axleRight = new THREE.Mesh(axleGeo, anodizedMat);
  axleRight.rotation.z = Math.PI * 0.5;
  axleRight.position.set(1.52, 0, 0);
  innerGimbalGroup.add(axleRight);
  assemblyGroup.add(innerGimbalGroup);

  // Part 6: Broad Chamfered Anodized Outer Structural Ring (LatheGeometry)
  const outerGimbalGroup = new THREE.Group();
  outerGimbalGroup.rotation.set(0.45, -0.32, 0.18);
  const outerGimbalGeo = createBeveledRingGeometry(2.26, 2.54, 0.105, 0.032, 144);
  const outerGimbalMesh = new THREE.Mesh(outerGimbalGeo, anodizedMat);
  outerGimbalMesh.rotation.x = Math.PI * 0.5;
  outerGimbalMesh.castShadow = true;
  outerGimbalMesh.receiveShadow = true;
  outerGimbalGroup.add(outerGimbalMesh);

  // Part 7: Brushed Titanium Outer Trim Collar
  const outerCollarGeo = createBeveledRingGeometry(2.54, 2.61, 0.045, 0.014, 144);
  const outerCollarMesh = new THREE.Mesh(outerCollarGeo, titaniumMat);
  outerCollarMesh.rotation.x = Math.PI * 0.5;
  outerCollarMesh.castShadow = true;
  outerGimbalGroup.add(outerCollarMesh);

  // Part 8: 24 Machined Vernier Calibration Pins flush around outer ring
  const pinCount = 24;
  const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12);
  const pinInstanced = new THREE.InstancedMesh(pinGeo, titaniumMat, pinCount);
  for (let i = 0; i < pinCount; i++) {
    const a = (i / pinCount) * Math.PI * 2;
    _dummy.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.setScalar(i % 6 === 0 ? 1.35 : 0.95);
    _dummy.updateMatrix();
    pinInstanced.setMatrixAt(i, _dummy.matrix);
  }
  pinInstanced.instanceMatrix.needsUpdate = true;
  pinInstanced.computeBoundingSphere();
  outerGimbalGroup.add(pinInstanced);
  assemblyGroup.add(outerGimbalGroup);

  // Part 9: 3 Smoothly Orbiting Precision Counterweight Spheres
  const orbiterGroup = new THREE.Group();
  orbiterGroup.rotation.set(-0.32, 0.22, 0.14);
  const orbiterGeo = new THREE.SphereGeometry(0.11, 24, 24);
  const orbiterMeshes: { mesh: THREE.Mesh; radius: number; speed: number; phase: number; yAmp: number }[] = [];
  const orbiterSpecs = [
    { radius: 3.15, speed: 0.24, phase: 0.4, yAmp: 0.28, mat: titaniumMat },
    { radius: 3.45, speed: -0.18, phase: 2.6, yAmp: 0.35, mat: anodizedMat },
    { radius: 3.8, speed: 0.14, phase: 4.5, yAmp: 0.22, mat: inlayAccentMat },
  ];
  for (const spec of orbiterSpecs) {
    const m = new THREE.Mesh(orbiterGeo, spec.mat);
    m.castShadow = true;
    orbiterGroup.add(m);
    orbiterMeshes.push({ mesh: m, radius: spec.radius, speed: spec.speed, phase: spec.phase, yAmp: spec.yAmp });
  }
  assemblyGroup.add(orbiterGroup);

  // Soft Ground Contact Shadow beneath the hovering sculpture
  const contactShadowGeo = new THREE.PlaneGeometry(7.5, 7.5);
  contactShadowGeo.rotateX(-Math.PI * 0.5);
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const contactShadowMesh = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  contactShadowMesh.position.set(4.2, -2.55, -2.2);
  scene.add(contactShadowMesh);

  // 3. Natural Floating Dust Bokeh (soft out-of-focus atmospheric particles)
  const dustCount = 320;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustSizes = new Float32Array(dustCount);
  const dustSeeds = new Float32Array(dustCount);

  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 32;
    dustPos[i * 3 + 1] = -2.5 + Math.random() * 12;
    dustPos[i * 3 + 2] = -1 - Math.random() * 24;
    dustSizes[i] = 1.4 + Math.random() * 3.0;
    dustSeeds[i] = Math.random();
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSizes, 1));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeeds, 1));

  const dustMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uThemeMix: { value: currentThemeMix },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float aSize;
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        pos.x += sin(uTime * 0.22 + aSeed * 18.0) * 0.45;
        pos.y += cos(uTime * 0.18 + aSeed * 14.0) * 0.35;
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        float dist = max(-mvPos.z, 2.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = clamp(aSize * uPixelRatio * (52.0 / dist), 1.0, 9.0);
        vAlpha = 0.25 + 0.35 * sin(uTime * 0.8 + aSeed * 10.0);
      }
    `,
    fragmentShader: `
      uniform float uThemeMix;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;

        // Soft optical bokeh disc
        float disc = smoothstep(0.5, 0.12, d);
        vec3 darkCol = vec3(0.75, 0.86, 1.0);
        vec3 lightCol = vec3(0.28, 0.36, 0.48);
        vec3 col = mix(lightCol, darkCol, uThemeMix);
        float modeOpacity = mix(0.22, 0.48, uThemeMix);
        gl_FragColor = vec4(col, disc * vAlpha * modeOpacity);
      }
    `,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  let disposed = false;
  let frameId = 0;
  let timerId = 0;
  let hasPointer = false;
  let pointerStrength = 0;
  let pulseAge = 10;
  let pulseStrength = 0;
  let scrollProgress = 0;
  let smoothScroll = 0;

  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    hasPointer = true;
  };
  const onPointerDown = () => {
    if (prefersReduced) return;
    pulseAge = 0;
    pulseStrength = 1.0;
  };
  const onPointerLeave = () => {
    hasPointer = false;
  };
  const onScroll = () => {
    const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    scrollProgress = THREE.MathUtils.clamp(window.scrollY / docHeight, 0, 1);
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('mouseleave', onPointerLeave);
  onScroll();

  const onContextLost = (e: Event) => {
    e.preventDefault();
    onContextLossChange?.(true);
  };
  const onContextRestored = () => {
    onContextLossChange?.(false);
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

  const updateResponsiveLayout = (w: number, h: number) => {
    const aspect = w / h;
    if (aspect < 0.85) {
      assemblyGroup.position.set(1.2, 1.5, -4.6);
      assemblyGroup.scale.setScalar(0.68);
      contactShadowMesh.position.set(1.2, -2.55, -4.6);
      contactShadowMesh.scale.setScalar(0.68);
    } else {
      assemblyGroup.position.set(4.2, 0.55, -2.2);
      assemblyGroup.scale.setScalar(1.0);
      contactShadowMesh.position.set(4.2, -2.55, -2.2);
      contactShadowMesh.scale.setScalar(1.0);
    }
  };
  updateResponsiveLayout(width, height);

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = Math.max(entry.contentRect.width, 1);
      const h = Math.max(entry.contentRect.height, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      dustMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      updateResponsiveLayout(w, h);
    }
  });
  resizeObserver.observe(container);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  const clock = new THREE.Clock();
  const registerTimer = (id: number) => {
    timerId = id;
  };

  function updateScene(elapsed: number, delta: number) {
    currentThemeMix = THREE.MathUtils.damp(currentThemeMix, targetThemeMix, 5.0, delta);
    smoothScroll = THREE.MathUtils.damp(smoothScroll, scrollProgress, 4.0, delta);

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
    }
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
    }

    // Calibrated studio lighting & material realism per theme
    hemiLight.intensity = THREE.MathUtils.lerp(0.95, 0.35, currentThemeMix);
    keyLight.color.copy(LIGHT_KEY_COLOR).lerp(DARK_KEY_COLOR, currentThemeMix);
    keyLight.intensity = THREE.MathUtils.lerp(2.1, 2.35, currentThemeMix);
    rimLight.color.copy(LIGHT_RIM_COLOR).lerp(DARK_RIM_COLOR, currentThemeMix);
    rimLight.intensity = THREE.MathUtils.lerp(0.85, 1.25, currentThemeMix);

    if (softboxA) softboxA.intensity = THREE.MathUtils.lerp(3.2, 4.8, currentThemeMix);
    if (softboxB) softboxB.intensity = THREE.MathUtils.lerp(2.0, 3.0, currentThemeMix);

    terrainMat.color.copy(LIGHT_TERRAIN_COLOR).lerp(DARK_TERRAIN_COLOR, currentThemeMix);
    terrainMat.envMapIntensity = THREE.MathUtils.lerp(0.45, 0.55, currentThemeMix);

    titaniumMat.color.copy(LIGHT_TITANIUM).lerp(DARK_TITANIUM, currentThemeMix);
    anodizedMat.color.copy(LIGHT_ANODIZED).lerp(DARK_ANODIZED, currentThemeMix);
    coreMat.color.copy(LIGHT_CORE_COLOR).lerp(DARK_CORE_COLOR, currentThemeMix);
    opticalGlassMat.color.copy(LIGHT_GLASS_TINT).lerp(DARK_GLASS_TINT, currentThemeMix);
    inlayAccentMat.emissiveIntensity = THREE.MathUtils.lerp(0.28, 0.72, currentThemeMix);
    contactShadowMat.opacity = THREE.MathUtils.lerp(0.22, 0.45, currentThemeMix);

    // Raycast onto sculpted terrain for subtle responsive wave swell
    if (hasPointer && !prefersReduced) {
      _raycaster.setFromCamera(_pointerNdc, camera);
      if (_raycaster.ray.intersectPlane(_terrainPlane, _hitPoint)) {
        _smoothHit.x = THREE.MathUtils.damp(_smoothHit.x, _hitPoint.x, 5.5, delta);
        _smoothHit.z = THREE.MathUtils.damp(_smoothHit.z, _hitPoint.z, 5.5, delta);
      }
      pointerStrength = THREE.MathUtils.damp(pointerStrength, 1.0, 4.5, delta);
    } else {
      pointerStrength = THREE.MathUtils.damp(pointerStrength, 0.0, 2.5, delta);
    }

    if (!prefersReduced) {
      pulseAge += delta;
      pulseStrength = THREE.MathUtils.damp(pulseStrength, 0, 1.8, delta);
    }

    const animTime = prefersReduced ? 0.4 : elapsed;
    terrainUniforms.uTime.value = animTime;
    terrainUniforms.uPointer.value.set(_smoothHit.x, _smoothHit.z + 10);
    terrainUniforms.uPointerStrength.value = pointerStrength;
    terrainUniforms.uPulseAge.value = pulseAge;
    terrainUniforms.uPulseStrength.value = pulseStrength;

    dustMat.uniforms.uTime.value = animTime;
    dustMat.uniforms.uThemeMix.value = currentThemeMix;

    // Natural weighted levitation & damped gimbal precession
    const baseY = window.innerWidth / Math.max(window.innerHeight, 1) < 0.85 ? 1.5 : 0.55;
    const hoverFloat = prefersReduced ? 0 : Math.sin(animTime * 0.75) * 0.14;
    assemblyGroup.position.y = baseY + hoverFloat;

    const impulseBoost = 1.0 + pulseStrength * 0.85;
    innerCoreMesh.rotation.y = animTime * 0.16 * impulseBoost;
    innerCoreMesh.rotation.z = Math.sin(animTime * 0.32) * 0.12;

    innerGimbalGroup.rotation.x = Math.sin(animTime * 0.24) * 0.26 + animTime * 0.11;
    innerGimbalGroup.rotation.y = animTime * 0.19 * impulseBoost;

    outerGimbalGroup.rotation.z = 0.18 + Math.sin(animTime * 0.18) * 0.14;
    outerGimbalGroup.rotation.y = -0.32 - animTime * 0.11 * impulseBoost;

    for (let i = 0; i < orbiterMeshes.length; i++) {
      const o = orbiterMeshes[i];
      const ang = animTime * o.speed + o.phase;
      o.mesh.position.set(
        Math.cos(ang) * o.radius,
        Math.sin(ang * 1.5) * o.yAmp,
        Math.sin(ang) * o.radius
      );
    }

    // Subtle camera parallax & smooth scroll depth
    const targetCamX = hasPointer && !prefersReduced ? _pointerNdc.x * 0.52 : 0;
    const targetCamY =
      (hasPointer && !prefersReduced ? _pointerNdc.y * 0.34 : 0) + 1.45 - smoothScroll * 0.9;
    const targetCamZ = 13.8 - smoothScroll * 1.65;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3.0, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.0, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 3.2, delta);
    camera.lookAt(0, -0.25 - smoothScroll * 0.35, 0);
  }

  function tick() {
    if (disposed) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    updateScene(elapsed, delta);
    renderer.render(scene, camera);

    if (prefersReduced && Math.abs(currentThemeMix - targetThemeMix) < 0.005) {
      return;
    }

    if (isSoftwareGl) {
      afterDraw(renderer, tick, registerTimer);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  updateScene(0, 0.016);
  tick();

  return {
    setTheme: (theme: ThemeMode) => {
      targetThemeMix = theme === 'dark' ? 1 : 0;
      if (prefersReduced) {
        currentThemeMix = targetThemeMix;
        updateScene(0, 0.016);
        renderer.render(scene, camera);
      } else {
        pulseAge = 0;
        pulseStrength = 0.7;
      }
    },
    triggerPulse: () => {
      if (!prefersReduced) {
        pulseAge = 0;
        pulseStrength = 1.0;
      }
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onPointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      terrainGeo.dispose();
      terrainMat.dispose();
      innerCoreGeo.dispose();
      equatorGeo.dispose();
      glassShellGeo.dispose();
      innerGimbalGeo.dispose();
      axleGeo.dispose();
      outerGimbalGeo.dispose();
      outerCollarGeo.dispose();
      pinGeo.dispose();
      orbiterGeo.dispose();
      contactShadowGeo.dispose();
      contactShadowMat.dispose();
      titaniumMat.dispose();
      anodizedMat.dispose();
      coreMat.dispose();
      opticalGlassMat.dispose();
      inlayAccentMat.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
      terrainMaps.bumpMap.dispose();
      terrainMaps.roughnessMap.dispose();
      shadowTex.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
