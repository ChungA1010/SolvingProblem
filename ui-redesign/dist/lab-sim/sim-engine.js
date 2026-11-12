/* CMP lab simulator engine (issue #6). No DOM: session state, recipe-step timeline, metrology queue,
   scoring and task presets. Wafer outcomes come from the PHM 2016 replay; predictions from LabStateModel. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabSimEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PRESSURE_ALARM = 0.015;   // |p/p_ref - 1| above this raises a process deviation alarm (team flag rule)
  const ALARM_AFTER_S = 5;        // seconds of main polishing before the running pressure mean is trusted
  const TIME_RANGE = [0.6, 1.4];  // allowed polishing time as a fraction of the recipe reference time

  const TASKS = Object.freeze([
    Object.freeze({
      id: 'variation', code: 'T1', title: '같은 조건, 다른 결과', start: 1, count: 12,
      policy: { sample: 1, delay: 0 }, auto: false,
      goal: '같은 레시피·같은 장비인데도 웨이퍼마다 깎이는 속도가 달라집니다. 예측을 보고 연마 시간을 정해 12장 중 9장 이상을 규격(목표 ±5%) 안에 넣어 보세요.',
      focus: ['측정이 들어올 때마다 상태 추정이 어떻게 움직이는지', '권장 시간과 규격 안에 들 확률이 어떻게 바뀌는지'],
      pass: s => s.inSpec >= 9,
      lesson: '레시피와 조건이 같아도 장비 상태(패드·드레서·직전 운전)가 MRR을 바꿉니다. 그래서 공장은 측정 결과로 상태를 추적하고 다음 웨이퍼의 연마 시간을 보정합니다(R2R 제어).',
    }),
    Object.freeze({
      id: 'sampling', code: 'T2', title: '측정을 줄이면?', start: 1, count: 60,
      runs: Object.freeze([
        Object.freeze({ label: 'A. 매 장 측정 · 즉시 반영', policy: { sample: 1, delay: 0 } }),
        Object.freeze({ label: 'B. 5장마다 측정 · 2장 지연', policy: { sample: 5, delay: 2 } }),
      ]),
      policy: { sample: 1, delay: 0 }, auto: true,
      goal: '자동 R2R 운전으로 같은 60장을 두 가지 계측 정책으로 돌려 보고, 규격 수율과 예측 구간 폭을 비교하세요.',
      focus: ['측정이 드물거나 늦으면 예측 구간이 얼마나 넓어지는지', '측정 횟수와 수율 사이의 교환 관계'],
      pass: () => true,
      lesson: '측정은 비용과 시간이 들지만, 줄이면 장비 상태를 놓쳐 예측이 흐려지고 규격 이탈이 늘어납니다. 측정 주기는 이 균형으로 정합니다.',
    }),
    Object.freeze({
      id: 'events', code: 'T3', title: '재가동과 패드 교체', start: 78, count: 22,
      policy: { sample: 1, delay: 0 }, auto: false,
      goal: '장비가 오래 쉬었다 재가동하거나 패드를 교체한 직후의 첫 장을 주의해서 연마하세요. 이벤트 직후 첫 장의 결과에 주목합니다.',
      focus: ['이벤트 직후 첫 장의 예측 보정(+)과 실제 결과', '둘째 장부터는 효과가 사라지는지'],
      pass: s => s.inSpec >= 16,
      lesson: '실제 자료에서 휴지 후·패드 교체 후 첫 장은 평소보다 조금 더 깎였고, 효과는 첫 장에서 끝났습니다. 모델은 이 일회성 효과를 학습해 첫 장만 보정합니다.',
    }),
    Object.freeze({
      id: 'deviation', code: 'T4', title: '연마 중 이상 감지', start: 140, count: 20,
      policy: { sample: 1, delay: 0 }, auto: false,
      goal: '연마 중 주 압력이 기준에서 벗어나면 경보가 뜹니다. 실시간 보정 예측을 보고 종료 시간을 조정할지 판단하세요.',
      focus: ['A456 저압 웨이퍼에서 연마 중 보정이 결과를 얼마나 바꾸는지', 'B456은 압력 반응이 확인되지 않아 보정하지 않는 이유'],
      pass: s => s.inSpec >= 14,
      lesson: '연마 중 센서는 정상 운전에서는 새로운 정보를 거의 주지 않지만, 공정 이상(압력 변화)은 즉시 알려 줍니다. A456 저압 웨이퍼는 압력에 비례해 MRR이 줄었습니다(Preston 관계).',
    }),
    Object.freeze({
      id: 'free', code: '자유', title: '자유 운전 (14일 전체)', start: 1, count: 327,
      policy: { sample: 1, delay: 0 }, auto: false, configurable: true,
      goal: '실제 14일 운전 기록 전체를 직접 운영합니다. 계측 정책과 지연을 정하고, 수동 또는 자동 R2R로 운전하세요.',
      focus: ['수율·측정 횟수·예측 구간을 함께 관리하기'],
      pass: () => true,
      lesson: '실제 공정 운영은 예측, 측정, 정비 이벤트를 함께 보는 일입니다.',
    }),
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

  function createSession({ modelJson, replay, LabStateModel, task, policy, auto }) {
    if (!replay || !Array.isArray(replay.wafers) || !replay.wafers.length) throw new Error('재생 데이터가 없습니다.');
    const W = replay.wafers, meta = modelJson.recipe_meta;
    const start = clamp(task.start, 1, W.length), end = Math.min(W.length, start + task.count - 1);
    const pol = { ...(policy || task.policy) };
    if (!(Number.isInteger(pol.sample) && pol.sample >= 1) && pol.sample !== 'manual') throw new Error('계측 주기를 확인하세요.');
    if (!(Number.isInteger(pol.delay) && pol.delay >= 0 && pol.delay <= 5)) throw new Error('계측 지연은 0~5장입니다.');
    const model = LabStateModel.create(modelJson);
    model.restore(replay.warm_state);
    const lastP = { ...replay.last_pressure };
    const history = Object.fromEntries(Object.entries(replay.history).map(([k, v]) => [k, v.slice()]));
    for (let n = 1; n < start; n++) { // earlier production is already measured history
      const w = W[n - 1], ctx = ctxOf(w), pred = model.predict(ctx, lastP[w.recipe]);
      model.update(ctx, w.mrr, w.p_main);
      lastP[w.recipe] = w.p_main;
      history[w.recipe].push({ mrr: w.mrr, pred: pred && pred.mrr, low: pred && pred.low, high: pred && pred.high });
      if (history[w.recipe].length > 40) history[w.recipe].shift();
    }
    const s = { n: start, end, records: [], queue: [], log: [], finished: 0, measurements: 0, run: null,
      phase: 'ready', policy: pol, auto: !!auto, task };
    const event = (kind, text, extra = {}) => { const e = { kind, text, n: s.n, ...extra }; s.log.unshift(e); return e; };
    const wafer = () => W[s.n - 1];

    function announce() {
      const w = wafer();
      if (w.pad_change) event('maint', `유지보수: 패드 교체 (${w.label} 투입 전)`);
      if (w.rest) event('idle', `장비 유휴 ${(w.gap_s / 3600).toFixed(1)}시간 후 재가동`);
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

    function current() {
      if (s.phase === 'done') return null;
      const w = wafer(), ctx = ctxOf(w), m = meta[w.recipe];
      const planned = lastP[w.recipe];
      const pred = model.predict(ctx, planned);
      const rec = pred ? clamp(m.target_removal / pred.mrr, m.t_ref * TIME_RANGE[0], m.t_ref * TIME_RANGE[1]) : m.t_ref;
      return { wafer: w, ctx, meta: m, planned, pred, recommended: Math.round(rec * 10) / 10,
        limits: [m.t_ref * TIME_RANGE[0], m.t_ref * TIME_RANGE[1]], pending: s.queue.length,
        state: model.tracker(w.recipe).snapshot(), params: modelJson.recipes[w.recipe] };
    }

    function begin(tSet) {
      if (s.phase !== 'ready') throw new Error('현재 웨이퍼 연마를 먼저 마치세요.');
      const c = current(), [lo, hi] = c.limits;
      if (!(tSet >= lo && tSet <= hi)) throw new Error(`연마 시간은 ${lo.toFixed(0)}~${hi.toFixed(0)}초 사이로 정하세요.`);
      const w = c.wafer;
      s.run = { wafer: w, ctx: c.ctx, meta: c.meta, pre: c.pred, planned: c.planned, tSet, tInitial: tSet,
        recommended: c.recommended, tl: timeline(w.trace, tSet), adjusted: false, alarm: null };
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
      const dev = trusted ? pMean / run.meta.p_ref - 1 : 0;
      let suggestion = null;
      if (trusted && Math.abs(dev) > PRESSURE_ALARM) {
        if (!run.alarm) {
          run.alarm = { dev, at: mainElapsed };
          event('alarm', `공정 이상: 주 압력 ${(dev * 100).toFixed(1)}% (기준 ${run.meta.p_ref.toFixed(1)} 대비) · ${run.wafer.label}`);
        }
        const t = clamp(run.meta.target_removal / inproc.mrr, run.meta.t_ref * TIME_RANGE[0], run.meta.t_ref * TIME_RANGE[1]);
        if (Math.abs(t - run.tSet) >= 1 && t > mainElapsed + 2) suggestion = Math.round(t * 10) / 10;
      }
      const values = Object.fromEntries(['p_main', 'p_center', 'p_retainer', 'wafer_rot', 'stage_rot', 'head_rot', 'slurry_c']
        .map(k => [k, tr[k][idx]]));
      return { elapsed, total: tl.total(run.tSet), idx, phase, values, mainElapsed, tSet: run.tSet,
        predictedRemovalPct: inproc ? inproc.mrr * mainElapsed / run.meta.target_removal * 100 : null,
        projectedFinalPct: inproc ? inproc.mrr * run.tSet / run.meta.target_removal * 100 : null,
        inproc, pressureDev: dev, alarm: run.alarm, suggestion,
        correctionApplied: trusted && Math.abs(inproc.pressure_factor - 1) > 1e-12 };
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
      const inproc = model.predict(run.ctx, w.p_main);
      const removalPct = w.mrr * run.tSet / m.target_removal * 100;
      const rec = { n: w.n, label: w.label, recipe: w.recipe, tSet: run.tSet, tInitial: run.tInitial,
        recommended: run.recommended, adjusted: run.adjusted, pre: run.pre, inproc, alarm: !!run.alarm,
        removalPct, inSpec: Math.abs(removalPct - 100) <= m.spec_pct,
        covered: run.pre ? (w.mrr >= run.pre.low && w.mrr <= run.pre.high) : null,
        measured: false, status: 'awaiting', events: { rest: w.rest, pad: w.pad_change, afterRest: w.after_rest, afterPad: w.after_pad_change } };
      s.records.push(rec);
      lastP[w.recipe] = w.p_main;
      s.run = null; s.phase = 'decide';
      return rec;
    }

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

    function summary() {
      const r = s.records, known = r.filter(x => x.measured), withPre = r.filter(x => x.pre);
      const widths = withPre.map(x => x.pre.high - x.pre.low);
      return { task: s.task.id, policy: { ...s.policy }, auto: s.auto, count: r.length, measured: known.length,
        inSpec: r.filter(x => x.inSpec).length, inSpecKnown: known.filter(x => x.inSpec).length,
        yieldPct: r.length ? 100 * r.filter(x => x.inSpec).length / r.length : 0,
        meanAbsErrPct: r.length ? r.reduce((a, x) => a + Math.abs(x.removalPct - 100), 0) / r.length : 0,
        coveragePct: withPre.length ? 100 * withPre.filter(x => x.covered).length / withPre.length : null,
        meanWidth: widths.length ? widths.reduce((a, b) => a + b, 0) / widths.length : null,
        adjusted: r.filter(x => x.adjusted).length, alarms: r.filter(x => x.alarm).length,
        passed: s.phase === 'done' ? !!s.task.pass({ inSpec: r.filter(x => x.inSpec).length }) : null };
    }

    announce();
    return {
      get state() { return s; }, get history() { return history; }, wafers: W, meta, model,
      current, begin, sample, adjust, finish, metrology, shouldMeasure, summary, inSpecProbability: (pred, t, m) => inSpecProbability(pred, t, m),
    };
  }

  return { TASKS, createSession, inSpecProbability, normCdf, timeline, phaseOf, PRESSURE_ALARM, TIME_RANGE };
});
