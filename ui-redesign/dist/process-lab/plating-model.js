/* Copper electroplating for the process lab: how fast copper grows for a current (Faraday's law), how much current the
 * bath can carry to a rotating wafer (Levich's equation), how thick the film is from its sheet resistance, and a plating
 * cell that runs in real time. No DOM: loaded by the page and by tests/process-lab-plating.test.cjs.
 *
 * Where the numbers come from
 *   Growth: thickness per second = M i / (n F rho), with copper's M = 63.546 g/mol, n = 2, rho = 8.96 g/cm3 and
 *     F = 96485.33 C/mol. 10 mA/cm2 gives 220 nm per minute.
 *   Limit: on a rotating disc the current density cannot exceed i_L = 0.620 n F D^(2/3) w^(1/2) v^(-1/6) C (Levich's
 *     equation, w in rad/s). At the wafer the copper concentration is C (1 - i / i_L). Above the limit the extra current
 *     makes hydrogen and the deposit comes out dark and powdery ("burnt").
 *     D = 6e-6 cm2/s for the copper ion is a representative value (measurements in plating baths give 5 to 7e-6); the
 *     kinematic viscosity 0.012 cm2/s and the bath's 0.25 mol/L of copper are assumed.
 *   Measurement: sheet resistance = resistivity / thickness, with the resistivity of bulk copper, 1.68e-6 ohm cm.
 *   Left out: the thicker deposit at the wafer's edge while the seed is thin (terminal effect), the additives that make
 *     a narrow feature fill from the bottom, voids, and the higher resistivity of a thin or burnt film. The film is
 *     taken as equally thick everywhere. The share of burnt film at which the wafer counts as burnt is assumed.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabPlating = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const constants = {
    faraday: 96485.33212,                                               // C/mol
    copper: { M: 63.546, n: 2, density: 8.96, resistivity: 1.68e-6 },   // g/mol, electrons per ion, g/cm3, ohm cm
    bath: { copper: 0.25, D: 6e-6, viscosity: 0.012 },                  // mol/L, cm2/s, cm2/s
    area: 707,                                                          // cm2 (a 300 mm wafer)
    current: { min: 0, max: 40, step: 0.5 },                            // A
    rotation: { min: 10, max: 120, step: 5 },                           // rpm
    travel: 3, rinse: 15, dry: 1200,                                    // s for the head to go down; s of rinse and spin dry after lifting; rpm while drying
    burnt: 0.05,                                                        // share of the film grown above the limit at which the wafer counts as burnt
    spec: { target: 800, tolerance: 80 },                               // nm of copper on the field
  };
  const K = constants, clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Growth of copper (nm per second) at a current density (A per cm2), all of the current depositing copper. */
  const rate = density => K.copper.M * density / (K.copper.n * K.faraday * K.copper.density) * 1e7;
  /** Copper (nm) that a charge (C) deposits over an area (cm2). */
  const thicknessOf = (charge, area = K.area) => K.copper.M * charge / (K.copper.n * K.faraday * K.copper.density * area) * 1e7;
  /** Largest current density (A per cm2) the bath can carry to a wafer turning at `rpm`. */
  const limit = rpm => 0.620 * K.copper.n * K.faraday * Math.pow(K.bath.D, 2 / 3) * Math.sqrt(2 * Math.PI * rpm / 60) * Math.pow(K.bath.viscosity, -1 / 6) * K.bath.copper / 1000;
  /** Sheet resistance (ohm per square) of a copper film of `nm`. */
  const sheet = nm => K.copper.resistivity / (nm * 1e-7);

  /** A plating cell handling one wafer. `wafer.seed` says whether the wafer has a conducting seed film. Times are seconds. */
  function create(options = {}) {
    const incoming = { seed: true, ...(options.wafer || {}) };
    const state = {
      time: 0, controls: { head: 0, current: 0, rotation: 30 },         // head: 0 up, 1 down in the bath
      head: 0, immersed: false, plating: false, over: false,            // over: the current is above what the bath can carry
      density: 0, limit: limit(30),                                     // A per cm2
      thickness: 0, burnt: 0, charge: 0, seconds: 0,                    // nm of copper, nm of it grown above the limit, C passed, s of plating
      wet: false, drying: 0, spin: 0,                                   // rinse and spin dry after the bath; rpm of the wafer
      peak: 0,                                                          // largest current used (A)
      history: [], result: null,
    };
    const flowing = () => state.immersed && state.controls.current > 0 && incoming.seed;      // by the controls as they are now, not as of the last step
    const snap = (value, { min, max, step }) => Math.round(clamp(Math.round(Number(value) / step) * step, min, max) * 100) / 100;
    /** head (0..1), current (A), rotation (rpm). Returns false when the move is refused: the head does not rise while current flows. */
    function setControl(name, value) {
      const c = state.controls;
      if (name === 'head') {
        const v = clamp(Number(value) || 0, 0, 1);
        if (flowing() && v < state.head - 0.002) return false;
        c.head = v;
      } else if (name === 'current') c.current = snap(value, K.current);
      else if (name === 'rotation') c.rotation = snap(value, K.rotation);
      else return false;
      return true;
    }
    function step(dt) {
      if (!(dt > 0)) return;
      const c = state.controls;
      state.time += dt;
      if (flowing()) c.head = 1;                                        // held down while current flows
      state.head += clamp(c.head - state.head, -dt / K.travel, dt / K.travel);
      state.immersed = state.head >= 0.98;
      if (state.immersed) { state.wet = true; state.drying = 0; }
      else if (state.wet && state.head <= 0.02) { state.drying += dt; if (state.drying >= K.rinse) { state.wet = false; state.drying = 0; } }
      state.limit = limit(c.rotation);
      state.plating = flowing();
      state.density = state.plating ? c.current / K.area : 0;
      state.over = state.plating && state.density > state.limit;
      state.spin = state.immersed ? c.rotation : state.wet && state.head <= 0.02 ? K.dry : 0;
      if (state.plating) {
        const grown = rate(Math.min(state.density, state.limit)) * dt;  // above the limit the rest of the current makes hydrogen
        state.thickness += grown; if (state.over) state.burnt += grown;
        state.charge += c.current * dt; state.seconds += dt; state.peak = Math.max(state.peak, c.current);
        const last = state.history.at(-1);
        if (!last || state.seconds - last.t >= 1) state.history.push({ t: state.seconds, nm: state.thickness });
      }
    }
    const canMeasure = () => state.head <= 0.02 && !state.wet;
    /** Four-point probe on the dry wafer: the sheet resistance and the thickness it stands for. Null while the wafer is in the bath or wet. */
    function measure() {
      if (!canMeasure()) return null;
      const t = state.thickness, S = K.spec;
      state.result = { thickness: t, sheet: t > 0 ? sheet(t) * 1000 : null, byCharge: thicknessOf(state.charge), burnt: t > 0 && state.burnt / t >= K.burnt,
        seconds: state.seconds, peak: state.peak, error: t - S.target, ok: false };
      state.result.ok = !state.result.burnt && Math.abs(state.result.error) <= S.tolerance;
      return state.result;
    }
    return { state, constants, incoming, setControl, step, canMeasure, measure };
  }

  return { constants, rate, thicknessOf, limit, sheet, create };
});
