/* Copper electroplating for the process lab: how fast copper grows for a current (Faraday's law), how much current the
 * bath can carry to a rotating wafer (Levich's equation), where on the wafer the current goes while the film is thin
 * (terminal effect), how thick the film is from its sheet resistance, and a plating cell that runs in real time.
 * No DOM: loaded by the page and by tests/process-lab-plating.test.cjs.
 *
 * Where the numbers come from
 *   Growth: thickness per second = M i / (n F rho), with copper's M = 63.546 g/mol, n = 2, rho = 8.96 g/cm3 and
 *     F = 96485.33 C/mol. 10 mA/cm2 gives 220 nm per minute.
 *   Limit: on a rotating disc the current density cannot exceed i_L = 0.620 n F D^(2/3) w^(1/2) v^(-1/6) C (Levich's
 *     equation, w in rad/s). At the wafer the copper concentration is C (1 - i / i_L). Above the limit the extra current
 *     makes hydrogen and the deposit comes out dark and powdery ("burnt").
 *     D = 6e-6 cm2/s for the copper ion is a representative value (measurements in plating baths give 5 to 7e-6); the
 *     kinematic viscosity 0.012 cm2/s and the bath's 0.25 mol/L of copper are assumed.
 *   Where the copper goes (terminal effect): the wafer is contacted at its edge, so the current that enters the film
 *     at the centre has to run out through the film. Along the radius r, with the film's sheet conductance
 *     s = (seed + copper) / resistivity and the voltage V between the bath and the film,
 *         (1/r) d/dr ( r s dV/dr ) = i        the film collects the current that enters it
 *         V = b ln(i / i0) + Rc i             Tafel kinetics at the surface in series with the bath's resistance
 *         mean of i over the wafer = I / area  the rectifier holds the current
 *     i0 only shifts V and drops out. With b = 0 and uniform s this has the textbook answer i(r) = i(R) I0(r/L) / I0(R/L),
 *     L = sqrt(Rc s) (I0: modified Bessel function), which the tests use as a reference.
 *     - resistivity of the film while it is plated, 2.4e-6 ohm cm: US patent 6,074,544 (Reid et al., Novellus, 2000)
 *       gives 0.06 to 0.12 ohm per square for 0.40 to 0.20 um of seed and plated copper, which is this value.
 *     - b = 77 mV: fitted to FIG. 1 of the same patent (200 mm wafer, 43 nm seed, 500 nm plated: the edge about
 *       0.05 um thicker than the centre at 3.5 mA/cm2 and over 0.25 um at 15.8 mA/cm2). With Rc = 0 for that cell the
 *       model gives 0.066 and 0.26 um. It stands for a bath with additives; the 51 mV of a plain one-electron step
 *       (transfer coefficient 0.5) gives 0.10 and 0.36 um.
 *     - Rc = 30 ohm cm2 for this cell (bath and a diffuser plate in front of the wafer) and a 100 nm seed are
 *       representative values, not measured ones. With them the edge of an 800 nm film comes out about 80 nm thicker
 *       than the centre at 10 A. A cell with more resistance plates more evenly (US 7,622,024 puts a resistive plate
 *       close to the wafer for that); the patent above says seeds are 0.02 to 0.2 um.
 *   Measurement: sheet resistance = resistivity / thickness, with the resistivity of bulk copper, 1.68e-6 ohm cm.
 *   Left out: the current's own spreading in the bath (the bath is one resistance per area), the lower copper
 *     concentration at the surface in the kinetics (the current is cut off at the limit instead), the additives that make
 *     a narrow feature fill from the bottom, voids, and the higher resistivity of a burnt film. The share of burnt film
 *     at which a place counts as burnt is assumed.
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
    area: 707, radius: 15,                                              // cm2 and cm (a 300 mm wafer)
    nodes: 31,                                                          // places along the radius, centre to edge
    film: { seed: 100, resistivity: 2.4e-6 },                           // nm of copper seed under the plating; ohm cm of the film while it is plated
    tafel: 0.077, cell: 30,                                             // V (b in V = b ln(i / i0) + Rc i); ohm cm2 (Rc: the bath and the diffuser plate)
    current: { min: 0, max: 40, step: 0.5 },                            // A
    rotation: { min: 10, max: 120, step: 5 },                           // rpm
    travel: 3, rinse: 15, dry: 1200,                                    // s for the head to go down; s of rinse and spin dry after lifting; rpm while drying
    burnt: 0.05,                                                        // share of the film grown above the limit at which a place counts as burnt
    spec: { target: 800, tolerance: 80 },                               // nm of copper on the field, at every place of the wafer
  };
  const K = constants, N = K.nodes, clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  /** Share of the wafer's area that belongs to each place along the radius. */
  const weights = Float64Array.from({ length: N }, (_, j) => { const d = 1 / (N - 1), lo = Math.max(0, j * d - d / 2), hi = Math.min(1, j * d + d / 2); return hi * hi - lo * lo; });
  const areaMean = values => { let sum = 0; for (let j = 0; j < N; j++) sum += weights[j] * values[j]; return sum; };

  /** Growth of copper (nm per second) at a current density (A per cm2), all of the current depositing copper. */
  const rate = density => K.copper.M * density / (K.copper.n * K.faraday * K.copper.density) * 1e7;
  /** Copper (nm) that a charge (C) deposits over an area (cm2). */
  const thicknessOf = (charge, area = K.area) => K.copper.M * charge / (K.copper.n * K.faraday * K.copper.density * area) * 1e7;
  /** Largest current density (A per cm2) the bath can carry to a wafer turning at `rpm`. */
  const limit = rpm => 0.620 * K.copper.n * K.faraday * Math.pow(K.bath.D, 2 / 3) * Math.sqrt(2 * Math.PI * rpm / 60) * Math.pow(K.bath.viscosity, -1 / 6) * K.bath.copper / 1000;
  /** Sheet resistance (ohm per square) of a copper film of `nm`. */
  const sheet = nm => K.copper.resistivity / (nm * 1e-7);

  /**
   * Current density (A per cm2) at each place along the radius of a wafer contacted at its edge. `film`: nm of metal
   * (seed and plated) at each place; `mean`: the current over the wafer's area. Options: radius (cm), resistivity
   * (ohm cm), tafel (V), cell (ohm cm2), guess (a distribution to start from). See the head of this file.
   */
  function distribution(film, mean, options = {}) {
    const R = options.radius ?? K.radius, rho = options.resistivity ?? K.film.resistivity, b = Math.max(1e-9, options.tafel ?? K.tafel), Rc = options.cell ?? K.cell;
    const out = new Float64Array(N);
    if (!(mean > 0)) return out;
    const dr = R / (N - 1), s = Array.from(film, nm => Math.max(1e-3, nm) * 1e-7 / rho);
    const area = Array.from(weights, x => x * Math.PI * R * R);
    const g = Array.from({ length: N - 1 }, (_, j) => 2 * Math.PI * (j + 0.5) * dr * (2 * s[j] * s[j + 1] / (s[j] + s[j + 1])) / dr);   // conductance of the film between two neighbouring places
    const total = mean * Math.PI * R * R, n = N - 1;
    let i = options.guess && options.guess.length === N && options.guess[0] > 0 ? Array.from(options.guess) : new Array(N).fill(mean);
    { const sum = i.reduce((a, x, j) => a + x * area[j], 0); i = i.map(x => x * total / sum); }
    const currentAt = (v, start) => { let x = start; for (let k = 0; k < 50; k++) { const next = Math.max(x * 0.2, x - (b * Math.log(x) + Rc * x - v) / (b / x + Rc)); if (Math.abs(next - x) <= 1e-13 * x) return next; x = next; } return x; };
    const lo = new Array(n), di = new Array(n), up = new Array(n), ra = new Array(n), rb = new Array(n);
    const solve = rhs => {                                              // tridiagonal system (lo, di, up) x = rhs
      const c = up.slice(), d = rhs.slice(), m = di.slice(), x = new Array(n);
      for (let j = 1; j < n; j++) { const f = lo[j] / m[j - 1]; m[j] -= f * c[j - 1]; d[j] -= f * d[j - 1]; }
      x[n - 1] = d[n - 1] / m[n - 1]; for (let j = n - 2; j >= 0; j--) x[j] = (d[j] - c[j] * x[j + 1]) / m[j];
      return x;
    };
    for (let round = 0; round < 60; round++) {                          // Newton: i(V) made linear about the last answer
      const Vk = i.map(x => b * Math.log(x) + Rc * x), Rd = i.map(x => b / x + Rc);
      for (let j = 0; j < n; j++) {
        const left = j > 0 ? g[j - 1] : 0, right = g[j];
        lo[j] = -left; up[j] = j < n - 1 ? -right : 0; di[j] = left + right + area[j] / Rd[j];
        ra[j] = -area[j] * (i[j] - Vk[j] / Rd[j]); rb[j] = j === n - 1 ? right : 0;
      }
      const A = solve(ra), B = solve(rb);                               // V = A + E B for the voltage E at the contact
      let c0 = area[n] * (i[n] - Vk[n] / Rd[n]), c1 = area[n] / Rd[n];
      for (let j = 0; j < n; j++) { c0 += area[j] * (i[j] + (A[j] - Vk[j]) / Rd[j]); c1 += area[j] * B[j] / Rd[j]; }
      const E = (total - c0) / c1;                                      // the E that carries the whole current
      let change = 0;
      for (let j = 0; j < N; j++) { const next = currentAt(j < n ? A[j] + E * B[j] : E, i[j]); change = Math.max(change, Math.abs(next - i[j]) / mean); i[j] = next; }
      if (change < 1e-10) break;
    }
    const sum = i.reduce((a, x, j) => a + x * area[j], 0);
    for (let j = 0; j < N; j++) out[j] = i[j] * total / sum;
    return out;
  }

  /** A plating cell handling one wafer. `wafer.seed` says whether the wafer has a conducting seed film. Times are seconds. */
  function create(options = {}) {
    const incoming = { seed: true, ...(options.wafer || {}) };
    const state = {
      time: 0, controls: { head: 0, current: 0, rotation: 30 },         // head: 0 up, 1 down in the bath
      head: 0, immersed: false, plating: false, over: false,            // over: somewhere on the wafer the current is above what the bath can carry
      density: 0, limit: limit(30), centre: 0, edge: 0,                 // A per cm2: over the whole wafer, the limit, at the centre and at the edge
      thickness: 0, burnt: 0, charge: 0, seconds: 0,                    // nm of copper and nm of it grown above the limit (both over the whole wafer), C passed, s of plating
      profile: new Float64Array(N), scorched: new Float64Array(N),      // nm of copper, and nm of it grown above the limit, at each place from the centre to the edge
      wet: false, drying: 0, spin: 0,                                   // rinse and spin dry after the bath; rpm of the wafer
      peak: 0,                                                          // largest current used (A)
      history: [], result: null,
    };
    let shape = null;                                                   // the last distribution, to start the next one from
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
    /** Where the current goes now (A per cm2 at each place), for the controls as they are. */
    function spread() { return shape = distribution(Array.from(state.profile, nm => nm + K.film.seed), state.controls.current / K.area, { guess: shape }); }
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
      state.spin = state.immersed ? c.rotation : state.wet && state.head <= 0.02 ? K.dry : 0;
      if (!state.plating) { state.over = false; state.centre = state.edge = 0; return; }
      for (let left = dt; left > 1e-9;) {                               // the film changes where the current goes, so not more than a second at a time
        const h = Math.min(1, left), wanted = spread(); left -= h;
        for (let j = 0; j < N; j++) {
          const grown = rate(Math.min(wanted[j], state.limit)) * h;     // above the limit the rest of the current makes hydrogen
          state.profile[j] += grown; if (wanted[j] > state.limit) state.scorched[j] += grown;
        }
        state.centre = wanted[0]; state.edge = wanted[N - 1];
      }
      state.over = state.edge > state.limit;                            // the edge carries the most
      state.thickness = areaMean(state.profile); state.burnt = areaMean(state.scorched);
      state.charge += c.current * dt; state.seconds += dt; state.peak = Math.max(state.peak, c.current);
      const last = state.history.at(-1);
      if (!last || state.seconds - last.t >= 1) state.history.push({ t: state.seconds, nm: state.thickness, centre: state.profile[0], edge: state.profile[N - 1] });
    }
    /** Which places count as burnt: where at least the share `burnt` of the film grew above the limit. */
    const scorchedPlaces = () => Array.from(state.profile, (nm, j) => nm > 0 && state.scorched[j] / nm >= K.burnt);
    /** Share of the wafer's area that is burnt. */
    const burntShare = () => { const places = scorchedPlaces(); let sum = 0; for (let j = 0; j < N; j++) if (places[j]) sum += weights[j]; return sum; };
    const canMeasure = () => state.head <= 0.02 && !state.wet;
    /**
     * Four-point probe along the radius of the dry wafer: the sheet resistance and the thickness it stands for, at every
     * place. Null while the wafer is in the bath or wet. In the specification means every place is within the tolerance
     * and none is burnt: the polish that follows takes the same amount off everywhere.
     */
    function measure() {
      if (!canMeasure()) return null;
      const t = state.thickness, S = K.spec, profile = Array.from(state.profile), thinnest = Math.min(...profile), thickest = Math.max(...profile), scorched = scorchedPlaces(), share = burntShare();
      state.result = {
        thickness: t, centre: profile[0], edge: profile[N - 1], thinnest, thickest, profile, scorched,
        sheet: t > 0 ? sheet(t) * 1000 : null, byCharge: thicknessOf(state.charge), burnt: share > 0, burntShare: share,
        seconds: state.seconds, peak: state.peak, error: t - S.target, ok: false,
      };
      state.result.ok = t > 0 && share === 0 && thinnest >= S.target - S.tolerance && thickest <= S.target + S.tolerance;
      return state.result;
    }
    return { state, constants, incoming, setControl, step, spread, scorchedPlaces, burntShare, canMeasure, measure };
  }

  return { constants, weights, rate, thicknessOf, limit, sheet, distribution, create };
});
