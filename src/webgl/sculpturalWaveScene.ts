import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { afterDraw, detectSoftwareWebGL } from './glUtils';

export type ThemeMode = 'light' | 'dark';

export interface SculpturalWaveController {
  setTheme: (theme: ThemeMode) => void;
  triggerRipple: () => void;
  dispose: () => void;
}

const UPLOADED_IMAGE_URL = '/assets/aistudio/pexels-steve-34939151_4e6c0119.jpg';

// Pre-allocated math helpers (zero GC inside animation loop)
const _pointerNdc = new THREE.Vector2(0, 0);
const _raycaster = new THREE.Raycaster();
const _meshPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _hitPoint = new THREE.Vector3(0, 0, 0);
const _smoothPointer = new THREE.Vector3(0, 0, 0);

const LIGHT_BG = new THREE.Color('#FAF6F5');
const DARK_BG = new THREE.Color('#000000');
const LIGHT_KEY_COLOR = new THREE.Color('#FFFBF5');
const DARK_KEY_COLOR = new THREE.Color('#CBD5E1');
const LIGHT_ACCENT_COLOR = new THREE.Color('#1677FF');
const DARK_ACCENT_COLOR = new THREE.Color('#64748B');

/**
 * Generates Light Mode albedo, smoothed 3D heightmap, tangent-space normal map,
 * and roughness map directly from the uploaded sculptural wave image.
 */
function buildTexturesFromImage(
  img: HTMLImageElement,
  maxAnisotropy: number
): {
  darkMap: THREE.CanvasTexture;
  lightMap: THREE.CanvasTexture;
  heightMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  // Keep full native resolution (capped at 2048px) so curved fin edges stay razor-sharp
  const maxW = 2048;
  const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
  const w = Math.max(64, Math.round(img.naturalWidth * scale));
  const h = Math.max(64, Math.round(img.naturalHeight * scale));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(img, 0, 0, w, h);
  const srcPixels = srcCtx.getImageData(0, 0, w, h).data;

  const darkCanvas = document.createElement('canvas');
  darkCanvas.width = w;
  darkCanvas.height = h;
  const darkCtx = darkCanvas.getContext('2d')!;
  const darkImg = darkCtx.createImageData(w, h);

  const lightCanvas = document.createElement('canvas');
  lightCanvas.width = w;
  lightCanvas.height = h;
  const lightCtx = lightCanvas.getContext('2d')!;
  const lightImg = lightCtx.createImageData(w, h);

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = w;
  heightCanvas.height = h;
  const heightCtx = heightCanvas.getContext('2d')!;
  const heightImg = heightCtx.createImageData(w, h);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImg = roughCtx.createImageData(w, h);

  const lumaGrid = new Float32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    const r = srcPixels[p];
    const g = srcPixels[p + 1];
    const b = srcPixels[p + 2];
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    lumaGrid[i] = luma;

    // Dark Mode Texture: Pure obsidian black & subtle monochrome charcoal highlights across curved fins
    const darkVal = THREE.MathUtils.clamp(Math.round(Math.pow(luma, 1.85) * 0.44 * 255), 0, 255);
    darkImg.data[p] = darkVal;
    darkImg.data[p + 1] = darkVal;
    darkImg.data[p + 2] = Math.min(255, Math.round(darkVal * 1.03));
    darkImg.data[p + 3] = 255;

    // Light Mode Texture: Luminous champagne-to-blush sculpted curves preserving rib edges for crisp dark-text legibility
    const lightLift = 0.78 + Math.pow(luma, 0.82) * 0.22;
    const hueMix = 0.30;
    const baseL = lightLift * 255;
    const lr = Math.round(baseL * (1 - hueMix) + Math.min(255, r * 0.92 + 125) * hueMix);
    const lg = Math.round(baseL * (1 - hueMix) + Math.min(255, g * 0.92 + 135) * hueMix);
    const lb = Math.round(baseL * (1 - hueMix) + Math.min(255, b * 0.92 + 140) * hueMix);
    lightImg.data[p] = THREE.MathUtils.clamp(lr, 0, 255);
    lightImg.data[p + 1] = THREE.MathUtils.clamp(lg, 0, 255);
    lightImg.data[p + 2] = THREE.MathUtils.clamp(lb, 0, 255);
    lightImg.data[p + 3] = 255;
  }

  // Single-pass tight 3x3 local average for unsharp edge accentuation without blurring curves
  const localAvg = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const ym1 = Math.max(0, y - 1) * w;
    const y0 = y * w;
    const yp1 = Math.min(h - 1, y + 1) * w;
    for (let x = 0; x < w; x++) {
      const xm1 = Math.max(0, x - 1);
      const xp1 = Math.min(w - 1, x + 1);
      localAvg[y0 + x] =
        (lumaGrid[ym1 + xm1] +
          lumaGrid[ym1 + x] +
          lumaGrid[ym1 + xp1] +
          lumaGrid[y0 + xm1] +
          lumaGrid[y0 + x] +
          lumaGrid[y0 + xp1] +
          lumaGrid[yp1 + xm1] +
          lumaGrid[yp1 + x] +
          lumaGrid[yp1 + xp1]) /
        9;
    }
  }

  const sharpGrid = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    // Unsharp mask accentuates every curved fin ridge sharply
    const sharp = THREE.MathUtils.clamp(
      lumaGrid[i] + (lumaGrid[i] - localAvg[i]) * 1.45,
      0,
      1
    );
    sharpGrid[i] = sharp;

    // Sharp terraced height extrusion
    const combinedH = Math.min(localAvg[i] * 0.25 + Math.pow(sharp, 0.65) * 0.78, 1.0);
    const hVal = THREE.MathUtils.clamp(Math.round(combinedH * 255), 0, 255);
    const p = i * 4;
    heightImg.data[p] = hVal;
    heightImg.data[p + 1] = hVal;
    heightImg.data[p + 2] = hVal;
    heightImg.data[p + 3] = 255;

    // Razor-sharp specular contrast: mirror-crisp along curved rims, matte in troughs
    const roughVal = THREE.MathUtils.clamp(
      Math.round((0.76 - Math.min(Math.pow(sharp, 0.85) * 1.35, 0.68)) * 255),
      20,
      230
    );
    roughImg.data[p] = roughVal;
    roughImg.data[p + 1] = roughVal;
    roughImg.data[p + 2] = roughVal;
    roughImg.data[p + 3] = 255;
  }

  darkCtx.putImageData(darkImg, 0, 0);
  lightCtx.putImageData(lightImg, 0, 0);
  heightCtx.putImageData(heightImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  // Zero-blur crisp Sobel tangent-space Normal Map for knife-sharp 3D curved fin edges
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = w;
  normalCanvas.height = h;
  const normalCtx = normalCanvas.getContext('2d')!;
  const normalImg = normalCtx.createImageData(w, h);
  const strength = 13.5;

  for (let y = 0; y < h; y++) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(h - 1, y + 1);
    for (let x = 0; x < w; x++) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(w - 1, x + 1);

      const tl = sharpGrid[ym * w + xm];
      const tc = sharpGrid[ym * w + x];
      const tr = sharpGrid[ym * w + xp];
      const ml = sharpGrid[y * w + xm];
      const mr = sharpGrid[y * w + xp];
      const bl = sharpGrid[yp * w + xm];
      const bc = sharpGrid[yp * w + x];
      const br = sharpGrid[yp * w + xp];

      const dx = (tr + 2 * mr + br - (tl + 2 * ml + bl)) * strength;
      const dy = (bl + 2 * bc + br - (tl + 2 * tc + tr)) * strength;

      let nx = -dx;
      let ny = dy;
      let nz = 1.0;
      const invLen = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * w + x) * 4;
      normalImg.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      normalImg.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalImg.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalImg.data[idx + 3] = 255;
    }
  }
  normalCtx.putImageData(normalImg, 0, 0);

  const configureTex = (tex: THREE.CanvasTexture, isColor: boolean) => {
    tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  };

  return {
    darkMap: configureTex(new THREE.CanvasTexture(darkCanvas), true),
    lightMap: configureTex(new THREE.CanvasTexture(lightCanvas), true),
    heightMap: configureTex(new THREE.CanvasTexture(heightCanvas), false),
    normalMap: configureTex(new THREE.CanvasTexture(normalCanvas), false),
    roughnessMap: configureTex(new THREE.CanvasTexture(roughCanvas), false),
  };
}

export function initSculpturalWaveScene(
  container: HTMLElement,
  initialTheme: ThemeMode,
  onContextLossChange?: (lost: boolean) => void
): SculpturalWaveController {
  const isSoftwareGl = detectSoftwareWebGL();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetThemeMix = initialTheme === 'dark' ? 1 : 0;
  let currentThemeMix = targetThemeMix;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color().copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
  camera.position.set(0, 0, 9.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  // Studio IBL environment map
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  // Studio 3-point raking lighting rig for sharp 3D contour definition
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.45);
  scene.add(hemiLight);

  // Raking side-top key light sculpts sharp highlights & deep folds across the 3D fins
  const keyLight = new THREE.DirectionalLight(0xfffdf9, 1.75);
  keyLight.position.set(10, 7, 3.2);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x94a3b8, 0.72);
  rimLight.position.set(-8, -4, 3.0);
  scene.add(rimLight);

  // Interactive cursor-tracking specular point light sweeping along the 3D curved fins
  const pointerLight = new THREE.PointLight(0x1677ff, 8, 22, 1.5);
  pointerLight.position.set(2.5, 1.2, 4.0);
  scene.add(pointerLight);

  // High-density 320x180 subdivided mesh keeps curved fin edges razor-sharp during 3D displacement
  const geometry = new THREE.PlaneGeometry(16, 9, 320, 180);
  geometry.computeTangents();

  const shaderUniforms = {
    uTime: { value: 0 },
    uThemeMix: { value: currentThemeMix },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerStrength: { value: 0 },
    uRippleTime: { value: 10 },
    uRippleStrength: { value: 0 },
    uLightMap: { value: null as THREE.Texture | null },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.38,
    metalness: 0.48,
    clearcoat: 0.72,
    clearcoatRoughness: 0.07,
    displacementScale: 1.65,
    displacementBias: -0.35,
    normalScale: new THREE.Vector2(2.8, 2.8),
    envMapIntensity: 0.55,
  });
  material.customProgramCacheKey = () => 'gvx-sculptural-wave-v3';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shaderUniforms.uTime;
    shader.uniforms.uThemeMix = shaderUniforms.uThemeMix;
    shader.uniforms.uPointer = shaderUniforms.uPointer;
    shader.uniforms.uPointerStrength = shaderUniforms.uPointerStrength;
    shader.uniforms.uRippleTime = shaderUniforms.uRippleTime;
    shader.uniforms.uRippleStrength = shaderUniforms.uRippleStrength;
    shader.uniforms.uLightMap = shaderUniforms.uLightMap;

    shader.vertexShader =
      `
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uPointerStrength;
      uniform float uRippleTime;
      uniform float uRippleStrength;
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>
      float wPhase1 = position.x * 0.32 + position.y * 0.22 - uTime * 0.42;
      float wPhase2 = position.x * 0.19 - position.y * 0.34 + uTime * 0.29;
      float dWaveDx = 0.32 * 0.22 * cos(wPhase1) - 0.19 * 0.13 * sin(wPhase2);
      float dWaveDy = 0.22 * 0.22 * cos(wPhase1) + 0.34 * 0.13 * sin(wPhase2);
      #ifdef USE_DISPLACEMENTMAP
        vec2 dUv = vec2(0.0018, 0.0018);
        float hL = texture2D( displacementMap, vDisplacementMapUv - vec2(dUv.x, 0.0) ).x;
        float hR = texture2D( displacementMap, vDisplacementMapUv + vec2(dUv.x, 0.0) ).x;
        float hD = texture2D( displacementMap, vDisplacementMapUv - vec2(0.0, dUv.y) ).x;
        float hU = texture2D( displacementMap, vDisplacementMapUv + vec2(0.0, dUv.y) ).x;
        dWaveDx += (hR - hL) * displacementScale * 6.5;
        dWaveDy += (hU - hD) * displacementScale * 6.5;
      #endif
      objectNormal = normalize(vec3(-dWaveDx, -dWaveDy, 1.0));
      #ifdef USE_TANGENT
        objectTangent = normalize(objectTangent - dot(objectTangent, objectNormal) * objectNormal);
      #endif
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float waveA = sin(position.x * 0.32 + position.y * 0.22 - uTime * 0.42) * 0.22;
      float waveB = cos(position.x * 0.19 - position.y * 0.34 + uTime * 0.29) * 0.13;
      float distP = length(position.xy - uPointer);
      float pointerLift = exp(-distP * distP * 0.12) * 0.34 * uPointerStrength;
      float rippleEnv = smoothstep(0.0, 0.28, uRippleTime);
      float rippleWave = sin(distP * 1.15 - uRippleTime * 2.8) * exp(-distP * 0.18) * uRippleStrength * rippleEnv * 0.24;
      transformed.z += waveA + waveB + pointerLift + rippleWave;
      `
    );

    shader.fragmentShader =
      `
      uniform sampler2D uLightMap;
      uniform float uThemeMix;
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
        vec4 darkTexel = texture2D( map, vMapUv );
        vec4 lightTexel = texture2D( uLightMap, vMapUv );
        diffuseColor *= mix( lightTexel, darkTexel, uThemeMix );
      #endif
      `
    );
  };

  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  scene.add(mesh);

  let createdTextures: ReturnType<typeof buildTexturesFromImage> | null = null;
  let imageAspect = 16 / 9;

  // Dynamically scale the 3D mesh with overscan so it always covers 100% of the viewport even when tilted
  const updatePlaneScale = () => {
    const dist = camera.position.z - mesh.position.z;
    const vFovRad = THREE.MathUtils.degToRad(camera.fov);
    const visH = 2 * Math.tan(vFovRad * 0.5) * dist;
    const visW = visH * camera.aspect;

    // 16x9 base geometry scaled to cover viewport with 18% kinetic overscan margin
    const overscan = 1.18;
    const targetAspect = visW / visH;
    let scaleX: number;
    let scaleY: number;
    if (targetAspect > imageAspect) {
      scaleX = (visW * overscan) / 16;
      scaleY = (visW * overscan / imageAspect) / 9;
    } else {
      scaleY = (visH * overscan) / 9;
      scaleX = (visH * overscan * imageAspect) / 16;
    }
    mesh.scale.set(scaleX, scaleY, 1);
  };

  let disposed = false;
  let frameId = 0;
  let timerId = 0;

  // Load the exact uploaded image directly from local workspace path
  const loader = new Image();
  loader.decoding = 'async';
  loader.onload = () => {
    if (disposed) return;
    imageAspect = loader.naturalWidth / Math.max(loader.naturalHeight, 1);
    createdTextures = buildTexturesFromImage(loader, maxAnisotropy);

    material.map = createdTextures.darkMap;
    material.displacementMap = createdTextures.heightMap;
    material.normalMap = createdTextures.normalMap;
    material.roughnessMap = createdTextures.roughnessMap;
    shaderUniforms.uLightMap.value = createdTextures.lightMap;
    material.needsUpdate = true;

    updatePlaneScale();
    mesh.visible = true;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    renderer.render(scene, camera);
  };
  loader.onerror = () => {
    onContextLossChange?.(true);
  };
  loader.src = UPLOADED_IMAGE_URL;

  let hasPointer = false;
  let pointerStrength = 0;
  let rippleStrength = 0;
  let rippleAge = 10;
  let scrollProgress = 0;
  let smoothScrollProgress = 0;

  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    hasPointer = true;
  };
  const onPointerDown = () => {
    if (prefersReduced) return;
    rippleAge = 0;
    rippleStrength = 1.0;
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
      updatePlaneScale();
    }
  });
  resizeObserver.observe(container);

  const clock = new THREE.Clock();
  let smoothDelta = 0.016;
  let smoothElapsed = 0;
  const registerTimer = (id: number) => {
    timerId = id;
  };

  function updateScene(elapsed: number, delta: number) {
    currentThemeMix = THREE.MathUtils.damp(currentThemeMix, targetThemeMix, 3.4, delta);
    smoothScrollProgress = THREE.MathUtils.damp(smoothScrollProgress, scrollProgress, 2.8, delta);

    shaderUniforms.uThemeMix.value = currentThemeMix;
    shaderUniforms.uTime.value = prefersReduced ? 0.6 : elapsed;

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
    }

    // Dual-theme studio PBR lighting: pure black obsidian Dark Mode vs crisp sculpted Light Mode
    hemiLight.intensity = THREE.MathUtils.lerp(0.46, 0.05, currentThemeMix);
    keyLight.color.copy(LIGHT_KEY_COLOR).lerp(DARK_KEY_COLOR, currentThemeMix);
    keyLight.intensity = THREE.MathUtils.lerp(1.65, 0.92, currentThemeMix);
    rimLight.intensity = THREE.MathUtils.lerp(0.45, 0.55, currentThemeMix);

    pointerLight.color.copy(LIGHT_ACCENT_COLOR).lerp(DARK_ACCENT_COLOR, currentThemeMix);
    pointerLight.intensity = THREE.MathUtils.lerp(3.5, 4.2, currentThemeMix);

    material.metalness = THREE.MathUtils.lerp(0.1, 0.58, currentThemeMix);
    material.roughness = THREE.MathUtils.lerp(0.46, 0.36, currentThemeMix);
    material.clearcoat = THREE.MathUtils.lerp(0.32, 0.55, currentThemeMix);
    material.envMapIntensity = THREE.MathUtils.lerp(0.48, 0.2, currentThemeMix);

    // Raycast pointer onto 3D plane for interactive relief ripple & specular light sweep
    if (hasPointer && !prefersReduced) {
      _raycaster.setFromCamera(_pointerNdc, camera);
      if (_raycaster.ray.intersectPlane(_meshPlane, _hitPoint)) {
        _smoothPointer.x = THREE.MathUtils.damp(_smoothPointer.x, _hitPoint.x, 3.4, delta);
        _smoothPointer.y = THREE.MathUtils.damp(_smoothPointer.y, _hitPoint.y, 3.4, delta);
      }
      pointerStrength = THREE.MathUtils.damp(pointerStrength, 1.0, 2.8, delta);
    } else {
      pointerStrength = THREE.MathUtils.damp(pointerStrength, 0.0, 1.6, delta);
    }

    // Convert world pointer back into plane's local space for vertex displacement
    shaderUniforms.uPointer.value.set(
      _smoothPointer.x / Math.max(mesh.scale.x, 0.1),
      _smoothPointer.y / Math.max(mesh.scale.y, 0.1)
    );
    shaderUniforms.uPointerStrength.value = pointerStrength;

    // Damped page-transition / click radial ripple
    if (!prefersReduced) {
      rippleAge += delta;
      rippleStrength = THREE.MathUtils.damp(rippleStrength, 0, 1.35, delta);
    }
    shaderUniforms.uRippleTime.value = rippleAge;
    shaderUniforms.uRippleStrength.value = rippleStrength;

    // Gentle moving specular highlight light across the 3D curved fins
    const idleSweepX = prefersReduced ? 1.8 : Math.sin(elapsed * 0.21) * 3.6;
    const idleSweepY = prefersReduced ? 0.8 : Math.cos(elapsed * 0.16) * 1.7;
    pointerLight.position.x = THREE.MathUtils.lerp(idleSweepX, _smoothPointer.x, pointerStrength * 0.7);
    pointerLight.position.y = THREE.MathUtils.lerp(idleSweepY, _smoothPointer.y, pointerStrength * 0.7);

    // Smooth 3D tilt parallax so depth across extruded curved fins glides effortlessly
    const targetRotY =
      (hasPointer && !prefersReduced ? _pointerNdc.x * 0.075 : 0) +
      (prefersReduced ? 0 : Math.sin(elapsed * 0.15) * 0.025);
    const targetRotX =
      (hasPointer && !prefersReduced ? -_pointerNdc.y * 0.05 : 0) - smoothScrollProgress * 0.075;
    mesh.rotation.y = THREE.MathUtils.damp(mesh.rotation.y, targetRotY, 2.2, delta);
    mesh.rotation.x = THREE.MathUtils.damp(mesh.rotation.x, targetRotX, 2.2, delta);
    mesh.position.y = THREE.MathUtils.damp(mesh.position.y, smoothScrollProgress * 0.3, 2.2, delta);
  }

  function tick() {
    if (disposed) return;
    const rawDelta = Math.min(clock.getDelta(), 0.045);
    smoothDelta = THREE.MathUtils.lerp(smoothDelta, rawDelta, 0.25);
    smoothElapsed += smoothDelta;

    updateScene(smoothElapsed, smoothDelta);
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
        rippleAge = 0;
        rippleStrength = 0.85;
      }
    },
    triggerRipple: () => {
      if (!prefersReduced) {
        rippleAge = 0;
        rippleStrength = 1.0;
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
      geometry.dispose();
      material.dispose();
      if (createdTextures) {
        createdTextures.darkMap.dispose();
        createdTextures.lightMap.dispose();
        createdTextures.heightMap.dispose();
        createdTextures.normalMap.dispose();
        createdTextures.roughnessMap.dispose();
      }
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
