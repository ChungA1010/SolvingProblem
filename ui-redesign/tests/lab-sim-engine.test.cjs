const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const LabStateModel = require('../dist/lab-sim/state-model.js');
const Engine = require('../dist/lab-sim/sim-engine.js');

const modelJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'lab-sim', 'state-model-v2.json'), 'utf8'));

// Synthetic replay only: no PHM values are stored in the test suite.
function trace(pRef, factor = 1) {
  const t = [], p = [];
  for (let i = 0; i < 60; i++) {
    t.push(i);
    p.push(i < 5 ? 0 : i < 10 ? pRef * factor * (i - 4) / 6 : i <= 44 ? pRef * factor : i <= 50 ? pRef * 0.8 : 0);
  }
  const flat = v => t.map(() => v);
  return { t, p_main: p, p_center: flat(60), p_retainer: flat(1400), wafer_rot: flat(35), stage_rot: flat(130),
    head_rot: flat(157), slurry_c: t.map((_, i) => (i >= 10 && i <= 44 ? 450 : 0)), main_start: 10, main_end: 44,
    rinse_start: 45, rinse_end: 50, plateau: pRef * factor };
}
function replay({ n = 30, lowAt = [] } = {}) {
  const wafers = [], pos = { A456: 0, B456: 0 };
  for (let i = 1; i <= n; i++) {
    const recipe = i % 2 ? 'A456' : 'B456', pRef = modelJson.recipes[recipe].p_ref, f = lowAt.includes(i) ? 0.93 : 1;
    wafers.push({ n: i, label: `W${String(i).padStart(3, '0')}`, recipe, position: pos[recipe]++, clock: i,
      t_start_h: i * 0.1, t_end_h: i * 0.1 + 0.05, gap_s: i === 7 ? 3600 : 60, after_rest: i === 7 || i === 8,
      after_pad_change: false, pad_change: i === 12, rest: i === 7, u_pad: 10 * i, u_dresser: 5 * i,
      p_main: pRef * f, t_polish_factory: 115, mrr: (recipe === 'A456' ? 74 : 80) * f + Math.sin(i), trace: trace(pRef, f) });
  }
  return { schema_version: 1, wafers, last_pressure: { A456: modelJson.recipes.A456.p_ref, B456: modelJson.recipes.B456.p_ref },
    warm_state: { A456: { level: 74, var: 2, at: -1, updates: 50 }, B456: { level: 80, var: 3, at: -1, updates: 50 } },
    history: { A456: [{ mrr: 74, pred: 73.5, low: 68, high: 79 }], B456: [{ mrr: 80, pred: 79.8, low: 73, high: 86 }] } };
}
const session = (opts = {}) => Engine.createSession({ modelJson, replay: replay(opts.replay), LabStateModel, source: 'replay',
  policy: opts.policy || { sample: 1, delay: 0 }, count: opts.count });
const runWafer = (s, t, measure = true) => {
  const c = s.current(); s.begin(t ?? c.recommended);
  const total = s.sample(0).total;
  for (let e = 0; e <= total; e += 1) s.sample(e);
  const rec = s.finish(); s.metrology(measure); return rec;
};

test('one simulator: suggestions tick themselves and the replay source locks recorded conditions', () => {
  assert.deepEqual(Engine.SUGGESTIONS.map(x => x.id), ['inspec', 'pressure', 'skip', 'delay', 'event', 'alarm', 'replay']);
  const s = session();
  assert.equal(s.state.source, 'replay');
  assert.throws(() => s.setPressure(250), /실제 기록/);
  assert.throws(() => s.setRecipe('B456'), /실제 기록/);
  assert.equal(s.current().controls.pressure, false);
  runWafer(s);
  const sum = s.summary();
  assert.equal(sum.suggestions.find(x => x.id === 'replay').done, true);
  assert.deepEqual(sum.situations.map(x => x.id), ['normal', 'event', 'stale', 'alarm', 'pressure']);
});

test('pre-start view recommends a bounded time and rejects out-of-range input', () => {
  const s = session(), c = s.current();
  assert.ok(c.pred.mrr > 0 && c.pred.low < c.pred.mrr && c.pred.high > c.pred.mrr);
  assert.ok(c.recommended >= c.limits[0] && c.recommended <= c.limits[1]);
  const p = s.inSpecProbability(c.pred, c.recommended, c.meta);
  assert.ok(p > 0 && p < 1);
  assert.throws(() => s.begin(c.limits[1] + 10), /연마 시간은/);
});

test('recipe steps play in order and the main segment is warped to the chosen time', () => {
  const s = session(), c = s.current();
  s.begin(100);
  const seen = [], total = s.sample(0).total;
  assert.equal(total, 10 + 100 + 15);
  for (let e = 0; e < total; e += 0.5) { const ph = s.sample(e).phase; if (seen.at(-1) !== ph) seen.push(ph); }
  assert.deepEqual(seen, ['load', 'pressurize', 'polish', 'rinse', 'unload']);
  const mid = s.sample(10 + 50);
  assert.ok(Math.abs(mid.predictedRemovalPct - c.pred.mrr * 50 / c.meta.target_removal * 100) < 1e-6);
});

test('removal uses the replayed MRR and the spec is the recipe target +-5%', () => {
  const s = session(), w = s.current().wafer;
  const rec = runWafer(s, 110);
  assert.ok(Math.abs(rec.removalPct - w.mrr * 110 / s.meta[w.recipe].target_removal * 100) < 1e-9);
  assert.equal(rec.inSpec, Math.abs(rec.removalPct - 100) <= 5);
});

test('measurement delay holds the state until the result arrives; skipped wafers never update it', () => {
  const s = session({ policy: { sample: 1, delay: 2 } });
  const updates = () => s.model.tracker('A456').snapshot().updates;
  const before = updates();
  runWafer(s);                       // W001 A456 measured, due after 2 more wafers
  assert.equal(updates(), before);
  runWafer(s);                       // W002
  assert.equal(updates(), before);
  runWafer(s);                       // W003 -> W001 delivered
  assert.equal(updates(), before + 1);
  assert.equal(s.state.records[0].measured, true);
  const s2 = session();
  const b2 = s2.model.tracker('A456').snapshot().updates;
  runWafer(s2, undefined, false);
  assert.equal(s2.model.tracker('A456').snapshot().updates, b2);
  assert.equal(s2.state.records[0].status, 'skipped');
});

test('pending measurements widen the next interval', () => {
  const s = session({ policy: { sample: 1, delay: 3 } });
  const w0 = s.current().pred; runWafer(s); runWafer(s); runWafer(s);
  const later = s.current().pred;     // W004 is B456; A456 W001/W003 still pending
  runWafer(s);
  const a = s.current().pred;         // W005 A456, two A456 wafers pending
  assert.ok(a.high - a.low > w0.high - w0.low);
  assert.ok(later);
});

test('in-process pressure deviation raises one alarm; A456 is corrected, B456 (alpha 0) is not', () => {
  const s = session({ replay: { lowAt: [1, 2] } });
  const c = s.current(); s.begin(c.recommended);
  let last;
  for (let e = 0; e < 10 + c.recommended; e += 1) last = s.sample(e) ?? last;
  assert.ok(last.alarm && last.pressureDev < -0.06);
  assert.equal(last.correctionApplied, true);
  assert.ok(last.inproc.mrr < c.pred.mrr * 0.95);
  assert.ok(last.suggestion > c.recommended, 'lower pressure -> longer polish suggested');
  assert.equal(s.state.log.filter(e => e.kind === 'alarm').length, 1);
  const before = s.sample(10 + 20).total;
  s.adjust(last.suggestion - 0.5, 10 + 20);
  assert.ok(Math.abs(s.sample(10 + 21).total - (before + (last.suggestion - 0.5 - c.recommended))) < 1e-9, 'longer polish extends the timeline');
  assert.throws(() => s.adjust(200, 10 + 20), /조정할 수 없는/);
  const rec = s.finish(); s.metrology(true);
  assert.equal(rec.adjusted, true); assert.equal(rec.alarm, true);
  const b = s.current(); s.begin(b.recommended);
  for (let e = 0; e < 10 + b.recommended; e += 1) last = s.sample(e);
  assert.ok(last.alarm, 'B456 deviation is still reported');
  assert.equal(last.correctionApplied, false, 'B456 has no supported pressure response');
});

test('every-k policy, maintenance announcements and the session summary', () => {
  const s = session({ policy: { sample: 3, delay: 0 } });
  const pattern = [];
  for (let i = 0; i < 8; i++) { const c = s.current(); s.begin(c.recommended); const r = s.finish(); pattern.push(s.shouldMeasure(r)); s.metrology(pattern.at(-1)); }
  assert.deepEqual(pattern, [true, true, false, false, false, false, true, true]);
  for (let i = 0; i < 4; i++) runWafer(s);
  assert.ok(s.state.log.some(e => e.kind === 'idle'), 'rest before W007 is announced');
  assert.ok(s.state.log.some(e => e.kind === 'maint'), 'pad change before W012 is announced');
  const sum = s.summary();
  assert.equal(sum.count, 12); assert.ok(sum.measured >= 4 && sum.measured < 12);
  assert.ok(sum.coveragePct >= 0 && sum.meanWidth > 0);
});

test('the end of the replay record flushes pending results', () => {
  const s = session({ count: 4, policy: { sample: 1, delay: 3 } });
  for (let i = 0; i < 4; i++) runWafer(s);
  assert.equal(s.state.phase, 'done');
  assert.equal(s.state.records.filter(r => r.measured).length, 4);
  assert.equal(s.summary().pendingResults, 0);
  assert.equal(s.current(), null);
});
