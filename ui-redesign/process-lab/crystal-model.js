/* Crystal growth for the process lab (Czochralski): how the diameter of the crystal follows the pull speed, how much
 * boron the crystal takes from the melt and what resistivity that gives, and a crystal puller that runs in real time.
 * No DOM: loaded by the page and by tests/process-lab-crystal.test.cjs.
 *
 * Where the numbers come from
 *   Doping: the crystal takes k times the melt's concentration, and the melt it leaves behind grows richer (normal
 *     freezing): Cs = k C0 (1 - f)^(k - 1), f the share of the melt that has frozen. Boron: k = 0.8. The melt's C0
 *     follows from the boron added, the silicon in the crucible and the density of liquid silicon (2.57 g/cm3).
 *     Resistivity = 1 / (q mu N) with a hole mobility of 470 cm2/Vs (the low-doping value).
 *   Diameter: the heat balance at the freezing front, rho L v + k_l G_l = k_s G_s (the latent heat of what freezes and
 *     the heat coming up from the melt leave through the crystal). The heat the crystal can take away goes with
 *     1 / sqrt(radius), and the heat from the melt with its superheat dT above the melting point, which adds to the pull
 *     speed as v + c dT. So the radius settles at 150 mm x ((1 + 5 c) / (v + c dT))^2, v in mm/min: pull faster or heat
 *     the melt more and the crystal thins. c = 0.03 mm/min per K is k_l / (rho L delta): molten silicon conducts
 *     k_l = 45.6 W/m K (Minagawa, Nagai et al., Jpn. J. Appl. Phys. 39, 1405 (2000)); rho L = 2.33 g/cm3 x 1.8 kJ/g =
 *     4.2e9 J/m3 (the heat of fusion is 1.79 to 1.85 kJ/g in the literature); the thermal layer delta = 2 cm is assumed. That 300 mm holds at 1 mm/min with
 *     5 K of superheat is a representative value. The radius closes on its equilibrium over about 30 mm of pulled length
 *     and cannot change by more than 1.2 mm per mm pulled: assumed.
 *   Heater: the melt's superheat follows the heater with a time constant of 10 minutes, 1 K per kW above the 100 kW
 *     that just keep the silicon molten (representative values). A seed dipped in a melt more than 30 K too hot melts
 *     away within a minute; below the melting point the melt starts to freeze and the crystal spreads.
 *   Neck: a run thinner than 5 mm for at least 30 mm lets the dislocations of the seed grow out (Dash neck); the two
 *     numbers are representative. Without it the crystal counts as dislocated.
 *   End of a crystal: the puller stops pulling when its pull chamber is full (1250 mm of crystal, what the chamber of
 *     this puller holds once the crystal is lifted) or when nine tenths of the charge have frozen (the rest stays in
 *     the crucible); both numbers are assumed. The seed has to be lifted more than half its way for the crystal to
 *     leave the melt: a hand that only moves it a little leaves the crystal growing.
 *   Left out: melting the charge, rotation, oxygen from the crucible, the tail, the melt level falling as the crystal
 *     grows, and how the pull speed decides the crystal's point defects. The automatic diameter control is an ideal one:
 *     it knows the melt's superheat and sets the speed for it.
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
    melt: 250, usable: 0.9,                                        // kg of silicon in the crucible; the share of it a crystal can take
    stroke: 1250,                                                  // mm of crystal the pull chamber holds
    pull: { min: 0, max: 14, step: 0.1, reference: 1 },            // mm/min; at the reference speed the crystal holds the reference radius
    radius: { reference: 150, seed: 6, widest: 172, lost: 1 },     // mm; thinner than `lost` the crystal comes off the melt
    flux: 0.03,                                                    // mm/min of pull the melt's heat counts for, per K of superheat
    heater: { min: 90, max: 140, step: 0.5, melting: 100, perKW: 1, tau: 600, start: 105 },   // kW; kW that keep the melt just at its melting point; K of superheat per kW above; s; kW at the start
    superheat: { reference: 5, meltback: 30, seconds: 60 },        // K at which the reference radius holds at the reference speed; K above which a dipped seed melts away, in s
    relax: 30, slope: 1.2,                                         // mm of pull over which the radius closes on its equilibrium; mm of radius per mm pulled at most
    dopant: { min: 0, max: 10, step: 0.1 },                        // mg of boron
    neck: { diameter: 5, length: 30, until: 50 },                  // mm: thinner than this, for this long, before the crystal first passes `until`
    auto: { target: 305, window: 20 },                             // mm of diameter the controller holds; it can be switched on within this of the target
    spec: { diameter: [300, 310], body: 100, resistivity: { target: 10, tolerance: 1 } },   // mm, mm of body in that range, ohm cm
    travel: 20,                                                    // s for the seed to go down or up
  };
  const K = constants, clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Radius (mm) the crystal settles at for a pull speed (mm/min) and the melt's superheat (K). */
  function equilibrium(speed, superheat = K.superheat.reference) {
    const effective = speed + K.flux * superheat, reference = K.pull.reference + K.flux * K.superheat.reference;
    return effective > 0 ? Math.min(K.radius.widest, K.radius.reference * (reference / effective) ** 2) : K.radius.widest;
  }
  /** Pull speed (mm/min) at which the crystal holds a radius (mm) on a melt with this superheat (K). */
  const speedFor = (radius, superheat = K.superheat.reference) => (K.pull.reference + K.flux * K.superheat.reference) * Math.sqrt(K.radius.reference / radius) - K.flux * superheat;
  /** Superheat (K) the melt settles at for a heater power (kW). */
  const steadySuperheat = kW => (kW - K.heater.melting) * K.heater.perKW;
  /** Boron atoms per cm3 of melt for `mg` of boron in `kg` of silicon. */
  const meltConcentration = (mg, kg = K.melt) => mg * 1e-3 / K.boron.M * AVOGADRO / (kg * 1000 / K.silicon.liquid);
  /** Boron per cm3 in the crystal that freezes when the share `fraction` of the melt has frozen (the law holds short of the last of the melt). */
  const solidConcentration = (melt, fraction = 0) => K.boron.k * melt * Math.pow(1 - clamp(fraction, 0, 0.99), K.boron.k - 1);
  /** Resistivity (ohm cm) of p-type silicon with `acceptors` per cm3. */
  const resistivity = acceptors => 1 / (Q * K.holeMobility * (acceptors + K.residual));

  /** A crystal puller with one charge of silicon. Times are seconds, lengths mm. */
  function create() {
    const state = {
      time: 0, controls: { seed: 0, speed: 0, dopant: 0, auto: false, heater: K.heater.start },   // seed: 0 up, 1 down in the melt; heater in kW
      superheat: steadySuperheat(K.heater.start), meltback: 0, meltedBack: false,   // K above the melting point; s a dipped seed has spent in a melt too hot for it
      seed: 0, attached: false, ended: false, lost: false,
      full: null,                              // why the puller has stopped pulling this crystal: 'stroke' (the pull chamber is full) or 'melt' (the charge is used up); null while it can grow
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
      else if (name === 'heater') c.heater = snap(value, K.heater);
      else if (name === 'auto') { if (value && !(growing() && Math.abs(2 * state.radius - K.auto.target) <= K.auto.window)) return false; c.auto = Boolean(value); }
      else return false;
      return true;
    }
    function begin() {
      Object.assign(state, { attached: true, ended: false, lost: false, full: null, meltedBack: false, meltback: 0, length: 0, radius: K.radius.seed, mass: 0, profile: [{ z: 0, r: K.radius.seed, m: 0 }], thin: 0, necked: false, shouldered: false, run: 0, body: { from: 0, to: 0, length: 0 }, result: null });
      if (state.doped == null) state.doped = state.controls.dopant;
    }
    function grow(dz) {
      const c = state.controls, [low, high] = K.spec.diameter;
      state.radius += clamp((equilibrium(c.speed, state.superheat) - state.radius) / K.relax, -K.slope, K.slope) * dz;
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
      state.superheat += (steadySuperheat(c.heater) - state.superheat) * (1 - Math.exp(-dt / K.heater.tau));
      if (growing() && state.length < 20 && state.superheat > K.superheat.meltback) state.meltback += dt; else state.meltback = 0;
      if (state.meltback >= K.superheat.seconds) { state.attached = false; state.lost = true; state.meltedBack = true; c.seed = 0; c.auto = false; state.meltback = 0; }   // the seed melts away
      if (growing()) {
        if (c.seed < 0.5) { state.ended = true; c.auto = false; state.profile.push({ z: state.length, r: state.radius, m: state.mass }); }    // the seed is lifted more than half its way: the crystal leaves the melt
        else if (!state.full) {
          const held = () => Math.round(clamp(speedFor(target, state.superheat) * (1 + 0.5 * (state.radius - target) / target), K.pull.min, K.pull.max) * 1000) / 1000;
          if (c.auto) c.speed = held();                             // the controller sets the speed before anything is pulled: a speed of 0 does not hold it off
          let left = c.speed * dt / 60;
          while (left > 1e-12 && growing() && !state.full) {
            if (c.auto) c.speed = held();
            const dz = Math.min(0.5, left); grow(dz); left -= dz;
            if (state.radius < K.radius.lost) { state.attached = false; state.lost = true; state.meltedBack = false; c.seed = 0; c.auto = false; }
            else if (state.length >= K.stroke || state.mass >= K.usable * K.melt) { state.full = state.length >= K.stroke ? 'stroke' : 'melt'; c.auto = false; }   // the puller pulls no further
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
      const b = state.body, S = K.spec, valid = Math.round(b.length) >= S.body, inBody = state.profile.filter(p => p.z >= b.from && p.z <= b.to), mid = (b.from + b.to) / 2;
      const at = state.profile.reduce((best, p) => Math.abs(p.z - mid) < Math.abs(best.z - mid) ? p : best, state.profile[0]), fraction = at.m / K.melt;
      const rho = resistivity(solidConcentration(meltConcentration(state.doped || 0), fraction));
      const diameter = inBody.length ? 2 * inBody.reduce((sum, p) => sum + p.r, 0) / inBody.length : 2 * Math.max(...state.profile.map(p => p.r));   // with no body in range: where the crystal is widest
      state.result = { valid, diameter, body: b.length, length: state.length, necked: state.necked, dislocated: !state.necked, resistivity: rho, fraction, dopant: state.doped || 0,
        ok: valid && state.necked && Math.abs((rho >= 100 ? Math.round(rho) : Number(rho.toFixed(1))) - S.resistivity.target) <= S.resistivity.tolerance };   // on the numbers as they are printed: whole mm, and a resistivity with one decimal
      return state.result;
    }
    return { state, constants, setControl, step, canMeasure, measure, growing };
  }

  return { constants, equilibrium, speedFor, steadySuperheat, meltConcentration, solidConcentration, resistivity, create };
});
