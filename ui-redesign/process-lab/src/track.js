// Coat, expose and develop cell of the process lab: a spin coater, an i-line stepper and a developer on one base,
// with a transfer arm that carries the wafer between them. Proportions only; the label PH-01 is made up.
// Controls: spin, dose, focus (dials) and coat, expose, develop, strip (push buttons).
// Info parts: coater, lens, reticle, developer, hmi, tower. State comes from ../photo-model.js.
import { makeParts } from './parts.js';

const DECK = 0.86, WAFER_Y = DECK + 0.125;
const SPOTS = { coat: -0.98, expose: 0, develop: 0.98 };       // x of the three places a wafer can be
const CONSOLE = { x: 1.98, front: 0.50 };

export function buildTrack(kit) {
  const { THREE, mat, std, add, small, ghost, cyl, box, plate, label, shade, canvasTexture, info } = kit, root = kit.root;
  const parts = makeParts(kit);

  // ----- base and deck -----
  add(box(2.94, DECK - 0.03, 1.04, 0.012), mat.paint, root, [0, (DECK - 0.03) / 2, 0]);
  add(box(2.96, 0.03, 1.06, 0.006), mat.stainless, root, [0, DECK - 0.015, 0]);
  add(box(2.96, 0.08, 1.06, 0.006), mat.graphite, root, [0, 0.04, 0]);
  plate(0.5, 0.07, label(['PH-01', 'COAT · EXPOSE · DEVELOP'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.95, DECK - 0.2, 0.522]);
  shade(3.9, 1.9, 0.3, 0.0008, 0, 0.42);

  // ----- spin cups: coater on the left, developer on the right -----
  function cup(x, name, liquid) {
    const g = new THREE.Group(); g.position.set(x, DECK, 0); root.add(g);
    add(cyl(0.25, 0.25, 0.02, 48), mat.white, g, [0, 0.01, 0]);
    add(new THREE.CylinderGeometry(0.24, 0.25, 0.15, 48, 1, true), std(0xf0efe9, 0, 0.48, { side: THREE.DoubleSide }), g, [0, 0.095, 0]);
    add(cyl(0.035, 0.035, 0.09, 20), mat.stainless, g, [0, 0.065, 0]);
    const chuck = add(cyl(0.09, 0.09, 0.012, 40), mat.anodized, g, [0, 0.116, 0]);
    add(cyl(0.022, 0.022, 0.34, 16), mat.stainless, g, [-0.27, 0.17, -0.22]);                                       // dispense arm
    const arm = add(box(0.30, 0.03, 0.03, 0.006), mat.aluminum, g, [-0.135, 0.33, -0.11]); arm.rotation.y = -0.69;
    small(cyl(0.008, 0.005, 0.05, 10), mat.stainless, g, [0, 0.30, 0]);
    add(cyl(0.04, 0.04, 0.12, 20), std(liquid, 0, 0.3, { transparent: true, opacity: 0.85 }), g, [-0.36, 0.06, -0.3]);   // bottle
    info(name, g, new THREE.Vector3(x + 0.175, DECK + 0.12, 0.176));                                               // on the cup wall, clear of the transfer arm
    return { g, chuck };
  }
  cup(SPOTS.coat, 'coater', 0xb5651d);
  const developer = cup(SPOTS.develop, 'developer', 0x9fd3e6);
  const puddle = ghost(add(cyl(0.148, 0.148, 0.004, 48), std(0xbfe6f5, 0, 0.05, { transparent: true, opacity: 0 }), developer.g, [0, 0.131, 0]));

  // ----- stepper: stage, lens column, reticle, illuminator on a bridge -----
  const stepper = new THREE.Group(); stepper.position.set(SPOTS.expose, DECK, 0); root.add(stepper);
  add(box(0.62, 0.07, 0.62, 0.008), mat.graphite, stepper, [0, 0.035, 0]);                                           // granite base
  const stage = new THREE.Group(); stepper.add(stage);
  add(box(0.44, 0.03, 0.44, 0.006), mat.aluminum, stage, [0, 0.085, 0]);
  add(cyl(0.155, 0.155, 0.016, 48), mat.anodized, stage, [0, 0.108, 0]);
  for (const sx of [-1, 1]) add(box(0.09, 1.34, 0.09, 0.008), mat.paint, stepper, [sx * 0.36, 0.67, -0.38]);
  add(box(0.86, 0.10, 0.50, 0.01), mat.paint, stepper, [0, 1.39, -0.20]);
  const lens = new THREE.Group(); stepper.add(lens);
  add(cyl(0.085, 0.07, 0.10, 40), mat.anodized, lens, [0, 0.21, 0]);
  add(cyl(0.11, 0.085, 0.16, 40), mat.stainless, lens, [0, 0.34, 0]);
  add(cyl(0.13, 0.13, 0.34, 40), mat.anodized, lens, [0, 0.59, 0]);
  add(cyl(0.115, 0.13, 0.14, 40), mat.stainless, lens, [0, 0.83, 0]);
  add(cyl(0.10, 0.10, 0.10, 40), mat.anodized, lens, [0, 0.95, 0]);
  plate(0.12, 0.04, label(['i-line  NA 0.60'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.55 }), lens, [0, 0.59, 0.1305]);
  info('lens', lens, new THREE.Vector3(SPOTS.expose, DECK + 0.6, 0.14));
  const reticle = new THREE.Group(); stepper.add(reticle);
  add(box(0.36, 0.03, 0.36, 0.006), mat.aluminum, reticle, [0, 1.06, 0]);
  const reticleMap = canvasTexture(128, (c, n) => { c.fillStyle = '#2a2f38'; c.fillRect(0, 0, n, n); c.fillStyle = '#dbe7f2'; for (let i = 0; i < 6; i++) c.fillRect(22 + i * 15, 20, 5, 88); });
  add(box(0.17, 0.012, 0.17, 0.002), [mat.quartz, mat.quartz, std(0xffffff, 0.2, 0.3, { map: reticleMap }), mat.quartz, mat.quartz, mat.quartz], reticle, [0, 1.085, 0]);
  info('reticle', reticle, new THREE.Vector3(SPOTS.expose, DECK + 1.09, 0.1));
  add(box(0.30, 0.20, 0.30, 0.01), mat.graphite, stepper, [0, 1.25, 0]);                                              // illuminator under the bridge
  const beamMaterial = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const beamUp = ghost(add(cyl(0.05, 0.085, 0.10, 24, true), beamMaterial, stepper, [0, 1.145, 0]));
  const beamDown = ghost(add(cyl(0.06, 0.012, 0.045, 24, true), beamMaterial, stepper, [0, 0.14, 0]));
  const tower = parts.tower(SPOTS.expose + 0.34, DECK + 1.44, -0.02);

  // ----- wafer and the transfer arm that carries it along the front -----
  const film = document.createElement('canvas'); film.width = film.height = 256;
  const filmTexture = new THREE.CanvasTexture(film); filmTexture.colorSpace = THREE.SRGBColorSpace;
  const holder = new THREE.Group(); holder.position.set(SPOTS.coat, WAFER_Y, 0); root.add(holder);
  const wafer = add(cyl(0.15, 0.15, 0.004, 64), [mat.silicon, std(0xffffff, 0.3, 0.25, { map: filmTexture }), mat.silicon], holder);
  wafer.userData.fixed = true;
  add(box(2.5, 0.03, 0.05, 0.006), mat.anodized, root, [0, DECK + 0.015, 0.42]);                                      // rail
  const carriage = new THREE.Group(); carriage.position.set(SPOTS.coat, DECK, 0.42); root.add(carriage);
  add(box(0.10, 0.17, 0.08, 0.006), mat.aluminum, carriage, [0, 0.115, 0]);
  add(box(0.05, 0.012, 0.30, 0.003), mat.satin, carriage, [0, 0.195, -0.17]);                                         // reaches over the rim of the cup
  info('wafer', holder, new THREE.Vector3(SPOTS.coat, WAFER_Y + 0.02, 0));

  // ----- console: screen, three dials, four buttons -----
  const c = CONSOLE;
  parts.cabinet(c.x, c.front, { w: 0.84 });
  const hmi = parts.screen(c.x, 1.31, c.front);
  const dials = {
    spin: parts.dial('spin', c.x - 0.27, 0.99, c.front, { min: 1500, max: 6000, major: 1500, minor: 500, unit: 'rpm', perPixel: 15, wheel: 50, title: 'SPIN' }),
    dose: parts.dial('dose', c.x, 0.99, c.front, { min: 20, max: 400, major: 100, minor: 20, unit: 'mJ', perPixel: 1, wheel: 2, title: 'DOSE' }),
    focus: parts.dial('focus', c.x + 0.27, 0.99, c.front, { min: -4, max: 4, major: 2, minor: 0.5, unit: 'µm', perPixel: 0.02, wheel: 0.1, title: 'FOCUS', format: v => `${v > 0 ? '+' : ''}${v.toFixed(1)}` }),
  };
  const buttons = {
    coat: parts.button('coat', 'COAT', c.x - 0.30, 0.70, c.front, 0x22c55e), expose: parts.button('expose', 'EXPOSE', c.x - 0.10, 0.70, c.front, 0x8b5cf6),
    develop: parts.button('develop', 'DEVELOP', c.x + 0.10, 0.70, c.front, 0x38bdf8), strip: parts.button('strip', 'STRIP', c.x + 0.30, 0.70, c.front, 0xf59e0b),
  };

  const where = { bare: 'coat', coating: 'coat', coated: 'coat', exposing: 'expose', exposed: 'expose', developing: 'develop', developed: 'develop' };
  const READY = { coat: ['bare'], expose: ['coated'], develop: ['exposed'], strip: ['coated', 'exposed', 'developed'] };
  let drawn = '';
  function paintWafer(view) {
    const key = `${view.phase}|${view.fields}|${view.filmColor.join(',')}|${Math.round(view.coverage * 20)}|${view.result ? Math.round(view.result.opening) : ''}`;
    if (key === drawn) return;
    drawn = key;
    const x = film.getContext('2d'), n = film.width, [r, g, b] = view.filmColor;
    x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, n, n);
    if (view.coverage > 0) { x.fillStyle = 'rgba(176,92,26,.72)'; x.beginPath(); x.arc(n / 2, n / 2, n / 2 * view.coverage, 0, 7); x.fill(); }     // resist spreading from the centre
    const cell = n / 10;                                                                                              // exposure fields, in the order the stage steps
    for (let i = 0; i < view.fields; i++) { const col = i % 8, row = Math.floor(i / 8); x.fillStyle = view.phase === 'developed' ? 'rgba(255,255,255,.34)' : 'rgba(139,92,246,.42)'; x.fillRect((col + 1) * cell + 1, (row + 1.2) * cell + 1, cell - 2, cell - 2); }
    filmTexture.needsUpdate = true;
  }
  /** `view`: phase, progress, rpm, fields, shutter, controls { spin, dose, focus }, coverage (0..1), filmColor, result, alarm. */
  function update(view, dt, clock) {
    const spot = SPOTS[where[view.phase]];
    const far = Math.abs(holder.position.x - spot);
    holder.position.x += (spot - holder.position.x) * Math.min(1, dt * 3.2);
    holder.position.y = WAFER_Y + Math.min(0.16, far * 0.5);                                                          // lifted while it travels
    carriage.position.x = holder.position.x;
    if (view.phase === 'exposing') { const i = view.fields; holder.position.x = spot + ((i % 8) - 3.5) * 0.012; holder.position.z = (Math.floor(i / 8) - 3.5) * 0.012; } else holder.position.z *= Math.max(0, 1 - dt * 6);
    stage.position.x = view.phase === 'exposing' ? holder.position.x - spot : stage.position.x * Math.max(0, 1 - dt * 6);
    stage.position.z = view.phase === 'exposing' ? holder.position.z : stage.position.z * Math.max(0, 1 - dt * 6);
    wafer.rotation.y += dt * Math.min(40, view.rpm / 60 * 6.283 * 0.12);
    beamMaterial.opacity = view.shutter ? 0.5 + 0.2 * Math.sin(clock * 30) : 0;
    puddle.material.opacity = view.phase === 'developing' ? 0.55 : 0;
    kit.partAnchor('wafer').set(holder.position.x, holder.position.y + 0.02, holder.position.z);
    paintWafer(view);
    for (const [name, dial] of Object.entries(dials)) dial.set(view.controls[name]);
    for (const [name, button] of Object.entries(buttons)) button.set(READY[name].includes(view.phase), dt, view.pressed === name);
    tower.set(view.alarm ? 2 : ['coating', 'exposing', 'developing'].includes(view.phase) ? 0 : 1, dt, clock);
  }

  return {
    update, screenCanvas: hmi.canvas, refreshScreen: hmi.refresh,
    views: { home: [[1.2, 2.5, 5.6], [0.45, 1.0, 0]], coater: [[-0.3, 1.75, 2.1], [SPOTS.coat, DECK + 0.15, 0]], stepper: [[1.3, 1.9, 2.6], [SPOTS.expose, DECK + 0.6, 0]], panel: [[c.x + 0.25, 1.15, 2.3], [c.x, 0.98, c.front]], screen: [[c.x, 1.33, c.front + 0.85], [c.x, 1.31, c.front]] },
    layout: { dials: Object.fromEntries(Object.entries(dials).map(([name, dial]) => [name, dial.at])), buttons: Object.fromEntries(Object.entries(buttons).map(([name, button]) => [name, button.at])), hmi: hmi.at },
  };
}
