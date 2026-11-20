/* Plasma etching of the oxide for the process lab: how fast the oxide, the silicon under it and the resist over it
 * are removed, the shape that leaves, the endpoint signal, and an etch chamber that runs in real time.
 * No DOM: loaded by the page and by tests/process-lab-etch.test.cjs.
 *
 * What is computed and what is representative
 *   The bookkeeping of the shape is exact: the bottom of the opening goes down at the oxide rate until the oxide is
 *   through, then into the silicon at rate / selectivity; the walls move sideways at (1 - anisotropy) x rate; the resist
 *   loses rate / resist selectivity, and once it is gone the oxide beside the openings is etched as well.
 *   The rates themselves are not derived from plasma physics. They are representative values with simple trends:
 *     - oxide rate and oxide-to-silicon selectivity for the two gases from a measured comparison in a parallel-plate
 *       RIE tool (Quattrone Nanofabrication Facility, Univ. of Pennsylvania, "Reactive Ion Etching Selectivity of
 *       Si/SiO2: Comparing of two fluorocarbon gases CHF3 and CF4"): CHF3 32.4 nm/min at 16:1, CF4 52.8 nm/min at 1.2:1.
 *       CHF3 leaves polymer on silicon, which is what gives it the selectivity. A mixture is interpolated by flow.
 *     - the rate is taken as proportional to the RF power, with those values at the reference power (assumed 150 W);
 *     - oxide-to-resist selectivity 3:1 in CHF3 and 1:1 in CF4 (the order found in tool notes; assumed values);
 *     - anisotropy falls from 0.97 at 10 mTorr to 0.70 at 200 mTorr: at higher pressure the ions scatter and the
 *       walls are attacked more (the direction is textbook, the numbers are assumed).
 *   Across the wafer: no etch tool removes the same everywhere. Here the edge etches faster than the centre: the rate at
 *   a place is the mean rate x (1 + U ((r/R)^2 - its mean over the area)), with U = 0.10, so 5% slower at the centre and
 *   5% faster at the edge (a representative value: tools are specified to within a few percent, and which side is
 *   faster depends on the tool). The bookkeeping above runs at 31 places from the centre to the edge, each at its rate.
 *   Endpoint: the light of an etch product (CO from the oxide) is strong while oxide is being removed and drops when the
 *   openings reach silicon. The signal here is proportional to the oxide removed per second over the whole wafer, plus
 *   a floor and noise. As the edge opens first, the signal falls over the time between the edge and the centre opening.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabEtch = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const constants = {
    gases: { chf3: { rate: 32.4, silicon: 16, resist: 3 }, cf4: { rate: 52.8, silicon: 1.2, resist: 1 } },   // oxide nm/min at the reference power; oxide : silicon; oxide : resist
    power: { reference: 150, min: 0, max: 600, step: 10, strike: 50 },      // W; below `strike` there is no plasma
    pressure: { min: 10, max: 200, step: 5, standby: 50 },                  // mTorr
    anisotropy: { low: 0.97, high: 0.70 },                                  // at the lowest and the highest pressure
    pitch: 3000,                                                            // nm: one opening per pitch
    door: 4,                                                                // s for the wafer to go in or out
    glow: 0.12,                                                             // endpoint light of the plasma alone
    nodes: 31,                                                              // places along the radius, centre to edge
    uniformity: 0.10,                                                       // how much faster the edge etches than the centre, as a share of the mean rate
    spec: { siliconLoss: 20, width: { target: 1000, tolerance: 100 } },     // nm: what the run sheet asks, at every place
  };
  const N = constants.nodes, clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  /** Share of the wafer's area that belongs to each place along the radius. */
  const weights = Float64Array.from({ length: N }, (_, j) => { const d = 1 / (N - 1), lo = Math.max(0, j * d - d / 2), hi = Math.min(1, j * d + d / 2); return hi * hi - lo * lo; });
  /** Mean over the wafer's area of a value given at each place (exactly the value where it is the same everywhere). */
  const areaMean = values => { let sum = 0; for (let j = 0; j < N; j++) sum += weights[j] * (values[j] - values[0]); return values[0] + sum; };
  /** The etch rate at each place as a share of the wafer's mean, for a tool `U` faster at the edge than at the centre. */
  function across(U = constants.uniformity) {
    const x = Array.from({ length: N }, (_, j) => (j / (N - 1)) ** 2), mean = areaMean(x);
    return Float64Array.from(x, v => 1 + U * (v - mean));
  }

  /** Removal rates (nm/min, the wafer's mean) and anisotropy for a gas mixture, power (W) and pressure (mTorr). Null without plasma. */
  function rates({ chf3, cf4, power, pressure }) {
    const flows = (chf3 ? 1 : 0) + (cf4 ? 1 : 0);
    if (!flows || power < constants.power.strike) return null;
    const g = constants.gases, a = chf3 ? 1 / flows : 0, b = cf4 ? 1 / flows : 0, scale = power / constants.power.reference;
    const oxide = (a * g.chf3.rate + b * g.cf4.rate) * scale;
    const p = constants.pressure, t = clamp((pressure - p.min) / (p.max - p.min), 0, 1);
    return {
      oxide, silicon: oxide / (a * g.chf3.silicon + b * g.cf4.silicon), resist: oxide / (a * g.chf3.resist + b * g.cf4.resist),
      anisotropy: constants.anisotropy.low + (constants.anisotropy.high - constants.anisotropy.low) * t,
    };
  }

  /**
   * An etch chamber with one wafer. `wafer` gives { oxide, resist: { thickness, opening } | null }; `uniformity`
   * overrides constants.uniformity (0: the same rate everywhere). Times are seconds.
   */
  function create(options = {}) {
    let seed = (options.seed ?? 1) >>> 0;
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const incoming = options.wafer || { oxide: 500, resist: { thickness: 1000, opening: 1000 } }, mask = incoming.resist, speed = across(options.uniformity ?? constants.uniformity);
    const fill = v => new Float64Array(N).fill(v);
    const places = {                          // at each place from the centre to the edge (nm)
      resist: fill(mask ? mask.thickness : 0), // resist left
      field: fill(incoming.oxide),            // oxide left beside the openings
      floor: fill(incoming.oxide),            // oxide left at the bottom of an opening
      siliconLoss: fill(0), undercut: fill(0),  // silicon removed in the opening, and how far each wall has moved sideways
    };
    const state = {
      time: 0, controls: { power: 0, pressure: constants.pressure.standby, chf3: false, cf4: false, load: false },
      inside: 0,                                // 0 = on the load arm, 1 = on the chuck with the door shut
      plasma: false, rate: 0, anisotropy: 1,    // rate: the wafer's mean (nm/min)
      opening: mask ? mask.opening : 0,         // width of the opening in the resist (nm); 0 if it never opened
      places, across: speed,                    // across: the rate at each place as a share of the mean
      resist: 0, field: 0, floor: 0, siliconLoss: 0, undercut: 0,   // over the wafer: the thinnest resist and field oxide, the most oxide left in an opening, the most silicon lost, the widest move of a wall
      opened: 0,                                // share of the wafer's area where the openings have reached silicon
      signal: 0, etched: 0,                     // endpoint light (arbitrary units) and seconds of plasma on this wafer
      history: [], result: null,
    };
    function summarise() {
      state.resist = Math.min(...places.resist); state.field = Math.min(...places.field); state.floor = Math.max(...places.floor);
      state.siliconLoss = Math.max(...places.siliconLoss); state.undercut = Math.max(...places.undercut);
      let opened = 0; if (state.opening > 0) for (let j = 0; j < N; j++) if (places.floor[j] <= 1e-9) opened += weights[j];
      state.opened = Math.min(1, opened);
    }
    summarise();
    let sampled = -Infinity;
    const snap = (value, { min, max, step }) => clamp(Math.round(Number(value) / step) * step, min, max);
    /** Dials: power, pressure. Valves: chf3, cf4. Button: load (in or out). Returns false when the chamber cannot do it now. */
    function setControl(name, value) {
      const c = state.controls;
      if (name === 'power') c.power = snap(value, constants.power);
      else if (name === 'pressure') c.pressure = snap(value, constants.pressure);
      else if (name === 'chf3' || name === 'cf4') c[name] = Boolean(value);
      else if (name === 'load') { if ((state.inside >= 1 && rates(c)) || state.result) return false; c.load = Boolean(value); }   // not while the plasma is on, and not again once the wafer has been stripped and measured
      else return false;
      return true;
    }
    function advance(h) {
      const c = state.controls, minutes = h / 60;
      state.inside = clamp(state.inside + (c.load ? 1 : -1) * h / constants.door, 0, 1);
      const r = state.inside >= 1 ? rates(c) : null;
      state.plasma = Boolean(r); state.rate = r ? r.oxide : 0; state.anisotropy = r ? r.anisotropy : 1;
      let removed = 0;                          // oxide removed in this step over the wafer: nm of depth x nm of width within one pitch
      if (r) {
        state.etched += h;
        for (let j = 0; j < N; j++) {
          const reach = r.oxide * speed[j] * minutes, covered = places.resist[j] > 0, width = state.opening > 0 ? state.opening + 2 * places.undercut[j] : 0;
          let here = 0;
          if (state.opening > 0 || !covered) {  // the bottom of the opening
            const cut = Math.min(places.floor[j], reach);
            places.floor[j] -= cut;
            if (state.opening > 0) { here += cut * width; places.siliconLoss[j] += (reach - cut) / r.oxide * r.silicon; }   // what is left of the step goes into the silicon
          }
          if (!covered) { const cut = Math.min(places.field[j], reach); places.field[j] -= cut; here += cut * (constants.pitch - width); }   // no resist: the oxide beside the openings too
          if (state.opening > 0 && places.field[j] > places.floor[j]) { const wall = (1 - r.anisotropy) * reach; places.undercut[j] += wall; here += 2 * wall * (places.field[j] - places.floor[j]); }
          if (covered) places.resist[j] = Math.max(0, places.resist[j] - r.resist * speed[j] * minutes);
          removed += weights[j] * here;
        }
        summarise();
      }
      state.signal = state.plasma ? constants.glow + removed / minutes / (constants.pitch * 60) * (0.97 + 0.06 * random()) : 0;
      state.time += h;
      if (state.time - sampled >= 2) { sampled = state.time; state.history.push({ t: state.time, signal: state.signal, floor: state.floor, opened: state.opened }); if (state.history.length > 1800) state.history.splice(0, 2); }
      if (state.inside <= 0 && state.etched > 0 && !state.result) state.result = measure();
    }
    function step(dt) {
      if (!(dt > 0)) return;
      const n = Math.max(1, Math.ceil(dt));
      for (let i = 0; i < n; i++) advance(dt / n);
    }
    /**
     * The wafer as it would come out now: the resist is stripped and the windows are measured at every place. The
     * wafer as a whole: oxide and window width are means over the area, `left` and `siliconLoss` the most at any place,
     * `open` means open everywhere and `opened` is the share of the area that is open. `profile` has them place by place.
     */
    function measure() {
      const s = constants.spec, stripped = state.field <= 0, windows = state.opening > 0 && !stripped;
      const width = Array.from(places.undercut, u => windows ? state.opening + 2 * u : 0), left = Array.from(places.floor, v => stripped ? 0 : v), loss = Array.from(places.siliconLoss);
      const open = windows && left.every(v => v <= 1e-9);
      return {
        oxide: areaMean(places.field), stripped, width: areaMean(width), depth: areaMean(Array.from(places.field, (f, j) => f - places.floor[j])),
        open, opened: windows ? state.opened : 0, left: stripped ? 0 : state.floor, siliconLoss: state.siliconLoss, undercut: state.undercut,
        resistLeft: state.resist, seconds: state.etched, profile: { left, siliconLoss: loss, width },
        ok: open && state.siliconLoss <= s.siliconLoss && width.every(w => Math.abs(w - s.width.target) <= s.width.tolerance),
      };
    }
    return { state, constants, incoming, setControl, step, measure };
  }

  return { constants, weights, across, rates, create };
});
