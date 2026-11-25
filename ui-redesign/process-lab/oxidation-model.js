/* Thermal oxidation of silicon for the process lab: rate constants, closed-form thickness and a furnace that runs in real time.
 * No DOM, no 3D: loaded by the page and by the unit tests (tests/process-lab-oxidation.test.cjs).
 *
 * Where the numbers come from
 *   Wet oxidation (H2O): the Deal-Grove linear-parabolic model, x^2 + A x = B (t + tau), with the Arrhenius constants of
 *     Plummer, Deal and Griffin, "Silicon VLSI Technology" (2000), as tabulated in C. Hollauer, "Modeling of Thermal Oxidation
 *     and Stress Effects" (dissertation, TU Wien, 2007), Table 2.2: B = 386 um^2/h exp(-0.78 eV / kT) and, for (111) silicon,
 *     B/A = 1.63e8 um/h exp(-2.05 eV / kT). On (100) silicon B/A is 1.68 times smaller and B is the same (eq. 2.32).
 *   Dry oxidation (O2): Deal-Grove does not describe about the first 30 nm in dry oxygen, which is where dry oxides are used.
 *     So the dry branch is Massoud's relation: the same linear-parabolic form plus two rate-enhancement terms that decay with
 *     the oxidation time (Massoud and Plummer, J. Appl. Phys. 62, 3416 (1987)), with the (100) parameters of the same
 *     dissertation, Tables 2.3 and 2.4, which were fitted at 800-1000 C. Above 1000 C the linear-parabolic part uses the
 *     Deal-Grove constants for dry O2 instead (Plummer, same Table 2.2: B = 772 um^2/h exp(-1.23 eV / kT), B/A = 6.23e6 um/h
 *     exp(-2.00 eV / kT) on (111)), which were fitted up to 1200 C, and keeps Massoud's enhancement terms, extrapolated. (The
 *     dissertation also lists Massoud constants for above 1000 C, with 3.2 eV for B/A. Carried to 1100 C they give about a
 *     quarter more oxide than the Deal-Grove constants, so they are not used here.) Below 800 C the dry branch extrapolates.
 *   Pressure: B and B/A are proportional to the oxidant partial pressure; in O2 the linear constant goes with p^0.75
 *     (same dissertation, eq. 2.28-2.31). The enhancement terms are scaled with p as well, which is an assumption.
 *
 * One deliberate departure from the printed source: the dissertation prints the time constants as tau = tau0 exp(-E / kT).
 * With its own tau0 and E that gives about 1e-11 minutes at 900 C, so the enhancement would vanish at once. Read as
 * tau = tau0 exp(+E / kT) the same numbers give 3.5 and 32 minutes at 900 C and about 20 nm after one hour, which is what
 * dry oxidation at 900 C does. This file uses the plus sign. It should be checked against the 1987 paper.
 *
 * The furnace (ramp rates, boat travel, wafer lag, the 800 C boat lock) uses representative values, not a specific tool.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabOxidation = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const KB = 8.617333262e-5;                                       // Boltzmann constant, eV/K
  const UM2_PER_H = 1e6 / 60, UM_PER_H = 1e3 / 60;                 // to nm^2/min and nm/min: this file works in nm and minutes
  const constants = {
    orientationRatio: 1.68,                                        // B/A on (111) over B/A on (100)
    wet: { B0: 386 * UM2_PER_H, EB: 0.78, BA0: 1.63e8 * UM_PER_H / 1.68, EBA: 2.05 },                        // (100)
    dry: {                                                         // (100), nm and minutes as in the source tables
      below: { B0: 1.70e11, EB: 2.22, BA0: 7.35e6, EBA: 1.76 },    // up to 1000 C: Massoud
      above: { B0: 772 * UM2_PER_H, EB: 1.23, BA0: 6.23e6 * UM_PER_H / 1.68, EBA: 2.00 },   // above 1000 C: Deal-Grove
      K1: 2.49e11, EK1: 2.18, K2: 3.72e11, EK2: 2.28,              // nm^2/min
      tau1: 4.14e-6, Etau1: 1.38, tau2: 2.71e-7, Etau2: 1.88,      // min
      pressureExponent: 0.75, fitted: [800, 1000],
    },
    nativeOxide: 1.5,                                              // nm on a cleaned wafer (assumed)
    enhancementLength: 7,                                          // nm: an oxide already this thick has left most of the fast regime (source: "on the order of 7 nm")
    furnace: {
      standby: 700, minSet: 600, maxSet: 1200,                     // C
      rampUp: 10, rampDown: 3,                                     // C per minute (representative)
      boatTravel: 6,                                               // minutes from fully down to fully up
      boatLock: 800,                                               // C: above this the boat elevator does not move
      waferLag: 3,                                                 // minutes: time constant of the wafers following their surroundings
      room: 25, coolEnough: 80,                                    // C: wafers can be measured below this
    },
  };
  const F = constants.furnace;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const arrhenius = (pre, energy, celsius) => pre * Math.exp(-energy / (KB * (celsius + 273.15)));

  /** Rate constants of wet oxidation on (100) silicon. B in nm^2/min, BA (= B/A) in nm/min, A in nm. */
  function wetRates(celsius, pressure = 1) {
    const w = constants.wet, B = arrhenius(w.B0, w.EB, celsius) * pressure, BA = arrhenius(w.BA0, w.EBA, celsius) * pressure;
    return { B, BA, A: B / BA };
  }
  /** Rate constants of dry oxidation on (100) silicon, with the two thin-regime enhancement terms. */
  function dryRates(celsius, pressure = 1) {
    const d = constants.dry, mix = clamp((celsius - 980) / 40, 0, 1);            // the two parameter sets meet at 1000 C; blended over 40 C so nothing jumps
    const part = (lo, hi) => (1 - mix) * lo + mix * hi;
    const B = part(arrhenius(d.below.B0, d.below.EB, celsius), arrhenius(d.above.B0, d.above.EB, celsius)) * pressure;
    const BA = part(arrhenius(d.below.BA0, d.below.EBA, celsius), arrhenius(d.above.BA0, d.above.EBA, celsius)) * Math.pow(pressure, d.pressureExponent);
    return {
      B, BA, A: B / BA,
      K1: arrhenius(d.K1, d.EK1, celsius) * pressure, K2: arrhenius(d.K2, d.EK2, celsius) * pressure,
      tau1: arrhenius(d.tau1, -d.Etau1, celsius), tau2: arrhenius(d.tau2, -d.Etau2, celsius),      // plus sign, see the note at the top
    };
  }
  const solve = (A, Q) => -A / 2 + Math.sqrt(A * A / 4 + Q);                     // thickness from Q = x^2 + A x

  /** Oxide thickness (nm) after `minutes` of wet oxidation at a constant temperature, starting from `start` nm. */
  function wetThickness(start, minutes, celsius, pressure = 1) {
    const { A, B } = wetRates(celsius, pressure);
    return solve(A, start * start + A * start + B * minutes);
  }
  /** The same for dry oxidation of a wafer that enters with `start` nm (the native oxide by default): Massoud's analytical relation. */
  function dryThickness(start, minutes, celsius, pressure = 1) {
    const r = dryRates(celsius, pressure), keep = Math.exp(-Math.max(0, start - constants.nativeOxide) / constants.enhancementLength);
    const fast = r.K1 * r.tau1 * (1 - Math.exp(-minutes / r.tau1)) + r.K2 * r.tau2 * (1 - Math.exp(-minutes / r.tau2));
    return solve(r.A, start * start + r.A * start + r.B * minutes + keep * fast);
  }

  /** A vertical furnace with one boat of wafers. Times are seconds of process time; `step(dt)` advances it. */
  function create(options = {}) {
    let seed = (options.seed ?? 1) >>> 0;
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
    const target = options.target ?? 500, tolerance = options.tolerance ?? 25;
    const state = {
      time: 0,
      controls: { boat: 0, setpoint: F.standby, n2: true, o2: false, h2o: false },
      boat: 0,                                   // 0 = lowered, out of the tube; 1 = raised, the tube is closed
      tube: F.standby, wafer: F.room,            // C
      ambient: 'inert', pressure: 0,             // 'wet' | 'dry' | 'inert' | 'none', and the oxidant partial pressure in atm
      oxide: options.oxide ?? constants.nativeOxide, rate: 0,   // nm and nm/min
      growing: false, sealed: false,
      minutes: { wet: 0, dry: 0 }, peak: F.room, // oxidation time by ambient, hottest wafer temperature
      measured: null, history: [],
    };
    const fast = { s1: 0, s2: 0, keep: null };   // progress of the two decaying terms of dry oxidation, and how much of them this wafer still has
    let sampled = -Infinity;

    function setControl(name, value) {
      const c = state.controls;
      if (name === 'boat') {
        if (state.tube > F.boatLock + 0.5 && Math.abs(value - state.boat) > 0.002) return false;      // locked while the tube is hot
        c.boat = clamp(Number(value) || 0, 0, 1);
      } else if (name === 'setpoint') c.setpoint = clamp(Math.round(Number(value) / 5) * 5, F.minSet, F.maxSet);
      else if (name === 'n2' || name === 'o2' || name === 'h2o') c[name] = Boolean(value);
      else return false;
      return true;
    }

    function advance(h) {                        // h seconds, short enough that the temperature is nearly constant
      const c = state.controls, minutes = h / 60;
      state.tube += clamp(c.setpoint - state.tube, -F.rampDown * minutes, F.rampUp * minutes);
      if (state.tube > F.boatLock + 0.5) c.boat = state.boat;                                         // the elevator stops where it is
      state.boat += clamp(c.boat - state.boat, -minutes / F.boatTravel, minutes / F.boatTravel);
      state.sealed = state.boat > 0.985;
      const inside = state.boat * state.boat * (3 - 2 * state.boat);                                  // how far the boat is in the hot zone
      const around = F.room + (state.tube - F.room) * inside;
      state.wafer += (around - state.wafer) * (1 - Math.exp(-minutes / F.waferLag));
      state.peak = Math.max(state.peak, state.wafer);

      const flows = (c.n2 ? 1 : 0) + (c.o2 ? 1 : 0) + (c.h2o ? 1 : 0);
      state.ambient = !flows ? 'none' : c.h2o ? 'wet' : c.o2 ? 'dry' : 'inert';                       // with steam on, steam decides the rate
      state.pressure = state.ambient === 'wet' || state.ambient === 'dry' ? 1 / flows : 0;            // equal flows share the pressure
      const before = state.oxide;
      if (state.sealed && state.pressure > 0) {
        if (state.ambient === 'wet') {
          const { A, B } = wetRates(state.wafer, state.pressure);
          state.oxide = solve(A, before * before + A * before + B * minutes);
          state.minutes.wet += state.wafer > 600 ? minutes : 0;
        } else {
          const r = dryRates(state.wafer, state.pressure);
          if (fast.keep === null) fast.keep = Math.exp(-Math.max(0, before - constants.nativeOxide) / constants.enhancementLength);
          const e1 = Math.exp(-fast.s1), e2 = Math.exp(-fast.s2), d1 = minutes / r.tau1, d2 = minutes / r.tau2;
          const gain = r.K1 * r.tau1 * e1 * (1 - Math.exp(-d1)) + r.K2 * r.tau2 * e2 * (1 - Math.exp(-d2));
          state.oxide = solve(r.A, before * before + r.A * before + r.B * minutes + fast.keep * gain);
          fast.s1 += d1; fast.s2 += d2;
          state.minutes.dry += state.wafer > 600 ? minutes : 0;
        }
      }
      state.rate = (state.oxide - before) / minutes;
      state.growing = state.rate > 0.01;
      state.time += h;
      if (state.time - sampled >= 30) { sampled = state.time; state.history.push({ t: state.time / 60, oxide: state.oxide, wafer: state.wafer, tube: state.tube }); if (state.history.length > 2400) state.history.splice(0, 2); }
    }
    function step(dt) {
      if (!(dt > 0)) return;
      const n = Math.max(1, Math.ceil(dt / 2));
      for (let i = 0; i < n; i++) advance(dt / n);
    }

    const canMeasure = () => state.boat < 0.02 && state.wafer < F.coolEnough;
    /** Five-point thickness measurement of a wafer from the boat. Null while the boat is up or the wafers are hot. */
    function measure() {
      if (!canMeasure()) return null;
      const points = [[0, 0], [0.6, 0], [0, 0.6], [-0.6, 0], [0, -0.6]].map(([x, y]) => ({ x, y, value: state.oxide * (1 + 0.003 * gauss()) }));
      const mean = points.reduce((sum, p) => sum + p.value, 0) / points.length;
      state.measured = {
        points, mean, target, tolerance, error: Math.round(mean) - target, ok: Math.abs(Math.round(mean) - target) <= tolerance,   // on the mean as it is printed, in whole nm
        wetMinutes: state.minutes.wet, dryMinutes: state.minutes.dry, peak: state.peak, totalMinutes: state.time / 60,
      };
      return state.measured;
    }

    return { state, constants, target, tolerance, setControl, step, measure, canMeasure };
  }

  return { constants, wetRates, dryRates, wetThickness, dryThickness, create };
});
