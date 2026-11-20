/* CMP direct-operation experiment: process model.
 *
 * Real-time model of one oxide polish on a rotary polisher. Everything here is a textbook equation or a
 * stated simplification; nothing is fitted to the PHM 2016 record yet (`level` is the hook for the learned
 * tool state). Nominal values are typical 300 mm oxide CMP numbers, not this tool's.
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
    const rand = mulberry32(options.seed ?? 1);
    const N = C.nodes, radius = Float64Array.from({ length: N }, (_, i) => C.waferRadius * i / (N - 1));
    const areaWeight = Float64Array.from({ length: N }, (_, i) => {
      const d = 1 / (N - 1), lo = Math.max(0, i * d - d / 2), hi = Math.min(1, i * d + d / 2);
      return hi * hi - lo * lo;
    });
    const s = {
      t: 0, level: options.level ?? 1,
      controls: { head: 0, platen: 0, carrier: 0, slurry: 0, zone: 0, conditioner: false },
      gap: C.headTravel, pressure: 0, platenRpm: 0, carrierRpm: 0, flow: 0,
      platenAngle: 0, carrierAngle: 0, sweepPhase: 0,
      coverage: 0, glaze: 1, temp: C.ambient, padWear: 0, slurryTotal: 0,
      rate: 0, contact: false, polishing: false,
      factors: { pressure: 0, speed: 0, slurry: 0, pad: 1, temp: 1, contact: 1, level: 1 },
      wafer: null, monitor: null, alarms: {}, events: [], history: [], waferCount: 0,
    };
    let lastRevolution = 0, lastSample = -1;

    const interp = (film, r) => {
      const x = clamp(r / C.waferRadius, 0, 1) * (N - 1), i = Math.min(N - 2, Math.floor(x)), f = x - i;
      return film[i] + f * (film[i + 1] - film[i]);
    };
    const areaMean = film => { let sum = 0; for (let i = 0; i < N; i++) sum += areaWeight[i] * film[i]; return sum; };
    const event = (kind, text) => { s.events.push({ t: s.t, kind, text }); if (s.events.length > 200) s.events.shift(); };

    function pattern(film, tilt, tiltAngle, noise) {
      const points = [];
      for (const [r, count] of RINGS) for (let k = 0; k < count; k++) {
        const theta = (k + (count > 1 ? 0.5 : 0)) * 2 * Math.PI / count;
        const value = Math.max(0, interp(film, r) - tilt * (r / C.waferRadius) * Math.cos(theta - tiltAngle) + (noise ? gauss(rand) * noise : 0));
        points.push({ r, theta, x: r * Math.cos(theta), y: r * Math.sin(theta), value });
      }
      return points;
    }
    function stats(points) {
      const v = points.map(p => p.value), mean = v.reduce((a, b) => a + b, 0) / v.length;
      const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (v.length - 1));
      return { mean, min: Math.min(...v), max: Math.max(...v), range: Math.max(...v) - Math.min(...v), sd, wiwnu: mean > 0 ? 100 * sd / mean : 0 };
    }
    function reading(clean) {
      const w = s.wafer;
      const profile = Float64Array.from(w.film, v => Math.max(0, v + (clean ? 0 : gauss(rand) * 1.2)));
      return { t: s.t, mean: areaMean(profile), profile, wiwnu: stats(pattern(w.film, w.tilt, w.tiltAngle, 0)).wiwnu };
    }

    /** Puts a new wafer on the load pedestal. The deposited film is edge-thick or centre-thick by up to 2%. */
    function newWafer() {
      const mean = C.filmStart + (rand() * 2 - 1) * 25, dome = (rand() < 0.5 ? 1 : -1) * (0.006 + rand() * 0.014);
      const film = Float64Array.from(radius, r => mean * (1 + dome * (2 * (r / C.waferRadius) ** 2 - 1)));
      s.wafer = {
        id: ++s.waferCount, where: 'pedestal', film, start: Float64Array.from(film), tilt: 0, tiltAngle: rand() * 2 * Math.PI,
        scratches: [], polishTime: 0, clock: 0, slurryUsed: 0, maxTemp: C.ambient, peakPressure: 0, pressureTime: 0,
        incoming: { mean: areaMean(film), edgeMinusCentre: film[N - 1] - film[0] }, measured: null,
      };
      s.history = []; lastSample = -1;
      s.monitor = reading(true);
      event('wafer', `웨이퍼 ${s.wafer.id} 준비`);
      return s.wafer;
    }
    function moveWafer(where) {
      const w = s.wafer;
      if (!w || !['pedestal', 'head', 'stage'].includes(where) || w.where === where) return false;
      if ((where === 'head' || w.where === 'head') && s.gap < C.headTravel * 0.5) return false;   // the head must be raised to hand over
      w.where = where;
      event('wafer', where === 'head' ? '헤드가 웨이퍼를 잡음' : where === 'stage' ? '계측대로 이동' : '로드 위치로 이동');
      return true;
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
      f.pressure = pressureRatio; f.speed = speedRatio; f.level = s.level;
      f.slurry = slurryFactor(s.coverage) / SLURRY_REF;
      f.pad = (PAD_FLOOR + (1 - PAD_FLOOR) * s.glaze) / PAD_REF;
      f.temp = arrhenius(s.temp);
      f.contact = s.contact && s.pressure > 0.02 ? hydro(speedRatio / Math.max(pressureRatio, 0.05)) : 1;   // has no meaning until the wafer is pressed
      const mu = MU_WET + MU_DRY * (1 - s.coverage) ** 2;

      s.polishing = s.contact && !!w && w.where === 'head' && s.pressure > 0.02;
      let rate = 0;
      if (s.polishing) {
        const edge = edgeGain(pressureRatio), common = C.rateRef / 60 * f.level * f.pressure * f.pad * f.temp * f.contact;
        for (let i = 0; i < N; i++) {
          const x = radius[i] / C.waferRadius;
          const local = (1 + c.zone * (1 - 2 * x * x)) * (1 + edge * Math.exp(-(C.waferRadius - radius[i]) / EDGE_LENGTH));   // zone balance has zero area mean
          const speed = meanSpeed(s.platenRpm, s.carrierRpm, radius[i]) / V_REF;
          const wet = slurryFactor(s.coverage * (1 - STARVE * (1 - s.coverage) * (1 - x))) / SLURRY_REF;
          const removed = Math.min(w.film[i], common * local * speed * wet * h);
          w.film[i] -= removed; rate += areaWeight[i] * removed / h;
        }
        // A wafer that does not turn is polished faster on its outboard side: a wedge, not a ring.
        w.tilt += rate * (C.waferRadius / C.centerDistance) / (1 + (s.carrierRpm / 1.5) ** 2) * h;
        w.polishTime += h; w.slurryUsed += s.flow / 60 * h; w.pressureTime += s.pressure * h;
        w.peakPressure = Math.max(w.peakPressure, s.pressure); w.maxTemp = Math.max(w.maxTemp, s.temp);
        if (s.platenRpm > 5) {
          const dry = Math.max(0, 0.16 - s.coverage) / 0.16;
          const hazard = 1.2 * pressureRatio * speedRatio * dry + (s.temp > 72 ? 0.08 : 0) + (s.glaze < 0.3 ? 0.03 : 0);
          if (hazard > 0 && rand() < 1 - Math.exp(-hazard * h) && w.scratches.length < 80)
            w.scratches.push({ r: (0.15 + 0.85 * rand()) * C.waferRadius, theta: rand() * 2 * Math.PI, length: 0.3 + rand() * 0.9, t: s.t });
        }
      }
      s.rate = rate * 60;

      const heat = s.polishing ? (mu / MU_REF) * pressureRatio * speedRatio * (0.3 + 0.7 * f.contact) * 1.5 / (1 + 0.5 * s.flow / C.slurryRef) : 0;
      s.temp += (C.ambient + DT_REF * heat - s.temp) * lag(h, s.polishing ? TAU_HEAT : TAU_COOL);
      const glazing = s.polishing ? pressureRatio * speedRatio * (1 + 2 * Math.max(0, (s.temp - 60) / 20)) / TAU_GLAZE : 0;
      s.glaze = clamp(s.glaze + (conditioning * (1 - s.glaze) / TAU_COND - glazing * s.glaze) * h, 0.05, 1);
      s.padWear += conditioning * 0.02 * h;

      if (w) {
        w.clock += h;
        const revolution = Math.floor(s.platenAngle / (2 * Math.PI));
        if (w.where === 'head' && s.contact && revolution !== lastRevolution) s.monitor = reading(false);   // one scan per platen turn
        lastRevolution = revolution;
        if (w.where === 'head' && Math.floor(w.clock * 2) !== lastSample) {
          lastSample = Math.floor(w.clock * 2);
          s.history.push({ t: w.clock, rate: s.rate, temp: s.temp, pressure: s.pressure, platen: s.platenRpm, coverage: s.coverage, mean: areaMean(w.film) });
          if (s.history.length > 1200) s.history.shift();
        }
      }
      const rubbing = s.polishing && s.platenRpm > 5;
      setAlarm('dry', rubbing && s.coverage < 0.16, '슬러리 부족: 마른 패드에 닿아 표면이 긁힙니다');
      setAlarm('hot', s.temp > C.tempAlarm, '패드 과열: 압력이나 속도를 낮추거나 슬러리를 늘리세요');
      setAlarm('hydro', rubbing && f.contact < 0.5, '수막 현상: 속도에 비해 압력이 낮아 거의 깎이지 않습니다');
      setAlarm('still', rubbing && s.carrierRpm < 3 && s.platenRpm > 10, '헤드가 돌지 않아 웨이퍼 한쪽만 깎입니다');
      setAlarm('bare', !!w && w.where === 'head' && w.film.some(v => v <= 0), '막이 다 깎여 실리콘이 드러났습니다');
      setAlarm('empty', s.contact && s.pressure > 0.3 && (!w || w.where !== 'head'), '웨이퍼 없이 헤드를 눌렀습니다');
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
        waferId: w.id, points, ...st, incoming: w.incoming.mean, removed: w.incoming.mean - st.mean, error: st.mean - C.target,
        profile, tilt: w.tilt, scratches: w.scratches.length, polishTime: w.polishTime, slurryUsed: w.slurryUsed, maxTemp: w.maxTemp,
        meanPressure: w.polishTime > 0 ? w.pressureTime / w.polishTime : 0,
        meanRate: w.polishTime > 0 ? (w.incoming.mean - areaMean(w.film)) / w.polishTime * 60 : 0,
        ok: { thickness: Math.abs(st.mean - C.target) <= C.targetTol, uniformity: st.wiwnu <= C.wiwnuMax, defects: w.scratches.length === 0 },
      };
      result.pass = result.ok.thickness && result.ok.uniformity && result.ok.defects;
      w.measured = result;
      event('measure', `계측: 평균 ${st.mean.toFixed(0)} nm, 균일도 ${st.wiwnu.toFixed(1)}%`);
      return result;
    }

    function setControl(name, value) {
      const c = s.controls;
      if (name === 'head') c.head = clamp(Number(value) || 0, 0, 2);
      else if (name === 'platen' || name === 'carrier') c[name] = clamp(Number(value) || 0, 0, C.rpmMax);
      else if (name === 'slurry') c.slurry = clamp(Number(value) || 0, 0, C.slurryMax);
      else if (name === 'zone') c.zone = clamp(Number(value) || 0, -C.zoneMax, C.zoneMax);
      else if (name === 'conditioner') c.conditioner = Boolean(value);
      else throw new Error(`unknown control: ${name}`);
      return c[name];
    }

    return {
      state: s, radius, step, setControl, newWafer, moveWafer, measure,
      filmAt: (r, theta = 0) => s.wafer ? Math.max(0, interp(s.wafer.film, r) - s.wafer.tilt * (r / C.waferRadius) * Math.cos(theta - s.wafer.tiltAngle)) : 0,
      meanThickness: () => s.wafer ? areaMean(s.wafer.film) : 0,
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
