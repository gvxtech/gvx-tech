import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { afterDraw, detectSoftwareWebGL } from './glUtils';

export type ThemeMode = 'light' | 'dark';

export interface HoneycombController {
  setTheme: (theme: ThemeMode) => void;
  triggerRipple: () => void;
  dispose: () => void;
}

interface HexCell {
  x: number;
  z: number;
  baseOffset: number;
  toneJitter: number;
  dist: number;
  // Physical spring-damper state for coupled wave ripples
  springY: number;
  velY: number;
  currentY: number;
  neighbors: number[];
  // Indices of up-sun neighbor cells that cast directional shadow onto this cell
  sunNeighbors: number[];
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _dummy = new THREE.Object3D();
const _coreDummy = new THREE.Object3D();
const _lipDummy = new THREE.Object3D();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _finalColor = new THREE.Color();
const _coreColor = new THREE.Color();
const _lipColor = new THREE.Color();
const _tempLipColor = new THREE.Color();
const _pointerNdc = new THREE.Vector2(99, 99);
const _raycaster = new THREE.Raycaster();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hitPoint = new THREE.Vector3(999, 0, 999);
const _smoothPointer = new THREE.Vector3(999, 0, 999);
const _prevPointer = new THREE.Vector3(999, 0, 999);

// Light Mode Palette: Pure White Canvas with Darker Slate-Porcelain Cells & Deep Cast Shadows
const LIGHT_BG = new THREE.Color('#FFFFFF');
const LIGHT_WALL_BASE = new THREE.Color('#9AA7B8');
const LIGHT_WALL_CREST = new THREE.Color('#D3DCE8');
const LIGHT_CORE_BASE = new THREE.Color('#66758B');
const LIGHT_CORE_CREST = new THREE.Color('#2B72DF');
const LIGHT_LIP_BASE = new THREE.Color('#B3C0D1');
const LIGHT_LIP_CREST = new THREE.Color('#1677FF');

// Dark Mode Palette: Pitch Black & Ultra-Dark Charcoal / Midnight Obsidian
const DARK_BG = new THREE.Color('#020304');
const DARK_WALL_BASE = new THREE.Color('#010203');
const DARK_WALL_CREST = new THREE.Color('#07090D');
const DARK_CORE_BASE = new THREE.Color('#010102');
const DARK_CORE_CREST = new THREE.Color('#051226');
const DARK_LIP_BASE = new THREE.Color('#06080C');
const DARK_LIP_CREST = new THREE.Color('#131A26');
const DARK_LIP_BLUE = new THREE.Color('#0D2B57');

const LIGHT_KEY_COLOR = new THREE.Color('#FFFDF9');
const DARK_KEY_COLOR = new THREE.Color('#3B5175');
const LIGHT_SKY_COLOR = new THREE.Color('#FFFFFF');
const DARK_SKY_COLOR = new THREE.Color('#070C14');
const LIGHT_GROUND_COLOR = new THREE.Color('#6C7A8E');
const DARK_GROUND_COLOR = new THREE.Color('#010102');
const LIGHT_RIM_COLOR = new THREE.Color('#C2D8FF');
const DARK_RIM_COLOR = new THREE.Color('#183666');
const LIGHT_SOFTBOX_COLOR = new THREE.Color('#EEF4FF');
const DARK_SOFTBOX_COLOR = new THREE.Color('#12294D');

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function createMicroSurfaceMaps(maxAnisotropy: number): {
  bumpMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
} {
  const size = 256;
  const bumpData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const streak = seededRandom(y * 1.37) * 28;
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const microGrain = seededRandom(x * 0.73 + y * 13.19) * 24;
      const waveGrain = Math.sin((x / size) * Math.PI * 16 + streak * 0.1) * 10;

      const bumpVal = THREE.MathUtils.clamp(Math.round(115 + streak + microGrain + waveGrain), 0, 255);
      bumpData[idx] = bumpVal;
      bumpData[idx + 1] = bumpVal;
      bumpData[idx + 2] = bumpVal;
      bumpData[idx + 3] = 255;

      const roughVal = THREE.MathUtils.clamp(Math.round(202 + streak * 0.8 + microGrain * 0.9), 0, 255);
      roughData[idx] = roughVal;
      roughData[idx + 1] = roughVal;
      roughData[idx + 2] = roughVal;
      roughData[idx + 3] = 255;
    }
  }

  const bumpMap = new THREE.DataTexture(bumpData, size, size, THREE.RGBAFormat);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  return { bumpMap, roughnessMap };
}

function createHollowHexWallGeometry(
  outerR: number,
  innerR: number,
  depth: number
): THREE.ExtrudeGeometry {
  const outer = new THREE.Shape();
  const hole = new THREE.Path();

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const ox = Math.cos(angle) * outerR;
    const oy = Math.sin(angle) * outerR;
    const ix = Math.cos(angle) * innerR;
    const iy = Math.sin(angle) * innerR;
    if (i === 0) {
      outer.moveTo(ox, oy);
      hole.moveTo(ix, iy);
    } else {
      outer.lineTo(ox, oy);
      hole.lineTo(ix, iy);
    }
  }
  outer.closePath();
  hole.closePath();
  outer.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.032,
    bevelSize: 0.022,
    bevelSegments: 3,
    curveSegments: 1,
  });

  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();

  // Bake vertical and cavity crevice ambient occlusion into vertex colors
  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const depthFactor = THREE.MathUtils.clamp((y + depth * 0.78) / (depth * 0.78), 0.34, 1.0);
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    const radialAO = r < (outerR + innerR) * 0.5 && y < -0.01 ? 0.76 : 1.0;
    const shade = depthFactor * radialAO;
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function createHexCorePlateGeometry(radius: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 1,
  });

  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function createHexTopLipGeometry(outerR: number, innerR: number): THREE.ExtrudeGeometry {
  const outer = new THREE.Shape();
  const hole = new THREE.Path();

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const ox = Math.cos(angle) * outerR;
    const oy = Math.sin(angle) * outerR;
    const ix = Math.cos(angle) * innerR;
    const iy = Math.sin(angle) * innerR;
    if (i === 0) {
      outer.moveTo(ox, oy);
      hole.moveTo(ix, iy);
    } else {
      outer.lineTo(ox, oy);
      hole.lineTo(ix, iy);
    }
  }
  outer.closePath();
  hole.closePath();
  outer.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.013,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export function initHoneycombScene(
  container: HTMLElement,
  initialTheme: ThemeMode,
  onContextLossChange?: (lost: boolean) => void
): HoneycombController {
  const isSoftwareGl = detectSoftwareWebGL();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetThemeMix = initialTheme === 'dark' ? 1 : 0;
  let currentThemeMix = targetThemeMix;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color().copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
  const fog = new THREE.FogExp2(scene.background.getHex(), 0.034);
  scene.fog = fog;

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
  camera.position.set(0, 6.2, 13.2);
  camera.lookAt(0, -0.35, -0.9);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(width, height);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  const { bumpMap, roughnessMap } = createMicroSurfaceMaps(maxAnisotropy);

  // Studio Lighting Rig: raking key light casts pronounced directional shadows in Light Mode
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8a97aa, 0.48);
  scene.add(hemiLight);

  // Lower raking angle (11.5, 6.8, 5.5) casts crisp long architectural shadows between hex steps
  const keyLight = new THREE.DirectionalLight(0xfffdf9, 2.35);
  keyLight.position.set(11.5, 6.8, 5.5);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 42;
    const d = 15;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.00035;
    keyLight.shadow.normalBias = 0.022;
    keyLight.shadow.radius = 2.6;
  }
  scene.add(keyLight);

  // Opposing silver-blue rim light
  const rimLight = new THREE.DirectionalLight(0xc2d8ff, 0.85);
  rimLight.position.set(-9.5, 5.5, -7.5);
  scene.add(rimLight);

  // Electric & ocean blue accent lights (strong in Dark mode for black/silver/blue gleam)
  const blueAccentLight = new THREE.PointLight(0x1677ff, 14, 34, 1.45);
  blueAccentLight.position.set(-4.5, 4.2, 3.2);
  scene.add(blueAccentLight);

  const cyanRimLight = new THREE.PointLight(0x00b8ff, 10, 30, 1.5);
  cyanRimLight.position.set(5.8, 3.6, -3.5);
  scene.add(cyanRimLight);

  // Silver overhead softbox + blue side softbox (GPU only)
  let softboxA: THREE.RectAreaLight | null = null;
  let softboxB: THREE.RectAreaLight | null = null;
  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    softboxA = new THREE.RectAreaLight(0xeef4ff, 1.6, 12, 4);
    softboxA.position.set(-5, 7.2, 5.5);
    softboxA.lookAt(0, 0, 0);
    scene.add(softboxA);

    softboxB = new THREE.RectAreaLight(0x1677ff, 1.4, 10, 3.5);
    softboxB.position.set(7.5, 5.2, -5.5);
    softboxB.lookAt(0, 0, 0);
    scene.add(softboxB);
  }

  // Tightly tessellated interlocking honeycomb lattice
  const hexRadius = 0.72;
  const seamTolerance = 0.012;
  const horizSpacing = Math.sqrt(3) * (hexRadius + seamTolerance);
  const vertSpacing = 1.5 * (hexRadius + seamTolerance);
  const cols = 19;
  const rows = 17;
  const cells: HexCell[] = [];

  let cellSeed = 1;
  for (let r = -Math.floor(rows / 2); r <= Math.floor(rows / 2); r++) {
    for (let c = -Math.floor(cols / 2); c <= Math.floor(cols / 2); c++) {
      const xOffset = (Math.abs(r) % 2) * (horizSpacing * 0.5);
      const x = c * horizSpacing + xOffset;
      const z = r * vertSpacing;
      if (x * x * 0.42 + z * z < 190) {
        const randA = seededRandom(cellSeed++);
        const randB = seededRandom(cellSeed++);
        cells.push({
          x,
          z,
          baseOffset: (randA - 0.5) * 0.045,
          toneJitter: (randB - 0.5) * 0.035,
          dist: Math.sqrt(x * x + z * z),
          springY: 0,
          velY: 0,
          currentY: 0,
          neighbors: [],
          sunNeighbors: [],
        });
      }
    }
  }

  // Pre-compute neighbors & up-sun shadow caster neighbors along keyLight direction (11.5, 5.5)
  const sunDirX = 11.5 / Math.hypot(11.5, 5.5);
  const sunDirZ = 5.5 / Math.hypot(11.5, 5.5);
  const maxNeighborDistSq = (horizSpacing * 1.18) ** 2;

  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const dx = cells[j].x - cells[i].x;
      const dz = cells[j].z - cells[i].z;
      const dSq = dx * dx + dz * dz;
      if (dSq <= maxNeighborDistSq) {
        cells[i].neighbors.push(j);
        cells[j].neighbors.push(i);

        const len = Math.sqrt(dSq);
        const dotI = (dx / len) * sunDirX + (dz / len) * sunDirZ;
        if (dotI > 0.35) {
          cells[i].sunNeighbors.push(j);
        } else if (dotI < -0.35) {
          cells[j].sunNeighbors.push(i);
        }
      }
    }
  }

  const wallGeo = createHollowHexWallGeometry(hexRadius * 0.96, hexRadius * 0.73, 2.4);
  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.46,
    metalness: 0.16,
    anisotropy: 0.6,
    anisotropyRotation: 0.35,
    bumpMap,
    bumpScale: 0.006,
    roughnessMap,
    envMapIntensity: 0.62,
  });

  const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, cells.length);
  wallMesh.castShadow = !isSoftwareGl;
  wallMesh.receiveShadow = !isSoftwareGl;
  wallMesh.frustumCulled = false;

  const coreGeo = createHexCorePlateGeometry(hexRadius * 0.72, 1.85);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.16,
    metalness: 0.14,
    clearcoat: 0.92,
    clearcoatRoughness: 0.1,
    iridescence: 0.18,
    iridescenceIOR: 1.35,
    envMapIntensity: 0.95,
  });

  const coreMesh = new THREE.InstancedMesh(coreGeo, coreMat, cells.length);
  coreMesh.castShadow = !isSoftwareGl;
  coreMesh.receiveShadow = !isSoftwareGl;
  coreMesh.frustumCulled = false;

  const lipGeo = createHexTopLipGeometry(hexRadius * 0.945, hexRadius * 0.755);
  const lipMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.38,
    clearcoat: 0.45,
    clearcoatRoughness: 0.16,
    anisotropy: 0.75,
    bumpMap,
    bumpScale: 0.003,
    envMapIntensity: 1.15,
  });

  const lipMesh = new THREE.InstancedMesh(lipGeo, lipMat, cells.length);
  lipMesh.castShadow = !isSoftwareGl;
  lipMesh.receiveShadow = !isSoftwareGl;
  lipMesh.frustumCulled = false;

  wallMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cells.length * 3), 3);
  coreMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cells.length * 3), 3);
  lipMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cells.length * 3), 3);

  scene.add(wallMesh);
  scene.add(coreMesh);
  scene.add(lipMesh);

  const injectImpulse = (originX: number, originZ: number, strength: number, radiusSq: number) => {
    if (prefersReduced) return;
    for (let i = 0; i < cells.length; i++) {
      const dx = cells[i].x - originX;
      const dz = cells[i].z - originZ;
      const dSq = dx * dx + dz * dz;
      if (dSq < radiusSq) {
        const falloff = Math.exp(-dSq / (radiusSq * 0.32));
        cells[i].velY += strength * falloff;
      }
    }
  };

  let hasPointer = false;
  let scrollProgress = 0;
  let smoothScrollProgress = 0;

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
    if (_raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
      injectImpulse(_hitPoint.x, _hitPoint.z, -3.4, 14);
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

  const registerTimer = (id: number) => {
    timerId = id;
  };

  function updateHoneycombWave(elapsed: number, delta: number) {
    currentThemeMix = THREE.MathUtils.damp(currentThemeMix, targetThemeMix, 5.2, delta);
    smoothScrollProgress = THREE.MathUtils.damp(smoothScrollProgress, scrollProgress, 4.0, delta);

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
      fog.color.copy(scene.background);
    }
    fog.density = THREE.MathUtils.lerp(0.03, 0.044, currentThemeMix);

    // Light Mode uses strong key-to-fill contrast for crisp shadows; Dark Mode keeps pitch black & darker stealth tones
    hemiLight.color.copy(LIGHT_SKY_COLOR).lerp(DARK_SKY_COLOR, currentThemeMix);
    hemiLight.groundColor.copy(LIGHT_GROUND_COLOR).lerp(DARK_GROUND_COLOR, currentThemeMix);
    hemiLight.intensity = THREE.MathUtils.lerp(0.42, 0.14, currentThemeMix);

    keyLight.color.copy(LIGHT_KEY_COLOR).lerp(DARK_KEY_COLOR, currentThemeMix);
    keyLight.intensity = THREE.MathUtils.lerp(2.25, 0.85, currentThemeMix);

    rimLight.color.copy(LIGHT_RIM_COLOR).lerp(DARK_RIM_COLOR, currentThemeMix);
    rimLight.intensity = THREE.MathUtils.lerp(0.45, 0.65, currentThemeMix);
    blueAccentLight.intensity = THREE.MathUtils.lerp(2.5, 4.5, currentThemeMix);
    cyanRimLight.intensity = THREE.MathUtils.lerp(1.6, 2.5, currentThemeMix);

    const lightDrift = prefersReduced ? 0 : elapsed * 0.28;
    blueAccentLight.position.x = -4.2 + Math.sin(lightDrift) * 2.2;
    blueAccentLight.position.z = 2.8 + Math.cos(lightDrift * 0.8) * 1.8;
    cyanRimLight.position.x = 5.4 + Math.cos(lightDrift * 0.7) * 2.0;

    if (softboxA) {
      softboxA.color.copy(LIGHT_SOFTBOX_COLOR).lerp(DARK_SOFTBOX_COLOR, currentThemeMix);
      softboxA.intensity = THREE.MathUtils.lerp(0.85, 0.75, currentThemeMix);
    }
    if (softboxB) softboxB.intensity = THREE.MathUtils.lerp(0.55, 0.55, currentThemeMix);

    // Low envMapIntensity in Dark Mode prevents RoomEnvironment reflections from lightening the black cells
    wallMat.metalness = THREE.MathUtils.lerp(0.14, 0.52, currentThemeMix);
    wallMat.roughness = THREE.MathUtils.lerp(0.48, 0.52, currentThemeMix);
    wallMat.envMapIntensity = THREE.MathUtils.lerp(0.44, 0.22, currentThemeMix);

    coreMat.metalness = THREE.MathUtils.lerp(0.12, 0.22, currentThemeMix);
    coreMat.iridescence = THREE.MathUtils.lerp(0.08, 0.06, currentThemeMix);
    coreMat.envMapIntensity = THREE.MathUtils.lerp(0.65, 0.32, currentThemeMix);

    lipMat.metalness = THREE.MathUtils.lerp(0.28, 0.78, currentThemeMix);
    lipMat.roughness = THREE.MathUtils.lerp(0.24, 0.26, currentThemeMix);
    lipMat.envMapIntensity = THREE.MathUtils.lerp(0.75, 0.45, currentThemeMix);

    _prevPointer.copy(_smoothPointer);
    let pointerSpeed = 0;
    if (hasPointer) {
      _raycaster.setFromCamera(_pointerNdc, camera);
      if (_raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        _smoothPointer.x = THREE.MathUtils.damp(_smoothPointer.x, _hitPoint.x, 7.5, delta);
        _smoothPointer.z = THREE.MathUtils.damp(_smoothPointer.z, _hitPoint.z, 7.5, delta);
        const moveDx = _smoothPointer.x - _prevPointer.x;
        const moveDz = _smoothPointer.z - _prevPointer.z;
        pointerSpeed = Math.min(Math.sqrt(moveDx * moveDx + moveDz * moveDz) / Math.max(delta, 0.008), 18);
      }
    } else {
      _smoothPointer.x = THREE.MathUtils.damp(_smoothPointer.x, 999, 2.5, delta);
      _smoothPointer.z = THREE.MathUtils.damp(_smoothPointer.z, 999, 2.5, delta);
    }

    const camOffsetX = hasPointer && !prefersReduced ? _pointerNdc.x * 0.45 : 0;
    const camOffsetY =
      (hasPointer && !prefersReduced ? _pointerNdc.y * 0.22 : 0) - smoothScrollProgress * 0.85;
    const camOffsetZ = 13.2 - smoothScrollProgress * 1.1;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, camOffsetX, 3.2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 6.2 + camOffsetY, 3.2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camOffsetZ, 3.2, delta);
    camera.lookAt(0, -0.35 - smoothScrollProgress * 0.25, -0.9);

    const t = prefersReduced ? 1.4 : elapsed;
    const simDelta = Math.min(delta, 0.032);
    const springStiffness = 28.0;
    const neighborCoupling = 16.0;
    const springDamping = 4.6;

    if (!prefersReduced) {
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        let neighborSum = 0;
        const nList = cell.neighbors;
        for (let n = 0; n < nList.length; n++) {
          neighborSum += cells[nList[n]].springY;
        }
        const neighborAvg = nList.length > 0 ? neighborSum / nList.length : 0;

        let wakeForce = 0;
        if (hasPointer) {
          const dx = cell.x - _smoothPointer.x;
          const dz = cell.z - _smoothPointer.z;
          const dSq = dx * dx + dz * dz;
          if (dSq < 12) {
            const proximity = Math.exp(-dSq * 0.34);
            wakeForce = -proximity * (1.2 + pointerSpeed * 0.38);
          }
        }

        const accel =
          -springStiffness * cell.springY +
          neighborCoupling * (neighborAvg - cell.springY) -
          springDamping * cell.velY +
          wakeForce;

        cell.velY += accel * simDelta;
      }

      for (let i = 0; i < cells.length; i++) {
        cells[i].springY = THREE.MathUtils.clamp(
          cells[i].springY + cells[i].velY * simDelta,
          -0.85,
          0.85
        );
      }
    }

    const scrollPhase = smoothScrollProgress * 1.8;

    // Pass 1: Compute heights & transforms for all cells
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];

      const phase1 = cell.x * 0.26 + cell.z * 0.18 - t * 0.92 + scrollPhase;
      const phase2 = cell.x * 0.15 - cell.z * 0.29 + t * 0.68 - scrollPhase * 0.5;
      const phase3 = cell.dist * 0.32 - t * 0.52;

      const wave1 = Math.sin(phase1) * 0.46;
      const wave2 = Math.cos(phase2) * 0.22;
      const wave3 = Math.sin(phase3) * 0.11;

      const y = wave1 + wave2 + wave3 + cell.baseOffset + cell.springY;
      cell.currentY = y;

      const dydx =
        0.26 * 0.46 * Math.cos(phase1) -
        0.15 * 0.22 * Math.sin(phase2) +
        (cell.dist > 0.01 ? (cell.x / cell.dist) * 0.32 * 0.11 * Math.cos(phase3) : 0);
      const dydz =
        0.18 * 0.46 * Math.cos(phase1) +
        0.29 * 0.22 * Math.sin(phase2) +
        (cell.dist > 0.01 ? (cell.z / cell.dist) * 0.32 * 0.11 * Math.cos(phase3) : 0);

      const crestFactor = THREE.MathUtils.clamp((y + 0.65) / 1.48, 0, 1);

      const rotX = dydz * 0.21;
      const rotZ = -dydx * 0.21;

      _dummy.position.set(cell.x, y, cell.z);
      _dummy.rotation.set(rotX, 0, rotZ);
      _dummy.updateMatrix();
      wallMesh.setMatrixAt(i, _dummy.matrix);

      const coreParallax = -0.165 + crestFactor * 0.018;
      _coreDummy.position.set(cell.x, y + coreParallax, cell.z);
      _coreDummy.rotation.set(rotX, 0, rotZ);
      _coreDummy.updateMatrix();
      coreMesh.setMatrixAt(i, _coreDummy.matrix);

      _lipDummy.position.set(cell.x, y + 0.032, cell.z);
      _lipDummy.rotation.set(rotX, 0, rotZ);
      _lipDummy.updateMatrix();
      lipMesh.setMatrixAt(i, _lipDummy.matrix);
    }

    // Pass 2: Compute directional cast shadow occlusion & theme-accurate shading
    _colorA.copy(LIGHT_WALL_BASE).lerp(DARK_WALL_BASE, currentThemeMix);
    _colorB.copy(LIGHT_WALL_CREST).lerp(DARK_WALL_CREST, currentThemeMix);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const crestFactor = THREE.MathUtils.clamp((cell.currentY + 0.65) / 1.48, 0, 1);

      // Directional shadow factor from higher up-sun hexagonal neighbors
      let occlusion = 0;
      const sunList = cell.sunNeighbors;
      for (let s = 0; s < sunList.length; s++) {
        const heightDiff = cells[sunList[s]].currentY - cell.currentY;
        if (heightDiff > 0) {
          occlusion = Math.max(occlusion, Math.min(heightDiff * 1.65, 0.52));
        }
      }
      // Pronounced directional shadow depth in Light Mode & deep crevice grounding in Dark Mode
      const shadowScale = 1.0 - occlusion * THREE.MathUtils.lerp(0.92, 0.55, currentThemeMix);

      _finalColor.copy(_colorA).lerp(_colorB, Math.pow(crestFactor, 1.35));
      _finalColor.offsetHSL(0, 0, cell.toneJitter);
      _finalColor.multiplyScalar(shadowScale);
      wallMesh.setColorAt(i, _finalColor);

      _coreColor
        .copy(LIGHT_CORE_BASE)
        .lerp(DARK_CORE_BASE, currentThemeMix)
        .lerp(
          currentThemeMix > 0.5 ? DARK_CORE_CREST : LIGHT_CORE_CREST,
          Math.pow(crestFactor, 1.55) * (currentThemeMix > 0.5 ? 0.85 : 0.68)
        );
      _coreColor.multiplyScalar(1.0 - occlusion * THREE.MathUtils.lerp(0.98, 0.6, currentThemeMix));
      coreMesh.setColorAt(i, _coreColor);

      // Light mode: crisp slate-to-blue lips with cast shadows; Dark mode: obsidian-black & deep electric blue rims
      if (currentThemeMix > 0.5) {
        _lipColor
          .copy(DARK_LIP_BASE)
          .lerp(DARK_LIP_CREST, Math.pow(crestFactor, 1.45) * 0.85)
          .lerp(DARK_LIP_BLUE, Math.pow(crestFactor, 2.35) * 0.78)
          .multiplyScalar(shadowScale);
        if (currentThemeMix < 0.99) {
          _tempLipColor
            .copy(LIGHT_LIP_BASE)
            .lerp(LIGHT_LIP_CREST, Math.pow(crestFactor, 2.0) * 0.55)
            .multiplyScalar(shadowScale);
          _lipColor.lerp(_tempLipColor, 1 - (currentThemeMix - 0.5) * 2);
        }
      } else {
        _lipColor
          .copy(LIGHT_LIP_BASE)
          .lerp(LIGHT_LIP_CREST, Math.pow(crestFactor, 2.0) * 0.55)
          .multiplyScalar(shadowScale);
        if (currentThemeMix > 0.01) {
          _tempLipColor
            .copy(DARK_LIP_BASE)
            .lerp(DARK_LIP_CREST, Math.pow(crestFactor, 1.45) * 0.85)
            .lerp(DARK_LIP_BLUE, Math.pow(crestFactor, 2.35) * 0.78)
            .multiplyScalar(shadowScale);
          _lipColor.lerp(_tempLipColor, currentThemeMix * 2);
        }
      }
      lipMesh.setColorAt(i, _lipColor);
    }

    wallMesh.instanceMatrix.needsUpdate = true;
    coreMesh.instanceMatrix.needsUpdate = true;
    lipMesh.instanceMatrix.needsUpdate = true;
    if (wallMesh.instanceColor) wallMesh.instanceColor.needsUpdate = true;
    if (coreMesh.instanceColor) coreMesh.instanceColor.needsUpdate = true;
    if (lipMesh.instanceColor) lipMesh.instanceColor.needsUpdate = true;
  }

  function tick() {
    if (disposed) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    updateHoneycombWave(elapsed, delta);
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

  updateHoneycombWave(0, 0.016);
  tick();

  return {
    setTheme: (theme: ThemeMode) => {
      targetThemeMix = theme === 'dark' ? 1 : 0;
      if (prefersReduced) {
        currentThemeMix = targetThemeMix;
        updateHoneycombWave(0, 0.016);
        renderer.render(scene, camera);
      } else {
        injectImpulse(0, -0.5, 1.6, 36);
      }
    },
    triggerRipple: () => {
      injectImpulse(0, -1.0, 2.2, 42);
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
      wallGeo.dispose();
      wallMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      lipGeo.dispose();
      lipMat.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
