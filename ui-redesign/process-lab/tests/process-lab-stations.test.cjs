// The stations of the process lab (../station-*.js) outside the browser: every machine is driven through its process
// by its controls, and what it gives the page's process instruments and metrology report is looked at along the way.
// The calculations have their own tests; these are about the two panels: that they have something to draw at every
// point of a process, that a report appears with the measurement and keeps its number until the next one, that its
// verdict is the run sheet's own (flow-model.js), and that no text is left with a hole in it.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// The station files are page scripts: they take the models from window and draw their figures as SVG.
const element = tag => ({ tag, attrs: {}, children: [], setAttribute(key, value) { this.attrs[key] = value; }, append(...nodes) { this.children.push(...nodes); } });
global.window = {}; global.document = { createElementNS: (_, tag) => element(tag) };
const load = file => require(path.join(__dirname, '..', file));
window.Lab3DProcess = require('../../lab-3d/process-model.js'); window.ProcessLabFlow = load('flow-model.js');
for (const [name, key] of [['crystal', 'Crystal'], ['oxidation', 'Oxidation'], ['photo', 'Photo'], ['etch', 'Etch'], ['implant', 'Implant'], ['plating', 'Plating'], ['cmp', 'Cmp'], ['eds', 'Eds'], ['bond', 'Bond']]) {
  window[`ProcessLab${key}`] = load(`${name}-model.js`); load(`station-${name}.js`);
}
const F = window.ProcessLabFlow, ST = window.ProcessLabStations, P = window.Lab3DProcess.constants, SEED = 5;

/** The machine of a process on the wafer a run brings to it, as the page opens it. `piece`: which of the process's machines. */
function open(stepId, piece = 0, results = []) {
  const run = F.createRun(stepId, SEED), station = [].concat(ST[stepId])[piece], wafer = results.length ? [].concat(ST[stepId])[piece - 1].interim(run.wafer, results.at(-1)) : run.wafer;
  const sim = station.create(wafer, SEED, { base: run.wafer, results });
  return { run, station, sim, set: (name, value) => station.control(sim, name, value) };
}
/** Lets the process run until `done(state)` holds, calling the station's tick as the page does. */
function until(machine, done, dt, limit = 400000) {
  for (let n = 0; !done(machine.sim.state); n++) { assert.ok(n < limit, 'the process gets there'); machine.sim.step(dt); machine.station.tick?.(machine.sim); }
}
const text = value => { assert.equal(typeof value, 'string'); assert.ok(value.length > 0 && !/undefined|NaN|null|\[object/.test(value), `a text with a hole in it: ${value}`); };
const finite = (value, what) => assert.ok(Number.isFinite(value), `${what} is ${value}`);

/** What a station gives the instruments: tiles with a heading, a value and a chart that can be drawn. */
function instruments(machine, { tiles, points }) {
  const list = machine.station.instruments(machine.sim);
  assert.equal(list.length, tiles, 'the number of tiles stays the same through the process (the page builds them once)');
  for (const tile of list) {
    text(tile.title); text(String(tile.value)); assert.equal(typeof tile.unit, 'string'); text(tile.label);
    const { x, y, series } = tile.plot;
    for (const v of [...x, ...y]) finite(v, `a bound of ${tile.title}`);
    assert.ok(x[0] < x[1] && y[0] < y[1], `${tile.title}: the chart has an extent`);
    for (const p of series) { finite(p[0], `x of ${tile.title}`); finite(p[1], `y of ${tile.title}`); }
    for (const [at, label] of tile.plot.xTicks) { finite(at, `a tick of ${tile.title}`); text(label); }
    if (tile.plot.band) tile.plot.band.forEach(v => finite(v, `the band of ${tile.title}`));
    if (tile.plot.limit !== undefined) { finite(tile.plot.limit, `the limit of ${tile.title}`); text(tile.plot.limitLabel); }
    if (tile.plot.mark) tile.plot.mark.forEach(v => finite(v, `the mark of ${tile.title}`));
    const tip = tile.tip((x[0] + x[1]) / 2);
    if (series.length) { assert.ok(tip, `${tile.title}: a chart with points says something under the pointer`); text(tip[0]); for (const [value] of tip[1]) text(value); }
  }
  if (points) assert.ok(list.some(tile => tile.plot.series.length > 1), 'a process under way has drawn something');
  return list;
}
/** What a station gives the report: verdict, criteria against their limits, a figure, what it means. */
function report(machine) {
  const r = machine.station.report(machine.sim);
  assert.ok(r, 'a measurement gives a report');
  assert.equal(machine.station.report(machine.sim).id, r.id, 'the same measurement keeps its number, so the page leaves the report as the operator left it');
  text(r.title); text(r.sub); assert.equal(typeof r.pass, 'boolean');
  assert.ok(r.criteria.length >= 1);
  for (const c of r.criteria) {
    text(c.label); text(c.value); assert.equal(typeof c.ok, 'boolean');
    if (c.track) { for (const v of [c.track.value, c.track.lo, c.track.hi, ...c.track.band]) finite(v, `the bar of ${c.label}`); assert.ok(c.track.lo < c.track.band[0] && c.track.band[1] < c.track.hi, `${c.label}: the limits lie inside the bar`); }
    if (c.meter) { for (const v of [c.meter.value, c.meter.limit, c.meter.top]) finite(v, `the bar of ${c.label}`); assert.ok(c.meter.limit <= c.meter.top && c.meter.top > 0); }
    if (c.scale) c.scale.forEach(label => assert.equal(typeof label, 'string'));
  }
  assert.ok(r.criteria.every(c => c.ok) || !r.pass, 'a report does not pass with a criterion failed');
  for (const f of r.figures) { text(f.caption); assert.equal([f.node, f.plot, f.map].filter(Boolean).length, 1, 'a figure is one thing: a drawing, a chart or a wafer map'); if (f.plot) for (const p of f.plot.series) { finite(p[0], 'x of a figure'); finite(p[1], 'y of a figure'); } }
  assert.ok(r.notes.length >= 1, 'a report says what its result means'); r.notes.forEach(text);
  for (const [name, value] of r.stats) { text(name); text(value); }
  return r;
}
/** The record the run sheet makes of a result, to hold the report's verdict against. */
const recorded = (machine, result) => F.complete(machine.run, result);

test('crystal puller: the instruments follow the crystal, and the report passes what the run sheet passes', () => {
  const m = open('wafer'), S = () => m.sim.state;
  assert.equal(m.station.running(m.sim), false); instruments(m, { tiles: 4 }); assert.equal(m.station.report(m.sim), null);
  m.set('dopant', 2.9); m.set('seed', 1); until(m, s => s.attached, 1); m.set('speed', 12); until(m, s => s.necked, 1); m.set('speed', 0.4); until(m, s => 2 * s.radius > 292, 2); m.set('auto', true);
  until(m, s => s.body.length >= 40, 2); assert.equal(m.station.running(m.sim), true); instruments(m, { tiles: 4, points: true });
  until(m, s => s.body.length >= 105, 2); m.set('seed', 0); until(m, () => m.sim.canMeasure(), 1); m.sim.measure();
  assert.equal(m.station.running(m.sim), false);
  const r = report(m), record = recorded(m, m.station.result(m.sim));
  assert.equal(r.criteria.length, 3); assert.equal(r.pass, S().result.ok); assert.equal(r.pass, record.ok !== false);
});

test('crystal puller: a short pull at the seed loses nothing, a lifted crystal is measured before the seed goes in again, and a full puller says so', () => {
  const m = open('wafer'), S = () => m.sim.state;
  m.set('dopant', 2.9); m.set('seed', 1); until(m, s => s.attached, 1); m.set('speed', 12); until(m, s => s.necked, 1); m.set('speed', 0.4); until(m, s => 2 * s.radius > 292, 2); m.set('auto', true);
  until(m, s => s.body.length >= 105, 2);
  // the hand takes the seed and lets it go in the lower half of its way, as a short drag does
  const length = S().length; assert.equal(m.set('seed', 0.8), null); m.sim.step(30); m.station.dragEnd(m.sim, 'seed'); m.sim.step(600);
  assert.ok(m.sim.growing() && S().controls.auto && S().length > length && S().body.length >= 105 && S().result === null, 'the crystal is still there and still growing');
  // lifted: it comes off, stays up, and cannot be dipped away before it is measured
  m.set('seed', 0.3); m.sim.step(1); assert.ok(S().ended);
  text(m.set('seed', 0.9)); assert.equal(S().controls.seed, 0.3, 'the seed is not taken down again');
  m.station.dragEnd(m.sim, 'seed'); assert.equal(S().controls.seed, 0);
  until(m, () => m.sim.canMeasure(), 1); const body = S().body.length; m.sim.step(600);
  assert.ok(S().ended && S().body.length === body && S().length > 0, 'it hangs there');
  m.sim.measure(); assert.ok(S().result.valid);
  assert.equal(m.set('seed', 1), null, 'once measured, the seed may go in for a new crystal');
  // a crystal left to grow fills the pull chamber: the guide sends the visitor to the seed, and every instrument still has numbers
  const full = open('wafer');
  full.set('dopant', 2.9); full.set('seed', 1); until(full, s => s.attached, 1); full.set('speed', 12); until(full, s => s.necked, 1); full.set('speed', 0.4); until(full, s => 2 * s.radius > 292, 2); full.set('auto', true);
  until(full, s => Boolean(s.full), 20); instruments(full, { tiles: 4, points: true });
  const said = full.station.guide(full.sim, '산화'); text(said[0]); assert.equal(said[3], 'seed'); assert.match(said[0], /꺼내세요/);
  for (const [, value] of full.station.parts.crucible.rows(full.sim.state)) text(value);
  // under the controller a melt below its melting point does not make the guide say the crystal spreads
  const cold = open('wafer');
  cold.set('dopant', 2.9); cold.set('seed', 1); until(cold, s => s.attached, 1); cold.set('speed', 12); until(cold, s => s.necked, 1); cold.set('speed', 0.4); until(cold, s => 2 * s.radius > 292, 2); cold.set('auto', true);
  cold.set('power', 95); until(cold, s => s.superheat < -4.5, 5);
  assert.ok(Math.abs(2 * cold.sim.state.radius - 305) < 5 && !/넓어집니다/.test(cold.station.guide(cold.sim, '산화')[0]), cold.station.guide(cold.sim, '산화')[0]);
  cold.set('speed', cold.sim.state.controls.speed); assert.match(cold.station.guide(cold.sim, '산화')[0], /얼기 시작/, 'by hand the warning stands');
});

test('oxidation furnace: film, growth rate and tube temperature while the boat is in; five places in the report', () => {
  const m = open('oxidation');
  assert.equal(m.station.running(m.sim), false); instruments(m, { tiles: 3 });
  m.set('boat', 1); until(m, s => s.sealed, 5); m.set('setpoint', 1000); m.set('h2o', true); m.set('n2', false); until(m, s => s.oxide > 300, 5);
  assert.equal(m.station.running(m.sim), true); const tiles = instruments(m, { tiles: 3, points: true });
  assert.ok(tiles[1].plot.series.every(p => p[1] >= 0) && tiles[1].plot.series.some(p => p[1] > 1), 'the growth rate is drawn from the film as it was sampled');
  until(m, s => s.oxide > 492, 5); m.set('h2o', false); m.set('n2', true); m.set('setpoint', 700); until(m, s => s.tube <= 790, 5); m.set('boat', 0); until(m, () => m.sim.canMeasure(), 5);
  assert.equal(m.station.report(m.sim), null, 'no report before the measurement'); m.sim.measure();
  const r = report(m), first = r.id, record = recorded(m, m.station.result(m.sim));
  assert.equal(r.pass, true); assert.equal(r.pass, record.ok); assert.equal(r.figures[0].node.children.filter(n => n.tag === 'text').length, 5, 'five places are written on the wafer');
  m.sim.measure(); assert.notEqual(m.station.report(m.sim).id, first, 'a new measurement is a new report');
});

test('oxidation furnace: while the tube is too hot for the elevator, the guide sends the visitor to the temperature and never to the boat', () => {
  const m = open('oxidation'), guide = x => x.station.guide(x.sim, '포토'), where = x => x.station.parts.boat.rows(x.sim.state)[0][1];
  m.set('setpoint', 1000); until(m, s => s.tube > 900, 5);
  text(m.set('boat', 1)); assert.equal(m.sim.state.controls.boat, 0, 'the boat is refused');
  let said = guide(m); assert.match(said[0], /잠겨/); assert.equal(said[3], 'setpoint');
  m.set('setpoint', 700); said = guide(m); assert.match(said[0], /잠겨/); assert.equal(said[3], null, 'the temperature is already on its way down: nothing more to point at');
  until(m, s => s.tube < 795, 5); said = guide(m); assert.equal(said[3], 'boat'); assert.equal(m.set('boat', 1), null);
  // raised late, the boat is caught half-way when the tube passes the lock
  const h = open('oxidation'), s = h.sim.state;
  h.set('setpoint', 1000); for (let i = 0; i < 360; i++) h.sim.step(1);
  assert.equal(h.set('boat', 1), null); until(h, x => x.tube > 805, 1);
  assert.ok(s.boat > 0.05 && s.boat < 0.95 && s.controls.boat === s.boat, `the boat stands at ${s.boat}`);
  said = guide(h); assert.match(said[0], /중간에 멈췄/); assert.equal(said[3], 'setpoint'); assert.match(where(h), /멈춤/);
  text(h.set('boat', 1)); text(h.set('boat', 0));
  h.set('setpoint', 700); until(h, x => x.tube < 795, 5); said = guide(h); assert.match(said[0], /끝까지 올리거나 내리세요/); assert.equal(said[3], 'boat');
});

test('oxidation furnace: a film far too thin fails, and the report says it can be grown further', () => {
  const m = open('oxidation');
  m.set('boat', 1); until(m, s => s.sealed, 5); m.set('setpoint', 1000); m.set('o2', true); m.set('n2', false); until(m, s => s.oxide > 40, 5); m.set('o2', false); m.set('n2', true); m.set('setpoint', 700);
  until(m, s => s.tube <= 790, 5); m.set('boat', 0); until(m, () => m.sim.canMeasure(), 5); m.sim.measure();
  const r = report(m); assert.equal(r.pass, false); assert.equal(r.criteria[0].fail, '얇음'); assert.match(r.notes[0], /다시 올려 더 기를 수/); assert.equal(recorded(m, m.station.result(m.sim)).ok, false);
});

test('photo cell: the instruments keep one try at a time, and the report goes with a rework', () => {
  const m = open('photo'), cycle = () => { m.set('coat', true); until(m, s => s.phase === 'coated', 0.25); m.set('expose', true); until(m, s => s.phase === 'exposed', 0.25); m.set('develop', true); until(m, s => s.phase === 'developed', 0.25); };
  instruments(m, { tiles: 4 }); m.set('coat', true); until(m, s => s.progress > 0.2, 0.25);
  assert.equal(m.station.running(m.sim), true); instruments(m, { tiles: 4, points: true });
  until(m, s => s.phase === 'coated', 0.25); m.set('expose', true); until(m, s => s.phase === 'exposed', 0.25); m.set('develop', true); until(m, s => s.phase === 'developed', 0.25);
  const missed = report(m); assert.equal(missed.pass, m.sim.state.result.ok); assert.equal(missed.figures[0].plot.limit, 1, 'the image is drawn against what clears the resist');
  m.set('strip', true); m.station.tick(m.sim); assert.equal(m.station.report(m.sim), null, 'stripped: the report of that pattern is gone'); assert.equal(m.sim.trace, null);
  m.set('dose', 240); m.set('focus', m.sim.state.bestFocus); cycle();
  const r = report(m), record = recorded(m, m.station.result(m.sim));
  assert.notEqual(r.id, missed.id); assert.equal(r.pass, true); assert.equal(r.pass, record.ok); assert.ok(m.sim.trace.points.at(-1).t < 200, 'the second try has a record of its own');
});

test('photo cell: a resist washed away shows as none everywhere, and a cell left waiting keeps a record that can still be drawn', () => {
  const m = open('photo'), S = () => m.sim.state;
  m.set('spin', 6000); m.set('dose', 400); m.set('focus', 4);
  m.set('coat', true); until(m, s => s.phase === 'coated', 0.25); m.set('expose', true); until(m, s => s.phase === 'exposed', 0.25); m.set('develop', true); until(m, s => s.phase === 'developed', 0.25); m.station.tick(m.sim);
  assert.ok(S().result.washed);
  assert.equal(m.station.parts.wafer.rows(S())[1][1], '없음'); assert.equal(m.station.screen(m.sim).big[1], '—');
  assert.match(m.station.monitor(m.sim).now, /없음/); assert.doesNotMatch(m.station.monitor(m.sim).now, /\d nm/);
  const tiles = instruments(m, { tiles: 4, points: true }); assert.equal(tiles[1].value, '—'); assert.equal(tiles[1].plot.series.at(-1)[1], 0, 'the record ends with the film gone');
  const refused = m.set('coat', true); text(refused); assert.match(refused, /녹은/); assert.doesNotMatch(refused, /이미 있습니다/);
  const r = report(m); assert.equal(r.pass, false); assert.equal(r.stats[0][1], '없음');
  // a coated wafer left for five hours at the fastest speed setting
  m.set('strip', true); m.station.tick(m.sim); m.set('spin', 4000); m.set('coat', true); until(m, s => s.phase === 'coated', 0.25);
  for (let i = 0; i < 18000; i++) { m.sim.step(1); m.station.tick(m.sim); }
  assert.ok(m.sim.trace.points.length <= 2400, `${m.sim.trace.points.length} points`); assert.equal(m.sim.trace.points[0].t < 2, true, 'the start of the coat is still on record');
  const later = instruments(m, { tiles: 4, points: true }); assert.ok(later[1].plot.series.some(p => p[1] > 1500), 'and so is the film thinning while it span');
});

test('etch chamber: endpoint, share through and oxide left while the wafer is in; the windows across the wafer in the report', () => {
  const m = open('etch');
  assert.equal(m.station.running(m.sim), false);
  m.set('chf3', true); m.set('power', 300); m.set('load', true); until(m, s => s.opened > 0.3, 0.5);
  assert.equal(m.station.running(m.sim), true); const tiles = instruments(m, { tiles: 3, points: true });
  assert.ok(tiles[1].plot.series.at(-1)[1] > 15 && tiles[1].plot.series.at(-1)[1] < 100 && tiles[2].plot.series.at(-1)[1] > 0, 'the edge is through while oxide is left at the centre');
  until(m, s => s.opened >= 1, 0.5); m.set('power', 0); until(m, s => !s.plasma, 0.5); m.set('load', false); until(m, s => Boolean(s.result) && s.inside <= 0, 0.5);
  const r = report(m), record = recorded(m, m.station.result(m.sim));
  assert.equal(r.criteria.length, 3); assert.equal(r.pass, true); assert.equal(r.pass, record.ok);
});

test('etch chamber: over-etched in CF4 at high pressure, the report fails the silicon loss and the width and says why', () => {
  const m = open('etch');
  m.set('cf4', true); m.set('pressure', 200); m.set('power', 400); m.set('load', true); until(m, s => s.opened >= 1, 0.5); for (let i = 0; i < 240; i++) { m.sim.step(0.5); m.station.tick(m.sim); }
  m.set('power', 0); until(m, s => !s.plasma, 0.5); m.set('load', false); until(m, s => Boolean(s.result) && s.inside <= 0, 0.5);
  const r = report(m); assert.equal(r.pass, false); assert.deepEqual(r.criteria.map(c => c.ok), [true, false, false]); assert.equal(r.notes.length, 3); assert.equal(recorded(m, m.station.result(m.sim)).ok, false);
});

test('etch chamber: the report judges the widths it shows, the recipe on record is the one etched with, and a measured wafer is not loaded again', () => {
  const number = text => Number(text.replace(/,/g, ''));
  // stopped a little late at a middling pressure: the mean width is inside the band, the widest window is not
  for (const late of [0, 10, 20, 30, 40, 50, 60, 80]) {
    const m = open('etch');
    m.set('chf3', true); m.set('power', 300); m.set('load', true); until(m, s => s.opened >= 1, 0.5);
    for (let t = 0; t < late; t += 0.5) { m.sim.step(0.5); m.station.tick(m.sim); }
    for (let power = 290; power >= 0; power -= 10) { m.set('power', power); m.sim.step(0.05); m.station.tick(m.sim); }      // the dial turned down by hand, a step a frame
    until(m, s => !s.plasma, 0.5); m.set('load', false); until(m, s => Boolean(s.result) && s.inside <= 0, 0.5);
    const r = report(m), row = r.criteria[2], shown = row.value.match(/[\d,]+/g).map(number), record = recorded(m, m.station.result(m.sim));
    assert.equal(shown.every(w => Math.abs(w - 1000) <= 100), row.ok, `${late} s late: the row shows ${row.value} and says ${row.ok}`);
    assert.equal(r.pass, record.ok !== false, `${late} s late: the report and the run sheet agree`);
    for (const w of shown) assert.ok(record.text.includes(w.toLocaleString('en-US')), `${late} s late: the run sheet names ${w} too: ${record.text}`);
    assert.match(r.sub, /300 W/, `the power on record is the one the wafer was etched at, not the last of the way down: ${r.sub}`); assert.match(record.text, /300 W/);
    if (!row.ok) assert.ok(r.notes.some(note => note.includes(row.value)), 'a width out of range is named in the notes as the row shows it');
    const refused = m.set('load', true); text(refused); assert.doesNotMatch(refused, /플라스마/); assert.equal(m.station.view(m.sim).loadable, false);
  }
  // no resist and a long etch: the light the endpoint detector sees never goes below nothing, and the wafer is told as it is
  const bare = open('etch'); bare.set('cf4', true); bare.set('pressure', 200); bare.set('power', 600); bare.set('load', true);
  let lowest = Infinity;
  for (let i = 0; i < 4000 && !(bare.sim.state.field <= 0); i++) { bare.sim.step(0.5); bare.station.tick(bare.sim); lowest = Math.min(lowest, bare.sim.state.signal); }
  for (let i = 0; i < 20; i++) { bare.sim.step(0.5); lowest = Math.min(lowest, bare.sim.state.signal); }
  assert.ok(lowest >= 0, `the endpoint signal fell to ${lowest}`);
  bare.set('power', 0); until(bare, s => !s.plasma, 0.5); bare.set('load', false); until(bare, s => Boolean(s.result) && s.inside <= 0, 0.5);
  const gone = report(bare), sheet = recorded(bare, bare.station.result(bare.sim));
  assert.equal(gone.pass, false); assert.equal(sheet.ok, false);
  assert.equal(/모두 깎/.test(sheet.text), bare.sim.state.result.oxide < 1, `"all gone" is said only when nothing is left: ${sheet.text}, mean ${bare.sim.state.result.oxide}`);
});

test('implanter: beam, dose and temperature from the implant on; the phosphorus against depth in the report', () => {
  const m = open('deposition'), IM = window.ProcessLabImplant;
  let field = m.sim.state.controls.field, most = 0;
  for (let f = 0.05; f < 1.2; f += 0.002) { const ions = IM.ionsAt(f); if (ions.length === 1 && ions[0].name === 'P⁺' && IM.beamCurrent(f) > most) { most = IM.beamCurrent(f); field = f; } }
  m.set('field', field); m.sim.step(1); m.station.tick(m.sim); assert.equal(m.station.running(m.sim), false); instruments(m, { tiles: 4 });
  m.set('energy', 100); m.set('dose', 15); assert.equal(m.set('implant', true), null); until(m, s => s.progress > 0.4, 1);
  assert.equal(m.station.running(m.sim), true); const tiles = instruments(m, { tiles: 4, points: true }); assert.ok(tiles[0].plot.series.at(-1)[1] > 0.5, 'the beam is on the wafer');
  until(m, s => s.phase === 'implanted', 1); m.set('temperature', 1000); m.set('minutes', 20); m.set('anneal', true); until(m, s => s.phase === 'done', 2);
  assert.ok(Math.max(...m.sim.trace.points.map(p => p.hot)) >= 1000, 'the anneal is in the temperature record');
  const r = report(m), record = recorded(m, m.station.result(m.sim));
  assert.equal(r.criteria.length, 3); assert.equal(r.pass, m.sim.state.result.ok); assert.equal(r.pass, record.ok); assert.ok(r.figures[0].plot.mark, 'the junction is marked on the profile');
});

test('implanter: on a wafer etched open in part the report is the run sheet\'s; what it says of another anneal is what another anneal does; its small texts hold', () => {
  const IM = window.ProcessLabImplant, station = ST.deposition;
  let peak = 0.2, most = 0;
  for (let f = 0.05; f < 1.2; f += 0.002) { const ions = IM.ionsAt(f); if (ions.length === 1 && ions[0].name === 'P⁺' && IM.beamCurrent(f) > most) { most = IM.beamCurrent(f); peak = f; } }
  /** The implanter on the wafer a run brings to it. */
  const at = run => { const sim = station.create(run.wafer, SEED, { base: run.wafer, results: [] }); return { run, station, sim, set: (name, value) => station.control(sim, name, value) }; };
  const implant = (m, keV, dose, anneals) => {
    m.set('field', peak); m.sim.step(1); m.set('energy', keV); m.set('dose', dose); assert.equal(m.set('implant', true), null); until(m, s => s.phase === 'implanted', 1);
    for (const [celsius, minutes] of anneals) { m.set('temperature', celsius); m.set('minutes', minutes); assert.equal(m.set('anneal', true), null); until(m, s => s.phase === 'done', 2); }
  };
  // an etch stopped while the endpoint was still falling: open at the edge, 24 nm of oxide left at the centre
  const N = 31, left = Array.from({ length: N }, (_, j) => Math.max(0, 24 * (1 - (j / (N - 1)) ** 2 * 2.2)));
  const partly = F.createRun('etch'); F.complete(partly, { oxide: 500, width: 1030, depth: 500, open: false, opened: 0.53, left: Math.max(...left), siliconLoss: 4, profile: { left, siliconLoss: left.map(v => v > 0 ? 0 : 4), width: left.map(() => 1030) } });
  assert.ok(partly.wafer.window.open && partly.wafer.window.left > 20, 'the run sheet calls these windows open, with oxide left somewhere');
  const m = at(partly); implant(m, 80, Math.log10(2e15), [[950, 30]]);
  const r = report(m), record = recorded(m, m.station.result(m.sim));
  assert.equal(r.pass, record.ok, `the report says ${r.pass}, the run sheet ${record.ok}: ${record.text}`); assert.equal(r.pass, true);
  assert.ok(r.notes.some(note => /덜 뚫린/.test(note)), 'and the report says that the windows left shut got nothing');
  // not open anywhere: both fail
  const shut = F.createRun('etch'); F.complete(shut, { oxide: 500, width: 1030, depth: 470, open: false, opened: 0, left: 30, siliconLoss: 0 });
  const s = at(shut); implant(s, 80, Math.log10(2e15), [[950, 30]]);
  const blocked = report(s); assert.equal(blocked.pass, false); assert.equal(recorded(s, s.station.result(s.sim)).ok, false);

  // a deep implant (100 keV) of a small dose: after the first anneal the surface is short of its limit
  const d = open('deposition'); implant(d, 100, 14, [[900, 10]]);
  for (let round = 0; round < 12; round++) {
    const before = d.sim.state.result, note = report(d).notes.find(text => /표면 농도가 모자랍니다/.test(text));
    if (!note) break;
    assert.notEqual(/올라갑니다/.test(note), /더 낮아집니다/.test(note), note);
    d.set('temperature', 1000); d.set('minutes', 10);
    const said = /올라갑니다/.test(report(d).notes.find(text => /표면 농도가 모자랍니다/.test(text)));       // the note is about the dials as they stand
    assert.equal(d.set('anneal', true), null); until(d, x => x.phase === 'done', 2);
    assert.equal(d.sim.state.result.surface > before.surface, said, `round ${round}: the note said the surface would ${said ? 'rise' : 'fall'}; it went from ${before.surface} to ${d.sim.state.result.surface}`);
  }

  // small texts
  const t = open('deposition');
  assert.equal(t.station.parts.implant.rows(t.sim.state)[0][1], '지금은 안 됨', 'with the magnet on no peak there is no beam to implant with'); assert.equal(t.station.view(t.sim).beamReady, false); text(t.set('implant', true));
  t.set('field', peak); t.sim.step(1);
  assert.equal(t.station.parts.implant.rows(t.sim.state)[0][1], '누를 수 있음'); assert.equal(t.station.view(t.sim).beamReady, true);
  assert.doesNotMatch(t.station.monitor(t.sim).now, /×10[⁰¹²³⁴⁵⁶⁷⁸⁹]\b|×10⁻/, t.station.monitor(t.sim).now);
  for (let dose = 13; dose <= 16.001; dose += 0.1) { t.set('dose', dose); for (const row of t.station.parts.dose.rows(t.sim.state)) assert.doesNotMatch(row[1], /60초/, `dose dial ${dose.toFixed(1)}: ${row[1]}`); }
});

test('plating cell and polisher: both report, and together they are the run sheet\'s verdict on the metal', () => {
  const m = open('metal');
  m.set('head', 1); until(m, s => s.immersed, 0.5); m.set('rotation', 60); m.set('current', 20); until(m, s => s.thickness > 400, 0.5);
  assert.equal(m.station.running(m.sim), true); const tiles = instruments(m, { tiles: 3, points: true }); assert.ok(tiles[2].plot.limit > tiles[2].plot.series.at(-1)[1], 'at 60 rpm 20 A is under the limit');
  until(m, s => s.thickness > 775, 0.5); m.set('current', 0); for (let i = 0; i < 4; i++) { m.sim.step(0.5); m.station.tick(m.sim); } m.set('head', 0); until(m, () => m.sim.canMeasure(), 0.5); m.sim.measure();
  const plated = report(m), handed = m.station.result(m.sim); assert.equal(plated.pass, m.sim.state.result.ok); assert.equal(plated.criteria.length, 3);

  const p = open('metal', 1, [handed]); p.run = m.run;
  assert.equal(p.station.running(p.sim), false); instruments(p, { tiles: 3 });
  assert.equal(p.sim.moveWafer('head'), true); for (const [name, value] of [['platen', P.platenRef], ['carrier', P.carrierRef], ['slurry', P.slurryRef], ['conditioner', true]]) p.sim.setControl(name, value);
  for (let i = 0; i < 24; i++) { p.sim.step(0.5); p.station.tick(p.sim); }                                     // the pad gets wet and up to speed
  p.sim.setControl('head', 1 + P.pressureRef / P.pressureMax); until(p, s => s.wafer.polishTime > 20, 0.5);
  assert.equal(p.station.running(p.sim), true); instruments(p, { tiles: 3, points: true });
  until(p, () => p.sim.stack.covered <= 0, 0.5); p.sim.setControl('head', 0); until(p, s => !s.contact && s.gap > 0.1, 0.5); assert.equal(p.sim.moveWafer('stage'), true); until(p, () => Boolean(p.sim.stack.result), 0.5);
  const polished = report(p), record = recorded(p, { ...handed, ...p.station.result(p.sim) });
  assert.equal(polished.criteria.length, 3); assert.equal(polished.pass, p.sim.stack.result.ok); assert.equal(record.ok, plated.pass && polished.pass);
});

test('polisher: a head that barely turns leaves a wedge the instruments see; a plating too thin and a hot pad are named as what they are; a wafer put back is polished on', () => {
  /** A plated wafer on the polisher: plated to `nm` at 20 A and 60 rpm, then handed over. */
  function plated(nm) {
    const m = open('metal');
    m.set('head', 1); until(m, s => s.immersed, 0.5); m.set('rotation', 60); m.set('current', 20); until(m, s => s.thickness > nm, 0.5);
    m.set('current', 0); for (let i = 0; i < 4; i++) { m.sim.step(0.5); m.station.tick(m.sim); } m.set('head', 0); until(m, () => m.sim.canMeasure(), 0.5); m.sim.measure();
    const p = open('metal', 1, [m.station.result(m.sim)]); p.run = m.run;
    return p;
  }
  const wet = (p, carrier, psi) => {
    assert.equal(p.station.wafer(p.sim, 'head'), null);
    for (const [name, value] of [['platen', P.platenRef], ['carrier', carrier], ['slurry', P.slurryRef], ['conditioner', true]]) p.sim.setControl(name, value);
    for (let i = 0; i < 24; i++) { p.sim.step(0.5); p.station.tick(p.sim); }
    p.sim.setControl('head', 1 + psi / P.pressureMax);
  };
  const lift = p => { p.sim.setControl('head', 0); until(p, s => !s.contact && s.gap >= P.headTravel * 0.99, 0.25); };   // all the way up
  const scan = p => { assert.equal(p.station.wafer(p.sim, 'stage'), null); until(p, () => Boolean(p.sim.stack.result), 0.25); return p.sim.stack.result; };
  const said = p => p.station.guide(p.sim, 'EDS')[0];

  // the head at 4 rpm: the wafer wears to a wedge. When the instruments say the copper is gone, it is gone on the thick side too
  const slow = plated(790); wet(slow, 4, P.pressureRef);
  until(slow, () => slow.sim.stack.covered <= 0, 0.25);
  assert.ok(Math.abs(slow.sim.state.wafer.tilt) > 5, `the wedge is ${slow.sim.state.wafer.tilt} nm`);
  assert.match(said(slow), /다 걷혔습니다/); assert.equal(slow.station.screen(slow.sim).chips[2][1], true);
  lift(slow); const wedge = scan(slow);
  assert.ok(wedge.cleared && wedge.residue <= 1, `the scan finds ${wedge.residue} nm where the instruments said none`);
  // and while copper is left on the thick side only, they do not say it is gone
  const early = plated(790); wet(early, 4, P.pressureRef);
  until(early, s => { const k = early.sim.stack; return Math.max(...k.copper.map((_, i) => early.sim.at(early.sim.radius[i], s.wafer.tiltAngle).copper)) <= 1; }, 0.25);   // the side that is polished more is clear everywhere
  assert.ok(early.sim.stack.covered > 0 && early.sim.stack.mean > 0, 'the thin side being clear is not the wafer being clear'); assert.doesNotMatch(said(early), /다 걷혔습니다/);

  // plated to 450 nm, the windows (505 nm deep) were never full: no polish makes this wafer flat, and the report does not blame the polish
  const thin = plated(445); wet(thin, P.carrierRef, P.pressureRef);
  until(thin, () => thin.sim.stack.covered <= 0, 0.25); lift(thin); const short = scan(thin);
  assert.ok(short.cleared && short.unfilled > 50 && short.dishingMax > 50, JSON.stringify({ unfilled: short.unfilled, dishing: short.dishingMax }));
  assert.match(said(thin), /도금이 얇아/); assert.doesNotMatch(said(thin), /오래 갈았/);
  const note = report(thin).notes.join(' '); assert.match(note, /도금/); assert.doesNotMatch(note, /다 걷힌 뒤에도 갈면/);

  // scanned with copper left, the wafer goes back on the head: the guide says how to go on
  const again = plated(790); wet(again, P.carrierRef, P.pressureRef);
  until(again, s => s.wafer.polishTime > 30, 0.25); lift(again);
  assert.match(said(again), /계측기에/, 'lifted after a polish: to the scan');
  assert.equal(scan(again).cleared, false); assert.equal(again.station.wafer(again.sim, 'head'), null);
  assert.doesNotMatch(said(again), /계측기/); assert.match(said(again), /누르세요/); assert.equal(again.station.guide(again.sim, 'EDS')[3], 'head');
  again.sim.setControl('head', 1 + P.pressureRef / P.pressureMax); until(again, s => s.contact, 0.25); again.station.tick(again.sim); lift(again);
  assert.match(said(again), /계측기에/, 'and lifted again, to the scan again');

  // scratches name what made them
  for (const [by, words] of [['hot', /과열/], ['dry', /마른|슬러리가 거의 없는/], ['glazed', /무뎌진/]]) {
    const p = plated(790); wet(p, P.carrierRef, P.pressureRef); until(p, s => s.wafer.polishTime > 5, 0.25);
    p.sim.state.wafer.scratches.push({ r: 0.05, theta: 1, length: 0.5, t: 1, by });
    until(p, () => p.sim.stack.covered <= 0, 0.25); lift(p); const r = scan(p);
    if (r.scratches.every(scratch => scratch.by === by)) { assert.match(said(p), words); assert.match(report(p).notes.join(' '), words); }
  }
});

test('prober: needles that miss fail the test, not the chips; aligned, the report is the run sheet\'s', () => {
  const m = open('eds'), total = F.DIE_COUNT;
  m.set('probe', true); until(m, s => s.tested > 40, 0.1); assert.equal(m.station.running(m.sim), true); instruments(m, { tiles: 4, points: true });
  until(m, s => s.phase === 'done', 0.1);
  const missed = report(m), count = m.sim.count();
  assert.equal(missed.pass, false); assert.equal(count.bins.contact, total); assert.ok(count.missed > 0);
  assert.ok(missed.notes.some(note => /바늘이 패드에 제대로 닿지 않아/.test(note)) && !missed.notes.some(note => /칩 안의 길이 끊겼거나/.test(note)), 'the chips are not blamed for a contact the needles did not make');
  assert.equal(missed.figures[0].map.dies.length, total);
  const e = m.sim.error(); m.set('x', m.sim.state.controls.x - e.x); m.set('y', m.sim.state.controls.y - e.y); m.set('z', 60); m.set('probe', true); until(m, s => s.phase === 'probing', 0.1); until(m, s => s.phase === 'done', 0.1);
  const r = report(m), record = recorded(m, m.station.result(m.sim));
  assert.notEqual(r.id, missed.id); assert.equal(r.pass, true); assert.equal(r.pass, record.ok); assert.equal(m.sim.count().missed, 0);
});

test('prober: the tester\'s tiles follow the chip under the needles; the run sheet keeps the overdrive of the test; the guide names what keeps the needles off', () => {
  const m = open('eds'), e = m.sim.error();
  m.set('x', m.sim.state.controls.x - e.x); m.set('y', m.sim.state.controls.y - e.y); m.set('z', 60); m.set('probe', true);
  const seen = new Set();
  for (const count of [4, 11, 30, 80]) {
    until(m, s => s.tested >= count || s.phase === 'done', 0.1);
    const s = m.sim.state, now = s.results[s.latest], tiles = instruments(m, { tiles: 4, points: true });
    seen.add(s.latest);
    assert.equal(tiles[1].value, now.resistance.toFixed(1), `after ${count} chips the contact tile shows chip ${s.latest + 1}`);
    assert.deepEqual(tiles[1].plot.mark, [s.latest + 1, now.resistance]);
    assert.equal(tiles[2].value === '—', now.leak == null); assert.equal(tiles[3].value === '—', now.voltage == null);
    if (now.voltage != null) { assert.equal(tiles[3].value, now.voltage.toFixed(2)); assert.deepEqual(tiles[3].plot.mark, [s.latest + 1, now.voltage]); } else assert.equal(tiles[3].plot.mark, false);
  }
  assert.ok(seen.size === 4, `the tiles moved with the test (chips ${[...seen].map(i => i + 1).join(', ')})`);
  until(m, s => s.phase === 'done', 0.1);
  // the dial turned after the test does not change what went on record
  m.set('z', 0); const record = recorded(m, m.station.result(m.sim));
  assert.match(record.text, /오버드라이브 60 µm/, record.text); assert.match(report(m).sub, /60 µm/);

  // aligned, but with no overdrive: the guide sends the visitor to the overdrive, not to X and Y
  const flat = open('eds'), f = flat.sim.error();
  flat.set('x', flat.sim.state.controls.x - f.x); flat.set('y', flat.sim.state.controls.y - f.y); flat.set('z', 0); flat.set('contact', true);
  let said = flat.station.guide(flat.sim, '패키징'); assert.equal(flat.sim.state.contact.touching, false); assert.equal(said[3], 'z'); assert.match(said[0], /오버드라이브/);
  // the needles up on a pad they miss: the card of the probe card does not say they touch it
  const off = open('eds'); off.set('contact', true); off.sim.step(0.2);
  assert.equal(off.sim.state.down, true); assert.equal(off.sim.state.contact.touching, false); assert.doesNotMatch(off.station.parts.card.rows(off.sim.state)[0][1], /닿음/);
  said = off.station.guide(off.sim, '패키징'); assert.equal(said[3], 'x');

  // chips that fail on contact for their own sake (a surface too lightly doped): tested with good needles, the guide does not send the visitor back to the needles
  const run = F.createRun('deposition'); F.complete(run, { depth: 300, surface: 2e18, peak: 2e18, masked: true }); F.complete(run);
  const weak = { run, station: ST.eds, sim: ST.eds.create(run.wafer, SEED, { base: run.wafer, results: [] }) }; weak.set = (name, value) => weak.station.control(weak.sim, name, value);
  const w = weak.sim.error(); weak.set('x', weak.sim.state.controls.x - w.x); weak.set('y', weak.sim.state.controls.y - w.y); weak.set('z', 100); weak.set('probe', true); until(weak, s => s.phase === 'done', 0.1);
  const c = weak.sim.count(); assert.ok(c.bins.contact > c.total * 0.1 && c.missed === 0, JSON.stringify(c));
  said = weak.station.guide(weak.sim, '패키징'); assert.doesNotMatch(said[0], /바늘/); assert.equal(said[2], 'finish'); assert.equal(said[3], null);
});

test('bonder: run with a wire that does not hold, every chip is lost and the report says how', () => {
  const m = open('package'), good = m.sim.total;
  assert.ok(good > 0); instruments(m, { tiles: 3 }); assert.equal(m.station.running(m.sim), false);
  m.set('bond', true); until(m, s => s.phase === 'setup' && Boolean(s.wire), 0.05); m.set('pull', true); until(m, s => s.tests.length === 1, 0.05);
  assert.equal(m.station.running(m.sim), true); const tiles = instruments(m, { tiles: 3 }); assert.equal(tiles[0].plot.series.length, 1, 'one test wire, one point'); assert.equal(m.sim.state.tests[0].ok, false);
  m.set('run', true); until(m, s => s.phase === 'done', 0.05);
  const r = report(m), record = recorded(m, m.station.result(m.sim));
  assert.equal(r.pass, false); assert.equal(r.criteria.length, 2); assert.equal(r.pass, record.ok); assert.match(r.notes[0], new RegExp(`칩 ${good}개가 금선 불량`));
  assert.equal(m.sim.trace.at(-1).n, good, 'the run is in the record chip by chip');
});

test('bonder: a test wire of other settings is not held against the run, and the instruments stay up from the first test wire', () => {
  // the first wire with the dials as they stand fails; the settings are then changed and the run made without another test
  const m = open('package'), ups = [];
  m.set('bond', true); ups.push(m.station.running(m.sim)); until(m, s => s.phase === 'setup' && Boolean(s.wire), 0.05); ups.push(m.station.running(m.sim));
  m.set('pull', true); ups.push(m.station.running(m.sim)); until(m, s => s.tests.length === 1, 0.05); ups.push(m.station.running(m.sim));
  assert.deepEqual(ups, [true, true, true, true], 'made, waiting to be pulled, pulled: the instruments do not drop in between');
  assert.equal(m.sim.state.tests[0].ok, false); assert.deepEqual(m.sim.state.tests[0].at, { power: 30, force: 20, time: 10 });
  m.set('power', 80); m.set('force', 30); m.set('time', 15); m.set('run', true); until(m, s => s.phase === 'done', 0.05);
  const r = report(m), record = recorded(m, m.station.result(m.sim));
  assert.equal(r.pass, true); assert.equal(record.ok, true); assert.equal(r.criteria.length, 1, 'the failed wire of 30 mW is not a criterion of the run at 80 mW');
  assert.ok(r.notes.some(note => /80 mW, 30 gf, 15 ms/.test(note) && /당겨 보지 않았습니다/.test(note)), r.notes.join(' | '));
  assert.deepEqual(r.stats.at(-1), ['이 조건의 시험 선', '없음']);
  // tested with the settings of the run: the wire stands beside the chips
  const t = open('package');
  t.set('power', 80); t.set('force', 30); t.set('time', 15);
  t.set('bond', true); until(t, s => s.phase === 'setup' && Boolean(s.wire), 0.05); t.set('pull', true); until(t, s => s.tests.length === 1, 0.05);
  t.set('run', true); until(t, s => s.phase === 'done', 0.05);
  const tested = report(t); assert.equal(tested.pass, true); assert.equal(tested.criteria.length, 2); assert.match(tested.stats.at(-1)[1], /gf/);
});
