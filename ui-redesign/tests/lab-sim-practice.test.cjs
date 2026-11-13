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
const make = (extra = {}) => Engine.createSession({ modelJson, replay, LabStateModel, LabVirtualTool, source: 'virtual', seed: 42, ...extra });
function polish(s, { t, measure = true, adjust = false } = {}) {
  const c = s.current(); s.begin(t ?? c.recommended);
  let last; const total = s.sample(0).total;
  for (let e = 0; e <= total + 1; e += 1) {
    last = s.sample(Math.min(e, s.sample(0).total)) || last;
    if (adjust && last.suggestion && !s.state.run.adjusted) s.adjust(last.suggestion, e);
  }
  const rec = s.finish(); s.metrology(measure); return { rec, last };
}

test('the virtual simulator is open-ended, starts with every control open and lets the operator decide each measurement', () => {
  const s = make();
  const c = s.current();
  assert.deepEqual(c.controls, { pressure: true, speed: true, recipe: true, maintenance: true });
  assert.equal(c.pressure.locked, false);
  assert.equal(s.state.policy.sample, 'manual');
  for (let i = 0; i < 60; i++) { const r = polish(s, { measure: i % 3 === 0 }).rec; assert.equal(s.shouldMeasure(r), null); }
  assert.equal(s.state.phase, 'ready', 'no fixed end in the virtual tool');
  assert.equal(s.wafers.length, 61);
  assert.equal(s.state.records.filter(r => r.status === 'skipped').length, 40);
  assert.ok(s.summary().suggestions.find(x => x.id === 'skip').done, 'skipping makes later predictions stale');
});

test('random disturbances follow the seed, at roughly the real record rates, and can be turned off', () => {
  const a = make(), b = make();
  for (let i = 0; i < 200; i++) { polish(a); polish(b); }
  const sig = s => s.wafers.slice(0, 200).map(w => `${+w.rest}${+w.pad_change}${+!!w.anomaly}`).join('');
  assert.equal(sig(a), sig(b), 'same seed, same disturbances');
  const rests = a.wafers.filter(w => w.rest).length, pads = a.wafers.filter(w => w.pad_change).length, drops = a.wafers.filter(w => w.anomaly).length;
  assert.ok(rests >= 3 && rests <= 25, `rests ${rests}`); assert.ok(pads >= 3 && pads <= 25, `pads ${pads}`); assert.ok(drops >= 6 && drops <= 32, `drops ${drops}`);
  assert.ok(a.state.records.some(r => r.alarm), 'pressure drops raise alarms');
  assert.ok(a.state.records.some(r => r.events.afterRest) && a.state.records.some(r => r.events.afterPad));
  const quiet = make({ events: false });
  for (let i = 0; i < 80; i++) polish(quiet);
  assert.ok(quiet.wafers.every(w => !w.rest && !w.pad_change && !w.anomaly));
});

test('a disturbance announces itself before the wafer, and the first wafer after it carries the offset', () => {
  const s = make();
  let i = 0;
  while (!s.current().wafer.rest && i++ < 400) polish(s);
  const w = s.current().wafer;
  assert.equal(s.state.notice.kind, 'idle');
  assert.equal(w.after_rest, true); assert.equal(w.gap_s, 3 * 3600);
  assert.ok(s.current().pred.offset > 0, 'prediction carries the learned first-wafer offset');
  polish(s);
  assert.equal(s.state.notice === null || s.state.notice.kind !== 'idle' || s.current().wafer.rest, true);
});

test('same seed + same decisions = same outcomes; a lower A456 setpoint lowers MRR through the learned response', () => {
  const a = make({ events: false }), b = make({ events: false }), c = make({ events: false });
  const lo = modelJson.virtual.pressure_range.A456[0];
  c.setPressure(lo);
  for (let i = 0; i < 6; i++) {
    const ra = polish(a, { t: 110 }).rec, rb = polish(b, { t: 110 }).rec, rc = polish(c, { t: 110 }).rec;
    assert.equal(ra.removalPct, rb.removalPct, 'reproducible');
    const wa = a.wafers[i], wc = c.wafers[i];
    assert.equal(wa.truth.level, wc.truth.level, 'hidden path does not depend on the operator');
    assert.ok(Math.abs((wa.mrr - wc.mrr) - wa.truth.level * (1 - wc.truth.factor)) < 1e-9, 'difference = learned pressure response');
    assert.ok(rc.pre.mrr < ra.pre.mrr, 'prediction already reflects the lower setpoint');
    assert.equal(rc.pressureChanged, true);
  }
  assert.throws(() => c.setPressure(lo - 5), /관측 범위/);
});

test('recipe choice is sticky; maintenance sets first-wafer flags; B456 has no pressure response', () => {
  const s = make({ events: false });
  s.setRecipe('B456');
  assert.equal(s.current().wafer.recipe, 'B456');
  assert.equal(s.current().pressure.alpha, 0);
  s.setMaintenance('pad', true);
  assert.equal(s.current().wafer.after_pad_change, true);
  polish(s);
  assert.equal(s.current().wafer.recipe, 'B456', 'recipe stays until changed');
  assert.equal(s.current().wafer.after_pad_change, false);
  s.setRecipe('A456');
  assert.equal(s.current().wafer.after_pad_change, true, 'first A456 wafer after the pad change');
  polish(s);
  s.setMaintenance('rest', true);
  assert.equal(s.current().wafer.after_rest, true);
});

test('metrology delay and rule are settings; results arrive late and the summary splits by situation', () => {
  const s = make({ events: false });
  s.setPolicy({ delay: 2, sample: 1 });
  const before = s.model.tracker('A456').snapshot().updates;
  polish(s); polish(s);
  assert.equal(s.model.tracker('A456').snapshot().updates, before);
  polish(s);
  assert.equal(s.model.tracker('A456').snapshot().updates, before + 1);
  assert.throws(() => s.setPolicy({ delay: 9 }), /0~5/);
  const sum = s.summary();
  assert.equal(sum.count, 3); assert.ok(sum.situations.find(x => x.id === 'stale').count >= 1);
  assert.ok(sum.suggestions.find(x => x.id === 'delay').done);
});

test('rotation speed follows Preston in both the virtual tool and the prediction, and is a textbook assumption', () => {
  const a = make({ events: false }), b = make({ events: false });
  assert.deepEqual(Engine.SPEED_RANGE, [0.8, 1.2]);
  const base = a.current().pred.mrr;
  b.setSpeed(1.15);
  assert.ok(Math.abs(b.current().pred.mrr - base * 1.15) < 1e-9, 'prediction scales with speed');
  assert.equal(b.current().pred.speed_factor, 1.15);
  const ra = polish(a, { t: 110 }).rec, rb = polish(b, { t: 110 }).rec;
  assert.ok(Math.abs(b.wafers[0].mrr - a.wafers[0].mrr * 1.15) < 1e-9, 'same hidden state, MRR x speed');
  assert.ok(Math.abs(rb.removalPct - ra.removalPct * 1.15) < 1e-9);
  assert.equal(rb.speedChanged, true); assert.equal(ra.speedChanged, false);
  assert.ok(b.wafers[0].trace.stage_rot.every((v, i) => Math.abs(v - a.wafers[0].trace.stage_rot[i] * 1.15) < 1e-9), 'the 3D spins faster');
  // the measurement is normalised back to the recipe speed, so both trackers hold the same state
  assert.ok(Math.abs(a.model.tracker('A456').snapshot().level - b.model.tracker('A456').snapshot().level) < 1e-9);
  assert.throws(() => b.setSpeed(1.5), /80~120%/);
  assert.ok(b.summary().suggestions.find(x => x.id === 'speed').done);
});

test('comparison: the same wafers under fixed time and model R2R; an operator who copies the model matches it', () => {
  const s = make({ events: false });
  for (let i = 0; i < 30; i++) polish(s);          // recommended time, every wafer measured at once
  const cmp = s.compare(), by = id => cmp.rows.find(x => x.id === id);
  assert.deepEqual(cmp.rows.map(x => x.id), ['fixed', 'mine', 'r2r-own', 'r2r-all']);
  for (const id of ['r2r-own', 'r2r-all']) {
    assert.equal(by(id).inSpec, by('mine').inSpec, id);
    assert.ok(Math.abs(by(id).meanAbsErrPct - by('mine').meanAbsErrPct) < 1e-9, id);
  }
  const fixed = s.state.records.map(r => s.wafers[r.n - 1].mrr * s.meta[r.recipe].t_ref / s.meta[r.recipe].target_removal * 100);
  assert.ok(Math.abs(by('fixed').meanAbsErrPct - fixed.reduce((x, v) => x + Math.abs(v - 100), 0) / fixed.length) < 1e-9);

  const blind = make({ events: false });
  for (let i = 0; i < 30; i++) polish(blind, { t: 116, measure: i === 0 });
  const c2 = blind.compare(), b2 = id => c2.rows.find(x => x.id === id);
  assert.ok(b2('r2r-all').meanAbsErrPct <= b2('r2r-own').meanAbsErrPct + 1e-9, 'measuring every wafer helps the controller');
  assert.equal(b2('mine').inSpec, b2('fixed').inSpec, 'always the recipe time = the fixed rule');
  assert.equal(make().compare(), null);
});
