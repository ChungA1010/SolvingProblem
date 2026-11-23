// CMP direct-operation experiment: 3D polisher that is operated by dragging its parts.
// Built from primitives (no external model) so every part an operator touches can move. The layout follows a
// single-platen R&D polisher: wet deck with a splash bowl, carrier head under an overarm, utility wall behind.
// Dimensions are plausible 300 mm values, not a real tool's.
// The scene holds no process state: the page steps Lab3DProcess and hands a view object to update().
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const DECK = 0.86, PAD_TOP = 0.94, ARM_Y = 1.40;
const HEAD = new THREE.Vector3(0.19, 0, 0);                 // carrier axis (platen axis is the origin)
const PEDESTAL = new THREE.Vector3(0.80, DECK + 0.062, 0.36);
const STAGE = new THREE.Vector3(0.83, DECK + 0.052, -0.13);
const CLEANER = new THREE.Vector3(-0.63, DECK + 0.060, 0.39);   // spin chuck of the post-CMP cleaner
const BRUSH_PIVOT = [-0.15, -0.17], BRUSH_ARM = 0.2, BRUSH_PARK = 0, BRUSH_IN = 0.85, BRUSH_OUT = 0.3;   // arm angles about its post (rad)
const NOZZLE = new THREE.Vector3(-0.07, PAD_TOP + 0.11, 0.10);
const PIVOT = new THREE.Vector3(-0.44, 0, -0.36), COND_ARM = 0.42;
const COND_REST = Math.atan2(0.36, 0.44), COND_SWEEP = 0.61, COND_PARK = 1.31;
const CARRY_Y = DECK + 0.14, SNAP = 0.17, PRESS_TRAVEL = 0.24;
const CX = 0.10, CZ = -0.04, W = 1.92, D = 1.34;            // cabinet footprint
const FRONT = CZ + D / 2, BACK = CZ - D / 2, LEFT = CX - W / 2, RIGHT = CX + W / 2;
const WALL_D = 0.20, WALL_Z = BACK + WALL_D / 2, WALL_F = BACK + WALL_D, WALL_TOP = 1.80;
const HEAD_TOP = 0.196, BELLOWS_TOP = ARM_Y - 0.106;
const BRAND = 0x0d6efd, ACCENT = 0xf26a1b;
const CLICK_PARTS = ['conditioner', 'emo'];                 // operated by a click instead of a drag

/** `cleaner: true` adds the post-CMP cleaner to the deck; a page that does not clean wafers leaves it out. */
export function create({ canvas, constants, on = {}, cleaner: withCleaner = false }) {
  let renderer;
  try {
    const context = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!context) return null;
    renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  } catch { return null; }
  const travel = constants.headTravel, waferR = constants.waferRadius;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2), frames = 0, slowFrames = 0, adaptive = true;      // stepped down if the display cannot keep up
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdde1e7); scene.fog = new THREE.Fog(0xdde1e7, 9, 22);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04); scene.environment = environment.texture; scene.environmentIntensity = 0.85;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf6f9ff, 0xa9b2c2, 0.42));
  const key = new THREE.DirectionalLight(0xfff7ec, 2.25); key.position.set(-2.5, 6.3, 3.6); key.target.position.set(0.1, 0.9, 0); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.012; key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -2.0, right: 2.0, top: 2.0, bottom: -2.0, near: 0.5, far: 14 });
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdce8ff, 0.55); fill.position.set(3.6, 2.6, 1.4); scene.add(fill);
  const lamp = new THREE.SpotLight(0xfff9f0, 0.8, 4, 1.05, 0.85, 1.4);          // light bar under the canopy
  lamp.position.set(CX, WALL_TOP - 0.02, WALL_F + 0.10); lamp.target.position.set(CX, DECK, 0.12); scene.add(lamp, lamp.target);

  const camera = new THREE.PerspectiveCamera(34, 1.6, 0.05, 60);

  // ----- materials and textures -----
  const std = (color, metalness, roughness, extra) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const lcg = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const textures = [];
  function canvasTexture(size, draw, srgb = true) {
    const [w, h] = Array.isArray(size) ? size : [size, size], c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (srgb) t.colorSpace = THREE.SRGBColorSpace; textures.push(t); return t;
  }
  /** Roughness streaks of a brushed or turned metal surface. */
  function brushed(repeatX, repeatY) {
    const t = canvasTexture(256, (x, n) => {
      x.fillStyle = '#9c9c9c'; x.fillRect(0, 0, n, n); const rnd = lcg(3);
      for (let i = 0; i < 2600; i++) { const v = 105 + Math.floor(rnd() * 100); x.fillStyle = `rgba(${v},${v},${v},.35)`; x.fillRect(rnd() * n - 40, rnd() * n, 40 + rnd() * 160, 1); }
    }, false);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeatX, repeatY); return t;
  }
  const mat = {
    paint: new THREE.MeshPhysicalMaterial({ color: 0xe1e4e8, metalness: 0, roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.4 }),   // powder-coated panels
    wall: std(0xd0d5dc, 0, 0.62),
    stainless: std(0xd4d8dd, 1, 0.52, { roughnessMap: brushed(3, 3) }), deck: std(0xd0d4d9, 1, 0.56, { roughnessMap: brushed(10, 7) }),
    satin: std(0xbfc5cc, 1, 0.44), aluminum: std(0xd6dade, 0.92, 0.36), anodized: std(0x24272c, 0.65, 0.42), graphite: std(0x3b4048, 0.2, 0.62),
    rubber: std(0x16181b, 0, 0.9), pp: std(0xf0efe9, 0, 0.48), peek: std(0xd9cdae, 0, 0.5), brass: std(0xc9a55a, 1, 0.35),
    red: std(0xc9281f, 0.1, 0.38), yellow: std(0xf1c40f, 0, 0.5), accent: std(ACCENT, 0.1, 0.45), white: std(0xfafafa, 0, 0.5),
    cable: std(0xee7a1d, 0, 0.6), airline: std(0x2f7fd8, 0, 0.35), fibre: std(0xf2d21b, 0, 0.5),
    pfa: std(0xf2f2ec, 0, 0.22, { transparent: true, opacity: 0.62 }), clear: std(0xdfeaf2, 0, 0.06, { transparent: true, opacity: 0.25, depthWrite: false }),
    silicon: std(0x8d97a6, 0.9, 0.22), slurry: std(0xf4f1e6, 0, 0.25, { transparent: true, opacity: 0.9 }),
  };
  // Polyurethane pad: cream, with concentric and radial grooves, a burnished wafer track and the window of the film monitor.
  const padMap = canvasTexture(2048, (x, n) => {
    const h = n / 2, k = h / 0.372, rnd = lcg(7);
    x.fillStyle = '#cbc4b1'; x.fillRect(0, 0, n, n);
    for (let i = 0; i < 52000; i++) { x.fillStyle = rnd() > 0.5 ? 'rgba(255,255,250,.2)' : 'rgba(104,96,80,.2)'; x.fillRect(rnd() * n, rnd() * n, 2, 2); }
    for (let i = 0; i < 9; i++) {
      const a = rnd() * 6.283, r = (0.08 + rnd() * 0.24) * k, s = (0.03 + rnd() * 0.06) * k, cx = h + Math.cos(a) * r, cy = h + Math.sin(a) * r, g = x.createRadialGradient(cx, cy, 0, cx, cy, s);
      g.addColorStop(0, 'rgba(120,110,92,.12)'); g.addColorStop(1, 'rgba(120,110,92,0)'); x.fillStyle = g; x.fillRect(cx - s, cy - s, 2 * s, 2 * s);
    }
    const track = x.createRadialGradient(h, h, 0.02 * k, h, h, 0.36 * k);
    for (const [stop, alpha] of [[0, 0], [0.12, 0.10], [0.5, 0.13], [0.9, 0.10], [1, 0]]) track.addColorStop(stop, `rgba(96,88,72,${alpha})`);
    x.fillStyle = track; x.beginPath(); x.arc(h, h, 0.37 * k, 0, 7); x.fill();
    x.strokeStyle = 'rgba(78,72,60,.62)'; x.lineWidth = 2;
    for (let r = 0.010; r < 0.369; r += 0.0045) { x.beginPath(); x.arc(h, h, r * k, 0, 7); x.stroke(); }
    x.strokeStyle = 'rgba(70,64,54,.7)'; x.lineWidth = 3.6;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.moveTo(h + Math.cos(a) * 26, h + Math.sin(a) * 26); x.lineTo(h + Math.cos(a) * h * .99, h + Math.sin(a) * h * .99); x.stroke(); }
    x.fillStyle = 'rgba(176,208,226,.85)'; x.strokeStyle = 'rgba(70,90,110,.75)'; x.lineWidth = 3;      // optical window of the in-situ film monitor
    x.beginPath(); x.roundRect(h + 0.19 * k - 44, h - 18, 88, 36, 10); x.fill(); x.stroke();
  });
  mat.pad = std(0xffffff, 0, 0.9, { map: padMap, bumpMap: padMap, bumpScale: 0.045 });
  mat.padEdge = std(0xb7b09e, 0, 0.9);
  const knurl = canvasTexture(256, (x, n) => { x.fillStyle = '#888'; x.fillRect(0, 0, n, n); x.fillStyle = '#444'; for (let i = 0; i < n; i += 8) x.fillRect(i, 0, 4, n); }, false);
  knurl.wrapS = knurl.wrapT = THREE.RepeatWrapping; knurl.repeat.set(18, 1);
  const blobMap = canvasTexture(128, (x, n) => { const g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); });

  // ----- building blocks -----
  const machine = new THREE.Group(); scene.add(machine);
  const parts = {};                                           // name -> { kind: 'control' | 'info', group, materials, anchor, glow }
  function add(geometry, material, parent = machine, position) {
    const m = new THREE.Mesh(geometry, material); m.castShadow = true; m.receiveShadow = true;
    if (position) m.position.set(position[0], position[1], position[2]);
    parent.add(m); return m;
  }
  const small = (...args) => { const m = add(...args); m.castShadow = false; return m; };                       // too small to need a shadow
  const ghost = m => { m.raycast = () => {}; m.castShadow = m.receiveShadow = false; m.userData.fixed = true; return m; };   // effect: not pickable, not lit by hover
  const decal = m => { m.raycast = () => {}; m.castShadow = false; m.userData.fixed = true; return m; };        // label or dial face
  const cyl = (rTop, rBottom, h, seg = 48) => new THREE.CylinderGeometry(rTop, rBottom, h, seg);
  const cube = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const box = (w, h, d, r = 0.008) => new RoundedBoxGeometry(w, h, d, 3, r);
  const lathe = (points, seg = 72) => new THREE.LatheGeometry(points.map(p => new THREE.Vector2(p[0], p[1])), seg);
  const facing = (m, axis) => { if (axis === 'z') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.z = Math.PI / 2; return m; };   // lay a cylinder along z or x
  function tube(points, radius, material, parent = machine, segments = 40) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    return add(new THREE.TubeGeometry(curve, segments, radius, 10), material, parent);
  }
  const screwGeometry = new THREE.CylinderGeometry(1, 1, 1, 6);
  /** A set of cap screws drawn in one call. `list` holds [x, y, z] in the parent's frame. */
  function screws(parent, list, r = 0.006, h = 0.005, axis = 'y', material = mat.stainless) {
    const mesh = new THREE.InstancedMesh(screwGeometry, material, list.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(r, h, r), p = new THREE.Vector3();
    if (axis === 'z') q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2); else if (axis === 'x') q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    list.forEach((v, i) => { p.set(v[0], v[1], v[2]); m.compose(p, q, s); mesh.setMatrixAt(i, m); });
    mesh.castShadow = false; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  const circle = (n, r, y, phase = 0, cx = 0, cz = 0) => Array.from({ length: n }, (_, i) => { const a = phase + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]; });
  /** Printed label: a plane with its own small canvas. */
  function plate(w, h, draw, parent, position, rotation) {
    const m = decal(add(new THREE.PlaneGeometry(w, h), std(0xffffff, 0, 0.55, { map: canvasTexture([Math.round(w * 2600), Math.round(h * 2600)], draw) }), parent, position));
    if (rotation) m.rotation.set(rotation[0], rotation[1], rotation[2]);
    return m;
  }
  const label = (lines, { bg = '#f3f4f6', fg = '#1f2933', size = 0.5, weight = 700, border = null } = {}) => (x, w, h) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    if (border) { x.strokeStyle = border; x.lineWidth = Math.max(2, h * 0.06); x.strokeRect(x.lineWidth / 2, x.lineWidth / 2, w - x.lineWidth, h - x.lineWidth); }
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((line, i) => { x.font = `${i ? 500 : weight} ${h * size / lines.length * (i ? 0.8 : 1)}px "Segoe UI", Arial, sans-serif`; x.fillText(line, w / 2, h * (i + 0.5) / lines.length + h * 0.02, w * 0.94); });
  };
  const hazard = (x, w, h) => {
    x.fillStyle = '#f1c40f'; x.fillRect(0, 0, w, h); x.strokeStyle = '#17191d'; x.lineWidth = h * 0.07; x.strokeRect(x.lineWidth / 2, x.lineWidth / 2, w - x.lineWidth, h - x.lineWidth);
    x.lineJoin = 'round'; x.beginPath(); x.moveTo(w / 2, h * 0.2); x.lineTo(w * 0.8, h * 0.78); x.lineTo(w * 0.2, h * 0.78); x.closePath(); x.stroke();
    x.fillStyle = '#17191d'; x.fillRect(w / 2 - h * 0.035, h * 0.38, h * 0.07, h * 0.22); x.beginPath(); x.arc(w / 2, h * 0.68, h * 0.04, 0, 7); x.fill();
  };
  /** Soft dark patch that grounds a part on the surface under it. */
  function shade(w, d, x, y, z, opacity = 0.3, parent = scene) {
    const m = ghost(add(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobMap, transparent: true, opacity, depthWrite: false }), parent, [x, y, z]));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m;
  }
  /** Marks a group as one part: it lights up alone on hover, and a control can also be dragged. */
  function register(kind, name, group, anchor) {
    const materials = new Map();
    group.traverse(o => {
      if (!o.isMesh || o.userData.fixed) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      const cloned = list.map(m => { if (!materials.has(m)) materials.set(m, m.clone()); return materials.get(m); });
      o.material = Array.isArray(o.material) ? cloned : cloned[0];
    });
    group.userData.part = name;
    parts[name] = { kind, group, materials: [...materials.values()], anchor, glow: 0 };
  }
  const control = (name, group, anchor) => register('control', name, group, anchor);
  const info = (name, group, anchor) => register('info', name, group, anchor);
  /** Analog gauge with a live needle. */
  function gauge(parent, x, y, z, title, max, unit, start = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
    facing(add(cyl(0.041, 0.041, 0.016, 40), mat.stainless, g, [0, 0, 0.008]), 'z');
    decal(add(new THREE.CircleGeometry(0.036, 48), std(0xffffff, 0, 0.5, { map: canvasTexture(256, (c, n) => {
      const h = n / 2; c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, n, n); c.strokeStyle = '#17191d'; c.fillStyle = '#17191d'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i <= 20; i++) { const a = (0.75 - 1.5 * i / 20) * Math.PI, major = i % 5 === 0, r0 = major ? 86 : 96; c.lineWidth = major ? 5 : 2.5; c.beginPath(); c.moveTo(h - Math.sin(a) * r0, h - Math.cos(a) * r0); c.lineTo(h - Math.sin(a) * 110, h - Math.cos(a) * 110); c.stroke(); }
      c.font = '700 25px "Segoe UI", Arial, sans-serif';
      for (let i = 0; i <= 4; i++) { const a = (0.75 - 1.5 * i / 4) * Math.PI; c.fillText(String(+(max * i / 4).toFixed(2)), h - Math.sin(a) * 64, h - Math.cos(a) * 64); }
      c.font = '700 22px "Segoe UI", Arial, sans-serif'; c.fillText(title, h, h + 52); c.font = '600 19px "Segoe UI", Arial, sans-serif'; c.fillText(unit, h, h + 80);
    }) }), g, [0, 0, 0.0166]));
    const needle = new THREE.Group(); needle.position.z = 0.0182; g.add(needle);
    decal(add(cube(0.003, 0.032, 0.001), mat.red, needle, [0, 0.011, 0])); facing(decal(add(cyl(0.005, 0.005, 0.003, 14), mat.anodized, needle)), 'z');
    ghost(add(new THREE.CircleGeometry(0.0365, 48), mat.clear, g, [0, 0, 0.021]));
    const set = v => { needle.rotation.z = (0.75 - 1.5 * THREE.MathUtils.clamp(v / max, 0, 1)) * Math.PI; };
    set(start); return { set };
  }

  // ----- room: raised floor, safety line, contact shadow -----
  const floorMap = canvasTexture(512, (x, n) => {
    x.fillStyle = '#d0d5db'; x.fillRect(0, 0, n, n); const rnd = lcg(11);
    for (let i = 0; i < 2600; i++) { const v = 190 + Math.floor(rnd() * 30); x.fillStyle = `rgba(${v},${v + 3},${v + 8},.6)`; x.fillRect(rnd() * n, rnd() * n, 2, 2); }
    x.fillStyle = 'rgba(96,106,120,.2)'; for (let i = 1; i < 16; i++) for (let j = 1; j < 16; j++) { x.beginPath(); x.arc(i * 32, j * 32, 3.2, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(70,80,94,.7)'; x.lineWidth = 5; x.strokeRect(0, 0, n, n); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.5; x.strokeRect(4, 4, n - 8, n - 8);
  });
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping; floorMap.repeat.set(100, 100);                        // 0.6 m tiles
  const floor = add(new THREE.PlaneGeometry(60, 60), std(0xffffff, 0, 0.5, { map: floorMap }), scene); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  for (const [w, d, x, z] of [[W + 0.98, 0.05, CX, FRONT + 0.465], [W + 0.98, 0.05, CX, BACK - 0.465], [0.05, D + 0.98, LEFT - 0.465, CZ], [0.05, D + 0.98, RIGHT + 0.465, CZ]]) {
    const line = add(new THREE.PlaneGeometry(w, d), mat.yellow, scene, [x, 0.0012, z]); line.rotation.x = -Math.PI / 2; line.castShadow = false;
  }
  shade(W + 0.55, D + 0.55, CX, 0.0008, CZ, 0.42);

  // ----- cabinet -----
  add(box(W, 0.76, D, 0.018), mat.paint, machine, [CX, 0.46, CZ]);
  add(cube(W - 0.08, 0.08, D - 0.08), mat.graphite, machine, [CX, 0.045, CZ]);                                  // recessed plinth
  small(cube(W - 0.05, 0.66, 0.004), mat.graphite, machine, [CX, 0.45, FRONT + 0.001]);                         // dark reveal behind the doors
  for (const dx of [-0.625, 0, 0.625]) {
    add(box(0.612, 0.63, 0.016, 0.006), mat.paint, machine, [CX + dx, 0.45, FRONT + 0.010]);
    const hx = CX + dx + (dx > 0 ? -0.262 : 0.262);
    small(cyl(0.007, 0.007, 0.15, 12), mat.stainless, machine, [hx, 0.52, FRONT + 0.044]);
    for (const dy of [-0.06, 0.06]) facing(small(cyl(0.005, 0.005, 0.028, 8), mat.stainless, machine, [hx, 0.52 + dy, FRONT + 0.030]), 'z');
    facing(small(cyl(0.009, 0.009, 0.004, 14), mat.stainless, machine, [hx, 0.40, FRONT + 0.019]), 'z');     // lock
  }
  add(box(W - 0.04, 0.062, 0.012, 0.004), mat.anodized, machine, [CX, 0.805, FRONT + 0.006]);                   // control strip under the deck
  plate(0.36, 0.04, label(['CMP LAB   CMP-01', '300 mm OXIDE POLISHER'], { bg: '#24272c', fg: '#e9edf3', size: 0.72 }), machine, [LEFT + 0.26, 0.805, FRONT + 0.0125]);
  [[0x22c55e, 0.5], [0xf4f4f0, 0.15], [0xd9342b, 0.2]].forEach(([color, glow], i) => {
    const x = RIGHT - 0.46 + i * 0.055;
    facing(small(cyl(0.018, 0.018, 0.004, 20), mat.stainless, machine, [x, 0.805, FRONT + 0.013]), 'z');
    facing(small(cyl(0.013, 0.013, 0.012, 20), std(color, 0, 0.35, { emissive: color, emissiveIntensity: glow }), machine, [x, 0.805, FRONT + 0.018]), 'z');
  });
  facing(small(cyl(0.014, 0.014, 0.01, 18), mat.stainless, machine, [RIGHT - 0.26, 0.805, FRONT + 0.016]), 'z');   // key switch
  small(cube(0.004, 0.016, 0.012), mat.anodized, machine, [RIGHT - 0.26, 0.805, FRONT + 0.026]);
  for (let i = 0; i < 9; i++) small(cube(0.004, 0.007, 0.30), mat.graphite, machine, [RIGHT + 0.001, 0.24 + i * 0.026, CZ + 0.24]);   // vent
  add(box(0.006, 0.2, 0.3, 0.003), mat.stainless, machine, [RIGHT + 0.003, 0.36, CZ - 0.32]);                   // utility inlets
  for (const [y, z] of [[0.41, -0.42], [0.41, -0.32], [0.41, -0.22], [0.31, -0.37], [0.31, -0.27]]) facing(small(cyl(0.013, 0.013, 0.03, 14), mat.brass, machine, [RIGHT + 0.02, y, CZ + z]), 'x');
  plate(0.2, 0.022, label(['N2   CDA   DIW   DRAIN'], { size: 0.6 }), machine, [RIGHT + 0.0065, 0.475, CZ - 0.32], [0, Math.PI / 2, 0]);
  for (const [x, z] of [[LEFT + 0.1, BACK + 0.1], [RIGHT - 0.1, BACK + 0.1], [LEFT + 0.1, FRONT - 0.1], [RIGHT - 0.1, FRONT - 0.1]]) {
    small(cyl(0.04, 0.045, 0.012, 20), mat.stainless, machine, [x, 0.006, z]); small(cyl(0.012, 0.012, 0.05, 10), mat.stainless, machine, [x, 0.03, z]);
  }
  add(box(W + 0.04, 0.032, D + 0.04, 0.006), mat.deck, machine, [CX, DECK - 0.016, CZ]);                        // stainless wet deck with a drip rim
  add(box(W + 0.04, 0.014, 0.016, 0.004), mat.stainless, machine, [CX, DECK + 0.007, FRONT + 0.012]);
  for (const x of [LEFT - 0.012, RIGHT + 0.012]) add(box(0.016, 0.014, D + 0.04, 0.004), mat.stainless, machine, [x, DECK + 0.007, CZ]);
  const emo = new THREE.Group(); emo.position.set(RIGHT - 0.075, DECK, FRONT - 0.075); machine.add(emo);
  add(box(0.085, 0.045, 0.085, 0.008), mat.yellow, emo, [0, 0.0225, 0]);
  add(cyl(0.022, 0.024, 0.014, 20), mat.anodized, emo, [0, 0.052, 0]);
  const emoCap = add(lathe([[0, 0.058], [0.034, 0.058], [0.036, 0.064], [0.03, 0.076], [0.014, 0.082], [0, 0.083]], 28), mat.red, emo);
  control('emo', emo, new THREE.Vector3(emo.position.x, DECK + 0.06, emo.position.z));

  // ----- utility wall, canopy, light bar -----
  const wallH = WALL_TOP - DECK;
  add(box(W, wallH, WALL_D, 0.014), mat.wall, machine, [CX, DECK + wallH / 2, WALL_Z]);
  small(cube(W - 0.012, 0.11, 0.004), mat.stainless, machine, [CX, DECK + 0.055, WALL_F + 0.002]);              // splash strip
  for (const x of [LEFT + 0.62, RIGHT - 0.52]) small(cube(0.004, wallH - 0.15, 0.003), mat.graphite, machine, [x, DECK + 0.11 + (wallH - 0.15) / 2, WALL_F + 0.0012]);
  add(box(W + 0.03, 0.06, WALL_D + 0.16, 0.012), mat.paint, machine, [CX, WALL_TOP + 0.03, BACK + (WALL_D + 0.16) / 2]);
  ghost(add(cube(W - 0.36, 0.006, 0.028), new THREE.MeshBasicMaterial({ color: 0xffffff }), machine, [CX, WALL_TOP - 0.002, WALL_F + 0.10]));
  plate(0.3, 0.04, label(['CMP LAB', 'CMP-01'], { bg: '#0d6efd', fg: '#ffffff', size: 0.84 }), machine, [LEFT + 0.42, WALL_TOP + 0.03, WALL_F + 0.1605]);
  [['#c9281f', 'SLURRY'], ['#2f7fd8', 'DIW'], ['#9aa3ad', 'N2']].forEach(([color, name], i) => {
    const x = LEFT + 0.16 + i * 0.085, y = DECK + 0.24;
    facing(small(cyl(0.016, 0.016, 0.006, 16), std(color, 0.1, 0.5), machine, [x, y, WALL_F + 0.004]), 'z');
    facing(small(cyl(0.012, 0.012, 0.024, 16), mat.stainless, machine, [x, y, WALL_F + 0.012]), 'z');
    plate(0.07, 0.018, label([name], { size: 0.62 }), machine, [x, y - 0.034, WALL_F + 0.0012]);
  });
  for (let i = 0; i < 8; i++) small(cube(0.5, 0.008, 0.004), mat.graphite, machine, [CX, DECK + 0.5 + i * 0.03, BACK - 0.001]);       // rear vent
  add(box(0.22, 0.3, 0.05, 0.008), mat.paint, machine, [RIGHT - 0.3, DECK + 0.3, BACK - 0.024]);                 // rear junction box
  const tower = new THREE.Group(); tower.position.set(LEFT + 0.16, WALL_TOP + 0.06, WALL_Z + 0.02); machine.add(tower);
  add(cyl(0.03, 0.034, 0.012, 20), mat.anodized, tower, [0, 0.006, 0]); add(cyl(0.011, 0.011, 0.06, 12), mat.stainless, tower, [0, 0.04, 0]);
  const lamps = ['#22c55e', '#f5b301', '#ef4444'].map((color, i) => {
    const m = add(cyl(0.028, 0.028, 0.046, 24), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.05, roughness: 0.3, transparent: true, opacity: 0.94 }), tower, [0, 0.095 + i * 0.05, 0]);
    m.userData.fixed = true; return m;
  });
  add(cyl(0.029, 0.029, 0.01, 24), mat.anodized, tower, [0, 0.248, 0]);
  info('tower', tower, new THREE.Vector3(tower.position.x, tower.position.y + 0.145, tower.position.z));
  // Touch panel on a wall bracket, turned toward the operator.
  const hmi = new THREE.Group(); hmi.position.set(LEFT + 0.36, DECK + 0.60, WALL_F + 0.13); hmi.rotation.y = 0.36; machine.add(hmi);
  facing(add(cyl(0.014, 0.014, 0.14, 12), mat.anodized, machine, [LEFT + 0.345, DECK + 0.60, WALL_F + 0.06]), 'z');
  add(box(0.47, 0.31, 0.034, 0.012), mat.anodized, hmi);
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1024; screenCanvas.height = 640;
  const screenTexture = new THREE.CanvasTexture(screenCanvas); screenTexture.colorSpace = THREE.SRGBColorSpace; screenTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); textures.push(screenTexture);
  decal(add(new THREE.PlaneGeometry(0.43, 0.269), new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }), hmi, [0, 0.004, 0.0176])).receiveShadow = false;
  facing(ghost(add(cyl(0.004, 0.004, 0.002, 10), new THREE.MeshBasicMaterial({ color: 0x35e08a }), hmi, [0.215, -0.143, 0.0176])), 'z');
  info('hmi', hmi, hmi.position.clone());
  const gauges = new THREE.Group(); gauges.position.set(RIGHT - 0.27, DECK + 0.62, WALL_F); machine.add(gauges);
  add(box(0.3, 0.17, 0.012, 0.006), mat.anodized, gauges, [0, -0.015, 0.006]);
  const gaugeHead = gauge(gauges, -0.075, 0, 0.012, 'HEAD', constants.pressureMax, 'psi'), gaugeAir = gauge(gauges, 0.075, 0, 0.012, 'AIR', 1, 'MPa', 0.55);
  plate(0.1, 0.02, label(['DOWN FORCE'], { bg: '#24272c', fg: '#e9edf3', size: 0.6 }), gauges, [-0.075, -0.07, 0.0125]);
  plate(0.1, 0.02, label(['SUPPLY AIR'], { bg: '#24272c', fg: '#e9edf3', size: 0.6 }), gauges, [0.075, -0.07, 0.0125]);
  info('gauges', gauges, new THREE.Vector3(gauges.position.x, gauges.position.y, WALL_F + 0.02));

  // ----- splash bowl, platen, pad -----
  add(lathe([[0.392, 0], [0.468, 0], [0.468, 0.098], [0.462, 0.106], [0.452, 0.106], [0.446, 0.098], [0.446, 0.008], [0.440, 0.002], [0.392, 0.002]], 96), mat.pp, machine, [0, DECK, 0]);
  const sump = small(new THREE.RingGeometry(0.378, 0.447, 96), std(0x8a929b, 0.2, 0.22), machine, [0, DECK + 0.0026, 0]); sump.rotation.x = -Math.PI / 2;
  small(cyl(0.016, 0.016, 0.004, 16), mat.anodized, machine, [0.30, DECK + 0.004, 0.29]);                       // drain
  shade(1.26, 1.26, 0, DECK + 0.0009, 0, 0.3, machine);
  plate(0.075, 0.075, hazard, machine, [0.33, DECK + 0.0012, 0.555], [-Math.PI / 2, 0, 0]);
  const platen = new THREE.Group(); platen.position.y = DECK; machine.add(platen);
  add(lathe([[0, 0.010], [0.366, 0.010], [0.380, 0.020], [0.380, 0.070], [0.376, 0.074], [0, 0.074]], 96), mat.stainless, platen);
  for (let i = 0; i < 3; i++) { const a = 0.4 + i * 2.094, m = small(cube(0.014, 0.03, 0.002), mat.anodized, platen, [Math.cos(a) * 0.3806, 0.045, Math.sin(a) * 0.3806]); m.rotation.y = Math.PI / 2 - a; }
  const pad = add(cyl(0.372, 0.372, 0.006, 128), [mat.padEdge, mat.pad, mat.padEdge], platen, [0, PAD_TOP - DECK - 0.003, 0]);
  control('platen', platen, new THREE.Vector3(-0.15, PAD_TOP, 0.21));

  // ----- overarm, spindle, drive -----
  const armY = ARM_Y + 0.02, armH = 0.15, armZ0 = WALL_F - 0.02, armZ1 = 0.04;
  add(box(0.17, armH, armZ1 - armZ0, 0.022), mat.paint, machine, [HEAD.x, armY + armH / 2, (armZ0 + armZ1) / 2]);
  add(box(0.27, 0.25, 0.024, 0.008), mat.satin, machine, [HEAD.x, armY + armH / 2, WALL_F + 0.012]);
  screws(machine, [[-0.11, -0.1], [0.11, -0.1], [-0.11, 0.1], [0.11, 0.1]].map(([x, y]) => [HEAD.x + x, armY + armH / 2 + y, WALL_F + 0.026]), 0.009, 0.006, 'z');
  plate(0.06, 0.06, hazard, machine, [HEAD.x + 0.0855, armY + armH / 2, -0.25], [0, Math.PI / 2, 0]);
  const spindle = new THREE.Group(); spindle.position.set(HEAD.x, 0, HEAD.z); machine.add(spindle);
  add(cyl(0.105, 0.105, 0.27, 56), mat.aluminum, spindle, [0, ARM_Y + 0.085, 0]);
  add(cyl(0.109, 0.109, 0.014, 56), mat.anodized, spindle, [0, ARM_Y - 0.045, 0]); add(cyl(0.109, 0.109, 0.012, 56), mat.anodized, spindle, [0, ARM_Y + 0.214, 0]);
  const spinRing = new THREE.Group(); spinRing.position.y = ARM_Y - 0.075; spindle.add(spinRing);                // turns with the carrier
  add(cyl(0.098, 0.098, 0.046, 64), std(0xc9ced4, 0.9, 0.5, { bumpMap: knurl, bumpScale: 0.04 }), spinRing);
  add(cyl(0.0992, 0.0992, 0.008, 64), mat.accent, spinRing, [0, 0.012, 0]);
  small(cube(0.004, 0.046, 0.012), mat.anodized, spinRing, [0.0985, 0, 0]);
  control('carrier', spindle, new THREE.Vector3(HEAD.x, ARM_Y - 0.075, HEAD.z));
  add(box(0.15, 0.05, 0.42, 0.02), mat.graphite, machine, [HEAD.x, ARM_Y + 0.245, -0.13]);                      // belt cover
  add(cube(0.125, 0.012, 0.125), mat.satin, machine, [HEAD.x, ARM_Y + 0.276, -0.25]);
  add(cyl(0.056, 0.056, 0.15, 32), mat.anodized, machine, [HEAD.x, ARM_Y + 0.357, -0.25]);                      // servo motor
  for (let i = 0; i < 8; i++) small(cyl(0.0588, 0.0588, 0.005, 32), mat.anodized, machine, [HEAD.x, ARM_Y + 0.30 + i * 0.015, -0.25]);
  add(cyl(0.046, 0.05, 0.03, 28), mat.graphite, machine, [HEAD.x, ARM_Y + 0.447, -0.25]);
  small(cube(0.04, 0.035, 0.032), mat.graphite, machine, [HEAD.x + 0.068, ARM_Y + 0.40, -0.25]);
  tube([[HEAD.x + 0.088, ARM_Y + 0.40, -0.25], [HEAD.x + 0.125, ARM_Y + 0.385, -0.31], [HEAD.x + 0.12, ARM_Y + 0.28, -0.44], [HEAD.x + 0.105, ARM_Y + 0.235, WALL_F]], 0.008, mat.cable);
  add(cyl(0.03, 0.034, 0.05, 24), mat.stainless, machine, [HEAD.x, ARM_Y + 0.295, 0]);                          // rotary union for the carrier's air lines
  small(cyl(0.02, 0.02, 0.03, 20), mat.brass, machine, [HEAD.x, ARM_Y + 0.335, 0]);
  for (const side of [-1, 1]) tube([[HEAD.x + side * 0.02, ARM_Y + 0.335, 0], [HEAD.x + side * 0.05, ARM_Y + 0.36, -0.06], [HEAD.x + side * 0.058, ARM_Y + 0.31, -0.40], [HEAD.x + side * 0.058, ARM_Y + 0.25, WALL_F]], 0.005, mat.airline);
  // Zone-pressure regulator on the front of the spindle housing: right of centre presses the wafer centre harder.
  const zoneDial = new THREE.Group(); zoneDial.position.set(HEAD.x, ARM_Y + 0.10, HEAD.z + 0.103); machine.add(zoneDial);
  add(cube(0.1, 0.1, 0.03), mat.anodized, zoneDial, [0, 0, -0.012]); add(box(0.118, 0.118, 0.014, 0.006), mat.anodized, zoneDial, [0, 0, 0.002]);
  plate(0.108, 0.108, (x, n) => {
    const h = n / 2; x.fillStyle = '#24272c'; x.fillRect(0, 0, n, n); x.strokeStyle = '#e9edf3'; x.fillStyle = '#e9edf3'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let k = -4; k <= 4; k++) { const a = k * 0.275, major = k % 2 === 0; x.lineWidth = major ? n * 0.022 : n * 0.011; x.beginPath(); x.moveTo(h + Math.sin(a) * n * 0.30, h - Math.cos(a) * n * 0.30); x.lineTo(h + Math.sin(a) * n * (major ? 0.38 : 0.35), h - Math.cos(a) * n * (major ? 0.38 : 0.35)); x.stroke(); }
    x.font = `700 ${n * 0.085}px "Segoe UI", Arial, sans-serif`; x.fillText('EDGE', n * 0.17, n * 0.72); x.fillText('CTR', n * 0.84, n * 0.72); x.font = `600 ${n * 0.075}px "Segoe UI", Arial, sans-serif`; x.fillText('ZONE BALANCE', h, n * 0.91);
  }, zoneDial, [0, 0, 0.0092]);
  const zoneKnob = new THREE.Group(); zoneKnob.position.z = 0.009; zoneDial.add(zoneKnob);
  facing(add(cyl(0.024, 0.027, 0.026, 32), std(0x1d2025, 0.3, 0.45, { bumpMap: knurl, bumpScale: 0.03 }), zoneKnob, [0, 0, 0.013]), 'z');
  small(cube(0.005, 0.02, 0.003), mat.accent, zoneKnob, [0, 0.012, 0.0275]);
  control('zone', zoneDial, new THREE.Vector3(HEAD.x, ARM_Y + 0.10, HEAD.z + 0.14));

  // ----- carrier head: retaining ring, housing, air lines, bellows -----
  const head = new THREE.Group(); head.position.set(HEAD.x, PAD_TOP + travel, HEAD.z); machine.add(head);
  const headSpin = new THREE.Group(); head.add(headSpin);
  add(lathe([[0.152, 0], [0.175, 0], [0.177, 0.003], [0.177, 0.018], [0.152, 0.018]]), mat.peek, headSpin);     // retaining ring
  small(new THREE.CircleGeometry(0.151, 64), mat.rubber, headSpin, [0, 0.0045, 0]).rotation.x = Math.PI / 2;    // membrane
  add(lathe([[0, 0.006], [0.150, 0.006], [0.152, 0.018], [0.181, 0.018], [0.186, 0.023], [0.186, 0.062], [0, 0.062]]), mat.stainless, headSpin);
  add(cyl(0.1885, 0.1885, 0.016, 72), mat.anodized, headSpin, [0, 0.070, 0]);
  add(lathe([[0, 0.078], [0.186, 0.078], [0.186, 0.098], [0.170, 0.112], [0.112, 0.120], [0.092, 0.120], [0.092, 0.150], [0.108, 0.150], [0.108, 0.166], [0.062, 0.166], [0.062, 0.186], [0, 0.186]]), mat.stainless, headSpin);
  screws(headSpin, circle(8, 0.145, 0.1175), 0.0065, 0.006); screws(headSpin, circle(6, 0.088, 0.1685, 0.3), 0.006, 0.005);
  small(cube(0.003, 0.014, 0.007), mat.white, headSpin, [0.1895, 0.070, 0]);                                    // index mark: shows that the carrier turns
  plate(0.075, 0.018, label(['CARRIER  300 mm'], { bg: '#d9dce0', size: 0.56 }), headSpin, [0, 0.042, 0.1866]);
  for (let i = 0; i < 3; i++) {
    const a = 0.6 + i * 2.094, c = Math.cos(a), s = Math.sin(a);
    small(cyl(0.007, 0.007, 0.014, 10), mat.brass, headSpin, [c * 0.132, 0.124, s * 0.132]);
    tube([[c * 0.132, 0.130, s * 0.132], [c * 0.128, 0.158, s * 0.128], [c * 0.10, 0.176, s * 0.10], [c * 0.07, 0.178, s * 0.07]], 0.0035, mat.airline, headSpin, 14).castShadow = false;
  }
  add(cyl(0.068, 0.068, 0.010, 32), mat.stainless, head, [0, 0.191, 0]);                                        // lower bellows clamp
  const bellows = add(lathe(Array.from({ length: 17 }, (_, k) => [k % 2 ? 0.066 : 0.05, k / 16]), 40), mat.rubber, machine, [HEAD.x, 0, HEAD.z]);
  const shaft = add(cyl(0.028, 0.028, 1, 24), mat.stainless, machine, [HEAD.x, 0, HEAD.z]);
  add(cyl(0.068, 0.068, 0.008, 32), mat.stainless, machine, [HEAD.x, BELLOWS_TOP + 0.004, HEAD.z]);
  const contactGlow = ghost(add(new THREE.TorusGeometry(0.181, 0.004, 8, 96), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0, depthWrite: false }), machine, [HEAD.x, PAD_TOP + 0.004, HEAD.z]));
  contactGlow.rotation.x = Math.PI / 2;
  control('head', head, new THREE.Vector3(HEAD.x, PAD_TOP + travel + 0.07, HEAD.z));

  // ----- slurry: post, valve with hand-wheel, flow meter, delivery arm, stream -----
  const slurryCol = new THREE.Vector3(-0.10, 0, 0.57), sx = slurryCol.x, sz = slurryCol.z;
  add(cyl(0.045, 0.05, 0.012, 24), mat.stainless, machine, [sx, DECK + 0.006, sz]); screws(machine, circle(4, 0.036, DECK + 0.013, 0.785, sx, sz), 0.005, 0.004);
  add(cyl(0.02, 0.02, 0.36, 20), mat.stainless, machine, [sx, DECK + 0.18, sz]);
  add(box(0.076, 0.09, 0.07, 0.008), mat.pp, machine, [sx, DECK + 0.17, sz + 0.012]);                           // valve body
  plate(0.06, 0.02, label(['SLURRY'], { bg: '#c9281f', fg: '#ffffff', size: 0.64 }), machine, [sx + 0.0385, DECK + 0.185, sz + 0.012], [0, Math.PI / 2, 0]);
  const valve = new THREE.Group(); valve.position.set(sx, DECK + 0.17, sz + 0.07); machine.add(valve);
  const wheel = new THREE.Group(); valve.add(wheel);
  add(new THREE.TorusGeometry(0.05, 0.0085, 12, 44), mat.red, wheel);
  for (let k = 0; k < 3; k++) small(box(0.098, 0.011, 0.007, 0.003), mat.red, wheel).rotation.z = k * Math.PI / 3;
  facing(add(cyl(0.015, 0.015, 0.022, 16), mat.stainless, wheel), 'z');
  small(new THREE.SphereGeometry(0.006, 10, 8), mat.white, wheel, [0, 0.05, 0.007]);                            // mark on the rim: shows how far the valve is open
  facing(add(cyl(0.011, 0.011, 0.05, 12), mat.stainless, valve, [0, 0, -0.03]), 'z');
  control('slurry', valve, valve.position.clone());
  const meter = new THREE.Group(); meter.position.set(sx - 0.072, DECK + 0.10, sz); machine.add(meter);         // variable-area flow meter
  small(cyl(0.015, 0.015, 0.024, 16), mat.pp, meter, [0, 0, 0]); small(cyl(0.015, 0.015, 0.024, 16), mat.pp, meter, [0, 0.165, 0]);
  ghost(add(cyl(0.0125, 0.011, 0.142, 20), mat.clear, meter, [0, 0.0825, 0]));
  plate(0.012, 0.13, (x, w, h) => { x.fillStyle = '#fbfbf8'; x.fillRect(0, 0, w, h); x.fillStyle = '#17191d'; for (let i = 0; i <= 20; i++) x.fillRect(0, h * (0.04 + 0.92 * i / 20), i % 5 ? w * 0.45 : w * 0.8, Math.max(1, h * 0.005)); }, meter, [-0.019, 0.0825, 0.004]);
  const float = small(new THREE.SphereGeometry(0.0072, 14, 10), mat.stainless, meter, [0, 0.022, 0]);
  small(cyl(0.006, 0.006, 0.09, 10), mat.pfa, meter, [0, -0.055, 0]);
  tube([[sx - 0.072, DECK + 0.277, sz], [sx - 0.07, DECK + 0.31, sz + 0.004], [sx - 0.045, DECK + 0.30, sz + 0.012], [sx - 0.026, DECK + 0.217, sz + 0.012]], 0.006, mat.pfa, machine, 24).castShadow = false;
  const slurryArm = new THREE.Group(); machine.add(slurryArm);
  tube([[sx + 0.02, DECK + 0.215, sz + 0.012], [sx + 0.02, DECK + 0.33, sz], [sx + 0.012, DECK + 0.385, sz - 0.05], [-0.085, NOZZLE.y + 0.13, 0.32], [NOZZLE.x, NOZZLE.y + 0.10, NOZZLE.z + 0.04], [NOZZLE.x, NOZZLE.y + 0.02, NOZZLE.z]], 0.009, mat.stainless, slurryArm, 56);
  tube([[sx - 0.02, DECK, sz - 0.03], [sx - 0.02, DECK + 0.33, sz - 0.03], [sx - 0.024, DECK + 0.38, sz - 0.075], [-0.115, NOZZLE.y + 0.125, 0.32], [NOZZLE.x - 0.03, NOZZLE.y + 0.095, NOZZLE.z + 0.045], [NOZZLE.x - 0.03, NOZZLE.y + 0.03, NOZZLE.z + 0.005]], 0.0055, mat.airline, slurryArm, 56).castShadow = false;
  add(cube(0.07, 0.03, 0.045), mat.anodized, slurryArm, [sx, DECK + 0.345, sz - 0.012]);                        // clamp block on the post
  small(cube(0.05, 0.018, 0.022), mat.anodized, slurryArm, [-0.1, NOZZLE.y + 0.128, 0.32]);
  small(cyl(0.009, 0.004, 0.03, 14), mat.pp, slurryArm, [NOZZLE.x, NOZZLE.y + 0.005, NOZZLE.z]); small(cyl(0.006, 0.003, 0.022, 12), mat.pp, slurryArm, [NOZZLE.x - 0.03, NOZZLE.y + 0.02, NOZZLE.z + 0.005]);
  info('nozzle', slurryArm, new THREE.Vector3(-0.085, NOZZLE.y + 0.13, 0.32));
  const stream = ghost(add(cyl(1, 1, 1, 12), mat.slurry, machine, [NOZZLE.x, (NOZZLE.y + PAD_TOP) / 2, NOZZLE.z]));
  const ripples = [0, 1].map(() => { const r = add(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: 0xfbf8ee, transparent: true, opacity: 0, depthWrite: false }), machine, [NOZZLE.x, PAD_TOP + 0.0012, NOZZLE.z]); r.rotation.x = -Math.PI / 2; return ghost(r); });
  // Slurry carried round by the pad: freshest just downstream of the nozzle, thinning and spreading outward with each turn.
  const trailMap = canvasTexture(512, (x, n) => {
    const h = n / 2, k = h / 0.372, sweep = x.createConicGradient(Math.atan2(NOZZLE.z, NOZZLE.x), h, h);
    for (const [stop, alpha] of [[0, 0], [0.3, 0.14], [0.7, 0.5], [0.985, 1], [1, 0]]) sweep.addColorStop(stop, `rgba(255,254,248,${alpha})`);
    x.fillStyle = sweep; x.beginPath(); x.arc(h, h, 0.37 * k, 0, 7); x.fill();
    const band = x.createRadialGradient(h, h, 0.06 * k, h, h, 0.37 * k);
    for (const [stop, alpha] of [[0, 0], [0.16, 1], [0.5, 0.55], [1, 0.1]]) band.addColorStop(stop, `rgba(0,0,0,${alpha})`);
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = band; x.fillRect(0, 0, n, n);
  });
  const trail = ghost(add(new THREE.CircleGeometry(0.372, 96), std(0xffffff, 0, 0.12, { map: trailMap, transparent: true, opacity: 0, depthWrite: false }), machine, [0, PAD_TOP + 0.0009, 0]));
  trail.rotation.x = -Math.PI / 2;

  // ----- pad conditioner: pivot, arm, diamond disk, rinse cup -----
  add(cyl(0.062, 0.068, 0.014, 28), mat.stainless, machine, [PIVOT.x, DECK + 0.007, PIVOT.z]); screws(machine, circle(6, 0.052, DECK + 0.015, 0.2, PIVOT.x, PIVOT.z), 0.005, 0.004);
  add(cyl(0.04, 0.04, 0.19, 28), mat.stainless, machine, [PIVOT.x, DECK + 0.105, PIVOT.z]);
  const condArm = new THREE.Group(); condArm.position.set(PIVOT.x, DECK + 0.20, PIVOT.z); condArm.rotation.y = -(COND_REST + COND_PARK); machine.add(condArm);
  add(cyl(0.052, 0.052, 0.06, 28), mat.anodized, condArm, [0, 0.02, 0]);
  add(box(COND_ARM + 0.02, 0.042, 0.062, 0.012), mat.paint, condArm, [COND_ARM / 2, 0.022, 0]);
  small(cube(COND_ARM - 0.14, 0.004, 0.03), mat.graphite, condArm, [COND_ARM / 2, 0.0445, 0]);
  add(cyl(0.058, 0.058, 0.07, 32), mat.paint, condArm, [COND_ARM, 0.03, 0]);
  add(cyl(0.03, 0.034, 0.03, 20), mat.anodized, condArm, [COND_ARM, 0.08, 0]);
  const condHead = new THREE.Group(); condHead.position.set(COND_ARM, 0.03, 0); condArm.add(condHead);
  add(cyl(0.018, 0.018, 0.07, 16), mat.stainless, condHead, [0, -0.035, 0]);
  const disk = new THREE.Group(); disk.position.y = -0.075; condHead.add(disk);
  add(cyl(0.054, 0.054, 0.012, 36), mat.stainless, disk);
  add(cyl(0.05, 0.05, 0.004, 36), std(0x57524c, 0.4, 0.95), disk, [0, -0.008, 0]);                              // diamond grit face
  small(cube(0.03, 0.004, 0.008), mat.accent, disk, [0.03, 0.007, 0]);                                          // mark: shows that the disk turns
  const cup = new THREE.Vector3(PIVOT.x + COND_ARM * Math.cos(COND_REST + COND_PARK), 0, PIVOT.z + COND_ARM * Math.sin(COND_REST + COND_PARK));
  add(lathe([[0, 0], [0.078, 0], [0.078, 0.04], [0.068, 0.04], [0.064, 0.008], [0, 0.008]], 32), mat.pp, machine, [cup.x, DECK, cup.z]);
  small(new THREE.CircleGeometry(0.066, 32), std(0xbcd5e2, 0.1, 0.08), machine, [cup.x, DECK + 0.026, cup.z]).rotation.x = -Math.PI / 2;   // rinse water
  control('conditioner', condArm, new THREE.Vector3(cup.x, DECK + 0.24, cup.z));

  // ----- load cup, thickness metrology -----
  const loadCup = new THREE.Group(); loadCup.position.set(PEDESTAL.x, DECK, PEDESTAL.z); machine.add(loadCup);
  add(cyl(0.19, 0.196, 0.03, 56), mat.stainless, loadCup, [0, 0.015, 0]);
  add(lathe([[0.156, 0.03], [0.178, 0.03], [0.178, 0.064], [0.174, 0.068], [0.160, 0.068], [0.156, 0.062], [0.156, 0.03]], 64), mat.pp, loadCup);
  small(cyl(0.156, 0.156, 0.006, 56), mat.graphite, loadCup, [0, 0.033, 0]);
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; small(cyl(0.012, 0.014, 0.026, 14), mat.peek, loadCup, [Math.cos(a) * 0.125, 0.049, Math.sin(a) * 0.125]); }
  plate(0.09, 0.024, label(['LOAD'], { bg: '#24272c', fg: '#e9edf3', size: 0.66 }), machine, [PEDESTAL.x - 0.15, DECK + 0.0012, PEDESTAL.z + 0.215], [-Math.PI / 2, 0, 0]);
  info('pedestal', loadCup, new THREE.Vector3(PEDESTAL.x, PEDESTAL.y, PEDESTAL.z));
  const metro = new THREE.Group(); metro.position.set(STAGE.x, DECK, STAGE.z); machine.add(metro);
  add(box(0.42, 0.03, 0.44, 0.008), mat.anodized, metro, [0, 0.015, 0]);
  const chuckMap = canvasTexture(256, (x, n) => {
    x.fillStyle = '#4b5059'; x.fillRect(0, 0, n, n); x.strokeStyle = 'rgba(20,22,26,.8)'; x.lineWidth = 2;
    for (let r = 18; r < 126; r += 18) { x.beginPath(); x.arc(n / 2, n / 2, r, 0, 7); x.stroke(); }
    x.fillStyle = '#17191d'; for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.3; x.beginPath(); x.arc(n / 2 + Math.cos(a) * 60, n / 2 + Math.sin(a) * 60, 5, 0, 7); x.fill(); }
  });
  add(cyl(0.158, 0.158, 0.022, 64), [mat.satin, std(0xffffff, 0.1, 0.5, { map: chuckMap }), mat.satin], metro, [0, 0.041, 0]);   // vacuum chuck
  for (const dz of [-0.2, 0.2]) add(cube(0.03, 0.235, 0.03), mat.aluminum, metro, [0.02, 0.1475, dz]);
  add(box(0.045, 0.04, 0.46, 0.006), mat.anodized, metro, [0.02, 0.285, 0]);                                    // linear stage
  small(cube(0.006, 0.012, 0.42), mat.stainless, metro, [0.046, 0.285, 0]);
  const sensor = new THREE.Group(); sensor.position.set(0.02, 0, 0); metro.add(sensor);                         // reflectometer head, scans along z
  add(box(0.066, 0.05, 0.06, 0.006), mat.graphite, sensor, [0.012, 0.24, 0]);
  add(cyl(0.016, 0.016, 0.03, 18), mat.anodized, sensor, [0, 0.20, 0]); small(cyl(0.012, 0.009, 0.015, 18), mat.stainless, sensor, [0, 0.1775, 0]);
  const beam = ghost(add(cyl(0.003, 0.003, 0.118, 8), new THREE.MeshBasicMaterial({ color: 0x35e08a, transparent: true, opacity: 0, depthWrite: false }), sensor, [0, 0.111, 0]));
  tube([[0.02, 0.305, -0.215], [0.06, 0.33, -0.222], [0.14, 0.22, -0.195], [0.155, 0.10, -0.175]], 0.003, mat.fibre, metro, 24).castShadow = false;
  add(box(0.09, 0.07, 0.07, 0.006), mat.graphite, metro, [0.155, 0.065, -0.175]);
  facing(ghost(add(cyl(0.004, 0.004, 0.002, 10), new THREE.MeshBasicMaterial({ color: 0x35e08a }), metro, [0.2005, 0.08, -0.16])), 'x');
  plate(0.13, 0.022, label(['REFLECTOMETER'], { bg: '#24272c', fg: '#e9edf3', size: 0.6 }), metro, [-0.1, 0.015, 0.2203]);
  info('stage', metro, new THREE.Vector3(STAGE.x + 0.02, DECK + 0.285, STAGE.z));

  // ----- post-CMP cleaner: spin chuck in a splash cup, pencil brush on a swing arm, DI water nozzle -----
  const cleanerUnit = new THREE.Group(); cleanerUnit.position.set(CLEANER.x, DECK, CLEANER.z); machine.add(cleanerUnit);
  add(cyl(0.2, 0.205, 0.02, 56), mat.stainless, cleanerUnit, [0, 0.01, 0]);
  add(lathe([[0.166, 0.02], [0.198, 0.02], [0.198, 0.098], [0.188, 0.112], [0.176, 0.112], [0.172, 0.10], [0.172, 0.03], [0.166, 0.03], [0.166, 0.02]], 64), mat.pp, cleanerUnit);
  small(new THREE.RingGeometry(0.07, 0.171, 56), std(0x8a929b, 0.2, 0.22), cleanerUnit, [0, 0.0215, 0]).rotation.x = -Math.PI / 2;   // drain floor
  const spinChuck = new THREE.Group(); cleanerUnit.add(spinChuck);
  add(cyl(0.05, 0.062, 0.03, 32), mat.stainless, spinChuck, [0, 0.035, 0]);
  add(cyl(0.142, 0.142, 0.006, 56), mat.peek, spinChuck, [0, 0.053, 0]);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.26; small(cyl(0.006, 0.007, 0.014, 10), mat.pp, spinChuck, [Math.cos(a) * 0.153, 0.06, Math.sin(a) * 0.153]); }   // edge grip pins
  small(cube(0.02, 0.003, 0.006), mat.accent, spinChuck, [0.12, 0.0572, 0]);                                    // mark: shows that the chuck turns
  const water = std(0xbfe0f2, 0.05, 0.05, { transparent: true, opacity: 0, depthWrite: false });
  const waterFilm = ghost(add(new THREE.CircleGeometry(waferR * 0.985, 64), water, cleanerUnit, [0, CLEANER.y - DECK + 0.0048, 0])); waterFilm.rotation.x = -Math.PI / 2;
  add(cyl(0.024, 0.028, 0.012, 20), mat.stainless, cleanerUnit, [BRUSH_PIVOT[0], 0.006, BRUSH_PIVOT[1]]);
  add(cyl(0.016, 0.016, 0.17, 18), mat.stainless, cleanerUnit, [BRUSH_PIVOT[0], 0.097, BRUSH_PIVOT[1]]);
  const brushArm = new THREE.Group(); brushArm.position.set(BRUSH_PIVOT[0], 0.176, BRUSH_PIVOT[1]); brushArm.rotation.y = -BRUSH_PARK; cleanerUnit.add(brushArm);
  add(cyl(0.026, 0.026, 0.034, 22), mat.anodized, brushArm, [0, 0.008, 0]);
  add(box(BRUSH_ARM + 0.016, 0.024, 0.034, 0.008), mat.paint, brushArm, [BRUSH_ARM / 2, 0.008, 0]);
  const brushHead = new THREE.Group(); brushHead.position.set(BRUSH_ARM, 0, 0); brushArm.add(brushHead);
  add(cyl(0.011, 0.011, 0.07, 14), mat.stainless, brushHead, [0, -0.03, 0]);
  add(cyl(0.024, 0.024, 0.012, 22), mat.pp, brushHead, [0, -0.068, 0]);
  add(cyl(0.021, 0.019, 0.026, 22), std(0xf5f3ea, 0, 0.95), brushHead, [0, -0.087, 0]);                         // PVA sponge brush
  const diw = [[-0.17, 0.012, 0.14], [-0.17, 0.2, 0.14], [-0.115, 0.236, 0.092], [-0.03, 0.196, 0.022]];
  add(cyl(0.018, 0.021, 0.012, 16), mat.stainless, cleanerUnit, [diw[0][0], 0.006, diw[0][2]]);
  tube(diw, 0.007, mat.stainless, cleanerUnit, 32);
  small(cyl(0.008, 0.004, 0.02, 12), mat.pp, cleanerUnit, [-0.026, 0.188, 0.019]);
  const rinse = ghost(add(cyl(0.0032, 0.0042, 1, 10), new THREE.MeshBasicMaterial({ color: 0xcfeaf8, transparent: true, opacity: 0.8, depthWrite: false }), cleanerUnit, [-0.024, 0, 0.017]));
  const rinseTop = 0.18, rinseFoot = CLEANER.y - DECK + 0.006;
  rinse.scale.y = rinseTop - rinseFoot; rinse.position.y = (rinseTop + rinseFoot) / 2; rinse.visible = false;
  const cleanPlate = plate(0.09, 0.024, label(['CLEAN'], { bg: '#24272c', fg: '#e9edf3', size: 0.66 }), machine, [CLEANER.x + 0.12, DECK + 0.0012, CLEANER.z + 0.222], [-Math.PI / 2, 0, 0]);
  if (withCleaner) info('cleaner', cleanerUnit, new THREE.Vector3(CLEANER.x, DECK + 0.056, CLEANER.z));
  else cleanerUnit.visible = cleanPlate.visible = false;   // on the chuck, so the pointer finds the part there

  // ----- wafer -----
  const filmCanvas = document.createElement('canvas'); filmCanvas.width = filmCanvas.height = 256;
  const filmTexture = new THREE.CanvasTexture(filmCanvas); filmTexture.colorSpace = THREE.SRGBColorSpace; textures.push(filmTexture);
  const waferHolder = new THREE.Group(); machine.add(waferHolder);
  const wafer = add(cyl(waferR, waferR, 0.004, 96), [mat.silicon, std(0xffffff, 0.35, 0.2, { map: filmTexture }), mat.silicon], waferHolder);
  control('wafer', waferHolder, new THREE.Vector3());
  const targets = { head: new THREE.Vector3(HEAD.x, CARRY_Y, HEAD.z), pedestal: PEDESTAL.clone(), stage: STAGE.clone(), ...(withCleaner ? { cleaner: CLEANER.clone() } : {}) };
  const targetRings = Object.fromEntries(Object.entries(targets).map(([name, p]) => {
    const ring = add(new THREE.RingGeometry(0.158, 0.176, 64), new THREE.MeshBasicMaterial({ color: BRAND, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), machine,
      [p.x, name === 'head' ? PAD_TOP + 0.002 : name === 'pedestal' ? p.y + 0.008 : name === 'cleaner' ? DECK + 0.115 : p.y + 0.004, p.z]);
    ring.rotation.x = -Math.PI / 2; return [name, ghost(ring)];
  }));

  // ----- interaction: hover any part, drag the controls, orbit the rest -----
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3(), tmp = new THREE.Vector3();
  let view = null, hovered = null, drag = null, press = null, pendingHover = null, disposed = false, clock = 0, carried = null, measuring = 0, emoPressed = 0, chuckAngle = 0, brushAngle = BRUSH_PARK;
  const setNdc = ev => { const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, 1 - (ev.clientY - r.top) / r.height * 2); raycaster.setFromCamera(ndc, camera); };
  function partAt(ev) {
    setNdc(ev);
    const first = raycaster.intersectObjects(machine.children, true).find(h => { for (let o = h.object; o; o = o.parent) if (!o.visible) return false; return h.object.material.opacity !== 0; });
    if (!first) return null;
    for (let o = first.object; o; o = o.parent) if (o.userData.part) return { name: o.userData.part, kind: parts[o.userData.part].kind, point: first.point.clone() };
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
      carried = hit.clone(); carried.x = THREE.MathUtils.clamp(carried.x, LEFT + 0.1, RIGHT - 0.05); carried.z = THREE.MathUtils.clamp(carried.z, WALL_F + 0.17, FRONT + 0.25);
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
  const targetAllowed = name => !!view?.wafer && view.wafer.where !== name && (name !== 'head' || view.gap > travel * 0.5) && (name !== 'cleaner' || !!view.cleaner);
  function endDrag() {
    const d = drag; drag = null; controls.enabled = true;
    if (!d) return;
    if (d.name === 'wafer' && d.moved) { const target = dropTarget(); carried = null; if (target) on.wafer?.(target); }
    else if (d.name === 'conditioner' && !d.moved) emit('conditioner', !current('conditioner'));
    else if (d.name === 'emo' && !d.moved) { emoPressed = 0.3; emit('emo', true); }
    carried = null; on.drag?.(null);
  }
  function setHover(found) {
    const name = found?.name ?? null;
    if (name === hovered) return;
    hovered = name;
    canvas.style.cursor = !found ? '' : found.kind === 'info' ? 'help' : CLICK_PARTS.includes(name) ? 'pointer' : 'grab';
    on.hover?.(name, found?.kind ?? null);
  }
  const pointerDown = ev => {
    if (ev.button !== 0) return;
    const found = partAt(ev); if (!found) return;
    if (found.kind === 'info') { press = { name: found.name, x: ev.clientX, y: ev.clientY }; return; }       // the view still orbits from here
    const next = beginDrag(found, ev); if (!next) { on.refuse?.(found.name); return; }
    drag = next; controls.enabled = false;
    try { canvas.setPointerCapture(ev.pointerId); } catch { /* synthetic events have no capture */ }
  };
  const pointerMove = ev => {
    if (drag) { moveDrag(ev); return; }
    if (!ev.buttons) pendingHover = { clientX: ev.clientX, clientY: ev.clientY };                              // resolved once per frame
  };
  const pointerUp = ev => {
    if (press && !drag) { const p = press; press = null; if (Math.hypot(ev.clientX - p.x, ev.clientY - p.y) < 5) on.press?.(p.name); }
    press = null; endDrag();
  };
  const onWheel = ev => {
    const found = partAt(ev); if (!found || found.kind !== 'control' || found.name === 'wafer' || CLICK_PARTS.includes(found.name)) return;
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
  const pointerLeave = () => { pendingHover = null; if (!drag) setHover(null); };
  canvas.addEventListener('pointerleave', pointerLeave);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.8; controls.panSpeed = 0.6;
  controls.minDistance = 0.7; controls.maxDistance = 8; controls.minPolarAngle = 0.05; controls.maxPolarAngle = Math.PI * 0.495;

  const screenNormal = new THREE.Vector3(Math.sin(hmi.rotation.y), 0, Math.cos(hmi.rotation.y));
  const VIEWS = {
    home: [[1.80, 2.10, 3.20], [0.10, 1.035, -0.06]], head: [[1.02, 1.42, 1.16], [0.17, 1.04, 0]], top: [[0.14, 3.75, 0.25], [0.14, 0.9, 0.02]], side: [[0.14, 1.28, 3.3], [0.14, 1.06, 0]],
    screen: [hmi.position.clone().addScaledVector(screenNormal, 0.92).add(new THREE.Vector3(0, 0.05, 0)).toArray(), hmi.position.toArray()],
  };
  let glide = null;
  function setView(name = 'home', instant = false) {
    const v = VIEWS[name]; if (!v) return;
    if (instant) { glide = null; camera.position.set(...v[0]); controls.target.set(...v[1]); controls.update(); }
    else glide = { position: new THREE.Vector3(...v[0]), target: new THREE.Vector3(...v[1]) };
  }
  controls.addEventListener('start', () => { glide = null; });
  // Panels of the page can cover the right and the bottom of the view. The picture then moves into the free area:
  // left by half the covered width, and up just far enough to keep the deck clear of the bottom panel.
  // Only the principal point moves; the zoom is corrected so the scale stays the same.
  const DECK_FRONT = [[0, DECK + 0.10, 0.47], [PEDESTAL.x, DECK + 0.07, PEDESTAL.z + 0.2], [RIGHT - 0.075, DECK + 0.05, FRONT - 0.03], [-0.10, DECK + 0.1, FRONT]].map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const inset = { right: 0, bottom: 0, x: 0, y: 0 };            // covered sizes asked by the page, and the applied shift of the principal point (CSS px)
  function applyView() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    const a = 2 * inset.x, b = 2 * inset.y;
    camera.aspect = (w + a) / (h + b); camera.zoom = h / (h + b); camera.fov = w / h < 1.2 ? 46 : 34;
    if (a > 0.5 || b > 0.5) camera.setViewOffset(w + a, h + b, a, b, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  function setInsets({ right = 0, bottom = 0 } = {}) { inset.right = Math.max(0, right); inset.bottom = Math.max(0, bottom); }
  function followInsets(dt) {
    const h = canvas.clientHeight; let lowest = 0;                // lowest point of the deck front, as it would sit without any shift
    if (inset.bottom > 0) for (const p of DECK_FRONT) { tmp.copy(p).project(camera); if (tmp.z < 1) lowest = Math.max(lowest, (1 - tmp.y) / 2 * h + inset.y); }
    const goalX = inset.right / 2, goalY = inset.bottom > 0 ? THREE.MathUtils.clamp(lowest + 22 - (h - inset.bottom), 0, inset.bottom / 2) : 0;
    if (Math.abs(goalX - inset.x) < 0.5 && Math.abs(goalY - inset.y) < 0.5) return;
    const k = Math.min(1, dt * 8); inset.x += (goalX - inset.x) * k; inset.y += (goalY - inset.y) * k; applyView();
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); applyView();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);

  /** Screen position (CSS px inside the canvas) of a named part, for the callout drawn by the page. */
  function screenOf(name) {
    const p = parts[name]?.anchor; if (!p) return null;
    tmp.copy(p).project(camera);
    return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight, visible: tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 };
  }

  const waferGoal = new THREE.Vector3(), lampLevel = [0.05, 0.05, 0.05];
  /** Moves every part to match the process state. `dt` is real seconds since the last frame. */
  function update(next, dt = 0.016) {
    view = next; clock += dt;
    frames++; if (dt > 0.034) slowFrames++;
    if (frames >= 90) { if (adaptive && slowFrames > 60 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.25); renderer.setPixelRatio(pixelRatio); resize(); } frames = slowFrames = 0; }
    if (pendingHover) { const ev = pendingHover; pendingHover = null; if (!drag) setHover(partAt(ev)); }
    const gap = THREE.MathUtils.clamp(next.gap, 0, travel), headY = PAD_TOP + gap;
    head.position.y = headY; headSpin.rotation.y = next.carrierAngle; spinRing.rotation.y = next.carrierAngle;
    zoneKnob.rotation.z = -(next.controls.zone || 0) / constants.zoneMax * 1.1;
    parts.head.anchor.y = headY + 0.07;
    const bottom = headY + HEAD_TOP, length = Math.max(0.02, BELLOWS_TOP - bottom);
    bellows.position.y = bottom; bellows.scale.y = length; shaft.position.y = bottom + length / 2; shaft.scale.y = length;
    platen.rotation.y = next.platenAngle;
    const pressure = next.pressure / constants.pressureMax;
    contactGlow.material.opacity = next.contact ? 0.2 + 0.5 * pressure : 0;
    contactGlow.material.color.setHex(next.alarm ? 0xef4444 : BRAND);
    gaugeHead.set(next.pressure);
    // slurry: valve angle, flow meter, stream, ripples, wet pad
    const flow = next.flow / constants.slurryMax;
    wheel.rotation.z = -next.controls.slurry / constants.slurryMax * Math.PI * 1.5;
    float.position.y = 0.022 + 0.12 * flow;
    stream.visible = next.flow > 1; const width = 0.0022 + 0.0048 * Math.sqrt(flow);
    stream.scale.set(width, NOZZLE.y - PAD_TOP, width);
    ripples.forEach((r, i) => { const t = (clock * 1.3 + i * 0.5) % 1; r.visible = next.flow > 1; r.scale.setScalar(0.012 + t * (0.03 + 0.05 * flow)); r.material.opacity = (1 - t) * 0.6 * Math.min(1, flow * 4); });
    trail.material.opacity = 0.92 * Math.min(1, flow * 2.2) * Math.min(1, next.platenRpm / 20);
    const top = pad.material[1];                                         // a wet pad is darker and glossier, a glazed pad is smoother
    top.color.setScalar(1 - 0.3 * next.coverage); top.roughness = Math.max(0.22, 0.92 - 0.5 * next.coverage - 0.2 * (1 - next.glaze));
    // conditioner: parked over its cup, or sweeping across the pad
    const sweeping = next.controls.conditioner;
    const goal = COND_REST + (sweeping ? COND_SWEEP * (0.5 - 0.5 * Math.cos(next.sweepPhase)) : COND_PARK);
    const angle = -condArm.rotation.y + (goal + condArm.rotation.y) * Math.min(1, dt * (sweeping ? 6 : 2.5));
    condArm.rotation.y = -angle;
    const lowered = sweeping && Math.abs(goal - angle) < 0.5 ? 1 : 0;
    condHead.position.y += ((lowered ? -0.036 : 0.03) - condHead.position.y) * Math.min(1, dt * 5);
    disk.rotation.y -= dt * (sweeping ? 9 : 0);
    parts.conditioner.anchor.set(PIVOT.x + COND_ARM * Math.cos(angle), DECK + 0.24, PIVOT.z + COND_ARM * Math.sin(angle));
    // wafer
    const w = next.wafer;
    waferHolder.visible = !!w;
    if (w) {
      const held = w.where === 'head' && !carried;
      if (carried) waferGoal.set(carried.x, CARRY_Y, carried.z);
      else if (held) waferGoal.set(HEAD.x, headY + 0.002, HEAD.z);
      else { const rest = w.where === 'stage' ? STAGE : w.where === 'cleaner' ? CLEANER : PEDESTAL; waferGoal.copy(rest).setY(rest.y + 0.002); }
      if (held && waferHolder.userData.held) waferHolder.position.copy(waferGoal);
      else waferHolder.position.lerp(waferGoal, Math.min(1, dt * 14));
      waferHolder.userData.held = held && waferHolder.position.distanceTo(waferGoal) < 0.004;
      const flip = held ? Math.PI : 0;                                    // the film faces the pad in the head, up on the stations
      wafer.rotation.x += (flip - wafer.rotation.x) * Math.min(1, dt * 12);
      wafer.rotation.y = held ? next.carrierAngle : w.where === 'cleaner' && !carried ? chuckAngle : 0;
      parts.wafer.anchor.copy(waferHolder.position);
    }
    const dragging = drag?.name === 'wafer' && drag.moved, snap = dragging ? dropTarget() : null;
    for (const [name, ring] of Object.entries(targetRings)) {
      const goalOpacity = dragging && targetAllowed(name) ? (snap === name ? 0.95 : 0.4 + 0.2 * Math.sin(clock * 6)) : 0;
      ring.material.opacity += (goalOpacity - ring.material.opacity) * Math.min(1, dt * 12);
      ring.material.color.setHex(snap === name ? 0x10b981 : BRAND);
    }
    // cleaner: the chuck turns through every step and fastest in the spin dry; the brush works only in the scrub
    const phase = next.cleaner?.phase ?? 'idle', scrubbing = phase === 'scrub', wetStep = scrubbing || phase === 'rinse';
    chuckAngle += dt * (scrubbing ? 5 : phase === 'rinse' ? 9 : phase === 'dry' ? 34 : 0); spinChuck.rotation.y = chuckAngle;
    const brushGoal = scrubbing ? BRUSH_OUT + (BRUSH_IN - BRUSH_OUT) * (0.5 - 0.5 * Math.cos(clock * 2.4)) : BRUSH_PARK;
    brushAngle += (brushGoal - brushAngle) * Math.min(1, dt * (scrubbing ? 6 : 3)); brushArm.rotation.y = -brushAngle;
    brushHead.position.y += ((scrubbing && brushAngle > BRUSH_OUT - 0.08 ? -0.012 : 0.02) - brushHead.position.y) * Math.min(1, dt * 6);
    brushHead.rotation.y -= dt * (scrubbing ? 12 : 0);
    rinse.visible = wetStep;
    const inCleaner = next.wafer?.where === 'cleaner' && !carried;
    water.opacity += ((inCleaner && next.cleaner?.wet ? (phase === 'dry' ? 0.16 : 0.42) : 0) - water.opacity) * Math.min(1, dt * (phase === 'dry' ? 0.5 : 5));
    // metrology scan, signal tower, emergency stop button
    measuring = Math.max(0, measuring - dt);
    beam.material.opacity = measuring > 0 ? 0.85 : 0; sensor.position.z = measuring > 0 ? Math.sin(clock * 9) * 0.13 : sensor.position.z * Math.max(0, 1 - dt * 6);
    const state = next.alarm ? 2 : next.polishing ? 0 : 1;
    lamps.forEach((lampMesh, i) => { const want = i === state ? (i === 2 ? 1.6 + Math.sin(clock * 10) : 1.5) : 0.04; lampLevel[i] += (want - lampLevel[i]) * Math.min(1, dt * 10); lampMesh.material.emissiveIntensity = lampLevel[i]; });
    emoPressed = Math.max(0, emoPressed - dt); emoCap.position.y = -0.007 * Math.min(1, emoPressed / 0.12);
    // part highlight
    for (const [name, p] of Object.entries(parts)) {
      const want = drag?.name === name ? 0.3 : hovered === name ? (p.kind === 'control' ? 0.17 : 0.12) : 0;
      if (Math.abs(want - p.glow) < 0.002) continue;
      p.glow += (want - p.glow) * Math.min(1, dt * 14);
      for (const m of p.materials) { m.emissive?.setHex(0x3d8bff); m.emissiveIntensity = p.glow; }
    }
    followInsets(dt);
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
    update, render, resize, setView, setInsets, screenOf,
    /** Places the camera freely. Used by tools/render-lab-still.mjs for the picture on the home page. */
    lookFrom(position, target) { glide = null; camera.position.set(position[0], position[1], position[2]); controls.target.set(target[0], target[1], target[2]); controls.update(); },
    /** Fixes the render resolution, with no automatic step-down afterwards (still pictures). */
    holdPixelRatio(ratio) { adaptive = false; pixelRatio = ratio; renderer.setPixelRatio(ratio); resize(); },
    /** Names of every part that answers to the pointer, with its kind ('control' or 'info'). */
    parts: Object.fromEntries(Object.entries(parts).map(([name, p]) => [name, p.kind])),
    /** Name of the part under a pointer position, or null (used by the interaction tests). */
    pickAt(clientX, clientY) { return partAt({ clientX, clientY })?.name ?? null; },
    /** Screen position of a world point (used by the interaction tests). */
    project(x, y, z) { tmp.set(x, y, z).project(camera); return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight }; },
    layout: {
      deck: DECK, padTop: PAD_TOP, armY: ARM_Y, carryY: CARRY_Y, head: HEAD.toArray(), pedestal: PEDESTAL.toArray(), stage: STAGE.toArray(), cleaner: CLEANER.toArray(),
      ring: [HEAD.x, ARM_Y - 0.075, HEAD.z + 0.098], zone: [HEAD.x, ARM_Y + 0.10, HEAD.z + 0.139], valve: [sx, DECK + 0.17, sz + 0.07], cup: [cup.x, DECK + 0.266, cup.z],
      emo: [emo.position.x, DECK + 0.083, emo.position.z], hmi: hmi.position.toArray(), tower: parts.tower.anchor.toArray(), gauges: parts.gauges.anchor.toArray(),
    },
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
