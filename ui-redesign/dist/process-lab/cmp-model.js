/* Copper polish for the process lab: the plated wafer on the polisher of the CMP learning lab.
 *
 * The removal itself is the CMP lab's own process model (../lab-3d/process-model.js): Preston's pressure and speed
 * terms, slurry on the pad, pad glazing and conditioning, heating, the edge effect, the carrier's zone balance, the
 * wedge of a wafer that does not turn, scratches on a dry pad. Nothing of that is repeated here. This file adds what a
 * patterned copper wafer needs on top of it: what lies under the copper, where the copper has cleared, how far the
 * copper left in the windows is dished, and the measurement afterwards. No DOM: loaded by the page and by
 * tests/process-lab-cmp.test.cjs.
 *
 * What is assumed (representative ratios; real ones depend on the slurry)
 *   Copper is polished twice as fast as the oxide the CMP lab's model is set for: 500 nm/min at its reference condition.
 *   Where the copper over the oxide has cleared, the polish goes on on the barrier film at a fifth of the copper rate,
 *   then on the oxide at a hundredth, and the copper in the windows is dished by a quarter of what the copper rate would
 *   have removed. A window the plating did not fill stays short by what was missing.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../lab-3d/process-model.js'));
  else root.ProcessLabCmp = factory(root.Lab3DProcess);
})(typeof self !== 'undefined' ? self : this, function (P) {
  'use strict';

  const C = P.constants, N = C.nodes;
  const constants = {
    copper: 2,                    // times the rate of the CMP lab's oxide polish
    barrier: 0.2, oxide: 0.01,    // rate on the barrier film and on the oxide, as a share of the copper rate
    dishing: 0.25,                // nm of dishing per nm the copper rate would have removed after the field has cleared
    cleared: 1,                   // nm of copper under which a place counts as clear
    measure: 1.4,                 // s the thickness scan takes
    spec: { dishing: 50 },        // nm of dishing still taken as flat; no copper left and no scratch
    under: 4000,                  // nm kept under the copper inside the CMP lab's model, so that its film never runs out
  };
  const K = constants, clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const weights = Float64Array.from({ length: N }, (_, i) => { const d = 1 / (N - 1), lo = Math.max(0, i * d - d / 2), hi = Math.min(1, i * d + d / 2); return hi * hi - lo * lo; });   // share of the wafer's area at each radius
  const areaMean = values => { let sum = 0; for (let i = 0; i < N; i++) sum += weights[i] * values[i]; return sum; };

  /** What is left at a place after `removed` nm of copper-rate polishing: copper over the oxide, barrier, oxide lost, dishing in the windows. */
  function stackAt(removed, plated, depth, liner) {
    const extra = Math.max(0, removed - plated);                                   // polishing after the copper over the oxide was gone
    return {
      copper: Math.max(0, plated - removed), liner: Math.max(0, liner - extra * K.barrier), erosion: Math.max(0, extra - liner / K.barrier) * K.oxide,
      dishing: Math.min(depth, Math.max(0, depth - plated) + extra * K.dishing),
    };
  }

  /**
   * A polisher with the plated wafer on its load position. `wafer`: { thickness (nm of copper over the oxide), depth (nm
   * from the oxide's top to the window floor), liner (nm of barrier film) }. Controls, alarms and the polishing state are
   * the CMP lab model's own (`state`); `stack` is what this file keeps beside it. Times are seconds.
   */
  function create(options = {}) {
    const incoming = { thickness: 800, depth: 505, liner: 30, ...(options.wafer || {}) };
    const model = P.create({ seed: options.seed ?? 1, level: K.copper }), state = model.state, w = model.newWafer();
    for (let i = 0; i < N; i++) w.film[i] = w.start[i] = incoming.thickness + K.under;
    w.incoming = { mean: incoming.thickness, edgeMinusCentre: 0 };
    const stack = {
      copper: new Float64Array(N).fill(incoming.thickness), dishing: new Float64Array(N), liner: new Float64Array(N).fill(incoming.liner), erosion: new Float64Array(N),
      covered: 1, mean: incoming.thickness, centre: incoming.thickness, edge: incoming.thickness,     // share of the wafer still under copper; copper left: mean, at the centre, at the edge
      measuring: 0, history: [], result: null,
    };
    let sampled = -1;
    const removedAt = i => w.start[i] - w.film[i];
    /** The stack at a place of the wafer (r in m, angle in rad). A wafer that did not turn is polished more on one side. */
    function at(r, theta = 0) {
      const x = clamp(r / C.waferRadius, 0, 1) * (N - 1), i = Math.min(N - 2, Math.floor(x)), f = x - i;
      const removed = removedAt(i) + f * (removedAt(i + 1) - removedAt(i)) + w.tilt * (r / C.waferRadius) * Math.cos(theta - w.tiltAngle);
      return stackAt(removed, incoming.thickness, incoming.depth, incoming.liner);
    }
    function refresh() {
      let covered = 0;
      for (let i = 0; i < N; i++) {
        const s = stackAt(removedAt(i), incoming.thickness, incoming.depth, incoming.liner);
        stack.copper[i] = s.copper; stack.dishing[i] = s.dishing; stack.liner[i] = s.liner; stack.erosion[i] = s.erosion;
        if (s.copper > K.cleared) covered += weights[i];
      }
      stack.covered = Math.round(covered * 1e9) / 1e9; stack.mean = areaMean(stack.copper); stack.centre = stack.copper[0]; stack.edge = stack.copper[N - 1];
    }
    function step(dt) {
      let left = Math.max(0, dt);
      while (left > 1e-9) { const h = Math.min(60, left); model.step(h); left -= h; }                 // the CMP lab's model takes a minute at most per call
      refresh();
      if (w.where === 'head' && Math.floor(w.polishTime) !== sampled && state.polishing) { sampled = Math.floor(w.polishTime); stack.history.push({ t: w.polishTime, covered: stack.covered, mean: stack.mean }); if (stack.history.length > 900) stack.history.shift(); }
      if (stack.measuring > 0) { stack.measuring = Math.max(0, stack.measuring - dt); if (stack.measuring === 0 && w.where === 'stage') measure(); }
    }
    /** The scan on the thickness stage: copper left and dishing across the wafer, scratches, and the verdict. */
    function measure() {
      refresh();
      let residue = 0, deepest = 0;
      for (let i = 0; i < N; i++) for (const side of [-1, 1]) {                                        // the thick side and the thin side of a wedge
        const s = stackAt(removedAt(i) + side * Math.abs(w.tilt) * (i / (N - 1)), incoming.thickness, incoming.depth, incoming.liner);
        residue = Math.max(residue, s.copper); deepest = Math.max(deepest, s.dishing);
      }
      stack.result = {
        radius: Array.from(model.radius, r => r * 1000), copper: Array.from(stack.copper), dishing: Array.from(stack.dishing), erosion: Array.from(stack.erosion), tilt: w.tilt, tiltAngle: w.tiltAngle,
        residue, cleared: residue <= K.cleared, dishingMean: areaMean(stack.dishing), dishingMax: deepest,
        scratches: w.scratches.map(s => ({ r: s.r * 1000, theta: s.theta, length: s.length })), seconds: w.polishTime, slurry: w.slurryUsed, hottest: w.maxTemp,
        ok: residue <= K.cleared && deepest <= K.spec.dishing && w.scratches.length === 0,
      };
      return stack.result;
    }
    /** Moves the wafer to 'head', 'pedestal' or 'stage' (the head has to be up). On the stage it is scanned. */
    function moveWafer(target) {
      if (!model.moveWafer(target)) return false;
      stack.measuring = target === 'stage' ? K.measure : 0;
      if (target === 'head') stack.result = null;                                                       // polished again: the old scan no longer holds
      return true;
    }
    /** Emergency stop: every rotation and the slurry off, the head up. */
    function stop() { for (const [name, value] of [['head', 0], ['platen', 0], ['carrier', 0], ['slurry', 0], ['conditioner', false]]) model.setControl(name, value); }
    refresh();
    return { state, stack, constants, incoming, radius: model.radius, setControl: model.setControl, step, moveWafer, stop, at };
  }

  return { constants, stackAt, create, weights };
});
