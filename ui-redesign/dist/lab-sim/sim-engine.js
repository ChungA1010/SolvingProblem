/* CMP lab simulator engine (issue #6). No DOM: session state, recipe-step timeline, metrology queue,
   scoring, chapters and tasks. Two sources of wafer outcomes:
   - 'virtual' (practice): the learned state model run forward by LabVirtualTool; outcomes respond to the
     operator's pressure setpoint and maintenance and are model-generated, not measurements.
   - 'replay' (real record): PHM 2016 fold 5 outcomes exactly as measured. */
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
  const ANOMALY = Object.freeze({ drop: -0.065, after: 8 }); // like the real A456 low-pressure episode (-6.6%)

  const PRACTICE_CHAPTERS = Object.freeze([
    Object.freeze({ id: 'basic', title: '기본 운전', from: 1, to: 8, policy: { sample: 1, delay: 0 }, pressureLocked: true,
      intro: '장비가 정상 운전 중입니다. 웨이퍼마다 예측 MRR을 보고 연마 시간을 정하세요. 계측 결과가 바로 들어와 장비 상태 추정이 갱신됩니다.',
      watch: ['같은 조건인데도 웨이퍼마다 결과가 달라지는 것', '계측 결과가 들어오면 예측이 어떻게 따라가는지'],
      lesson: '같은 레시피라도 보이지 않는 장비 상태가 MRR을 바꿉니다. 측정으로 상태를 추적하고 다음 웨이퍼의 시간을 보정하는 것이 R2R 제어입니다.' }),
    Object.freeze({ id: 'restart', title: '재가동', from: 9, to: 13, event: 'rest', policy: { sample: 1, delay: 0 }, pressureLocked: true,
      intro: '장비가 3시간 동안 쉬었다가 다시 돌아갑니다. 실제 기록에서 쉬었다 시작한 첫 장은 평소보다 조금 더 깎였습니다.',
      watch: ['재가동 첫 장에 붙는 이벤트 보정(+)', '둘째 장부터는 효과가 사라지는지'],
      lesson: '재가동 효과는 첫 장에만 나타났습니다. 모델은 이 일회성 효과를 학습해 첫 장만 보정합니다.' }),
    Object.freeze({ id: 'pad', title: '패드 교체', from: 14, to: 18, event: 'pad', policy: { sample: 1, delay: 0 }, pressureLocked: true,
      intro: '정비 팀이 연마 패드를 새것으로 교체했습니다. 교체 직후 첫 장도 평소와 다르게 깎일 수 있습니다.',
      watch: ['교체 직후 첫 장의 보정', '패드 사용량이 0에서 다시 쌓이는 것'],
      lesson: '패드 교체 직후 첫 장은 조금 더 깎였습니다. 반면 패드가 닳으며 MRR이 떨어지는 효과는 이 장비 기록에서 수명 전체 1% 미만으로 작았습니다.' }),
    Object.freeze({ id: 'delay', title: '계측 지연', from: 19, to: 30, policy: { sample: 1, delay: 2 }, pressureLocked: true,
      intro: '계측 장비에 대기열이 생겨 결과가 2장 늦게 도착합니다. 최신 장비 상태를 모르는 채로 다음 웨이퍼를 연마해야 합니다.',
      watch: ['예측 구간이 넓어지는 것', '규격 안에 들 확률이 낮아지는 것'],
      lesson: '측정이 늦거나 드물면 장비 상태를 놓쳐 예측이 흐려집니다. 계측 주기와 지연은 비용과 품질의 균형으로 정합니다.' }),
    Object.freeze({ id: 'pressure', title: '압력 이상', from: 31, to: 40, policy: { sample: 1, delay: 0 }, pressureLocked: false,
      anomalies: Object.freeze([3, 6, 8]),
      intro: '주 압력 조절기가 불안정합니다. 연마 도중 압력이 설정값보다 떨어지면 경보가 뜹니다. 이번 챕터부터 압력 설정도 직접 바꿀 수 있습니다.',
      watch: ['경보 뒤 연마 중 보정 MRR', '종료 시간을 늘려 목표를 맞추는 판단', '압력 설정을 낮추면 MRR과 권장 시간이 어떻게 바뀌는지'],
      lesson: 'A456은 압력에 비례해 MRR이 변했습니다(Preston 관계, 실제 저압 웨이퍼 21장 근거). 연마 중 센서는 정상 운전에서는 새 정보가 적지만, 이상은 즉시 알려 줍니다.' }),
  ]);

  const TASKS = Object.freeze([
    Object.freeze({
      id: 'practice', code: '연습', title: '하루 운전 · 5개 챕터', source: 'virtual', recipe: 'A456', start: 1, count: 40,
      chapters: PRACTICE_CHAPTERS, policy: { sample: 1, delay: 0 }, auto: false, recommended: true,
      goal: '학습된 모델로 움직이는 가상 장비를 하루 동안 운전합니다. 기본 운전 → 재가동 → 패드 교체 → 계측 지연 → 압력 이상 순서로 상황이 바뀝니다. 40장 중 26장 이상을 규격(목표 ±5%) 안에 넣어 보세요.',
      focus: ['예측을 보고 연마 시간을 정하기', '이벤트·계측 지연·압력 이상에 대응하기', '챕터별로 수율과 예측 구간이 어떻게 달라지는지'],
      pass: s => s.inSpec >= 26,
      lesson: '장비 상태는 보이지 않지만 측정으로 추적할 수 있고, 예측은 측정이 줄면 흐려지며, 연마 중 센서는 이상을 알려 줍니다. 이것이 CMP 운영의 R2R 판단입니다.',
    }),
    Object.freeze({
      id: 'sandbox', code: '연습', title: '자유 연습', source: 'virtual', recipe: 'A456', start: 1, count: 60,
      policy: { sample: 1, delay: 0 }, auto: false, configurable: true, controls: Object.freeze({ recipe: true, maintenance: true }),
      goal: '레시피, 압력, 정비(패드 교체·장비 휴지), 계측 정책을 직접 바꿔 가며 60장을 운전합니다. 같은 웨이퍼 흐름으로 다시 하면 전략끼리 비교할 수 있습니다.',
      focus: ['압력 설정이 MRR과 권장 시간에 주는 영향 (A456만 근거 있음)', '정비 직후 첫 장', '계측 정책에 따른 수율 차이'],
      pass: () => true,
      lesson: '조건을 바꾸면 모델이 학습한 범위 안에서만 결과가 달라집니다. B456의 압력, 회전·슬러리처럼 근거가 없는 것은 바꿔도 결과가 변하지 않습니다.',
    }),
    Object.freeze({
      id: 'replay', code: '실전', title: '실제 기록 재생 · 14일', source: 'replay', start: 1, count: 327,
      policy: { sample: 1, delay: 0 }, auto: false, configurable: true,
      goal: '실제 공장의 14일 운전 기록 327장을 그대로 재생합니다. 결과는 실측값입니다. 연습에서 익힌 운영이 실제 데이터에서도 통하는지 확인하세요.',
      focus: ['실제 장비의 휴지·패드 교체·압력 이상', '연습 결과와 실제 결과 비교'],
      pass: () => true,
      lesson: '실제 기록에서도 같은 원리가 작동합니다. 다만 실제 결과는 정해져 있어 압력 같은 조건은 바꿀 수 없습니다.',
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

  function createSession({ modelJson, replay, LabStateModel, LabVirtualTool, task, policy, auto, seed }) {
    if (!replay || !Array.isArray(replay.wafers) || !replay.wafers.length) throw new Error('재생 데이터가 없습니다.');
    const virtual = task.source === 'virtual', meta = modelJson.recipe_meta;
    const pol = { ...(policy || task.policy) };
    if (!(Number.isInteger(pol.sample) && pol.sample >= 1) && pol.sample !== 'manual') throw new Error('계측 주기를 확인하세요.');
    if (!(Number.isInteger(pol.delay) && pol.delay >= 0 && pol.delay <= 5)) throw new Error('계측 지연은 0~5장입니다.');
    const model = LabStateModel.create(modelJson);
    model.restore(replay.warm_state);
    const lastP = { ...replay.last_pressure };
    const history = Object.fromEntries(Object.entries(replay.history).map(([k, v]) => [k, v.slice()]));
    let W, start, end, tool = null, vs = null;

    if (!virtual) {
      W = replay.wafers;
      start = clamp(task.start, 1, W.length); end = Math.min(W.length, start + task.count - 1);
      for (let n = 1; n < start; n++) { // earlier production is already measured history
        const w = W[n - 1], ctx = ctxOf(w), pred = model.predict(ctx, lastP[w.recipe]);
        model.update(ctx, w.mrr, w.p_main);
        lastP[w.recipe] = w.p_main;
        history[w.recipe].push({ mrr: w.mrr, pred: pred && pred.mrr, low: pred && pred.low, high: pred && pred.high });
        if (history[w.recipe].length > 40) history[w.recipe].shift();
      }
    } else {
      if (!LabVirtualTool) throw new Error('가상 장비 모듈이 없습니다.');
      const s0 = (seed === undefined ? (Date.now() ^ Math.floor(Math.random() * 1e9)) : seed) >>> 0;
      const snap = model.snapshot();
      tool = LabVirtualTool.create(modelJson, RECIPES.map(r => [r, snap[r].level, snap[r].var]), s0);
      const rng = LabVirtualTool.mulberry32((s0 ^ 0x9E3779B9) >>> 0);
      const templates = Object.fromEntries(RECIPES.map(r => [r, replay.wafers.filter(w => w.recipe === r && w.trace &&
        Math.abs(w.p_main / modelJson.recipes[r].p_ref - 1) < 0.01).map(w => w.trace)]));
      vs = { seed: s0, rng, templates, nextPos: Object.fromEntries(RECIPES.map(r => [r, snap[r].at + 1])),
        pending: { rest: new Set(), pad: new Set() }, uPad: 140, uDresser: 300, clockH: 0,
        setpoint: Object.fromEntries(RECIPES.map(r => [r, modelJson.recipes[r].p_ref])),
        range: modelJson.virtual.pressure_range, padStep: modelJson.virtual.pad_step };
      const pick = r => vs.templates[r][Math.floor(vs.rng.random() * vs.templates[r].length)];
      vs.pick = pick;
      W = [];
      for (let i = 1; i <= task.count; i++) {
        const recipe = task.recipe || 'A456';
        W.push({ n: i, label: `V${String(i).padStart(3, '0')}`, recipe, virtual: true, template: pick(recipe),
          baseGap: 60 + Math.round(vs.rng.random() * 180), rest: false, pad_change: false, anomaly: null,
          after_rest: false, after_pad_change: false, position: null, clock: null, u_pad: null, u_dresser: null,
          gap_s: null, t_start_h: null, t_end_h: null, p_main: null, mrr: null, trace: null });
      }
      for (const ch of task.chapters || []) {
        if (ch.event === 'rest') W[ch.from - 1].rest = true;
        if (ch.event === 'pad') W[ch.from - 1].pad_change = true;
        for (const a of ch.anomalies || []) W[ch.from - 2 + a].anomaly = ANOMALY;
      }
      start = 1; end = W.length;
    }

    const s = { n: start, end, records: [], queue: [], log: [], finished: 0, measurements: 0, run: null,
      phase: 'ready', policy: pol, auto: !!auto, task, virtual, seed: vs ? vs.seed : null, chapterIntro: null, chapterId: null };
    const event = (kind, text, extra = {}) => { const e = { kind, text, n: s.n, ...extra }; s.log.unshift(e); return e; };
    const wafer = () => W[s.n - 1];
    const chapterAt = n => (task.chapters || []).find(c => n >= c.from && n <= c.to) || null;

    /* Virtual wafers learn their context (position, after-event flags, counters, time) when they become current. */
    function prepare(w) {
      if (!virtual || s.phase !== 'ready') return; // a started wafer's context is frozen
      w.position = vs.nextPos[w.recipe]; w.clock = w.position;
      w.after_rest = w.rest || vs.pending.rest.has(w.recipe);
      w.after_pad_change = w.pad_change || vs.pending.pad.has(w.recipe);
      w.u_pad = w.pad_change ? vs.padStep : vs.uPad + vs.padStep;
      w.u_dresser = vs.uDresser + 1;
      w.gap_s = w.rest ? REST_S : w.baseGap;
      w.t_start_h = vs.clockH + w.gap_s / 3600;
    }

    function enterChapter() {
      const ch = chapterAt(s.n);
      if (!ch || ch.id === s.chapterId) return;
      s.chapterId = ch.id; s.policy = { ...ch.policy }; s.chapterIntro = ch;
      event('chapter', `챕터 ${task.chapters.indexOf(ch) + 1} · ${ch.title}`);
    }

    function announce() {
      if (virtual) return; // virtual events are logged when the wafer starts (operator may still change them)
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

    function pressureInfo(recipe) {
      const p = modelJson.recipes[recipe], ch = chapterAt(s.n);
      return { recipe, pRef: p.p_ref, alpha: p.alpha, available: virtual, locked: !virtual || !!(ch && ch.pressureLocked),
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
        pressure: pressureInfo(w.recipe), chapter: chapterAt(s.n) };
    }

    function requireReady(what) {
      if (!virtual) throw new Error('실제 기록 재생에서는 조건을 바꿀 수 없습니다.');
      if (s.phase !== 'ready') throw new Error(`${what}은(는) 웨이퍼 투입 전에만 바꿀 수 있습니다.`);
    }

    function setPressure(value) {
      requireReady('압력');
      const w = wafer(), info = pressureInfo(w.recipe);
      if (info.locked) throw new Error('이 챕터에서는 압력 설정이 잠겨 있습니다.');
      const [lo, hi] = info.range;
      // Controls round to 0.1; a value within 0.05 of a bound is snapped onto it.
      if (!(Number.isFinite(value) && value >= lo - 0.05 && value <= hi + 0.05)) throw new Error(`압력은 관측 범위 ${lo.toFixed(1)}~${hi.toFixed(1)} 안에서 정하세요.`);
      vs.setpoint[w.recipe] = clamp(value, lo, hi);
      return current();
    }

    function setRecipe(recipe) {
      requireReady('레시피');
      if (!(task.controls && task.controls.recipe)) throw new Error('이 과제에서는 레시피가 정해져 있습니다.');
      if (!RECIPES.includes(recipe)) throw new Error('지원하지 않는 레시피입니다.');
      const w = wafer(); w.recipe = recipe; w.template = vs.pick(recipe);
      return current();
    }

    function setMaintenance(kind, on) {
      requireReady('정비');
      if (!(task.controls && task.controls.maintenance)) throw new Error('이 과제에서는 정비 일정이 정해져 있습니다.');
      const w = wafer();
      if (kind === 'pad') w.pad_change = !!on; else if (kind === 'rest') w.rest = !!on; else throw new Error('알 수 없는 정비입니다.');
      return current();
    }

    function ackChapter() { s.chapterIntro = null; }

    function begin(tSet) {
      if (s.phase !== 'ready') throw new Error('현재 웨이퍼 연마를 먼저 마치세요.');
      if (s.chapterIntro) throw new Error('챕터 안내를 먼저 확인하세요.');
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
      s.run = { wafer: w, ctx: c.ctx, meta: c.meta, pre: c.pred, planned: c.planned, tSet, tInitial: tSet, setpoint, alarmRef,
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
      const rec = { n: w.n, label: w.label, recipe: w.recipe, tSet: run.tSet, tInitial: run.tInitial, setpoint: run.setpoint,
        recommended: run.recommended, adjusted: run.adjusted, pre: run.pre, inproc, alarm: !!run.alarm,
        removalPct, inSpec: Math.abs(removalPct - 100) <= m.spec_pct,
        covered: run.pre ? (w.mrr >= run.pre.low && w.mrr <= run.pre.high) : null, chapter: s.chapterId,
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
      enterChapter();
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

    function summary() {
      const r = s.records, all = statsOf(r);
      return { task: s.task.id, source: task.source, seed: s.seed, policy: { ...s.policy }, auto: s.auto, ...all,
        inSpecKnown: r.filter(x => x.measured && x.inSpec).length,
        chapters: (task.chapters || []).map((c, i) => ({ id: c.id, index: i + 1, title: c.title, lesson: c.lesson, ...statsOf(r.filter(x => x.chapter === c.id)) })),
        passed: s.phase === 'done' ? !!s.task.pass({ inSpec: all.inSpec }) : null };
    }

    enterChapter();
    announce();
    return {
      get state() { return s; }, get history() { return history; }, wafers: W, meta, model,
      current, begin, sample, adjust, finish, metrology, shouldMeasure, summary, pressureInfo,
      setPressure, setRecipe, setMaintenance, ackChapter,
      inSpecProbability: (pred, t, m) => inSpecProbability(pred, t, m),
    };
  }

  return { TASKS, PRACTICE_CHAPTERS, createSession, inSpecProbability, normCdf, timeline, phaseOf, scaleTrace, PRESSURE_ALARM, TIME_RANGE };
});
