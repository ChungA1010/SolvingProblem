/* CMP lab simulator engine (issue #6). No DOM: session state, recipe-step timeline, metrology queue,
   scoring and practice suggestions. One simulator with two sources of wafer outcomes:
   - 'virtual': the learned state model run forward by LabVirtualTool. Open-ended; the operator can change
     pressure, recipe and maintenance; random disturbances (idle, pad change, pressure drop) can occur.
     Outcomes are model-generated, not measurements.
   - 'replay': PHM 2016 fold 5 exactly as recorded (327 wafers). Outcomes are measurements, so only the
     polishing time and metrology are the operator's; recorded conditions and events cannot change. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabSimEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PRESSURE_ALARM = 0.015;   // |p / setpoint - 1| above this raises a process deviation alarm (team flag rule)
  const ALARM_AFTER_S = 5;        // seconds of main polishing before the running pressure mean is trusted
  const TIME_RANGE = [0.6, 1.4];  // allowed polishing time as a fraction of the recipe reference time
  const RECIPES = ['A456', 'B456'];
  const REST_S = 3 * 3600;
  const ANOMALY = Object.freeze({ drop: -0.065, after: 8 });  // like the real A456 low-pressure episode (-6.6%)
  // Disturbance rates per wafer, close to the real fold 5 record (rest 7%, pad change 6%, A456 low pressure 12%).
  const DISTURB = Object.freeze({ rest: 0.05, pad: 0.05, anomaly: 0.08 });
  const VIRTUAL_CAP = 999;

  /* Suggested practice; each one ticks itself when the operator has done it. */
  const SUGGESTIONS = Object.freeze([
    Object.freeze({ id: 'inspec', text: '예측을 보고 연마 시간을 정해 계측 결과가 규격(±5%) 안에 들게 하기', done: s => s.records.some(r => r.measured && r.inSpec) }),
    Object.freeze({ id: 'pressure', text: '주 압력을 낮춰 보고 예측 MRR과 권장 시간이 어떻게 바뀌는지 보기 (A456)', done: s => s.records.some(r => r.pressureChanged) }),
    Object.freeze({ id: 'skip', text: '계측을 몇 장 건너뛰고 예측 구간이 넓어지는 것 보기', done: s => s.records.some(r => r.stale) }),
    Object.freeze({ id: 'delay', text: '결과 도착을 늦춰 놓고 운전해 보기 (설정 탭)', done: s => s.records.some(r => r.delay > 0) }),
    Object.freeze({ id: 'event', text: '휴지·패드 교체 직후 첫 장을 연마해 보기', done: s => s.records.some(r => r.events.afterRest || r.events.afterPad) }),
    Object.freeze({ id: 'alarm', text: '연마 중 압력 경보에 종료 시간 조정으로 대응하기', done: s => s.records.some(r => r.alarm && r.adjusted) }),
    Object.freeze({ id: 'replay', text: '결과 기준을 실제 기록으로 바꿔 실측값으로 운영해 보기 (설정 탭)', done: s => s.source === 'replay' && s.records.length > 0 }),
  ]);

  function erf(x) { // Abramowitz-Stegun 7.1.26, |error| < 1.5e-7
    const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
    return s * y;
  }
  const normCdf = x => 0.5 * (1 + erf(x / Math.SQRT2));
  const ctxOf = w => ({ recipe: w.recipe, position: w.position, clock: w.clock, after_rest: w.after_rest, after_pad_change: w.after_pad_change });
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  function inSpecProbability(pred, tSet, meta) {
    if (!pred || !(tSet > 0)) return null;
    const s = meta.spec_pct / 100, lo = meta.target_removal * (1 - s) / tSet, hi = meta.target_removal * (1 + s) / tSet;
    return normCdf((hi - pred.mrr) / pred.sd) - normCdf((lo - pred.mrr) / pred.sd);
  }

  /* Recipe-step timeline of one wafer: recorded loading/pressurising steps, the main polishing segment
     time-warped to the chosen polishing time, then the recorded rinse/unload steps. */
  function timeline(trace, tSet) {
    const n = trace.t.length, pre = trace.main_start, mainRec = trace.main_end - trace.main_start, post = n - trace.main_end - 1;
    const prefix = [0];
    for (let i = trace.main_start; i <= trace.main_end; i++) prefix.push(prefix[prefix.length - 1] + trace.p_main[i]);
    return { pre, mainRec, post, total: (t = tSet) => pre + t + post, prefix };
  }

  function phaseOf(trace, idx) {
    if (idx < trace.main_start) return trace.p_main[idx] > 1 ? 'pressurize' : 'load';
    if (idx <= trace.main_end) return 'polish';
    if (trace.rinse_start !== null && idx >= trace.rinse_start && idx <= trace.rinse_end) return 'rinse';
    return 'unload';
  }

  /* A recorded trace used as the step/sensor template of a virtual wafer, rescaled to the setpoint. */
  function scaleTrace(tpl, setpoint, anomaly) {
    const f = setpoint / tpl.plateau;
    const tr = { ...tpl, p_main: tpl.p_main.map(v => v * f), p_center: tpl.p_center.map(v => v * f), plateau: setpoint };
    if (anomaly) {
      for (let i = tr.main_start + anomaly.after; i <= tr.main_end; i++) { tr.p_main[i] *= 1 + anomaly.drop; tr.p_center[i] *= 1 + anomaly.drop; }
    }
    return tr;
  }
  const mainMean = tr => { let sum = 0; for (let i = tr.main_start; i <= tr.main_end; i++) sum += tr.p_main[i]; return sum / (tr.main_end - tr.main_start + 1); };

  function checkPolicy(p) {
    if (!(Number.isInteger(p.sample) && p.sample >= 1) && p.sample !== 'manual') throw new Error('계측 규칙을 확인하세요.');
    if (!(Number.isInteger(p.delay) && p.delay >= 0 && p.delay <= 5)) throw new Error('결과 도착 지연은 0~5장입니다.');
    return { sample: p.sample, delay: p.delay };
  }

  function createSession({ modelJson, replay, LabStateModel, LabVirtualTool, source = 'virtual', seed, events = true,
    policy = { sample: 'manual', delay: 0 }, auto = false, count }) {
    if (!replay || !Array.isArray(replay.wafers) || !replay.wafers.length) throw new Error('재생 데이터가 없습니다.');
    if (!['virtual', 'replay'].includes(source)) throw new Error('알 수 없는 결과 기준입니다.');
    const virtual = source === 'virtual', meta = modelJson.recipe_meta;
    const model = LabStateModel.create(modelJson);
    model.restore(replay.warm_state);
    const lastP = { ...replay.last_pressure };
    const history = Object.fromEntries(Object.entries(replay.history).map(([k, v]) => [k, v.slice()]));
    let W, end, tool = null, vs = null;

    if (!virtual) {
      W = replay.wafers;
      end = Math.min(W.length, count || W.length);
    } else {
      if (!LabVirtualTool) throw new Error('가상 장비 모듈이 없습니다.');
      const s0 = (seed === undefined ? (Date.now() ^ Math.floor(Math.random() * 1e9)) : seed) >>> 0;
      const snap = model.snapshot();
      tool = LabVirtualTool.create(modelJson, RECIPES.map(r => [r, snap[r].level, snap[r].var]), s0);
      vs = { seed: s0, events: !!events,
        eventRng: LabVirtualTool.mulberry32((s0 ^ 0x51ED27A3) >>> 0),     // disturbances: same seed -> same disturbances
        pickRng: LabVirtualTool.mulberry32((s0 ^ 0x9E3779B9) >>> 0),      // sensor templates and idle gaps
        templates: Object.fromEntries(RECIPES.map(r => [r, replay.wafers.filter(w => w.recipe === r && w.trace &&
          Math.abs(w.p_main / modelJson.recipes[r].p_ref - 1) < 0.01).map(w => w.trace)])),
        nextPos: Object.fromEntries(RECIPES.map(r => [r, snap[r].at + 1])),
        pending: { rest: new Set(), pad: new Set() }, uPad: 140, uDresser: 300, clockH: 0, recipe: 'A456',
        setpoint: Object.fromEntries(RECIPES.map(r => [r, modelJson.recipes[r].p_ref])),
        range: modelJson.virtual.pressure_range, padStep: modelJson.virtual.pad_step };
      W = [];
      end = Math.min(VIRTUAL_CAP, count || VIRTUAL_CAP);
    }

    const s = { n: 1, end, records: [], queue: [], log: [], finished: 0, measurements: 0, run: null,
      phase: 'ready', policy: checkPolicy(policy), auto: !!auto, source, virtual, seed: vs ? vs.seed : null,
      events: vs ? vs.events : true, notice: null };
    const event = (kind, text, extra = {}) => { const e = { kind, text, n: s.n, ...extra }; s.log.unshift(e); return e; };

    /* Virtual wafers are created on demand, in order, so disturbances depend only on the seed. */
    function ensure(n) {
      while (virtual && W.length < n) {
        const i = W.length + 1, r = vs.eventRng;
        const u1 = r.random(), u2 = r.random(), u3 = r.random(), u4 = r.random();
        const on = vs.events && i > 1;
        W.push({ n: i, label: `V${String(i).padStart(3, '0')}`, recipe: null, virtual: true, template: null,
          baseGap: 60 + Math.round(u4 * 180), rest: on && u1 < DISTURB.rest, pad_change: on && u1 >= DISTURB.rest && u2 < DISTURB.pad,
          anomaly: on && u3 < DISTURB.anomaly ? ANOMALY : null, randomEvent: on && (u1 < DISTURB.rest || u2 < DISTURB.pad),
          after_rest: false, after_pad_change: false, position: null, clock: null, u_pad: null, u_dresser: null,
          gap_s: null, t_start_h: null, t_end_h: null, p_main: null, mrr: null, trace: null });
      }
      return W[n - 1];
    }
    const wafer = () => (virtual ? ensure(s.n) : W[s.n - 1]);

    /* A virtual wafer learns its context (recipe, position, first-wafer flags, counters, time) while it waits. */
    function prepare(w) {
      if (!virtual || s.phase !== 'ready') return; // a started wafer's context is frozen
      if (w.recipe !== vs.recipe || !w.template) { w.recipe = vs.recipe; w.template = vs.templates[w.recipe][Math.floor(vs.pickRng.random() * vs.templates[w.recipe].length)]; }
      w.position = vs.nextPos[w.recipe]; w.clock = w.position;
      w.after_rest = w.rest || vs.pending.rest.has(w.recipe);
      w.after_pad_change = w.pad_change || vs.pending.pad.has(w.recipe);
      w.u_pad = w.pad_change ? vs.padStep : vs.uPad + vs.padStep;
      w.u_dresser = vs.uDresser + 1;
      w.gap_s = w.rest ? REST_S : w.baseGap;
      w.t_start_h = vs.clockH + w.gap_s / 3600;
    }

    function announce() {
      const w = wafer();
      s.notice = null;
      if (virtual) {
        if (w.randomEvent && w.rest) s.notice = { kind: 'idle', title: '장비가 3시간 쉬었다가 다시 돌아갑니다', text: '실제 기록에서 쉬었다 시작한 첫 장은 평소보다 조금 더 깎였습니다. 예측에 이벤트 보정(+)이 붙습니다.' };
        if (w.randomEvent && w.pad_change) s.notice = { kind: 'maint', title: '정비 팀이 패드를 교체했습니다', text: '교체 직후 첫 장은 조금 더 깎일 수 있습니다. 패드 사용량은 0부터 다시 쌓입니다.' };
        return;
      }
      if (w.pad_change) { event('maint', `유지보수: 패드 교체 (${w.label} 투입 전)`); s.notice = { kind: 'maint', title: '실제 기록: 패드 교체', text: '이 웨이퍼 앞에서 실제로 패드가 교체됐습니다.' }; }
      if (w.rest) { event('idle', `장비 유휴 ${(w.gap_s / 3600).toFixed(1)}시간 후 재가동`); s.notice = { kind: 'idle', title: `실제 기록: ${(w.gap_s / 3600).toFixed(1)}시간 휴지 후 재가동`, text: '쉬었다 시작한 첫 장입니다.' }; }
      else if (w.gap_s > 500) event('info', `대기 ${(w.gap_s / 60).toFixed(0)}분 (사이에 기록되지 않은 웨이퍼가 있었을 수 있음)`);
    }

    function deliverDue() {
      const due = s.queue.filter(q => q.due <= s.finished).sort((a, b) => a.due - b.due || a.rec.n - b.rec.n);
      s.queue = s.queue.filter(q => q.due > s.finished);
      for (const q of due) {
        const r = q.rec, w = W[r.n - 1];
        model.update(ctxOf(w), w.mrr, w.p_main);
        r.measured = true; r.status = r.inSpec ? 'in' : 'out';
        event(r.inSpec ? 'ok' : 'warn', `계측 결과 ${w.label}: MRR ${w.mrr.toFixed(2)} · 제거량 ${r.removalPct.toFixed(1)}% ${r.inSpec ? '규격 안' : '규격 밖'}`);
      }
      return due.length;
    }

    function pressureInfo(recipe) {
      const p = modelJson.recipes[recipe];
      return { recipe, pRef: p.p_ref, alpha: p.alpha, available: virtual, locked: !virtual,
        setpoint: virtual ? vs.setpoint[recipe] : lastP[recipe], range: virtual ? vs.range[recipe] : null };
    }

    function current() {
      if (s.phase === 'done') return null;
      const w = wafer(); prepare(w);
      const ctx = ctxOf(w), m = meta[w.recipe];
      const planned = virtual ? vs.setpoint[w.recipe] : lastP[w.recipe];
      const pred = model.predict(ctx, planned);
      const rec = pred ? clamp(m.target_removal / pred.mrr, m.t_ref * TIME_RANGE[0], m.t_ref * TIME_RANGE[1]) : m.t_ref;
      return { wafer: w, ctx, meta: m, planned, pred, recommended: Math.round(rec * 10) / 10,
        limits: [m.t_ref * TIME_RANGE[0], m.t_ref * TIME_RANGE[1]], pending: s.queue.length,
        state: model.tracker(w.recipe).snapshot(), params: modelJson.recipes[w.recipe],
        pressure: pressureInfo(w.recipe), controls: { pressure: virtual, recipe: virtual, maintenance: virtual } };
    }

    function requireReady(what) {
      if (!virtual) throw new Error('실제 기록에서는 기록된 조건을 바꿀 수 없습니다.');
      if (s.phase !== 'ready') throw new Error(`${what}은(는) 웨이퍼 투입 전에만 바꿀 수 있습니다.`);
    }

    function setPressure(value) {
      requireReady('압력');
      const w = wafer(); prepare(w);
      const [lo, hi] = vs.range[w.recipe];
      // Controls round to 0.1; a value within 0.05 of a bound is snapped onto it.
      if (!(Number.isFinite(value) && value >= lo - 0.05 && value <= hi + 0.05)) throw new Error(`압력은 관측 범위 ${lo.toFixed(1)}~${hi.toFixed(1)} 안에서 정하세요.`);
      vs.setpoint[w.recipe] = clamp(value, lo, hi);
      return current();
    }

    function setRecipe(recipe) {
      requireReady('레시피');
      if (!RECIPES.includes(recipe)) throw new Error('지원하지 않는 레시피입니다.');
      vs.recipe = recipe;
      return current();
    }

    function setMaintenance(kind, on) {
      requireReady('정비');
      const w = wafer();
      if (kind === 'pad') w.pad_change = !!on; else if (kind === 'rest') w.rest = !!on; else throw new Error('알 수 없는 정비입니다.');
      w.randomEvent = false;
      return current();
    }

    function setPolicy(next) { s.policy = checkPolicy({ ...s.policy, ...next }); return s.policy; }

    function setEvents(on) {
      if (!virtual) throw new Error('실제 기록에서는 기록된 사건만 일어납니다.');
      vs.events = !!on; s.events = vs.events;
      W.length = Math.min(W.length, s.n); // wafers not yet reached are drawn again under the new setting
    }

    function begin(tSet) {
      if (s.phase !== 'ready') throw new Error('현재 웨이퍼 연마를 먼저 마치세요.');
      const c = current(), [lo, hi] = c.limits;
      if (!(tSet >= lo && tSet <= hi)) throw new Error(`연마 시간은 ${lo.toFixed(0)}~${hi.toFixed(0)}초 사이로 정하세요.`);
      const w = c.wafer;
      let setpoint = null, alarmRef = c.meta.p_ref;
      if (virtual) {
        // Commit the wafer's context, consume pending first-wafer flags, and start the next ones.
        vs.nextPos[w.recipe] += 1; vs.uPad = w.u_pad; vs.uDresser = w.u_dresser;
        if (w.rest) { RECIPES.forEach(r => vs.pending.rest.add(r)); event('idle', `장비 휴지 ${(REST_S / 3600).toFixed(0)}시간 후 재가동 (${w.label})`); }
        if (w.pad_change) { RECIPES.forEach(r => vs.pending.pad.add(r)); event('maint', `유지보수: 패드 교체 (${w.label} 투입 전)`); }
        vs.pending.rest.delete(w.recipe); vs.pending.pad.delete(w.recipe);
        setpoint = vs.setpoint[w.recipe]; alarmRef = setpoint;
        w.trace = scaleTrace(w.template, setpoint, w.anomaly);
      }
      s.notice = null;
      s.run = { wafer: w, ctx: c.ctx, meta: c.meta, pre: c.pred, planned: c.planned, tSet, tInitial: tSet, setpoint, alarmRef,
        recommended: c.recommended, tl: timeline(w.trace, tSet), adjusted: false, alarm: null, delay: s.policy.delay };
      s.phase = 'run';
      return s.run;
    }

    function traceIndex(run, elapsed) {
      const tr = run.wafer.trace, tl = run.tl;
      if (elapsed < tl.pre) return Math.floor(elapsed);
      if (elapsed < tl.pre + run.tSet) return tr.main_start + Math.min(tl.mainRec, Math.floor((elapsed - tl.pre) / run.tSet * (tl.mainRec + 1)));
      return Math.min(tr.t.length - 1, tr.main_end + 1 + Math.floor(elapsed - tl.pre - run.tSet));
    }

    function sample(elapsed) {
      const run = s.run; if (!run) return null;
      const tr = run.wafer.trace, idx = traceIndex(run, elapsed), phase = phaseOf(tr, idx), tl = run.tl;
      const mainElapsed = clamp(elapsed - tl.pre, 0, run.tSet);
      const seen = Math.max(0, Math.min(idx, tr.main_end) - tr.main_start + 1);
      const pMean = seen > 0 ? tl.prefix[seen] / seen : null;
      const trusted = mainElapsed >= ALARM_AFTER_S && pMean !== null;
      const inproc = trusted ? model.predict(run.ctx, pMean) : run.pre;
      const dev = trusted ? pMean / run.alarmRef - 1 : 0;
      let suggestion = null;
      if (trusted && Math.abs(dev) > PRESSURE_ALARM) {
        if (!run.alarm) {
          run.alarm = { dev, at: mainElapsed };
          event('alarm', `공정 이상: 주 압력 ${(dev * 100).toFixed(1)}% (${virtual ? '설정값' : '기준'} ${run.alarmRef.toFixed(1)} 대비) · ${run.wafer.label}`);
        }
        const t = clamp(run.meta.target_removal / inproc.mrr, run.meta.t_ref * TIME_RANGE[0], run.meta.t_ref * TIME_RANGE[1]);
        if (Math.abs(t - run.tSet) >= 1 && t > mainElapsed + 2) suggestion = Math.round(t * 10) / 10;
      }
      const values = Object.fromEntries(['p_main', 'p_center', 'p_retainer', 'wafer_rot', 'stage_rot', 'head_rot', 'slurry_c']
        .map(k => [k, tr[k][idx]]));
      return { elapsed, total: tl.total(run.tSet), idx, phase, values, mainElapsed, tSet: run.tSet,
        predictedRemovalPct: inproc ? inproc.mrr * mainElapsed / run.meta.target_removal * 100 : null,
        projectedFinalPct: inproc ? inproc.mrr * run.tSet / run.meta.target_removal * 100 : null,
        inproc, pressureDev: dev, alarmRef: run.alarmRef, alarm: run.alarm, suggestion,
        correctionApplied: trusted && Math.abs(inproc.pressure_factor - run.pre.pressure_factor) > 1e-9 };
    }

    function adjust(newT, elapsed) {
      const run = s.run; if (!run) throw new Error('연마 중이 아닙니다.');
      const [lo, hi] = [run.meta.t_ref * TIME_RANGE[0], run.meta.t_ref * TIME_RANGE[1]];
      const mainElapsed = elapsed - run.tl.pre;
      if (mainElapsed < 0 || mainElapsed >= run.tSet) throw new Error('본 연마 구간에서만 종료 시간을 바꿀 수 있습니다.');
      if (!(newT >= lo && newT <= hi && newT > mainElapsed + 1)) throw new Error('조정할 수 없는 종료 시간입니다.');
      event('info', `${run.wafer.label} 종료 시간 조정 ${run.tSet.toFixed(1)}초 → ${newT.toFixed(1)}초`);
      run.tSet = newT; run.adjusted = true;
      return run;
    }

    function finish() {
      const run = s.run; if (!run) throw new Error('연마 중인 웨이퍼가 없습니다.');
      const w = run.wafer, m = run.meta;
      if (virtual) {
        // The virtual tool decides the outcome now, from the pressure the wafer actually saw.
        const pObs = mainMean(w.trace);
        const out = tool.wafer(w.recipe, pObs, w.after_rest, w.after_pad_change, w.u_pad);
        w.mrr = out.mrr; w.p_main = pObs; w.truth = out;
        w.t_end_h = w.t_start_h + run.tl.total(run.tSet) / 3600; vs.clockH = w.t_end_h;
      }
      const inproc = model.predict(run.ctx, w.p_main);
      const removalPct = w.mrr * run.tSet / m.target_removal * 100;
      const pRef = modelJson.recipes[w.recipe].p_ref;
      const rec = { n: w.n, label: w.label, recipe: w.recipe, tSet: run.tSet, tInitial: run.tInitial, setpoint: run.setpoint,
        recommended: run.recommended, adjusted: run.adjusted, pre: run.pre, inproc, alarm: !!run.alarm, delay: run.delay,
        removalPct, inSpec: Math.abs(removalPct - 100) <= m.spec_pct,
        covered: run.pre ? (w.mrr >= run.pre.low && w.mrr <= run.pre.high) : null,
        stale: !!run.pre && run.pre.steps > 1.5,                    // predicted without the latest same-recipe measurement
        pressureChanged: run.setpoint !== null && Math.abs(run.setpoint / pRef - 1) > 0.003,
        measured: false, status: 'awaiting', events: { rest: w.rest, pad: w.pad_change, afterRest: w.after_rest, afterPad: w.after_pad_change } };
      s.records.push(rec);
      lastP[w.recipe] = w.p_main;
      s.run = null; s.phase = 'decide';
      return rec;
    }

    /* Measurement rule: 'manual' leaves every wafer to the operator (returns null). */
    function shouldMeasure(rec) {
      if (s.policy.sample === 'manual') return null;
      const k = s.records.filter(r => r.recipe === rec.recipe).length;
      return (k - 1) % s.policy.sample === 0;
    }

    function metrology(measure) {
      if (s.phase !== 'decide') throw new Error('계측 결정 단계가 아닙니다.');
      const rec = s.records[s.records.length - 1];
      s.finished += 1;
      if (measure) {
        s.measurements += 1; rec.status = 'queued';
        s.queue.push({ rec, due: s.finished + s.policy.delay });
        event('info', `${rec.label} 계측 의뢰${s.policy.delay ? ` (결과는 ${s.policy.delay}장 뒤)` : ''}`);
      } else {
        rec.status = 'skipped';
        event('info', `${rec.label} 계측 생략 · 결과 미확인으로 출하`);
      }
      deliverDue();
      if (s.n >= s.end) { s.phase = 'done'; s.queue.forEach(q => { q.due = s.finished; }); deliverDue(); return null; }
      s.n += 1; s.phase = 'ready';
      announce();
      return current();
    }

    function statsOf(r) {
      const known = r.filter(x => x.measured), withPre = r.filter(x => x.pre), widths = withPre.map(x => x.pre.high - x.pre.low);
      return { count: r.length, measured: known.length, inSpec: r.filter(x => x.inSpec).length,
        yieldPct: r.length ? 100 * r.filter(x => x.inSpec).length / r.length : 0,
        meanAbsErrPct: r.length ? r.reduce((a, x) => a + Math.abs(x.removalPct - 100), 0) / r.length : 0,
        coveragePct: withPre.length ? 100 * withPre.filter(x => x.covered).length / withPre.length : null,
        meanWidth: widths.length ? widths.reduce((a, b) => a + b, 0) / widths.length : null,
        adjusted: r.filter(x => x.adjusted).length, alarms: r.filter(x => x.alarm).length };
    }

    /* Results so far, overall and by situation (a wafer can belong to more than one). */
    function summary() {
      const r = s.records, plain = x => !(x.events.afterRest || x.events.afterPad) && !x.stale && !x.alarm && !x.pressureChanged;
      const groups = [
        ['normal', '정상 운전', r.filter(plain)],
        ['event', '휴지·패드 교체 직후 첫 장', r.filter(x => x.events.afterRest || x.events.afterPad)],
        ['stale', '최근 측정이 반영되지 않은 예측', r.filter(x => x.stale)],
        ['alarm', '연마 중 압력 경보', r.filter(x => x.alarm)],
        ['pressure', '압력 설정을 바꾼 웨이퍼', r.filter(x => x.pressureChanged)],
      ];
      return { source, seed: s.seed, policy: { ...s.policy }, auto: s.auto, ...statsOf(r),
        inSpecKnown: r.filter(x => x.measured && x.inSpec).length, pendingResults: s.queue.length,
        situations: groups.map(([id, title, rows]) => ({ id, title, ...statsOf(rows) })),
        suggestions: SUGGESTIONS.map(x => ({ id: x.id, text: x.text, done: !!x.done(s) })) };
    }

    announce();
    return {
      get state() { return s; }, get history() { return history; }, get wafers() { return W; }, meta, model,
      current, begin, sample, adjust, finish, metrology, shouldMeasure, summary, pressureInfo,
      setPressure, setRecipe, setMaintenance, setPolicy, setEvents,
      inSpecProbability: (pred, t, m) => inSpecProbability(pred, t, m),
    };
  }

  return { SUGGESTIONS, DISTURB, createSession, inSpecProbability, normCdf, timeline, phaseOf, scaleTrace, PRESSURE_ALARM, TIME_RANGE };
});
