/* CMP direct-operation experiment: process model.
 *
 * Real-time model of one oxide polish on a rotary polisher. Everything here is a textbook equation or a
 * stated simplification. Nominal values are typical 300 mm oxide CMP numbers, not this tool's.
 * One factor can come from data: `level`. Given a tool (tool-model.js, learned from the PHM 2016 record), each
 * wafer meets the state the tool is in when it is first pressed on the pad. Without a tool, `level` stays put.
 *
 *   removal rate(r) = rateRef * level * P(r)/Pref * v(r)/Vref * slurry(r) * pad * temperature * contact
 *
 *   P(r)         Preston: proportional to pressure; the pad rebounds at the wafer edge (simplified edge term);
 *                the carrier's zone balance moves pressure between wafer centre and edge (simplified to a parabola)
 *   v(r)         time-averaged relative speed from platen and carrier rotation (exact kinematics)
 *   slurry       saturating in pad wetness; a starved pad feeds the wafer centre last (simplified)
 *   pad          glazing lowers the rate, conditioning restores it (first-order, simplified)
 *   temperature  frictional heating ~ mu*P*v, Arrhenius factor on the rate
 *   contact      hydroplaning when speed is high for the pressure (Stribeck-type roll-off, simplified)
 *
 * After the polish (only with `create({ cleaning: true })`): a polished wafer leaves the pad wet and carrying slurry
 * particles. The cleaner scrubs, rinses and spin-dries it; each wet step removes particles first-order in time.
 * The particle counts, the time constants and the step times are assumptions, shortened so a lesson can show them.
 * The operator sets how far the brush is pressed into the wafer (the scrub is that much faster; pressed too far it
 * scratches) and may end a step early.
 *
 * From wafer to wafer (both optional, both assumptions shortened for a lesson):
 *   `wear`  the conditioner cuts the pad, so a pad lasts only so many seconds of conditioning; a pad that is worn out
 *           can no longer be conditioned and has to be changed, which stops the tool for a while
 *   `lot`   wafers are counted in lots: how many passed, how long the lot took, good wafers per hour
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Lab3DProcess = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const C = Object.freeze({
    waferRadius: 0.150, platenRadius: 0.380, centerDistance: 0.190,   // m
    headTravel: 0.120,                                                  // m, raised height above the pad
    pressureRef: 3.0, pressureMax: 7.0,                                 // psi
    platenRef: 90, carrierRef: 87, rpmMax: 150,                         // rpm
    slurryRef: 200, slurryMax: 400,                                     // mL/min
    zoneMax: 0.15,                                                      // centre/edge pressure balance, fraction of the set pressure
    rateRef: 250,                                                       // nm/min at the reference condition
    ambient: 22, tempRef: 45, tempAlarm: 68,                            // deg C
    filmStart: 1000, target: 550, targetTol: 25, wiwnuMax: 3.0,         // nm, nm, % (1 sigma, 49 points)
    cleanScrub: 20, cleanRinse: 10, cleanDry: 15,                       // s, steps of the post-CMP clean (assumed, shortened)
    particlesMax: 30,                                                   // particles left on a wafer that may go on (assumed)
    handlingTime: 30, parallelModules: 4,                               // s of wafer transfer per wafer; polishing modules of a production line (both assumed)
    brushRef: 1.0, brushMax: 2.0, brushSafe: 1.5,                       // mm the scrub brush is pressed into the wafer; beyond brushSafe it scratches (assumed)
    padLife: 800, exSituMax: 30, padChangeTime: 300,                    // s of conditioning a pad lasts; s one conditioning between wafers counts for; s a pad change stops the tool (assumed, shortened)
    lotSize: 5,                                                         // wafers in a lot (a production carrier holds 25)
    nodes: 31,
  });

  const RPM = 2 * Math.PI / 60;
  const HEAD_SPEED = 0.06;            // m/s
  const TAU_PRESSURE = 0.35, TAU_PLATEN = 1.2, TAU_CARRIER = 0.8, TAU_FLOW = 0.5;   // s
  const TAU_FILL = 2.5, TAU_DRAIN = 7, DRAIN_STILL = 0.15;
  const SLURRY_HALF = 0.2, STARVE = 0.35;
  const TAU_GLAZE = 300, TAU_COND = 18, PAD_FLOOR = 0.4;
  const EDGE_LENGTH = 0.010, EDGE_BASE = 0.07, EDGE_SLOPE = 0.05;
  const ACTIVATION = 5000, GAS = 8.314;                                 // J/mol
  const DT_REF = 23, TAU_HEAT = 12, TAU_COOL = 25;
  const MU_WET = 0.30, MU_DRY = 0.25;
  const HYDRO_S = 3, HYDRO_POWER = 5;
  const RINGS = Object.freeze([[0, 1], [0.049, 8], [0.098, 16], [0.147, 24]]);   // 49-point pattern
  /** The share of the wafer's area one point of each ring stands for: the ring's band (half-way to its neighbours, the last one out to the edge) over its points. The outer ring's points lie closer together: each counts for about half of one of the others. */
  const POINT_AREA = Object.freeze(RINGS.map(([r, count], k) => { const inner = k ? (RINGS[k - 1][0] + r) / 2 : 0, outer = k < RINGS.length - 1 ? (r + RINGS[k + 1][0]) / 2 : C.waferRadius; return (outer * outer - inner * inner) / (C.waferRadius * C.waferRadius) / count; }));
  const TOOL_MIN_REMOVED = 20;        // nm; a wafer polished less than this says nothing about the tool
  const PARTICLES_POLISHED = 2000, PARTICLES_SPREAD = 0.15;             // particles on a wafer as it leaves the pad, and their wafer-to-wafer spread
  const PARTICLES_INCOMING = 2;
  const TAU_SCRUB = 4, TAU_RINSE = 6;                                   // s
  const CLEAN_STEPS = Object.freeze(['scrub', 'rinse', 'dry']);
  const SAMPLE_EVERY = 0.5, HISTORY_MAX = 1200;                          // the record of a polish: a sample every half second, thinned to every second one when it is full
  const BRUSH_SCRATCH = 0.15;                                           // scratches per second of scrub with the brush pressed in all the way

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lag = (h, tau) => 1 - Math.exp(-h / tau);

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) { let u = 0; while (u === 0) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); }

  /** Relative speed between pad and wafer at wafer radius r, averaged over one wafer revolution (m/s).
   *  |w_p x R_cc + (w_p - w_c) x r|: uniform over the wafer only when both turn at the same speed. */
  function meanSpeed(platenRpm, carrierRpm, r) {
    const a = platenRpm * RPM * C.centerDistance, b = (platenRpm - carrierRpm) * RPM * r, n = 16;
    let sum = 0;
    for (let k = 0; k < n; k++) sum += Math.sqrt(Math.max(0, a * a + b * b + 2 * a * b * Math.cos((k + 0.5) * 2 * Math.PI / n)));
    return sum / n;
  }
  const V_REF = meanSpeed(C.platenRef, C.carrierRef, 0);
  const slurryFactor = c => c / (c + SLURRY_HALF);
  const coverageSteady = (flow, platenRpm) => {
    const fill = (flow / C.slurryRef) / TAU_FILL, drain = (DRAIN_STILL + (platenRpm / C.platenRef) ** 2) / TAU_DRAIN;
    return fill / (fill + drain);
  };
  const COVERAGE_REF = coverageSteady(C.slurryRef, C.platenRef);
  const SLURRY_REF = slurryFactor(COVERAGE_REF);
  const GLAZE_REF = (1 / TAU_COND) / (1 / TAU_COND + 1 / TAU_GLAZE);       // in-situ conditioning at the reference condition
  const PAD_REF = PAD_FLOOR + (1 - PAD_FLOOR) * GLAZE_REF;
  const MU_REF = MU_WET + MU_DRY * (1 - COVERAGE_REF) ** 2;
  const arrhenius = temp => Math.exp(ACTIVATION / GAS * (1 / (C.tempRef + 273.15) - 1 / (temp + 273.15)));
  const hydro = sommerfeld => 1 / (1 + Math.pow(sommerfeld / HYDRO_S, HYDRO_POWER));
  const edgeGain = pressureRatio => clamp(EDGE_BASE + EDGE_SLOPE * (pressureRatio - 1), 0.01, 0.2);

  // ----- thin-film interference colour of SiO2 on Si (normal incidence), for the film view -----
  const SI_INDEX = [[380, 6.60, 1.20], [400, 5.57, 0.387], [450, 4.67, 0.145], [500, 4.29, 0.073], [550, 4.08, 0.044],
    [600, 3.94, 0.027], [650, 3.85, 0.018], [700, 3.78, 0.012], [780, 3.70, 0.007]];
  function siliconIndex(lambda) {
    for (let i = 1; i < SI_INDEX.length; i++) if (lambda <= SI_INDEX[i][0]) {
      const a = SI_INDEX[i - 1], b = SI_INDEX[i], f = (lambda - a[0]) / (b[0] - a[0]);
      return [a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])];
    }
    return [SI_INDEX.at(-1)[1], SI_INDEX.at(-1)[2]];
  }
  function reflectance(thickness, lambda) {
    const n1 = 1.46, [n2, k2] = siliconIndex(lambda), r01 = (1 - n1) / (1 + n1);
    const ar = n1 - n2, ai = k2, br = n1 + n2, bi = -k2, den = br * br + bi * bi;
    const r12r = (ar * br + ai * bi) / den, r12i = (ai * br - ar * bi) / den;
    const phase = 4 * Math.PI * n1 * thickness / lambda, c = Math.cos(phase), s = -Math.sin(phase);
    const er = r12r * c - r12i * s, ei = r12r * s + r12i * c;
    const nr = r01 + er, ni = ei, dr = 1 + r01 * er, di = r01 * ei;
    return (nr * nr + ni * ni) / (dr * dr + di * di);
  }
  const lobe = (x, mu, s1, s2) => { const t = (x - mu) / (x < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
  const cmf = l => [1.056 * lobe(l, 599.8, 37.9, 31.0) + 0.362 * lobe(l, 442.0, 16.0, 26.7) - 0.065 * lobe(l, 501.1, 20.4, 26.2),
    0.821 * lobe(l, 568.8, 46.9, 40.5) + 0.286 * lobe(l, 530.9, 16.3, 31.1),
    1.217 * lobe(l, 437.0, 11.8, 36.0) + 0.681 * lobe(l, 459.0, 26.0, 13.8)];
  const COLOR_STEP = 2, COLOR_MAX = 1400, COLOR_GAIN = 1.75, COLOR_SATURATION = 1.7;
  let colorTable = null;
  function buildColors() {
    const white = [0, 0, 0], rows = [];
    for (let l = 380; l <= 780; l += 10) { const m = cmf(l); rows.push([l, m]); for (let k = 0; k < 3; k++) white[k] += m[k]; }
    const table = new Uint8Array((COLOR_MAX / COLOR_STEP + 1) * 3), d65 = [0.9505, 1, 1.089];
    const encode = v => { const c = clamp(v, 0, 1); return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); };
    for (let i = 0, d = 0; d <= COLOR_MAX; d += COLOR_STEP, i++) {
      const xyz = [0, 0, 0];
      for (const [l, m] of rows) { const R = reflectance(d, l); for (let k = 0; k < 3; k++) xyz[k] += R * m[k]; }
      const [X, Y, Z] = xyz.map((v, k) => v / white[k] * d65[k] * COLOR_GAIN);   // display gain: bare silicon reflects ~35%
      const rgb = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z];
      const luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      for (let k = 0; k < 3; k++) table[i * 3 + k] = encode(luma + COLOR_SATURATION * (rgb[k] - luma));   // screen colours are paler than a wafer under a lamp
    }
    return table;
  }
  /** sRGB bytes of an oxide film of the given thickness (nm) on silicon. */
  function filmColor(thickness) {
    colorTable ||= buildColors();
    const i = Math.round(clamp(thickness, 0, COLOR_MAX) / COLOR_STEP) * 3;
    return [colorTable[i], colorTable[i + 1], colorTable[i + 2]];
  }

  function create(options = {}) {
    const rand = mulberry32(options.seed ?? 1), tool = options.tool || null, baseLevel = options.level ?? 1;
    const cleaning = !!options.cleaning, soilRand = mulberry32((options.seed ?? 1) ^ 0x2C1EA9);   // its own stream: the polish repeats with or without a cleaner
    const stepTime = { scrub: C.cleanScrub, rinse: C.cleanRinse, dry: C.cleanDry };
    const wear = !!options.wear, lots = !!options.lot;
    const newLot = id => ({ id, wafers: [], padChanges: 0, exSitu: 0 });
    const N = C.nodes, radius = Float64Array.from({ length: N }, (_, i) => C.waferRadius * i / (N - 1));
    const areaWeight = Float64Array.from({ length: N }, (_, i) => {
      const d = 1 / (N - 1), lo = Math.max(0, i * d - d / 2), hi = Math.min(1, i * d + d / 2);
      return hi * hi - lo * lo;
    });
    // The wafer as a whole at the reference condition: its mean speed, how well it is wetted where it moves, and how the
    // pressure is spread over it (the edge). The rate and the three factors are taken against these, so that the reference
    // condition polishes at the reference rate and reads x1 on every factor.
    const REF = (() => {
      const edge = edgeGain(1); let speed = 0, wetted = 0, pressed = 0;
      for (let i = 0; i < N; i++) {
        const x = radius[i] / C.waferRadius, v = meanSpeed(C.platenRef, C.carrierRef, radius[i]) / V_REF;
        const wet = slurryFactor(COVERAGE_REF * (1 - STARVE * (1 - COVERAGE_REF) * (1 - x))) / SLURRY_REF, local = 1 + edge * Math.exp(-(C.waferRadius - radius[i]) / EDGE_LENGTH);
        speed += areaWeight[i] * v; wetted += areaWeight[i] * v * wet; pressed += areaWeight[i] * v * wet * local;
      }
      return { speed, slurry: wetted / speed, spread: pressed / wetted };
    })();
    const s = {
      t: 0, level: baseLevel, lastPolish: null,
      controls: { head: 0, platen: 0, carrier: 0, slurry: 0, zone: 0, conditioner: false, ...(cleaning ? { brush: C.brushRef } : {}) },   // the brush belongs to the cleaner
      gap: C.headTravel, pressure: 0, platenRpm: 0, carrierRpm: 0, flow: 0,
      platenAngle: 0, carrierAngle: 0, sweepPhase: 0,
      coverage: 0, glaze: 1, temp: C.ambient, padWear: 0, slurryTotal: 0,
      padCut: wear ? C.padLife * clamp(options.padUsed ?? (tool ? tool.status.padShare : 0), 0, 1) : 0, padLeft: 1,   // s of conditioning this pad has had; the share of its life left
      lot: lots ? newLot(1) : null, lots: [],                             // the lot being run, and the summaries of the finished ones (newest first)
      rate: 0, contact: false, polishing: false,
      cleaner: { phase: 'idle', left: 0 },                                // idle | scrub | rinse | dry | done
      factors: { pressure: 0, speed: 0, slurry: 0, pad: 1, temp: 1, contact: 1, level: 1 },
      wafer: null, monitor: null, alarms: {}, events: [], history: [], waferCount: 0,
    };
    let lastRevolution = 0, lastSample = -1, exSitu = 0;                  // exSitu: s of conditioning since the last polish
    let sampleEvery = SAMPLE_EVERY, onPad = false;                         // the record of the polish: s between its samples, and whether the last one was taken on the pad
    s.padLeft = 1 - s.padCut / C.padLife;

    const interp = (film, r) => {
      const x = clamp(r / C.waferRadius, 0, 1) * (N - 1), i = Math.min(N - 2, Math.floor(x)), f = x - i;
      return film[i] + f * (film[i + 1] - film[i]);
    };
    const areaMean = film => { let sum = 0; for (let i = 0; i < N; i++) sum += areaWeight[i] * film[i]; return sum; };
    const event = (kind, text) => { s.events.push({ t: s.t, kind, text }); if (s.events.length > 200) s.events.shift(); };

    function pattern(film, tilt, tiltAngle, noise) {
      const points = [];
      RINGS.forEach(([r, count], ring) => { for (let k = 0; k < count; k++) {
        const theta = (k + (count > 1 ? 0.5 : 0)) * 2 * Math.PI / count;
        const value = Math.max(0, interp(film, r) - tilt * (r / C.waferRadius) * Math.cos(theta - tiltAngle) + (noise ? gauss(rand) * noise : 0));
        points.push({ r, theta, x: r * Math.cos(theta), y: r * Math.sin(theta), value, weight: POINT_AREA[ring] });
      } });
      return points;
    }
    function stats(points) {
      const v = points.map(p => p.value), plain = v.reduce((a, b) => a + b, 0) / v.length;
      const sd = Math.sqrt(v.reduce((a, b) => a + (b - plain) ** 2, 0) / (v.length - 1));
      // The mean thickness is the mean over the wafer's area, each point counting for the share of the wafer it stands for:
      // the same mean as the film monitor and the trend show. The non-uniformity is the spread of the 49 points as they are.
      const mean = points.reduce((sum, p) => sum + p.weight * p.value, 0) / points.reduce((sum, p) => sum + p.weight, 0);
      return { mean, min: Math.min(...v), max: Math.max(...v), range: Math.max(...v) - Math.min(...v), sd, wiwnu: plain > 0 ? 100 * sd / plain : 0 };
    }
    /**
     * The mean thickness of a wafer as this lab states it everywhere: the mean over the wafer's area of the 49 points the
     * metrology measures, here without its noise. The film monitor, the trend, the amount removed and the report all
     * give this one number: what the monitor read last on the pad is what the metrology finds, to within their noise.
     * (The 49 points lean toward the edge, where the film is thinnest after a polish: the true mean over the area,
     * which the removal rate is reckoned from, lies up to a few nm higher.)
     */
    const siteMean = (film, w) => stats(pattern(film, w.tilt, w.tiltAngle, 0)).mean;
    function reading(clean) {
      const w = s.wafer;
      const profile = Float64Array.from(w.film, v => Math.max(0, v + (clean ? 0 : gauss(rand) * 1.2)));
      return { t: s.t, mean: siteMean(w.film, w) + areaMean(profile) - areaMean(w.film), profile, wiwnu: stats(pattern(w.film, w.tilt, w.tiltAngle, 0)).wiwnu };   // the scan's own noise on top
    }

    /** Puts a new wafer on the load pedestal. The deposited film is edge-thick or centre-thick by up to 2%. */
    function newWafer() {
      if (s.lot) {
        const w = s.wafer;
        if (w && w.polishTime > 0) {                                      // polished and not measured since: it counts, and not as a good one
          const seen = s.lot.wafers.find(e => e.id === w.id);
          if (!seen || seen.polish !== w.polishTime || seen.clean !== w.cleanTime) lotRecord(w, null);
        }
        if (s.lot.wafers.length >= C.lotSize) { s.lots.unshift(lotSummary()); if (s.lots.length > 6) s.lots.pop(); s.lot = newLot(s.lot.id + 1); }
      }
      const mean = C.filmStart + (rand() * 2 - 1) * 25, dome = (rand() < 0.5 ? 1 : -1) * (0.006 + rand() * 0.014);
      const film = Float64Array.from(radius, r => mean * (1 + dome * (2 * (r / C.waferRadius) ** 2 - 1)));
      s.wafer = {
        id: ++s.waferCount, where: 'pedestal', film, start: Float64Array.from(film), tilt: 0, tiltAngle: rand() * 2 * Math.PI,
        scratches: [], polishTime: 0, clock: 0, slurryUsed: 0, maxTemp: C.ambient, peakPressure: 0, pressureTime: 0,
        incoming: { mean: areaMean(film), area: areaMean(film), edgeMinusCentre: film[N - 1] - film[0] }, measured: null,   // mean: as the lab states it (set below); area: the true mean over the area
        tool: null, nominal: 0,           // the tool state this wafer met, and what the same polish would have removed at level 1
        particles: PARTICLES_INCOMING, wet: false, cleanTime: 0, cleanSince: 0,   // cleanSince: s of cleaning since it was last polished
        soil: PARTICLES_POLISHED * (1 + PARTICLES_SPREAD * (soilRand() * 2 - 1)),   // what one polish leaves on this wafer
      };
      s.wafer.incoming.mean = siteMean(film, s.wafer);
      s.level = baseLevel; s.cleaner.phase = 'idle'; s.cleaner.left = 0;      // the cleaner stops: its wafer is gone
      s.history = []; lastSample = -1; sampleEvery = SAMPLE_EVERY; onPad = false;
      s.monitor = reading(true);
      event('wafer', `웨이퍼 ${s.wafer.id} 준비`);
      return s.wafer;
    }
    function moveWafer(where) {
      const w = s.wafer;
      if (!w || !['pedestal', 'head', 'stage', ...(cleaning ? ['cleaner'] : [])].includes(where) || w.where === where) return false;
      if ((where === 'head' || w.where === 'head') && s.gap < C.headTravel * 0.5) return false;   // the head must be raised to hand over
      w.where = where;
      s.cleaner.phase = where === 'cleaner' ? CLEAN_STEPS[0] : 'idle'; s.cleaner.left = where === 'cleaner' ? stepTime[CLEAN_STEPS[0]] : 0;   // the cycle starts over each time
      if (where === 'cleaner') w.wet = true;
      event('wafer', where === 'head' ? '헤드가 웨이퍼를 잡음' : where === 'stage' ? '계측대로 이동' : where === 'cleaner' ? '세정기로 이동' : '로드 위치로 이동');
      return true;
    }

    /** Scrub, rinse, spin-dry: the wet steps take particles off, the last one leaves the wafer dry.
     *  The scrub works in proportion to how far the brush is pressed in; pressed beyond brushSafe it scratches. */
    function clean(h) {
      const w = s.wafer, k = s.cleaner, brush = s.controls.brush;
      let left = h;
      while (left > 1e-9 && CLEAN_STEPS.includes(k.phase)) {
        const d = Math.min(left, k.left);
        if (k.phase === 'scrub') {
          w.particles *= Math.exp(-d * (brush / C.brushRef) / TAU_SCRUB);
          const over = Math.max(0, brush - C.brushSafe) / (C.brushMax - C.brushSafe);
          if (over > 0 && soilRand() < 1 - Math.exp(-BRUSH_SCRATCH * over * over * d) && w.scratches.length < 80)
            w.scratches.push({ r: (0.1 + 0.9 * soilRand()) * C.waferRadius, theta: soilRand() * 2 * Math.PI, length: 0.3 + soilRand() * 0.6, t: s.t, by: 'brush' });
        }
        else if (k.phase === 'rinse') w.particles *= Math.exp(-d / TAU_RINSE);
        w.cleanTime += d; w.cleanSince += d; k.left -= d; left -= d;
        if (k.left <= 1e-9) {
          const next = CLEAN_STEPS[CLEAN_STEPS.indexOf(k.phase) + 1];
          if (next) { k.phase = next; k.left = stepTime[next]; }
          else { k.phase = 'done'; k.left = 0; w.wet = false; event('clean', `세정 끝: 남은 입자 ${Math.round(w.particles)}개`); }
        }
      }
    }

    /** Ends the running step of the cleaner now. A spin dry that is cut short leaves the wafer wet. */
    function nextCleanStep() {
      const w = s.wafer, k = s.cleaner;
      if (!w || w.where !== 'cleaner' || !CLEAN_STEPS.includes(k.phase)) return false;
      const next = CLEAN_STEPS[CLEAN_STEPS.indexOf(k.phase) + 1];
      if (next) { k.phase = next; k.left = stepTime[next]; }
      else { k.phase = 'done'; k.left = 0; event('clean', `건조를 일찍 끝냄: 남은 입자 ${Math.round(w.particles)}개, 젖음`); }
      return true;
    }

    // ----- lots: every polished wafer counts once, measured or not -----
    function lotRecord(w, m) {
      const entry = { id: w.id, measured: !!m, pass: !!m && m.pass, mean: m ? m.mean : null, wiwnu: m ? m.wiwnu : null, polish: w.polishTime, clean: w.cleanTime,
        time: w.polishTime + w.cleanTime + C.handlingTime, slurry: w.slurryUsed, observed: m?.tool?.observed ?? null, predicted: m?.tool?.predicted ?? null };
      const at = s.lot.wafers.findIndex(e => e.id === w.id);
      if (at < 0) s.lot.wafers.push(entry); else s.lot.wafers[at] = entry;
    }
    /** The account of a lot: wafers, good ones, the time it took (wafers, pad changes, conditioning between wafers) and good wafers per hour. */
    function lotSummary(lot = s.lot) {
      if (!lot) return null;
      const count = lot.wafers.length, passed = lot.wafers.filter(e => e.pass).length, sum = key => lot.wafers.reduce((a, e) => a + e[key], 0);
      const time = { wafers: sum('time'), padChange: lot.padChanges * C.padChangeTime, exSitu: lot.exSitu };
      time.total = time.wafers + time.padChange + time.exSitu;
      return { id: lot.id, size: C.lotSize, count, passed, done: count >= C.lotSize, yield: count ? passed / count : 0, time, padChanges: lot.padChanges,
        goodPerHour: time.total > 0 ? passed / time.total * 3600 : 0, slurry: sum('slurry'), wafers: lot.wafers.map(e => ({ ...e })) };
    }

    function setAlarm(key, on, text) {
      if (on && !s.alarms[key]) { s.alarms[key] = { since: s.t, text }; event('alarm', text); }
      else if (!on && s.alarms[key]) delete s.alarms[key];
    }

    function substep(h) {
      const c = s.controls, w = s.wafer;
      const command = clamp(c.head, 0, 2);
      // The head lifts only after the membrane pressure has been released.
      const gapTarget = command >= 1 || s.pressure > 0.05 ? 0 : (1 - command) * C.headTravel;
      s.gap = clamp(s.gap + clamp(gapTarget - s.gap, -HEAD_SPEED * h, HEAD_SPEED * h), 0, C.headTravel);
      s.contact = s.gap <= 1e-6;
      const pressureTarget = s.contact ? Math.max(0, command - 1) * C.pressureMax : 0;
      s.pressure += (pressureTarget - s.pressure) * lag(h, TAU_PRESSURE);
      if (s.pressure < 1e-3 && pressureTarget === 0) s.pressure = 0;
      s.platenRpm += (clamp(c.platen, 0, C.rpmMax) - s.platenRpm) * lag(h, TAU_PLATEN);
      s.carrierRpm += (clamp(c.carrier, 0, C.rpmMax) - s.carrierRpm) * lag(h, TAU_CARRIER);
      s.flow += (clamp(c.slurry, 0, C.slurryMax) - s.flow) * lag(h, TAU_FLOW);
      if (s.flow < 0.5 && c.slurry === 0) s.flow = 0;
      s.platenAngle += s.platenRpm * RPM * h; s.carrierAngle += s.carrierRpm * RPM * h;
      s.slurryTotal += s.flow / 60 * h;

      const turn = s.platenRpm / C.platenRef;
      const fill = (s.flow / C.slurryRef) / TAU_FILL, drain = (DRAIN_STILL + turn * turn) / TAU_DRAIN;
      s.coverage = clamp(s.coverage + (fill * (1 - s.coverage) - drain * s.coverage) * h, 0, 1);
      const conditioning = c.conditioner ? clamp(turn, 0, 1.5) : 0;
      if (c.conditioner) s.sweepPhase += h * 2 * Math.PI / 6;

      const vCentre = meanSpeed(s.platenRpm, s.carrierRpm, 0), speedRatio = vCentre / V_REF, pressureRatio = s.pressure / C.pressureRef;
      const f = s.factors;
      f.pressure = pressureRatio; f.slurry = slurryFactor(s.coverage) / SLURRY_REF;
      const speeds = Float64Array.from(radius, r => meanSpeed(s.platenRpm, s.carrierRpm, r) / V_REF);        // at each place of the wafer
      f.speed = areaMean(speeds) / REF.speed;                               // over the whole wafer: a head that turns faster or slower than the platen changes it
      f.pad = (PAD_FLOOR + (1 - PAD_FLOOR) * s.glaze) / PAD_REF;
      f.temp = arrhenius(s.temp);
      f.contact = s.contact && s.pressure > 0.02 ? hydro(speedRatio / Math.max(pressureRatio, 0.05)) : 1;   // has no meaning until the wafer is pressed
      const mu = MU_WET + MU_DRY * (1 - s.coverage) ** 2;

      s.polishing = s.contact && !!w && w.where === 'head' && s.pressure > 0.02;
      if (s.polishing && tool && !w.tool) {                                   // the wafer meets the tool as it is now
        w.tool = tool.next({ rested: s.lastPolish !== null && s.t - s.lastPolish > tool.model.restGap });
        s.level = baseLevel * w.tool.ratio;
      }
      f.level = s.level;
      let rate = 0;
      if (s.polishing) {
        const edge = edgeGain(pressureRatio), common = C.rateRef / 60 / (REF.speed * REF.slurry * REF.spread) * f.level * pressureRatio * f.pad * f.temp * f.contact;
        let wetted = 0, pressed = 0;                                          // sums over the wafer's area of speed x slurry, and of speed x slurry x how the pressure is spread
        for (let i = 0; i < N; i++) {
          const x = radius[i] / C.waferRadius;
          const local = (1 + c.zone * (1 - 2 * x * x)) * (1 + edge * Math.exp(-(C.waferRadius - radius[i]) / EDGE_LENGTH));   // zone balance has zero area mean
          const speed = speeds[i];
          const wet = slurryFactor(s.coverage * (1 - STARVE * (1 - s.coverage) * (1 - x))) / SLURRY_REF;
          const removed = Math.min(w.film[i], common * local * speed * wet * h);
          w.film[i] -= removed; rate += areaWeight[i] * removed / h;
          wetted += areaWeight[i] * speed * wet; pressed += areaWeight[i] * speed * wet * local;
        }
        // The seven factors on show are the wafer's as a whole, and their product is the rate: the speed is the mean over
        // the wafer (above), the slurry is what the wafer gets where it moves, and the pressure carries how it is spread
        // (the zone balance and the edge). With head and platen at the same speed they are what they are at the centre.
        if (f.speed > 0 && wetted > 0) { f.slurry = wetted / (f.speed * REF.speed) / REF.slurry; f.pressure = pressureRatio * pressed / wetted / REF.spread; }
        // A wafer that does not turn is polished faster on its outboard side: a wedge, not a ring.
        w.tilt += rate * (C.waferRadius / C.centerDistance) / (1 + (s.carrierRpm / 1.5) ** 2) * h;
        w.polishTime += h; w.slurryUsed += s.flow / 60 * h; w.pressureTime += s.pressure * h;
        w.nominal += rate * h / Math.max(s.level / baseLevel, 1e-6); s.lastPolish = s.t;
        w.peakPressure = Math.max(w.peakPressure, s.pressure); w.maxTemp = Math.max(w.maxTemp, s.temp);
        if (cleaning) { w.particles = Math.max(w.particles, w.soil); w.wet = true; w.cleanSince = 0; }   // slurry on the surface again
        if (s.platenRpm > 5) {
          const dry = Math.max(0, 0.16 - s.coverage) / 0.16;
          const starved = 1.2 * pressureRatio * speedRatio * dry, hot = s.temp > 72 ? 0.08 : 0, dull = s.glaze < 0.3 ? 0.03 : 0, hazard = starved + hot + dull;
          if (hazard > 0 && rand() < 1 - Math.exp(-hazard * h) && w.scratches.length < 80)
            w.scratches.push({ r: (0.15 + 0.85 * rand()) * C.waferRadius, theta: rand() * 2 * Math.PI, length: 0.3 + rand() * 0.9, t: s.t, by: starved >= hot && starved >= dull ? 'dry' : hot >= dull ? 'hot' : 'glazed' });   // by: the largest of the three hazards then
        }
      }
      s.rate = rate * 60;

      const heat = s.polishing ? (mu / MU_REF) * pressureRatio * speedRatio * (0.3 + 0.7 * f.contact) * 1.5 / (1 + 0.5 * s.flow / C.slurryRef) : 0;
      s.temp += (C.ambient + DT_REF * heat - s.temp) * lag(h, s.polishing ? TAU_HEAT : TAU_COOL);
      const glazing = s.polishing ? pressureRatio * speedRatio * (1 + 2 * Math.max(0, (s.temp - 60) / 20)) / TAU_GLAZE : 0;
      let dressing = conditioning;
      if (wear) {
        // The conditioner cuts the pad. Between wafers only the first exSituMax seconds count, for the pad and for the
        // clock of the lot: one conditioning step, however long the operator takes to load the next wafer.
        if (s.polishing) exSitu = 0;
        if (s.padCut >= C.padLife) dressing = 0;                            // nothing left to cut: the pad stays glazed
        else if (dressing > 0 && (s.polishing || exSitu < C.exSituMax)) {
          s.padCut = Math.min(C.padLife, s.padCut + dressing * h);
          if (!s.polishing) { exSitu += h; if (s.lot) s.lot.exSitu += h; }
        }
        s.padLeft = 1 - s.padCut / C.padLife;
      }
      s.glaze = clamp(s.glaze + (dressing * (1 - s.glaze) / TAU_COND - glazing * s.glaze) * h, 0.05, 1);
      s.padWear += conditioning * 0.02 * h;

      if (w && w.where === 'cleaner') clean(h);
      if (w) {
        w.clock += h;
        const revolution = Math.floor(s.platenAngle / (2 * Math.PI));
        if (w.where === 'head' && s.contact && revolution !== lastRevolution) s.monitor = reading(false);   // one scan per platen turn
        lastRevolution = revolution;
        // The record of the polish is what the instruments read: one sample as the wafer comes onto the head, samples while it
        // is on the pad, and one as it leaves the pad. A wafer that waits in the raised head adds nothing. When the record is
        // full every second sample goes and the samples come half as often, so that a long polish stays whole.
        const slot = Math.floor(w.clock / sampleEvery);
        if (w.where === 'head' && (s.contact || onPad || !s.history.length) && (slot !== lastSample || onPad !== s.contact)) {
          lastSample = slot; onPad = s.contact;
          const h = s.history;
          h.push({ t: w.clock, rate: s.rate, temp: s.temp, pressure: s.pressure, platen: s.platenRpm, coverage: s.coverage, mean: s.monitor.mean });
          if (h.length > HISTORY_MAX) { for (let i = 0; 2 * i < h.length; i++) h[i] = h[2 * i]; h.length = Math.ceil(h.length / 2); sampleEvery *= 2; lastSample = Math.floor(w.clock / sampleEvery); }
        }
      }
      const rubbing = s.polishing && s.platenRpm > 5;
      const pressing = command > 1 && s.pressure >= 0.9 * pressureTarget;       // the head is asked to press and the pressure has arrived: not while it rises, and not while it is let off for a lift
      setAlarm('dry', rubbing && s.coverage < 0.16, '슬러리 부족: 마른 패드에 닿아 표면이 긁힙니다');
      setAlarm('hot', s.temp > C.tempAlarm, '패드 과열: 압력이나 속도를 낮추거나 슬러리를 늘리세요');
      setAlarm('hydro', rubbing && pressing && f.contact < 0.5, '수막 현상: 속도에 비해 압력이 낮아 거의 깎이지 않습니다');
      setAlarm('stopped', s.polishing && pressing && s.platenRpm < 4.5, '플래튼이 돌지 않습니다: 웨이퍼가 고르게 깎이지 않습니다');   // under the 5 rpm from which the guide takes the platen as turning (a platen set to 5 comes up to it from below)
      setAlarm('still', rubbing && s.carrierRpm < 3 && s.platenRpm > 10, '헤드가 돌지 않아 웨이퍼 한쪽만 깎입니다');
      setAlarm('bare', !!w && w.where === 'head' && w.film.some(v => v <= 0), '막이 다 깎여 실리콘이 드러났습니다');
      setAlarm('worn', wear && s.padCut >= C.padLife, '패드 수명이 다했습니다: 컨디셔너가 더는 듣지 않습니다. 패드를 교체하세요');
      setAlarm('empty', command > 1 && s.contact && s.pressure > 0.3 && (!w || w.where !== 'head'), '웨이퍼 없이 헤드를 눌렀습니다');
      s.t += h;
    }

    /** Advances simulated time by dt seconds (at most 60 s per call, so a stalled page cannot jump the process). */
    function step(dt) {
      let left = Math.max(0, Math.min(dt, 60));
      while (left > 1e-9) { const h = Math.min(0.05, left); substep(h); left -= h; }
    }

    /** 49-point thickness measurement of the current wafer with the verdict against the work order. */
    function measure() {
      const w = s.wafer; if (!w) return null;
      const points = pattern(w.film, w.tilt, w.tiltAngle, 1.0), st = stats(points);
      const profile = Array.from(radius, (r, i) => ({ r, start: w.start[i], end: w.film[i], removed: w.start[i] - w.film[i] }));
      const result = {
        waferId: w.id, points, ...st, incoming: w.incoming.mean, removed: Math.max(0, w.incoming.mean - st.mean), error: st.mean - C.target,
        profile, tilt: w.tilt, scratches: w.scratches.length, polishTime: w.polishTime, slurryUsed: w.slurryUsed, maxTemp: w.maxTemp,
        meanPressure: w.polishTime > 0 ? w.pressureTime / w.polishTime : 0,
        meanRate: w.polishTime > 0 ? Math.max(0, w.incoming.mean - st.mean) / w.polishTime * 60 : 0,                  // what was removed, as measured, over the time it took
        ok: { thickness: Math.abs(Math.round(st.mean) - C.target) <= C.targetTol, uniformity: Number(st.wiwnu.toFixed(2)) <= C.wiwnuMax, defects: w.scratches.length === 0 },   // as read: whole nm, and the non-uniformity to two places
      };
      result.brushScratches = w.scratches.filter(x => x.by === 'brush').length;
      if (cleaning) {
        result.particles = Math.round(w.particles); result.wet = w.wet; result.cleanTime = w.cleanTime;
        result.cleanSince = w.cleanSince; result.cleanCycle = CLEAN_STEPS.reduce((sum, step) => sum + stepTime[step], 0);   // cleaning since the last polish, and what the whole cycle takes
        result.ok.clean = result.particles <= C.particlesMax && !w.wet;
      }
      result.pass = Object.values(result.ok).every(Boolean);
      // Time one wafer takes on this tool, and what that makes per hour. A wafer that fails still took the time.
      const total = w.polishTime + w.cleanTime + C.handlingTime;
      result.cycle = { polish: w.polishTime, clean: w.cleanTime, handling: C.handlingTime, total, perHour: w.polishTime > 0 ? 3600 / total : 0 };
      if (tool && w.tool && w.nominal >= TOOL_MIN_REMOVED) {
        // What this wafer says about the tool: removed against what the same polish removes on a tool at its mean.
        const observed = ((w.incoming.area ?? w.incoming.mean) - areaMean(w.film)) / w.nominal, context = { rested: w.tool.rested, afterPadChange: w.tool.afterPadChange };
        tool.observe(w.tool.wafer, observed, context);
        result.tool = { wafer: w.tool.wafer, observed, predicted: w.tool.predicted, next: tool.predict(), ...context, padShare: w.tool.padUsage / tool.model.padUsageSeen };
      }
      if (s.lot && w.polishTime > 0) { lotRecord(w, result); result.lot = lotSummary(); }
      w.measured = result;
      event('measure', `계측: 평균 ${st.mean.toFixed(0)} nm, 불균일도 ${st.wiwnu.toFixed(1)}%`);
      return result;
    }

    /** What keeps the pad from being changed now: 'wafer' on the head, 'platen' turning, 'head' not up. Empty when the tool stands ready. */
    const padBlocks = () => [...(s.wafer && s.wafer.where === 'head' ? ['wafer'] : []), ...(s.platenRpm > 1 ? ['platen'] : []), ...(s.contact || s.gap < C.headTravel * 0.5 ? ['head'] : [])];
    /** Fits a new pad. The tool must stand still with the head up; false when it does not. */
    function replacePad() {
      if (padBlocks().length) return false;
      s.glaze = GLAZE_REF; s.coverage = 0; s.padWear = 0; s.temp = C.ambient;   // broken in, dry, at room temperature
      s.padCut = 0; s.padLeft = 1; exSitu = 0; if (s.lot) s.lot.padChanges += 1;
      if (tool) tool.replacePad();
      event('pad', '패드 교체');
      return true;
    }

    function setControl(name, value) {
      const c = s.controls;
      if (name === 'head') c.head = clamp(Number(value) || 0, 0, 2);
      else if (name === 'platen' || name === 'carrier') c[name] = clamp(Number(value) || 0, 0, C.rpmMax);
      else if (name === 'slurry') c.slurry = clamp(Number(value) || 0, 0, C.slurryMax);
      else if (name === 'zone') c.zone = clamp(Number(value) || 0, -C.zoneMax, C.zoneMax);
      else if (name === 'conditioner') c.conditioner = Boolean(value);
      else if (name === 'brush' && cleaning) c.brush = clamp(Number(value) || 0, 0, C.brushMax);
      else throw new Error(`unknown control: ${name}`);
      return c[name];
    }

    return {
      state: s, radius, step, setControl, newWafer, moveWafer, measure, replacePad, padBlocks, nextCleanStep, lotSummary, tool,
      filmAt: (r, theta = 0) => s.wafer ? Math.max(0, interp(s.wafer.film, r) - s.wafer.tilt * (r / C.waferRadius) * Math.cos(theta - s.wafer.tiltAngle)) : 0,
      meanThickness: () => s.wafer ? siteMean(s.wafer.film, s.wafer) : 0,
      liveWiwnu: () => s.wafer ? stats(pattern(s.wafer.film, s.wafer.tilt, s.wafer.tiltAngle, 0)).wiwnu : 0,
    };
  }

  return Object.freeze({
    constants: C, create, filmColor, meanSpeed, coverageSteady, reflectance,
    /** Lookup table behind filmColor: RGB bytes every `step` nm up to `max` nm. */
    filmColors: () => ({ table: (colorTable ||= buildColors()), step: COLOR_STEP, max: COLOR_MAX }),
    reference: Object.freeze({ speed: V_REF, coverage: COVERAGE_REF, glaze: GLAZE_REF }),
    rings: RINGS,
  });
});
