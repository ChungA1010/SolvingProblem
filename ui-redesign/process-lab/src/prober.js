// Wafer prober of the process lab: a chuck on an XY stage that carries the wafer under a fixed probe card, the camera
// that looks at the needles, and the tester the card is wired to. Proportions only; the label PB-01 is made up.
// Controls: x, y, z (dials) and contact, probe (push buttons).
// Info parts: card, chuck, camera, tester, wafer, hmi, tower. State comes from ../eds-model.js.
import { makeParts } from './parts.js';

const DECK = 0.86, STAGE = { x: -0.10, z: 0.07 }, WAFER_Y = DECK + 0.242, LIFT = 0.008;   // the chuck rises by LIFT to press the pads on the needles
const CONSOLE = { x: 1.22, front: 0.50 };

export function buildProber(kit) {
  const { THREE, mat, std, add, small, ghost, cyl, box, facing, tube, plate, label, shade, info } = kit, root = kit.root;
  const parts = makeParts(kit);

  // ----- base -----
  add(box(1.36, DECK - 0.03, 1.04, 0.012), mat.paint, root, [0, (DECK - 0.03) / 2, 0]);
  add(box(1.38, 0.03, 1.06, 0.006), mat.stainless, root, [0, DECK - 0.015, 0]);
  add(box(1.38, 0.08, 1.06, 0.006), mat.graphite, root, [0, 0.04, 0]);
  plate(0.5, 0.07, label(['PB-01', 'WAFER PROBER'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.3, DECK - 0.2, 0.522]);
  shade(2.7, 1.9, 0.38, 0.0008, 0, 0.42);

  // ----- stage: granite, the carriage that moves front to back, and on it the one that moves left to right with the chuck -----
  add(box(0.92, 0.05, 0.74, 0.006), mat.graphite, root, [STAGE.x, DECK + 0.025, STAGE.z]);
  for (const sx of [-0.3, 0.3]) small(box(0.03, 0.012, 0.70, 0.002), mat.satin, root, [STAGE.x + sx, DECK + 0.056, STAGE.z]);
  const carriage = new THREE.Group(); carriage.position.set(STAGE.x, 0, STAGE.z); root.add(carriage);
  add(box(0.70, 0.035, 0.44, 0.006), mat.aluminum, carriage, [0, DECK + 0.08, 0]);
  for (const sz of [-0.15, 0.15]) small(box(0.66, 0.012, 0.03, 0.002), mat.satin, carriage, [0, DECK + 0.103, sz]);
  const stage = new THREE.Group(); stage.position.set(STAGE.x, 0, STAGE.z); root.add(stage);
  add(box(0.40, 0.035, 0.40, 0.006), mat.aluminum, stage, [0, DECK + 0.127, 0]);
  add(cyl(0.07, 0.085, 0.045, 32), mat.anodized, stage, [0, DECK + 0.167, 0]);
  add(cyl(0.165, 0.165, 0.05, 56), mat.brass, stage, [0, DECK + 0.215, 0]);                                           // gold-plated chuck
  info('chuck', stage, new THREE.Vector3(STAGE.x + 0.117, DECK + 0.215, STAGE.z + 0.117));
  const film = document.createElement('canvas'); film.width = film.height = 512;
  const filmTexture = new THREE.CanvasTexture(film); filmTexture.colorSpace = THREE.SRGBColorSpace; filmTexture.anisotropy = 4;
  const holder = new THREE.Group(); holder.position.y = WAFER_Y; stage.add(holder);
  add(cyl(0.15, 0.15, 0.004, 64), [mat.silicon, std(0xffffff, 0.3, 0.3, { map: filmTexture }), mat.silicon], holder).userData.fixed = true;
  info('wafer', holder, new THREE.Vector3(STAGE.x + 0.09, WAFER_Y + 0.003, STAGE.z + 0.10));

  // ----- bridge over the stage with the probe card under it and the camera on it -----
  const card = new THREE.Group(); card.position.set(STAGE.x, DECK, STAGE.z); root.add(card);
  for (const sx of [-1, 1]) add(box(0.07, 0.36, 0.12, 0.006), mat.paint, card, [sx * 0.515, 0.18, 0]);
  add(box(1.10, 0.05, 0.16, 0.008), mat.paint, card, [0, 0.385, 0]);
  add(cyl(0.19, 0.19, 0.02, 48), mat.stainless, card, [0, 0.35, 0]);
  add(cyl(0.17, 0.17, 0.008, 48), std(0x1f7a3d, 0.1, 0.6), card, [0, 0.336, 0]);                                       // the card's circuit board
  add(cyl(0.05, 0.05, 0.01, 32), mat.ceramic, card, [0, 0.328, 0]);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + 0.26, c = Math.cos(a), s = Math.sin(a); ghost(tube([[c * 0.045, 0.324, s * 0.045], [c * 0.006, WAFER_Y + 0.002 + LIFT - DECK, s * 0.006]], 0.0013, mat.satin, card, 3)); }   // needles
  plate(0.16, 0.035, label(['PROBE CARD'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.55 }), card, [-0.30, 0.385, 0.0805]);
  info('card', card, new THREE.Vector3(STAGE.x - 0.30, DECK + 0.412, STAGE.z + 0.05));
  const camera = new THREE.Group(); camera.position.set(STAGE.x, DECK + 0.41, STAGE.z); root.add(camera);
  add(box(0.08, 0.10, 0.08, 0.006), mat.anodized, camera, [0, 0.05, 0]);
  add(cyl(0.022, 0.026, 0.04, 20), mat.stainless, camera, [0, 0.12, 0]);
  tube([[0.04, 0.07, 0], [0.12, 0.10, -0.04], [0.26, 0.03, -0.06]], 0.006, mat.rubber, camera, 14).castShadow = false;
  info('camera', camera, new THREE.Vector3(STAGE.x, DECK + 0.512, STAGE.z + 0.02));

  // ----- tester, wired to the probe card -----
  const tester = new THREE.Group(); tester.position.set(-0.42, DECK, -0.42); root.add(tester);
  add(box(0.42, 0.62, 0.20, 0.01), mat.paint, tester, [0, 0.31, 0]);
  plate(0.14, 0.04, label(['TESTER'], { bg: '#24272c', fg: '#e9edf3', size: 0.6 }), tester, [-0.11, 0.55, 0.1005]);
  const ledMaterial = new THREE.MeshStandardMaterial({ color: 0x14532d, emissive: 0x22c55e, emissiveIntensity: 0.05, roughness: 0.4 });
  for (let i = 0; i < 6; i++) ghost(add(box(0.022, 0.012, 0.004, 0.001), ledMaterial, tester, [0.02 + i * 0.03, 0.55, 0.101]));
  for (let i = 0; i < 5; i++) small(box(0.30, 0.008, 0.004, 0.001), mat.graphite, tester, [0, 0.14 + i * 0.045, 0.101]);
  tube([[0.1, 0.62, 0], [0.2, 0.72, 0.18], [0.30, 0.62, 0.40], [0.26, 0.42, 0.46]], 0.018, mat.rubber, tester, 30);     // cable bundle to the card
  info('tester', tester, new THREE.Vector3(-0.42, DECK + 0.622, -0.34));

  // ----- console: screen, the three dials, the two buttons -----
  const c = CONSOLE, signed = v => `${v > 0 ? '+' : ''}${Math.round(v)}`;
  parts.cabinet(c.x, c.front, { w: 0.84 });
  const hmi = parts.screen(c.x, 1.31, c.front);
  const dials = {
    x: parts.dial('x', c.x - 0.27, 0.99, c.front, { min: -60, max: 60, major: 20, minor: 5, unit: 'µm', perPixel: 0.25, wheel: 1, title: 'X', format: signed }),
    y: parts.dial('y', c.x, 0.99, c.front, { min: -60, max: 60, major: 20, minor: 5, unit: 'µm', perPixel: 0.25, wheel: 1, title: 'Y', format: signed }),
    z: parts.dial('z', c.x + 0.27, 0.99, c.front, { min: 0, max: 100, major: 20, minor: 5, unit: 'µm', perPixel: 0.25, wheel: 5, title: 'OD' }),
  };
  const buttons = { contact: parts.button('contact', 'CONTACT', c.x - 0.13, 0.70, c.front, 0x38bdf8), probe: parts.button('probe', 'PROBE', c.x + 0.13, 0.70, c.front, 0x22c55e) };
  const tower = parts.tower(c.x + 0.32, 1.50, c.front - 0.30);

  let drawn = '', px = 0, pz = 0, lift = 0;
  function paintWafer(view) {
    const key = `${view.stamp}|${view.filmColor.join(',')}`;
    if (key === drawn) return;
    drawn = key;
    const x = film.getContext('2d'), n = film.width, [r, g, b] = view.filmColor, at = v => (v / 150 * 0.5 + 0.5) * n, size = 20 / 300 * n;
    x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, n, n);
    view.dies.forEach((die, i) => {
      const cx = at(die.y), cy = n - at(die.x), state = view.states[i];                                               // the cap's texture runs along z, then x
      x.fillStyle = 'rgba(214,162,63,.55)'; x.fillRect(cx - size / 2 + 2, cy - size / 2 + 2, size - 4, size - 4);     // copper pattern of a chip
      if (state === 1) { x.fillStyle = 'rgba(47,158,121,.45)'; x.fillRect(cx - size / 2 + 2, cy - size / 2 + 2, size - 4, size - 4); }
      if (state === 2) { x.fillStyle = 'rgba(20,20,24,.9)'; x.beginPath(); x.arc(cx, cy, size * 0.24, 0, 7); x.fill(); }   // ink dot on a failed chip
    });
    filmTexture.needsUpdate = true;
  }
  /** `view`: at { x, y } (mm, the chip under the needles), down, phase, testing, dies, states (0 untested, 1 good, 2 failed), stamp, filmColor, controls { x, y, z }, alarm. */
  function update(view, dt, clock) {
    const k = Math.min(1, dt * 12);
    px += (-view.at.x / 1000 - px) * k; pz += (-view.at.y / 1000 - pz) * k; lift += ((view.down ? 1 : 0) - lift) * Math.min(1, dt * 16);
    carriage.position.z = STAGE.z + pz; stage.position.set(STAGE.x + px, LIFT * lift, STAGE.z + pz);
    kit.partAnchor('chuck').set(STAGE.x + px + 0.117, DECK + 0.215, STAGE.z + pz + 0.117);
    kit.partAnchor('wafer').set(STAGE.x + px + 0.09, WAFER_Y + 0.003, STAGE.z + pz + 0.10);
    ledMaterial.emissiveIntensity = view.testing ? 0.9 + 0.7 * Math.sin(clock * 24) : 0.05;
    paintWafer(view);
    for (const [name, dial] of Object.entries(dials)) dial.set(view.controls[name]);
    buttons.contact.set(view.phase !== 'probing', dt, false); buttons.probe.set(view.phase !== 'probing', dt, false);
    tower.set(view.alarm ? 2 : view.testing ? 0 : 1, dt, clock);
  }

  return {
    update, screenCanvas: hmi.canvas, refreshScreen: hmi.refresh,
    views: {
      home: [[1.95, 2.15, 4.2], [0.42, 1.12, 0.05]], stage: [[0.55, 1.75, 1.9], [STAGE.x, DECK + 0.25, STAGE.z]], needles: [[0.22, 1.30, 0.95], [STAGE.x, DECK + 0.28, STAGE.z]],
      panel: [[c.x + 0.2, 1.1, 2.3], [c.x, 0.95, c.front]], screen: [[c.x, 1.33, c.front + 0.85], [c.x, 1.31, c.front]],
    },
    layout: { dials: Object.fromEntries(Object.entries(dials).map(([name, dial]) => [name, dial.at])), buttons: Object.fromEntries(Object.entries(buttons).map(([name, button]) => [name, button.at])), hmi: hmi.at },
  };
}
