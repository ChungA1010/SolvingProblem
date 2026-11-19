/* Wafer test (EDS) for the process lab: what each chip of the test wafer measures at the prober, how the probes' contact
 * changes what is measured, and a prober that steps through the wafer in real time. No DOM: loaded by the page and by
 * tests/process-lab-eds.test.cjs.
 *
 * The chip is a diode: an n+ region in the p-type wafer, reached through the window by the copper. The tester runs three
 * tests in turn and stops at the first that fails: the resistance of the contact path, the reverse leakage at 5 V, the
 * forward voltage at 1 mA.
 *
 * Where the numbers come from
 *   Forward voltage: V = (kT/q) ln(I / Is + 1) + I R with Is = q A ni^2 Dn / (Ln Na), the ideal diode whose n+ side is
 *     heavily doped. Leakage: generation in the depletion region, q ni W A / (2 tau) with
 *     W = sqrt(2 eps (Vbi + V) / (q Na)). These are the textbook expressions; ni = 1e10 per cm3, the mobilities, the
 *     lifetime of 10 us and the junction area of 1e-3 cm2 per chip are representative values.
 *   Contact: the specific contact resistivity falls steeply with the doping at the surface, ln(rho_c) going with
 *     1 / sqrt(N) (tunnelling through the barrier). The curve is pinned at 1e-6 ohm cm2 for 1e20 per cm3 and 1e-4 for
 *     1e19, the order of magnitude textbook charts show, over a contact area of 1e-5 cm2 per chip. Representative.
 *   Assumed outright: the leak of a junction left very shallow under the window or made in a dislocated crystal, the resistance of the copper path, the
 *     few per cent by which doping, window width and dishing change toward the wafer's edge, the leak of a chip with a
 *     killer defect, the probes (resistance against overdrive, 15 um of room on the pad), the test limits and the times.
 *   Which chips carry a killer defect comes from the flow model (Poisson yield model).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabEds = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const Q = 1.602176634e-19, KT = 0.025852;                              // C; kT/q in V at 300 K
  const constants = {
    ni: 1e10, mobility: { electron: 1400, hole: 470 }, lifetime: 1e-5,   // per cm3, cm2/Vs, s
    permittivity: 11.7 * 8.854e-14,                                      // F/cm
    junctionArea: 1e-3, contactArea: 1e-5,                               // cm2 per chip, for the standard window and junction
    contact: { high: [1e20, 1e-6], low: [1e19, 1e-4] },                  // [doping per cm3, specific contact resistivity in ohm cm2]: two points of the curve
    metal: { resistance: 0.2, burnt: 5 },                                // ohm of the copper path at full height; times this for burnt copper
    spike: { depth: 120, scale: 15 },                                    // nm: a junction left shallower than this under the window floor leaks
    dislocated: 1e4,                                                     // times the leakage in a crystal grown without a neck
    defect: [-7, 3],                                                     // a chip with a killer defect leaks 10^(a + b u) A, u uniform in 0..1
    short: 1e-3,                                                         // A between chips that are joined (junction or copper all over)
    probe: { floor: 0.3, open: 200, scale: 8, tolerance: 15, pad: 60 },  // ohm, ohm, um of overdrive per e-fold, um off centre that is still on the pad, um of pad
    test: { reverse: 5, forward: 1e-3 },                                 // V, A
    limits: { resistance: 10, leakage: 1e-9, voltage: [0.55, 0.75] },    // ohm, A, V
    spread: { surface: [0.03, 0.02], width: [0.04, 0.01], dishing: 0.6 },   // share lost (or gained) at the edge, and random share (one sigma)
    dials: { x: { min: -60, max: 60, step: 1 }, y: { min: -60, max: 60, step: 1 }, z: { min: 0, max: 100, step: 5 } },   // um
    times: { index: 0.3, test: 0.6, touch: 1.5 },                        // s to step to a chip, to test it, to hold a contact check
    radius: 150,                                                         // mm
  };
  const K = constants, clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Specific contact resistivity (ohm cm2) of the metal on n-type silicon doped `N` per cm3 at the surface. */
  function contactResistivity(N) {
    if (!(N > 0)) return Infinity;
    const [n1, r1] = K.contact.high, [n2, r2] = K.contact.low, slope = Math.log(r2 / r1) / (1 / Math.sqrt(n2) - 1 / Math.sqrt(n1));
    return r1 * Math.exp(Math.min(700, slope * (1 / Math.sqrt(N) - 1 / Math.sqrt(n1))));
  }
  /** Acceptors per cm3 of a p-type wafer of the given resistivity (ohm cm). */
  const acceptors = resistivity => 1 / (Q * K.mobility.hole * resistivity);
  /** Saturation current (A) of the n+/p diode of `area` cm2 on a substrate of `Na` per cm3. */
  function saturationCurrent(Na, area = K.junctionArea) {
    const D = K.mobility.electron * KT, L = Math.sqrt(D * K.lifetime);
    return Q * area * K.ni * K.ni * D / (L * Na);
  }
  /** Width (cm) of the depletion region at a reverse bias, with the n+ side at `Nd` per cm3. */
  function depletionWidth(Na, volts, Nd = 1e19) {
    const builtIn = KT * Math.log(Na * Nd / (K.ni * K.ni));
    return Math.sqrt(2 * K.permittivity * (builtIn + volts) / (Q * Na));
  }
  /** Reverse current (A) generated in the depletion region. */
  const leakage = (Na, area = K.junctionArea, volts = K.test.reverse) => Q * K.ni * depletionWidth(Na, volts) * area / (2 * K.lifetime);
  /** Voltage (V) across the diode and the resistance in series with it at a forward current. */
  const forwardVoltage = (current, Is, resistance = 0) => KT * Math.log(current / Is + 1) + current * resistance;
  /** Resistance (ohm) of the needles on the pads at an overdrive in um. */
  const probeResistance = overdrive => overdrive > 0 ? K.probe.floor + K.probe.open * Math.exp(-overdrive / K.probe.scale) : Infinity;

  /** What the tester finds on a chip through probes of the given state: stops at the first test that fails. */
  function evaluate(truth, probe) {
    if (!probe.touching || truth.open) return { good: false, bin: 'contact', resistance: Infinity, leak: null, voltage: null };
    const resistance = truth.resistance + probe.resistance;
    if (!(resistance <= K.limits.resistance)) return { good: false, bin: 'contact', resistance, leak: null, voltage: null };
    if (truth.leak > K.limits.leakage) return { good: false, bin: 'leak', resistance, leak: truth.leak, voltage: null };
    const voltage = truth.voltage + K.test.forward * probe.resistance, [low, high] = K.limits.voltage;
    return { good: voltage >= low && voltage <= high, bin: voltage >= low && voltage <= high ? 'good' : 'voltage', resistance, leak: truth.leak, voltage };
  }

  /**
   * The electrical truth of every chip of a wafer from the flow model: `dies` are the chip centres (mm), `killed` says
   * which carry a killer defect. The same seed gives the same wafer.
   */
  function truths({ wafer, dies, killed = [], seed = 1 }) {
    let s = (Math.imul(Math.floor(seed) || 1, 40503) >>> 0) || 1;
    const random = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296, normal = () => (random() + random() + random() - 1.5) * 2;
    const win = wafer.window, j = wafer.junction, m = wafer.metal, Na = acceptors(wafer.substrate ? wafer.substrate.resistivity : 10);
    const path = Boolean(win && win.open && win.width > 0 && m && j), joined = Boolean((j && j.everywhere) || (m && m.over > 0));
    return dies.map((die, i) => {
      const r2 = (Math.hypot(die.x, die.y) / K.radius) ** 2, a = normal(), b = normal(), u = random();
      if (!path) return { open: true, good: false };
      const width = win.width * (1 - K.spread.width[0] * r2 + K.spread.width[1] * a), surface = j.surface * (1 - K.spread.surface[0] * r2 + K.spread.surface[1] * b);
      const depth = win.depth + win.siliconLoss, left = depth - Math.min(depth, (m.dishing || 0) * (1 + K.spread.dishing * r2));
      const copper = left > 0 ? K.metal.resistance * depth / left * (m.burnt ? K.metal.burnt : 1) : Infinity;
      const resistance = contactResistivity(surface) / (K.contactArea * width / 1000) + copper;
      const area = K.junctionArea * (width + 1.4 * j.depth) / (1000 + 1.4 * 300);            // the junction spreads sideways by 0.7 of its depth on each side
      const spike = 1 + Math.exp(Math.min(50, (K.spike.depth - (j.depth - win.siliconLoss)) / K.spike.scale));
      const leak = leakage(Na, area) * spike * (wafer.substrate && wafer.substrate.dislocated ? K.dislocated : 1) + (killed[i] ? Math.pow(10, K.defect[0] + K.defect[1] * u) : 0) + (joined ? K.short : 0);
      const truth = { open: false, resistance, leak, voltage: forwardVoltage(K.test.forward, saturationCurrent(Na, area), resistance), defect: Boolean(killed[i]) };
      truth.good = evaluate(truth, { touching: true, resistance: K.probe.floor }).good;
      return truth;
    });
  }

  /** A wafer prober with its tester, handling one wafer. Times are seconds. */
  function create(options = {}) {
    const dies = options.dies || [], truth = truths({ wafer: options.wafer || {}, dies, killed: options.killed, seed: options.seed });
    let s = (Math.imul(Math.floor(options.seed) || 1, 69069) >>> 0) || 1;
    const random = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 4; i++) random();
    const away = () => (random() < 0.5 ? -1 : 1) * Math.round(22 + 18 * random());           // 22 to 40 um off, either way
    const rows = [...new Set(dies.map(die => die.y))].sort((p, q) => q - p);                 // the order the chuck steps in: row by row, turning at the ends
    const order = rows.flatMap((y, row) => dies.map((die, i) => ({ die, i })).filter(e => e.die.y === y).sort((p, q) => (row % 2 ? q.die.x - p.die.x : p.die.x - q.die.x)).map(e => e.i));
    const state = {
      time: 0, controls: { x: 0, y: 0, z: 20 },   // um: chuck offsets and overdrive
      offset: { x: away(), y: away() },           // where the needles sit from the pad centres with the dials at zero
      phase: 'setup',                             // setup, probing, done
      index: order.length ? order[0] : -1, down: false, touch: 0,     // chip under the needles; needles on the pads; s left of a contact check
      results: dies.map(() => null), tested: 0, good: 0, passes: 0, queue: [], elapsed: 0,
      contact: null,                              // last contact check: { touching, resistance }
      history: [], result: null,
    };
    const snap = (value, { min, max, step }) => Math.round(clamp(Math.round(Number(value) / step) * step, min, max) * 100) / 100;
    const error = () => ({ x: state.offset.x + state.controls.x, y: state.offset.y + state.controls.y });
    function probe() {
      const e = error(), touching = Math.abs(e.x) <= K.probe.tolerance && Math.abs(e.y) <= K.probe.tolerance && state.controls.z > 0;
      return { touching, resistance: touching ? probeResistance(state.controls.z) : Infinity };
    }
    function count() {
      const bins = { contact: 0, leak: 0, voltage: 0 }; let tested = 0, good = 0, missed = 0;
      state.results.forEach((r, i) => { if (!r) return; tested++; if (r.good) good++; else { bins[r.bin]++; if (truth[i].good) missed++; } });
      return { total: dies.length, tested, good, bins, missed };
    }
    /** Dials: x, y, z (um). Buttons: contact (touch down on the chip under the needles and read the resistance), probe (test every chip not yet good). */
    function setControl(name, value) {
      if (K.dials[name]) { state.controls[name] = snap(value, K.dials[name]); return true; }
      if (state.phase === 'probing') return false;
      if (name === 'contact') { state.contact = probe(); state.touch = K.times.touch; return true; }
      if (name === 'probe') {
        const queue = order.filter(i => !state.results[i] || !state.results[i].good);
        if (!queue.length) return false;
        state.queue = queue; state.phase = 'probing'; state.passes += 1; state.elapsed = 0; state.index = queue[0]; state.result = null;
        return true;
      }
      return false;
    }
    function step(dt) {
      if (!(dt > 0)) return;
      state.time += dt; state.touch = Math.max(0, state.touch - dt);
      if (state.phase !== 'probing') { state.down = state.touch > 0; return; }
      const each = K.times.index + K.times.test;
      state.elapsed += dt;
      while (state.elapsed >= each && state.queue.length) {
        const i = state.queue.shift(); state.results[i] = { ...evaluate(truth[i], probe()), pass: state.passes }; state.elapsed -= each;
        const c = count(); state.tested = c.tested; state.good = c.good; state.history.push({ n: state.history.length + 1, yield: c.good / c.tested * 100 });
      }
      if (state.queue.length) { state.index = state.queue[0]; state.down = state.elapsed > K.times.index; }
      else { state.phase = 'done'; state.down = false; state.result = { ...count(), dies: state.results.slice(), passes: state.passes, overdrive: state.controls.z }; }
    }
    return { state, constants, dies, order, truth, error, probe, count, setControl, step };
  }

  return { constants, contactResistivity, acceptors, saturationCurrent, depletionWidth, leakage, forwardVoltage, probeResistance, evaluate, truths, create };
});
