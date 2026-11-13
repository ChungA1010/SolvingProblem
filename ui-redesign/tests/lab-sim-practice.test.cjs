const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const LabStateModel = require('../dist/lab-sim/state-model.js');
const LabVirtualTool = require('../dist/lab-sim/virtual-tool.js');
const Engine = require('../dist/lab-sim/sim-engine.js');

const modelJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'lab-sim', 'state-model-v2.json'), 'utf8'));

// Synthetic templates only (no PHM values): a 60 s recipe with a 35 s main segment.
function trace(pRef) {
  const t = [], p = [];
  for (let i = 0; i < 60; i++) { t.push(i); p.push(i < 5 ? 0 : i < 10 ? pRef * (i - 4) / 6 : i <= 44 ? pRef : i <= 50 ? pRef * 0.8 : 0); }
  const flat = v => t.map(() => v);
  return { t, p_main: p, p_center: flat(60), p_retainer: flat(1400), wafer_rot: flat(35), stage_rot: flat(130), head_rot: flat(157),
    slurry_c: t.map((_, i) => (i >= 10 && i <= 44 ? 450 : 0)), main_start: 10, main_end: 44, rinse_start: 45, rinse_end: 50, plateau: pRef };
}
const replay = {
  wafers: ['A456', 'B456', 'A456', 'B456'].map((recipe, i) => ({ n: i + 1, recipe, p_main: modelJson.recipes[recipe].p_ref, trace: trace(modelJson.recipes[recipe].p_ref) })),
  warm_state: { A456: { level: 77, var: 2, at: 99, updates: 100 }, B456: { level: 83, var: 3, at: 99, updates: 100 } },
  last_pressure: { A456: modelJson.recipes.A456.p_ref, B456: modelJson.recipes.B456.p_ref },
  history: { A456: [], B456: [] },
};
const task = id => Engine.TASKS.find(t => t.id === id);
const make = (id, extra = {}) => Engine.createSession({ modelJson, replay, LabStateModel, LabVirtualTool, task: task(id), seed: 42, ...extra });
function polish(s, { t, measure = true, adjust = false } = {}) {
  if (s.state.chapterIntro) s.ackChapter();
  const c = s.current(); s.begin(t ?? c.recommended);
  let last; const total = s.sample(0).total;
  for (let e = 0; e <= total + 1; e += 1) {
    last = s.sample(Math.min(e, s.sample(0).total)) || last;
    if (adjust && last.suggestion && !s.state.run.adjusted) s.adjust(last.suggestion, e);
  }
  const rec = s.finish(); s.metrology(measure); return { rec, last };
}

test('practice day walks through five chapters with their policies and events', () => {
  const s = make('practice');
  assert.equal(s.state.chapterIntro.id, 'basic');
  assert.throws(() => s.begin(s.current().recommended), /챕터 안내/);
  s.ackChapter();
  const seen = [];
  for (let i = 0; i < 40; i++) {
    if (s.state.chapterIntro) { seen.push([s.state.n, s.state.chapterIntro.id, s.state.policy.delay]); s.ackChapter(); }
    const w = s.current().wafer;
    if (w.n === 9) assert.equal(w.after_rest, true, 'restart chapter starts after a rest');
    if (w.n === 10) assert.equal(w.after_rest, false, 'rest effect is only on the first wafer');
    if (w.n === 14) { assert.equal(w.after_pad_change, true); assert.equal(w.u_pad, modelJson.virtual.pad_step); }
    polish(s);
  }
  assert.deepEqual(seen, [[9, 'restart', 0], [14, 'pad', 0], [19, 'delay', 2], [31, 'pressure', 0]]);
  assert.equal(s.state.phase, 'done');
  const sum = s.summary();
  assert.deepEqual(sum.chapters.map(c => c.count), [8, 5, 5, 12, 10]);
  assert.equal(sum.count, 40); assert.equal(typeof sum.passed, 'boolean');
  assert.ok(s.state.log.some(e => e.kind === 'idle') && s.state.log.some(e => e.kind === 'maint'));
});

test('pressure is locked until chapter 5; chapter-5 anomalies raise alarms and lower the virtual MRR', () => {
  const s = make('practice');
  s.ackChapter();
  assert.throws(() => s.setPressure(modelJson.recipes.A456.p_ref * 0.97), /잠겨/);
  for (let i = 0; i < 30; i++) polish(s);
  s.ackChapter();
  assert.equal(s.current().pressure.locked, false);
  polish(s); polish(s);                          // V031, V032 normal
  const { rec, last } = polish(s, { adjust: true }); // V033 has the scripted pressure drop
  assert.ok(last.alarm, 'alarm raised'); assert.ok(last.pressureDev < -0.04);
  assert.equal(rec.alarm, true); assert.equal(rec.adjusted, true);
  const w = s.wafers[32];
  assert.ok(w.p_main < w.trace.plateau * 0.97, 'observed pressure stayed low');
  assert.ok(Math.abs(w.truth.factor - Math.pow(w.p_main / modelJson.recipes.A456.p_ref, modelJson.recipes.A456.alpha)) < 1e-12);
});

test('same seed + same decisions = same outcomes; a lower A456 setpoint lowers MRR through the learned response', () => {
  const a = make('sandbox'), b = make('sandbox'), c = make('sandbox');
  const pRef = modelJson.recipes.A456.p_ref, lo = modelJson.virtual.pressure_range.A456[0];
  c.ackChapter(); c.setPressure(lo);
  for (let i = 0; i < 6; i++) {
    const ra = polish(a, { t: 110 }).rec, rb = polish(b, { t: 110 }).rec, rc = polish(c, { t: 110 }).rec;
    assert.equal(ra.removalPct, rb.removalPct, 'reproducible');
    const wa = a.wafers[i], wc = c.wafers[i];
    assert.equal(wa.truth.level, wc.truth.level, 'hidden path does not depend on the operator');
    assert.ok(Math.abs((wa.mrr - wc.mrr) - wa.truth.level * (1 - wc.truth.factor)) < 1e-9, 'difference = learned pressure response');
    assert.ok(rc.pre.mrr < ra.pre.mrr, 'prediction already reflects the lower setpoint');
  }
  assert.throws(() => c.setPressure(lo - 5), /관측 범위/);
});

test('sandbox controls: recipe choice and maintenance set first-wafer flags; replay forbids condition changes', () => {
  const s = make('sandbox');
  s.setRecipe('B456');
  assert.equal(s.current().wafer.recipe, 'B456');
  assert.equal(s.current().pressure.alpha, 0, 'B456 has no supported pressure response');
  s.setMaintenance('pad', true);
  assert.equal(s.current().wafer.after_pad_change, true);
  polish(s);
  const next = s.current().wafer;          // A456: pad change happened before, first A456 wafer after it
  assert.equal(next.recipe, 'A456'); assert.equal(next.after_pad_change, true);
  polish(s);
  assert.equal(s.current().wafer.after_pad_change, false);
  s.setMaintenance('rest', true);
  assert.equal(s.current().wafer.after_rest, true); assert.equal(s.current().wafer.gap_s, 3 * 3600);
  const practice = make('practice'); practice.ackChapter();
  assert.throws(() => practice.setRecipe('B456'), /레시피가 정해져/);
  const real = Engine.createSession({ modelJson, replay: { ...replay, wafers: replay.wafers.map(w => ({ ...w, position: 100, clock: 100, after_rest: false, after_pad_change: false, gap_s: 60, mrr: 77, label: 'W' })) }, LabStateModel, task: { ...task('replay'), count: 2 } });
  assert.throws(() => real.setPressure(250), /실제 기록/);
});
