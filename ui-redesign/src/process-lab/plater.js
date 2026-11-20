// Copper electroplating cell of the process lab: a bath with a copper anode, a head that turns the wafer face down and
// lowers it into the bath, and the rectifier that drives the current. Proportions only; the label EP-01 is made up.
// Controls: head (pulled down and up), current, rotation (dials).
// Info parts: cell, anode, rectifier, wafer, hmi, tower. State comes from dist/process-lab/plating-model.js.
import { makeParts } from './parts.js';

const DECK = 0.86, CELL = { x: -0.14, z: 0.06 }, LIQUID = DECK + 0.27;       // top of the bath
const HEAD_UP = DECK + 0.80, TRAVEL = HEAD_UP - (LIQUID + 0.048);            // height of the head's hub when raised; how far it comes down
const FLIP = 0.3;                                                           // share of the head's way spent turning the wafer over
const CONSOLE = { x: 1.16, front: 0.50 };

export function buildPlater(kit) {
  const { THREE, mat, std, add, small, ghost, cyl, box, facing, tube, plate, label, shade, control, info } = kit, root = kit.root;
  const parts = makeParts(kit);
  const copper = std(0xb87333, 1, 0.38);

  // ----- base -----
  add(box(1.36, DECK - 0.03, 1.04, 0.012), mat.paint, root, [0, (DECK - 0.03) / 2, 0]);
  add(box(1.38, 0.03, 1.06, 0.006), mat.stainless, root, [0, DECK - 0.015, 0]);
  add(box(1.38, 0.08, 1.06, 0.006), mat.graphite, root, [0, 0.04, 0]);
  plate(0.5, 0.07, label(['EP-01', 'COPPER ELECTROPLATING'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.3, DECK - 0.2, 0.522]);
  shade(2.6, 1.9, 0.35, 0.0008, 0, 0.42);

  // ----- cell: glass wall on a steel base, the bath, a filter beside it -----
  const cell = new THREE.Group(); cell.position.set(CELL.x, DECK, CELL.z); root.add(cell);
  add(cyl(0.33, 0.345, 0.08, 56), mat.stainless, cell, [0, 0.04, 0]);
  ghost(add(cyl(0.30, 0.30, 0.27, 56, true), mat.glass, cell, [0, 0.215, 0]));
  small(new THREE.TorusGeometry(0.30, 0.012, 10, 56), mat.stainless, cell, [0, 0.35, 0]).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; small(cyl(0.009, 0.009, 0.27, 8), mat.satin, cell, [Math.cos(a) * 0.315, 0.215, Math.sin(a) * 0.315]); }
  ghost(add(cyl(0.292, 0.292, 0.19, 56), std(0x1f7fd8, 0, 0.08, { transparent: true, opacity: 0.5, depthWrite: false }), cell, [0, 0.175, 0]));   // copper sulphate bath
  add(cyl(0.06, 0.06, 0.22, 24), mat.white, cell, [-0.40, 0.11, 0.30]); small(cyl(0.065, 0.065, 0.02, 24), mat.anodized, cell, [-0.40, 0.23, 0.30]);   // filter
  tube([[-0.40, 0.05, 0.24], [-0.36, 0.035, 0.14], [-0.30, 0.03, 0.08]], 0.014, mat.white, cell, 16);
  info('cell', cell, new THREE.Vector3(CELL.x, DECK + 0.045, CELL.z + 0.338));
  const anode = new THREE.Group(); anode.position.set(CELL.x, DECK, CELL.z); root.add(anode);
  add(cyl(0.24, 0.24, 0.03, 48), copper, anode, [0, 0.095, 0]);
  info('anode', anode, new THREE.Vector3(CELL.x + 0.12, DECK + 0.111, CELL.z + 0.12));
  const bubbleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false });
  const bubbles = []; for (let i = 0; i < 14; i++) bubbles.push(ghost(add(new THREE.SphereGeometry(0.007, 8, 6), bubbleMaterial, cell)));

  // ----- head on its column: arm, body that turns over, the chuck that spins the wafer -----
  add(box(0.13, 1.08, 0.13, 0.01), mat.paint, root, [CELL.x, DECK + 0.54, -0.42]);
  add(box(0.03, 1.0, 0.008, 0.002), mat.anodized, root, [CELL.x, DECK + 0.55, -0.353]);
  const lift = new THREE.Group(); lift.position.set(CELL.x, HEAD_UP, CELL.z); root.add(lift);
  add(box(0.18, 0.14, 0.10, 0.008), mat.anodized, lift, [0, 0, -0.40]);                                              // carriage on the column
  add(box(0.09, 0.07, 0.36, 0.008), mat.aluminum, lift, [0, 0, -0.22]);                                              // arm
  const flipper = new THREE.Group(); lift.add(flipper);
  add(cyl(0.19, 0.19, 0.09, 48), mat.paint, flipper);
  add(cyl(0.10, 0.085, 0.08, 32), mat.anodized, flipper, [0, -0.085, 0]);                                            // motor, on top once the head has turned over
  add(cyl(0.166, 0.166, 0.014, 48), mat.anodized, flipper, [0, 0.05, 0]);                                            // seal ring that carries the current to the wafer's edge
  const spinner = new THREE.Group(); spinner.position.y = 0.059; flipper.add(spinner);
  const film = document.createElement('canvas'); film.width = film.height = 256;
  const filmTexture = new THREE.CanvasTexture(film); filmTexture.colorSpace = THREE.SRGBColorSpace;
  add(cyl(0.15, 0.15, 0.004, 64), [mat.silicon, std(0xffffff, 0.75, 0.3, { map: filmTexture }), mat.silicon], spinner).userData.fixed = true;
  control('head', lift, new THREE.Vector3(CELL.x, HEAD_UP, CELL.z + 0.19), { drag: 'lift', travel: -0.55, value: view => view?.head ?? 0 });
  info('wafer', spinner, new THREE.Vector3(CELL.x, HEAD_UP + 0.062, CELL.z));

  // ----- rectifier and its two cables: plus to the anode, minus to the head -----
  const rectifier = new THREE.Group(); rectifier.position.set(0.44, DECK, -0.30); root.add(rectifier);
  add(box(0.30, 0.26, 0.24, 0.008), mat.graphite, rectifier, [0, 0.13, 0]);
  plate(0.15, 0.04, label(['DC RECTIFIER'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.55 }), rectifier, [0, 0.19, 0.1205]);
  for (const [x, m] of [[-0.07, mat.red], [0.07, mat.rubber]]) facing(small(cyl(0.014, 0.014, 0.02, 12), m, rectifier, [x, 0.08, 0.125]), 'z');
  tube([[-0.07, 0.08, 0.13], [-0.12, 0.03, 0.22], [-0.2, 0.02, 0.32], [CELL.x - 0.44 + 0.34, 0.03, CELL.z + 0.30]], 0.008, mat.red, rectifier, 28).castShadow = false;
  tube([[0.07, 0.08, 0.13], [0.1, 0.02, 0.2], [-0.2, 0.015, 0.02], [CELL.x - 0.44 + 0.07, 0.05, -0.36 + 0.30]], 0.008, mat.rubber, rectifier, 28).castShadow = false;
  info('rectifier', rectifier, new THREE.Vector3(0.44, DECK + 0.262, -0.22));

  // ----- console: screen and two dials -----
  const c = CONSOLE;
  parts.cabinet(c.x, c.front, { w: 0.66 });
  const hmi = parts.screen(c.x, 1.31, c.front);
  const dials = {
    current: parts.dial('current', c.x - 0.16, 0.99, c.front, { min: 0, max: 40, major: 10, minor: 2, unit: 'A', perPixel: 0.1, wheel: 0.5, title: 'DC', readout: v => `${v.toFixed(1)} A` }),
    rotation: parts.dial('rotation', c.x + 0.16, 0.99, c.front, { min: 10, max: 120, major: 10, minor: 5, unit: 'rpm', perPixel: 0.4, wheel: 5, title: 'SPIN' }),
  };
  const tower = parts.tower(c.x + 0.24, 1.50, c.front - 0.30);

  let drawn = '';
  function paintWafer(view) {
    const grown = Math.min(1, view.thickness / 300), key = `${Math.round(grown * 20)}|${view.burnt}|${view.windows}`;
    if (key === drawn) return;
    drawn = key;
    const x = film.getContext('2d'), n = film.width, mix = (a, b) => Math.round(a + (b - a) * grown);
    x.fillStyle = `rgb(${mix(138, 222)},${mix(92, 140)},${mix(64, 88)})`; x.fillRect(0, 0, n, n);           // dull seed film to bright copper
    if (view.windows && grown < 1) { x.fillStyle = `rgba(60,40,30,${0.4 * (1 - grown)})`; const cell = n / 10; for (let i = 0; i < 64; i++) x.fillRect((i % 8 + 1) * cell + 4, (Math.floor(i / 8) + 1) * cell + 4, cell - 8, cell - 8); }   // the windows show until the copper covers them
    if (view.burnt > 0) {                                                                                             // burnt from the edge in: the share of the area is a ring
      const R = n / 2, inner = R * Math.sqrt(Math.max(0, 1 - view.burnt));
      x.save(); x.beginPath(); x.arc(R, R, R, 0, 2 * Math.PI); x.arc(R, R, inner, 0, 2 * Math.PI, true); x.clip('evenodd');
      x.fillStyle = '#4a3226'; x.fillRect(0, 0, n, n); x.fillStyle = 'rgba(20,12,8,.5)'; for (let i = 0; i < 500; i++) x.fillRect((i * 97) % n, (i * 57) % n, 2, 2);
      x.restore();
    }
    filmTexture.needsUpdate = true;
  }
  const smooth = v => v * v * (3 - 2 * v), clamp01 = v => Math.min(1, Math.max(0, v));
  /** `view`: head (0 up .. 1 in the bath), spin (rpm), plating, over, thickness (nm), burnt (share of the wafer, from the edge in), windows, controls { current, rotation }, alarm. */
  function update(view, dt, clock) {
    const turn = Math.PI * smooth(clamp01(view.head / FLIP)), down = clamp01((view.head - FLIP) / (1 - FLIP));
    lift.position.y = HEAD_UP - TRAVEL * down; flipper.rotation.z = turn;
    spinner.rotation.y += dt * Math.min(26, view.spin / 60 * 6.283 * 0.3);                                            // slowed for the eye
    const over = turn > Math.PI / 2;
    kit.partAnchor('head').set(CELL.x, lift.position.y + (over ? 0.085 : 0), CELL.z + (over ? 0.10 : 0.19));          // the motor is the handle once the head has turned
    kit.partAnchor('wafer').set(CELL.x - 0.062 * Math.sin(turn), lift.position.y + 0.062 * Math.cos(turn), CELL.z);
    bubbleMaterial.opacity = view.over ? 0.75 : 0;                                                                    // hydrogen, when the current is more than the bath can carry
    if (view.over) bubbles.forEach((bubble, i) => { const a = i * 2.4, rise = (clock * 0.35 + i * 0.071) % 1; bubble.position.set(Math.cos(a) * (0.17 + 0.05 * ((i * 7) % 3) / 2), 0.20 + 0.07 * rise, Math.sin(a) * (0.17 + 0.05 * ((i * 7) % 3) / 2)); });
    paintWafer(view);
    for (const [name, dial] of Object.entries(dials)) dial.set(view.controls[name]);
    tower.set(view.alarm || view.over ? 2 : view.plating ? 0 : 1, dt, clock);
  }

  return {
    update, screenCanvas: hmi.canvas, refreshScreen: hmi.refresh,
    views: { home: [[1.9, 2.15, 4.2], [0.40, 1.12, 0.05]], cell: [[0.6, 1.75, 2.0], [CELL.x, DECK + 0.38, CELL.z]], panel: [[c.x + 0.2, 1.1, 2.2], [c.x, 0.95, c.front]], screen: [[c.x, 1.33, c.front + 0.85], [c.x, 1.31, c.front]] },
    layout: {
      dials: Object.fromEntries(Object.entries(dials).map(([name, dial]) => [name, dial.at])), hmi: hmi.at,
      grip: { up: [CELL.x, HEAD_UP, CELL.z + 0.19], down: [CELL.x, HEAD_UP - TRAVEL + 0.085, CELL.z + 0.10] },       // where the head can be taken hold of, raised and lowered
    },
  };
}
