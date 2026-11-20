// Reactive ion etch chamber of the process lab: two electrodes behind a glass wall, a load arm at the side,
// a pump, the RF matching box and the endpoint sensor. Proportions only; the label ET-01 is made up.
// Controls: power, pressure (dials), chf3, cf4 (quarter-turn valves), load (push button).
// Info parts: chamber, pump, rf, oes, wafer, hmi, tower. State comes from dist/process-lab/etch-model.js.
import { makeParts } from './parts.js';

const DECK = 0.86, CHAMBER = -0.14, LOAD = 0.46, WAFER_Y = DECK + 0.166;
const CONSOLE = { x: 1.16, front: 0.50 };

export function buildEtcher(kit) {
  const { THREE, mat, std, add, small, ghost, cyl, box, tube, plate, label, shade, info } = kit, root = kit.root;
  const parts = makeParts(kit);

  // ----- base -----
  add(box(1.36, DECK - 0.03, 1.04, 0.012), mat.paint, root, [0, (DECK - 0.03) / 2, 0]);
  add(box(1.38, 0.03, 1.06, 0.006), mat.stainless, root, [0, DECK - 0.015, 0]);
  add(box(1.38, 0.08, 1.06, 0.006), mat.graphite, root, [0, 0.04, 0]);
  plate(0.5, 0.07, label(['ET-01', 'REACTIVE ION ETCH'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.3, DECK - 0.2, 0.522]);
  shade(2.6, 1.9, 0.35, 0.0008, 0, 0.42);

  // ----- chamber: lower electrode with the chuck, showerhead above, glass wall, lid -----
  const chamber = new THREE.Group(); chamber.position.set(CHAMBER, DECK, 0); root.add(chamber);
  add(cyl(0.35, 0.35, 0.05, 56), mat.stainless, chamber, [0, 0.025, 0]);
  add(cyl(0.20, 0.23, 0.10, 48), mat.aluminum, chamber, [0, 0.10, 0]);
  add(cyl(0.165, 0.165, 0.012, 48), mat.anodized, chamber, [0, 0.156, 0]);
  add(cyl(0.215, 0.215, 0.03, 48), mat.aluminum, chamber, [0, 0.285, 0]);                                              // showerhead
  add(cyl(0.355, 0.355, 0.06, 56), mat.stainless, chamber, [0, 0.34, 0]);                                              // lid
  small(cyl(0.03, 0.03, 0.08, 20), mat.stainless, chamber, [0, 0.41, 0]);
  ghost(add(cyl(0.33, 0.33, 0.26, 56, true), std(0xe9f1f6, 0, 0.06, { transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }), chamber, [0, 0.18, 0]));
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.5; small(cyl(0.012, 0.012, 0.27, 10), mat.satin, chamber, [Math.cos(a) * 0.345, 0.18, Math.sin(a) * 0.345]); }   // tie rods
  info('chamber', chamber, new THREE.Vector3(CHAMBER, DECK + 0.34, 0.33));
  const glow = ghost(add(cyl(0.19, 0.19, 0.092, 40), new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), chamber, [0, 0.214, 0]));
  const lamp = new THREE.PointLight(0xa78bfa, 0, 2.4, 1.6); lamp.position.set(CHAMBER, DECK + 0.22, 0.25); root.add(lamp);
  tube([[CHAMBER, DECK + 0.45, 0], [CHAMBER, DECK + 0.56, 0], [0.5, DECK + 0.56, -0.2], [CONSOLE.x - 0.1, 1.50, 0.2]], 0.009, mat.stainless, root, 36).castShadow = false;   // gas line

  // ----- pump, RF matching box, endpoint sensor -----
  const pump = new THREE.Group(); pump.position.set(-0.53, DECK, 0.32); root.add(pump);
  add(cyl(0.10, 0.10, 0.24, 32), mat.satin, pump, [0, 0.12, 0]); add(cyl(0.115, 0.115, 0.02, 32), mat.stainless, pump, [0, 0.245, 0]);
  tube([[0, 0.20, -0.03], [0.08, 0.20, -0.12], [0.18, 0.06, -0.2]], 0.035, mat.stainless, pump, 20);
  info('pump', pump, new THREE.Vector3(-0.53, DECK + 0.16, 0.42));
  const rf = new THREE.Group(); rf.position.set(0.46, DECK, -0.38); root.add(rf);
  add(box(0.26, 0.26, 0.18, 0.008), mat.graphite, rf, [0, 0.13, 0]);
  plate(0.12, 0.035, label(['13.56 MHz'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.58 }), rf, [0, 0.19, 0.0905]);
  tube([[-0.13, 0.10, 0.02], [-0.3, 0.08, 0.14], [-0.42, 0.05, 0.26]], 0.008, mat.rubber, rf, 16).castShadow = false;
  info('rf', rf, new THREE.Vector3(0.46, DECK + 0.21, -0.29));
  const oes = new THREE.Group(); oes.position.set(CHAMBER + 0.30, DECK, 0.28); root.add(oes);
  add(box(0.07, 0.06, 0.07, 0.006), mat.graphite, oes, [0, 0.20, 0]); add(cyl(0.012, 0.012, 0.12, 12), mat.stainless, oes, [0, 0.10, 0]);
  tube([[0.03, 0.2, 0.0], [0.2, 0.16, 0.06], [0.5, 0.05, 0.12]], 0.004, std(0xf2d21b, 0, 0.5), oes, 20).castShadow = false;   // fibre to the console
  info('oes', oes, new THREE.Vector3(CHAMBER + 0.30, DECK + 0.21, 0.32));

  // ----- load arm and wafer -----
  add(cyl(0.17, 0.17, 0.03, 40), mat.anodized, root, [LOAD, DECK + 0.015, 0]);
  add(box(0.5, 0.012, 0.05, 0.003), mat.satin, root, [LOAD - 0.2, DECK + 0.12, 0]);
  add(box(0.04, 0.10, 0.20, 0.006), mat.stainless, root, [CHAMBER + 0.345, DECK + 0.17, 0]);                            // slot valve where the wafer goes in
  const film = document.createElement('canvas'); film.width = film.height = 256;
  const filmTexture = new THREE.CanvasTexture(film); filmTexture.colorSpace = THREE.SRGBColorSpace;
  const holder = new THREE.Group(); holder.position.set(LOAD, WAFER_Y, 0); root.add(holder);
  add(cyl(0.15, 0.15, 0.004, 64), [mat.silicon, std(0xffffff, 0.3, 0.25, { map: filmTexture }), mat.silicon], holder).userData.fixed = true;
  info('wafer', holder, new THREE.Vector3(LOAD, WAFER_Y + 0.02, 0));

  // ----- console: screen, two dials, two gas valves, the load button -----
  const c = CONSOLE;
  parts.cabinet(c.x, c.front, { w: 0.66 });
  const hmi = parts.screen(c.x, 1.31, c.front);
  const dials = {
    power: parts.dial('power', c.x - 0.16, 0.99, c.front, { min: 0, max: 600, major: 200, minor: 50, unit: 'W', perPixel: 2, wheel: 10, title: 'RF' }),
    pressure: parts.dial('pressure', c.x + 0.16, 0.99, c.front, { min: 10, max: 200, major: 50, minor: 10, unit: 'mT', perPixel: 0.5, wheel: 5, title: 'PRESS' }),
  };
  const valves = { chf3: parts.valve('chf3', 'CHF₃', c.x - 0.13, 0.72, c.front, mat.blue), cf4: parts.valve('cf4', 'CF₄', c.x - 0.13, 0.56, c.front, mat.red) };
  const load = parts.button('load', 'LOAD', c.x + 0.20, 0.68, c.front, 0x22c55e);
  const tower = parts.tower(c.x + 0.24, 1.50, c.front - 0.30);

  let drawn = '';
  function paintWafer(view) {
    const key = `${view.filmColor.join(',')}|${Math.round(view.resist * 20)}|${view.open.map(v => Math.round(v * 10)).join('')}|${view.windows}`;
    if (key === drawn) return;
    drawn = key;
    const x = film.getContext('2d'), n = film.width, [r, g, b] = view.filmColor;
    x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, n, n);
    if (view.resist > 0) { x.fillStyle = `rgba(176,92,26,${0.72 * view.resist})`; x.fillRect(0, 0, n, n); }                  // resist thinning away
    if (view.windows) {                                                                                              // fields of windows, clearer as they open: the edge first
      const cell = n / 10, last = view.open.length - 1;
      for (let i = 0; i < 64; i++) {
        const left = (i % 8 + 1) * cell, top = (Math.floor(i / 8) + 1) * cell, r = Math.min(1, Math.hypot(left + cell / 2 - n / 2, top + cell / 2 - n / 2) / (n / 2));
        x.fillStyle = `rgba(150,160,176,${0.25 + 0.6 * view.open[Math.round(r * last)]})`; x.fillRect(left + 4, top + 4, cell - 8, cell - 8);
      }
    }
    filmTexture.needsUpdate = true;
  }
  /** `view`: inside (0..1), plasma, controls { power, pressure, chf3, cf4, load }, filmColor, resist (0..1 left), open (0..1 at each place from the centre to the edge), windows, alarm. */
  function update(view, dt, clock) {
    const k = view.inside * view.inside * (3 - 2 * view.inside);
    holder.position.x = LOAD + (CHAMBER - LOAD) * k;
    kit.partAnchor('wafer').set(holder.position.x, WAFER_Y + 0.02, 0);
    const level = view.plasma ? 0.35 + 0.55 * Math.min(1, view.controls.power / 600) : 0;
    glow.material.opacity += (level * (0.9 + 0.1 * Math.sin(clock * 23)) - glow.material.opacity) * Math.min(1, dt * 8); lamp.intensity = glow.material.opacity * 2.4;
    paintWafer(view);
    for (const [name, dial] of Object.entries(dials)) dial.set(view.controls[name]);
    for (const [name, valve] of Object.entries(valves)) valve.set(view.controls[name], dt);
    load.set(!view.plasma, dt, false);
    tower.set(view.alarm ? 2 : view.plasma ? 0 : 1, dt, clock);
  }

  return {
    update, screenCanvas: hmi.canvas, refreshScreen: hmi.refresh,
    views: { home: [[1.9, 2.05, 4.1], [0.42, 1.0, 0.05]], chamber: [[0.75, 1.5, 1.9], [CHAMBER, DECK + 0.2, 0]], panel: [[c.x + 0.2, 1.1, 2.2], [c.x, 0.95, c.front]], screen: [[c.x, 1.33, c.front + 0.85], [c.x, 1.31, c.front]] },
    layout: { dials: Object.fromEntries(Object.entries(dials).map(([name, dial]) => [name, dial.at])), valves: Object.fromEntries(Object.entries(valves).map(([name, valve]) => [name, valve.at])), buttons: { load: load.at }, hmi: hmi.at },
  };
}
