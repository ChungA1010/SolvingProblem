/* Wire bonding for the process lab: how well a gold wire sticks for an ultrasonic power, a force and a time, what a
 * pull test reads on it, and a bonder that wires the good chips in real time. No DOM: loaded by the page and by
 * tests/process-lab-bond.test.cjs.
 *
 * What is computed and what is assumed
 *   Pull test: a hook lifts the wire at the middle of its span until something gives. For a loop of height h over a
 *     span d the tension in the wire is F / (2 sin a), sin a = h / sqrt(h^2 + (d/2)^2): statics, exact for a symmetric
 *     loop. What gives is the weakest of three: the ball on the pad, the wire just above the ball (its heat-affected
 *     neck), the stitch on the lead.
 *   Minimum pull strength: 3.0 gf for 25 um (1 mil) gold wire, the figure quoted from MIL-STD-883 method 2011.
 *   Everything about how the bond forms is a representative response, not a measured one: the bond grows with the
 *     ultrasonic energy (power x time) and saturates; the force has a best value, below which the tool slips and above
 *     which the vibration is damped; too much power and force crack the pad (cratering); the ball spreads with force
 *     and energy and must stay on the 60 um pad. The directions are the ones bonding handbooks describe; the numbers
 *     (and the wire's breaking load of 10 gf) are assumed.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabBond = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const constants = {
    wire: { diameter: 25, breaking: 10, neck: 0.8, overwork: [120, 80, 0.3] },   // um; gf; share of the breaking load left just above the ball; above 120 mW the neck loses up to 30% over the next 80 mW
    ball: { free: 45, force: 0.2, energy: 3.5 },                                 // um of free-air ball; um wider per gf; um wider per mJ
    pad: 60,                                                                     // um
    loop: { height: 200, span: 1000 },                                           // um
    bond: { lift: 14, stitch: 11, energy: 0.6, force: [30, 18], stitchForce: [40, 22], cratered: 2.5 },   // gf of a full bond; mJ per e-fold; best force and width (gf) for ball and stitch; gf a cratered pad holds
    crater: { power: 150, force: 60, limit: 1.6 },                               // (P / power)^2 + (F / force)^2 above the limit cracks the pad
    spread: { strength: 0.07, ball: 1.5, crater: 0.05 },                         // from wire to wire: share, um, share (one sigma)
    spec: { pull: 3.0 },                                                         // gf
    dials: { power: { min: 0, max: 200, step: 5 }, force: { min: 10, max: 80, step: 1 }, time: { min: 5, max: 50, step: 1 } },   // mW, gf, ms
    wires: 4,                                                                    // per chip
    times: { teach: 2.4, pull: 1.6, wire: 0.25, index: 0.6 },                    // s: one wire bonded slowly for a test, a pull test, one wire in the run, stepping to the next chip
    temperature: 150,                                                            // C of the heater block (fixed)
  };
  const K = constants, clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Ultrasonic energy (mJ) of a bond: power (mW) times time (ms). */
  const energy = (power, time) => power * time / 1000;
  /** How much of the vibration reaches the interface at a force (gf): 1 at the best force, less on either side. */
  const coupling = (force, [best, width]) => Math.exp(-(((force - best) / width) ** 2));
  /** Pull force (gf) per gf of tension in the wire, for a hook at the middle of the loop. */
  function pullFactor(loop = K.loop) { return 2 * loop.height / Math.hypot(loop.height, loop.span / 2); }

  /** The wire that the settings make, without the wire-to-wire scatter. */
  function bonded({ power, force, time }) {
    const E = energy(power, time), [from, over, loss] = K.wire.overwork;
    return {
      power, force, time, energy: E,
      ball: K.bond.lift * (1 - Math.exp(-E * coupling(force, K.bond.force) / K.bond.energy)),            // gf the ball holds
      stitch: K.bond.stitch * (1 - Math.exp(-E * coupling(force, K.bond.stitchForce) / K.bond.energy)),  // gf the stitch holds
      neck: K.wire.breaking * K.wire.neck * (1 - loss * clamp((power - from) / over, 0, 1)),             // gf the wire holds above the ball
      diameter: K.ball.free + K.ball.force * force + K.ball.energy * E,                                  // um of bonded ball
      crater: (power / K.crater.power) ** 2 + (force / K.crater.force) ** 2,
    };
  }
  /** What a pull test reads on a wire: the force at which it gives (gf) and where (lift, neck, stitch or crater). */
  function pullTest(wire) {
    const cratered = wire.crater > K.crater.limit;
    const parts = [[cratered ? Math.min(wire.ball, K.bond.cratered) : wire.ball, cratered ? 'crater' : 'lift'], [wire.neck, 'neck'], [wire.stitch, 'stitch']];
    const [tension, mode] = parts.reduce((weakest, part) => part[0] < weakest[0] ? part : weakest);
    return { force: tension * pullFactor(), mode };
  }
  /** Whether a wire is good: strong enough, pad whole, ball on the pad. `reason` names the first fault. */
  function judge(wire) {
    const pull = pullTest(wire), reason = wire.crater > K.crater.limit ? 'crater' : wire.diameter > K.pad ? 'wide' : Number(pull.force.toFixed(1)) < K.spec.pull ? pull.mode : null;   // the force as it is printed, to a tenth of a gf
    return { ok: !reason, reason, pull };
  }

  /** A wire bonder handling the good chips of one wafer. `chips` is how many there are. Times are seconds. */
  function create(options = {}) {
    let seed = (Math.imul(Math.floor(options.seed) || 1, 22695477) >>> 0) || 1;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296, normal = () => (random() + random() + random() - 1.5) * 2;
    const total = Math.max(0, Math.floor(options.chips ?? 0));
    const state = {
      time: 0, controls: { power: 30, force: 20, time: 10 },
      phase: 'setup',                          // setup, bonding (one test wire), pulling, running, done
      progress: 0,                             // 0..1 through the wire being bonded or pulled
      wire: null,                              // the last test wire: what bonded() gives, with `pulled` once it has been tested
      onChip: 0,                               // test wires on the dummy chip under the tool (it is changed after the fourth)
      tests: [],                               // pull tests so far: { n, force, mode, ok, reason, at: the settings the wire was made with }
      at: 0, wireAt: 0, passed: 0, faults: {}, // the run: chip being wired, wire on it, chips finished good, chips lost by fault
      chipOk: true, used: null, result: null,
    };
    const snap = (value, { min, max, step }) => Math.round(clamp(Math.round(Number(value) / step) * step, min, max) * 100) / 100;
    /** One wire as the bonder makes it now: the settings' wire with its scatter. */
    function make(settings) {
      const w = bonded(settings), s = K.spread;
      w.ball *= 1 + s.strength * normal(); w.stitch *= 1 + s.strength * normal(); w.neck *= 1 + s.strength * 0.5 * normal();
      w.diameter += s.ball * normal(); w.crater *= 1 + s.crater * normal();
      return w;
    }
    /** Dials: power, force, time. Buttons: bond (one test wire), pull (test it), run (wire every good chip). Returns false when it cannot be done now. */
    function setControl(name, value) {
      if (K.dials[name]) { state.controls[name] = snap(value, K.dials[name]); return true; }
      if (state.phase !== 'setup') return false;
      if (name === 'bond') { state.phase = 'bonding'; state.progress = 0; if (state.onChip >= K.wires) state.onChip = 0; state.pending = make({ ...state.controls }); return true; }
      if (name === 'pull') { if (!state.wire || state.wire.pulled) return false; state.phase = 'pulling'; state.progress = 0; return true; }
      if (name === 'run') { state.phase = 'running'; state.progress = 0; state.at = 0; state.wireAt = 0; state.chipOk = true; state.used = { ...state.controls }; state.wire = null; state.onChip = 0; if (!total) finish(); return true; }
      return false;
    }
    function finish() { state.phase = 'done'; state.result = { chips: state.passed, bonded: total, lost: total - state.passed, faults: { ...state.faults }, ...state.used }; }
    function step(dt) {
      if (!(dt > 0)) return;
      state.time += dt;
      if (state.phase === 'bonding') {
        state.progress = Math.min(1, state.progress + dt / K.times.teach);
        if (state.progress >= 1) { state.wire = state.pending; state.pending = null; state.wire.pulled = null; state.onChip += 1; state.phase = 'setup'; }
      } else if (state.phase === 'pulling') {
        state.progress = Math.min(1, state.progress + dt / K.times.pull);
        if (state.progress >= 1) { const verdict = judge(state.wire); state.wire.pulled = verdict.pull; state.tests.push({ n: state.tests.length + 1, force: verdict.pull.force, mode: verdict.pull.mode, ok: verdict.ok, reason: verdict.reason, at: { power: state.wire.power, force: state.wire.force, time: state.wire.time } }); state.phase = 'setup'; }
      } else if (state.phase === 'running') {
        let left = dt;
        while (left > 0 && state.phase === 'running') {
          const need = (state.wireAt < K.wires ? K.times.wire : K.times.index) * (1 - state.progress), used = Math.min(left, need);
          state.progress += used / (state.wireAt < K.wires ? K.times.wire : K.times.index); left -= used;
          if (state.progress < 1 - 1e-9) break;
          state.progress = 0;
          if (state.wireAt < K.wires) { const verdict = judge(make(state.used)); if (!verdict.ok && state.chipOk) { state.chipOk = false; state.faults[verdict.reason] = (state.faults[verdict.reason] || 0) + 1; } state.wireAt += 1; }
          else { if (state.chipOk) state.passed += 1; state.at += 1; state.wireAt = 0; state.chipOk = true; if (state.at >= total) finish(); }
        }
      }
    }
    return { state, constants, total, setControl, step, outlook: () => bonded(state.controls) };
  }

  return { constants, energy, coupling, pullFactor, bonded, pullTest, judge, create };
});
