// 3D host of the process lab (three.js): one renderer, one room and one camera. The room holds the whole line: every
// piece of equipment stands in it in the order of the processes, their fronts in one row, with a rail and a wafer
// carriage in front. Either one piece is in use (mount): the others step out of the picture and its parts answer the
// pointer. Or none is (showLine): the camera shows the line and a click on a machine picks it.
// Bundled into ../scene.js by tools/build-scenes.mjs (global CMPProcessLabScene).
//
// A piece of equipment is built at its own origin, inside a group that stands at its place in the line. Its views, the
// anchors of its parts, its layout points, project() and lookFrom() are all in its own coordinates; the host adds the place.
//
// A piece of equipment is a module in this folder that builds its meshes with the kit handed to it, names the
// parts a visitor can point at, and moves them every frame from the state of its process model. The host does what
// every piece of equipment needs: light, floor, picking, the hover highlight, dragging, clicking and the camera.
//   kit.control(name, group, anchor, how)   a part the operator moves. how is one of
//       { drag: 'lift', travel, value(view) }   pulled up and down; emits value + height / travel
//       { drag: 'slide', perPixel, wheel }      pulled sideways or up; the wheel moves it in steps
//       { click: true }                         toggled by a click
//   kit.info(name, group, anchor)           a part that only shows its card
// Every change goes out through on.control(name, value); the page decides what the model makes of it.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildPuller } from './puller.js';
import { buildFurnace } from './furnace.js';
import { buildTrack } from './track.js';
import { buildEtcher } from './etcher.js';
import { buildImplanter } from './implanter.js';
import { buildPlater } from './plater.js';
import { buildProber } from './prober.js';
import { buildBonder } from './bonder.js';

const EQUIPMENT = { crystal: buildPuller, oxidation: buildFurnace, photo: buildTrack, etch: buildEtcher, implant: buildImplanter, plating: buildPlater, prober: buildProber, bonder: buildBonder };

/**
 * `line`: the pieces of equipment in the order they stand, [{ equipment, number, name }]; the scene then opens on the line.
 * Without it nothing stands in the room until a piece is mounted.
 * `on`: control(name, value), hover(name, kind), drag(name, ended), press(name) for the piece in use;
 * station('hover' | 'pick', equipment) for the line.
 */
export function create({ canvas, on = {}, line = [] }) {
  let renderer;
  try {
    const context = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!context) return null;
    renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  } catch { return null; }
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2), frames = 0, slowFrames = 0, adaptive = true;      // stepped down if the display cannot keep up
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdde1e7); scene.fog = new THREE.Fog(0xdde1e7, 11, 26);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04); scene.environment = environment.texture; scene.environmentIntensity = 0.85;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf6f9ff, 0xa9b2c2, 0.42));
  const key = new THREE.DirectionalLight(0xfff7ec, 2.25); key.position.set(-3.0, 7.4, 4.4); key.target.position.set(0.1, 1.2, 0); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.014; key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 3.2, bottom: -2.2, near: 0.5, far: 18 });
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdce8ff, 0.55); fill.position.set(4.0, 3.0, 2.0); scene.add(fill);
  const spot = new THREE.SpotLight(0x8fbaff, 0, 16, 0.5, 0.75, 1.2); scene.add(spot, spot.target);            // falls on the machine of the line the pointer is on
  const camera = new THREE.PerspectiveCamera(34, 1.6, 0.05, 240);

  // ----- materials and building blocks handed to the equipment -----
  const std = (color, metalness, roughness, extra) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const lcg = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const textures = [];
  function canvasTexture(size, draw, srgb = true) {
    const [w, h] = Array.isArray(size) ? size : [size, size], c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (srgb) t.colorSpace = THREE.SRGBColorSpace; textures.push(t); return t;
  }
  function brushed(repeatX, repeatY) {
    const t = canvasTexture(256, (x, n) => {
      x.fillStyle = '#9c9c9c'; x.fillRect(0, 0, n, n); const rnd = lcg(3);
      for (let i = 0; i < 2600; i++) { const v = 105 + Math.floor(rnd() * 100); x.fillStyle = `rgba(${v},${v},${v},.35)`; x.fillRect(rnd() * n - 40, rnd() * n, 40 + rnd() * 160, 1); }
    }, false);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeatX, repeatY); return t;
  }
  const mat = {
    paint: new THREE.MeshPhysicalMaterial({ color: 0xe1e4e8, metalness: 0, roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.4 }),   // powder-coated panels
    stainless: std(0xd4d8dd, 1, 0.52, { roughnessMap: brushed(3, 3) }), satin: std(0xbfc5cc, 1, 0.44), aluminum: std(0xd6dade, 0.92, 0.36),
    anodized: std(0x24272c, 0.65, 0.42), graphite: std(0x3b4048, 0.2, 0.62), rubber: std(0x16181b, 0, 0.9), white: std(0xfafafa, 0, 0.5),
    ceramic: std(0xefece4, 0, 0.92), quartz: std(0xf3f6f8, 0, 0.3, { transparent: true, opacity: 0.55 }),
    glass: std(0xdfeaf2, 0, 0.06, { transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
    silicon: std(0x8d97a6, 0.9, 0.22), red: std(0xc9281f, 0.1, 0.38), yellow: std(0xf1c40f, 0, 0.5), blue: std(0x2f7fd8, 0, 0.4), brass: std(0xc9a55a, 1, 0.35),
  };
  const blobMap = canvasTexture(128, (x, n) => { const g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); });

  let root = null;                                            // everything of the mounted equipment
  let parts = {};                                             // name -> { kind, group, materials, anchor, glow, how }
  function add(geometry, material, parent = root, position) {
    const m = new THREE.Mesh(geometry, material); m.castShadow = true; m.receiveShadow = true;
    if (position) m.position.set(position[0], position[1], position[2]);
    parent.add(m); return m;
  }
  const small = (...args) => { const m = add(...args); m.castShadow = false; return m; };                       // too small to need a shadow
  const ghost = m => { m.raycast = () => {}; m.castShadow = m.receiveShadow = false; m.userData.fixed = true; return m; };   // seen, but not picked and not lit by hover
  const decal = m => { m.raycast = () => {}; m.castShadow = false; m.userData.fixed = true; return m; };        // label or dial face
  const cyl = (rTop, rBottom, h, seg = 48, open = false) => new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, open);
  const cube = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const box = (w, h, d, r = 0.008) => new RoundedBoxGeometry(w, h, d, 3, r);
  const facing = (m, axis) => { if (axis === 'z') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.z = Math.PI / 2; return m; };   // lay a cylinder along z or x
  function tube(points, radius, material, parent = root, segments = 40) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    return add(new THREE.TubeGeometry(curve, segments, radius, 10), material, parent);
  }
  function plate(w, h, draw, parent, position, rotation) {    // printed label: a plane with its own small canvas
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
  function shade(w, d, x, y, z, opacity = 0.3, parent = root) {  // soft dark patch that grounds a part on the surface under it
    const m = ghost(add(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobMap, transparent: true, opacity, depthWrite: false }), parent, [x, y, z]));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m;
  }
  function register(kind, name, group, anchor, how = {}) {    // marks a group as one part: it lights up alone on hover
    const materials = new Map();
    group.traverse(o => {
      if (!o.isMesh || o.userData.fixed) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      const cloned = list.map(m => { if (!materials.has(m)) materials.set(m, m.clone()); return materials.get(m); });
      o.material = Array.isArray(o.material) ? cloned : cloned[0];
    });
    group.userData.part = name;
    parts[name] = { kind, group, materials: [...materials.values()], anchor, glow: 0, how };
  }
  const kit = {
    THREE, mat, std, add, small, ghost, decal, cyl, cube, box, facing, tube, plate, label, shade, canvasTexture,
    control: (name, group, anchor, how) => register('control', name, group, anchor, how), info: (name, group, anchor) => register('info', name, group, anchor),
    partAnchor: name => parts[name].anchor,                    // equipment moves the anchor of a part that moves
    get root() { return root; },
  };

  // ----- room: raised floor -----
  const floorMap = canvasTexture(512, (x, n) => {
    x.fillStyle = '#d0d5db'; x.fillRect(0, 0, n, n); const rnd = lcg(11);
    for (let i = 0; i < 2600; i++) { const v = 190 + Math.floor(rnd() * 30); x.fillStyle = `rgba(${v},${v + 3},${v + 8},.6)`; x.fillRect(rnd() * n, rnd() * n, 2, 2); }
    x.fillStyle = 'rgba(96,106,120,.2)'; for (let i = 1; i < 16; i++) for (let j = 1; j < 16; j++) { x.beginPath(); x.arc(i * 32, j * 32, 3.2, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(70,80,94,.7)'; x.lineWidth = 5; x.strokeRect(0, 0, n, n); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.5; x.strokeRect(4, 4, n - 8, n - 8);
  });
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping; floorMap.repeat.set(700, 700);                        // 0.6 m tiles
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), std(0xffffff, 0, 0.5, { map: floorMap }));    // wider than the haze lets anyone see
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // ----- the line: every piece of equipment stands in the room; one of them is in use at a time, or none -----
  const GAP = 1.5, RAIL_Z = 1.75, WALL = { behind: 0.95, height: 12, length: 220, sign: 4.42 };   // m: floor between two machines; the rail, in front of the row of fronts (z = 0); the wall behind the deepest machine, and how high the numbers on it are
  const stations = {}, row = [];                              // equipment -> { name, group, parts, equipment, offset, min, max, centre, width, place }; row: the same in the order they stand
  const ZERO = new THREE.Vector3(), at = new THREE.Vector3();
  let equipment = null, VIEWS = { home: [[3, 2, 5], [0, 1.2, 0]] }, active = null, lineHover = null, lineMarked = null, lit = null, cart = null;
  let extent = { left: -3, right: 3, top: 3, back: -3, near: 1, front: 3 }, lineView = [[-6, 5, 12], [0, 1, 0]], lineTouched = false, lineAngles = null;
  const origin = () => (active ? stations[active].offset : ZERO);
  /** Builds a piece of equipment at its own origin, in a group of its own, with its own parts. */
  function build(name) {
    const group = new THREE.Group(); group.userData.station = name; scene.add(group);
    const kept = [root, parts]; root = group; parts = {};
    const built = EQUIPMENT[name](kit), solid = new THREE.Box3();
    group.updateWorldMatrix(true, true);
    group.traverse(o => { if (o.isMesh && o.castShadow && o.visible) solid.expandByObject(o); });               // what stands there: not the soft patches on the floor
    const st = stations[name] = { name, group, parts, equipment: built, offset: new THREE.Vector3(), min: solid.min.clone(), max: solid.max.clone(), place: new THREE.Group() };
    [root, parts] = kept;
    scene.add(st.place);
    return st;
  }
  const still = (geometry, material, parent, x, y, z) => { const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; m.raycast = () => {}; parent.add(m); return m; };
  /** Painted on the wall above a machine: its number in the line, large, and the name of its process. A click on it picks the machine. */
  function wallName(number, name, st, z) {
    const W = 1536, H = 512, metres = 3.3, face = '"Pretendard Variable", Pretendard, "Malgun Gothic", "Apple SD Gothic Neo", "Segoe UI", sans-serif';
    const map = canvasTexture([W, H], g => {
      g.clearRect(0, 0, W, H); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.font = `800 430px ${face}`; const lead = g.measureText(String(number)).width;
      g.font = `700 150px ${face}`; const tail = Math.min(g.measureText(name).width, W - lead - 110), x = (W - lead - 56 - tail) / 2;
      g.font = `800 430px ${face}`; g.fillStyle = '#0d6efd'; g.fillText(String(number), x, 410);
      g.font = `700 150px ${face}`; g.fillStyle = '#2b3545'; g.fillText(name, x + lead + 56, 404, tail);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(metres, metres * H / W), new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0.9, depthWrite: false }));
    m.position.set(st.centre, WALL.sign, z + 0.012); m.renderOrder = 2; m.userData.station = st.name;      // the number picks its machine, like the machine itself
    st.place.add(m); st.sign = m;
  }
  if (line.length) {
    let cursor = 0;
    for (const entry of line) {
      const st = build(entry.equipment); row.push(st);
      st.offset.set(cursor - st.min.x, 0, -st.max.z); st.width = st.max.x - st.min.x; cursor += st.width + GAP;   // fronts in one row
    }
    const half = (cursor - GAP) / 2, back = Math.min(...row.map(st => st.min.z - st.max.z)) - WALL.behind, length = 2 * half + 5;
    extent = { left: -half, right: half, top: WALL.sign + 0.63, back, near: 0.9, front: RAIL_Z + 0.4 };
    line.forEach((entry, i) => {
      const st = row[i]; st.offset.x -= half; st.group.position.copy(st.offset); st.centre = st.offset.x + (st.min.x + st.max.x) / 2;
      wallName(entry.number ?? i + 1, entry.name ?? '', st, back);
      // a patch of light on the floor under the machine the pointer is on
      const depth = st.max.z - st.min.z;
      st.pad = new THREE.Mesh(new THREE.PlaneGeometry(st.width + 0.5, depth + 1.5), new THREE.MeshBasicMaterial({ color: 0x0d6efd, transparent: true, opacity: 0, depthWrite: false }));
      st.pad.rotation.x = -Math.PI / 2; st.pad.position.set(st.centre, 0.003, -depth / 2 + 0.45); st.pad.renderOrder = 1; st.pad.raycast = () => {}; st.place.add(st.pad);
    });
    // The wall behind the line: panels 1.2 m wide and 2.4 m high, a dark skirting. It goes up past the top of any picture
    // of the line, and it is seen from the front only: a camera that goes behind it looks through.
    const wallMap = canvasTexture([256, 512], (g, w, h) => {
      g.fillStyle = '#d7dce4'; g.fillRect(0, 0, w, h); const rnd = lcg(29);
      for (let i = 0; i < 500; i++) { const v = 208 + Math.floor(rnd() * 14); g.fillStyle = `rgba(${v},${v + 2},${v + 5},.5)`; g.fillRect(rnd() * w, rnd() * h, 3, 3); }
      g.fillStyle = 'rgba(90,100,116,.55)'; g.fillRect(0, 0, 2, h); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(2, 0, 2, h);          // seam between two panels
      g.fillStyle = 'rgba(90,100,116,.42)'; g.fillRect(0, 0, w, 2);                                                                       // and above each
    });
    wallMap.wrapS = wallMap.wrapT = THREE.RepeatWrapping; wallMap.repeat.set(Math.round(WALL.length / 1.2), WALL.height / 2.4);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL.length, WALL.height), std(0xffffff, 0, 0.82, { map: wallMap }));
    wall.position.set(0, WALL.height / 2, back); wall.receiveShadow = true; wall.raycast = () => {}; scene.add(wall);
    const skirting = new THREE.Mesh(new THREE.PlaneGeometry(WALL.length, 0.14), std(0x596274, 0, 0.7));
    skirting.position.set(0, 0.07, back + 0.006); skirting.receiveShadow = true; skirting.raycast = () => {}; scene.add(skirting);
    // on the floor: a yellow line in front of the machines, the rail, and the carriage that takes the box of wafers from one machine to the next
    const rail = new THREE.Group(); scene.add(rail);
    const paint = new THREE.Mesh(new THREE.PlaneGeometry(length + 6, 0.09), new THREE.MeshBasicMaterial({ color: 0xe9b90c, transparent: true, opacity: 0.9, depthWrite: false }));
    paint.rotation.x = -Math.PI / 2; paint.position.set(0, 0.004, 0.55); paint.renderOrder = 1; paint.raycast = () => {}; rail.add(paint);
    still(new THREE.BoxGeometry(length, 0.014, 0.46), std(0x4a505a, 0.25, 0.72), rail, 0, 0.007, RAIL_Z).castShadow = false;
    for (const side of [-1, 1]) still(new THREE.BoxGeometry(length, 0.034, 0.034), mat.stainless, rail, 0, 0.031, RAIL_Z + side * 0.15).castShadow = false;
    for (const end of [-1, 1]) still(new RoundedBoxGeometry(0.16, 0.2, 0.5, 2, 0.02), mat.yellow, rail, end * (length / 2 - 0.08), 0.1, RAIL_Z);   // buffer stops
    cart = new THREE.Group(); cart.position.set(row[0].centre, 0, RAIL_Z); scene.add(cart);
    still(new RoundedBoxGeometry(0.78, 0.07, 0.5, 3, 0.02), mat.graphite, cart, 0, 0.085, 0);                   // chassis
    still(new RoundedBoxGeometry(0.72, 0.26, 0.46, 3, 0.03), mat.paint, cart, 0, 0.25, 0);                      // body
    still(new RoundedBoxGeometry(0.5, 0.014, 0.42, 2, 0.005), mat.anodized, cart, 0, 0.387, 0);                 // deck
    still(new RoundedBoxGeometry(0.38, 0.34, 0.38, 4, 0.035), std(0xd9761f, 0, 0.16, { transparent: true, opacity: 0.84 }), cart, 0, 0.564, 0);   // the box of wafers
    still(new RoundedBoxGeometry(0.42, 0.03, 0.42, 3, 0.012), std(0xb85c14, 0, 0.3), cart, 0, 0.749, 0);
    still(new RoundedBoxGeometry(0.2, 0.05, 0.1, 2, 0.01), std(0xb85c14, 0, 0.3), cart, 0, 0.786, 0);            // handle
    const lamp = still(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 16), new THREE.MeshBasicMaterial({ color: 0x2bd47d }), cart, 0.31, 0.395, 0.17); lamp.castShadow = false;
    cart.userData = { next: 1, wait: 1.5, speed: 0, park: null };
  }
  /**
   * The camera of the line view: from the front and well to the left, so the first machine is the nearest and the line
   * runs away to the right; as near as keeps the whole line in the picture, under the strip the page keeps for its heading.
   * `angles`: { azimuth, elevation } in degrees, to look from somewhere else (tuning and checks).
   */
  function fitLine(angles = lineAngles) {
    const w = canvas.clientWidth || 1600, h = canvas.clientHeight || 800, aspect = w / h, wide = aspect >= 1.2;
    const azimuth = THREE.MathUtils.degToRad(angles?.azimuth ?? (wide ? 48 : 64)), elevation = THREE.MathUtils.degToRad(angles?.elevation ?? (wide ? 11 : 13));
    const away = new THREE.Vector3(-Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation));
    const probe = new THREE.PerspectiveCamera(wide ? 34 : 46, aspect, 0.05, 400);
    // what has to be in the picture: the machines on their floor, and the numbers on the wall above them. The rail and the top of the wall may run out of it.
    const corners = []; for (const x of [extent.left, extent.right]) corners.push(new THREE.Vector3(x, 0, extent.near), new THREE.Vector3(x, 0, extent.back), new THREE.Vector3(x, extent.top, extent.back));
    const FRAME = { left: -0.96, right: 0.96, bottom: -0.9, top: 0.94 };                                      // of the picture, in units of half its size
    const reach = Math.tan(THREE.MathUtils.degToRad(probe.fov) / 2), right = new THREE.Vector3(), up = new THREE.Vector3();
    const seen = (target, distance) => {
      probe.position.copy(target).addScaledVector(away, distance); probe.lookAt(target); probe.updateMatrixWorld(); probe.updateProjectionMatrix();
      const box = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity, ahead: true, far: {} };   // far: how far ahead the corner at each edge is
      for (const c of corners) {
        at.copy(c).applyMatrix4(probe.matrixWorldInverse); const ahead = -at.z; if (ahead < 0.5) box.ahead = false;
        at.applyMatrix4(probe.projectionMatrix);
        if (at.x < box.left) { box.left = at.x; box.far.left = ahead; } if (at.x > box.right) { box.right = at.x; box.far.right = ahead; }
        if (at.y < box.bottom) box.bottom = at.y; if (at.y > box.top) { box.top = at.y; box.far.top = ahead; }
      }
      return box;
    };
    /**
     * From this far: where to look so that what has to be seen sits across the middle of its frame and up against its top
     * (the floor in front gets the room that is left), and whether it is all inside. Moving the camera sideways by d moves a
     * corner that is D ahead by d / (D tan(fov / 2)) of half the picture, which is what the steps below turn round.
     */
    const framed = distance => {
      const target = new THREE.Vector3(0, extent.top * 0.4, (extent.back + extent.near) / 2);
      for (let i = 0; i < 16; i++) {
        const b = seen(target, distance); if (!b.ahead) return { target, inside: false };
        right.setFromMatrixColumn(probe.matrixWorld, 0); up.setFromMatrixColumn(probe.matrixWorld, 1);
        const across = (b.left + b.right) / 2 - (FRAME.left + FRAME.right) / 2, above = b.top - FRAME.top;
        if (Math.abs(across) < 1e-4 && Math.abs(above) < 1e-4) break;
        target.addScaledVector(right, across * 2 * reach * aspect / (1 / b.far.left + 1 / b.far.right)).addScaledVector(up, above * reach * b.far.top);
      }
      const b = seen(target, distance), slack = 0.004;
      return { target, inside: b.ahead && b.left >= FRAME.left - slack && b.right <= FRAME.right + slack && b.bottom >= FRAME.bottom - slack && b.top <= FRAME.top + slack };
    };
    let lo = 4, hi = 200;
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (framed(mid).inside) hi = mid; else lo = mid; }
    const distance = hi, target = framed(distance).target;
    lineView = [target.clone().addScaledVector(away, distance).toArray(), target.toArray()];
    return distance;
  }
  /** Light and haze for one machine from near, or for the whole line from afar. */
  function aim(centre, wide) {
    const reach = (extent.right - extent.left) / 2 + 4, k = wide ? Math.max(2.4, reach / 7) : 1;
    key.position.set(centre.x - 3.0 * k, 7.4 * k, centre.z + 4.4 * k); key.target.position.set(centre.x + 0.1, 1.2, centre.z); key.target.updateMatrixWorld();
    Object.assign(key.shadow.camera, wide ? { left: -reach, right: reach, top: 10, bottom: -8, near: 0.5, far: 10 * k + 30 } : { left: -2.6, right: 2.6, top: 3.2, bottom: -2.2, near: 0.5, far: 18 });
    const size = wide ? Math.min(4096, renderer.capabilities.maxTextureSize) : 2048;
    if (key.shadow.mapSize.x !== size) { key.shadow.mapSize.set(size, size); key.shadow.map?.dispose(); key.shadow.map = null; }
    key.shadow.camera.updateProjectionMatrix();
  }
  const calm = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const haze = { near: 11, far: 26 };                         // where the room fades into its background; on the way between the line and a machine it closes in and opens again
  const lineHaze = distance => { haze.near = distance * 1.1; haze.far = distance * 3.4; controls.maxDistance = distance * 1.5; };
  /**
   * Puts a piece of equipment in use: its parts answer the pointer and its views are the views. The rest of the line
   * steps out, so the machine can be seen from every side. `fly` takes the camera there through the haze instead of putting it there.
   */
  function mount(name, fly = false) {
    if (!EQUIPMENT[name]) throw new Error(`no equipment for ${name}`);
    const st = stations[name] || build(name);
    endGlide();
    active = name; root = st.group; parts = st.parts; equipment = st.equipment; VIEWS = equipment.views;
    hovered = null; drag = null; press = null; lineHover = null; lineMarked = null; canvas.style.cursor = '';
    haze.near = 11; haze.far = 26; controls.maxDistance = 11;
    setView('home', !fly || calm, () => {
      for (const other of Object.values(stations)) other.group.visible = other.place.visible = other === st;
      if (st.sign) st.sign.visible = false;                     // from this near the large number on the wall is only a piece of itself
      if (cart) cart.visible = false;
      aim(st.offset, false);
    });
    resize();
  }
  /** No piece in use: the camera shows the whole line, and a click on a machine picks it (on.station). */
  function showLine(instant = false) {
    endGlide();
    active = null; root = null; parts = {}; equipment = null; hovered = null; drag = null; press = null; canvas.style.cursor = '';
    lineHaze(fitLine()); VIEWS = { home: lineView }; lineTouched = false;
    setView('home', instant || calm, () => {
      for (const st of Object.values(stations)) { st.group.visible = st.place.visible = true; if (st.sign) st.sign.visible = true; }
      if (cart) cart.visible = true;
      aim(ZERO, true);
    });
    resize();
  }
  const shown = h => { for (let o = h.object; o; o = o.parent) if (!o.visible) return false; return true; };
  /** The machine of the line under the pointer, or null. */
  function stationAt(ev) {
    setNdc(ev);
    const first = raycaster.intersectObjects(row.flatMap(st => [st.group, st.sign]), true).find(shown);
    for (let o = first?.object; o; o = o.parent) if (o.userData.station) return o.userData.station;
    return null;
  }
  function setLineHover(name) {
    if (name === lineHover) return;
    lineHover = name; canvas.style.cursor = name ? 'pointer' : ''; on.station?.('hover', name);
  }
  /** The carriage goes from machine to machine, waits at each, and hurries back to the first; or it waits at the one it was sent to. */
  function moveCart(dt) {
    if (!cart || !cart.visible || row.length < 2) return;
    const state = cart.userData, parked = state.park != null, goal = row[parked ? state.park : state.next].centre, gap = goal - cart.position.x;
    if (!parked && state.wait > 0) { state.wait -= dt; return; }
    const top = parked ? 5 : state.next === 0 ? 4.2 : 1.5, pull = 2.4;                                        // m/s, m/s2
    state.speed = Math.min(top, state.speed + pull * dt, Math.sqrt(2 * pull * Math.abs(gap)) + 0.04);
    const step = state.speed * dt;
    if (Math.abs(gap) > step) { cart.position.x += Math.sign(gap) * step; return; }
    cart.position.x = goal; state.speed = 0;
    if (!parked) { state.wait = 1.7; state.next = (state.next + 1) % row.length; }
  }

  // ----- interaction: hover any part, move the controls, orbit the rest -----
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3(), tmp = new THREE.Vector3();
  let view = null, hovered = null, drag = null, press = null, pendingHover = null, disposed = false, clock = 0;
  const setNdc = ev => { const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, 1 - (ev.clientY - r.top) / r.height * 2); raycaster.setFromCamera(ndc, camera); };
  function partAt(ev) {
    if (!root) return null;
    setNdc(ev);
    const first = raycaster.intersectObjects(root.children, true).find(h => { for (let o = h.object; o; o = o.parent) if (!o.visible) return false; return true; });
    if (!first) return null;
    for (let o = first.object; o; o = o.parent) if (o.userData.part) return { name: o.userData.part, kind: parts[o.userData.part].kind, point: first.point.clone() };
    return null;
  }
  const emit = (name, value) => on.control?.(name, value);
  const current = name => { const how = parts[name].how; return how.value ? how.value(view) : view?.controls?.[name] ?? 0; };
  function beginDrag(found, ev) {
    const how = parts[found.name].how, base = { name: found.name, x: ev.clientX, y: ev.clientY, moved: false, start: current(found.name) };
    if (how.drag === 'lift') {
      camera.getWorldDirection(tmp); tmp.y = 0; tmp.normalize();
      base.plane = new THREE.Plane().setFromNormalAndCoplanarPoint(tmp, found.point); base.y0 = found.point.y;
    }
    return base;
  }
  function moveDrag(ev) {
    const d = drag, dx = ev.clientX - d.x, dy = ev.clientY - d.y, how = parts[d.name].how;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) { d.moved = true; on.drag?.(d.name); }
    if (how.drag === 'lift') { setNdc(ev); if (raycaster.ray.intersectPlane(d.plane, hit)) emit(d.name, d.start + (hit.y - d.y0) / how.travel); }
    else if (how.drag === 'slide') emit(d.name, d.start + (dx - dy) * how.perPixel);
  }
  function endDrag() {
    const d = drag; drag = null; controls.enabled = true;
    if (!d) return;
    if (!d.moved && parts[d.name].how.click) emit(d.name, !current(d.name));
    on.drag?.(null, d.moved ? d.name : null);
  }
  function setHover(found) {
    const name = found?.name ?? null;
    if (name === hovered) return;
    hovered = name;
    canvas.style.cursor = !found ? '' : found.kind === 'info' ? 'help' : parts[name].how.click ? 'pointer' : 'grab';
    on.hover?.(name, found?.kind ?? null);
  }
  const pointerDown = ev => {
    if (ev.button !== 0) return;
    if (!active) { const name = stationAt(ev); press = name ? { station: name, x: ev.clientX, y: ev.clientY } : null; return; }   // the view still turns from here; a press that does not move picks the machine
    const found = partAt(ev); if (!found) return;
    if (found.kind === 'info') { press = { name: found.name, x: ev.clientX, y: ev.clientY }; return; }       // the view still orbits from here
    drag = beginDrag(found, ev); controls.enabled = false;
    try { canvas.setPointerCapture(ev.pointerId); } catch { /* synthetic events have no capture */ }
  };
  const pointerMove = ev => {
    if (drag) { moveDrag(ev); return; }
    if (!ev.buttons) pendingHover = { clientX: ev.clientX, clientY: ev.clientY };                              // resolved once per frame
  };
  const pointerUp = ev => {
    if (press && !drag) { const p = press; press = null; if (Math.hypot(ev.clientX - p.x, ev.clientY - p.y) < 5) { if (p.station) on.station?.('pick', p.station); else on.press?.(p.name); } }
    press = null; endDrag();
  };
  const onWheel = ev => {
    if (!active) return;                                        // over the line the wheel is the camera's
    const found = partAt(ev); if (!found || found.kind !== 'control' || !parts[found.name].how.wheel) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    emit(found.name, current(found.name) + (ev.deltaY < 0 ? 1 : -1) * parts[found.name].how.wheel);
  };
  const pointerLeave = () => { pendingHover = null; if (!active) setLineHover(null); else if (!drag) setHover(null); };
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false }); canvas.addEventListener('pointerleave', pointerLeave);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.8; controls.panSpeed = 0.6;
  controls.minDistance = 0.8; controls.maxDistance = 11; controls.minPolarAngle = 0.05; controls.maxPolarAngle = Math.PI * 0.495;

  let glide = null;
  const DIP = 0.4, ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2), smooth = t => t * t * (3 - 2 * t);
  /** Ends a glide where it is: what it was to change is changed, and the haze is where it belongs. */
  function endGlide() { const g = glide; glide = null; if (!g) return; g.change?.(); scene.fog.near = haze.near; scene.fog.far = haze.far; }
  /**
   * Goes to a named view of the piece in use (or of the line): at once, or in a glide that takes longer the farther it is.
   * `change` is what the room has to change on the way (who stands in it, the light). A glide then goes through the haze:
   * the room fades out, changes unseen, and comes back as the camera arrives.
   */
  function setView(name = 'home', instant = false, change = null) {
    const v = VIEWS[name]; if (!v) return;
    endGlide();
    const position = new THREE.Vector3(...v[0]).add(origin()), target = new THREE.Vector3(...v[1]).add(origin());
    if (instant) { change?.(); camera.position.copy(position); controls.target.copy(target); controls.update(); scene.fog.near = haze.near; scene.fog.far = haze.far; return; }
    const far = camera.position.distanceTo(position);
    glide = { from: camera.position.clone(), fromTarget: controls.target.clone(), position, target, t: 0, seconds: change ? 1.6 : THREE.MathUtils.clamp(0.4 + far * 0.045, 0.4, 1.2),
      change, dip: Boolean(change), haze: { near: scene.fog.near, far: scene.fog.far } };
  }
  controls.addEventListener('start', () => { endGlide(); lineTouched = true; });
  // Panels of the page can cover the right and the bottom of the view; the picture then moves into the free area.
  // Only the principal point moves; the zoom is corrected so the scale stays the same.
  const inset = { right: 0, bottom: 0, x: 0, y: 0 };
  function applyView() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    const a = 2 * inset.x, b = 2 * inset.y;
    camera.aspect = (w + a) / (h + b); camera.zoom = h / (h + b); camera.fov = w / h < 1.2 ? 46 : 34;
    if (a > 0.5 || b > 0.5) camera.setViewOffset(w + a, h + b, a, b, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  function setInsets({ right = 0, bottom = 0 } = {}) { inset.right = Math.max(0, right); inset.bottom = Math.max(0, bottom); }
  function followInsets(dt) {
    const goalX = inset.right / 2, goalY = inset.bottom / 2;
    if (Math.abs(goalX - inset.x) < 0.5 && Math.abs(goalY - inset.y) < 0.5) return;
    const k = Math.min(1, dt * 8); inset.x += (goalX - inset.x) * k; inset.y += (goalY - inset.y) * k; applyView();
  }
  let fitted = '';
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); applyView();
    if (!active && row.length && !lineTouched && fitted !== `${w}x${h}`) {                                   // the line is fitted to the picture again until someone has turned the view
      fitted = `${w}x${h}`; lineHaze(fitLine()); VIEWS = { home: lineView };
      if (glide) { glide.position.fromArray(lineView[0]); glide.target.fromArray(lineView[1]); } else setView('home', true);
    }
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);

  /** Screen position (CSS px inside the canvas) of a named part, for the card drawn by the page. */
  function screenOf(name) {
    const p = parts[name]?.anchor; if (!p) return null;
    tmp.copy(p).add(origin()).project(camera);
    return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight, visible: tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 };
  }

  /** Moves every part to match the process state. `dt` is real seconds since the last frame. */
  function update(next, dt = 0.016) {
    view = next; clock += dt;
    frames++; if (dt > 0.034) slowFrames++;
    if (frames >= 90) { if (adaptive && slowFrames > 60 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.25); renderer.setPixelRatio(pixelRatio); resize(); } frames = slowFrames = 0; }
    if (pendingHover) { const ev = pendingHover; pendingHover = null; if (!active) setLineHover(stationAt(ev)); else if (!drag) setHover(partAt(ev)); }
    if (active && next) equipment.update(next, dt, clock);
    moveCart(dt);
    // the machine of the line the pointer is on (or the page points at) stands in a pool of light, on a lit patch of floor
    const pointed = active ? null : lineHover || lineMarked;
    if (pointed && pointed !== lit) {
      const st = stations[pointed]; lit = pointed;
      spot.position.set(st.centre, st.max.y + 4.2, 2.6); spot.target.position.set(st.centre, st.max.y * 0.4, st.offset.z + (st.min.z + st.max.z) / 2); spot.target.updateMatrixWorld();
      spot.angle = Math.min(0.9, Math.atan((st.width / 2 + 0.5) / (st.max.y * 0.6 + 4.2)) + 0.1);
    }
    const glow = pointed ? 30 : 0;
    if (Math.abs(glow - spot.intensity) > 0.5) spot.intensity += (glow - spot.intensity) * Math.min(1, dt * 9); else spot.intensity = glow;
    for (const st of row) {
      const want = st.name === pointed ? 0.2 : 0, has = st.pad.material.opacity;
      if (Math.abs(want - has) > 0.002) st.pad.material.opacity = has + (want - has) * Math.min(1, dt * 12);
    }
    for (const [name, p] of Object.entries(parts)) {
      const want = drag?.name === name ? 0.3 : hovered === name ? (p.kind === 'control' ? 0.17 : 0.12) : 0;
      if (Math.abs(want - p.glow) < 0.002) continue;
      p.glow += (want - p.glow) * Math.min(1, dt * 14);
      for (const m of p.materials) { m.emissive?.setHex(0x3d8bff); m.emissiveIntensity = p.glow; }
    }
    followInsets(dt);
    if (glide) {
      const g = glide; g.t = Math.min(1, g.t + dt / g.seconds); const k = ease(g.t);
      camera.position.lerpVectors(g.from, g.position, k); controls.target.lerpVectors(g.fromTarget, g.target, k);
      if (g.change && g.t >= DIP) { g.change(); g.change = null; }                                             // the room changes while it is out of sight
      const thick = !g.dip ? 1 : g.t < DIP ? 1 - 0.9 * smooth(g.t / DIP) : 0.1 + 0.9 * smooth((g.t - DIP) / (1 - DIP));
      scene.fog.near = (g.haze.near + (haze.near - g.haze.near) * k) * thick; scene.fog.far = (g.haze.far + (haze.far - g.haze.far) * k) * thick;
      if (g.t >= 1) glide = null;
    }
    controls.update();
  }
  function render() { if (!disposed) renderer.render(scene, camera); }

  if (line.length) showLine(true);
  return {
    mount, showLine, update, render, resize, setView, setInsets, screenOf,
    /** The machines of the line in the order they stand; the one in use, or null while the line is on show; true while the camera is on its way to a view. */
    get stations() { return row.map(st => st.name); }, get active() { return active; }, get gliding() { return Boolean(glide); },
    /** Looks at the line from another side: { azimuth, elevation } in degrees, or null for the usual view (tuning and checks). */
    frameLine(angles = null) { if (active) return; lineAngles = angles; lineHaze(fitLine()); VIEWS = { home: lineView }; setView('home', true); },
    /** Marks a machine of the line from outside (the page's route points at it), or none. */
    mark(name) { lineMarked = stations[name] ? name : null; },
    /** Sends the carriage to wait at a machine of the line; with null it goes its round again. */
    park(name) { if (cart) cart.userData.park = stations[name] ? row.indexOf(stations[name]) : null; },
    /** Where a machine of the line is in the picture (CSS px inside the canvas): its top, where the page hangs its card. */
    stationPoint(name) {
      const st = stations[name]; if (!st) return null;
      tmp.set(st.centre, st.max.y, st.offset.z + (st.min.z + st.max.z) / 2).project(camera);
      return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight, visible: tmp.z < 1 };
    },
    /** The machine of the line under a pointer position, or null (used by the browser checks). */
    stationAt(clientX, clientY) { return active ? null : stationAt({ clientX, clientY }); },
    /** Places the camera freely, in the coordinates of the piece in use (checks). */
    lookFrom(position, target) { glide = null; camera.position.set(position[0], position[1], position[2]).add(origin()); controls.target.set(target[0], target[1], target[2]).add(origin()); controls.update(); },
    holdPixelRatio(ratio) { adaptive = false; pixelRatio = ratio; renderer.setPixelRatio(ratio); resize(); },
    /** Names of every part that answers to the pointer, with its kind ('control' or 'info'). */
    get parts() { return Object.fromEntries(Object.entries(parts).map(([name, p]) => [name, p.kind])); },
    /** Name of the part under a pointer position, or null (used by the browser checks). */
    pickAt(clientX, clientY) { return partAt({ clientX, clientY })?.name ?? null; },
    /** Screen position of a world point (used by the browser checks). */
    project(x, y, z) { tmp.set(x, y, z).add(origin()).project(camera); return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight }; },
    get layout() { return equipment?.layout ?? {}; }, get views() { return Object.keys(VIEWS); },
    /** How the line stands: for every machine its place and the box it fits in, metres (checks and tuning). */
    get lineLayout() { return row.map(st => ({ name: st.name, at: st.offset.toArray(), min: st.min.toArray(), max: st.max.toArray(), centre: st.centre })); },
    get screenCanvas() { return equipment?.screenCanvas ?? null; }, refreshScreen() { equipment?.refreshScreen?.(); },
    get dragging() { return drag?.moved ? drag.name : null; }, get hovered() { return hovered; },
    dispose() {
      disposed = true; observer.disconnect(); controls.dispose();
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('pointerleave', pointerLeave);
      for (const t of textures) t.dispose(); environment.dispose(); renderer.dispose();
    },
  };
}
