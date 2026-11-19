/* Crystal growth for the process lab (Czochralski): how the diameter of the crystal follows the pull speed, how much
 * boron the crystal takes from the melt and what resistivity that gives, and a crystal puller that runs in real time.
 * No DOM: loaded by the page and by tests/process-lab-crystal.test.cjs.
 *
 * Where the numbers come from
 *   Doping: the crystal takes k times the melt's concentration, and the melt it leaves behind grows richer (normal
 *     freezing): Cs = k C0 (1 - f)^(k - 1), f the share of the melt that has frozen. Boron: k = 0.8. The melt's C0
 *     follows from the boron added, the silicon in the crucible and the density of liquid silicon (2.57 g/cm3).
 *     Resistivity = 1 / (q mu N) with a hole mobility of 470 cm2/Vs (the low-doping value).
 *   Diameter: the heat balance at the freezing front gives a largest pull speed that goes with 1 / sqrt(radius). The lab
 *     takes that proportion as the equilibrium, radius = 150 mm x (1 mm/min / speed)^2: pull faster and the crystal
 *     thins. That 300 mm holds at 1 mm/min is a representative value. The radius closes on its equilibrium over about
 *     30 mm of pulled length and cannot change by more than 1.2 mm per mm pulled: assumed.
 *   Neck: a run thinner than 5 mm for at least 30 mm lets the dislocations of the seed grow out (Dash neck); the two
 *     numbers are representative. Without it the crystal counts as dislocated.
 *   Left out: melting the charge, the heater, rotation, oxygen from the crucible, the tail, and how the pull speed
 *     decides the crystal's point defects. The automatic diameter control is an ideal one.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabCrystal = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const Q = 1.602176634e-19, AVOGADRO = 6.02214076e23;
  const constants = {
    silicon: { solid: 2.33, liquid: 2.57, melting: 1414 },         // g/cm3, g/cm3, C
    boron: { M: 10.81, k: 0.8 },                                   // g/mol, segregation coefficient
    holeMobility: 470, residual: 1e12,                             // cm2/Vs; acceptors per cm3 that undoped silicon is taken to have
    melt: 250,                                                     // kg of silicon in the crucible
    pull: { min: 0, max: 14, step: 0.1, reference: 1 },            // mm/min; at the reference speed the crystal holds the reference radius
    radius: { reference: 150, seed: 6, widest: 172, lost: 1 },     // mm; thinner than `lost` the crystal comes off the melt
    relax: 30, slope: 1.2,                                         // mm of pull over which the radius closes on its equilibrium; mm of radius per mm pulled at most
    dopant: { min: 0, max: 10, step: 0.1 },                        // mg of boron
    neck: { diameter: 5, length: 30, until: 50 },                  // mm: thinner than this, for this long, before the crystal first passes `until`
    auto: { target: 305, window: 20 },                             // mm of diameter the controller holds; it can be switched on within this of the target
    spec: { diameter: [300, 310], body: 100, resistivity: { target: 10, tolerance: 1 } },   // mm, mm of body in that range, ohm cm
    travel: 20,                                                    // s for the seed to go down or up
  };
  const K = constants, clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Radius (mm) the crystal settles at for a pull speed (mm/min). */
  const equilibrium = speed => speed > 0 ? Math.min(K.radius.widest, K.radius.reference * (K.pull.reference / speed) ** 2) : K.radius.widest;
  /** Pull speed (mm/min) at which the crystal holds a radius (mm). */
  const speedFor = radius => K.pull.reference * Math.sqrt(K.radius.reference / radius);
  /** Boron atoms per cm3 of melt for `mg` of boron in `kg` of silicon. */
  const meltConcentration = (mg, kg = K.melt) => mg * 1e-3 / K.boron.M * AVOGADRO / (kg * 1000 / K.silicon.liquid);
  /** Boron per cm3 in the crystal that freezes when the share `fraction` of the melt has frozen. */
  const solidConcentration = (melt, fraction = 0) => K.boron.k * melt * Math.pow(1 - fraction, K.boron.k - 1);
  /** Resistivity (ohm cm) of p-type silicon with `acceptors` per cm3. */
  const resistivity = acceptors => 1 / (Q * K.holeMobility * (acceptors + K.residual));

  /** A crystal puller with one charge of silicon. Times are seconds, lengths mm. */
  function create() {
    const state = {
      time: 0, controls: { seed: 0, speed: 0, dopant: 0, auto: false },   // seed: 0 up, 1 down in the melt
      seed: 0, attached: false, ended: false, lost: false,
      doped: null,                             // mg of boron in the melt, fixed when the seed first touches it
      length: 0, radius: K.radius.seed, mass: 0,          // mm pulled, mm, kg frozen
      profile: [],                             // the crystal from the seed end: { z, r, m } every 2 mm
      thin: 0, necked: false, shouldered: false,          // mm of the thin run now, whether a full neck was grown, whether the crystal has widened past the neck stage
      run: 0, body: { from: 0, to: 0, length: 0 },        // mm of body in range now, and the longest such stretch
      result: null,
    };
    const snap = (value, { min, max, step }) => Math.round(clamp(Math.round(Number(value) / step) * step, min, max) * 100) / 100;
    const growing = () => state.attached && !state.ended, target = K.auto.target / 2;
    /** seed (0..1), speed (mm/min), dopant (mg), auto (on or off). Returns false when the move is refused. */
    function setControl(name, value) {
      const c = state.controls;
      if (name === 'seed') c.seed = clamp(Number(value) || 0, 0, 1);
      else if (name === 'speed') { c.speed = snap(value, K.pull); c.auto = false; }                    // a hand on the dial takes over from the controller
      else if (name === 'dopant') { if (state.doped != null) return false; c.dopant = snap(value, K.dopant); }
      else if (name === 'auto') { if (value && !(growing() && Math.abs(2 * state.radius - K.auto.target) <= K.auto.window)) return false; c.auto = Boolean(value); }
      else return false;
      return true;
    }
    function begin() {
      Object.assign(state, { attached: true, ended: false, lost: false, length: 0, radius: K.radius.seed, mass: 0, profile: [{ z: 0, r: K.radius.seed, m: 0 }], thin: 0, necked: false, shouldered: false, run: 0, body: { from: 0, to: 0, length: 0 }, result: null });
      if (state.doped == null) state.doped = state.controls.dopant;
    }
    function grow(dz) {
      const c = state.controls, [low, high] = K.spec.diameter;
      state.radius += clamp((equilibrium(c.speed) - state.radius) / K.relax, -K.slope, K.slope) * dz;
      state.length += dz; state.mass += K.silicon.solid * Math.PI * (state.radius / 10) ** 2 * (dz / 10) / 1000;
      const d = 2 * state.radius;
      if (!state.shouldered) {
        if (d <= K.neck.diameter) { state.thin += dz; if (state.thin >= K.neck.length) state.necked = true; } else state.thin = 0;
        if (d > K.neck.until) state.shouldered = true;
      }
      if (d >= low && d <= high) { state.run += dz; if (state.run > state.body.length) state.body = { from: state.length - state.run, to: state.length, length: state.run }; } else state.run = 0;
      if (state.length - state.profile.at(-1).z >= 2) state.profile.push({ z: state.length, r: state.radius, m: state.mass });
    }
    function step(dt) {
      if (!(dt > 0)) return;
      const c = state.controls;
      state.time += dt;
      if (growing()) {
        if (c.seed < 1) { state.ended = true; c.auto = false; state.profile.push({ z: state.length, r: state.radius, m: state.mass }); }      // the seed is lifted: the crystal leaves the melt
        else {
          let left = c.speed * dt / 60;
          while (left > 1e-12 && growing()) {
            if (c.auto) c.speed = Math.round(clamp(speedFor(target) * (1 + 0.5 * (state.radius - target) / target), K.pull.min, K.pull.max) * 1000) / 1000;
            const dz = Math.min(0.5, left); grow(dz); left -= dz;
            if (state.radius < K.radius.lost) { state.attached = false; state.lost = true; c.seed = 0; c.auto = false; }
          }
        }
      }
      if (!growing()) {
        state.seed += clamp(c.seed - state.seed, -dt / K.travel, dt / K.travel);
        if (state.seed >= 1 && c.seed >= 1) begin();                // the seed touches the melt: a new crystal starts
      }
    }
    const canMeasure = () => state.ended && state.seed <= 0.02;
    /** The crystal out of the puller: its body, whether it has a neck, and the resistivity of a wafer cut from the middle of the body. Null while it is in. */
    function measure() {
      if (!canMeasure()) return null;
      const b = state.body, S = K.spec, valid = b.length >= S.body, inBody = state.profile.filter(p => p.z >= b.from && p.z <= b.to), mid = (b.from + b.to) / 2;
      const at = state.profile.reduce((best, p) => Math.abs(p.z - mid) < Math.abs(best.z - mid) ? p : best, state.profile[0]), fraction = at.m / K.melt;
      const rho = resistivity(solidConcentration(meltConcentration(state.doped || 0), fraction));
      const diameter = inBody.length ? 2 * inBody.reduce((sum, p) => sum + p.r, 0) / inBody.length : 2 * state.radius;
      state.result = { valid, diameter, body: b.length, length: state.length, necked: state.necked, dislocated: !state.necked, resistivity: rho, fraction, dopant: state.doped || 0,
        ok: valid && state.necked && Math.abs(rho - S.resistivity.target) <= S.resistivity.tolerance };
      return state.result;
    }
    return { state, constants, setControl, step, canMeasure, measure, growing };
  }

  return { constants, equilibrium, speedFor, meltConcentration, solidConcentration, resistivity, create };
});
