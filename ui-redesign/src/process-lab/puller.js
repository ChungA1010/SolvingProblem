// Czochralski crystal puller of the process lab, drawn cut open at the front: the crucible of molten silicon in its
// heater, the pull chamber above it, the seed on its rod and the crystal that grows from it, at their real proportions.
// The label CZ-01 is made up.
// Controls: seed (pulled down into the melt and up out of it; the crystal hangs from it), power (the heater), speed, dopant (dials), auto (push button).
// Info parts: crucible, heater, gauge, hmi, tower. State comes from dist/process-lab/crystal-model.js.
import { makeParts } from './parts.js';

const BASE = 0.40, MELT = 1.02;                        // top of the base frame; height of the melt's surface
const HOT = { radius: 0.58, top: 1.30 }, TUBE = { radius: 0.27, top: 3.05 };   // the chamber around the crucible, and the pull chamber above it
const SEED_UP = 0.55;                                  // how far above the melt the seed waits
const OPEN = 0.95;                                     // half the angle of the cut at the front (rad)
const CONSOLE = { x: 1.45, front: 0.50 };

export function buildPuller(kit) {
  const { THREE, mat, std, add, small, ghost, cyl, box, plate, label, shade, control, info } = kit, root = kit.root;
  const parts = makeParts(kit);
  const shell = (radius, height, cut = OPEN, segments = 56) => new THREE.CylinderGeometry(radius, radius, height, segments, 1, true, cut, 2 * Math.PI - 2 * cut);   // open toward the viewer
  const steel = std(0xd4d8dd, 1, 0.5, { side: THREE.DoubleSide }), graphite = std(0x2d3138, 0.3, 0.7, { side: THREE.DoubleSide });

  // ----- frame and the two chambers -----
  add(box(1.5, BASE, 1.3, 0.012), mat.paint, root, [0, BASE / 2, 0]);
  add(box(1.52, 0.08, 1.32, 0.006), mat.graphite, root, [0, 0.04, 0]);
  plate(0.5, 0.07, label(['CZ-01', 'CRYSTAL PULLER'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.35, BASE - 0.14, 0.652]);
  shade(3.6, 2.2, 0.55, 0.0008, 0, 0.42);
  add(cyl(0.60, 0.60, 0.04, 56), mat.stainless, root, [0, BASE + 0.02, 0]);
  add(shell(HOT.radius, HOT.top - BASE), steel, root, [0, (HOT.top + BASE) / 2, 0]);
  const lid = add(new THREE.RingGeometry(TUBE.radius, HOT.radius + 0.02, 56, 1, 1.5 * Math.PI + OPEN, 2 * Math.PI - 2 * OPEN), steel, root, [0, HOT.top, 0]); lid.rotation.x = -Math.PI / 2;
  add(shell(TUBE.radius, TUBE.top - HOT.top), steel, root, [0, (TUBE.top + HOT.top) / 2, 0]);
  add(cyl(0.30, 0.30, 0.05, 40), mat.stainless, root, [0, TUBE.top + 0.025, 0]);
  add(box(0.30, 0.22, 0.26, 0.01), mat.paint, root, [0, TUBE.top + 0.16, 0]);
  plate(0.16, 0.04, label(['SEED LIFT'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.55 }), root, [0, TUBE.top + 0.16, 0.1305]);

  // ----- heater around the crucible -----
  const heater = new THREE.Group(); root.add(heater);
  const heaterMaterial = new THREE.MeshStandardMaterial({ color: 0x6a2a12, emissive: 0xff5a1a, emissiveIntensity: 0.85, roughness: 0.6, side: THREE.DoubleSide });
  add(shell(0.47, 0.52, 0.6), heaterMaterial, heater, [0, BASE + 0.36, 0]).userData.fixed = true;
  add(shell(0.52, 0.56, 0.6), graphite, heater, [0, BASE + 0.36, 0]);                                              // insulation behind it
  info('heater', heater, new THREE.Vector3(0.52 * Math.sin(0.78), BASE + 0.40, 0.52 * Math.cos(0.78)));

  // ----- crucible with the melt -----
  const crucible = new THREE.Group(); root.add(crucible);
  add(cyl(0.06, 0.06, 0.14, 20), mat.stainless, crucible, [0, BASE + 0.11, 0]);
  add(cyl(0.42, 0.36, MELT - 0.005 - (BASE + 0.18), 56), graphite, crucible, [0, (MELT - 0.005 + BASE + 0.18) / 2, 0]);
  add(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 56, 1, true), graphite, crucible, [0, MELT + 0.03, 0]);
  small(new THREE.CylinderGeometry(0.408, 0.408, 0.068, 56, 1, true), std(0xf4f6f8, 0, 0.35, { side: THREE.DoubleSide }), crucible, [0, MELT + 0.03, 0]);   // quartz liner
  const melt = add(cyl(0.406, 0.406, 0.01, 56), new THREE.MeshStandardMaterial({ color: 0xff9a3a, emissive: 0xff6a12, emissiveIntensity: 1.5, roughness: 0.25 }), crucible, [0, MELT - 0.005, 0]);
  melt.userData.fixed = true; melt.castShadow = false;
  const glow = new THREE.PointLight(0xff7a2a, 2.2, 3.2, 1.6); glow.position.set(0, MELT + 0.25, 0.2); root.add(glow);
  info('crucible', crucible, new THREE.Vector3(0.12, MELT + 0.001, 0.30));
  const ring = ghost(add(new THREE.TorusGeometry(1, 0.05, 8, 48), new THREE.MeshBasicMaterial({ color: 0xfff1c2 }), root, [0, MELT + 0.002, 0])); ring.rotation.x = Math.PI / 2; ring.visible = false;   // bright meniscus where the crystal meets the melt

  // ----- camera that measures the diameter -----
  const gauge = new THREE.Group(); gauge.position.set(0.46, HOT.top, 0.22); root.add(gauge);
  add(box(0.08, 0.08, 0.14, 0.006), mat.anodized, gauge, [0, 0.07, 0]); small(cyl(0.022, 0.026, 0.05, 14), mat.stainless, gauge, [-0.03, 0.04, -0.06]);
  add(box(0.05, 0.03, 0.05, 0.004), mat.satin, gauge, [0, 0.015, 0]);
  info('gauge', gauge, new THREE.Vector3(0.46, HOT.top + 0.112, 0.24));

  // ----- seed on its rod, and the crystal that hangs from it -----
  const lift = new THREE.Group(); lift.position.set(0, MELT + SEED_UP, 0); root.add(lift);                     // its origin is the tip of the seed
  add(cyl(0.006, 0.006, 0.08, 10), mat.silicon, lift, [0, 0.04, 0]);
  add(cyl(0.03, 0.03, 0.10, 20), mat.anodized, lift, [0, 0.13, 0]);
  add(cyl(0.09, 0.09, 0.30, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), lift, [0, 0.13, 0]).castShadow = false;   // something to take hold of
  const rod = add(cyl(0.008, 0.008, 1, 10), mat.stainless, root, [0, 2, 0]);
  const crystal = add(new THREE.LatheGeometry([new THREE.Vector2(0.006, 0), new THREE.Vector2(0.006, -0.001)], 8), std(0x9aa3b2, 0.85, 0.28, { side: THREE.DoubleSide }), lift); crystal.visible = false;
  control('seed', lift, new THREE.Vector3(0, MELT + SEED_UP + 0.13, 0.09), { drag: 'lift', travel: -0.5, value: view => view?.controls?.seed ?? 0 });

  // ----- console: screen, the heater, pull and boron dials, the button of the diameter controller -----
  const c = CONSOLE;
  parts.cabinet(c.x, c.front, { w: 0.86 });
  const hmi = parts.screen(c.x, 1.31, c.front);
  const dials = {
    power: parts.dial('power', c.x - 0.26, 0.99, c.front, { min: 90, max: 140, major: 10, minor: 2, unit: 'kW', perPixel: 0.1, wheel: 0.5, title: 'HEATER', tick: v => String(Math.round(v)), readout: v => `${v.toFixed(1)} kW` }),
    speed: parts.dial('speed', c.x, 0.99, c.front, { min: 0, max: 14, major: 2, minor: 0.5, unit: 'mm/min', perPixel: 0.03, wheel: 0.1, title: 'PULL', tick: v => String(Math.round(v)), readout: v => v.toFixed(2) }),
    dopant: parts.dial('dopant', c.x + 0.26, 0.99, c.front, { min: 0, max: 10, major: 2, minor: 0.5, unit: 'mg', perPixel: 0.02, wheel: 0.1, title: 'BORON', tick: v => String(Math.round(v)), readout: v => `${v.toFixed(1)} mg` }),
  };
  const auto = parts.button('auto', 'AUTO DIA', c.x, 0.70, c.front, 0x22c55e);
  const tower = parts.tower(c.x + 0.24, 1.50, c.front - 0.30);

  let drawn = '';
  /** `view`: seed (0 up .. 1 in the melt), hanging (a crystal is on the seed), growing, length (mm), radius (mm), profile [{ z, r }], stamp, superheat (K), controls { seed, power, speed, dopant, auto }, alarm. */
  function update(view, dt, clock) {
    heaterMaterial.emissiveIntensity = Math.max(0.3, 0.6 + 0.02 * (view.superheat ?? 5));                                 // the heater glows brighter as it is turned up
    const tip = MELT + (1 - view.seed) * SEED_UP + (view.hanging ? view.length / 1000 : 0);
    lift.position.y = tip; rod.scale.y = Math.max(0.01, TUBE.top - (tip + 0.18)); rod.position.y = (TUBE.top + tip + 0.18) / 2;
    kit.partAnchor('seed').set(0, tip + 0.13, 0.09);
    if (view.stamp !== drawn) {
      drawn = view.stamp;
      const points = view.hanging && view.profile.length > 1 ? view.profile.map(p => new THREE.Vector2(p.r / 1000, -p.z / 1000)) : null;
      crystal.visible = Boolean(points);
      if (points) { points.push(new THREE.Vector2(0.0005, -view.length / 1000)); crystal.geometry.dispose(); crystal.geometry = new THREE.LatheGeometry(points, 40); }
    }
    ring.visible = view.growing; if (view.growing) ring.scale.set(view.radius / 1000 + 0.004, view.radius / 1000 + 0.004, 0.12);
    glow.intensity = 2.0 + 0.25 * Math.sin(clock * 1.7);
    for (const [name, dial] of Object.entries(dials)) dial.set(view.controls[name]);
    auto.set(view.controls.auto, dt, false);
    tower.set(view.alarm ? 2 : view.growing ? 0 : 1, dt, clock);
  }

  return {
    update, screenCanvas: hmi.canvas, refreshScreen: hmi.refresh,
    views: { home: [[3.4, 2.3, 6.9], [0.55, 1.6, 0]], melt: [[1.15, 1.95, 2.3], [0, MELT + 0.12, 0]], panel: [[c.x + 0.2, 1.1, 2.3], [c.x, 0.95, c.front]], screen: [[c.x, 1.33, c.front + 0.85], [c.x, 1.31, c.front]] },
    layout: { dials: Object.fromEntries(Object.entries(dials).map(([name, dial]) => [name, dial.at])), buttons: { auto: auto.at }, hmi: hmi.at, melt: MELT, seedUp: SEED_UP },
  };
}
