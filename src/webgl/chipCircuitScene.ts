import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { afterDraw, detectSoftwareWebGL } from './glUtils';

export type ThemeMode = 'light' | 'dark';

export interface ChipCircuitController {
  setTheme: (theme: ThemeMode) => void;
  triggerRipple: () => void;
  dispose: () => void;
}

interface TraceWaypoint {
  x: number;
  z: number;
}

interface CircuitTrace {
  points: TraceWaypoint[];
  segLengths: number[];
  totalLength: number;
}

interface SignalPulse {
  traceIdx: number;
  progress: number;
  speed: number;
  lengthScale: number;
  phase: number;
}

interface ChipSpec {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  phase: number;
  isHero?: boolean;
}

interface ViaNode {
  x: number;
  z: number;
  baseScale: number;
  phase: number;
  springY: number;
  velY: number;
  neighbors: number[];
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _dummy = new THREE.Object3D();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _finalColor = new THREE.Color();
const _pointerNdc = new THREE.Vector2(99, 99);
const _raycaster = new THREE.Raycaster();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hitPoint = new THREE.Vector3(999, 0, 999);
const _smoothPointer = new THREE.Vector3(999, 0, 999);
const _prevPointer = new THREE.Vector3(999, 0, 999);
const _pulsePos = new THREE.Vector3();

// Light Mode Palette: Pure White Ceramic/Silicon Wafer + Slate Dies + Silver Pins + Crisp Shadows + Ocean Blue Signals
const LIGHT_BG = new THREE.Color('#FFFFFF');
const LIGHT_WAFER = new THREE.Color('#F3F6FA');
const LIGHT_TRACE = new THREE.Color('#B4C0D2');
const LIGHT_CHIP_BODY = new THREE.Color('#273142');
const LIGHT_CHIP_LID = new THREE.Color('#CDD7E6');
const LIGHT_PIN = new THREE.Color('#9AA8BC');
const LIGHT_PULSE = new THREE.Color('#1677FF');

// Dark Mode Palette: Pure Obsidian Black + Brushed Metallic Silver + Electric Ocean Blue
const DARK_BG = new THREE.Color('#000000');
const DARK_WAFER = new THREE.Color('#020305');
const DARK_TRACE = new THREE.Color('#18202E');
const DARK_CHIP_BODY = new THREE.Color('#07090E');
const DARK_CHIP_LID = new THREE.Color('#6D7D94');
const DARK_PIN = new THREE.Color('#9AA8BC');
const DARK_PULSE = new THREE.Color('#1E8EFF');
const DARK_PULSE_CREST = new THREE.Color('#47C6FF');

const LIGHT_KEY_COLOR = new THREE.Color('#FFFDF9');
const DARK_KEY_COLOR = new THREE.Color('#D5E6FF');
const LIGHT_SKY_COLOR = new THREE.Color('#FFFFFF');
const DARK_SKY_COLOR = new THREE.Color('#3C5070');
const LIGHT_GROUND_COLOR = new THREE.Color('#7C8A9E');
const DARK_GROUND_COLOR = new THREE.Color('#000000');

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generates procedural silicon die micro-lithography & brushed wafer surface maps
 */
function createSiliconWaferMaps(maxAnisotropy: number): {
  waferBump: THREE.DataTexture;
  waferRoughness: THREE.DataTexture;
  dieBump: THREE.DataTexture;
} {
  const size = 256;
  const waferBumpData = new Uint8Array(size * size * 4);
  const waferRoughData = new Uint8Array(size * size * 4);
  const dieBumpData = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const rowStreak = seededRandom(y * 1.91) * 18;
    const isGridLineY = y % 32 === 0 || y % 32 === 1;
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const isGridLineX = x % 32 === 0 || x % 32 === 1;
      const micro = seededRandom(x * 0.67 + y * 11.43) * 16;

      // Subtle photolithography etched wafer grid + brushed grain
      const gridStep = isGridLineX || isGridLineY ? -22 : 0;
      const wb = THREE.MathUtils.clamp(Math.round(128 + rowStreak + micro + gridStep), 0, 255);
      waferBumpData[idx] = wb;
      waferBumpData[idx + 1] = wb;
      waferBumpData[idx + 2] = wb;
      waferBumpData[idx + 3] = 255;

      const wr = THREE.MathUtils.clamp(
        Math.round(isGridLineX || isGridLineY ? 235 : 196 + micro * 1.1),
        0,
        255
      );
      waferRoughData[idx] = wr;
      waferRoughData[idx + 1] = wr;
      waferRoughData[idx + 2] = wr;
      waferRoughData[idx + 3] = 255;

      // Fine horizontal brushed titanium texture for IC heat spreader lids
      const dieVal = THREE.MathUtils.clamp(
        Math.round(120 + seededRandom(y * 3.17) * 34 + micro * 0.5),
        0,
        255
      );
      dieBumpData[idx] = dieVal;
      dieBumpData[idx + 1] = dieVal;
      dieBumpData[idx + 2] = dieVal;
      dieBumpData[idx + 3] = 255;
    }
  }

  const waferBump = new THREE.DataTexture(waferBumpData, size, size, THREE.RGBAFormat);
  waferBump.wrapS = THREE.RepeatWrapping;
  waferBump.wrapT = THREE.RepeatWrapping;
  waferBump.repeat.set(14, 12);
  waferBump.anisotropy = maxAnisotropy;
  waferBump.needsUpdate = true;

  const waferRoughness = new THREE.DataTexture(waferRoughData, size, size, THREE.RGBAFormat);
  waferRoughness.wrapS = THREE.RepeatWrapping;
  waferRoughness.wrapT = THREE.RepeatWrapping;
  waferRoughness.repeat.set(14, 12);
  waferRoughness.anisotropy = maxAnisotropy;
  waferRoughness.needsUpdate = true;

  const dieBump = new THREE.DataTexture(dieBumpData, size, size, THREE.RGBAFormat);
  dieBump.wrapS = THREE.RepeatWrapping;
  dieBump.wrapT = THREE.RepeatWrapping;
  dieBump.repeat.set(2, 2);
  dieBump.anisotropy = maxAnisotropy;
  dieBump.needsUpdate = true;

  return { waferBump, waferRoughness, dieBump };
}

/**
 * Builds a single chamfered 3D box/plate via ExtrudeGeometry with crisp beveled edges
 */
function createBeveledChipBoxGeometry(bevelSize = 0.035, bevelThickness = 0.03): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, -0.5);
  shape.lineTo(0.5, -0.5);
  shape.lineTo(0.5, 0.5);
  shape.lineTo(-0.5, 0.5);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 2,
  });
  // Orient extrusion upward from y = 0 to y = 1
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates realistic Manhattan + 45-degree chamfered PCB/Silicon bus trace geometry
 */
function createTraceSegmentGeometry(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  halfWidth: number,
  height: number
): THREE.BufferGeometry {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);

  const geo = new THREE.BoxGeometry(len + halfWidth * 0.65, height, halfWidth * 2);
  const angle = Math.atan2(-dz, dx);
  geo.rotateY(angle);
  geo.translate((x1 + x2) * 0.5, height * 0.5, (z1 + z2) * 0.5);
  return geo;
}

/**
 * Generates an architectural integrated-circuit layout: hero CPU, memory dies, bus lanes, and vias
 */
function generateChipArchitecture(): {
  chips: ChipSpec[];
  traces: CircuitTrace[];
  vias: ViaNode[];
} {
  const chips: ChipSpec[] = [
    // Central Hero Processor Package
    { x: 0, z: -0.4, w: 3.1, d: 2.7, h: 0.24, phase: 0, isHero: true },
    // Surrounding Satellite Controllers & HBM Memory Stacks
    { x: -3.9, z: -1.1, w: 1.55, d: 1.85, h: 0.19, phase: 0.8 },
    { x: 3.9, z: -1.1, w: 1.55, d: 1.85, h: 0.19, phase: 1.6 },
    { x: -3.5, z: 2.35, w: 1.7, d: 1.25, h: 0.17, phase: 2.4 },
    { x: 3.5, z: 2.35, w: 1.7, d: 1.25, h: 0.17, phase: 3.1 },
    { x: 0, z: -3.65, w: 2.1, d: 1.15, h: 0.18, phase: 3.8 },
    { x: 0, z: 3.25, w: 2.3, d: 1.15, h: 0.16, phase: 4.5 },
    // Outer Peripheral I/O & Power Regulators
    { x: -6.8, z: -2.8, w: 1.25, d: 1.25, h: 0.15, phase: 1.1 },
    { x: 6.8, z: -2.8, w: 1.25, d: 1.25, h: 0.15, phase: 2.0 },
    { x: -7.1, z: 1.6, w: 1.35, d: 1.1, h: 0.15, phase: 2.9 },
    { x: 7.1, z: 1.6, w: 1.35, d: 1.1, h: 0.15, phase: 3.6 },
    { x: -4.8, z: -4.4, w: 1.15, d: 0.95, h: 0.14, phase: 4.2 },
    { x: 4.8, z: -4.4, w: 1.15, d: 0.95, h: 0.14, phase: 5.1 },
    { x: -6.2, z: 4.4, w: 1.15, d: 0.95, h: 0.14, phase: 0.5 },
    { x: 6.2, z: 4.4, w: 1.15, d: 0.95, h: 0.14, phase: 1.7 },
  ];

  const traces: CircuitTrace[] = [];
  const viaMap = new Map<string, ViaNode>();

  const addVia = (x: number, z: number, baseScale = 1.0) => {
    const key = `${x.toFixed(2)},${z.toFixed(2)}`;
    if (!viaMap.has(key)) {
      viaMap.set(key, {
        x,
        z,
        baseScale,
        phase: x * 0.35 + z * 0.25,
        springY: 0,
        velY: 0,
        neighbors: [],
      });
    }
  };

  const addTrace = (points: TraceWaypoint[]) => {
    if (points.length < 2) return;
    const segLengths: number[] = [];
    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].z - points[i].z);
      segLengths.push(len);
      totalLength += len;
    }
    if (totalLength > 0.2) {
      traces.push({ points, segLengths, totalLength });
      addVia(points[0].x, points[0].z, 1.0);
      addVia(points[points.length - 1].x, points[points.length - 1].z, 1.15);
    }
  };

  // 1. East & West Parallel Data Bus Lanes radiating from Hero CPU with 45° bends
  const laneOffsets = [-0.95, -0.57, -0.19, 0.19, 0.57, 0.95];
  laneOffsets.forEach((dz, idx) => {
    const sign = dz >= 0 ? 1 : -1;
    const spread = Math.abs(dz) * 1.45;
    // Right bus
    addTrace([
      { x: 1.6, z: -0.4 + dz * 0.72 },
      { x: 2.4 + idx * 0.08, z: -0.4 + dz * 0.72 },
      { x: 3.1 + idx * 0.08, z: -0.4 + dz * 0.72 + sign * 0.45 },
      { x: 5.5 + spread, z: -0.4 + dz * 0.72 + sign * 0.45 },
      { x: 6.4 + spread, z: -0.4 + dz * 1.35 + sign * 1.1 },
      { x: 11.8, z: -0.4 + dz * 1.35 + sign * 1.1 },
    ]);
    // Left bus
    addTrace([
      { x: -1.6, z: -0.4 + dz * 0.72 },
      { x: -2.4 - idx * 0.08, z: -0.4 + dz * 0.72 },
      { x: -3.1 - idx * 0.08, z: -0.4 + dz * 0.72 + sign * 0.45 },
      { x: -5.5 - spread, z: -0.4 + dz * 0.72 + sign * 0.45 },
      { x: -6.4 - spread, z: -0.4 + dz * 1.35 + sign * 1.1 },
      { x: -11.8, z: -0.4 + dz * 1.35 + sign * 1.1 },
    ]);
  });

  // 2. North & South High-Speed Interconnect Buses
  const colOffsets = [-1.05, -0.63, -0.21, 0.21, 0.63, 1.05];
  colOffsets.forEach((dx, idx) => {
    const sign = dx >= 0 ? 1 : -1;
    // South bus toward front edge
    addTrace([
      { x: dx * 0.88, z: 0.98 },
      { x: dx * 0.88, z: 1.75 + (idx % 3) * 0.12 },
      { x: dx * 0.88 + sign * 0.42, z: 2.18 + (idx % 3) * 0.12 },
      { x: dx * 1.65 + sign * 0.6, z: 4.2 },
      { x: dx * 2.2 + sign * 1.1, z: 4.8 },
      { x: dx * 2.2 + sign * 1.1, z: 8.6 },
    ]);
    // North bus toward rear horizon
    addTrace([
      { x: dx * 0.88, z: -1.78 },
      { x: dx * 0.88, z: -2.55 - (idx % 3) * 0.12 },
      { x: dx * 0.88 + sign * 0.45, z: -3.05 - (idx % 3) * 0.12 },
      { x: dx * 1.75 + sign * 0.65, z: -5.1 },
      { x: dx * 2.4 + sign * 1.1, z: -5.8 },
      { x: dx * 2.4 + sign * 1.1, z: -9.8 },
    ]);
  });

  // 3. Outer Diagonal PCB Clock & Power Distribution Traces
  const diagSeeds = [-1, 1];
  for (const sx of diagSeeds) {
    for (const sz of diagSeeds) {
      for (let k = 0; k < 4; k++) {
        const offset = k * 0.42;
        addTrace([
          { x: sx * (3.9 + offset * 0.3), z: sz * (2.2 + offset * 0.2) - 0.3 },
          { x: sx * (5.2 + offset), z: sz * (2.2 + offset * 0.2) - 0.3 },
          { x: sx * (6.8 + offset), z: sz * (3.8 + offset * 0.7) - 0.3 },
          { x: sx * (10.8 + offset), z: sz * (3.8 + offset * 0.7) - 0.3 },
          { x: sx * (12.4 + offset), z: sz * (5.4 + offset) - 0.3 },
        ]);
      }
    }
  }

  // 4. Outer Silicon Wafer Node Grid (Vias around the perimeter that ripple softly on cursor/page wave)
  for (let gx = -10.5; gx <= 10.5; gx += 1.5) {
    for (let gz = -7.5; gz <= 7.5; gz += 1.5) {
      // Keep clear of central IC packages
      const nearChip = chips.some(
        (c) => Math.abs(gx - c.x) < c.w * 0.65 && Math.abs(gz - c.z) < c.d * 0.65
      );
      if (!nearChip && Math.abs(gx) + Math.abs(gz) > 3.8) {
        addVia(gx, gz, 0.82);
      }
    }
  }

  const vias = Array.from(viaMap.values());
  // Link neighbor vias for coupled spring wave propagation
  const maxNeighborDistSq = 2.6 * 2.6;
  for (let i = 0; i < vias.length; i++) {
    for (let j = i + 1; j < vias.length; j++) {
      const dx = vias[i].x - vias[j].x;
      const dz = vias[i].z - vias[j].z;
      if (dx * dx + dz * dz <= maxNeighborDistSq) {
        vias[i].neighbors.push(j);
        vias[j].neighbors.push(i);
      }
    }
  }

  return { chips, traces, vias };
}

export function initChipCircuitScene(
  container: HTMLElement,
  initialTheme: ThemeMode,
  onContextLossChange?: (lost: boolean) => void
): ChipCircuitController {
  const isSoftwareGl = detectSoftwareWebGL();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetThemeMix = initialTheme === 'dark' ? 1 : 0;
  let currentThemeMix = targetThemeMix;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color().copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
  const fog = new THREE.FogExp2(scene.background.getHex(), 0.036);
  scene.fog = fog;

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
  camera.position.set(0, 7.6, 11.8);
  camera.lookAt(0, -0.1, -0.5);

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

  const { waferBump, waferRoughness, dieBump } = createSiliconWaferMaps(maxAnisotropy);

  // Studio Lighting Rig: raking key light casts crisp directional shadows off IC chips & pins in Light Mode
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x7c8a9e, 0.48);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffdf9, 2.25);
  keyLight.position.set(10.5, 7.5, 5.5);
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

  const rimLight = new THREE.DirectionalLight(0x9bc4ff, 0.85);
  rimLight.position.set(-9.5, 5.5, -7.5);
  scene.add(rimLight);

  const blueAccentLight = new THREE.PointLight(0x1677ff, 12, 34, 1.5);
  blueAccentLight.position.set(0, 3.2, 0.5);
  scene.add(blueAccentLight);

  const cyanRimLight = new THREE.PointLight(0x00b8ff, 8, 28, 1.6);
  cyanRimLight.position.set(4.5, 2.8, -2.5);
  scene.add(cyanRimLight);

  let softboxA: THREE.RectAreaLight | null = null;
  let softboxB: THREE.RectAreaLight | null = null;
  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    softboxA = new THREE.RectAreaLight(0xeef5ff, 1.35, 12, 4);
    softboxA.position.set(-5, 7.5, 5);
    softboxA.lookAt(0, 0, 0);
    scene.add(softboxA);

    softboxB = new THREE.RectAreaLight(0x1677ff, 1.25, 10, 3.5);
    softboxB.position.set(7.5, 5.0, -5);
    softboxB.lookAt(0, 0, 0);
    scene.add(softboxB);
  }

  // 1. Silicon Wafer Substrate Floor (receives crisp shadows from chips, traces & pins)
  const waferGeo = new THREE.PlaneGeometry(46, 36);
  waferGeo.rotateX(-Math.PI / 2);
  const waferMat = new THREE.MeshStandardMaterial({
    color: LIGHT_WAFER.clone(),
    roughness: 0.72,
    metalness: 0.14,
    bumpMap: waferBump,
    bumpScale: 0.012,
    roughnessMap: waferRoughness,
    envMapIntensity: 0.45,
  });
  const waferMesh = new THREE.Mesh(waferGeo, waferMat);
  waferMesh.position.y = -0.005;
  waferMesh.receiveShadow = !isSoftwareGl;
  scene.add(waferMesh);

  // Build Circuit Architecture Data
  const { chips, traces, vias } = generateChipArchitecture();

  // 2. Merged 3D Copper/Silver Bus Traces (1 draw call)
  const traceGeos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < traces.length; i++) {
    const pts = traces[i].points;
    for (let s = 0; s < pts.length - 1; s++) {
      traceGeos.push(
        createTraceSegmentGeometry(pts[s].x, pts[s].z, pts[s + 1].x, pts[s + 1].z, 0.026, 0.022)
      );
    }
  }
  const mergedTraceGeo = mergeGeometries(traceGeos, false);
  traceGeos.forEach((g) => g.dispose());
  const traceMat = new THREE.MeshStandardMaterial({
    color: LIGHT_TRACE.clone(),
    roughness: 0.28,
    metalness: 0.78,
    envMapIntensity: 0.9,
  });
  const traceMesh = new THREE.Mesh(mergedTraceGeo, traceMat);
  traceMesh.castShadow = !isSoftwareGl;
  traceMesh.receiveShadow = !isSoftwareGl;
  scene.add(traceMesh);

  // 3. Composite IC Chip Assemblies (Matte Silicon Epoxy Body + Brushed Silver Die Lid + Lead Pins)
  const unitBevelGeo = createBeveledChipBoxGeometry(0.035, 0.032);
  const chipBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.56,
    metalness: 0.14,
    bumpMap: dieBump,
    bumpScale: 0.004,
    envMapIntensity: 0.5,
  });
  const chipBodyMesh = new THREE.InstancedMesh(unitBevelGeo, chipBodyMat, chips.length);
  chipBodyMesh.castShadow = !isSoftwareGl;
  chipBodyMesh.receiveShadow = !isSoftwareGl;
  chipBodyMesh.frustumCulled = false;

  const chipLidMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.85,
    anisotropy: 0.78,
    clearcoat: 0.45,
    clearcoatRoughness: 0.14,
    bumpMap: dieBump,
    bumpScale: 0.005,
    envMapIntensity: 1.05,
  });
  const chipLidMesh = new THREE.InstancedMesh(unitBevelGeo, chipLidMat, chips.length);
  chipLidMesh.castShadow = !isSoftwareGl;
  chipLidMesh.receiveShadow = !isSoftwareGl;
  chipLidMesh.frustumCulled = false;

  chipBodyMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(chips.length * 3), 3);
  chipLidMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(chips.length * 3), 3);

  scene.add(chipBodyMesh);
  scene.add(chipLidMesh);

  // 4. Metallic Silver QFN / Gull-Wing Lead Pins along chip perimeters
  const pinMatrices: THREE.Matrix4[] = [];
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i];
    const step = 0.26;
    const countX = Math.max(2, Math.floor((c.w - 0.24) / step));
    const countZ = Math.max(2, Math.floor((c.d - 0.24) / step));

    for (let px = 0; px < countX; px++) {
      const tx = (px / (countX - 1) - 0.5) * (c.w - 0.34);
      // North & South pins
      _dummy.position.set(c.x + tx, 0.032, c.z + c.d * 0.5 + 0.075);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(0.085, 0.064, 0.16);
      _dummy.updateMatrix();
      pinMatrices.push(_dummy.matrix.clone());

      _dummy.position.set(c.x + tx, 0.032, c.z - c.d * 0.5 - 0.075);
      _dummy.updateMatrix();
      pinMatrices.push(_dummy.matrix.clone());
    }
    for (let pz = 0; pz < countZ; pz++) {
      const tz = (pz / (countZ - 1) - 0.5) * (c.d - 0.34);
      // East & West pins
      _dummy.position.set(c.x + c.w * 0.5 + 0.075, 0.032, c.z + tz);
      _dummy.rotation.set(0, Math.PI / 2, 0);
      _dummy.scale.set(0.085, 0.064, 0.16);
      _dummy.updateMatrix();
      pinMatrices.push(_dummy.matrix.clone());

      _dummy.position.set(c.x - c.w * 0.5 - 0.075, 0.032, c.z + tz);
      _dummy.updateMatrix();
      pinMatrices.push(_dummy.matrix.clone());
    }
  }
  const pinGeo = new THREE.BoxGeometry(1, 1, 1);
  const pinMat = new THREE.MeshStandardMaterial({
    color: LIGHT_PIN.clone(),
    roughness: 0.2,
    metalness: 0.9,
    envMapIntensity: 1.1,
  });
  const pinMesh = new THREE.InstancedMesh(pinGeo, pinMat, pinMatrices.length);
  for (let i = 0; i < pinMatrices.length; i++) {
    pinMesh.setMatrixAt(i, pinMatrices[i]);
  }
  pinMesh.instanceMatrix.needsUpdate = true;
  pinMesh.castShadow = !isSoftwareGl;
  pinMesh.receiveShadow = !isSoftwareGl;
  scene.add(pinMesh);

  // 5. Interactive Via Nodes / Silicon Pads (spring-coupled wave nodes!)
  const viaGeo = new THREE.CylinderGeometry(0.085, 0.105, 0.055, 16);
  const viaMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.24,
    metalness: 0.86,
    envMapIntensity: 1.1,
  });
  const viaMesh = new THREE.InstancedMesh(viaGeo, viaMat, vias.length);
  viaMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(vias.length * 3), 3);
  viaMesh.castShadow = !isSoftwareGl;
  viaMesh.receiveShadow = !isSoftwareGl;
  viaMesh.frustumCulled = false;
  scene.add(viaMesh);

  // 6. Traveling Data Signal Pulses along Circuit Traces
  const pulses: SignalPulse[] = [];
  for (let i = 0; i < traces.length; i++) {
    const r1 = seededRandom(i * 7.13 + 1);
    const r2 = seededRandom(i * 13.37 + 5);
    pulses.push({
      traceIdx: i,
      progress: r1,
      speed: 0.11 + r2 * 0.12,
      lengthScale: 0.24 + r1 * 0.18,
      phase: r2 * Math.PI * 2,
    });
    // Secondary staggered packet on longer traces
    if (traces[i].totalLength > 6) {
      pulses.push({
        traceIdx: i,
        progress: (r1 + 0.5) % 1,
        speed: 0.11 + r2 * 0.12,
        lengthScale: 0.22 + r2 * 0.14,
        phase: r1 * Math.PI * 2,
      });
    }
  }

  const pulseGeo = new THREE.BoxGeometry(1, 0.036, 0.068);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
  });
  const pulseMesh = new THREE.InstancedMesh(pulseGeo, pulseMat, pulses.length);
  pulseMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(pulses.length * 3), 3);
  pulseMesh.frustumCulled = false;
  scene.add(pulseMesh);

  // Helper to inject physical wave impulse into vias & boost trace pulses
  let globalRippleBoost = 0;
  const injectImpulse = (originX: number, originZ: number, strength: number, radiusSq: number) => {
    if (prefersReduced) return;
    globalRippleBoost = Math.min(globalRippleBoost + 0.85, 1.3);
    for (let i = 0; i < vias.length; i++) {
      const dx = vias[i].x - originX;
      const dz = vias[i].z - originZ;
      const dSq = dx * dx + dz * dz;
      if (dSq < radiusSq) {
        const falloff = Math.exp(-dSq / (radiusSq * 0.34));
        vias[i].velY += strength * falloff;
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
      injectImpulse(_hitPoint.x, _hitPoint.z, 2.8, 16);
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

  const registerTimer = (id: number) => {
    timerId = id;
  };

  function updateChipScene(elapsed: number, delta: number) {
    currentThemeMix = THREE.MathUtils.damp(currentThemeMix, targetThemeMix, 4.4, delta);
    smoothScrollProgress = THREE.MathUtils.damp(smoothScrollProgress, scrollProgress, 3.5, delta);
    globalRippleBoost = THREE.MathUtils.damp(globalRippleBoost, 0, 2.2, delta);

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(LIGHT_BG).lerp(DARK_BG, currentThemeMix);
      fog.color.copy(scene.background);
    }
    fog.density = THREE.MathUtils.lerp(0.032, 0.044, currentThemeMix);

    // Light Mode: crisp shadows on white/slate wafer; Dark Mode: pure obsidian black + brushed silver + electric blue
    hemiLight.color.copy(LIGHT_SKY_COLOR).lerp(DARK_SKY_COLOR, currentThemeMix);
    hemiLight.groundColor.copy(LIGHT_GROUND_COLOR).lerp(DARK_GROUND_COLOR, currentThemeMix);
    hemiLight.intensity = THREE.MathUtils.lerp(0.45, 0.28, currentThemeMix);

    keyLight.color.copy(LIGHT_KEY_COLOR).lerp(DARK_KEY_COLOR, currentThemeMix);
    keyLight.intensity = THREE.MathUtils.lerp(2.25, 1.4, currentThemeMix);

    rimLight.intensity = THREE.MathUtils.lerp(0.45, 1.05, currentThemeMix);
    blueAccentLight.intensity = THREE.MathUtils.lerp(2.0, 14.0, currentThemeMix);
    cyanRimLight.intensity = THREE.MathUtils.lerp(1.4, 9.5, currentThemeMix);

    const lightDrift = prefersReduced ? 0 : elapsed * 0.2;
    blueAccentLight.position.x = Math.sin(lightDrift) * 3.2;
    blueAccentLight.position.z = -0.3 + Math.cos(lightDrift * 0.8) * 2.4;
    cyanRimLight.position.x = 4.2 + Math.cos(lightDrift * 0.7) * 2.2;

    if (softboxA) softboxA.intensity = THREE.MathUtils.lerp(0.85, 1.7, currentThemeMix);
    if (softboxB) softboxB.intensity = THREE.MathUtils.lerp(0.5, 1.5, currentThemeMix);

    waferMat.color.copy(LIGHT_WAFER).lerp(DARK_WAFER, currentThemeMix);
    waferMat.envMapIntensity = THREE.MathUtils.lerp(0.35, 0.28, currentThemeMix);

    traceMat.color.copy(LIGHT_TRACE).lerp(DARK_TRACE, currentThemeMix);
    traceMat.envMapIntensity = THREE.MathUtils.lerp(0.75, 0.65, currentThemeMix);

    pinMat.color.copy(LIGHT_PIN).lerp(DARK_PIN, currentThemeMix);
    pinMat.envMapIntensity = THREE.MathUtils.lerp(0.85, 1.05, currentThemeMix);

    chipBodyMat.envMapIntensity = THREE.MathUtils.lerp(0.45, 0.35, currentThemeMix);
    chipLidMat.envMapIntensity = THREE.MathUtils.lerp(0.85, 1.0, currentThemeMix);

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

    // Smooth camera parallax from pointer & scroll
    const camOffsetX = hasPointer && !prefersReduced ? _pointerNdc.x * 0.42 : 0;
    const camOffsetY =
      (hasPointer && !prefersReduced ? _pointerNdc.y * 0.22 : 0) - smoothScrollProgress * 0.85;
    const camOffsetZ = 11.8 - smoothScrollProgress * 1.1;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, camOffsetX, 2.8, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 7.6 + camOffsetY, 2.8, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camOffsetZ, 2.8, delta);
    camera.lookAt(0, -0.1 - smoothScrollProgress * 0.2, -0.5);

    const t = prefersReduced ? 1.2 : elapsed;

    // 1. Update IC Chip Packages (subtle breathing micro-elevation on lid + crisp Light/Dark finishes)
    _colorA.copy(LIGHT_CHIP_BODY).lerp(DARK_CHIP_BODY, currentThemeMix);
    _colorB.copy(LIGHT_CHIP_LID).lerp(DARK_CHIP_LID, currentThemeMix);

    for (let i = 0; i < chips.length; i++) {
      const c = chips[i];
      const breathe = prefersReduced ? 0 : Math.sin(t * 0.95 + c.phase) * 0.008;

      // Silicon substrate package body
      _dummy.position.set(c.x, 0, c.z);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(c.w, c.h, c.d);
      _dummy.updateMatrix();
      chipBodyMesh.setMatrixAt(i, _dummy.matrix);
      chipBodyMesh.setColorAt(i, _colorA);

      // Brushed silver die heat-spreader lid seated flush atop the package
      const lidH = c.isHero ? 0.075 : 0.05;
      _dummy.position.set(c.x, c.h + 0.015 + breathe, c.z);
      _dummy.scale.set(c.w * 0.78, lidH, c.d * 0.78);
      _dummy.updateMatrix();
      chipLidMesh.setMatrixAt(i, _dummy.matrix);

      // Hero CPU lid gets subtle blue edge-sheen modulation in sync with wave
      _finalColor.copy(_colorB);
      if (c.isHero) {
        const heroWave = 0.5 + 0.5 * Math.sin(t * 1.4);
        _finalColor.lerp(
          currentThemeMix > 0.5 ? DARK_PULSE : LIGHT_PULSE,
          heroWave * (currentThemeMix > 0.5 ? 0.14 : 0.08)
        );
      }
      chipLidMesh.setColorAt(i, _finalColor);
    }
    chipBodyMesh.instanceMatrix.needsUpdate = true;
    chipLidMesh.instanceMatrix.needsUpdate = true;
    if (chipBodyMesh.instanceColor) chipBodyMesh.instanceColor.needsUpdate = true;
    if (chipLidMesh.instanceColor) chipLidMesh.instanceColor.needsUpdate = true;

    // 2. Step coupled spring physics across Via Nodes (for organic tactile ripple)
    const simDelta = Math.min(delta, 0.032);
    if (!prefersReduced) {
      for (let i = 0; i < vias.length; i++) {
        const v = vias[i];
        let neighborSum = 0;
        for (let n = 0; n < v.neighbors.length; n++) {
          neighborSum += vias[v.neighbors[n]].springY;
        }
        const neighborAvg = v.neighbors.length > 0 ? neighborSum / v.neighbors.length : 0;

        let wakeForce = 0;
        if (hasPointer) {
          const dx = v.x - _smoothPointer.x;
          const dz = v.z - _smoothPointer.z;
          const dSq = dx * dx + dz * dz;
          if (dSq < 10) {
            wakeForce = Math.exp(-dSq * 0.38) * (1.1 + pointerSpeed * 0.32);
          }
        }

        const accel =
          -26.0 * v.springY +
          14.0 * (neighborAvg - v.springY) -
          4.8 * v.velY +
          wakeForce;
        v.velY += accel * simDelta;
      }

      for (let i = 0; i < vias.length; i++) {
        vias[i].springY = THREE.MathUtils.clamp(vias[i].springY + vias[i].velY * simDelta, -0.25, 0.35);
      }
    }

    for (let i = 0; i < vias.length; i++) {
      const v = vias[i];
      const wave = Math.sin(v.x * 0.45 + v.z * 0.35 - t * 1.15) * 0.025;
      const lift = Math.max(0, wave + v.springY);
      _dummy.position.set(v.x, 0.02 + lift * 0.55, v.z);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(v.baseScale, 1 + lift * 2.2, v.baseScale);
      _dummy.updateMatrix();
      viaMesh.setMatrixAt(i, _dummy.matrix);

      const activeGlow = THREE.MathUtils.clamp((lift * 4.5) + (wave > 0.01 ? 0.22 : 0), 0, 1);
      _finalColor
        .copy(LIGHT_PIN)
        .lerp(DARK_PIN, currentThemeMix)
        .lerp(currentThemeMix > 0.5 ? DARK_PULSE_CREST : LIGHT_PULSE, activeGlow * 0.85);
      viaMesh.setColorAt(i, _finalColor);
    }
    viaMesh.instanceMatrix.needsUpdate = true;
    if (viaMesh.instanceColor) viaMesh.instanceColor.needsUpdate = true;

    // 3. Advance & render smooth Signal Pulses gliding along the 3D circuit traces
    const speedBoost = 1 + globalRippleBoost * 1.15;
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      const trace = traces[p.traceIdx];
      if (!prefersReduced) {
        p.progress = (p.progress + p.speed * speedBoost * delta) % 1;
      }

      const targetDist = p.progress * trace.totalLength;
      let accum = 0;
      let segIdx = 0;
      while (segIdx < trace.segLengths.length - 1 && accum + trace.segLengths[segIdx] < targetDist) {
        accum += trace.segLengths[segIdx];
        segIdx++;
      }
      const segLen = Math.max(trace.segLengths[segIdx], 0.001);
      const localT = THREE.MathUtils.clamp((targetDist - accum) / segLen, 0, 1);
      const a = trace.points[segIdx];
      const b = trace.points[segIdx + 1];

      _pulsePos.set(
        THREE.MathUtils.lerp(a.x, b.x, localT),
        0.026,
        THREE.MathUtils.lerp(a.z, b.z, localT)
      );
      const angle = Math.atan2(-(b.z - a.z), b.x - a.x);

      // Smooth fade envelope at trace ends so pulses never pop abruptly
      const envelope = Math.sin(p.progress * Math.PI);
      const len = p.lengthScale * (0.65 + envelope * 0.65);

      _dummy.position.copy(_pulsePos);
      _dummy.rotation.set(0, angle, 0);
      _dummy.scale.set(len, 0.7 + envelope * 0.5, 0.85 + envelope * 0.35);
      _dummy.updateMatrix();
      pulseMesh.setMatrixAt(i, _dummy.matrix);

      _finalColor
        .copy(LIGHT_PULSE)
        .lerp(DARK_PULSE, currentThemeMix)
        .lerp(
          DARK_PULSE_CREST,
          envelope * (currentThemeMix > 0.5 ? 0.65 : 0.15)
        );
      pulseMesh.setColorAt(i, _finalColor);
    }
    pulseMesh.instanceMatrix.needsUpdate = true;
    if (pulseMesh.instanceColor) pulseMesh.instanceColor.needsUpdate = true;
  }

  function tick() {
    if (disposed) return;
    const rawDelta = Math.min(clock.getDelta(), 0.05);
    smoothDelta = THREE.MathUtils.lerp(smoothDelta, rawDelta, 0.25);
    smoothElapsed += smoothDelta;

    updateChipScene(smoothElapsed, smoothDelta);
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

  updateChipScene(0, 0.016);
  tick();

  return {
    setTheme: (theme: ThemeMode) => {
      targetThemeMix = theme === 'dark' ? 1 : 0;
      if (prefersReduced) {
        currentThemeMix = targetThemeMix;
        updateChipScene(0, 0.016);
        renderer.render(scene, camera);
      } else {
        injectImpulse(0, -0.4, 2.2, 48);
      }
    },
    triggerRipple: () => {
      injectImpulse(0, -0.4, 2.8, 56);
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
      waferGeo.dispose();
      waferMat.dispose();
      mergedTraceGeo.dispose();
      traceMat.dispose();
      unitBevelGeo.dispose();
      chipBodyMat.dispose();
      chipLidMat.dispose();
      pinGeo.dispose();
      pinMat.dispose();
      viaGeo.dispose();
      viaMat.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
      waferBump.dispose();
      waferRoughness.dispose();
      dieBump.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
