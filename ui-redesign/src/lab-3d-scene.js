// CMP direct-operation experiment: 3D polisher that is operated by dragging its parts.
// Built from primitives (no external model) so every part that an operator touches can move:
// carrier head, platen, slurry valve, conditioner arm, wafer. Dimensions are plausible 300 mm values, not a real tool's.
// The scene holds no process state: the page steps Lab3DProcess and hands a view object to update().
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const DECK = 0.86, PAD_TOP = 0.94, ARM_Y = 1.40;
const HEAD = new THREE.Vector3(0.19, 0, 0);                 // carrier axis (platen axis is the origin)
const PEDESTAL = new THREE.Vector3(0.80, DECK + 0.062, 0.36);
const STAGE = new THREE.Vector3(0.83, DECK + 0.052, -0.13);
const NOZZLE = new THREE.Vector3(-0.07, PAD_TOP + 0.11, 0.10);
const PIVOT = new THREE.Vector3(-0.44, 0, -0.36), COND_ARM = 0.42;
const COND_REST = Math.atan2(0.36, 0.44), COND_SWEEP = 0.61, COND_PARK = 1.31;
const CARRY_Y = DECK + 0.14, SNAP = 0.17, PRESS_TRAVEL = 0.24;
const BRAND = 0x0d6efd, GRIP = 0xf97316;

export function create({ canvas, constants, on = {} }) {
  let renderer;
  try {
    const context = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!context) return null;
    renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  } catch { return null; }
  const travel = constants.headTravel, waferR = constants.waferRadius;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe6ebf2); scene.fog = new THREE.Fog(0xe6ebf2, 8, 20);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.05); scene.environment = environment.texture; scene.environmentIntensity = 0.6;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf7faff, 0xb0bbcc, 0.75));
  const key = new THREE.DirectionalLight(0xfff8ee, 2.3); key.position.set(-2.4, 5.2, 3.4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.012; key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -1.9, right: 1.9, top: 1.9, bottom: -1.9, near: 0.5, far: 12 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdbe8ff, 0.9); fill.position.set(3.5, 2.6, -1.5); scene.add(fill);

  const camera = new THREE.PerspectiveCamera(34, 1.6, 0.05, 40);
  const VIEWS = { home: [[1.62, 2.12, 2.88], [0.12, 0.78, 0.0]], head: [[0.95, 1.42, 1.05], [0.16, 1.02, 0]], top: [[0.12, 3.6, 0.02], [0.12, 0.9, 0]], side: [[0.2, 1.25, 2.9], [0.12, 1.0, 0]] };

  // ----- materials -----
  const std = (color, metalness, roughness, extra) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const mat = {
    housing: std(0xdde2e9, 0.05, 0.55), panel: std(0xcbd3dd, 0.05, 0.62), steel: std(0xc3cad3, 0.92, 0.3), brushed: std(0xa9b2bd, 0.8, 0.5),
    aluminum: std(0xd4dae1, 0.75, 0.36), dark: std(0x2b3139, 0.35, 0.55), rubber: std(0x1b1e23, 0.0, 0.9), blue: std(0x1f62d6, 0.55, 0.3),
    ring: std(0xeee9da, 0.0, 0.62), grip: std(GRIP, 0.15, 0.45), red: std(0xd23a2e, 0.25, 0.42), glass: std(0xbfd6e6, 0.1, 0.08, { transparent: true, opacity: 0.28 }),
    silicon: std(0x8d97a6, 0.9, 0.22), slurry: std(0xf1ecdd, 0.0, 0.25, { transparent: true, opacity: 0.86 }), floor: std(0xd4dbe4, 0.0, 0.95),
  };
  const textures = [];
  function canvasTexture(size, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (srgb) t.colorSpace = THREE.SRGBColorSpace; textures.push(t); return t;
  }
  const padMap = canvasTexture(1024, (x, n) => {
    const h = n / 2, scale = h / 0.372;
    x.fillStyle = '#2b3038'; x.fillRect(0, 0, n, n);
    let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 16000; i++) { const v = 34 + Math.floor(rnd() * 22); x.fillStyle = `rgba(${v},${v + 4},${v + 10},.5)`; x.fillRect(rnd() * n, rnd() * n, 1.5, 1.5); }
    x.strokeStyle = 'rgba(8,10,14,.62)'; x.lineWidth = 1.5;
    for (let r = 0.012; r < 0.37; r += 0.0055) { x.beginPath(); x.arc(h, h, r * scale, 0, 7); x.stroke(); }
    x.strokeStyle = 'rgba(8,10,14,.5)'; x.lineWidth = 2.2;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(h + Math.cos(a) * 14, h + Math.sin(a) * 14); x.lineTo(h + Math.cos(a) * h * .99, h + Math.sin(a) * h * .99); x.stroke(); }
    x.fillStyle = 'rgba(150,190,215,.55)'; x.strokeStyle = 'rgba(210,230,245,.7)'; x.lineWidth = 2;      // optical window of the in-situ film monitor
    x.beginPath(); x.roundRect(h + 0.19 * scale - 22, h - 9, 44, 18, 6); x.fill(); x.stroke();
  });
  mat.pad = std(0xffffff, 0.0, 0.9, { map: padMap, bumpMap: padMap, bumpScale: 0.03 });
  const knurl = canvasTexture(256, (x, n) => { x.fillStyle = '#888'; x.fillRect(0, 0, n, n); x.fillStyle = '#444'; for (let i = 0; i < n; i += 8) x.fillRect(i, 0, 4, n); }, false);
  knurl.wrapS = knurl.wrapT = THREE.RepeatWrapping; knurl.repeat.set(14, 1);

  const machine = new THREE.Group(); scene.add(machine);
  const handles = {};                                         // control name -> { materials, anchor(Vector3) }
  function add(geometry, material, parent = machine, position) {
    const m = new THREE.Mesh(geometry, material); m.castShadow = true; m.receiveShadow = true;
    if (position) m.position.set(position[0], position[1], position[2]);
    parent.add(m); return m;
  }
  const ghost = m => { m.raycast = () => {}; m.castShadow = m.receiveShadow = false; return m; };
  const cyl = (rTop, rBottom, h, seg = 48) => new THREE.CylinderGeometry(rTop, rBottom, h, seg);
  const box = (w, h, d, r = 0.008) => new RoundedBoxGeometry(w, h, d, 3, r);
  const lathe = (points, seg = 72) => new THREE.LatheGeometry(points.map(p => new THREE.Vector2(p[0], p[1])), seg);
  /** Marks a group as a draggable part with its own materials so it can light up alone. */
  function control(name, group, anchor) {
    const materials = new Map();
    group.traverse(o => {
      if (!o.isMesh) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      const cloned = list.map(m => { if (!materials.has(m)) materials.set(m, m.clone()); return materials.get(m); });
      o.material = Array.isArray(o.material) ? cloned : cloned[0];
    });
    group.userData.control = name;
    handles[name] = { group, materials: [...materials.values()], anchor, glow: 0 };
  }

  // ----- floor, cabinet, deck -----
  const floor = add(new THREE.CircleGeometry(14, 64), mat.floor); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  const CX = 0.10, CZ = -0.04, W = 1.92, D = 1.34;
  add(box(W, 0.80, D, 0.03), mat.housing, machine, [CX, 0.44, CZ]);
  add(box(W - 0.02, 0.07, D - 0.02, 0.01), mat.dark, machine, [CX, 0.055, CZ]);
  add(box(W + 0.03, 0.035, D + 0.03, 0.012), mat.brushed, machine, [CX, DECK - 0.0175, CZ]);
  for (const x of [-0.63, 0, 0.63]) add(box(0.58, 0.56, 0.012, 0.012), mat.panel, machine, [CX + x, 0.46, CZ + D / 2 + 0.002]);
  for (const x of [-0.63, 0, 0.63]) add(box(0.016, 0.16, 0.022, 0.006), mat.steel, machine, [CX + x + 0.24, 0.50, CZ + D / 2 + 0.018]);
  add(box(W - 0.2, 0.018, 0.012, 0.004), std(BRAND, 0.3, 0.4), machine, [CX, 0.80, CZ + D / 2 + 0.003]);
  for (let i = 0; i < 7; i++) add(box(0.30, 0.008, 0.01, 0.003), mat.dark, machine, [CX + W / 2 + 0.002, 0.30 + i * 0.03, CZ + 0.2]).rotation.y = Math.PI / 2;
  for (const [x, z] of [[-0.8, -0.62], [1.0, -0.62], [-0.8, 0.54], [1.0, 0.54]]) add(cyl(0.035, 0.045, 0.04, 20), mat.dark, machine, [x, 0.02, z]);
  const emo = new THREE.Group(); emo.position.set(CX + W / 2 - 0.12, DECK + 0.001, CZ + D / 2 - 0.09); machine.add(emo);
  add(cyl(0.035, 0.04, 0.02, 24), std(0xe9c531, 0.1, 0.5), emo, [0, 0.01, 0]); add(cyl(0.026, 0.022, 0.022, 24), mat.red, emo, [0, 0.03, 0]);

  // ----- basin, platen, pad -----
  add(lathe([[0.405, 0], [0.445, 0], [0.452, 0.078], [0.44, 0.086], [0.428, 0.078], [0.418, 0.012], [0.405, 0.012]]), mat.steel, machine, [0, DECK, 0]);
  add(cyl(0.405, 0.405, 0.006, 64), mat.dark, machine, [0, DECK + 0.003, 0]);
  const platen = new THREE.Group(); platen.position.y = DECK; machine.add(platen);
  add(lathe([[0, 0.014], [0.33, 0.014], [0.33, 0.03], [0.38, 0.036], [0.38, 0.07], [0.376, 0.074], [0, 0.074]]), mat.aluminum, platen);
  const pad = add(cyl(0.372, 0.372, 0.006, 96), [mat.rubber, mat.pad, mat.rubber], platen, [0, PAD_TOP - DECK - 0.003, 0]);
  const wet = add(new THREE.CircleGeometry(0.37, 96), std(0xe6eef2, 0.0, 0.06, { transparent: true, opacity: 0, depthWrite: false }), platen, [0, PAD_TOP - DECK + 0.0006, 0]);
  wet.rotation.x = -Math.PI / 2; wet.castShadow = false;
  control('platen', platen, new THREE.Vector3(0.14, PAD_TOP + 0.02, 0.35));

  // ----- carrier head: column, arm, motor, bellows, carrier body, retaining ring -----
  const column = new THREE.Vector3(0.58, 0, -0.42);
  add(cyl(0.11, 0.12, 0.03, 32), mat.brushed, machine, [column.x, DECK + 0.015, column.z]);
  add(cyl(0.07, 0.075, ARM_Y + 0.06 - DECK, 32), mat.aluminum, machine, [column.x, (ARM_Y + 0.06 + DECK) / 2, column.z]);
  const armLength = Math.hypot(column.x - HEAD.x, column.z - HEAD.z);
  const arm = add(box(armLength + 0.16, 0.10, 0.13, 0.02), mat.housing, machine, [(column.x + HEAD.x) / 2, ARM_Y + 0.04, (column.z + HEAD.z) / 2]);
  arm.rotation.y = -Math.atan2(column.z - HEAD.z, column.x - HEAD.x);
  add(cyl(0.085, 0.085, 0.045, 32), mat.aluminum, machine, [column.x, ARM_Y + 0.1125, column.z]);
  add(cyl(0.095, 0.095, 0.17, 40), mat.dark, machine, [HEAD.x, ARM_Y + 0.02, HEAD.z]);           // spindle motor
  add(cyl(0.06, 0.07, 0.05, 32), mat.steel, machine, [HEAD.x, ARM_Y + 0.13, HEAD.z]);
  const spinRing = new THREE.Group(); spinRing.position.set(HEAD.x, ARM_Y - 0.04, HEAD.z); machine.add(spinRing);
  add(cyl(0.104, 0.104, 0.04, 56), std(GRIP, 0.2, 0.5, { bumpMap: knurl, bumpScale: 0.05 }), spinRing);
  add(box(0.012, 0.044, 0.02, 0.003), mat.dark, spinRing, [0.104, 0, 0]);
  control('carrier', spinRing, new THREE.Vector3(HEAD.x + 0.19, ARM_Y + 0.01, HEAD.z + 0.02));
  // Zone-pressure dial on the front of the spindle housing: right of centre presses the wafer centre harder.
  const zoneDial = new THREE.Group(); zoneDial.position.set(HEAD.x, ARM_Y + 0.045, HEAD.z + 0.097); machine.add(zoneDial);
  add(cyl(0.046, 0.046, 0.008, 36), mat.steel, zoneDial, [0, 0, -0.004]).rotation.x = Math.PI / 2;
  for (let k = -2; k <= 2; k++) { const tick = add(box(0.004, 0.012, 0.003, 0.001), mat.dark, zoneDial, [Math.sin(k * 0.55) * 0.039, Math.cos(k * 0.55) * 0.039, 0.001]); tick.rotation.z = -k * 0.55; }
  const zoneKnob = new THREE.Group(); zoneDial.add(zoneKnob);
  add(cyl(0.026, 0.03, 0.03, 28), mat.grip, zoneKnob, [0, 0, 0.015]).rotation.x = Math.PI / 2;
  add(box(0.006, 0.024, 0.004, 0.001), std(0xffffff, 0, 0.5), zoneKnob, [0, 0.013, 0.031]);
  control('zone', zoneDial, new THREE.Vector3(HEAD.x - 0.03, ARM_Y + 0.13, HEAD.z + 0.10));

  const head = new THREE.Group(); head.position.set(HEAD.x, PAD_TOP + travel, HEAD.z); machine.add(head);
  const headSpin = new THREE.Group(); head.add(headSpin);
  add(lathe([[0.152, 0], [0.174, 0], [0.176, 0.004], [0.176, 0.014], [0.152, 0.014], [0.152, 0]]), mat.ring, headSpin);
  add(lathe([[0, 0.006], [0.150, 0.006], [0.152, 0.014], [0.178, 0.014], [0.184, 0.022], [0.184, 0.072], [0.168, 0.088], [0.118, 0.10], [0.074, 0.106], [0.074, 0.15], [0, 0.15]]), mat.blue, headSpin);
  add(cyl(0.1845, 0.1845, 0.012, 72), mat.steel, headSpin, [0, 0.046, 0]);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; add(cyl(0.007, 0.007, 0.006, 10), mat.steel, headSpin, [Math.cos(a) * 0.145, 0.094, Math.sin(a) * 0.145]); }
  add(box(0.03, 0.004, 0.012, 0.002), std(0xffffff, 0, 0.5), headSpin, [0.165, 0.09, 0]);        // index mark: shows that the carrier turns
  const grip = add(new THREE.TorusGeometry(0.086, 0.012, 14, 48), mat.grip, head, [0, 0.166, 0]); grip.rotation.x = Math.PI / 2;
  add(cyl(0.03, 0.03, 0.04, 24), mat.steel, head, [0, 0.166, 0]);
  const bellows = add(lathe(Array.from({ length: 13 }, (_, k) => [k % 2 ? 0.066 : 0.05, k / 12]), 40), mat.rubber, machine, [HEAD.x, 0, HEAD.z]);
  const shaft = add(cyl(0.028, 0.028, 1, 24), mat.steel, machine, [HEAD.x, 0, HEAD.z]);
  const contactGlow = ghost(add(new THREE.TorusGeometry(0.18, 0.006, 8, 96), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0, depthWrite: false }), machine, [HEAD.x, PAD_TOP + 0.004, HEAD.z]));
  contactGlow.rotation.x = Math.PI / 2;
  control('head', head, new THREE.Vector3(HEAD.x - 0.25, PAD_TOP + travel + 0.09, HEAD.z + 0.10));

  // ----- slurry: column, valve hand-wheel, delivery tube, stream -----
  const slurryCol = new THREE.Vector3(-0.10, 0, 0.57);
  add(cyl(0.05, 0.055, 0.02, 24), mat.brushed, machine, [slurryCol.x, DECK + 0.01, slurryCol.z]);
  add(cyl(0.032, 0.032, 0.34, 24), mat.aluminum, machine, [slurryCol.x, DECK + 0.17, slurryCol.z]);
  add(box(0.085, 0.085, 0.085, 0.012), mat.brushed, machine, [slurryCol.x, DECK + 0.17, slurryCol.z]);
  const tubePath = new THREE.CatmullRomCurve3([new THREE.Vector3(slurryCol.x, DECK + 0.33, slurryCol.z), new THREE.Vector3(slurryCol.x, DECK + 0.40, slurryCol.z - 0.04),
    new THREE.Vector3(-0.085, NOZZLE.y + 0.13, 0.32), new THREE.Vector3(NOZZLE.x, NOZZLE.y + 0.10, NOZZLE.z + 0.04), new THREE.Vector3(NOZZLE.x, NOZZLE.y + 0.02, NOZZLE.z)]);
  add(new THREE.TubeGeometry(tubePath, 48, 0.012, 12), mat.steel);
  add(cyl(0.012, 0.005, 0.03, 16), mat.dark, machine, [NOZZLE.x, NOZZLE.y + 0.005, NOZZLE.z]);
  const valve = new THREE.Group(); valve.position.set(slurryCol.x, DECK + 0.17, slurryCol.z + 0.07); machine.add(valve);
  const wheel = new THREE.Group(); valve.add(wheel);
  add(new THREE.TorusGeometry(0.052, 0.009, 12, 40), mat.red, wheel);
  for (let k = 0; k < 3; k++) { const spoke = add(box(0.1, 0.012, 0.008, 0.003), mat.red, wheel); spoke.rotation.z = k * Math.PI / 3; }
  add(cyl(0.014, 0.014, 0.03, 16), mat.steel, wheel).rotation.x = Math.PI / 2;
  add(cyl(0.012, 0.012, 0.05, 12), mat.steel, valve, [0, 0, -0.03]).rotation.x = Math.PI / 2;
  control('slurry', valve, new THREE.Vector3(slurryCol.x - 0.12, DECK + 0.21, slurryCol.z + 0.08));
  const stream = ghost(add(cyl(1, 1, 1, 12), mat.slurry, machine, [NOZZLE.x, (NOZZLE.y + PAD_TOP) / 2, NOZZLE.z]));
  const ripples = [0, 1].map(() => { const r = add(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: 0xf6f2e6, transparent: true, opacity: 0, depthWrite: false }), machine, [NOZZLE.x, PAD_TOP + 0.0012, NOZZLE.z]); r.rotation.x = -Math.PI / 2; return ghost(r); });
  // Slurry carried round by the pad: freshest just downstream of the nozzle, thinning and spreading outward with each turn.
  const trailMap = canvasTexture(512, (x, n) => {
    const h = n / 2, k = h / 0.372, sweep = x.createConicGradient(Math.atan2(NOZZLE.z, NOZZLE.x), h, h);
    for (const [stop, alpha] of [[0, 0], [0.3, 0.06], [0.7, 0.34], [0.985, 0.95], [1, 0]]) sweep.addColorStop(stop, `rgba(244,240,228,${alpha})`);
    x.fillStyle = sweep; x.beginPath(); x.arc(h, h, 0.37 * k, 0, 7); x.fill();
    const band = x.createRadialGradient(h, h, 0.06 * k, h, h, 0.37 * k);
    for (const [stop, alpha] of [[0, 0], [0.16, 1], [0.5, 0.55], [1, 0.1]]) band.addColorStop(stop, `rgba(0,0,0,${alpha})`);
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = band; x.fillRect(0, 0, n, n);
  });
  const trail = ghost(add(new THREE.CircleGeometry(0.372, 96), std(0xffffff, 0.0, 0.15, { map: trailMap, transparent: true, opacity: 0, depthWrite: false }), machine, [0, PAD_TOP + 0.0009, 0]));
  trail.rotation.x = -Math.PI / 2;

  // ----- pad conditioner: pivot, arm, diamond disk, cleaning cup -----
  add(cyl(0.06, 0.065, 0.02, 24), mat.brushed, machine, [PIVOT.x, DECK + 0.01, PIVOT.z]);
  add(cyl(0.042, 0.042, 0.20, 24), mat.aluminum, machine, [PIVOT.x, DECK + 0.10, PIVOT.z]);
  const condArm = new THREE.Group(); condArm.position.set(PIVOT.x, DECK + 0.20, PIVOT.z); condArm.rotation.y = -(COND_REST + COND_PARK); machine.add(condArm);
  add(box(COND_ARM + 0.08, 0.05, 0.07, 0.014), mat.housing, condArm, [COND_ARM / 2, 0.02, 0]);
  add(cyl(0.05, 0.05, 0.05, 24), mat.dark, condArm, [0, 0.02, 0]);
  add(cyl(0.05, 0.05, 0.02, 24), mat.grip, condArm, [COND_ARM, 0.055, 0]);
  const condHead = new THREE.Group(); condHead.position.set(COND_ARM, 0, 0); condArm.add(condHead);
  add(cyl(0.02, 0.02, 0.07, 16), mat.steel, condHead, [0, -0.035, 0]);
  const disk = new THREE.Group(); disk.position.y = -0.075; condHead.add(disk);
  add(cyl(0.054, 0.054, 0.012, 32), mat.steel, disk);
  add(cyl(0.05, 0.05, 0.004, 32), std(0x55504a, 0.4, 0.95), disk, [0, -0.008, 0]);
  add(box(0.03, 0.004, 0.008, 0.002), mat.grip, disk, [0.03, 0.007, 0]);
  const cup = new THREE.Vector3(PIVOT.x + COND_ARM * Math.cos(COND_REST + COND_PARK), 0, PIVOT.z + COND_ARM * Math.sin(COND_REST + COND_PARK));
  add(lathe([[0.062, 0], [0.075, 0], [0.075, 0.035], [0.066, 0.035], [0.062, 0.008]], 32), mat.steel, machine, [cup.x, DECK, cup.z]);
  control('conditioner', condArm, new THREE.Vector3(cup.x, DECK + 0.30, cup.z));

  // ----- load pedestal, metrology stage, signal tower, HMI screen -----
  const station = (p, color) => {
    add(cyl(0.175, 0.185, 0.04, 48), mat.brushed, machine, [p.x, DECK + 0.02, p.z]);
    add(cyl(0.16, 0.16, 0.012, 48), std(color, 0.1, 0.6), machine, [p.x, DECK + 0.046, p.z]);
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; add(cyl(0.006, 0.006, 0.012, 10), mat.ring, machine, [p.x + Math.cos(a) * 0.11, p.y - 0.006, p.z + Math.sin(a) * 0.11]); }
  };
  station(PEDESTAL, 0x3f4753); station(STAGE, 0x26303b);
  const probe = new THREE.Group(); probe.position.set(STAGE.x, DECK, STAGE.z); machine.add(probe);
  for (const dz of [-0.2, 0.2]) add(cyl(0.012, 0.012, 0.26, 12), mat.steel, probe, [0.02, 0.13, dz]);
  add(box(0.05, 0.035, 0.44, 0.01), mat.housing, probe, [0.02, 0.265, 0]);
  const sensor = add(box(0.07, 0.06, 0.07, 0.01), mat.dark, probe, [0.02, 0.225, 0]);
  add(cyl(0.014, 0.01, 0.02, 16), mat.glass, probe, [0.02, 0.188, 0]);
  const beam = add(cyl(0.004, 0.004, 1, 8), new THREE.MeshBasicMaterial({ color: 0x35e08a, transparent: true, opacity: 0, depthWrite: false }), probe, [0.02, 0.125, 0]); ghost(beam);
  const tower = new THREE.Group(); tower.position.set(CX - W / 2 + 0.09, DECK, CZ - D / 2 + 0.09); machine.add(tower);
  add(cyl(0.012, 0.012, 0.30, 12), mat.steel, tower, [0, 0.15, 0]);
  const lamps = ['#22c55e', '#f5b301', '#ef4444'].map((color, i) => add(cyl(0.03, 0.03, 0.05, 24), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.05, roughness: 0.35, transparent: true, opacity: 0.92 }), tower, [0, 0.33 + i * 0.054, 0]));
  add(cyl(0.031, 0.031, 0.01, 24), mat.dark, tower, [0, 0.49, 0]);
  const hmi = new THREE.Group(); hmi.position.set(-0.40, DECK, -0.60); hmi.rotation.y = 0.42; machine.add(hmi);
  add(cyl(0.016, 0.02, 0.36, 12), mat.steel, hmi, [0, 0.18, 0]);
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 512; screenCanvas.height = 320;
  const screenTexture = new THREE.CanvasTexture(screenCanvas); screenTexture.colorSpace = THREE.SRGBColorSpace; textures.push(screenTexture);
  const panel = new THREE.Group(); panel.position.set(0, 0.47, 0); panel.rotation.x = -0.2; hmi.add(panel);
  add(box(0.42, 0.27, 0.03, 0.012), mat.dark, panel);
  ghost(add(new THREE.PlaneGeometry(0.39, 0.244), new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }), panel, [0, 0, 0.0156]));

  // ----- wafer -----
  const filmCanvas = document.createElement('canvas'); filmCanvas.width = filmCanvas.height = 256;
  const filmTexture = new THREE.CanvasTexture(filmCanvas); filmTexture.colorSpace = THREE.SRGBColorSpace; textures.push(filmTexture);
  const waferHolder = new THREE.Group(); machine.add(waferHolder);
  const wafer = add(cyl(waferR, waferR, 0.004, 96), [mat.silicon, std(0xffffff, 0.35, 0.2, { map: filmTexture }), mat.silicon], waferHolder);
  control('wafer', waferHolder, new THREE.Vector3());
  const targets = { head: new THREE.Vector3(HEAD.x, CARRY_Y, HEAD.z), pedestal: PEDESTAL.clone(), stage: STAGE.clone() };
  const targetRings = Object.fromEntries(Object.entries(targets).map(([name, p]) => {
    const ring = add(new THREE.RingGeometry(0.158, 0.176, 64), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), machine,
      [p.x, name === 'head' ? PAD_TOP + 0.002 : p.y + 0.004, p.z]);
    ring.rotation.x = -Math.PI / 2; return [name, ghost(ring)];
  }));

  // ----- interaction: drag parts, orbit the rest -----
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3(), tmp = new THREE.Vector3();
  let view = null, hovered = null, drag = null, disposed = false, clock = 0, carried = null, measuring = 0;
  const setNdc = ev => { const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, 1 - (ev.clientY - r.top) / r.height * 2); raycaster.setFromCamera(ndc, camera); };
  function controlAt(ev) {
    setNdc(ev);
    const first = raycaster.intersectObjects(machine.children, true).find(h => { for (let o = h.object; o; o = o.parent) if (!o.visible) return false; return h.object.material.opacity !== 0; });
    if (!first) return null;
    for (let o = first.object; o; o = o.parent) if (o.userData.control) return { name: o.userData.control, point: first.point.clone() };
    return null;
  }
  const emit = (name, value) => on.control?.(name, value);
  const strokeOf = s => s <= 1 ? s * travel : travel + (s - 1) * PRESS_TRAVEL;
  const commandOf = u => u <= travel ? u / travel : 1 + (u - travel) / PRESS_TRAVEL;
  const current = name => view?.controls?.[name] ?? 0;
  function beginDrag(found, ev) {
    const base = { name: found.name, x: ev.clientX, y: ev.clientY, moved: false, start: current(found.name) };
    if (found.name === 'head') {
      camera.getWorldDirection(tmp); tmp.y = 0; tmp.normalize();
      plane.setFromNormalAndCoplanarPoint(tmp, found.point); base.y0 = found.point.y; base.plane = plane.clone();
    } else if (found.name === 'platen') {
      base.angle = Math.atan2(found.point.z, found.point.x); base.turned = 0;
    } else if (found.name === 'wafer') {
      if (view?.wafer?.where === 'head' && view.gap < travel * 0.5) return null;       // lift the head before taking the wafer
      base.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CARRY_Y);
    }
    return base;
  }
  function moveDrag(ev) {
    const d = drag, dx = ev.clientX - d.x, dy = ev.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      // A raised head holding a wafer: a sideways pull takes the wafer out, a vertical pull moves the head.
      if (d.name === 'head' && view?.wafer?.where === 'head' && view.gap > travel * 0.5 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        d.name = 'wafer'; d.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CARRY_Y);
      }
      on.drag?.(d.name);
    }
    setNdc(ev);
    if (d.name === 'head') {
      if (raycaster.ray.intersectPlane(d.plane, hit)) emit('head', commandOf(Math.max(0, strokeOf(d.start) - (hit.y - d.y0))));
    } else if (d.name === 'platen') {
      plane.set(new THREE.Vector3(0, 1, 0), -PAD_TOP);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        let step = Math.atan2(hit.z, hit.x) - d.angle; step = Math.atan2(Math.sin(step), Math.cos(step));
        d.angle += step; d.turned += step; emit('platen', d.start < 1 ? Math.abs(d.turned) * 38 : d.start - d.turned * 38);
      }
    } else if (d.name === 'carrier') emit('carrier', d.start + dx * 0.5);
    else if (d.name === 'zone') emit('zone', d.start + dx * 0.001);
    else if (d.name === 'slurry') emit('slurry', d.start + (dx - dy) * 1.4);
    else if (d.name === 'wafer' && raycaster.ray.intersectPlane(d.plane, hit)) {
      carried = hit.clone(); carried.x = THREE.MathUtils.clamp(carried.x, CX - W / 2 + 0.1, CX + W / 2 - 0.05); carried.z = THREE.MathUtils.clamp(carried.z, CZ - D / 2 + 0.1, CZ + D / 2 + 0.25);
    }
  }
  function dropTarget() {
    if (!carried) return null;
    let best = null;
    for (const [name, p] of Object.entries(targets)) {
      if (!targetAllowed(name)) continue;
      const dist = Math.hypot(carried.x - p.x, carried.z - p.z);
      if (dist < SNAP && (!best || dist < best.dist)) best = { name, dist };
    }
    return best?.name ?? null;
  }
  const targetAllowed = name => !!view?.wafer && view.wafer.where !== name && (name !== 'head' || view.gap > travel * 0.5);
  function endDrag() {
    const d = drag; drag = null; controls.enabled = true;
    if (!d) return;
    if (d.name === 'wafer' && d.moved) { const target = dropTarget(); carried = null; if (target) on.wafer?.(target); }
    else if (d.name === 'conditioner' && !d.moved) emit('conditioner', !current('conditioner'));
    carried = null; on.drag?.(null);
  }
  const pointerDown = ev => {
    if (ev.button !== 0) return;
    const found = controlAt(ev); if (!found) return;
    const next = beginDrag(found, ev); if (!next) { on.refuse?.(found.name); return; }
    drag = next; controls.enabled = false;
    try { canvas.setPointerCapture(ev.pointerId); } catch { /* synthetic events have no capture */ }
  };
  const pointerMove = ev => {
    if (drag) { moveDrag(ev); return; }
    if (ev.buttons) return;
    const found = controlAt(ev), name = found?.name ?? null;
    if (name !== hovered) { hovered = name; canvas.style.cursor = name ? (name === 'conditioner' ? 'pointer' : 'grab') : ''; on.hover?.(name); }
  };
  const pointerUp = () => endDrag();
  const onWheel = ev => {
    const found = controlAt(ev); if (!found || found.name === 'wafer') return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const up = ev.deltaY < 0 ? 1 : -1, name = found.name;
    if (name === 'head') emit('head', current('head') - up * (current('head') > 1 ? 0.1 / constants.pressureMax : 0.04));
    else if (name === 'platen' || name === 'carrier') emit(name, current(name) + up);
    else if (name === 'slurry') emit('slurry', current('slurry') + up * 5);
    else if (name === 'zone') emit('zone', current('zone') + up * 0.005);
  };
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  const pointerLeave = () => { if (!drag && hovered) { hovered = null; on.hover?.(null); } };
  canvas.addEventListener('pointerleave', pointerLeave);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.8; controls.panSpeed = 0.6;
  controls.minDistance = 0.9; controls.maxDistance = 7; controls.minPolarAngle = 0.05; controls.maxPolarAngle = Math.PI * 0.495;

  let glide = null;
  function setView(name = 'home', instant = false) {
    const v = VIEWS[name]; if (!v) return;
    if (instant) { glide = null; camera.position.set(...v[0]); controls.target.set(...v[1]); controls.update(); }
    else glide = { position: new THREE.Vector3(...v[0]), target: new THREE.Vector3(...v[1]) };
  }
  controls.addEventListener('start', () => { glide = null; });
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h < 1.2 ? 46 : 34; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);

  /** Screen position (CSS px inside the canvas) of a named part, for labels drawn by the page. */
  function screenOf(name) {
    const h = handles[name], p = h ? h.anchor : name === 'pedestal' ? PEDESTAL : name === 'stage' ? STAGE : null;
    if (!p) return null;
    tmp.copy(p).project(camera);
    return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight, visible: tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 };
  }

  const waferGoal = new THREE.Vector3(), lampLevel = [0.05, 0.05, 0.05];
  /** Moves every part to match the process state. `dt` is real seconds since the last frame. */
  function update(next, dt = 0.016) {
    view = next; clock += dt;
    const gap = THREE.MathUtils.clamp(next.gap, 0, travel), headY = PAD_TOP + gap;
    head.position.y = headY; headSpin.rotation.y = next.carrierAngle; spinRing.rotation.y = next.carrierAngle;
    zoneKnob.rotation.z = -(next.controls.zone || 0) / constants.zoneMax * 1.1;
    handles.head.anchor.y = headY + 0.09;
    const bottom = headY + 0.186, top = ARM_Y - 0.065;
    bellows.position.y = bottom; bellows.scale.y = Math.max(0.02, top - bottom);
    shaft.position.y = (bottom + top) / 2; shaft.scale.y = Math.max(0.02, top - bottom);
    platen.rotation.y = next.platenAngle;
    const pressure = next.pressure / constants.pressureMax;
    contactGlow.material.opacity = next.contact ? 0.25 + 0.6 * pressure : 0;
    contactGlow.material.color.setHex(next.alarm ? 0xef4444 : BRAND);
    contactGlow.scale.setScalar(1 + 0.012 * pressure);
    // slurry: valve angle, stream, ripples, wet sheen on the pad
    const flow = next.flow / constants.slurryMax;
    wheel.rotation.z = -next.controls.slurry / constants.slurryMax * Math.PI * 1.5;
    stream.visible = next.flow > 1; const width = 0.0022 + 0.0048 * Math.sqrt(flow);
    stream.scale.set(width, NOZZLE.y - PAD_TOP, width);
    ripples.forEach((r, i) => { const t = (clock * 1.3 + i * 0.5) % 1; r.visible = next.flow > 1; r.scale.setScalar(0.012 + t * (0.03 + 0.05 * flow)); r.material.opacity = (1 - t) * 0.55 * Math.min(1, flow * 4); });
    trail.material.opacity = 0.8 * Math.min(1, flow * 2.2) * Math.min(1, next.platenRpm / 20);
    wet.material.opacity = 0.34 * next.coverage; pad.material[1].roughness = Math.max(0.2, 0.92 - 0.5 * next.coverage - 0.25 * (1 - next.glaze));
    // conditioner: parked over its cup, or sweeping across the pad
    const sweeping = next.controls.conditioner;
    const goal = COND_REST + (sweeping ? COND_SWEEP * (0.5 - 0.5 * Math.cos(next.sweepPhase)) : COND_PARK);
    const angle = -condArm.rotation.y + (goal + condArm.rotation.y) * Math.min(1, dt * (sweeping ? 6 : 2.5));
    condArm.rotation.y = -angle;
    const lowered = sweeping && Math.abs(goal - angle) < 0.5 ? 1 : 0;
    condHead.position.y += ((lowered ? -0.036 : 0.03) - condHead.position.y) * Math.min(1, dt * 5);
    disk.rotation.y -= dt * (sweeping ? 9 : 0);
    handles.conditioner.anchor.set(PIVOT.x + COND_ARM * Math.cos(angle), DECK + 0.33, PIVOT.z + COND_ARM * Math.sin(angle));
    // wafer
    const w = next.wafer;
    waferHolder.visible = !!w;
    if (w) {
      const held = w.where === 'head' && !carried;
      if (carried) waferGoal.set(carried.x, CARRY_Y, carried.z);
      else if (held) waferGoal.set(HEAD.x, headY + 0.002, HEAD.z);
      else waferGoal.copy(w.where === 'stage' ? STAGE : PEDESTAL).setY((w.where === 'stage' ? STAGE.y : PEDESTAL.y) + 0.002);
      if (held && waferHolder.userData.held) waferHolder.position.copy(waferGoal);
      else waferHolder.position.lerp(waferGoal, Math.min(1, dt * 14));
      waferHolder.userData.held = held && waferHolder.position.distanceTo(waferGoal) < 0.004;
      const flip = held ? Math.PI : 0;                                    // the film faces the pad in the head, up on the stations
      wafer.rotation.x += (flip - wafer.rotation.x) * Math.min(1, dt * 12);
      wafer.rotation.y = held ? next.carrierAngle : 0;
      handles.wafer.anchor.copy(waferHolder.position).y += 0.06;
    }
    const dragging = drag?.name === 'wafer' && drag.moved, snap = dragging ? dropTarget() : null;
    for (const [name, ring] of Object.entries(targetRings)) {
      const goalOpacity = dragging && targetAllowed(name) ? (snap === name ? 0.95 : 0.4 + 0.2 * Math.sin(clock * 6)) : 0;
      ring.material.opacity += (goalOpacity - ring.material.opacity) * Math.min(1, dt * 12);
      ring.material.color.setHex(snap === name ? 0x10b981 : BRAND);
    }
    // metrology beam and signal tower
    measuring = Math.max(0, measuring - dt);
    beam.material.opacity = measuring > 0 ? 0.85 : 0; beam.scale.y = 0.13;
    beam.position.z = measuring > 0 ? Math.sin(clock * 9) * 0.13 : 0; sensor.position.z = beam.position.z;
    const state = next.alarm ? 2 : next.polishing ? 0 : 1;
    lamps.forEach((lamp, i) => { const want = i === state ? (i === 2 ? 1.6 + Math.sin(clock * 10) : 1.5) : 0.04; lampLevel[i] += (want - lampLevel[i]) * Math.min(1, dt * 10); lamp.material.emissiveIntensity = lampLevel[i]; });
    // part highlight
    for (const [name, h] of Object.entries(handles)) {
      const want = drag?.name === name ? 0.5 : hovered === name ? 0.3 : 0;
      if (Math.abs(want - h.glow) < 0.002) continue;
      h.glow += (want - h.glow) * Math.min(1, dt * 14);
      for (const m of h.materials) { m.emissive?.setHex(BRAND); m.emissiveIntensity = h.glow; }
    }
    if (glide) {
      const k = Math.min(1, dt * 5);
      camera.position.lerp(glide.position, k); controls.target.lerp(glide.target, k);
      if (camera.position.distanceTo(glide.position) < 0.004) glide = null;
    }
    controls.update();
  }
  function render() { if (!disposed) renderer.render(scene, camera); }

  setView('home', true); resize();
  return {
    update, render, resize, setView, screenOf,
    /** Name of the draggable part under a pointer position, or null (used by the interaction tests). */
    pickAt(clientX, clientY) { return controlAt({ clientX, clientY })?.name ?? null; },
    /** Screen position of a world point (used by the interaction tests). */
    project(x, y, z) { tmp.set(x, y, z).project(camera); return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight }; },
    layout: { deck: DECK, padTop: PAD_TOP, armY: ARM_Y, carryY: CARRY_Y, zone: [HEAD.x, ARM_Y + 0.045, HEAD.z + 0.128], head: HEAD.toArray(), pedestal: PEDESTAL.toArray(), stage: STAGE.toArray(), valve: [slurryCol.x, DECK + 0.17, slurryCol.z + 0.08], cup: [cup.x, DECK + 0.262, cup.z] },
    filmCanvas, screenCanvas,
    refreshFilm() { filmTexture.needsUpdate = true; }, refreshScreen() { screenTexture.needsUpdate = true; },
    startMeasuring(seconds = 1.4) { measuring = seconds; },
    get dragging() { return drag?.moved ? drag.name : null; }, get hovered() { return hovered; },
    dispose() {
      disposed = true; observer.disconnect(); controls.dispose();
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('pointerleave', pointerLeave);
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
      textures.forEach(t => t.dispose()); environment.dispose(); renderer.dispose();
    },
  };
}
