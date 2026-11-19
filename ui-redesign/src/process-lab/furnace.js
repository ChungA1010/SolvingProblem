// Vertical oxidation furnace of the process lab, drawn cut open at the front so the boat and the heater can be seen.
// Proportions of a 300 mm vertical furnace; it is not a drawing of a real tool, and the label VF-01 is made up.
// Parts: boat (lifted into the tube), setpoint (temperature dial), n2 / o2 / h2o (quarter-turn gas valves) are controls;
// tube, heater, hmi, tower and exhaust only show their card. State comes from dist/process-lab/oxidation-model.js.
import { makeParts } from './parts.js';

const DECK = 1.30, TRAVEL = 1.06, FLANGE_DOWN = 0.30;         // top of the loading area, travel of the boat elevator, flange height when lowered
const W = 1.10, D = 1.20, TOP = 2.72;                         // footprint and height of the frame
const CONSOLE = { x: 0.80, front: 0.54 };

export function buildFurnace(kit) {
  const { THREE, mat, std, add, small, ghost, cyl, cube, box, tube, plate, label, shade, control, info } = kit, root = kit.root;
  const parts = makeParts(kit), glowColor = new THREE.Color();

  // ----- frame: plinth, posts, panels, the deck between the loading area and the heater -----
  add(box(W + 0.04, 0.12, D + 0.04, 0.01), mat.graphite, root, [0, 0.06, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.06, TOP - 0.12, 0.06, 0.006), mat.paint, root, [sx * (W / 2 - 0.03), (TOP + 0.12) / 2, sz * (D / 2 - 0.03)]);
  add(box(W - 0.12, TOP - 0.12, 0.02, 0.004), mat.paint, root, [0, (TOP + 0.12) / 2, -D / 2 + 0.02]);
  add(box(0.02, TOP - 0.12, D - 0.12, 0.004), mat.paint, root, [-W / 2 + 0.02, (TOP + 0.12) / 2, 0]);
  ghost(add(cube(0.008, TOP - 0.12, D - 0.12), mat.glass, root, [W / 2 - 0.02, (TOP + 0.12) / 2, 0]));               // viewing window on the right
  add(box(W + 0.04, 0.08, D + 0.04, 0.01), mat.paint, root, [0, TOP + 0.04, 0]);
  add(box(W, 0.14, 0.04, 0.006), mat.paint, root, [0, TOP - 0.07, D / 2 - 0.02]);
  add(box(W, 0.07, 0.04, 0.006), mat.paint, root, [0, DECK + 0.005, D / 2 - 0.02]);
  plate(0.52, 0.075, label(['VF-01', 'VERTICAL FURNACE · OXIDATION'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.24, TOP - 0.07, D / 2 + 0.001]);
  const deckShape = new THREE.Shape();
  deckShape.moveTo(-W / 2 + 0.06, -D / 2 + 0.06); deckShape.lineTo(W / 2 - 0.06, -D / 2 + 0.06); deckShape.lineTo(W / 2 - 0.06, D / 2 - 0.06); deckShape.lineTo(-W / 2 + 0.06, D / 2 - 0.06); deckShape.closePath();
  const opening = new THREE.Path(); opening.absarc(0, 0, 0.285, 0, Math.PI * 2, true); deckShape.holes.push(opening);
  const deck = add(new THREE.ExtrudeGeometry(deckShape, { depth: 0.04, bevelEnabled: false, curveSegments: 48 }), mat.stainless);
  deck.rotation.x = -Math.PI / 2; deck.position.y = DECK - 0.04;
  shade(W + 1.5, D + 0.9, 0.2, 0.0008, 0, 0.42);

  // ----- heater: insulation shell (back half), coil rings, the quartz process tube inside -----
  const heater = new THREE.Group(); root.add(heater);
  add(new THREE.CylinderGeometry(0.40, 0.40, 1.22, 48, 1, true, Math.PI / 2, Math.PI), std(0xefece4, 0, 0.92, { side: THREE.DoubleSide }), heater, [0, DECK + 0.63, 0]);
  for (const sx of [-1, 1]) add(cube(0.03, 1.22, 0.02), mat.stainless, heater, [sx * 0.405, DECK + 0.63, 0]);
  add(cyl(0.42, 0.42, 0.04), mat.stainless, heater, [0, DECK + 1.26, 0]);
  const coilMaterial = std(0x5a544c, 0.4, 0.6, { emissive: 0xff5a14, emissiveIntensity: 0 });
  const coils = new THREE.InstancedMesh(new THREE.TorusGeometry(0.30, 0.011, 10, 72), coilMaterial, 21), m4 = new THREE.Matrix4(), flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  for (let i = 0; i < 21; i++) { m4.compose(new THREE.Vector3(0, DECK + 0.12 + i * 0.045, 0), flat, new THREE.Vector3(1, 1, 1)); coils.setMatrixAt(i, m4); }
  ghost(coils); root.add(coils);                                                                                    // the boat is picked through the coils
  info('heater', heater, new THREE.Vector3(-0.30, DECK + 0.9, 0.05));

  const quartz = std(0xe9f1f6, 0, 0.08, { transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  ghost(add(cyl(0.215, 0.215, 0.94, 48, true), quartz, root, [0, DECK + 0.51, 0]));                                  // wall of the tube: see-through to the pointer too
  const tubeTop = new THREE.Group(); root.add(tubeTop);
  add(new THREE.SphereGeometry(0.215, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), std(0xe9f1f6, 0, 0.08, { transparent: true, opacity: 0.32, depthWrite: false }), tubeTop, [0, DECK + 0.98, 0]).castShadow = false;
  small(new THREE.TorusGeometry(0.222, 0.012, 10, 64), mat.quartz, tubeTop, [0, DECK + 0.035, 0]).rotation.x = Math.PI / 2;
  small(cyl(0.03, 0.03, 0.06, 20), mat.quartz, tubeTop, [0, DECK + 1.215, 0]);
  info('tube', tubeTop, new THREE.Vector3(0, DECK + 1.1, 0.16));
  const inner = ghost(add(cyl(0.205, 0.205, 0.93, 40, true), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }), root, [0, DECK + 0.51, 0]));
  const ember = new THREE.PointLight(0xff8a3a, 0, 3.2, 1.6); ember.position.set(0, DECK + 0.6, 0.2); root.add(ember);

  // ----- boat on its elevator: flange that closes the tube, heat barrier, quartz boat with 25 wafers -----
  const lift = new THREE.Group(); lift.position.y = FLANGE_DOWN; root.add(lift);
  add(cyl(0.27, 0.27, 0.03, 56), mat.stainless, lift, [0, -0.015, 0]);
  small(new THREE.TorusGeometry(0.236, 0.006, 8, 56), mat.rubber, lift, [0, 0.003, 0]).rotation.x = Math.PI / 2;
  add(cyl(0.16, 0.17, 0.16, 40), mat.ceramic, lift, [0, 0.08, 0]);
  for (const y of [0.045, 0.085, 0.125]) small(cyl(0.176, 0.176, 0.005, 40), mat.quartz, lift, [0, y, 0]);
  for (const y of [0.172, 0.885]) small(cyl(0.168, 0.168, 0.012, 48), mat.quartz, lift, [0, y, 0]);
  for (const deg of [-90, -155, -25]) { const a = deg * Math.PI / 180; small(cyl(0.008, 0.008, 0.70, 12), mat.quartz, lift, [Math.cos(a) * 0.16, 0.53, Math.sin(a) * 0.16]); }
  const waferMaterial = std(0x8d97a6, 0.55, 0.28, { emissive: 0xff5a14, emissiveIntensity: 0 });
  const wafers = new THREE.InstancedMesh(cyl(0.150, 0.150, 0.0026, 64), waferMaterial, 25);
  for (let i = 0; i < 25; i++) { m4.makeTranslation(0, 0.20 + i * 0.026, 0); wafers.setMatrixAt(i, m4); }
  wafers.castShadow = true; wafers.userData.fixed = true; lift.add(wafers);                                          // its colour follows the oxide, not the hover
  // The stack is mostly gaps between thin wafers. An unseen cylinder around it gives the pointer something to hold.
  const grip = add(cyl(0.156, 0.156, 0.66, 32), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), lift, [0, 0.512, 0]);
  grip.castShadow = grip.receiveShadow = false; grip.userData.fixed = true;
  add(box(0.09, 0.05, 0.46, 0.006), mat.anodized, lift, [0, -0.055, -0.25]);                                         // carriage arm
  add(box(0.18, 0.13, 0.07, 0.008), mat.anodized, lift, [0, -0.055, -0.455]);
  add(box(0.12, DECK - 0.16, 0.07, 0.006), mat.aluminum, root, [0, (DECK + 0.08) / 2, -0.505]);                       // elevator column and lead screw
  small(cyl(0.012, 0.012, DECK - 0.2, 12), mat.stainless, root, [0.10, (DECK + 0.12) / 2, -0.50]);
  control('boat', lift, new THREE.Vector3(0, FLANGE_DOWN + 0.5, 0.16), { drag: 'lift', travel: TRAVEL, value: view => view?.boat ?? 0 });

  // ----- operator console: screen, temperature dial, three gas valves; gas line to the injector -----
  const c = CONSOLE;
  parts.cabinet(c.x, c.front);
  const hmi = parts.screen(c.x, 1.30, c.front);
  const setpoint = parts.dial('setpoint', c.x, 1.03, c.front, { min: 600, max: 1200, major: 200, minor: 50, unit: '°C', perPixel: 1.5, wheel: 5 });
  const valves = { n2: parts.valve('n2', 'N₂', c.x, 0.80, c.front, mat.anodized), o2: parts.valve('o2', 'O₂', c.x, 0.64, c.front, mat.blue), h2o: parts.valve('h2o', 'H₂O', c.x, 0.48, c.front, mat.red) };
  tube([[c.x - 0.08, 1.50, 0.20], [c.x - 0.08, 1.60, 0.20], [0.50, 1.60, 0.10], [0.30, DECK + 0.07, 0.03]], 0.009, mat.stainless, root, 32).castShadow = false;

  // ----- signal tower and exhaust on the roof -----
  const tower = parts.tower(-0.42, TOP + 0.08, 0.45);
  const exhaust = new THREE.Group(); exhaust.position.set(0, TOP + 0.08, -0.22); root.add(exhaust);
  add(cyl(0.075, 0.075, 0.30, 32), mat.stainless, exhaust, [0, 0.15, 0]); add(cyl(0.095, 0.095, 0.016, 32), mat.satin, exhaust, [0, 0.30, 0]); add(cyl(0.095, 0.095, 0.016, 32), mat.satin, exhaust, [0, 0.008, 0]);
  info('exhaust', exhaust, new THREE.Vector3(0, TOP + 0.3, -0.22));

  const silicon = new THREE.Color(0x8d97a6), film = new THREE.Color();
  let coilLevel = 0;
  /** `view`: boat (0..1), tube and wafer temperature (C), controls { setpoint, n2, o2, h2o }, growing, filmColor [r, g, b], filmStrength, alarm. */
  function update(view, dt, clock) {
    lift.position.y = FLANGE_DOWN + TRAVEL * view.boat;
    kit.partAnchor('boat').set(0, lift.position.y + 0.5, 0.16);
    const level = parts.heat(view.tube, glowColor);
    coilLevel += (level - coilLevel) * Math.min(1, dt * 6);
    coilMaterial.emissive.copy(glowColor); coilMaterial.emissiveIntensity = coilLevel * 2.4;
    inner.material.opacity = coilLevel * 0.28; ember.intensity = coilLevel * 2.2; if (level > 0) { inner.material.color.copy(glowColor); ember.color.copy(glowColor); }
    const glow = parts.heat(view.wafer, glowColor);                                    // hot wafers glow; the film colour shows once they have cooled
    waferMaterial.emissive.copy(glowColor); waferMaterial.emissiveIntensity = glow * 1.6;
    film.setRGB(view.filmColor[0] / 255, view.filmColor[1] / 255, view.filmColor[2] / 255, THREE.SRGBColorSpace);
    waferMaterial.color.copy(silicon).lerp(film, view.filmStrength);
    setpoint.set(view.controls.setpoint);
    for (const [name, valve] of Object.entries(valves)) valve.set(view.controls[name], dt);
    tower.set(view.alarm ? 2 : view.growing ? 0 : 1, dt, clock);
  }

  return {
    update, screenCanvas: hmi.canvas, refreshScreen: hmi.refresh,
    views: { home: [[3.0, 1.95, 5.0], [0.22, 1.36, 0.05]], boat: [[1.55, 1.05, 2.9], [0, 0.78, 0]], tube: [[1.75, 2.25, 3.0], [0, 1.9, 0]], panel: [[1.2, 1.0, 2.3], [c.x, 0.9, c.front]], screen: [[c.x, 1.32, c.front + 0.85], [c.x, 1.30, c.front]] },
    layout: {
      deck: DECK, travel: TRAVEL, flangeDown: FLANGE_DOWN, boatGrip: [0, 0.52, 0.15],     // boatGrip is measured from the flange: add the flange height
      dial: setpoint.at, hmi: hmi.at, valves: Object.fromEntries(Object.entries(valves).map(([name, valve]) => [name, valve.at])),
    },
  };
}
