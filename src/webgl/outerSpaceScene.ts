import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { afterDraw, detectSoftwareWebGL } from './glUtils';

export type ThemeMode = 'light' | 'dark';

export interface OuterSpaceController {
  setTheme: (theme: ThemeMode) => void;
  triggerPulse: () => void;
  dispose: () => void;
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _pointerNdc = new THREE.Vector2(0, 0);
const _dummy = new THREE.Object3D();
const _tempColor = new THREE.Color();

const LIGHT_BG = new THREE.Color('#F4F7FB');
const DARK_BG = new THREE.Color('#02030A');
const LIGHT_FOG = new THREE.Color('#F4F7FB');
const DARK_FOG = new THREE.Color('#02030A');

const LIGHT_KEY_COLOR = new THREE.Color('#FFFFFF');
const DARK_KEY_COLOR = new THREE.Color('#E8F1FF');
const LIGHT_RIM_COLOR = new THREE.Color('#3B82F6');
const DARK_RIM_COLOR = new THREE.Color('#38BDF8');

const LIGHT_PLANET_TINT = new THREE.Color('#DCE7F7');
const DARK_PLANET_TINT = new THREE.Color('#FFFFFF');

const LIGHT_ATMOS_COLOR = new THREE.Color('#2563EB');
const DARK_ATMOS_COLOR = new THREE.Color('#38BDF8');

/**
 * Generates a soft procedural nebula cloud texture with organic multi-octave FBM noise.
 */
function createNebulaTexture(
  palette: [string, string, string],
  seedOffset: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const hash = (n: number) => {
    const x = Math.sin(n + seedOffset) * 43758.5453123;
    return x - Math.floor(x);
  };

  // Layer translucent radial cloud puffs into an organic nebula filament
  for (let i = 0; i < 42; i++) {
    const angle = hash(i * 1.37) * Math.PI * 2;
    const dist = Math.pow(hash(i * 2.91), 0.75) * (size * 0.28);
    const cx = size * 0.5 + Math.cos(angle) * dist * 1.15;
    const cy = size * 0.5 + Math.sin(angle) * dist * 0.75;
    const radius = size * (0.14 + hash(i * 4.13) * 0.24);

    const col = palette[i % palette.length];
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, col);
    grad.addColorStop(0.45, col.replace(/[\d.]+\)$/, '0.09)'));
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mask edges cleanly to zero so plane bounds are never visible
  ctx.globalCompositeOperation = 'destination-in';
  const mask = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.08,
    size * 0.5,
    size * 0.5,
    size * 0.49
  );
  mask.addColorStop(0, 'rgba(255,255,255,1)');
  mask.addColorStop(0.65, 'rgba(255,255,255,0.55)');
  mask.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates banded gas-giant albedo + surface bump maps.
 */
function createPlanetTextures(maxAnisotropy: number): {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 1024;
  const h = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const aCtx = albedoCanvas.getContext('2d')!;
  const aImg = aCtx.createImageData(w, h);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;
  const bImg = bCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const lat = (v - 0.5) * Math.PI;
    // Zonal atmospheric jets & storm bands
    const bandBase =
      Math.sin(v * 26.0) * 0.35 +
      Math.sin(v * 54.0 + 1.2) * 0.22 +
      Math.cos(v * 11.0 - 0.4) * 0.43;

    for (let x = 0; x < w; x++) {
      const u = x / w;
      const lon = u * Math.PI * 2;

      // Smooth seamless longitudinal swirl harmonics
      const eddy =
        Math.sin(lon * 3.0 + bandBase * 2.1) * 0.16 +
        Math.cos(lon * 7.0 - v * 18.0) * 0.08 +
        Math.sin(lon * 13.0 + v * 33.0) * 0.04;

      const polarShade = Math.cos(lat) * 0.35 + 0.65;
      const bandVal = THREE.MathUtils.clamp((bandBase + eddy) * 0.5 + 0.5, 0, 1);

      // Deep space cobalt-obsidian & silver-ice atmospheric bands
      const r = Math.round((12 + bandVal * 46) * polarShade);
      const g = Math.round((24 + bandVal * 92 + Math.pow(bandVal, 2.2) * 44) * polarShade);
      const b = Math.round((54 + bandVal * 158 + Math.pow(bandVal, 1.8) * 38) * polarShade);

      const idx = (y * w + x) * 4;
      aImg.data[idx] = THREE.MathUtils.clamp(r, 0, 255);
      aImg.data[idx + 1] = THREE.MathUtils.clamp(g, 0, 255);
      aImg.data[idx + 2] = THREE.MathUtils.clamp(b, 0, 255);
      aImg.data[idx + 3] = 255;

      const bumpVal = Math.round(bandVal * 255);
      bImg.data[idx] = bumpVal;
      bImg.data[idx + 1] = bumpVal;
      bImg.data[idx + 2] = bumpVal;
      bImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.anisotropy = maxAnisotropy;
  albedoMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  return { albedoMap, bumpMap };
}

/**
 * Generates radial concentric planetary ring texture with Cassini division & icy dust bands.
 */
function createRingTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 32;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);

  for (let x = 0; x < w; x++) {
    const t = x / (w - 1); // 0 = inner radius, 1 = outer radius
    const edgeFade = Math.sin(t * Math.PI);
    const cassiniGap = 1.0 - Math.exp(-Math.pow((t - 0.61) / 0.035, 2)) * 0.92;
    const innerGap = 1.0 - Math.exp(-Math.pow((t - 0.27) / 0.022, 2)) * 0.7;

    const ringlets =
      0.55 +
      0.24 * Math.sin(t * 95.0) +
      0.14 * Math.cos(t * 210.0) +
      0.07 * Math.sin(t * 420.0);

    const alpha = THREE.MathUtils.clamp(
      edgeFade * cassiniGap * innerGap * ringlets * 0.9,
      0,
      1
    );

    const r = Math.round(145 + ringlets * 70);
    const g = Math.round(188 + ringlets * 56);
    const b = Math.round(235 + ringlets * 20);
    const a = Math.round(alpha * 255);

    for (let y = 0; y < h; y++) {
      const idx = (y * w + x) * 4;
      img.data[idx] = THREE.MathUtils.clamp(r, 0, 255);
      img.data[idx + 1] = THREE.MathUtils.clamp(g, 0, 255);
      img.data[idx + 2] = THREE.MathUtils.clamp(b, 0, 255);
      img.data[idx + 3] = a;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates cratered rocky moon albedo & bump textures.
 */
function createMoonTextures(maxAnisotropy: number): {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 256;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  aCtx.fillStyle = '#8b99ad';
  aCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const hash = (n: number) => {
    const x = Math.sin(n * 17.31) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 48; i++) {
    const cx = hash(i + 1) * size;
    const cy = hash(i + 91) * size;
    const r = 4 + hash(i + 173) * 18;

    const aGrad = aCtx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
    aGrad.addColorStop(0, 'rgba(42, 50, 64, 0.55)');
    aGrad.addColorStop(0.75, 'rgba(65, 76, 94, 0.35)');
    aGrad.addColorStop(0.92, 'rgba(185, 200, 222, 0.45)');
    aGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    aCtx.fillStyle = aGrad;
    aCtx.beginPath();
    aCtx.arc(cx, cy, r, 0, Math.PI * 2);
    aCtx.fill();

    const bGrad = bCtx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    bGrad.addColorStop(0, 'rgba(40, 40, 40, 0.75)');
    bGrad.addColorStop(0.85, 'rgba(215, 215, 215, 0.65)');
    bGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.arc(cx, cy, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.anisotropy = maxAnisotropy;
  albedoMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  return { albedoMap, bumpMap };
}

export function initOuterSpaceScene(
  container: HTMLElement,
  initialTheme: ThemeMode,
  onContextLossChange?: (lost: boolean) => void
): OuterSpaceController {
  const isSoftwareGl = detectSoftwareWebGL();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetThemeMix = initialTheme === 'dark' ? 1 : 0;
  let currentThemeMix = targetThemeMix;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color().copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
  scene.fog = new THREE.FogExp2(
    new THREE.Color().copy(LIGHT_FOG).lerp(DARK_FOG, currentThemeMix).getHex(),
    0.011
  );

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);

  const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 220);
  camera.position.set(0, 0.4, 15.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  // Studio environment reflections for metallic/orbital highlights
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  // 3-Point Solar Space Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xcbe2ff, 0x0b1021, 0.35);
  scene.add(hemiLight);

  const solarKeyLight = new THREE.DirectionalLight(0xe8f1ff, 2.3);
  solarKeyLight.position.set(14, 9, 10);
  scene.add(solarKeyLight);

  const cosmicRimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
  cosmicRimLight.position.set(-14, -6, -8);
  scene.add(cosmicRimLight);

  // 1. Multi-Depth Twinkling 3D Starfield (2,600 stars across foreground & galactic core)
  const starCount = 2600;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starPhases = new Float32Array(starCount);
  const starTemps = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const isGalacticBand = i < starCount * 0.45;
    let x: number;
    let y: number;
    let z: number;

    if (isGalacticBand) {
      // Tilted Milky Way band sweeping diagonally across the background
      const spread = (Math.random() - 0.5) * 95;
      const bandThickness = (Math.random() - 0.5) * 14 + (Math.random() - 0.5) * 8;
      x = spread;
      y = spread * 0.36 + bandThickness;
      z = -18 - Math.random() * 75;
    } else {
      const r = 18 + Math.random() * 88;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      x = r * Math.sin(phi) * Math.cos(theta) * 1.4;
      y = r * Math.sin(phi) * Math.sin(theta);
      z = -Math.abs(r * Math.cos(phi)) - 6;
    }

    starPos[i * 3] = x;
    starPos[i * 3 + 1] = y;
    starPos[i * 3 + 2] = z;

    starSizes[i] = Math.pow(Math.random(), 2.2) * 3.8 + 0.8;
    starPhases[i] = Math.random() * Math.PI * 2;
    starTemps[i] = Math.random();
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));
  starGeo.setAttribute('aTemp', new THREE.BufferAttribute(starTemps, 1));

  const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uThemeMix: { value: currentThemeMix },
      uWarp: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      attribute float aTemp;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uWarp;
      varying float vTwinkle;
      varying float vTemp;

      void main() {
        vec3 pos = position;
        pos.z += uWarp * 3.5;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float dist = max(-mvPosition.z, 2.0);
        gl_Position = projectionMatrix * mvPosition;
        float twinkle = 0.62 + 0.38 * sin(uTime * (1.2 + aTemp * 1.8) + aPhase);
        vTwinkle = twinkle;
        vTemp = aTemp;
        gl_PointSize = clamp(aSize * uPixelRatio * (115.0 / dist) * (0.85 + 0.25 * twinkle), 1.0, 14.0);
      }
    `,
    fragmentShader: `
      uniform float uThemeMix;
      varying float vTwinkle;
      varying float vTemp;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;

        float core = exp(-d * d * 28.0);
        float halo = smoothstep(0.5, 0.0, d) * 0.45;
        float alpha = clamp(core + halo, 0.0, 1.0) * vTwinkle;

        // Spectral star tints in Dark mode (cyan-white, pure white, soft amber)
        vec3 darkCold = vec3(0.62, 0.84, 1.0);
        vec3 darkMid = vec3(0.96, 0.98, 1.0);
        vec3 darkWarm = vec3(1.0, 0.86, 0.68);
        vec3 darkStar = vTemp < 0.5
          ? mix(darkCold, darkMid, vTemp * 2.0)
          : mix(darkMid, darkWarm, (vTemp - 0.5) * 2.0);

        // Astronomical ink star tints in Light mode
        vec3 lightCold = vec3(0.08, 0.42, 0.92);
        vec3 lightSlate = vec3(0.24, 0.32, 0.46);
        vec3 lightStar = mix(lightCold, lightSlate, vTemp);

        vec3 color = mix(lightStar, darkStar, uThemeMix);
        float modeOpacity = mix(0.42, 0.95, uThemeMix);
        gl_FragColor = vec4(color, alpha * modeOpacity);
      }
    `,
  });

  const starPoints = new THREE.Points(starGeo, starMaterial);
  scene.add(starPoints);

  // 2. Layered Volumetric Cosmic Nebula Clouds
  const nebulaTexA = createNebulaTexture(
    ['rgba(22, 119, 255, 0.24)', 'rgba(56, 189, 248, 0.16)', 'rgba(99, 102, 241, 0.18)'],
    1.7,
    maxAnisotropy
  );
  const nebulaTexB = createNebulaTexture(
    ['rgba(30, 64, 175, 0.22)', 'rgba(14, 165, 233, 0.15)', 'rgba(125, 211, 252, 0.12)'],
    7.4,
    maxAnisotropy
  );

  const nebulaGeo = new THREE.PlaneGeometry(58, 36);
  const nebulaMatA = new THREE.MeshBasicMaterial({
    map: nebulaTexA,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const nebulaMatB = new THREE.MeshBasicMaterial({
    map: nebulaTexB,
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const nebulaGroup = new THREE.Group();
  const nebulaMeshA = new THREE.Mesh(nebulaGeo, nebulaMatA);
  nebulaMeshA.position.set(-7, 2.5, -24);
  nebulaMeshA.rotation.z = 0.24;
  nebulaGroup.add(nebulaMeshA);

  const nebulaMeshB = new THREE.Mesh(nebulaGeo, nebulaMatB);
  nebulaMeshB.position.set(10, -3.5, -30);
  nebulaMeshB.rotation.z = -0.31;
  nebulaMeshB.scale.set(1.18, 1.05, 1);
  nebulaGroup.add(nebulaMeshB);

  scene.add(nebulaGroup);

  // 3. Composite Multi-Part Celestial Centerpiece (Planet + Atmospheric Rim + Ring System + Moon + Orbital Ring)
  const celestialSystem = new THREE.Group();
  celestialSystem.position.set(4.8, 0.3, -4.5);
  celestialSystem.rotation.set(0.18, -0.25, 0.22);
  scene.add(celestialSystem);

  const planetTextures = createPlanetTextures(maxAnisotropy);
  const planetGeo = new THREE.SphereGeometry(2.65, 64, 64);
  const planetMat = new THREE.MeshPhysicalMaterial({
    map: planetTextures.albedoMap,
    bumpMap: planetTextures.bumpMap,
    bumpScale: 0.04,
    roughness: 0.62,
    metalness: 0.12,
    clearcoat: 0.22,
    clearcoatRoughness: 0.45,
    envMapIntensity: 0.4,
  });
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  celestialSystem.add(planetMesh);

  // Atmospheric Fresnel Halo Shell
  const atmosGeo = new THREE.SphereGeometry(2.79, 64, 64);
  const atmosMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color().copy(DARK_ATMOS_COLOR) },
      uIntensity: { value: 0.85 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float rim = pow(clamp(0.68 - dot(vNormal, -viewDir), 0.0, 1.0), 2.8);
        gl_FragColor = vec4(uColor, rim * uIntensity);
      }
    `,
  });
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  celestialSystem.add(atmosMesh);

  // Planetary Ring System with radial UVs (inner -> outer radius mapping)
  const ringInner = 3.55;
  const ringOuter = 6.25;
  const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 128, 1);
  const ringPos = ringGeo.attributes.position;
  const ringUv = ringGeo.attributes.uv;
  for (let i = 0; i < ringPos.count; i++) {
    const vx = ringPos.getX(i);
    const vy = ringPos.getY(i);
    const radius = Math.sqrt(vx * vx + vy * vy);
    const u = (radius - ringInner) / (ringOuter - ringInner);
    ringUv.setXY(i, u, 0.5);
  }
  ringUv.needsUpdate = true;

  const ringTex = createRingTexture(maxAnisotropy);
  const ringMat = new THREE.MeshStandardMaterial({
    map: ringTex,
    transparent: true,
    opacity: 0.88,
    roughness: 0.42,
    metalness: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI * 0.46;
  celestialSystem.add(ringMesh);

  // Precision hairline orbital telemetry arc around the planet
  const orbitArcGeo = new THREE.TorusGeometry(6.95, 0.014, 12, 160);
  const orbitArcMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.25,
    metalness: 0.85,
    transparent: true,
    opacity: 0.32,
  });
  const orbitArcMesh = new THREE.Mesh(orbitArcGeo, orbitArcMat);
  orbitArcMesh.rotation.x = Math.PI * 0.46;
  celestialSystem.add(orbitArcMesh);

  // Orbiting Cratered Moon
  const moonPivot = new THREE.Group();
  moonPivot.rotation.z = 0.08;
  celestialSystem.add(moonPivot);

  const moonTextures = createMoonTextures(maxAnisotropy);
  const moonGeo = new THREE.SphereGeometry(0.42, 32, 32);
  const moonMat = new THREE.MeshStandardMaterial({
    map: moonTextures.albedoMap,
    bumpMap: moonTextures.bumpMap,
    bumpScale: 0.025,
    roughness: 0.82,
    metalness: 0.05,
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.position.set(-5.6, 0.45, 2.2);
  moonPivot.add(moonMesh);

  // 4. Instanced Asteroid Belt / Ice Shards drifting along orbital plane
  const asteroidCount = 120;
  const asteroidGeo = new THREE.DodecahedronGeometry(0.08, 0);
  const asteroidMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.65,
    metalness: 0.35,
  });
  const asteroidInstanced = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount);
  asteroidInstanced.frustumCulled = false;

  const asteroidAngles = new Float32Array(asteroidCount);
  const asteroidRadii = new Float32Array(asteroidCount);
  const asteroidHeights = new Float32Array(asteroidCount);
  const asteroidScales = new Float32Array(asteroidCount);
  const asteroidSpeeds = new Float32Array(asteroidCount);

  for (let i = 0; i < asteroidCount; i++) {
    asteroidAngles[i] = (i / asteroidCount) * Math.PI * 2 + Math.random() * 0.15;
    asteroidRadii[i] = 3.75 + Math.random() * 2.55;
    asteroidHeights[i] = (Math.random() - 0.5) * 0.18;
    asteroidScales[i] = 0.45 + Math.random() * 1.15;
    asteroidSpeeds[i] = 0.03 + Math.random() * 0.04;

    const shade = 0.55 + Math.random() * 0.45;
    _tempColor.setRGB(shade * 0.85, shade * 0.92, shade);
    asteroidInstanced.setColorAt(i, _tempColor);
  }
  if (asteroidInstanced.instanceColor) {
    asteroidInstanced.instanceColor.needsUpdate = true;
  }

  const asteroidBeltGroup = new THREE.Group();
  asteroidBeltGroup.rotation.x = Math.PI * 0.46;
  asteroidBeltGroup.add(asteroidInstanced);
  celestialSystem.add(asteroidBeltGroup);

  // 5. Subtle Shooting Star / Meteor Streaks
  const meteorCount = 3;
  const meteorGeo = new THREE.CylinderGeometry(0.004, 0.022, 2.2, 6);
  meteorGeo.rotateZ(Math.PI * 0.5);
  const meteorMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const meteors: {
    mesh: THREE.Mesh;
    active: boolean;
    age: number;
    duration: number;
    startX: number;
    startY: number;
    startZ: number;
    vx: number;
    vy: number;
  }[] = [];

  for (let i = 0; i < meteorCount; i++) {
    const m = new THREE.Mesh(meteorGeo, meteorMat.clone());
    m.visible = false;
    scene.add(m);
    meteors.push({
      mesh: m,
      active: false,
      age: 0,
      duration: 0.9,
      startX: 0,
      startY: 0,
      startZ: -12,
      vx: -18,
      vy: -7,
    });
  }

  const spawnMeteor = () => {
    const slot = meteors.find((m) => !m.active);
    if (!slot) return;
    slot.active = true;
    slot.age = 0;
    slot.duration = 0.75 + Math.random() * 0.45;
    slot.startX = 6 + Math.random() * 14;
    slot.startY = 3 + Math.random() * 7;
    slot.startZ = -8 - Math.random() * 12;
    slot.vx = -(18 + Math.random() * 10);
    slot.vy = -(6 + Math.random() * 5);
    slot.mesh.rotation.z = Math.atan2(slot.vy, slot.vx);
    slot.mesh.position.set(slot.startX, slot.startY, slot.startZ);
    slot.mesh.visible = true;
  };

  let disposed = false;
  let frameId = 0;
  let timerId = 0;
  let hasPointer = false;
  let scrollProgress = 0;
  let smoothScroll = 0;
  let warpImpulse = 0;
  let nextMeteorCountdown = 2.4;

  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    hasPointer = true;
  };
  const onPointerDown = () => {
    if (prefersReduced) return;
    warpImpulse = 0.85;
    spawnMeteor();
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
    // Keep planet elegantly framed to the right on wide viewports and higher/smaller on mobile
    if (aspect < 0.85) {
      celestialSystem.position.set(1.6, 2.2, -7.2);
      celestialSystem.scale.setScalar(0.72);
    } else {
      celestialSystem.position.set(4.9, 0.2, -4.8);
      celestialSystem.scale.setScalar(1.0);
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
      starMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
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
    warpImpulse = THREE.MathUtils.damp(warpImpulse, 0, 3.2, delta);

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
    }
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(LIGHT_FOG).lerp(DARK_FOG, currentThemeMix);
      scene.fog.density = THREE.MathUtils.lerp(0.015, 0.009, currentThemeMix);
    }

    // Theme-reactive lighting & celestial opacity
    hemiLight.intensity = THREE.MathUtils.lerp(0.85, 0.24, currentThemeMix);
    solarKeyLight.color.copy(LIGHT_KEY_COLOR).lerp(DARK_KEY_COLOR, currentThemeMix);
    solarKeyLight.intensity = THREE.MathUtils.lerp(1.9, 2.45, currentThemeMix);
    cosmicRimLight.color.copy(LIGHT_RIM_COLOR).lerp(DARK_RIM_COLOR, currentThemeMix);
    cosmicRimLight.intensity = THREE.MathUtils.lerp(0.75, 1.35, currentThemeMix);

    planetMat.color.copy(LIGHT_PLANET_TINT).lerp(DARK_PLANET_TINT, currentThemeMix);
    planetMat.roughness = THREE.MathUtils.lerp(0.48, 0.62, currentThemeMix);

    atmosMat.uniforms.uColor.value.copy(LIGHT_ATMOS_COLOR).lerp(DARK_ATMOS_COLOR, currentThemeMix);
    atmosMat.uniforms.uIntensity.value = THREE.MathUtils.lerp(0.28, 0.92, currentThemeMix);

    ringMat.opacity = THREE.MathUtils.lerp(0.36, 0.88, currentThemeMix);
    orbitArcMat.opacity = THREE.MathUtils.lerp(0.24, 0.36, currentThemeMix);

    // Nebula blending switches gracefully between additive cosmic glow (dark) and subtle slate wisps (light)
    const isDark = currentThemeMix > 0.35;
    const targetBlend = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (nebulaMatA.blending !== targetBlend) {
      nebulaMatA.blending = targetBlend;
      nebulaMatB.blending = targetBlend;
      nebulaMatA.needsUpdate = true;
      nebulaMatB.needsUpdate = true;
    }
    nebulaMatA.opacity = THREE.MathUtils.lerp(0.16, 0.65, currentThemeMix);
    nebulaMatB.opacity = THREE.MathUtils.lerp(0.14, 0.55, currentThemeMix);

    const animTime = prefersReduced ? 0.5 : elapsed;
    starMaterial.uniforms.uTime.value = animTime;
    starMaterial.uniforms.uThemeMix.value = currentThemeMix;
    starMaterial.uniforms.uWarp.value = warpImpulse;

    // Gentle orbital rotation & parallax camera drift
    planetMesh.rotation.y = animTime * 0.065;
    moonPivot.rotation.y = animTime * 0.16;
    moonMesh.rotation.y = animTime * 0.25;
    orbitArcMesh.rotation.z = animTime * 0.08;
    nebulaGroup.rotation.z = Math.sin(animTime * 0.04) * 0.03;

    // Update instanced asteroid shards along ring plane (zero allocations)
    for (let i = 0; i < asteroidCount; i++) {
      const a = asteroidAngles[i] + animTime * asteroidSpeeds[i];
      const r = asteroidRadii[i];
      _dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, asteroidHeights[i]);
      _dummy.rotation.set(a * 1.4, a * 0.9, i);
      _dummy.scale.setScalar(asteroidScales[i]);
      _dummy.updateMatrix();
      asteroidInstanced.setMatrixAt(i, _dummy.matrix);
    }
    asteroidInstanced.instanceMatrix.needsUpdate = true;

    // Camera parallax & scroll-driven deep-space drift
    const targetCamX = hasPointer && !prefersReduced ? _pointerNdc.x * 0.65 : 0;
    const targetCamY =
      (hasPointer && !prefersReduced ? _pointerNdc.y * 0.42 : 0) + 0.4 - smoothScroll * 1.4;
    const targetCamZ = 15.5 - smoothScroll * 1.6 - warpImpulse * 0.7;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3.2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 3.5, delta);
    camera.lookAt(0, -smoothScroll * 0.5, 0);

    // Subtle rotation of background starfield for immersive depth
    starPoints.rotation.y = animTime * 0.008 + (hasPointer && !prefersReduced ? _pointerNdc.x * 0.03 : 0);
    starPoints.rotation.x = smoothScroll * 0.08 - (hasPointer && !prefersReduced ? _pointerNdc.y * 0.02 : 0);

    // Shooting star updates
    if (!prefersReduced) {
      nextMeteorCountdown -= delta;
      if (nextMeteorCountdown <= 0) {
        spawnMeteor();
        nextMeteorCountdown = 4.2 + Math.random() * 5.0;
      }

      for (let i = 0; i < meteors.length; i++) {
        const m = meteors[i];
        if (!m.active) continue;
        m.age += delta;
        const p = m.age / m.duration;
        if (p >= 1) {
          m.active = false;
          m.mesh.visible = false;
          continue;
        }
        m.mesh.position.x = m.startX + m.vx * m.age;
        m.mesh.position.y = m.startY + m.vy * m.age;
        const mMat = m.mesh.material as THREE.MeshBasicMaterial;
        mMat.opacity = Math.sin(p * Math.PI) * THREE.MathUtils.lerp(0.28, 0.82, currentThemeMix);
      }
    }
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
        warpImpulse = 0.65;
      }
    },
    triggerPulse: () => {
      if (!prefersReduced) {
        warpImpulse = 1.0;
        spawnMeteor();
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

      starGeo.dispose();
      starMaterial.dispose();
      nebulaGeo.dispose();
      nebulaMatA.dispose();
      nebulaMatB.dispose();
      nebulaTexA.dispose();
      nebulaTexB.dispose();
      planetGeo.dispose();
      planetMat.dispose();
      planetTextures.albedoMap.dispose();
      planetTextures.bumpMap.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ringTex.dispose();
      orbitArcGeo.dispose();
      orbitArcMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      moonTextures.albedoMap.dispose();
      moonTextures.bumpMap.dispose();
      asteroidGeo.dispose();
      asteroidMat.dispose();
      meteorGeo.dispose();
      meteorMat.dispose();
      meteors.forEach((m) => (m.mesh.material as THREE.Material).dispose());
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
