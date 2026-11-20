/* CMP direct-operation experiment: the state of the tool from one wafer to the next.
 *
 * The process model (process-model.js) says how the settings change the removal rate, from textbook equations.
 * This file says how the tool itself differs from wafer to wafer, and that part is learned from data: the
 * state model of the lab simulator (lab-sim/state-model-v2.json, recipe A456), fitted on the PHM 2016 CMP
 * record, chronological folds 1 to 4. The numbers below are copied from that file; tests/tool-model.test.cjs
 * fails when the two differ.
 *
 *   level_t = mu + phi * (level_{t-1} - mu) + N(0, q)                      the tool drifts and comes back
 *   mrr_t   = level_t + first-wafer offsets + pad wear + N(0, r)           what one wafer gets
 *   ratio_t = mrr_t / mu                                                   what the process model multiplies by
 *
 * The record is on an unverified raw scale, so only the ratio to the mean is carried over, never the values.
 * What the record cannot say is not here: the effect of pressure, speed and slurry stays with the textbook.
 *
 * The same model also follows the tool the way an engineer would, from measurements alone (a Kalman filter on
 * the level): `observe` takes what one measured wafer showed, `predict` gives the 90 % range for a later one.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Lab3DTool = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MODEL = Object.freeze({
    version: 'state-kalman-v2', recipe: 'A456',
    fittedOn: 'PHM 2016 CMP training partition, chronological folds 1-4',
    mu: 77.44073116438356,                 // mean level the tool comes back to (raw scale of the record)
    phi: 0.900447475869727,                // how much of a deviation is left one wafer later
    q: 3.0646635975668812,                 // variance of the wafer-to-wafer step of the level
    r: 3.8581828815774766,                 // variance of one wafer around the level
    restOffset: 0.35782347460074376,       // first wafer after the tool stood still (standard error 0.50)
    padOffset: 1.0533065348837243,         // first wafer after a pad change (standard error 0.44)
    wearSlope: -0.0019833244141321546,     // per unit of pad usage
    wearRef: 166.74969189854323,           // pad usage at which the wear term is zero
    padStep: 5.925925925999991,            // pad usage one wafer adds
    restGap: 500,                          // seconds without polishing that count as standing still
    padUsageSeen: 351,                     // the most a pad was used in the record (column u_pad of the team's wafer table)
  });
  const Z90 = 1.6448536269514722;
  const RATIO_FLOOR = 0.5;                 // far outside what the model can produce (about 16 standard deviations)

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) { let u = 0; while (u === 0) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); }
  const offsetOf = (rested, afterPadChange) => (rested ? MODEL.restOffset : 0) + (afterPadChange ? MODEL.padOffset : 0);

  /** `noise: false` leaves the two random terms out, for tests and for a tool that stays at its mean. */
  function create(options = {}) {
    const rand = mulberry32((options.seed ?? 1) ^ 0x51ED270B), noisy = options.noise !== false, draw = sd => noisy ? sd * gauss(rand) : 0;
    let level = options.level ?? MODEL.mu + draw(Math.sqrt(MODEL.q / (1 - MODEL.phi * MODEL.phi)));   // somewhere in its usual range
    let padUsage = options.padUsage ?? MODEL.wearRef, wafers = 0, padChanges = 0, padIsNew = false;
    const seen = { level: null, variance: null, at: 0, updates: 0 };          // what the measurements have told so far

    /** The tool state the next wafer meets. Call it once, when that wafer is first pressed on the pad. */
    function next(context = {}) {
      const rested = Boolean(context.rested), afterPadChange = padIsNew;
      level = MODEL.mu + MODEL.phi * (level - MODEL.mu) + draw(Math.sqrt(MODEL.q));
      const offset = offsetOf(rested, afterPadChange), wear = MODEL.wearSlope * (padUsage - MODEL.wearRef), noise = draw(Math.sqrt(MODEL.r));
      const mrr = level + offset + wear + noise;
      wafers += 1;
      const out = { wafer: wafers, ratio: Math.max(RATIO_FLOOR, mrr / MODEL.mu), level, offset, wear, noise, rested, afterPadChange, padUsage,
        predicted: predict(wafers, { rested, afterPadChange }) };
      padUsage += MODEL.padStep; padIsNew = false;
      return out;
    }

    /** What the measurements so far say about wafer number `wafer`: the ratio and its 90 % range. Null before the first measurement. */
    function predict(wafer = wafers + 1, context = {}) {
      if (seen.level === null) return null;
      const steps = Math.max(wafer - seen.at, 1), variance = seen.variance + steps * MODEL.q;
      const mean = seen.level + offsetOf(context.rested, context.afterPadChange ?? (wafer > wafers && padIsNew)), sd = Math.sqrt(variance + MODEL.r);
      return { ratio: mean / MODEL.mu, low: (mean - Z90 * sd) / MODEL.mu, high: (mean + Z90 * sd) / MODEL.mu, sd: sd / MODEL.mu, steps, updates: seen.updates };
    }

    /** Takes in the ratio one measured wafer showed. A wafer no later than the last one taken in changes nothing. */
    function observe(wafer, ratio, context = {}) {
      if (!(Number.isFinite(ratio) && ratio > 0)) throw new Error('the observed ratio must be a positive number');
      const z = ratio * MODEL.mu - offsetOf(context.rested, context.afterPadChange);
      if (seen.level === null) { seen.level = z; seen.variance = MODEL.r; seen.at = wafer; }
      else {
        if (wafer <= seen.at) return false;
        const ahead = seen.variance + Math.max(wafer - seen.at, 1) * MODEL.q, gain = ahead / (ahead + MODEL.r);
        seen.level += gain * (z - seen.level); seen.variance = (1 - gain) * ahead; seen.at = wafer;
      }
      seen.updates += 1;
      return true;
    }

    /** A new pad: usage starts again, and the next wafer is the first one on it. */
    function replacePad() { padUsage = 0; padIsNew = true; padChanges += 1; }

    return {
      model: MODEL, next, predict, observe, replacePad,
      get status() { return { wafers, padUsage, padShare: padUsage / MODEL.padUsageSeen, padWafers: Math.round(padUsage / MODEL.padStep), padIsNew, padChanges, measured: seen.updates }; },
    };
  }

  return Object.freeze({ model: MODEL, create, Z90 });
});
