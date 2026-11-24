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
