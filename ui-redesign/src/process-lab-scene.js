// 3D host of the process lab (three.js): one renderer, room and camera, and one piece of equipment at a time.
// Bundled into dist/process-lab/scene.js by tools/build-scenes.mjs (global CMPProcessLabScene).
//
// A piece of equipment is a module in src/process-lab/ that builds its meshes with the kit handed to it, names the
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
import { buildFurnace } from './process-lab/furnace.js';
import { buildTrack } from './process-lab/track.js';
import { buildEtcher } from './process-lab/etcher.js';
import { buildImplanter } from './process-lab/implanter.js';
import { buildPlater } from './process-lab/plater.js';

const EQUIPMENT = { oxidation: buildFurnace, photo: buildTrack, etch: buildEtcher, implant: buildImplanter, plating: buildPlater };

export function create({ canvas, on = {} }) {
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
  const camera = new THREE.PerspectiveCamera(34, 1.6, 0.05, 80);

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
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping; floorMap.repeat.set(100, 100);                        // 0.6 m tiles
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), std(0xffffff, 0, 0.5, { map: floorMap }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // ----- the equipment on show -----
  let equipment = null, VIEWS = { home: [[3, 2, 5], [0, 1.2, 0]] };
  function mount(name) {
    if (!EQUIPMENT[name]) throw new Error(`no equipment for ${name}`);
    if (root) { scene.remove(root); root.traverse(o => { o.geometry?.dispose?.(); }); }
    root = new THREE.Group(); scene.add(root); parts = {}; hovered = null; drag = null; press = null;
    equipment = EQUIPMENT[name](kit); VIEWS = equipment.views;
    setView('home', true); resize();
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
    if (press && !drag) { const p = press; press = null; if (Math.hypot(ev.clientX - p.x, ev.clientY - p.y) < 5) on.press?.(p.name); }
    press = null; endDrag();
  };
  const onWheel = ev => {
    const found = partAt(ev); if (!found || found.kind !== 'control' || !parts[found.name].how.wheel) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    emit(found.name, current(found.name) + (ev.deltaY < 0 ? 1 : -1) * parts[found.name].how.wheel);
  };
  const pointerLeave = () => { pendingHover = null; if (!drag) setHover(null); };
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false }); canvas.addEventListener('pointerleave', pointerLeave);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.8; controls.panSpeed = 0.6;
  controls.minDistance = 0.8; controls.maxDistance = 11; controls.minPolarAngle = 0.05; controls.maxPolarAngle = Math.PI * 0.495;

  let glide = null;
  function setView(name = 'home', instant = false) {
    const v = VIEWS[name]; if (!v) return;
    if (instant) { glide = null; camera.position.set(...v[0]); controls.target.set(...v[1]); controls.update(); }
    else glide = { position: new THREE.Vector3(...v[0]), target: new THREE.Vector3(...v[1]) };
  }
  controls.addEventListener('start', () => { glide = null; });
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
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); applyView();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);

  /** Screen position (CSS px inside the canvas) of a named part, for the card drawn by the page. */
  function screenOf(name) {
    const p = parts[name]?.anchor; if (!p) return null;
    tmp.copy(p).project(camera);
    return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight, visible: tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 };
  }

  /** Moves every part to match the process state. `dt` is real seconds since the last frame. */
  function update(next, dt = 0.016) {
    view = next; clock += dt;
    frames++; if (dt > 0.034) slowFrames++;
    if (frames >= 90) { if (adaptive && slowFrames > 60 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.25); renderer.setPixelRatio(pixelRatio); resize(); } frames = slowFrames = 0; }
    if (pendingHover) { const ev = pendingHover; pendingHover = null; if (!drag) setHover(partAt(ev)); }
    equipment?.update(next, dt, clock);
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

  return {
    mount, update, render, resize, setView, setInsets, screenOf,
    /** Places the camera freely (still pictures and checks). */
    lookFrom(position, target) { glide = null; camera.position.set(position[0], position[1], position[2]); controls.target.set(target[0], target[1], target[2]); controls.update(); },
    holdPixelRatio(ratio) { adaptive = false; pixelRatio = ratio; renderer.setPixelRatio(ratio); resize(); },
    /** Names of every part that answers to the pointer, with its kind ('control' or 'info'). */
    get parts() { return Object.fromEntries(Object.entries(parts).map(([name, p]) => [name, p.kind])); },
    /** Name of the part under a pointer position, or null (used by the browser checks). */
    pickAt(clientX, clientY) { return partAt({ clientX, clientY })?.name ?? null; },
    /** Screen position of a world point (used by the browser checks). */
    project(x, y, z) { tmp.set(x, y, z).project(camera); return { x: (tmp.x + 1) / 2 * canvas.clientWidth, y: (1 - tmp.y) / 2 * canvas.clientHeight }; },
    get layout() { return equipment?.layout ?? {}; }, get views() { return Object.keys(VIEWS); },
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
