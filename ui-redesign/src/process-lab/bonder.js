// Wire bonder of the process lab: a heated stage that holds the lead frame, the bond head with its ultrasonic horn and
// capillary, the spool of gold wire, and a pull tester. The label WB-01 is made up. The equipment is in proportion; the
// chip, its pads and the wires are drawn many times larger than they are, so that they can be seen.
// Controls: power, force, time (dials) and bond, pull, run (push buttons).
// Info parts: head, spool, stage, chip, puller, hmi, tower. State comes from dist/process-lab/bond-model.js.
import { makeParts } from './parts.js';

const DECK = 0.86, WORK = { x: -0.12, z: 0.12 }, TOP = DECK + 0.073;      // the work point; top of the lead frame
const PITCH = 0.20;                                                        // from one chip to the next on the lead frame
const PADS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];                         // the four pads of a chip: side in x, side in z
const HOME = 0.06;                                                         // height of the capillary above the lead frame when idle
const CONSOLE = { x: 1.22, front: 0.50 };

export function buildBonder(kit) {
  const { THREE, mat, std, add, small, ghost, cyl, box, facing, tube, plate, label, shade, info } = kit, root = kit.root;
  const parts = makeParts(kit);
  const gold = std(0xd4a017, 1, 0.3), copper = std(0xb87333, 1, 0.42), dark = std(0x3a4252, 0.6, 0.3);
  const pad = k => [PADS[k][0] * 0.024, 0.0108, PADS[k][1] * 0.024], lead = k => [PADS[k][0] * 0.060, 0.002, PADS[k][1] * 0.024];   // from the centre of a chip site, above the lead frame

  // ----- base -----
  add(box(1.36, DECK - 0.03, 1.04, 0.012), mat.paint, root, [0, (DECK - 0.03) / 2, 0]);
  add(box(1.38, 0.03, 1.06, 0.006), mat.stainless, root, [0, DECK - 0.015, 0]);
  add(box(1.38, 0.08, 1.06, 0.006), mat.graphite, root, [0, 0.04, 0]);
  plate(0.5, 0.07, label(['WB-01', 'WIRE BONDER'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.3, DECK - 0.2, 0.522]);
  shade(2.7, 1.9, 0.38, 0.0008, 0, 0.42);

  // ----- heated stage with the clamps that hold the lead frame -----
  const stageGroup = new THREE.Group(); stageGroup.position.set(WORK.x, DECK, WORK.z); root.add(stageGroup);
  add(box(0.62, 0.07, 0.30, 0.006), mat.anodized, stageGroup, [0, 0.035, 0]);
  for (const sz of [-0.10, 0.10]) add(box(1.02, 0.014, 0.022, 0.003), mat.satin, stageGroup, [0, 0.084, sz]);
  plate(0.13, 0.035, label(['HEATER 150°C'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.5 }), stageGroup, [-0.2, 0.035, 0.1505]);
  info('stage', stageGroup, new THREE.Vector3(WORK.x + 0.02, DECK + 0.04, WORK.z + 0.151));

  // ----- lead frame: a strip of chip sites, each with a chip, four pads and four leads -----
  const strip = new THREE.Group(); strip.position.set(WORK.x, TOP, WORK.z); root.add(strip);
  add(box(1.04, 0.003, 0.17, 0.001), copper, strip, [0, -0.0015, 0]);
  for (let i = -2; i <= 2; i++) {
    const site = new THREE.Group(); site.position.x = i * PITCH; strip.add(site);
    add(box(0.07, 0.008, 0.07, 0.001), dark, site, [0, 0.006, 0]);
    for (let k = 0; k < 4; k++) { small(box(0.009, 0.001, 0.009, 0.0003), copper, site, [pad(k)[0], 0.0104, pad(k)[2]]); small(box(0.035, 0.002, 0.014, 0.0005), mat.aluminum, site, [PADS[k][0] * 0.072, 0.001, PADS[k][1] * 0.024]); }
  }
  info('chip', strip, new THREE.Vector3(WORK.x + PITCH, TOP + 0.011, WORK.z));
  const wires = PADS.map((_, k) => {                                        // the four wires of the chip under the tool
    const [px, py, pz] = pad(k), [lx, ly, lz] = lead(k), sx = PADS[k][0];
    const wire = ghost(tube([[px, py, pz], [px + sx * 0.003, py + 0.011, pz], [px + sx * 0.02, py + 0.012, pz], [lx, ly, lz]], 0.0009, gold, root, 20));
    wire.position.set(WORK.x, TOP, WORK.z); wire.visible = false;
    const ball = ghost(add(cyl(0.0035, 0.0035, 0.0018, 14), gold, root, [WORK.x + px, TOP + py, WORK.z + pz])); ball.visible = false;
    return { wire, ball };
  });

  // ----- bond head: body on its table, ultrasonic horn, capillary, wire clamp, camera; the spool rides on it -----
  add(box(0.36, 0.10, 0.26, 0.008), mat.paint, root, [WORK.x, DECK + 0.05, WORK.z - 0.36]);
  const head = new THREE.Group(); head.position.set(WORK.x, TOP + HOME, WORK.z); root.add(head);          // its origin is the tip of the capillary
  add(cyl(0.006, 0.0012, 0.045, 12), mat.ceramic, head, [0, 0.0225, 0]);
  facing(add(cyl(0.010, 0.022, 0.26, 20), mat.stainless, head, [0, 0.045, -0.13]), 'z');                  // horn
  add(box(0.16, 0.16, 0.14, 0.01), mat.anodized, head, [0, 0.075, -0.33]);
  small(box(0.022, 0.012, 0.022, 0.002), mat.satin, head, [0, 0.085, 0]);
  add(box(0.05, 0.07, 0.05, 0.004), mat.graphite, head, [0.075, 0.125, -0.28]); small(cyl(0.014, 0.017, 0.03, 14), mat.stainless, head, [0.075, 0.075, -0.28]);   // camera
  add(box(0.02, 0.10, 0.02, 0.003), mat.satin, head, [0, 0.20, -0.32]);
  ghost(tube([[0, 0.24, -0.285], [0, 0.17, -0.10], [0, 0.092, 0], [0, 0.045, 0]], 0.0009, gold, head, 20));
  info('head', head, new THREE.Vector3(WORK.x, TOP + HOME + 0.10, WORK.z - 0.259));
  const spool = new THREE.Group(); spool.position.set(0, 0.24, -0.30); head.add(spool);
  facing(add(cyl(0.045, 0.045, 0.03, 32), gold, spool), 'z'); facing(small(cyl(0.05, 0.05, 0.004, 32), mat.aluminum, spool, [0, 0, 0.017]), 'z'); facing(small(cyl(0.05, 0.05, 0.004, 32), mat.aluminum, spool, [0, 0, -0.017]), 'z');
  info('spool', spool, new THREE.Vector3(WORK.x, TOP + HOME + 0.24, WORK.z - 0.28));

  // ----- pull tester: a gauge on a post and the rod with the hook that goes under a wire -----
  const puller = new THREE.Group(); puller.position.set(WORK.x + 0.46, DECK, WORK.z + 0.05); root.add(puller);
  add(cyl(0.02, 0.026, 0.14, 20), mat.stainless, puller, [0, 0.07, 0]);
  add(box(0.08, 0.06, 0.10, 0.006), mat.graphite, puller, [0, 0.17, 0]);
  plate(0.06, 0.03, label(['PULL'], { bg: '#f3f4f6', fg: '#1f2933', size: 0.6 }), puller, [0, 0.17, 0.0505]);
  info('puller', puller, new THREE.Vector3(WORK.x + 0.46, DECK + 0.202, WORK.z + 0.07));
  const hook = new THREE.Group(); root.add(hook);                           // its origin is the hook's tip
  small(box(0.46, 0.008, 0.008, 0.002), mat.satin, hook, [0.235, 0.03, 0]);
  ghost(tube([[0.005, 0.03, 0], [0.005, 0.004, 0], [0, 0, 0], [-0.004, 0.003, 0]], 0.0008, mat.stainless, hook, 10));
  const REST = [WORK.x + 0.13, TOP + 0.085, WORK.z + 0.05];

  // ----- console: screen, three dials, three buttons -----
  const c = CONSOLE;
  parts.cabinet(c.x, c.front, { w: 0.84 });
  const hmi = parts.screen(c.x, 1.31, c.front);
  const dials = {
    power: parts.dial('power', c.x - 0.27, 0.99, c.front, { min: 0, max: 200, major: 50, minor: 10, unit: 'mW', perPixel: 0.5, wheel: 5, title: 'US' }),
    force: parts.dial('force', c.x, 0.99, c.front, { min: 10, max: 80, major: 10, minor: 2, unit: 'gf', perPixel: 0.2, wheel: 1, title: 'FORCE' }),
    time: parts.dial('time', c.x + 0.27, 0.99, c.front, { min: 5, max: 50, major: 5, minor: 1, unit: 'ms', perPixel: 0.15, wheel: 1, title: 'TIME' }),
  };
  const buttons = {
    bond: parts.button('bond', 'BOND', c.x - 0.27, 0.70, c.front, 0x38bdf8), pull: parts.button('pull', 'PULL', c.x, 0.70, c.front, 0xf59e0b), run: parts.button('run', 'RUN', c.x + 0.27, 0.70, c.front, 0x22c55e),
  };
  const tower = parts.tower(c.x + 0.32, 1.50, c.front - 0.30);

  const smooth = v => v * v * (3 - 2 * v), mix = (a, b, k) => a + (b - a) * k, tip = new THREE.Vector3(), goal = new THREE.Vector3();
  /** Where the capillary's tip is (relative to the work point on the lead frame) `p` of the way through wire `k`. */
  function path(k, p, into) {
    const [px, py, pz] = pad(k), [lx, ly, lz] = lead(k);
    if (p < 0.12) return into.set(px, mix(HOME, py, smooth(p / 0.12)), pz);
    if (p < 0.32) return into.set(px, py, pz);
    if (p < 0.62) { const u = smooth((p - 0.32) / 0.30); return into.set(mix(px, lx, u), mix(py, ly, u) + 0.022 * Math.sin(Math.PI * u), mix(pz, lz, u)); }
    if (p < 0.82) return into.set(lx, ly, lz);
    return into.set(lx, mix(ly, HOME, smooth((p - 0.82) / 0.18)), lz);
  }
  /** `view`: phase, wire (index of the wire being made, or -1), progress (0..1 through it), done (wires finished on this chip), pulled (indices of the wires that were pulled off),
   *  pulling (0..1 through a pull test, or 0), hookAt (wire under the hook), shift (0..1 of the step to the next chip), controls { power, force, time }, alarm. */
  function update(view, dt, clock) {
    if (view.wire >= 0) path(view.wire, view.progress, goal); else goal.set(0, HOME, 0);
    const bonding = view.wire >= 0 && ((view.progress > 0.12 && view.progress < 0.32) || (view.progress > 0.62 && view.progress < 0.82));
    tip.lerp(goal, Math.min(1, dt * 18));
    head.position.set(WORK.x + tip.x + (bonding ? 0.0006 * Math.sin(clock * 180) : 0), TOP + tip.y, WORK.z + tip.z);     // the ultrasonic scrub, far slower and larger than it is
    kit.partAnchor('head').set(head.position.x, head.position.y + 0.10, head.position.z - 0.259);
    kit.partAnchor('spool').set(head.position.x, head.position.y + 0.24, head.position.z - 0.28);
    strip.position.x = WORK.x - PITCH * smooth(view.shift);
    wires.forEach((w, k) => {
      const made = k < view.done || (k === view.wire && view.progress > 0.62), there = made && !view.pulled.includes(k) && view.shift === 0;
      w.wire.visible = there; w.ball.visible = (there || (k === view.wire && view.progress > 0.2) || (made && view.pulled.includes(k))) && view.shift === 0;
    });
    if (view.pulling > 0 && view.hookAt >= 0) {
      const [px, py, pz] = pad(view.hookAt), [lx, , lz] = lead(view.hookAt), reach = smooth(Math.min(1, view.pulling / 0.4)), up = Math.max(0, (view.pulling - 0.4) / 0.6);
      hook.position.set(mix(REST[0], WORK.x + (px + lx) / 2, reach), mix(REST[1], TOP + py + 0.006 + 0.03 * up, reach), mix(REST[2], WORK.z + (pz + lz) / 2, reach));
    } else hook.position.set(REST[0], REST[1], REST[2]);
    for (const [name, dial] of Object.entries(dials)) dial.set(view.controls[name]);
    const idle = view.phase === 'setup';
    buttons.bond.set(idle, dt, false); buttons.pull.set(idle && view.canPull, dt, false); buttons.run.set(idle, dt, false);
    tower.set(view.alarm ? 2 : view.phase === 'running' || view.phase === 'bonding' ? 0 : 1, dt, clock);
  }

  return {
    update, screenCanvas: hmi.canvas, refreshScreen: hmi.refresh,
    views: {
      home: [[1.95, 2.15, 4.2], [0.42, 1.12, 0.05]], work: [[0.42, 1.30, 1.05], [WORK.x + 0.02, TOP + 0.03, WORK.z]],
      panel: [[c.x + 0.2, 1.1, 2.3], [c.x, 0.95, c.front]], screen: [[c.x, 1.33, c.front + 0.85], [c.x, 1.31, c.front]],
    },
    layout: { dials: Object.fromEntries(Object.entries(dials).map(([name, dial]) => [name, dial.at])), buttons: Object.fromEntries(Object.entries(buttons).map(([name, button]) => [name, button.at])), hmi: hmi.at },
  };
}
