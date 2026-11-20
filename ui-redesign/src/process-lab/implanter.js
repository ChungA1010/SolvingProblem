// Ion implanter of the process lab: ion source, analyser magnet, acceleration column, beam scanner and the end station
// where the wafer is tilted into the beam, with an anneal chamber beside it. Proportions only; the label IM-01 is made up.
// Controls: field (the analyser magnet), energy, dose, temperature, minutes (dials) and scan, implant, anneal (push buttons).
// Info parts: source, magnet, column, scanner, chamber, annealer, wafer, hmi, tower.
// State comes from dist/process-lab/implant-model.js.
import { makeParts } from './parts.js';

const DECK = 0.86, BEAM_Y = DECK + 0.30, BEAM_Z = 0.18;        // the beam runs along x at this height and depth
const STATION = 0.52, ANNEAL = 1.08, REST_Y = DECK + 0.15;     // x of the end station and of the anneal chamber; height at which the wafer lies flat
const CONSOLE = { x: 2.14, front: 0.50 };
const TILT = (90 - 7) * Math.PI / 180;                         // the wafer stands 7 degrees off the beam

export function buildImplanter(kit) {
  const { THREE, mat, std, add, small, ghost, cyl, box, facing, plate, label, shade, info } = kit, root = kit.root;
  const parts = makeParts(kit);

  // ----- base -----
  add(box(2.78, DECK - 0.03, 1.18, 0.012), mat.paint, root, [0.02, (DECK - 0.03) / 2, -0.07]);
  add(box(2.80, 0.03, 1.20, 0.006), mat.stainless, root, [0.02, DECK - 0.015, -0.07]);
  add(box(2.80, 0.08, 1.20, 0.006), mat.graphite, root, [0.02, 0.04, -0.07]);
  plate(0.5, 0.07, label(['IM-01', 'ION IMPLANT · ANNEAL'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.85, DECK - 0.2, 0.522]);
  shade(4.7, 2.1, 0.62, 0.0008, -0.05, 0.42);

  // ----- ion source in its high-voltage cabinet, with the gas bottle -----
  const source = new THREE.Group(); source.position.set(-1.08, DECK, -0.36); root.add(source);
  add(box(0.44, 0.60, 0.40, 0.012), mat.paint, source, [0, 0.30, 0]);
  plate(0.2, 0.06, label(['ION SOURCE', 'PH₃'], { bg: '#f1c40f', fg: '#1f2933', size: 0.8 }), source, [0, 0.47, 0.2012]);
  facing(add(cyl(0.08, 0.08, 0.14, 32), mat.stainless, source, [0, 0.30, 0.27]), 'z');                             // source chamber, toward the magnet
  facing(add(cyl(0.10, 0.10, 0.02, 32), mat.satin, source, [0, 0.30, 0.21]), 'z');
  add(cyl(0.045, 0.045, 0.32, 20), std(0x9aa0a8, 0.7, 0.4), source, [0.29, 0.16, 0.05]); small(cyl(0.016, 0.022, 0.05, 12), mat.brass, source, [0.29, 0.345, 0.05]);   // gas bottle
  const beamLamp = ghost(facing(add(cyl(0.013, 0.013, 0.006, 14), new THREE.MeshStandardMaterial({ color: 0x7a2a1c, emissive: 0xff5a36, emissiveIntensity: 0.05, roughness: 0.4 }), source, [-0.15, 0.50, 0.203]), 'z'));
  info('source', source, new THREE.Vector3(-1.08, DECK + 0.585, -0.155));

  // ----- analyser magnet: the beam leaves the source toward the front and is bent 90 degrees into the beamline -----
  const magnet = new THREE.Group(); magnet.position.set(-1.021, BEAM_Y, 0.121); root.add(magnet);
  add(cyl(0.22, 0.22, 0.20, 40), mat.blue, magnet);
  add(cyl(0.222, 0.222, 0.03, 40), mat.anodized, magnet);                                                           // the gap the beam passes through
  for (const y of [-0.12, 0.12]) add(cyl(0.17, 0.17, 0.04, 36), mat.brass, magnet, [0, y, 0]);                      // coils
  add(cyl(0.10, 0.10, 0.02, 28), mat.anodized, magnet, [0, 0.15, 0]);
  plate(0.13, 0.04, label(['MASS ANALYZER'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.5 }), magnet, [0, 0.1612, 0], [-Math.PI / 2, 0, 0]);
  add(cyl(0.07, 0.09, 0.16, 20), mat.graphite, magnet, [0, -0.22, 0]);
  info('magnet', magnet, new THREE.Vector3(-1.021, BEAM_Y + 0.142, 0.261));

  // ----- acceleration column: electrodes between ceramic rings -----
  const column = new THREE.Group(); column.position.set(0, BEAM_Y, BEAM_Z); root.add(column);
  facing(add(cyl(0.04, 0.04, 0.12, 20), mat.stainless, column, [-0.76, 0, 0]), 'x');
  add(box(0.05, 0.14, 0.14, 0.006), mat.anodized, column, [-0.685, 0, 0]);                                           // resolving slit
  for (let i = 0; i < 7; i++) facing(add(cyl(0.125, 0.125, 0.012, 40), mat.satin, column, [-0.64 + i * 0.07, 0, 0]), 'x');
  for (let i = 0; i < 6; i++) facing(add(cyl(0.095, 0.095, 0.058, 32), mat.ceramic, column, [-0.605 + i * 0.07, 0, 0]), 'x');
  for (const x of [-0.64, -0.22]) small(cyl(0.015, 0.015, 0.175, 10), mat.stainless, column, [x, -0.2125, 0]);
  info('column', column, new THREE.Vector3(-0.395, BEAM_Y + 0.067, BEAM_Z + 0.067));                                     // on a ceramic ring, between two electrodes

  // ----- beam scanner on the drift tube -----
  const scanner = new THREE.Group(); scanner.position.set(0.02, BEAM_Y, BEAM_Z); root.add(scanner);
  facing(add(cyl(0.04, 0.04, 0.50, 20), mat.stainless, scanner), 'x');
  add(box(0.20, 0.18, 0.18, 0.01), mat.anodized, scanner);
  plate(0.11, 0.035, label(['BEAM SCAN'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.55 }), scanner, [0, 0.02, 0.0912]);
  small(cyl(0.015, 0.015, 0.21, 10), mat.stainless, scanner, [0, -0.195, 0]);
  info('scanner', scanner, new THREE.Vector3(0.02, BEAM_Y + 0.092, BEAM_Z + 0.06));

  // ----- end station: glass chamber, the platen that lifts and tilts the wafer, the Faraday cup behind it -----
  const chamber = new THREE.Group(); chamber.position.set(STATION, DECK, BEAM_Z); root.add(chamber);
  add(box(0.54, 0.02, 0.54, 0.004), mat.stainless, chamber, [0, 0.01, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) small(cyl(0.012, 0.012, 0.50, 10), mat.satin, chamber, [sx * 0.255, 0.27, sz * 0.255]);
  add(box(0.56, 0.03, 0.56, 0.006), mat.stainless, chamber, [0, 0.535, 0]);
  ghost(add(box(0.50, 0.50, 0.50, 0.004), mat.glass, chamber, [0, 0.27, 0]));
  facing(add(cyl(0.06, 0.06, 0.03, 24), mat.stainless, chamber, [-0.262, 0.30, 0]), 'x');                            // beam port
  add(box(0.03, 0.12, 0.12, 0.004), mat.graphite, chamber, [0.24, 0.30, 0]);                                         // Faraday cup
  add(box(0.024, 0.04, 0.36, 0.004), mat.anodized, chamber, [0.262, 0.15, 0]);                                       // slot valve toward the anneal chamber
  add(cyl(0.05, 0.06, 0.09, 24), mat.anodized, chamber, [0.03, 0.065, 0]);
  const stem = add(cyl(0.014, 0.014, 1, 12), mat.stainless, chamber, [0.03, 0.12, 0]);
  const pivot = new THREE.Group(); pivot.position.set(0, REST_Y - DECK, 0); chamber.add(pivot);
  add(cyl(0.162, 0.162, 0.012, 48), mat.anodized, pivot, [0, -0.009, 0]);                                            // platen
  plate(0.2, 0.045, label(['END STATION'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.55 }), chamber, [0, 0.535, 0.2812]);
  const beamMaterial = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  ghost(facing(add(cyl(0.012, 0.13, 0.225, 24, true), beamMaterial, chamber, [-0.135, 0.30, 0]), 'x'));              // the scanned beam, widening toward the wafer
  const setupMaterial = beamMaterial.clone();
  ghost(facing(add(cyl(0.009, 0.009, 0.48, 12, true), setupMaterial, chamber, [-0.01, 0.30, 0]), 'x'));               // while the beam is set up it runs past the lowered platen into the Faraday cup
  info('chamber', chamber, new THREE.Vector3(STATION, DECK + 0.552, BEAM_Z + 0.2));

  // ----- anneal chamber: the wafer on pins under a bank of lamps -----
  const annealer = new THREE.Group(); annealer.position.set(ANNEAL, DECK, BEAM_Z); root.add(annealer);
  add(cyl(0.22, 0.23, 0.11, 48), mat.stainless, annealer, [0, 0.055, 0]);
  add(cyl(0.17, 0.17, 0.012, 48), mat.graphite, annealer, [0, 0.116, 0]);
  for (let i = 0; i < 3; i++) small(cyl(0.005, 0.005, 0.03, 8), mat.ceramic, annealer, [Math.cos(i * 2.094 + 0.5) * 0.10, 0.133, Math.sin(i * 2.094 + 0.5) * 0.10]);
  ghost(add(new THREE.CylinderGeometry(0.20, 0.20, 0.15, 48, 1, true, 1.5 * Math.PI + 0.87, 2 * Math.PI - 1.74), mat.glass, annealer, [0, 0.185, 0]));   // quartz wall, open toward the end station
  add(box(0.46, 0.09, 0.46, 0.01), mat.paint, annealer, [0, 0.31, 0]);
  add(box(0.07, 0.30, 0.05, 0.006), mat.graphite, annealer, [0, 0.15, -0.245]);
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3c, emissive: 0xff8a1a, emissiveIntensity: 0, roughness: 0.5 });
  for (let i = 0; i < 5; i++) ghost(facing(add(cyl(0.011, 0.011, 0.38, 12), lampMaterial, annealer, [-0.16 + i * 0.08, 0.258, 0]), 'z'));
  plate(0.16, 0.045, label(['ANNEAL'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.55 }), annealer, [0, 0.31, 0.2312]);
  const heatLight = new THREE.PointLight(0xff8a3a, 0, 1.6, 1.8); heatLight.position.set(ANNEAL, DECK + 0.21, BEAM_Z + 0.12); root.add(heatLight);
  info('annealer', annealer, new THREE.Vector3(ANNEAL, DECK + 0.357, BEAM_Z + 0.15));

  // ----- wafer -----
  const film = document.createElement('canvas'); film.width = film.height = 256;
  const filmTexture = new THREE.CanvasTexture(film); filmTexture.colorSpace = THREE.SRGBColorSpace;
  const holder = new THREE.Group(); holder.position.set(STATION, REST_Y, BEAM_Z); root.add(holder);
  add(cyl(0.15, 0.15, 0.004, 64), [mat.silicon, std(0xffffff, 0.3, 0.25, { map: filmTexture }), mat.silicon], holder).userData.fixed = true;
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  ghost(add(cyl(0.151, 0.151, 0.002, 48), glowMaterial, holder, [0, 0.0035, 0]));
  info('wafer', holder, new THREE.Vector3(STATION, REST_Y + 0.02, BEAM_Z));

  // ----- console: screen, the implant dials and button on the left, the anneal dials and button on the right -----
  const c = CONSOLE;
  parts.cabinet(c.x, c.front, { w: 1.08 });
  const hmi = parts.screen(c.x, 1.31, c.front);
  const doseText = v => `${(10 ** (v - Math.floor(v + 1e-9))).toFixed(1)}E${Math.floor(v + 1e-9)}`;
  const dials = {
    field: parts.dial('field', c.x - 0.42, 0.99, c.front, { min: 0.05, max: 0.60, major: 0.1, minor: 0.01, unit: 'T', perPixel: 0.0005, wheel: 0.0005, title: 'MAGNET', tick: v => v.toFixed(1), readout: v => `${v.toFixed(3)} T` }),
    energy: parts.dial('energy', c.x - 0.21, 0.99, c.front, { min: 20, max: 200, major: 20, minor: 5, unit: 'keV', perPixel: 0.5, wheel: 5, title: 'E' }),
    dose: parts.dial('dose', c.x, 0.99, c.front, { min: 13, max: 16, major: 1, minor: 0.1, unit: 'cm⁻²', perPixel: 0.01, wheel: 0.1, title: 'DOSE', tick: v => `1E${Math.round(v)}`, readout: doseText }),
    temperature: parts.dial('temperature', c.x + 0.21, 0.99, c.front, { min: 800, max: 1100, major: 100, minor: 10, unit: '°C', perPixel: 1, wheel: 10, title: 'TEMP' }),
    minutes: parts.dial('minutes', c.x + 0.42, 0.99, c.front, { min: 1, max: 60, major: 10, minor: 1, unit: 'min', perPixel: 0.2, wheel: 1, title: 'TIME' }),
  };
  const buttons = { scan: parts.button('scan', 'MASS SCAN', c.x - 0.38, 0.70, c.front, 0xa78bfa), implant: parts.button('implant', 'IMPLANT', c.x - 0.12, 0.70, c.front, 0x38bdf8), anneal: parts.button('anneal', 'ANNEAL', c.x + 0.31, 0.70, c.front, 0xf59e0b) };
  const tower = parts.tower(c.x + 0.44, 1.50, c.front - 0.30);

  let drawn = '', lift = 0, heat = 25;
  const heatColor = new THREE.Color();
  function paintWafer(view) {
    const key = `${view.filmColor.join(',')}|${view.windows}`;
    if (key === drawn) return;
    drawn = key;
    const x = film.getContext('2d'), n = film.width, [r, g, b] = view.filmColor;
    x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, n, n);
    if (view.windows) { x.fillStyle = 'rgba(150,160,176,.85)'; const cell = n / 10; for (let i = 0; i < 64; i++) x.fillRect((i % 8 + 1) * cell + 4, (Math.floor(i / 8) + 1) * cell + 4, cell - 8, cell - 8); }   // fields of windows
    filmTexture.needsUpdate = true;
  }
  /** `view`: phase, beam, scanning, setup (beam current on the Faraday cup while it is set up, as a share of 1 mA), hot (C), controls { field, energy, dose, temperature, minutes }, filmColor, windows, alarm. */
  function update(view, dt, clock) {
    const away = view.phase === 'annealing' || view.phase === 'done';
    lift += ((view.phase === 'implanting' ? 1 : 0) - lift) * Math.min(1, dt * 3.5);                                   // 0: flat on the platen, 1: lifted and tilted into the beam
    const k = lift * lift * (3 - 2 * lift), raised = (BEAM_Y - REST_Y) * k;
    const goal = away && lift < 0.06 ? ANNEAL : STATION;                                                              // the wafer leaves only once the platen is down
    holder.position.x += (goal - holder.position.x) * Math.min(1, dt * 3);
    const here = Math.abs(holder.position.x - STATION) < 0.02;
    pivot.position.y = REST_Y - DECK + raised; pivot.rotation.z = TILT * k;
    holder.position.y = REST_Y + (here ? raised : 0); holder.rotation.z = here ? TILT * k : 0;
    const top = REST_Y - DECK + raised - 0.015; stem.scale.y = Math.max(0.005, top - 0.11); stem.position.y = (top + 0.11) / 2;
    kit.partAnchor('wafer').set(holder.position.x, holder.position.y + 0.02, BEAM_Z);
    const beam = view.beam && lift > 0.8 ? 0.26 + 0.07 * Math.sin(clock * 31) : 0;
    beamMaterial.opacity += (beam - beamMaterial.opacity) * Math.min(1, dt * 10); beamLamp.material.emissiveIntensity = view.beam || view.setup > 0.02 ? 1.6 : 0.05;
    const setup = !view.beam && lift < 0.2 ? 0.45 * Math.min(1, view.setup || 0) : 0;
    setupMaterial.opacity += (setup - setupMaterial.opacity) * Math.min(1, dt * 12);
    heat += (view.hot - heat) * Math.min(1, dt * 1.6);
    const strength = parts.heat(heat, heatColor);
    lampMaterial.emissive.copy(heatColor); lampMaterial.emissiveIntensity = strength * 2.2; heatLight.intensity = strength * 2.0;
    glowMaterial.opacity = Math.abs(holder.position.x - ANNEAL) < 0.03 ? strength * 0.7 : 0;
    paintWafer(view);
    for (const [name, dial] of Object.entries(dials)) dial.set(view.controls[name]);
    buttons.scan.set(view.phase === 'ready' && !view.scanning, dt, false); buttons.implant.set(view.phase === 'ready' && !view.scanning, dt, false); buttons.anneal.set(view.phase === 'implanted' || view.phase === 'done', dt, false);
    tower.set(view.alarm ? 2 : view.phase === 'implanting' || view.phase === 'annealing' ? 0 : 1, dt, clock);
  }

  return {
    update, screenCanvas: hmi.canvas, refreshScreen: hmi.refresh,
    views: {
      home: [[1.5, 2.6, 6.4], [0.62, 1.0, 0.05]], beamline: [[-0.75, 2.0, 2.5], [-0.62, DECK + 0.28, 0]], chamber: [[0.95, 1.65, 2.15], [0.8, DECK + 0.25, BEAM_Z]],
      panel: [[c.x + 0.25, 1.15, 2.6], [c.x, 0.98, c.front]], screen: [[c.x, 1.33, c.front + 0.85], [c.x, 1.31, c.front]],
    },
    layout: { dials: Object.fromEntries(Object.entries(dials).map(([name, dial]) => [name, dial.at])), buttons: Object.fromEntries(Object.entries(buttons).map(([name, button]) => [name, button.at])), hmi: hmi.at },
  };
}
