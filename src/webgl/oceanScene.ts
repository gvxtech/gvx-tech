import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { afterDraw, detectSoftwareWebGL } from './glUtils';

export type ThemeMode = 'light' | 'dark';

export interface OceanController {
  setTheme: (theme: ThemeMode) => void;
  triggerRipple: () => void;
  dispose: () => void;
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _pointerNdc = new THREE.Vector2(99, 99);
const _raycaster = new THREE.Raycaster();
const _waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hitPoint = new THREE.Vector3(999, 0, 999);
const _smoothPointer = new THREE.Vector3(999, 0, 999);
const _sunBaseDir = new THREE.Vector3(0.32, 0.14, -0.94).normalize();
const _activeLightDir = new THREE.Vector3().copy(_sunBaseDir);

// Light Mode Palette: Bright Coastal Sky + Glowing Golden Sun + Deep Cerulean Swells + Whitecaps
const LIGHT_ZENITH = new THREE.Color('#7EC0F7');
const LIGHT_HORIZON = new THREE.Color('#E3F2FF');
const LIGHT_TROUGH = new THREE.Color('#05264A');
const LIGHT_MID = new THREE.Color('#0C5091');
const LIGHT_CREST = new THREE.Color('#128AC2');
const LIGHT_SSS = new THREE.Color('#1CC8D1');
const LIGHT_FOAM = new THREE.Color('#F8FCFF');
const LIGHT_SUN_COLOR = new THREE.Color('#FFF2CE');
const LIGHT_SUN_DISC = new THREE.Color('#FFFBF0');
const LIGHT_RIM_COLOR = new THREE.Color('#9ED8FF');
const LIGHT_HEMI_SKY = new THREE.Color('#E6F3FF');
const LIGHT_HEMI_GROUND = new THREE.Color('#093766');
const LIGHT_SPRAY = new THREE.Color('#FFFFFF');

// Dark Mode Palette: Pure Black Starry Night + Deep Midnight Ocean
const DARK_ZENITH = new THREE.Color('#000000');
const DARK_HORIZON = new THREE.Color('#030B17');
const DARK_TROUGH = new THREE.Color('#010307');
const DARK_MID = new THREE.Color('#030F22');
const DARK_CREST = new THREE.Color('#092952');
const DARK_SSS = new THREE.Color('#0E5DA8');
const DARK_FOAM = new THREE.Color('#70C5FF');
const DARK_STARLIGHT = new THREE.Color('#7AAEE8');
const DARK_RIM_COLOR = new THREE.Color('#1677FF');
const DARK_HEMI_SKY = new THREE.Color('#1F3F6B');
const DARK_HEMI_GROUND = new THREE.Color('#010205');
const DARK_SPRAY = new THREE.Color('#A8DAFF');

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generates a tileable liquid micro-ripple bump texture for capillary wave sparkle
 */
function createWaterCapillaryMap(maxAnisotropy: number, size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const twoPi = Math.PI * 2;

  for (let y = 0; y < size; y++) {
    const v = (y / size) * twoPi;
    for (let x = 0; x < size; x++) {
      const u = (x / size) * twoPi;
      const idx = (y * size + x) * 4;

      const w1 = Math.sin(u * 4 + Math.cos(v * 3) * 0.9);
      const w2 = Math.cos(v * 6 - Math.sin(u * 5) * 0.8);
      const w3 = Math.sin((u + v) * 9) * 0.55;
      const w4 = Math.cos((u * 3 - v * 4) * 5) * 0.45;
      const val = THREE.MathUtils.clamp(
        Math.round(128 + (w1 + w2 + w3 + w4) * 24),
        0,
        255
      );

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a soft radial mist/spray particle sprite (zero external assets)
 */
function createSoftSprayTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.35, 'rgba(220, 240, 255, 0.4)');
    grad.addColorStop(1, 'rgba(200, 230, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function initOceanScene(
  container: HTMLElement,
  initialTheme: ThemeMode,
  onContextLossChange?: (lost: boolean) => void
): OceanController {
  const isSoftwareGl = detectSoftwareWebGL();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Select a rendering profile once at startup. Desktop keeps the original
  // high-quality settings; mobile and constrained devices use fewer pixels,
  // vertices and fragment-shader noise octaves.
  const nav = navigator as Navigator & { deviceMemory?: number };
  const deviceMemory = nav.deviceMemory ?? 8;
  const cpuCores = nav.hardwareConcurrency ?? 8;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isMobileDevice = window.innerWidth <= 767 || (isCoarsePointer && window.innerWidth <= 1024);
  const isLowPowerDevice = isSoftwareGl || deviceMemory <= 4 || cpuCores <= 4;
  const isConstrainedDevice = isMobileDevice || isLowPowerDevice;
  const targetFps = isConstrainedDevice ? 30 : 60;
  const oceanSegmentsX = isMobileDevice
    ? (isLowPowerDevice ? 96 : 128)
    : (isLowPowerDevice ? 150 : 220);
  const oceanSegmentsY = isMobileDevice
    ? (isLowPowerDevice ? 78 : 104)
    : (isLowPowerDevice ? 122 : 180);
  const sprayCount = isMobileDevice ? 72 : (isLowPowerDevice ? 100 : 160);
  const capillaryTextureSize = isMobileDevice ? 128 : 256;
  const fbmOctaves = isConstrainedDevice ? 2 : 4;

  let targetThemeMix = initialTheme === 'dark' ? 1 : 0;
  let currentThemeMix = targetThemeMix;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color().copy(LIGHT_HORIZON).lerp(DARK_HORIZON, currentThemeMix);
  const fog = new THREE.FogExp2(scene.background.getHex(), 0.013);
  scene.fog = fog;

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 240);
  camera.position.set(0, 4.6, 15.8);
  camera.lookAt(0, 0.85, -18);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl && !isConstrainedDevice,
    powerPreference: isMobileDevice ? 'default' : 'high-performance',
    stencil: false,
    depth: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, isConstrainedDevice ? 1.25 : 2));
  renderer.setSize(width, height);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), isConstrainedDevice ? 0.07 : 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  const capillaryBump = createWaterCapillaryMap(Math.min(maxAnisotropy, isConstrainedDevice ? 4 : 8), capillaryTextureSize);
  const sprayTex = createSoftSprayTexture();

  // Outdoor Coastal / Moonlit Ocean Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xe6f3ff, 0x093766, 0.9);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff2ce, 2.5);
  sunLight.position.copy(_sunBaseDir).multiplyScalar(60);
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x9ed8ff, 0.95);
  rimLight.position.set(-18, 9, 12);
  scene.add(rimLight);

  // Atmospheric Sky Dome featuring Sun (Light Mode) & Starfield Night Sky (Dark Mode)
  const skyUniforms = {
    uTime: { value: 0 },
    uZenithColor: { value: LIGHT_ZENITH.clone() },
    uHorizonColor: { value: LIGHT_HORIZON.clone() },
    uSunDir: { value: _sunBaseDir.clone() },
    uSunColor: { value: LIGHT_SUN_COLOR.clone() },
    uSunDisc: { value: LIGHT_SUN_DISC.clone() },
    uThemeMix: { value: currentThemeMix },
  };

  const skyGeo = new THREE.SphereGeometry(150, 40, 28);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uZenithColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uSunDisc;
      uniform float uThemeMix;
      varying vec3 vWorldDir;

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float elev = clamp(dir.y, 0.0, 1.0);
        vec3 sky = mix(uHorizonColor, uZenithColor, pow(elev, 0.48));

        // 1. Light Mode: Warm Luminous Sun Disc + Atmospheric Corona
        float sunVisibility = smoothstep(0.65, 0.0, uThemeMix);
        if (sunVisibility > 0.001) {
          vec3 sDir = normalize(uSunDir);
          float sunDot = dot(dir, sDir);
          float sunHalo = pow(max(sunDot, 0.0), 10.0) * 0.42 + pow(max(sunDot, 0.0), 64.0) * 0.65;
          float sunDiscMask = smoothstep(0.99935, 0.99958, sunDot);
          float sunCorona = pow(max(sunDot, 0.0), 420.0) * 1.4;
          sky += (uSunColor * sunHalo + uSunDisc * (sunDiscMask * 2.2 + sunCorona)) * sunVisibility;
        }

        // 2. Dark Mode: Subtle Twinkling Midnight Starfield
        float nightVisibility = smoothstep(0.35, 1.0, uThemeMix);
        if (nightVisibility > 0.001 && dir.y > 0.015) {
          vec2 starUv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0))) * 95.0;
          vec2 starCell = floor(starUv);
          vec2 starFrac = fract(starUv) - 0.5;
          float rnd = hash21(starCell);
          if (rnd > 0.966) {
            float dStar = length(starFrac);
            float twinkle = 0.68 + 0.32 * sin(uTime * (1.1 + rnd * 1.8) + rnd * 40.0);
            float starBright = smoothstep(0.18, 0.0, dStar) * twinkle * smoothstep(0.015, 0.14, dir.y);
            sky += vec3(0.84, 0.91, 1.0) * starBright * 0.85 * nightVisibility;
          }
        }

        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // 1. High-Resolution Multi-Octave Gerstner Ocean Surface (PBR + Fresnel + SSS + Glitter + Lacy Foam)
  const oceanGeo = new THREE.PlaneGeometry(150, 120, oceanSegmentsX, oceanSegmentsY);
  oceanGeo.rotateX(-Math.PI / 2);

  const oceanUniforms = {
    uTime: { value: 0 },
    uThemeMix: { value: currentThemeMix },
    uPointer: { value: new THREE.Vector2(999, 999) },
    uPointerStrength: { value: 0 },
    uRippleCenter: { value: new THREE.Vector2(0, 2) },
    uRippleAge: { value: 99 },
    uRippleAmp: { value: 0 },
    uTroughColor: { value: LIGHT_TROUGH.clone() },
    uMidColor: { value: LIGHT_MID.clone() },
    uCrestColor: { value: LIGHT_CREST.clone() },
    uSssColor: { value: LIGHT_SSS.clone() },
    uFoamColor: { value: LIGHT_FOAM.clone() },
    uSkyHorizon: { value: LIGHT_HORIZON.clone() },
    uSkyZenith: { value: LIGHT_ZENITH.clone() },
    uSunColor: { value: LIGHT_SUN_COLOR.clone() },
    uSunDir: { value: _activeLightDir.clone() },
  };

  const oceanMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.07,
    metalness: 0.04,
    clearcoat: isConstrainedDevice ? 0.72 : 0.9,
    clearcoatRoughness: 0.06,
    reflectivity: 0.96,
    bumpMap: capillaryBump,
    bumpScale: isConstrainedDevice ? 0.018 : 0.025,
    envMapIntensity: 0.65,
  });

  oceanMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, oceanUniforms);

    const waveGlslHeader = /* glsl */ `
      uniform float uTime;
      uniform float uThemeMix;
      uniform vec2 uPointer;
      uniform float uPointerStrength;
      uniform vec2 uRippleCenter;
      uniform float uRippleAge;
      uniform float uRippleAmp;

      vec3 evalGerstner(vec2 xz, vec2 dir, float steepness, float wavelength, float speed, float t) {
        float k = 6.2831853 / wavelength;
        float c = sqrt(9.8 / k) * speed;
        vec2 d = normalize(dir);
        float f = k * (dot(d, xz) - c * t);
        float a = steepness / k;
        return vec3(
          d.x * (a * cos(f)),
          a * sin(f),
          d.y * (a * cos(f))
        );
      }

      vec4 evalOceanSurface(vec2 xz, float t) {
        vec3 disp = vec3(0.0);
        disp += evalGerstner(xz, vec2(0.86, 0.51), 0.19, 21.0, 0.44, t);
        disp += evalGerstner(xz, vec2(-0.58, 0.81), 0.16, 14.5, 0.48, t);
        disp += evalGerstner(xz, vec2(0.28, -0.96), 0.12, 9.4, 0.53, t);
        disp += evalGerstner(xz, vec2(-0.88, -0.46), 0.10, 6.2, 0.58, t);
        disp += evalGerstner(xz, vec2(0.62, 0.78), 0.075, 3.9, 0.64, t);
        disp += evalGerstner(xz, vec2(-0.34, 0.94), 0.055, 2.5, 0.72, t);
        disp += evalGerstner(xz, vec2(0.95, -0.31), 0.04, 1.65, 0.80, t);

        float pDist = length(xz - uPointer);
        float wake = exp(-pDist * 0.34) * sin(pDist * 2.9 - t * 4.4) * 0.19 * uPointerStrength;

        float rDist = length(xz - uRippleCenter);
        float waveFront = uRippleAge * 8.2;
        float ringEnvelope = exp(-abs(rDist - waveFront) * 0.48) * exp(-uRippleAge * 0.55);
        float ripple = sin((rDist - waveFront) * 2.8) * ringEnvelope * uRippleAmp;

        disp.y += wake + ripple;
        float foamSignal = clamp((disp.y - 0.16) * 1.15 + abs(ripple) * 1.45 + abs(wake) * 1.15, 0.0, 1.0);
        return vec4(disp, foamSignal);
      }
    `;

    shader.vertexShader =
      waveGlslHeader +
      /* glsl */ `
      varying float vWaveHeight;
      varying float vWaveFoam;
      varying float vSlope;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      ` +
      shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      /* glsl */ `
      #include <beginnormal_vertex>
      vec4 oceanCenter = evalOceanSurface(position.xz, uTime);
      float eps = 0.18;
      vec4 oceanDx = evalOceanSurface(position.xz + vec2(eps, 0.0), uTime);
      vec4 oceanDz = evalOceanSurface(position.xz + vec2(0.0, eps), uTime);

      vec3 pC = vec3(position.x + oceanCenter.x, oceanCenter.y, position.z + oceanCenter.z);
      vec3 pX = vec3(position.x + eps + oceanDx.x, oceanDx.y, position.z + oceanDx.z);
      vec3 pZ = vec3(position.x + oceanDz.x, oceanDz.y, position.z + eps + oceanDz.z);

      vec3 calcNormal = normalize(cross(pZ - pC, pX - pC));
      objectNormal = calcNormal;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
      #include <begin_vertex>
      transformed += oceanCenter.xyz;
      vWaveHeight = oceanCenter.y;
      vWaveFoam = oceanCenter.w;
      vSlope = 1.0 - clamp(calcNormal.y, 0.0, 1.0);
      vec4 oceanWorld = modelMatrix * vec4(transformed, 1.0);
      vWorldPos = oceanWorld.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * calcNormal);
      `
    );

    shader.fragmentShader =
      /* glsl */ `
      uniform float uTime;
      uniform float uThemeMix;
      uniform vec3 uTroughColor;
      uniform vec3 uMidColor;
      uniform vec3 uCrestColor;
      uniform vec3 uSssColor;
      uniform vec3 uFoamColor;
      uniform vec3 uSkyHorizon;
      uniform vec3 uSkyZenith;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      varying float vWaveHeight;
      varying float vWaveFoam;
      varying float vSlope;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbmWater(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
        for (int i = 0; i < ${fbmOctaves}; i++) {
          v += amp * valueNoise(p);
          p = rot * p * 2.05;
          amp *= 0.5;
        }
        return v;
      }

      vec3 evalCapillaryGradient(vec2 xz, float t) {
        float distFade = 1.0 - smoothstep(14.0, 74.0, length(cameraPosition.xz - xz));
        vec2 p1 = xz * 1.45 + vec2(t * 0.55, t * 0.32);
        vec2 p2 = xz * 2.75 + vec2(-t * 0.42, t * 0.68);
        vec2 p3 = xz * 5.20 + vec2(t * 0.78, -t * 0.46);

        float gx = cos(p1.x * 1.7 + sin(p1.y * 1.3)) * 0.085
                 + cos(p2.x * 2.1 - cos(p2.y * 1.9)) * 0.06
                 + (fbmWater(p3 * 0.65 + vec2(0.05, 0.0)) - fbmWater(p3 * 0.65 - vec2(0.05, 0.0))) * 1.35;

        float gz = sin(p1.y * 1.9 + cos(p1.x * 1.5)) * 0.085
                 + sin(p2.y * 2.3 + sin(p2.x * 1.7)) * 0.06
                 + (fbmWater(p3 * 0.65 + vec2(0.0, 0.05)) - fbmWater(p3 * 0.65 - vec2(0.0, 0.05))) * 1.35;

        return vec3(-gx, 0.0, -gz) * (0.25 + 0.75 * distFade);
      }
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      float hFactor = smoothstep(-0.65, 0.72, vWaveHeight);
      vec3 bodyCol = mix(uTroughColor, uMidColor, smoothstep(0.0, 0.55, hFactor));
      bodyCol = mix(bodyCol, uCrestColor, smoothstep(0.45, 1.0, hFactor));

      float foamNoise = fbmWater(vWorldPos.xz * 1.15 + vec2(uTime * 0.16, uTime * 0.09));
      float rawFoam = vWaveFoam * 0.72 + vSlope * 1.45;
      float lacyFoam = smoothstep(0.38, 0.72, rawFoam - foamNoise * 0.36);

      diffuseColor.rgb *= mix(bodyCol, uFoamColor, lacyFoam * mix(0.75, 0.42, uThemeMix));
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      /* glsl */ `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.55, lacyFoam * 0.85);
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      /* glsl */ `
      #include <normal_fragment_maps>
      vec3 capGradWorld = evalCapillaryGradient(vWorldPos.xz, uTime);
      vec3 microWorldN = normalize(vWorldNormal + capGradWorld * 0.82);
      vec3 capGradView = (viewMatrix * vec4(capGradWorld * 0.82, 0.0)).xyz;
      normal = normalize(normal + capGradView);
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      /* glsl */ `
      #include <emissivemap_fragment>
      vec3 viewDirW = normalize(cameraPosition - vWorldPos);
      vec3 sunL = normalize(uSunDir);

      float NdotV = max(dot(microWorldN, viewDirW), 0.0);
      float fresnel = 0.025 + 0.975 * pow(1.0 - NdotV, 4.6);

      vec3 reflDir = reflect(-viewDirW, microWorldN);
      float reflElev = clamp(reflDir.y, 0.0, 1.0);
      vec3 reflSky = mix(uSkyHorizon, uSkyZenith, pow(reflElev, 0.55));

      float backScatter = pow(clamp(dot(viewDirW, -sunL), 0.0, 1.0), 3.0);
      float crestThinness = smoothstep(-0.08, 0.72, vWaveHeight) * (0.45 + 0.55 * max(dot(microWorldN, sunL), 0.0));
      vec3 sssGlow = uSssColor * (backScatter * 0.65 + 0.25) * crestThinness * mix(0.95, 0.62, uThemeMix);

      vec3 halfVec = normalize(sunL + viewDirW);
      float NdotH = max(dot(microWorldN, halfVec), 0.0);
      float sunGlintMask = smoothstep(0.7, 0.0, uThemeMix);
      float glitterTight = pow(NdotH, 340.0) * 3.6 * sunGlintMask;
      float glitterBroad = pow(NdotH, 38.0) * 0.36 * sunGlintMask;
      vec3 sunGlint = uSunColor * (glitterTight + glitterBroad) * (1.0 - lacyFoam * 0.75);

      totalEmissiveRadiance += reflSky * fresnel * mix(0.68, 0.52, uThemeMix) + sssGlow + sunGlint;
      `
    );
  };

  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.position.set(0, -0.45, -24);
  scene.add(oceanMesh);

  // 2. Drifting Sea Spray / Coastal Mist Motes hovering above wave crests
  const sprayPositions = new Float32Array(sprayCount * 3);
  const sprayMeta = new Float32Array(sprayCount * 3);
  for (let i = 0; i < sprayCount; i++) {
    const rx = (seededRandom(i * 3.17 + 1) - 0.5) * 52;
    const rz = -42 + seededRandom(i * 7.43 + 2) * 46;
    const ry = 0.22 + seededRandom(i * 11.19 + 3) * 1.9;
    sprayPositions[i * 3] = rx;
    sprayPositions[i * 3 + 1] = ry;
    sprayPositions[i * 3 + 2] = rz;
    sprayMeta[i * 3] = 0.35 + seededRandom(i * 5.71) * 0.65;
    sprayMeta[i * 3 + 1] = seededRandom(i * 9.13) * Math.PI * 2;
    sprayMeta[i * 3 + 2] = ry;
  }
  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
  const sprayMat = new THREE.PointsMaterial({
    map: sprayTex,
    color: LIGHT_SPRAY.clone(),
    size: 0.32,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
  scene.add(sprayPoints);

  // Pointer & Scroll Interaction
  let hasPointer = false;
  let pointerStrength = 0;
  let scrollProgress = 0;
  let smoothScrollProgress = 0;
  let rippleAge = 99;
  let rippleAmp = 0;

  const triggerOceanRipple = (x = 0, z = 6, amp = 0.72) => {
    if (prefersReduced) return;
    oceanUniforms.uRippleCenter.value.set(x, z);
    rippleAge = 0;
    rippleAmp = amp;
  };

  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    hasPointer = true;
  };

  const onPointerDown = (e: PointerEvent) => {
    if (prefersReduced) return;
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    _raycaster.setFromCamera(_pointerNdc, camera);
    if (_raycaster.ray.intersectPlane(_waterPlane, _hitPoint)) {
      triggerOceanRipple(_hitPoint.x, _hitPoint.z + 24, 0.85);
    }
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

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = Math.max(entry.contentRect.width, 1);
      const h = Math.max(entry.contentRect.height, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  resizeObserver.observe(container);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  let frameId = 0;
  let timerId = 0;
  let disposed = false;
  const clock = new THREE.Clock();
  let smoothDelta = 1 / 60;
  let smoothElapsed = 0;
  let lastFrameTime = 0;
  const frameInterval = 1000 / targetFps;

  const registerTimer = (id: number) => {
    timerId = id;
  };

  function updateOceanScene(elapsed: number, delta: number) {
    currentThemeMix = THREE.MathUtils.damp(currentThemeMix, targetThemeMix, 4.0, delta);
    smoothScrollProgress = THREE.MathUtils.damp(smoothScrollProgress, scrollProgress, 3.2, delta);

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(LIGHT_HORIZON).lerp(DARK_HORIZON, currentThemeMix);
      fog.color.copy(scene.background);
    }
    fog.density = THREE.MathUtils.lerp(0.011, 0.018, currentThemeMix);

    // Responsive Sun framing in Light Mode (keeps Sun clearly visible in upper-right sky on desktop and mobile)
    const responsiveX = THREE.MathUtils.clamp((camera.aspect - 0.65) * 0.25 + 0.12, 0.11, 0.34);
    const scrollElevDrop = smoothScrollProgress * 0.035;
    _sunBaseDir.set(responsiveX, 0.135 - scrollElevDrop, -0.94).normalize();
    _activeLightDir.copy(_sunBaseDir);

    // Sky Dome & Sun Sync
    skyUniforms.uTime.value = prefersReduced ? 1.5 : elapsed;
    skyUniforms.uZenithColor.value.copy(LIGHT_ZENITH).lerp(DARK_ZENITH, currentThemeMix);
    skyUniforms.uHorizonColor.value.copy(LIGHT_HORIZON).lerp(DARK_HORIZON, currentThemeMix);
    skyUniforms.uSunDir.value.copy(_sunBaseDir);
    skyUniforms.uThemeMix.value = currentThemeMix;

    // Lighting Adaptation
    hemiLight.color.copy(LIGHT_HEMI_SKY).lerp(DARK_HEMI_SKY, currentThemeMix);
    hemiLight.groundColor.copy(LIGHT_HEMI_GROUND).lerp(DARK_HEMI_GROUND, currentThemeMix);
    hemiLight.intensity = THREE.MathUtils.lerp(0.9, 0.48, currentThemeMix);

    sunLight.position.copy(_activeLightDir).multiplyScalar(60);
    sunLight.color.copy(LIGHT_SUN_COLOR).lerp(DARK_STARLIGHT, currentThemeMix);
    sunLight.intensity = THREE.MathUtils.lerp(2.5, 1.05, currentThemeMix);

    rimLight.color.copy(LIGHT_RIM_COLOR).lerp(DARK_RIM_COLOR, currentThemeMix);
    rimLight.intensity = THREE.MathUtils.lerp(0.85, 1.25, currentThemeMix);

    // Ocean Shader Uniforms (sunlit reflection in Light mode -> starlit midnight swells in Dark mode)
    oceanUniforms.uTime.value = prefersReduced ? 1.5 : elapsed;
    oceanUniforms.uThemeMix.value = currentThemeMix;
    oceanUniforms.uTroughColor.value.copy(LIGHT_TROUGH).lerp(DARK_TROUGH, currentThemeMix);
    oceanUniforms.uMidColor.value.copy(LIGHT_MID).lerp(DARK_MID, currentThemeMix);
    oceanUniforms.uCrestColor.value.copy(LIGHT_CREST).lerp(DARK_CREST, currentThemeMix);
    oceanUniforms.uSssColor.value.copy(LIGHT_SSS).lerp(DARK_SSS, currentThemeMix);
    oceanUniforms.uFoamColor.value.copy(LIGHT_FOAM).lerp(DARK_FOAM, currentThemeMix);
    oceanUniforms.uSkyHorizon.value.copy(LIGHT_HORIZON).lerp(DARK_HORIZON, currentThemeMix);
    oceanUniforms.uSkyZenith.value.copy(LIGHT_ZENITH).lerp(DARK_ZENITH, currentThemeMix);
    oceanUniforms.uSunColor.value.copy(LIGHT_SUN_COLOR).lerp(DARK_STARLIGHT, currentThemeMix);
    oceanUniforms.uSunDir.value.copy(_activeLightDir);

    oceanMat.envMapIntensity = THREE.MathUtils.lerp(0.65, 0.45, currentThemeMix);

    if (!prefersReduced) {
      capillaryBump.offset.x = (elapsed * 0.022) % 1;
      capillaryBump.offset.y = (elapsed * 0.016) % 1;
    }

    // Interactive pointer wake on water plane
    if (hasPointer && !prefersReduced) {
      _raycaster.setFromCamera(_pointerNdc, camera);
      if (_raycaster.ray.intersectPlane(_waterPlane, _hitPoint)) {
        _smoothPointer.x = THREE.MathUtils.damp(_smoothPointer.x, _hitPoint.x, 6.5, delta);
        _smoothPointer.z = THREE.MathUtils.damp(_smoothPointer.z, _hitPoint.z + 24, 6.5, delta);
        pointerStrength = THREE.MathUtils.damp(pointerStrength, 1, 5.5, delta);
      }
    } else {
      pointerStrength = THREE.MathUtils.damp(pointerStrength, 0, 3.0, delta);
    }
    oceanUniforms.uPointer.value.set(_smoothPointer.x, _smoothPointer.z);
    oceanUniforms.uPointerStrength.value = pointerStrength;

    // Expanding page-transition / click wave ripple
    if (rippleAge < 12) {
      rippleAge += delta;
    }
    oceanUniforms.uRippleAge.value = rippleAge;
    oceanUniforms.uRippleAmp.value = rippleAmp;

    // Gentle boat-like camera sway + scroll pitch
    const bobX = prefersReduced ? 0 : Math.sin(elapsed * 0.24) * 0.32;
    const bobY = prefersReduced ? 0 : Math.sin(elapsed * 0.38) * 0.12;
    const camOffsetX = (hasPointer && !prefersReduced ? _pointerNdc.x * 0.65 : 0) + bobX;
    const camOffsetY =
      (hasPointer && !prefersReduced ? _pointerNdc.y * 0.25 : 0) + bobY - smoothScrollProgress * 0.75;
    const camOffsetZ = 15.8 - smoothScrollProgress * 2.0;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, camOffsetX, 2.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 4.6 + camOffsetY, 2.4, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camOffsetZ, 2.4, delta);
    camera.lookAt(0, 0.85 - smoothScrollProgress * 0.5, -18);
    skyDome.position.copy(camera.position);

    // Sea spray / coastal mist drift
    sprayMat.color.copy(LIGHT_SPRAY).lerp(DARK_SPRAY, currentThemeMix);
    sprayMat.opacity = THREE.MathUtils.lerp(0.24, 0.18, currentThemeMix);
    if (!prefersReduced) {
      const posAttr = sprayGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < sprayCount; i++) {
        const spd = sprayMeta[i * 3];
        const phase = sprayMeta[i * 3 + 1];
        const baseY = sprayMeta[i * 3 + 2];

        let x = posAttr.getX(i) + spd * delta * 0.72;
        if (x > 26) x = -26;
        const y = baseY + Math.sin(elapsed * 0.8 + phase) * 0.16;
        posAttr.setXY(i, x, y);
      }
      posAttr.needsUpdate = true;
    }
  }

  function tick() {
    if (disposed || document.hidden) return;

    // Limit expensive WebGL renders on phones while keeping desktop rendering
    // at the display's normal animation cadence.
    const now = performance.now();
    if (lastFrameTime && now - lastFrameTime < frameInterval - 1) {
      frameId = requestAnimationFrame(tick);
      return;
    }
    lastFrameTime = now;

    const rawDelta = Math.min(clock.getDelta(), 0.05);
    smoothDelta = THREE.MathUtils.lerp(smoothDelta, rawDelta, 0.25);
    smoothElapsed += smoothDelta;

    updateOceanScene(smoothElapsed, smoothDelta);
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

  const onVisibilityChange = () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      frameId = 0;
      timerId = 0;
      clock.stop();
      return;
    }

    // Reset timing after returning to the tab so the first frame does not
    // receive a large delta and cause a visible jump in the waves.
    lastFrameTime = 0;
    clock.start();
    tick();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  updateOceanScene(0, 0.016);
  tick();

  return {
    setTheme: (theme: ThemeMode) => {
      targetThemeMix = theme === 'dark' ? 1 : 0;
      if (prefersReduced) {
        currentThemeMix = targetThemeMix;
        updateOceanScene(0, 0.016);
        renderer.render(scene, camera);
      } else {
        triggerOceanRipple(0, 8, 0.65);
      }
    },
    triggerRipple: () => {
      triggerOceanRipple(0, 10, 0.78);
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
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      skyGeo.dispose();
      skyMat.dispose();
      oceanGeo.dispose();
      oceanMat.dispose();
      sprayGeo.dispose();
      sprayMat.dispose();
      capillaryBump.dispose();
      sprayTex.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
