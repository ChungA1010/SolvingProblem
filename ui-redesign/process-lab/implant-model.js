/* Ion implantation and the anneal after it, for the process lab: how deep the ions stop, the doping profile, what the
 * oxide lets through, how the anneal spreads the profile, where the junction ends up, and an implanter that runs in
 * real time. No DOM: loaded by the page and by tests/process-lab-implant.test.cjs.
 *
 * Where the numbers come from
 *   Range: the ion loses energy to the nuclei and to the electrons of the target. Nuclear stopping is the universal
 *     formula of Ziegler, Biersack and Littmark (1985) with its published constants; electronic stopping is Lindhard and
 *     Scharff's, proportional to the ion's velocity. The projected range comes from Biersack's projected range algorithm
 *     in its first order, dRp/dE = (1 - mu Sn Rp / 2E) / St with mu = M2 / M1, which accounts for the ion being turned
 *     aside by nuclear collisions; the straggle is the LSS estimate dRp = (2/3) Rp sqrt(M1 M2) / (M1 + M2). For the oxide
 *     the terms of silicon and oxygen are added (Bragg's rule). For phosphorus in silicon this gives 0.133 um at 100 keV
 *     and 0.200 um with a straggle of 0.067 um at 150 keV; lecture examples quote about 0.12 um at 100 keV and 0.2 um
 *     with 0.06 um at 150 keV. It is an analytic estimate, not a Monte Carlo calculation; it leaves out channeling and
 *     has not been compared line by line with a published range table.
 *   Profile: Gaussian, N(x) = Q / (sqrt(2 pi) s) exp(-(x - Rp)^2 / 2 s^2), with s^2 = dRp^2 + 2 D t after the anneals.
 *     The surface is not treated as a boundary (the textbook form).
 *   Mask: the concentration that arrives at the silicon under an oxide of thickness d is the same Gaussian with the
 *     range and straggle in the oxide, taken at d. The oxide masks when that stays below the doping of the substrate.
 *     The share of the dose that gets through is erfc((d - Rp) / (sqrt 2 dRp)) / 2.
 *   Anneal: phosphorus in silicon, D = 3.85 cm2/s exp(-3.66 eV / kT) (Fair's intrinsic term as lecture notes quote it;
 *     3e-15 cm2/s at 950 C). Faster diffusion at high concentration, the ramps and the share of the dopant that becomes
 *     electrically active are left out.
 *   Substrate: boron-doped, from its resistivity with a hole mobility of 470 cm2/Vs (the low-doping value).
 *   Beam: the source runs on phosphine (PH3) and gives more than phosphorus ions: H+, H2+, H3+, P2+ (doubly charged), P+,
 *     PH+, PH2+, PH3+ and the molecule P2+. The ions are extracted at 30 kV and bent 90 degrees in the analyser magnet;
 *     only those with B rho = sqrt(2 m V / q) pass the resolving slit (rho = 0.40 m), so the field picks one mass over
 *     charge. Each passes with a Gaussian of full width m / 60 (the resolving power). Afterwards the ions are accelerated
 *     to the energy set, which a singly charged ion gets; a doubly charged one gets twice that. The dose counter takes
 *     every ion as singly charged. A molecular ion breaks up on impact and its atoms share its energy by mass: P2+ puts
 *     two atoms in at half the energy each, PH+ one at 31/32 of it. The shares of the ions, the radius, the extraction
 *     voltage and the resolving power are representative values; the relation B rho = sqrt(2 m V / q) is exact.
 *   The beam current, the wafer area, the dial ranges and the run sheet's targets are representative.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabImplant = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const KB = 8.617333262e-5, Q_E = 1.602176634e-19;
  const ATOMS = { P: { Z: 15, M: 30.974 }, Si: { Z: 14, M: 28.086 }, O: { Z: 8, M: 15.999 } };
  const TARGETS = {
    silicon: { parts: [['Si', 4.996e22]], mass: 28.086 },                                  // atoms per cm3
    oxide: { parts: [['Si', 2.275e22], ['O', 4.55e22]], mass: (28.086 + 2 * 15.999) / 3 }, // SiO2 at 2.27 g/cm3; the mean atomic mass is used for the straggle
  };
  const constants = {
    ion: 'P',
    energy: { min: 20, max: 200, step: 5 },                        // keV
    dose: { min: 13, max: 16, step: 0.1 },                         // log10 of ions per cm2
    anneal: { temperature: { min: 800, max: 1100, step: 10 }, minutes: { min: 1, max: 60, step: 1 } },
    diffusion: { D0: 3.85, Ea: 3.66 },                             // cm2/s and eV
    holeMobility: 470,                                             // cm2/Vs
    beam: { current: 1e-3, area: 707, least: 5e-6 },               // A of P+ when the magnet is on its peak; cm2 (a 300 mm wafer); A below which there is no beam to implant with
    source: {
      extraction: 30, radius: 0.40, resolution: 60, sweep: 8,      // kV; m (bending radius of the analyser); m / dm at the slit (full width); s for a mass scan
      current: 2.5e-3,                                             // A of all the ions the source gives
      ions: [                                                      // mass (amu), charge, phosphorus atoms, share of the source current
        { name: 'H⁺', mass: 1.008, charge: 1, P: 0, share: 0.18 }, { name: 'H₂⁺', mass: 2.016, charge: 1, P: 0, share: 0.05 }, { name: 'H₃⁺', mass: 3.024, charge: 1, P: 0, share: 0.03 },
        { name: 'P²⁺', mass: 30.974, charge: 2, P: 1, share: 0.03 }, { name: 'P⁺', mass: 30.974, charge: 1, P: 1, share: 0.40 }, { name: 'PH⁺', mass: 31.982, charge: 1, P: 1, share: 0.14 },
        { name: 'PH₂⁺', mass: 32.990, charge: 1, P: 1, share: 0.10 }, { name: 'PH₃⁺', mass: 33.998, charge: 1, P: 1, share: 0.03 }, { name: 'P₂⁺', mass: 61.948, charge: 1, P: 2, share: 0.04 },
      ],
    },
    field: { min: 0.05, max: 0.60, step: 0.0005 },                 // T of the analyser magnet
    transfer: 4,                                                   // s to move the wafer into the anneal chamber
    tilt: 7,                                                       // degrees between the beam and the wafer's normal, against channeling
    spec: { junction: { target: 300, tolerance: 50 }, surface: 1e19 },   // nm, and phosphorus per cm3 at the surface for a low-resistance contact
  };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Stopping cross-section (eV cm2 per atom) of the ion at `keV` in atoms of one kind: nuclear (ZBL universal) plus electronic (Lindhard-Scharff). */
  function stopping(ion, atom, keV) {
    const a = ATOMS[ion], b = ATOMS[atom], screen = Math.pow(a.Z, 0.23) + Math.pow(b.Z, 0.23);
    const eps = 32.53 * b.M * keV / (a.Z * b.Z * (a.M + b.M) * screen);
    const reduced = eps <= 30 ? Math.log(1 + 1.1383 * eps) / (2 * (eps + 0.01321 * Math.pow(eps, 0.21226) + 0.19593 * Math.sqrt(eps))) : Math.log(eps) / (2 * eps);
    const nuclear = 8.462e-15 * a.Z * b.Z * a.M * reduced / ((a.M + b.M) * screen);
    // 8 pi e^2 a0 = 191.4 eV A^2; the ion's velocity over the Bohr velocity is sqrt(E / (24.8 keV per amu))
    const electronic = 191.4e-16 * Math.pow(a.Z, 7 / 6) * b.Z / Math.pow(Math.pow(a.Z, 2 / 3) + Math.pow(b.Z, 2 / 3), 1.5) * Math.sqrt(keV / (24.8 * a.M));
    return { nuclear, electronic, total: nuclear + electronic };
  }
  const ranges = new Map();
  /** Path length, projected range and straggle (nm) of the ion at `keV` in 'silicon' or 'oxide'. */
  function range(keV, target = 'silicon', ion = constants.ion) {
    const key = `${ion}|${target}|${keV}`;
    if (ranges.has(key)) return ranges.get(key);
    const t = TARGETS[target], M1 = ATOMS[ion].M, steps = 1500, low = 0.02;
    let path = 0, projected = 0;                                  // cm, stepping up a logarithmic energy grid
    for (let i = 0; i < steps; i++) {
      const e0 = low * Math.pow(keV / low, i / steps), e1 = low * Math.pow(keV / low, (i + 1) / steps), mid = Math.sqrt(e0 * e1);
      let loss = 0, turning = 0;                                  // eV per cm: all stopping, and nuclear stopping weighted by the mass ratio
      for (const [atom, density] of t.parts) { const s = stopping(ion, atom, mid); loss += density * s.total; turning += density * s.nuclear * ATOMS[atom].M / M1; }
      path += (e1 - e0) * 1000 / loss;
      projected += (e1 - e0) * 1000 * (1 - turning * projected / (2 * mid * 1000)) / loss;
    }
    const out = { path: path * 1e7, projected: projected * 1e7, straggle: 2 / 3 * projected * Math.sqrt(M1 * t.mass) / (M1 + t.mass) * 1e7 };
    if (ranges.size < 400) ranges.set(key, out);
    return out;
  }
  /** Complementary error function (Abramowitz and Stegun 7.1.26; error below 1.5e-7). */
  function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + 0.3275911 * z);
    const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-z * z);
    return x >= 0 ? y : 2 - y;
  }
  /** Share of the dose that passes an oxide of `nm`. */
  function throughOxide(keV, nm) { const r = range(keV, 'oxide'); return 0.5 * erfc((nm - r.projected) / (Math.SQRT2 * r.straggle)); }
  /** Concentration (per cm3) that arrives at the bottom of an oxide of `nm`, as implanted. */
  function underOxide(keV, dose, nm) { const r = range(keV, 'oxide'); return dose / (Math.sqrt(2 * Math.PI) * r.straggle * 1e-7) * Math.exp(-((nm - r.projected) ** 2) / (2 * r.straggle ** 2)); }
  /** Diffusivity of phosphorus in silicon (cm2/s) at a temperature in C. */
  const diffusivity = celsius => constants.diffusion.D0 * Math.exp(-constants.diffusion.Ea / (KB * (celsius + 273.15)));
  /** Acceptor concentration (per cm3) of a p-type substrate of the given resistivity (ohm cm). */
  const substrateDoping = resistivity => 1 / (Q_E * constants.holeMobility * resistivity);
  /** Seconds a beam of the given current density (A per cm2) needs for a dose (ions per cm2). */
  const implantSeconds = (dose, density = constants.beam.current / constants.beam.area) => dose * Q_E / density;

  /**
   * Phosphorus in the silicon after an implant of `dose` (ions per cm2) at `keV`, spread by the diffusion `Dt` (cm2: the
   * sum of D t over the anneals), on a background of `substrate` per cm3. `screen` (nm) is oxide lying on the silicon
   * where the ions enter; it counts as the silicon that stops as much. `range` and `straggle` (nm) may be given instead
   * of `keV`. Depths are nm below the silicon surface, concentrations per cm3.
   */
  function profile({ keV, dose, Dt = 0, substrate, screen = 0, range: given, straggle: givenStraggle }) {
    const r = given != null ? { projected: given, straggle: givenStraggle } : range(keV);
    const centre = r.projected - (screen > 0 ? screen * (given != null ? 1 : r.projected / range(keV, 'oxide').projected) : 0);
    const spread = Math.sqrt(r.straggle * r.straggle + 2 * Dt * 1e14);                        // cm2 to nm2
    const peak = dose / (Math.sqrt(2 * Math.PI) * spread * 1e-7);
    const at = nm => peak * Math.exp(-((nm - centre) ** 2) / (2 * spread * spread));
    const top = centre > 0 ? peak : at(0);                                                    // the highest concentration inside the silicon
    const junction = top > substrate ? centre + spread * Math.sqrt(2 * Math.log(peak / substrate)) : 0;
    return { range: r.projected, straggle: r.straggle, centre, spread, peak, top, surface: at(0), junction, at };
  }

  /** Phosphorus from several parts at once ([{ keV, dose }]): the Gaussians add, and the junction is the deepest point where they reach the substrate's doping. */
  function blend({ parts, Dt = 0, substrate, screen = 0 }) {
    if (!parts.length) return { ...profile({ keV: 50, dose: 0, Dt, substrate, screen }), parts: [] };
    if (parts.length === 1) return { ...profile({ keV: parts[0].keV, dose: parts[0].dose, Dt, substrate, screen }), parts };
    const each = parts.map(p => profile({ keV: p.keV, dose: p.dose, Dt, substrate, screen }));
    const main = each.reduce((a, b) => (b.peak * b.spread > a.peak * a.spread ? b : a));                     // the part with the most dose
    const at = nm => each.reduce((sum, p) => sum + p.at(nm), 0), far = Math.max(...each.map(p => p.centre + 8 * p.spread));
    let top = 0, last = -1;
    for (let x = 0; x <= far; x += 1) { const n = at(x); top = Math.max(top, n); if (n > substrate) last = x; }   // the deepest nm still above the substrate
    let junction = 0;
    if (last >= 0) { let lo = last, hi = last + 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (at(mid) > substrate) lo = mid; else hi = mid; } junction = (lo + hi) / 2; }
    return { range: main.range, straggle: main.straggle, centre: main.centre, spread: main.spread, peak: top, top, surface: at(0), junction, at, parts };
  }

  const AMU = 1.66053906660e-27, S = constants.source;
  /** Mass over charge (amu per elementary charge) that the analyser magnet passes at a field of `tesla`: B rho = sqrt(2 m V / q). */
  const massAt = tesla => tesla * tesla * S.radius * S.radius * Q_E / (2 * S.extraction * 1e3 * AMU);
  /** The field (T) that passes `mq` amu per elementary charge. */
  const fieldFor = mq => Math.sqrt(2 * mq * AMU * S.extraction * 1e3 / Q_E) / S.radius;
  /** The ions that pass the resolving slit at `tesla`, each with the current (A) it carries. */
  function beamAt(tesla) {
    const M = massAt(tesla);
    return S.ions.map(ion => { const mq = ion.mass / ion.charge, sigma = mq / S.resolution / 2.3548; return { ...ion, mq, current: S.current * ion.share * Math.exp(-((M - mq) ** 2) / (2 * sigma * sigma)) }; });
  }
  /** Beam current (A) through the slit at `tesla`. */
  const beamCurrent = tesla => beamAt(tesla).reduce((sum, ion) => sum + ion.current, 0);
  /**
   * What a beam leaves when the dose counter reads `dose` (charges per cm2: the counter takes every ion as singly charged),
   * with the energy set to `keV`: for every kind of ion that carries phosphorus, its atoms per cm2 and the energy each atom
   * has (the ion's charge x keV, shared among its atoms by mass), and the ion's share of the beam current.
   */
  function delivered(tesla, keV, dose) {
    const all = beamAt(tesla), whole = all.reduce((sum, ion) => sum + ion.current, 0);
    const ions = all.filter(ion => ion.current > whole * 1e-4), total = ions.reduce((sum, ion) => sum + ion.current, 0);      // traces below 0.01% of the beam are left out
    if (!(total > 0)) return [];
    return ions.filter(ion => ion.P > 0).map(ion => ({ name: ion.name, dose: dose * ion.current / total * ion.P / ion.charge, keV: ion.charge * keV * ATOMS.P.M / ion.mass, share: ion.current / total }));
  }
  /** The ions in the beam at `tesla` with at least `least` of its current, the largest first: [{ name, share }]. */
  function ionsAt(tesla, least = 0.01) {
    const ions = beamAt(tesla), total = ions.reduce((sum, ion) => sum + ion.current, 0);
    return total > 0 ? ions.map(ion => ({ name: ion.name, share: ion.current / total })).filter(ion => ion.share >= least).sort((a, b) => b.share - a.share) : [];
  }
  /** A mass scan over the whole field range: [{ tesla, mass (amu per charge), current (A) }], with the top and the flanks of every peak in it. */
  const SPECTRUM = (() => {
    const f = constants.field, lo = massAt(f.min), hi = massAt(f.max), masses = [];
    for (let m = lo; m <= hi; m += 0.05) masses.push(m);
    for (const ion of S.ions) { const mq = ion.mass / ion.charge, sigma = mq / S.resolution / 2.3548; for (const k of [-2, -1, -0.5, 0, 0.5, 1, 2]) masses.push(mq + k * sigma); }
    return masses.filter(m => m >= lo && m <= hi).sort((a, b) => a - b).map(m => { const tesla = fieldFor(m); return { tesla, mass: m, current: beamCurrent(tesla) }; });
  })();

  /**
   * An implanter with an anneal chamber, handling one wafer. `wafer` gives { oxide (nm of field oxide; 0 for none),
   * windows (there are windows in it), left (nm of oxide left in the windows; 0 when they are open), resistivity }.
   * The analyser magnet starts on the P+ peak unless `field` says otherwise. Times are seconds.
   */
  function create(options = {}) {
    const incoming = { oxide: 500, windows: true, left: 0, resistivity: 10, ...(options.wafer || {}) };
    const substrate = substrateDoping(incoming.resistivity), A = constants.anneal, bare = !(incoming.oxide > 0), start = options.field ?? fieldFor(ATOMS.P.M);
    const state = {
      time: 0, controls: { field: start, energy: 100, dose: 14, temperature: 900, minutes: 10 },
      phase: 'ready',                           // ready, implanting, implanted, annealing, done
      field: start, current: beamCurrent(start), // the analyser's field (T) as it is (it sweeps during a scan), and the beam current through the slit (A)
      scan: null, spectrum: [],                 // the scan going on { elapsed }, and the points measured so far
      progress: 0, beam: false, hot: 25,        // hot: temperature of the anneal chamber (C)
      counted: 0,                               // ions per cm2 the dose counter has counted so far
      used: null,                               // { keV, dose, field, current, parts, ions } the wafer is being or was implanted with
      Dt: 0, anneals: [], running: null,        // diffusion so far (cm2), the anneals done, the anneal going on { celsius, minutes, elapsed }
      result: null,
    };
    const snap = (value, { min, max, step }) => Math.round(clamp(Math.round(Number(value) / step) * step, min, max) * 1e6) / 1e6;
    /** Dials: field, energy, dose (log10), temperature, minutes. Buttons: scan, implant, anneal. Returns false when it cannot be done now. */
    function setControl(name, value) {
      const c = state.controls;
      if (name === 'field') { if (state.phase === 'implanting' || state.scan) return false; c.field = snap(value, constants.field); }
      else if (name === 'energy') c.energy = snap(value, constants.energy);
      else if (name === 'dose') c.dose = snap(value, constants.dose);
      else if (name === 'temperature') c.temperature = snap(value, A.temperature);
      else if (name === 'minutes') c.minutes = snap(value, A.minutes);
      else if (name === 'scan') { if (state.phase !== 'ready' || state.scan) return false; state.scan = { elapsed: 0 }; state.spectrum = []; }
      else if (name === 'implant') {
        const current = beamCurrent(c.field);
        if (state.phase !== 'ready' || state.scan || current < constants.beam.least) return false;
        const dose = Math.pow(10, c.dose);
        state.phase = 'implanting'; state.progress = 0; state.used = { keV: c.energy, dose, field: c.field, current, parts: delivered(c.field, c.energy, dose), ions: ionsAt(c.field) };
      } else if (name === 'anneal') {                             // may be repeated: every anneal adds to the diffusion
        if (state.phase !== 'implanted' && state.phase !== 'done') return false;
        state.phase = 'annealing'; state.progress = 0; state.result = null; state.running = { celsius: c.temperature, minutes: c.minutes, elapsed: 0 };
      } else return false;
      return true;
    }
    function step(dt) {
      if (!(dt > 0)) return;
      state.time += dt; state.beam = false;
      if (state.scan) {                                           // the magnet sweeps from the lowest to the highest field; the Faraday cup reads the current
        const f = constants.field, sc = state.scan; sc.elapsed = Math.min(S.sweep, sc.elapsed + dt);
        state.field = f.min + (f.max - f.min) * sc.elapsed / S.sweep;
        while (state.spectrum.length < SPECTRUM.length && SPECTRUM[state.spectrum.length].tesla <= state.field) state.spectrum.push(SPECTRUM[state.spectrum.length]);
        if (sc.elapsed >= S.sweep) state.scan = null;
      }
      if (!state.scan) state.field = state.controls.field;
      state.current = beamCurrent(state.field);
      if (state.phase === 'implanting') {
        state.progress = Math.min(1, state.progress + dt / implantSeconds(state.used.dose, state.used.current / constants.beam.area)); state.counted = state.used.dose * state.progress; state.beam = state.progress < 1;
        if (state.progress >= 1) state.phase = 'implanted';
      } else if (state.phase === 'annealing') {
        const run = state.running, total = constants.transfer + run.minutes * 60, before = run.elapsed;
        run.elapsed = Math.min(total, before + dt);
        state.Dt += diffusivity(run.celsius) * (Math.max(0, run.elapsed - constants.transfer) - Math.max(0, before - constants.transfer));
        state.progress = run.elapsed / total; state.hot = run.elapsed > constants.transfer ? run.celsius : 25;
        if (run.elapsed >= total) { state.anneals.push({ celsius: run.celsius, minutes: run.minutes }); state.running = null; state.phase = 'done'; state.hot = 25; state.result = measure(); }
      }
    }
    /**
     * What an implant spread by Dt leaves on this wafer: where the ions enter the silicon, and under the oxide beside.
     * `parts`: phosphorus atoms per cm2 at keV each; or { keV, dose } for phosphorus ions alone.
     */
    function outcome({ parts: given, keV, dose, Dt = 0 }) {
      const parts = given || [{ keV, dose }];
      const p = blend({ parts, Dt, substrate, screen: bare ? 0 : incoming.windows ? incoming.left : incoming.oxide });
      const total = parts.reduce((sum, q) => sum + q.dose, 0);
      const under = bare ? p.surface : parts.reduce((sum, q) => sum + underOxide(q.keV, q.dose, incoming.oxide), 0);
      const share = bare ? 1 : total > 0 ? parts.reduce((sum, q) => sum + q.dose * throughOxide(q.keV, incoming.oxide), 0) / total : 0;
      return { ...p, substrate, share, under, masked: !bare && under < substrate, reached: p.junction > 0 };
    }
    const scaled = (parts, k) => parts.map(p => ({ ...p, dose: p.dose * k }));
    /** The wafer as it is now: null before any ion is in. */
    const now = () => state.counted > 0 ? outcome({ parts: scaled(state.used.parts, state.counted / state.used.dose), Dt: state.Dt }) : null;
    /** The wafer as it will leave if nothing more is changed: the implant and the anneal still to come go by the dials. */
    function outlook() {
      const c = state.controls, s = state, run = s.running;
      const parts = s.used ? s.used.parts : delivered(c.field, c.energy, Math.pow(10, c.dose));
      const ahead = s.phase === 'done' ? 0 : run ? diffusivity(run.celsius) * (run.minutes * 60 - Math.max(0, run.elapsed - constants.transfer)) : diffusivity(c.temperature) * c.minutes * 60;
      return outcome({ parts, Dt: s.Dt + ahead });
    }
    function measure() {
      const o = outcome({ parts: state.used.parts, Dt: state.Dt }), S2 = constants.spec;
      const depth = o.reached && Math.abs(o.junction - S2.junction.target) <= S2.junction.tolerance;
      return { ...o, keV: state.used.keV, dose: state.used.dose, ions: state.used.ions, anneals: state.anneals.slice(), error: o.junction - S2.junction.target,
        ok: depth && o.masked && incoming.windows && !(incoming.left > 0) && o.surface >= S2.surface };
    }
    return { state, constants, incoming, substrate, setControl, step, outcome, now, outlook };
  }

  return { constants, stopping, range, erfc, throughOxide, underOxide, diffusivity, substrateDoping, implantSeconds, profile, blend, massAt, fieldFor, beamAt, beamCurrent, delivered, ionsAt, spectrum: () => SPECTRUM, create };
});
