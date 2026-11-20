/* Photolithography for the process lab: spin coating, the image of the mask on the wafer, development, and a
 * coat-expose-develop cell that runs in real time. No DOM: loaded by the page and by tests/process-lab-photo.test.cjs.
 *
 * Where the numbers come from
 *   Image: scalar diffraction imaging by Abbe's method. The mask repeats, so its light leaves in diffraction orders; the
 *     lens passes the orders that fit its numerical aperture; the image is the sum of the passed orders, added in
 *     intensity over the points of the light source (partial coherence), with the phase error of defocus on each order.
 *     This is the textbook treatment (for example C. Mack, "Fundamental Principles of Optical Lithography", 2007). It
 *     ignores polarisation, the resist's own optics (standing waves) and lens aberrations.
 *   Tool: an i-line stepper, wavelength 365 nm, NA 0.60, partial coherence 0.5. Representative values, not one machine.
 *   Resist thickness: proportional to 1 / sqrt(spin speed), the usual shape of a spin curve; 1,000 nm at 4,000 rpm is a
 *     representative point.
 *   Resist: a threshold model. The resist clears where the exposure dose reaching its bottom is at least the dose to clear.
 *     The dose to clear is 60 mJ/cm2 for 1,000 nm (i-line DNQ resists clear at some tens of mJ/cm2 and print 1 um
 *     features around 100) and grows with thickness by the unbleached absorption exp(0.65 / um), the sum of the Dill
 *     parameters A and B of such a resist (AZ 5200-E data: A = 0.62 / um, B = 0.03 / um). Bleaching during exposure and
 *     the development rate are not modelled, so the dose scale is representative while the shape of the image is computed.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabPhoto = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const constants = {
    wavelength: 365, NA: 0.60, sigma: 0.5,                         // nm, numerical aperture, partial coherence
    mask: { opening: 1000, pitch: 3000 },                          // nm at the wafer: a clear line in chrome, repeated
    spin: { reference: 4000, thickness: 1000, min: 1500, max: 6000, step: 50 },   // rpm and nm
    resist: { clear: 60, absorption: 0.65 },                       // mJ/cm2 to clear 1,000 nm, and 1/um
    dose: { min: 20, max: 400, step: 2 }, focus: { min: -4, max: 4, step: 0.1 },   // mJ/cm2 and um
    times: { coat: 30, bake: 60, field: 0.6, fields: 60, develop: 60 },             // s
    target: 1000, tolerance: 50,                                   // nm: opening asked by the run sheet
    focusDrift: 1.5,                                               // um: how far a wafer's best focus can lie from the tool's zero (assumed)
  };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const sinc = x => x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
  const SOURCE = Array.from({ length: 9 }, (_, i) => { const u = -0.94 + 1.88 * i / 8; return { u, weight: Math.sqrt(1 - u * u) }; });   // chords of a round source

  /** Resist thickness (nm) after spinning at `rpm`. */
  const thickness = rpm => constants.spin.thickness * Math.sqrt(constants.spin.reference / rpm);
  /** Dose (mJ/cm2) that clears a resist of the given thickness (nm). */
  const doseToClear = nm => constants.resist.clear * Math.exp(constants.resist.absorption * (nm - constants.spin.thickness) / 1000);

  /**
   * Intensity of the image across one pitch, relative to a clear field. `focus` in um.
   * Returns { x, intensity }: positions (nm) from -pitch/2 to +pitch/2, the opening centred on 0.
   */
  function aerialImage(focus = 0, options = {}) {
    const lambda = constants.wavelength, NA = options.NA ?? constants.NA, sigma = options.sigma ?? constants.sigma;
    const opening = options.opening ?? constants.mask.opening, pitch = options.pitch ?? constants.mask.pitch, samples = options.samples ?? 241;
    const cutoff = NA / lambda, z = focus * 1000, duty = opening / pitch, orders = Math.ceil(pitch * cutoff * (1 + sigma)) + 1;
    const x = new Float64Array(samples), intensity = new Float64Array(samples);
    for (let i = 0; i < samples; i++) x[i] = -pitch / 2 + pitch * i / (samples - 1);
    let total = 0;
    for (const { u, weight } of sigma > 0 ? SOURCE : [{ u: 0, weight: 1 }]) {
      const tilt = u * sigma * cutoff, passed = [];
      for (let n = -orders; n <= orders; n++) {
        const f = n / pitch + tilt;                               // where this order crosses the lens pupil
        if (Math.abs(f) > cutoff) continue;
        passed.push({ k: 2 * Math.PI * n / pitch, amplitude: duty * sinc(n * duty), phase: 2 * Math.PI * z * (Math.sqrt(1 / (lambda * lambda) - f * f) - 1 / lambda) });
      }
      for (let i = 0; i < samples; i++) {
        let re = 0, im = 0;
        for (const order of passed) { const a = order.k * x[i] + order.phase; re += order.amplitude * Math.cos(a); im += order.amplitude * Math.sin(a); }
        intensity[i] += weight * (re * re + im * im);
      }
      total += weight;
    }
    for (let i = 0; i < samples; i++) intensity[i] /= total;
    return { x, intensity };
  }

  /**
   * What development leaves: the width of the opening at the bottom of the resist.
   * `cleared` is false when the opening never clears; `washed` is true when even the dark area clears and no resist is left.
   */
  function develop({ thickness: nm, dose, focus }) {
    const image = aerialImage(focus), threshold = doseToClear(nm), n = image.x.length, mid = (n - 1) / 2;
    const exposure = Array.from(image.intensity, v => v * dose / threshold);       // 1 = just cleared
    const profile = Array.from(image.x, (x, i) => ({ x, exposure: exposure[i] }));
    const peak = exposure[mid], floor = Math.min(...exposure);
    if (floor >= 1) return { opening: 0, cleared: true, washed: true, peak, floor, profile };
    if (peak < 1) return { opening: 0, cleared: false, washed: false, peak, floor, profile };
    let edge = image.x[n - 1];
    for (let i = mid; i < n - 1; i++) if (exposure[i + 1] < 1) { edge = image.x[i] + (image.x[i + 1] - image.x[i]) * (exposure[i] - 1) / (exposure[i] - exposure[i + 1]); break; }
    return { opening: 2 * edge, cleared: true, washed: false, peak, floor, profile };
  }

  /** A coat, expose and develop cell handling one wafer. Times are seconds; `step(dt)` advances it. */
  function create(options = {}) {
    let seed = (options.seed ?? 1) >>> 0;
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const T = constants.times, state = {
      time: 0, controls: { spin: constants.spin.reference, dose: 100, focus: 0 },
      phase: 'bare',                              // bare, coating, coated, exposing, exposed, developing, developed
      progress: 0, rpm: 0, fields: 0, shutter: false,
      thickness: 0, used: null,                   // resist on the wafer (nm) and the settings it was exposed with
      bestFocus: Math.round((random() * 2 - 1) * constants.focusDrift * 10) / 10,   // where this wafer is in focus, on the focus dial (um)
      result: null, reworks: 0,
    };
    const snap = (value, { min, max, step }) => clamp(Math.round(Number(value) / step) * step, min, max);
    /** Dials: spin, dose, focus. Buttons: coat, expose, develop, strip. Returns false when the cell cannot do it now. */
    function setControl(name, value) {
      const c = state.controls;
      if (name === 'spin') c.spin = snap(value, constants.spin);
      else if (name === 'dose') c.dose = snap(value, constants.dose);
      else if (name === 'focus') c.focus = Math.round(snap(value, constants.focus) * 10) / 10;
      else if (name === 'coat') { if (state.phase !== 'bare') return false; state.phase = 'coating'; state.progress = 0; }
      else if (name === 'expose') { if (state.phase !== 'coated') return false; state.phase = 'exposing'; state.progress = 0; state.fields = 0; state.used = { dose: c.dose, focus: c.focus }; }
      else if (name === 'develop') { if (state.phase !== 'exposed') return false; state.phase = 'developing'; state.progress = 0; }
      else if (name === 'strip') { if (!['coated', 'exposed', 'developed'].includes(state.phase)) return false; state.phase = 'bare'; state.thickness = 0; state.fields = 0; state.used = null; state.result = null; state.reworks += 1; }
      else return false;
      return true;
    }
    function step(dt) {
      if (!(dt > 0)) return;
      state.time += dt; state.shutter = false;
      if (state.phase === 'coating') {
        state.progress = Math.min(1, state.progress + dt / (T.coat + T.bake));
        const spinning = state.progress * (T.coat + T.bake) < T.coat;
        state.rpm = spinning ? state.controls.spin : 0;
        state.thickness = thickness(state.controls.spin) * (spinning ? 1 + 2 * (1 - Math.min(1, state.progress * (T.coat + T.bake) / T.coat)) : 1);   // thins out while it spins
        if (state.progress >= 1) { state.phase = 'coated'; state.thickness = thickness(state.controls.spin); }
      } else if (state.phase === 'exposing') {
        state.progress = Math.min(1, state.progress + dt / (T.field * T.fields));
        state.fields = Math.min(T.fields, Math.floor(state.progress * T.fields)); state.shutter = state.progress < 1;
        if (state.progress >= 1) { state.phase = 'exposed'; state.fields = T.fields; }
      } else if (state.phase === 'developing') {
        state.progress = Math.min(1, state.progress + dt / T.develop);
        if (state.progress >= 1) {
          const d = develop({ thickness: state.thickness, dose: state.used.dose, focus: state.used.focus - state.bestFocus });
          const opening = d.cleared && !d.washed ? d.opening * (1 + 0.006 * (random() - 0.5)) : 0;                    // measurement scatter
          state.result = { ...d, opening, thickness: d.washed ? 0 : state.thickness, dose: state.used.dose, focus: state.used.focus, spin: state.controls.spin,
            error: opening - constants.target, ok: Math.abs(opening - constants.target) <= constants.tolerance };
          state.phase = 'developed';
        }
      }
    }
    return { state, constants, setControl, step };
  }

  return { constants, thickness, doseToClear, aerialImage, develop, create };
});
