// Browser checks of what a visitor can reach: the home page, the learning lab (the 3D CMP tool), the 8-process lab and
// the single-file build.
//
// Each check opens the page in a headless Chrome or Edge, uses it with real mouse and keyboard input and compares
// what the page shows with what it should show. The unit tests (node --test tests/*.test.cjs) cover the calculations;
// these checks cover what only a browser can tell: layout, hover cards, dragging the parts, panels that open and close,
// links between the pages, and that nothing is fetched from the internet.
//
// Usage: node tools/check-browser.mjs [check ...] [--out folder] [--file single-file.html]
//   checks: home, lab-hover, lab-operate, lab-panels, process-route, process-flow, process-crystal, process-oxidation, process-photo, process-etch, process-implant, process-plating, process-cmp, process-eds, process-bond, process-all, standalone.
//   A prefix selects several ("lab", "process"); none runs them all.
//   Screenshots go to evidence/browser-check/ (kept out of git), or to the folder given with --out.
//   The standalone check opens standalone/CMP-Lab.html, or the file given with --file.
// The 3D pages render in software at about 3 frames per second, so a full run takes several minutes.
// Needs Node 22 or newer and Chrome or Edge (see tools/headless-browser.mjs). The exit code is 1 if anything failed.
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openBrowser, sleep } from './headless-browser.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), dist = path.join(root, 'dist');
const fileUrl = (...parts) => pathToFileURL(path.join(...parts)).href;
const same = (a, b, tolerance = 1) => Math.abs(a - b) <= tolerance;
const line = (a, b, steps = 10) => Array.from({ length: steps + 1 }, (_, i) => ({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps }));
const reached = (browser, expression, ms) => browser.until(expression, ms).then(() => true, () => false);
let standaloneFile = path.join(root, 'standalone/CMP-Lab.html');   // --file changes it
const LAB = 'window.Lab3DDebug';   // the hooks dist/lab-3d/app.js leaves for these checks
const leavesHome = entry => !['#home', '#main'].includes(entry);   // the brand link, the current tab and the skip link stay on the home page
/** Notes every click that reaches the page, with whether it landed on the element a check was aiming at (see clickOn). */
const watchClicks = b => b.evaluate(`(() => { window.__clicks = 0; window.__onTarget = false; document.addEventListener('click', event => { window.__clicks++; window.__onTarget = !!event.target.closest('[data-check-target]'); }, true); })()`);
/** A real click on a page element. Panels slide with CSS transitions, which lag at 3 frames per second, so the element
 *  can still be moving: the click is repeated until it has landed on the element. False if it never does. */
async function clickOn(b, selector, settle = 900) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const aim = await b.evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; e.setAttribute('data-check-target', ''); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, clicks: window.__clicks }; })()`);
    if (aim) await b.click(aim, 250);
    const landed = await b.evaluate(`(() => { const hit = window.__clicks > ${aim ? aim.clicks : 'Infinity'} && window.__onTarget; for (const e of document.querySelectorAll('[data-check-target]')) e.removeAttribute('data-check-target'); return hit; })()`);
    if (landed) { await sleep(settle); return true; }
    await sleep(600);
  }
  return false;
}

// ----- home page -----
async function home(t) {
  const b = await t.open({ width: 1600, height: 1000, room: [2040, 1300] });
  const shown = selector => b.evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].some(e => e.getClientRects().length > 0)`);
  await b.goto(fileUrl(dist, 'index.html'));
  await b.until(`document.readyState === 'complete' && document.querySelectorAll('.door-art img').length === 2 && [...document.querySelectorAll('.door-art img')].every(i => i.complete)`);
  await sleep(1500);

  const entries = await b.evaluate(`[...document.querySelectorAll('a[href], button')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(e => e.getAttribute('href') || '#' + (e.dataset.page || ''))`);
  t.expect(String(entries.filter(leavesHome).sort()) === './game.html,./lab-3d.html,./process-lab.html', 'the page offers the factory game, the learning lab and the tab of the 8-process lab, and nothing else', entries.join(' '));
  const parked = await b.evaluate(`[...document.querySelectorAll('[data-parked]')].map(e => e.getClientRects().length > 0)`);
  t.expect(parked.length > 0 && !parked.includes(true), `the ${parked.length} parked entries stay out of sight`);
  t.expect(!(await shown('.sidebar')) && !(await shown('.topbar')), 'the workspace frame (side menu, top bar) is hidden on the home page');
  t.expect(await b.evaluate(`[...document.querySelectorAll('.door-art img')].every(i => i.naturalWidth > 0)`), 'both pictures load');
  const film = await b.evaluate(`(() => { const c = document.getElementById('home-film'), d = c.getContext('2d').getImageData(0, 0, c.width, 1).data, at = i => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]].join(',');
    return { from: at(0), to: at(c.width - 1), labels: [document.getElementById('home-film-from').textContent, document.getElementById('home-film-to').textContent] }; })()`);
  t.expect(film.from !== film.to && film.labels.every(label => /\d\s*nm$/.test(label)) && film.labels[0] !== film.labels[1], 'the film colour scale is painted by the lab\'s process model', JSON.stringify(film));

  for (const [width, height] of [[1920, 1080], [1600, 1000], [1366, 768], [1024, 768], [400, 800]]) {
    await b.viewport(width, height); await sleep(700);
    const m = await b.evaluate(`(() => { const box = s => [...document.querySelectorAll(s)].map(e => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) }; });
      return { overflow: document.documentElement.scrollWidth - innerWidth, art: box('.door-art'), cap: box('.door-cap'), door: box('.door') }; })()`);
    const sideBySide = m.door[1].top < m.door[0].bottom;
    const aligned = sideBySide ? same(m.art[0].height, m.art[1].height) && same(m.cap[0].top, m.cap[1].top) && same(m.cap[0].height, m.cap[1].height) : m.door[1].top >= m.door[0].bottom - 1;
    t.expect(m.overflow <= 1 && aligned && sideBySide === (width > 820), `${width} x ${height}: nothing overflows sideways and ${width > 820 ? 'the pictures and captions line up' : 'the two modes stack'}`, JSON.stringify(m));
    await t.shot(`${width}x${height}`);
  }

  await b.viewport(1600, 1000); await sleep(500);
  let frame = '';
  for (let i = 0; i < 8 && !frame; i++) { await b.press('Tab', 9); await sleep(150); frame = await b.evaluate(`document.activeElement.matches('.door:focus-visible') ? getComputedStyle(document.activeElement, '::after').borderTopWidth : ''`); }
  t.expect(frame === '3px', 'the Tab key reaches a mode and draws its focus frame', frame);
  await t.shot('focus');

  await b.evaluate(`location.hash = '#guide'`); await sleep(1200);
  t.expect(await shown('.sidebar') && !(await shown('.home')), 'a parked inner page opened by its address gets the workspace frame back');
  await b.evaluate(`location.hash = '#home'`); await sleep(900);
  t.expect(!(await shown('.sidebar')) && await shown('.home'), 'going back to the home page hides the frame again');

  const picture = await b.evaluate(`(() => { const r = document.querySelector('.door-lab .door-art').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await b.click(picture);
  t.expect(await reached(b, `location.pathname.endsWith('lab-3d.html') && !!(${LAB} && ${LAB}.scene)`, 60000), 'a click on the learning-lab picture opens the 3D tool');
}

// ----- learning lab -----
async function openLab(t, width = 1600, height = 1000) {
  const b = await t.open({ width, height });
  await b.goto(`${fileUrl(dist, 'lab-3d.html')}?seed=11`);                                   // a fixed seed: the same incoming wafers every run
  if (!(await reached(b, `!!(${LAB} && ${LAB}.scene)`, 60000))) throw new Error(await b.evaluate(`!document.getElementById('fallback').hidden`).catch(() => false) ? 'the page could not start WebGL in this browser' : 'the 3D tool did not start');
  await sleep(2500);
  await watchClicks(b);
  const canvasBox = () => b.evaluate(`(() => { const r = document.getElementById('scene').getBoundingClientRect(); return { x: r.x, y: r.y }; })()`);
  const onPage = async point => { const box = await canvasBox(); return { x: point.x + box.x, y: point.y + box.y }; };
  const lab = {
    clickOn: (selector, settle) => clickOn(b, selector, settle),
    cardNames: () => b.evaluate(`Object.fromEntries(Object.entries(${LAB}.parts).map(([key, part]) => [key, typeof part.name === 'function' ? part.name(${LAB}.sim.state) : part.name]))`),
    at: async (x, y, z) => onPage(await b.evaluate(`${LAB}.scene.project(${x}, ${y}, ${z})`)),          // a point of the 3D scene, in page pixels
    part: async name => onPage(await b.evaluate(`${LAB}.scene.screenOf(${JSON.stringify(name)})`)),     // where a part is on the page
    state: () => b.evaluate(`(() => { const s = ${LAB}.sim.state; return { controls: { ...s.controls }, gap: s.gap, pressure: s.pressure, rate: s.rate, where: s.wafer && s.wafer.where, mean: ${LAB}.sim.meanThickness() }; })()`),
    card: () => b.evaluate(`(() => { const c = document.getElementById('callout'); return c.hidden ? null : { name: document.getElementById('co-name').textContent.trim(), text: c.innerText.replace(/\\n+/g, ' | ') }; })()`),
    pill: () => b.evaluate(`document.getElementById('pill').hidden ? '' : document.getElementById('pill').textContent.trim()`),
    tip: () => b.evaluate(`document.getElementById('viz-tip').hidden ? '' : document.getElementById('viz-tip').innerText.replace(/\\n+/g, ' | ')`),
    panels: () => b.evaluate(`(() => { const css = getComputedStyle(document.getElementById('stage')); return { strip: ${LAB}.strip, drawer: ${LAB}.drawer, wafers: ${LAB}.attempts.map(a => ({ id: a.id, pass: a.m.pass, mean: a.m.mean })), right: parseFloat(css.getPropertyValue('--inset-right')) || 0, bottom: parseFloat(css.getPropertyValue('--inset-bottom')) || 0 }; })()`),
    centre: (selector, fx = 0.5, fy = 0.5) => b.evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.left + r.width * ${fx}, y: r.top + r.height * ${fy} }; })()`),
    hover: async point => { await b.mouse('mouseMoved', { x: point.x + 2, y: point.y + 1 }); await sleep(150); await b.mouse('mouseMoved', point); await sleep(700); },
    shot: async label => t.shot(label, { clip: await b.evaluate(`(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; })()`), beyond: true }),
    // Sets a recipe through the model, loads the wafer and presses the head: the quick way in, for checks that are not about dragging.
    startPolishing: async controls => {
      await b.evaluate(`(() => { const d = ${LAB}; d.setSpeed(16); for (const [name, value] of ${JSON.stringify(Object.entries(controls))}) d.sim.setControl(name, value); })()`); await sleep(1500);
      await b.evaluate(`${LAB}.onWafer('head')`); await sleep(900);
      await b.evaluate(`${LAB}.sim.setControl('head', 1 + 3 / 7)`); await sleep(3000);
    },
    polishTo: async nm => { await b.evaluate(`${LAB}.setSpeed(64)`); await b.until(`${LAB}.sim.meanThickness() < ${nm}`, 200000, 40); await b.evaluate(`${LAB}.setSpeed(4)`); },
    liftAndMeasure: async wafers => {
      await b.evaluate(`${LAB}.sim.setControl('head', 0)`); await b.until(`${LAB}.sim.state.gap > 0.1`, 30000);
      await b.evaluate(`${LAB}.onWafer('stage')`); await b.until(`${LAB}.drawer.open && ${LAB}.attempts.length === ${wafers}`, 30000); await sleep(2500);
    },
  };
  return { b, lab };
}

async function labHover(t) {
  const { b, lab } = await openLab(t);
  const scene = Object.keys(await b.evaluate(`${LAB}.scene.parts`)), cards = await lab.cardNames();
  t.expect(scene.length > 0 && String([...scene].sort()) === String(Object.keys(cards).sort()), `every part of the scene has a card and every card has a part (${scene.length} parts)`, `scene: ${scene.join(' ')} | cards: ${Object.keys(cards).join(' ')}`);
  const order = [...scene.filter(name => name !== 'pedestal'), ...scene.filter(name => name === 'pedestal')];   // the load position last: the wafer lies on it and covers it
  for (const [width, height] of [[1600, 1000], [1366, 768]]) {
    await b.viewport(width, height); await sleep(1500);
    const wrong = [];
    for (const name of order) {
      if (name === 'pedestal') { await b.evaluate(`${LAB}.onWafer('head')`); await sleep(1500); }       // take the wafer away to see the load position itself
      const point = await lab.part(name);
      await b.mouse('mouseMoved', { x: 40, y: 200 }); await sleep(450);
      await b.mouse('mouseMoved', { x: point.x + 1, y: point.y + 1 }); await sleep(120); await b.mouse('mouseMoved', point);
      let under = null;
      for (let i = 0; i < 30 && under !== name; i++) { await sleep(200); under = await b.evaluate(`${LAB}.scene.hovered`); }
      await sleep(450);
      const card = await lab.card();
      if (under !== name || !card || card.name !== cards[name]) wrong.push(`${name}: under the pointer ${under}, card ${card ? JSON.stringify(card.name) : 'hidden'}`);
      if (name === 'head') await lab.shot(`${width}x${height}-card`);
    }
    t.expect(!wrong.length, `${width} x ${height}: each part shows its own card under the pointer`, wrong.join('; '));
    await b.mouse('mouseMoved', { x: 30, y: 30 }); await sleep(700);
    t.expect((await lab.card()) === null, `${width} x ${height}: the card goes away when the pointer leaves`);
    await b.evaluate(`${LAB}.onWafer('pedestal')`); await sleep(1200);                                  // the wafer back where it started, for the next window size
  }
}

async function labOperate(t) {
  const { b, lab } = await openLab(t);
  const L = await b.evaluate(`${LAB}.scene.layout`), C = await b.evaluate(`${LAB}.constants`), names = await lab.cardNames();
  await b.evaluate(`${LAB}.setSpeed(4)`);
  let s = await lab.state();
  t.expect(s.where === 'pedestal' && !s.controls.platen && !s.controls.carrier && !s.controls.slurry && !s.controls.conditioner, 'the tool starts idle with the wafer at the load position', JSON.stringify(s));

  await b.drag(line(await lab.at(L.pedestal[0], L.pedestal[1] + 0.004, L.pedestal[2]), await lab.at(L.head[0], L.carryY, L.head[2]), 14)); await sleep(500);
  s = await lab.state(); t.expect(s.where === 'head', 'dragging the wafer under the head loads it', `wafer at ${s.where}`);

  const arc = []; for (let a = 2.4; a >= 0.9; a -= 0.15) arc.push(await lab.at(-0.05 + 0.26 * Math.cos(a), L.padTop, 0.26 * Math.sin(a)));
  await b.drag(arc); await sleep(300);
  s = await lab.state(); t.expect(s.controls.platen > 0, 'dragging round the pad spins the platen up', `platen ${s.controls.platen}`);

  const ring = await lab.at(L.ring[0], L.ring[1], L.ring[2]);
  await b.drag(line(ring, { x: ring.x + 170, y: ring.y }, 12));
  s = await lab.state(); t.expect(s.controls.carrier > 0, 'dragging the spindle sideways turns the head', `head ${s.controls.carrier}`);

  const valve = await lab.at(L.valve[0] + 0.045, L.valve[1], L.valve[2]);
  await b.drag(line(valve, { x: valve.x + 140, y: valve.y }, 12));
  s = await lab.state(); t.expect(s.controls.slurry > 0, 'dragging the valve handle opens the slurry', `slurry ${s.controls.slurry}`);

  const dial = await lab.at(L.zone[0], L.zone[1], L.zone[2]);
  await b.drag(line(dial, { x: dial.x + 60, y: dial.y }, 8));
  s = await lab.state(); t.expect(Math.abs(s.controls.zone) > 0.001, 'dragging the zone dial moves pressure between centre and edge', `zone ${s.controls.zone}`);

  await b.click(await lab.at(L.cup[0], L.cup[1], L.cup[2]), 200);
  s = await lab.state(); t.expect(s.controls.conditioner === true, 'a click on the conditioner starts its sweep');

  await lab.hover(valve); await sleep(300);
  const card = await lab.card();
  t.expect(card && card.name === names.slurry, 'the pointer on the valve shows the valve\'s card', card ? card.text.slice(0, 120) : 'no card');
  await b.mouse('mousePressed', valve, 1); await sleep(60); await b.mouse('mouseMoved', { x: valve.x + 12, y: valve.y }, 1); await sleep(600);
  const held = { pill: await lab.pill(), card: await lab.card() };
  t.expect(held.pill !== '' && held.card === null, 'while a part is held, only the value being set is shown on it', JSON.stringify(held));
  await b.mouse('mouseMoved', valve, 1); await sleep(100); await b.mouse('mouseReleased', valve, 0); await sleep(200);
  await lab.shot('1-set-up');

  const raised = await lab.at(L.head[0], L.padTop + C.headTravel + 0.05, L.head[2] + 0.184);
  await b.drag(line(raised, { x: raised.x, y: raised.y + 62 }, 14)); await sleep(1200);
  s = await lab.state(); t.expect(s.gap < 0.001 && s.pressure > 0 && s.rate > 0, 'pulling the head down brings the wafer onto the pad and presses it: removal starts', JSON.stringify({ gap: s.gap, pressure: s.pressure, rate: s.rate }));
  await lab.shot('2-pressing');
  const lowered = await lab.at(L.head[0], L.padTop + 0.05, L.head[2] + 0.184), before = s.controls.head;
  for (let i = 0; i < 5; i++) { await b.wheel(lowered, 100); await sleep(40); }
  await sleep(300);
  s = await lab.state(); t.expect(s.controls.head !== before, 'the wheel on the head changes the downforce in small steps', `${before} -> ${s.controls.head}`);

  await lab.polishTo(575);
  const down = await lab.at(L.head[0], L.padTop + 0.05, L.head[2] + 0.184);
  await b.drag(line(down, { x: down.x, y: down.y - 130 }, 10));
  t.expect(await reached(b, `${LAB}.sim.state.gap > 0.1`, 30000), 'pulling the head up lifts the wafer off the pad');
  await sleep(1500);

  const up = await lab.at(L.head[0], L.padTop + C.headTravel + 0.05, L.head[2] + 0.184);
  await b.drag(line(up, await lab.at(L.stage[0], L.carryY, L.stage[2]), 16));
  const measured = await reached(b, `${LAB}.drawer.open && ${LAB}.attempts.length === 1`, 30000);
  await sleep(2000);
  const p = await lab.panels(), report = await b.evaluate(`document.getElementById('report').innerText.replace(/\\n+/g, ' | ')`);
  s = await lab.state();
  t.expect(measured && s.where === 'stage' && p.drawer.tab === 'report' && report.length > 100, 'pulling the raised head to the metrology stage measures the wafer and opens the report', `wafer at ${s.where}, ${JSON.stringify(p.drawer)}`);
  if (p.wafers[0]) {
    t.expect(p.wafers[0].mean > 500 && p.wafers[0].mean < 600, 'the measured thickness is where the polish was stopped', `${p.wafers[0].mean} nm`);
    t.note(`this wafer: ${Math.round(p.wafers[0].mean)} nm, ${p.wafers[0].pass ? 'passed' : 'did not pass'} (the verdict depends on the drags above; the model itself is covered by the unit tests)`);
  }
  await lab.shot('3-report');

  // How wide 20 cm of the touch panel looks on screen: it grows when the camera goes to the panel.
  const panelWidth = `(() => { const s = ${LAB}.scene, a = s.project(${L.hmi[0] - 0.1}, ${L.hmi[1]}, ${L.hmi[2]}), c = s.project(${L.hmi[0] + 0.1}, ${L.hmi[1]}, ${L.hmi[2]}); return Math.hypot(a.x - c.x, a.y - c.y); })()`;
  const far = await b.evaluate(panelWidth);
  await b.click(await lab.at(L.hmi[0], L.hmi[1], L.hmi[2]), 300);
  t.expect(await reached(b, `${panelWidth} > ${far * 1.5}`, 30000), 'a click on the tool\'s touch panel brings the camera up close to it', `the panel looked ${Math.round(far)} px wide before and ${Math.round(await b.evaluate(panelWidth))} px after`);
  await sleep(1500);
  await lab.shot('4-screen');
  await b.evaluate(`${LAB}.scene.setView('home', true)`); await sleep(400);
  await b.evaluate(`(() => { const d = ${LAB}; d.sim.setControl('platen', 60); d.sim.setControl('carrier', 55); d.sim.setControl('slurry', 150); })()`); await sleep(300);
  await b.click(await lab.at(L.emo[0], L.emo[1], L.emo[2]), 400);
  s = await lab.state(); t.expect(!s.controls.platen && !s.controls.carrier && !s.controls.slurry && !s.controls.head && !s.controls.conditioner, 'the emergency stop button stops every motion and the slurry', JSON.stringify(s.controls));
}

async function labPanels(t) {
  const { b, lab } = await openLab(t);
  let p = await lab.panels();
  t.expect(!p.strip && !p.drawer.open, 'before polishing, the instrument strip and the report are out of the way', JSON.stringify(p));

  await lab.startPolishing({ platen: 90, carrier: 87, slurry: 200, conditioner: true });
  p = await lab.panels(); t.expect(p.strip && p.bottom > 0, 'the instrument strip comes up when the wafer touches the pad, and the 3D view makes room for it', JSON.stringify(p));
  await lab.polishTo(800); await sleep(1500);
  await lab.shot('1-strip');
  const tips = {};
  for (const [name, selector, fx] of [['thickness trend', '#plot-trend', 0.55], ['radial profile', '#plot-profile', 0.8], ['rate factor', '#factors .frow:nth-child(5)', 0.5], ['model note', '#model-note', 0.5]]) { await lab.hover(await lab.centre(selector, fx)); tips[name] = await lab.tip(); }
  t.expect(Object.values(tips).every(text => text.length > 0), 'the charts, the factors and the note show their values under the pointer', JSON.stringify(tips).slice(0, 300));
  await b.mouse('mouseMoved', { x: 300, y: 300 }); await sleep(300);

  await lab.polishTo(566); await lab.liftAndMeasure(1);
  p = await lab.panels(); t.expect(!p.strip && p.drawer.open && p.drawer.tab === 'report' && p.right > 0 && p.wafers.length === 1, 'after metrology the strip goes down, the report opens and the 3D view makes room for it', JSON.stringify(p));
  await lab.shot('2-report');
  await lab.hover(await lab.centre('.wafer-map', 0.5, 0.25));
  t.expect((await lab.tip()).length > 0, 'a point of the 49-point map shows its thickness under the pointer');
  await b.mouse('mouseMoved', { x: 300, y: 300 }); await sleep(200);

  await b.evaluate(`${LAB}.newWafer()`); await sleep(600);
  p = await lab.panels(); t.expect(!p.drawer.open, 'a new wafer closes the report');
  await lab.startPolishing({ platen: 90, carrier: 0, slurry: 200 });                         // on purpose: the head does not turn
  await lab.polishTo(600); await lab.liftAndMeasure(2);
  p = await lab.panels();
  t.note(`wafers: ${p.wafers.map(w => `#${w.id} ${Math.round(w.mean)} nm ${w.pass ? 'passed' : 'did not pass'}`).join(', ')}`);
  await lab.shot('3-second-report');

  let landed = await lab.clickOn('#drawer-tabs button[data-tab="log"]');
  const rows = await b.evaluate(`document.querySelectorAll('#log .log-row').length`);
  t.expect(landed && rows === 2 && (await lab.panels()).drawer.tab === 'log', 'the record tab lists both wafers', `click landed: ${landed}, ${rows} rows`);
  await lab.shot('4-record');
  landed = await lab.clickOn('#log .log-row:last-child');
  p = await lab.panels(); t.expect(landed && p.drawer.tab === 'report' && p.drawer.selected === p.wafers.at(-1).id, 'choosing a wafer in the record opens its report', `click landed: ${landed}, ${JSON.stringify(p.drawer)}`);
  landed = await lab.clickOn('#drawer-close');
  p = await lab.panels(); t.expect(landed && !p.drawer.open && p.right === 0, 'closing the report gives the room back to the 3D view', `click landed: ${landed}, ${JSON.stringify(p)}`);
  landed = await lab.clickOn('#log-open');
  p = await lab.panels(); t.expect(landed && p.drawer.open, 'the film monitor\'s record link opens it again', `click landed: ${landed}, ${JSON.stringify(p.drawer)}`);
}

// ----- 8-process lab -----
const PL = 'window.ProcessLabDebug';
/** The route by itself, with every process passed by the standard recipe (equipment=off). */
async function processRoute(t) {
  const b = await t.open({ width: 1600, height: 1000 });
  await b.goto(`${fileUrl(dist, 'process-lab.html')}?seed=5&equipment=off`);
  if (!(await reached(b, `!!${PL}`, 30000))) throw new Error('the page did not start');
  await sleep(800); await watchClicks(b);
  const bench = () => b.evaluate(`({ title: document.querySelector('.bench h2').textContent, at: ${PL}.run ? ${PL}.run.at : -1, start: ${PL}.run ? ${PL}.run.start : -1, records: ${PL}.run ? ${PL}.run.records.length : 0, finished: !!${PL}.run && ${PL}.run.finished,
    redo: !!document.getElementById('redo-here'), fresh: !!document.getElementById('start-here'), back: !!document.getElementById('back') })`);

  const names = await b.evaluate(`[...document.querySelectorAll('.stop .name')].map(e => e.textContent)`);
  t.expect(String(names) === '웨이퍼 제조,산화,포토,식각,증착·이온주입,금속배선,EDS,패키징', 'the route shows the eight processes in order', names.join(' '));
  const landing = await b.evaluate(`({ mode: ${PL}.mode, run: !!${PL}.run, first: !!document.getElementById('start-first'), stops: document.querySelectorAll('.stop svg').length, labels: [...document.querySelectorAll('.figure svg text')].map(e => e.textContent) })`);
  t.expect(landing.mode === 'bench' && !landing.run && landing.first && landing.stops === 8 && ['구리', '산화막', 'n+ 접합', '장벽막', '창', '실리콘'].every(word => landing.labels.some(text => text.includes(word))),
    'the lab opens on what it makes: the finished chip, every layer named after the process that makes it', JSON.stringify(landing));
  await t.shot('1-overview');

  let landed = await clickOn(b, '.stop:nth-child(4)', 1900);
  const begun = await b.evaluate(`({ title: document.querySelector('.bench h2').textContent, start: ${PL}.run.start, before: ${PL}.run.records.filter(r => r.before).length, oxide: ${PL}.run.wafer.oxide, window: !!${PL}.run.wafer.window, result: document.querySelector('.bench .result').textContent })`);
  t.expect(landed && begun.title === '식각' && begun.start === 3 && begun.before === 3 && begun.oxide === 500 && begun.window && begun.result.length > 5, 'a click on a stop starts there at once, on a wafer finished up to that process by the standard recipe', JSON.stringify(begun));
  await t.shot('2-etch');
  let mapped = null;
  for (let i = 0; i < 8 && landed && !(await b.evaluate(`!!document.querySelector('.sheet')`)); i++) {         // the last click opens the run sheet
    if (await b.evaluate(`${PL}.viewing === 6 && ${PL}.mode === 'bench'`)) mapped = await b.evaluate(`(() => { const key = document.querySelector('#bench .legend'), cells = [...document.querySelectorAll('#bench .figure svg rect[width="18.4"]')]; return { key: key && key.textContent, cells: cells.length, failed: cells.filter(r => r.getAttribute('fill') === '#e34948').length, tips: cells.filter(r => r.querySelector('title') && /결함/.test(r.querySelector('title').textContent)).length, good: ${PL}.run.wafer.tested.good }; })()`);
    landed = await clickOn(b, '#next-step', 1700);
  }
  t.expect(mapped && mapped.cells === 148 && mapped.failed === 148 - mapped.good && mapped.tips === mapped.failed && new RegExp(`양품 ${mapped.good}`).test(mapped.key) && new RegExp(`결함 ${mapped.failed}`).test(mapped.key), 'the EDS map colours failed chips by what failed them, says so under the pointer, and the key counts them', JSON.stringify(mapped));
  const sheet = await b.evaluate(`({ finished: ${PL}.run.finished, rows: document.querySelectorAll('.sheet tbody tr').length, before: document.querySelectorAll('.sheet tr[data-before="true"]').length, again: document.querySelectorAll('.sheet [data-redo]').length, chips: ${PL}.run.wafer.packaged.chips, good: ${PL}.run.wafer.tested.good, clean: ${PL}.flow.defects(${PL}.run.wafer.lot).filter(hit => !hit).length, title: document.querySelector('.bench h2').textContent })`);
  t.expect(sheet.finished && sheet.rows === 8 && sheet.before === 3 && sheet.again === 5 && sheet.chips === sheet.good && sheet.good === sheet.clean && sheet.good > 100 && sheet.good < 148 && sheet.title.includes(String(sheet.chips)), 'the run goes on from there to packaging and ends with the sheet of all eight processes; the chips without a defect are the ones packaged', JSON.stringify(sheet));
  await t.shot('3-run-sheet');

  landed = await clickOn(b, '.stop:nth-child(6)', 1500);
  let page = await bench();
  t.expect(landed && page.title === '금속배선' && page.redo && page.fresh && page.back && page.finished, 'after the run, a click on a stop offers that process again on this run\'s wafer, or a new run from there', JSON.stringify(page));
  landed = await clickOn(b, '#redo-here', 1900); page = await bench();
  t.expect(landed && page.title === '금속배선' && !page.finished && page.at === 6 && page.records === 6 && page.start === 3, 'doing it again takes the run back to that process and keeps what came before it', JSON.stringify(page));
  for (let i = 0; i < 4 && landed && !(await b.evaluate(`!!document.querySelector('.sheet')`)); i++) landed = await clickOn(b, '#next-step', 1700);
  landed = landed && await clickOn(b, '.sheet [data-redo="3"]', 1900); page = await bench();
  t.expect(landed && page.title === '식각' && page.at === 4 && page.records === 4 && page.start === 3, 'the sheet\'s own "again" does the same from its row', JSON.stringify(page));
  landed = await clickOn(b, '.stop:nth-child(7)', 1500); page = await bench();
  t.expect(landed && page.title === 'EDS' && !page.redo && page.fresh && page.back && page.at === 4, 'a process the run has not reached yet can only be the start of a new run', JSON.stringify(page));
  landed = await clickOn(b, '#back', 1500); page = await bench();
  t.expect(landed && page.title === '식각' && page.at === 4, 'and the run in hand can be gone back to', JSON.stringify(page));
  for (let i = 0; i < 6 && landed && !(await b.evaluate(`!!document.querySelector('.sheet')`)); i++) landed = await clickOn(b, '#next-step', 1700);
  landed = landed && await clickOn(b, '#from-first', 1900); page = await bench();
  t.expect(landed && page.start === 0 && page.records === 1 && page.title === '웨이퍼 제조', 'a new run can be started from the first process', JSON.stringify(page));
}

/**
 * The same route with the equipment on: a click on a process opens its equipment at once, the process in hand can be
 * done again on the same wafer or passed by the standard recipe, and an earlier process of the run can be gone back to.
 */
async function processFlow(t) {
  const b = await t.open({ width: 1600, height: 1000 }), S = `${PL}.sim.state`;
  await b.goto(`${fileUrl(dist, 'process-lab.html')}?seed=5`);
  if (!(await reached(b, `!!${PL}`, 30000))) throw new Error('the page did not start');
  await sleep(1200); await watchClicks(b);
  const at = () => b.evaluate(`({ mode: ${PL}.mode, equipment: ${PL}.station ? ${PL}.station.equipment : null, at: ${PL}.run ? ${PL}.run.at : -1, start: ${PL}.run ? ${PL}.run.start : -1, records: ${PL}.run ? ${PL}.run.records.length : 0,
    redo: !!document.getElementById('redo-here'), fresh: !!document.getElementById('start-here') })`);
  const opens = equipment => reached(b, `${PL}.mode === 'station' && !!${PL}.station && ${PL}.station.equipment === '${equipment}' && Object.keys(${PL}.scene.parts).length > 5`, 30000);
  t.expect(await b.evaluate(`${PL}.mode === 'bench' && !${PL}.run && !!document.getElementById('start-first') && document.getElementById('redo').hidden && document.getElementById('skip').hidden`), 'with nothing in hand the lab shows what it makes');

  let landed = await clickOn(b, '.stop:nth-child(4)', 2500);
  const opened = await opens('etch'), top = await b.evaluate(`({ about: document.getElementById('about').textContent, redo: !document.getElementById('redo').hidden, skip: !document.getElementById('skip').hidden, start: ${PL}.run.start })`);
  t.expect(landed && opened && top.start === 3 && /산화막을 깎아/.test(top.about) && top.redo && top.skip, 'a click on a process opens its equipment at once, with a line on what the process does', JSON.stringify(top));
  await sleep(2500); await t.shot('1-opened');

  await b.evaluate(`(() => { const d = ${PL}; for (const [name, value] of [['chf3', true], ['power', 300], ['load', true]]) d.station.control(d.sim, name, value); d.setSpeed(240); })()`);
  t.expect(await reached(b, `${S}.etched > 30`, 60000), 'the etch is under way');
  const incoming = await b.evaluate(`JSON.stringify(${PL}.run.wafer)`);
  landed = await clickOn(b, '#redo', 1800);
  const fresh = await b.evaluate(`({ etched: ${S}.etched, inside: ${S}.inside, power: ${S}.controls.power, same: JSON.stringify(${PL}.run.wafer) === ${JSON.stringify(incoming)}, at: ${PL}.run.at, records: ${PL}.run.records.length })`);
  t.expect(landed && fresh.etched === 0 && fresh.inside === 0 && fresh.power === 0 && fresh.same && fresh.at === 3 && fresh.records === 3, '"this process again" puts the same incoming wafer on a fresh machine', JSON.stringify(fresh));

  landed = await clickOn(b, '#skip', 1800);
  const passed = await b.evaluate(`({ mode: ${PL}.mode, record: ${PL}.run.records.at(-1), at: ${PL}.run.at, open: ${PL}.run.wafer.window && ${PL}.run.wafer.window.open })`);
  t.expect(landed && passed.mode === 'bench' && passed.record.step === 'etch' && passed.record.by === 'standard' && passed.at === 4 && passed.open, 'the process in hand can be passed by the standard recipe', JSON.stringify(passed.record));
  landed = await clickOn(b, '#next-step', 2500);
  t.expect(landed && await opens('implant'), 'and the run goes on to the next equipment');

  landed = await clickOn(b, '.stop:nth-child(4)', 1500); let page = await at();
  t.expect(landed && page.mode === 'bench' && page.redo && page.fresh && page.at === 4, 'a click on an earlier process of the run asks which wafer to do it on', JSON.stringify(page));
  landed = await clickOn(b, '#back', 1500); page = await at();
  t.expect(landed && page.mode === 'station' && page.equipment === 'implant' && page.at === 4, 'going back returns to the equipment in hand', JSON.stringify(page));
  landed = await clickOn(b, '.stop:nth-child(4)', 1500); landed = landed && await clickOn(b, '#redo-here', 2500);
  const back = await opens('etch'); page = await at();
  t.expect(landed && back && page.at === 3 && page.records === 3 && page.start === 3 && await b.evaluate(`JSON.stringify(${PL}.run.wafer) === ${JSON.stringify(incoming)}`), 'doing the earlier process again opens its equipment on the wafer the run brought to it', JSON.stringify(page));

  landed = await clickOn(b, '.stop:nth-child(7)', 1500); page = await at();
  t.expect(landed && page.mode === 'bench' && !page.redo && page.fresh, 'a process further on can only be the start of a new run', JSON.stringify(page));
  landed = await clickOn(b, '#start-here', 2500);
  const later = await opens('prober'); page = await at();
  t.expect(landed && later && page.start === 6 && page.at === 6 && page.records === 6, 'and starting there opens that equipment on a standard wafer', JSON.stringify(page));
  await sleep(2000); await t.shot('2-new-run');
}

/** Opens the 8-process lab at a process that has equipment, and returns helpers for checking that equipment. */
async function openProcess(t, id) {
  const b = await t.open({ width: 1600, height: 1000 }), S = `${PL}.sim.state`;
  await b.goto(`${fileUrl(dist, 'process-lab.html')}?seed=5&start=${id}`);
  if (!(await reached(b, `!!${PL} && ${PL}.mode === 'station' && !!${PL}.sim`, 30000))) throw new Error(`the equipment of ${id} did not open`);
  await sleep(3000); await watchClicks(b);
  const canvasBox = () => b.evaluate(`(() => { const r = document.getElementById(document.getElementById('stage').dataset.view === 'cmp' ? 'scene-cmp' : 'scene').getBoundingClientRect(); return { x: r.x, y: r.y }; })()`);   // the canvas on show
  const onPage = async point => { const box = await canvasBox(); return { x: point.x + box.x, y: point.y + box.y }; };
  const lab = {
    S, layout: await b.evaluate(`${PL}.scene.layout`),
    at: async point => onPage(await b.evaluate(`${PL}.scene.project(${point[0]}, ${point[1]}, ${point[2]})`)),      // a point of the 3D scene, in page pixels
    part: async name => onPage(await b.evaluate(`${PL}.scene.screenOf(${JSON.stringify(name)})`)),                   // where a part's card is anchored now, in page pixels
    state: expression => b.evaluate(`(() => { const s = ${S}; return ${expression}; })()`),
    card: () => b.evaluate(`document.getElementById('callout').hidden ? '' : document.getElementById('co-name').textContent`),
    pill: () => b.evaluate(`document.getElementById('pill').hidden ? '' : document.getElementById('pill').textContent`),
    guide: () => b.evaluate(`document.getElementById('guide-text').textContent`),
    monitor: () => b.evaluate(`({ value: Number(document.getElementById('mon-mean').textContent.replace(/,/g, '')), note: document.getElementById('mon-togo').textContent, trend: !!document.querySelector('#trend path[stroke="#0d6efd"]') })`),
    /** Runs the process faster until the expression holds, then returns to the speed it had. */
    fast: async (expression, speed = 1200, ms = 240000) => {
      const before = await b.evaluate(`${PL}.speed`); await b.evaluate(`${PL}.setSpeed(${speed})`);
      const ok = await reached(b, expression, ms); await b.evaluate(`${PL}.setSpeed(${before})`); await sleep(700); return ok;
    },
    /** Every part of the equipment has a card and shows it under the pointer. Parts in `later` are covered by something now and are left for lab.card(). */
    cards: async (later = []) => {
      const scene = Object.keys(await b.evaluate(`${PL}.scene.parts`)), cards = await b.evaluate(`Object.fromEntries(Object.entries(${PL}.parts).map(([key, part]) => [key, part.name]))`);
      t.expect(scene.length > 0 && String([...scene].sort()) === String(Object.keys(cards).sort()), `every part of the equipment has a card and every card has a part (${scene.length} parts)`, `scene: ${scene.join(' ')} | cards: ${Object.keys(cards).join(' ')}`);
      const wrong = [];
      for (const name of scene.filter(part => !later.includes(part))) {
        const point = await onPage(await b.evaluate(`${PL}.scene.screenOf(${JSON.stringify(name)})`));
        await b.mouse('mouseMoved', { x: 60, y: 420 }); await sleep(400);
        await b.mouse('mouseMoved', { x: point.x + 1, y: point.y + 1 }); await sleep(120); await b.mouse('mouseMoved', point);
        let under = null;
        for (let i = 0; i < 30 && under !== name; i++) { await sleep(200); under = await b.evaluate(`${PL}.scene.hovered`); }
        await sleep(400);
        const shown = await lab.card();
        if (under !== name || shown !== cards[name]) wrong.push(`${name}: under the pointer ${under}, card ${JSON.stringify(shown)}`);
      }
      t.expect(!wrong.length, 'each part shows its own card under the pointer', wrong.join('; '));
      await b.mouse('mouseMoved', { x: 60, y: 420 }); await sleep(600);
    },
    /** One part: what is under the pointer at its place, and the card that shows. */
    hover: async name => {
      const point = await onPage(await b.evaluate(`${PL}.scene.screenOf(${JSON.stringify(name)})`));
      await b.mouse('mouseMoved', { x: 60, y: 420 }); await sleep(400);
      await b.mouse('mouseMoved', { x: point.x + 1, y: point.y + 1 }); await sleep(120); await b.mouse('mouseMoved', point);
      let under = null;
      for (let i = 0; i < 30 && under !== name; i++) { await sleep(200); under = await b.evaluate(`${PL}.scene.hovered`); }
      await sleep(400);
      const shown = await lab.card();
      await b.mouse('mouseMoved', { x: 60, y: 420 }); await sleep(500);
      return { under, shown };
    },
    /** Presses the guide's button and reports what the next process received. */
    handOver: async () => {
      const landed = await clickOn(b, '#guide-action', 1900);
      return { landed, ...(await b.evaluate(`({ mode: ${PL}.mode, viewing: ${PL}.viewing, wafer: ${PL}.run.wafer, record: ${PL}.run.records.find(r => r.step === ${JSON.stringify(id)}) })`)) };
    },
  };
  return { b, lab };
}

async function processCrystal(t) {
  const { b, lab } = await openProcess(t, 'wafer'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ seed: s.seed, target: s.controls.seed, speed: s.controls.speed, dopant: s.controls.dopant, auto: s.controls.auto, heater: s.controls.heater, superheat: s.superheat, attached: s.attached, ended: s.ended, doped: s.doped, length: s.length, d: 2 * s.radius, necked: s.necked, body: s.body.length, result: s.result && { valid: s.result.valid, ok: s.result.ok, d: s.result.diameter, rho: s.result.resistivity, necked: s.result.necked } })`);
  await lab.cards();
  let s = await state();
  t.expect(!s.attached && s.seed === 0 && s.dopant === 0 && s.speed === 0, 'the puller starts with the seed above the melt and no boron chosen', JSON.stringify(s));
  // the heater: the melt follows it over minutes, then it goes back to where it was
  const power = await lab.at(L.dials.power);
  await b.evaluate(`${PL}.setSpeed(30)`);                                                // half a minute a second while the dial is turned
  for (let i = 0; i < 10; i++) { await b.wheel(power, -100); await sleep(60); }
  await sleep(400); s = await state();
  t.expect(s.heater === 110 && s.superheat < 7.5, 'the heater dial turns in steps of 0.5 kW; the melt has not followed yet', JSON.stringify({ heater: s.heater, superheat: s.superheat }));
  t.expect(await lab.fast(`${S}.superheat > 9`, 300, 60000), 'over the next minutes the melt warms toward its new temperature');
  for (let i = 0; i < 10; i++) { await b.wheel(power, 100); await sleep(60); }
  t.expect(await lab.fast(`${S}.superheat < 5.2`, 900, 60000) && (await state()).heater === 105, 'turned back, the melt cools to where it was');
  const speed = await lab.at(L.dials.speed), dopant = await lab.at(L.dials.dopant);
  await b.drag(line(dopant, { x: dopant.x + 145, y: dopant.y }, 12)); await sleep(400);
  s = await state(); t.expect(Math.abs(s.dopant - 2.9) < 1e-9, 'the boron dial is set before the seed goes in', `${s.dopant} mg`);
  const seed = await lab.part('seed');
  await b.drag(line(seed, { x: seed.x, y: seed.y + 240 }, 12)); await sleep(500);
  s = await state(); t.expect(s.target === 1, 'pulling the seed down sends it into the melt', `target ${s.target}`);
  t.expect(await lab.fast(`${S}.attached`, 300, 60000), 'the seed touches the melt');
  for (let i = 0; i < 3; i++) { await b.wheel(dopant, -100); await sleep(50); }
  await sleep(700); s = await state(); const refused = await lab.guide();
  t.expect(s.dopant === 2.9 && s.doped === 2.9 && /바꿀 수 없/.test(refused), 'once the seed is in, the boron is in the melt and its dial is refused', `${s.dopant} mg | ${refused}`);

  // neck: a fast pull
  await b.drag(line(speed, { x: speed.x + 300, y: speed.y }, 14)); await sleep(400);
  s = await state(); t.expect(Math.abs(s.speed - 9) < 1e-9, 'the pull speed dial is dragged up for the neck', `${s.speed} mm/min`);
  t.expect(await lab.fast(`${S}.necked`, 300, 120000), 'at 9 mm/min the crystal thins to a neck and holds it long enough');
  await sleep(700); let shown = await lab.monitor();
  t.expect(shown.value < 6 && /넥/.test(shown.note) && shown.trend, 'the camera reads a neck a few millimetres thick', JSON.stringify(shown));
  await b.click(await lab.at(L.buttons.auto), 450); await sleep(500);
  t.expect(!(await state()).auto && /mm 안에/.test(await lab.guide()), 'the diameter controller is refused this far from its target, and the page says why', await lab.guide());
  await b.evaluate(`${PL}.scene.setView('melt', true)`); await sleep(1500); await t.shot('1-neck'); await b.evaluate(`${PL}.scene.setView('home', true)`); await sleep(1500);

  // shoulder: a slow pull, then the controller for the body
  await b.drag(line(speed, { x: speed.x - 267, y: speed.y }, 14)); await sleep(400);
  s = await state(); t.expect(Math.abs(s.speed - 1) < 1e-9, 'the pull is slowed for the shoulder', `${s.speed} mm/min`);
  t.expect(await lab.fast(`2 * ${S}.radius > 292`, 3000, 240000), 'the crystal widens toward 300 mm');
  await b.click(await lab.at(L.buttons.auto), 450); await sleep(700);
  s = await state(); t.expect(s.auto && s.d > 285 && s.d < 325, 'near the target the diameter controller takes over', JSON.stringify({ auto: s.auto, d: s.d }));
  t.expect(await lab.fast(`${S}.body.length >= 105`, 3000, 240000), 'the controller holds the diameter while the body grows');
  await sleep(700); s = await state(); shown = await lab.monitor();
  t.expect(s.d > 300 && s.d < 310 && Math.abs(shown.value - s.d) < 1.5 && /바디/.test(shown.note), 'the body is inside the range the run sheet asks for', JSON.stringify({ d: s.d, shown }));
  await t.shot('2-body');

  // out of the melt and measured
  const hanging = await lab.part('seed');
  await b.drag(line(hanging, { x: hanging.x, y: hanging.y - 220 }, 12)); await sleep(500);
  s = await state(); t.expect(s.target === 0 && s.ended, 'pulling the seed up takes the crystal off the melt', JSON.stringify({ target: s.target, ended: s.ended }));
  t.expect(await lab.fast(`${PL}.sim.canMeasure()`, 300, 60000), 'the crystal is lifted out');
  await sleep(700);
  const landed = await clickOn(b, '#guide-action', 900);
  s = await state(); shown = await lab.monitor();
  t.expect(landed && s.result && s.result.valid && s.result.ok && s.result.necked && Math.abs(s.result.rho - 10) < 1 && /계측값/.test(shown.note), 'the crystal is measured: a body in range, a neck, and the resistivity the run sheet asks for', JSON.stringify(s.result));
  await t.shot('3-measured');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 1 && next.record.by === 'operator' && next.record.ok && Math.abs(next.wafer.substrate.resistivity - s.result.rho) < 1e-9 && !next.wafer.substrate.dislocated, 'the wafer cut from the crystal goes on to oxidation', JSON.stringify(next.record));
}

async function processOxidation(t) {
  const { b, lab } = await openProcess(t, 'oxidation'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ boat: s.boat, target: s.controls.boat, set: s.controls.setpoint, tube: s.tube, n2: s.controls.n2, o2: s.controls.o2, h2o: s.controls.h2o, ambient: s.ambient, oxide: s.oxide, growing: s.growing })`);
  await lab.cards();
  let s = await state();
  t.expect(s.boat === 0 && s.set === 700 && s.n2 && !s.o2 && !s.h2o && s.oxide < 3, 'the furnace starts at standby with the boat down and nitrogen flowing', JSON.stringify(s));
  const low = await lab.at([L.boatGrip[0], L.flangeDown + L.boatGrip[1], L.boatGrip[2]]);
  await b.drag(line(low, { x: low.x, y: low.y - 240 }, 12)); await sleep(500);
  s = await state(); t.expect(s.target === 1, 'pulling the boat up sends it into the tube', `target ${s.target}`);
  t.expect(await lab.fast(`${S}.sealed`, 1200, 60000), 'the boat closes the tube');

  const dial = await lab.at(L.dial);
  await b.mouse('mouseMoved', dial); await sleep(80); await b.mouse('mousePressed', dial, 1); await sleep(60); await b.mouse('mouseMoved', { x: dial.x + 40, y: dial.y }, 1); await sleep(700);
  const held = { pill: await lab.pill(), card: await lab.card() };
  for (const p of line({ x: dial.x + 40, y: dial.y }, { x: dial.x + 200, y: dial.y }, 8)) { await b.mouse('mouseMoved', p, 1); await sleep(35); }
  await b.mouse('mouseReleased', { x: dial.x + 200, y: dial.y }, 0); await sleep(400);
  s = await state(); t.expect(s.set === 1000 && /°C/.test(held.pill) && held.card === '', 'pulling the temperature dial sets the heater, and the value shows on the dial while it is held', `setpoint ${s.set}, ${JSON.stringify(held)}`);
  for (let i = 0; i < 3; i++) { await b.wheel(dial, 100); await sleep(60); }
  await sleep(300); s = await state(); t.expect(s.set === 985, 'the wheel moves the setpoint in steps of 5 C', `setpoint ${s.set}`);

  for (const name of ['h2o', 'n2']) await b.click(await lab.at(L.valves[name]), 350);
  s = await state(); t.expect(s.h2o && !s.n2 && s.ambient === 'wet', 'a click on a valve opens or closes it: steam on, nitrogen off', JSON.stringify(s));
  t.expect(await lab.fast(`${S}.tube > 980 && ${S}.oxide > 60`), 'the tube heats up and the oxide grows in steam');
  await sleep(600);
  const live = await lab.monitor();
  s = await state(); t.expect(s.growing && /계산값/.test(live.note) && live.trend && live.value > 50, 'the wafer monitor follows the growing film', JSON.stringify(live));
  await t.shot('1-oxidising');

  const high = await lab.at([L.boatGrip[0], L.flangeDown + L.travel + L.boatGrip[1], L.boatGrip[2]]);
  await b.drag(line(high, { x: high.x, y: high.y + 200 }, 10)); await sleep(1200);
  s = await state(); const locked = await lab.guide();
  t.expect(s.boat === 1 && s.target === 1 && /잠겨/.test(locked), 'the boat does not move while the tube is hotter than 800 C, and the page says why', `boat ${s.boat}, guide: ${locked}`);

  t.expect(await lab.fast(`${S}.oxide > 490`), 'the film reaches the thickness the run sheet asks for');
  for (const name of ['h2o', 'n2']) await b.click(await lab.at(L.valves[name]), 350);
  const stopped = (await state()).oxide;
  await b.drag(line(dial, { x: dial.x - 220, y: dial.y }, 12)); await sleep(300);
  t.expect(await lab.fast(`${S}.tube <= 800`), 'with the setpoint down the tube cools below 800 C');
  s = await state(); t.expect(!s.h2o && s.n2 && Math.abs(s.oxide - stopped) < 1, 'with the steam off the film stops growing', `${stopped.toFixed(1)} -> ${s.oxide.toFixed(1)} nm`);
  await b.drag(line(high, { x: high.x, y: high.y + 200 }, 10)); await sleep(500);
  t.expect(await lab.fast(`${PL}.sim.canMeasure()`, 1200, 120000), 'the boat comes down and the wafers cool');
  await sleep(600);
  const landed = await clickOn(b, '#guide-action', 900);
  const measured = await lab.state(`s.measured ? { mean: s.measured.mean, ok: s.measured.ok, points: s.measured.points.length } : null`), shown = await lab.monitor();
  t.expect(landed && measured && measured.points === 5 && measured.ok && /계측값/.test(shown.note), 'the thickness is measured at five points and meets the run sheet', JSON.stringify(measured));
  await t.shot('2-measured');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 2 && measured && Math.abs(next.wafer.oxide - measured.mean) < 1e-9 && next.record.by === 'operator' && next.record.ok, 'the measured film goes on to the next process on the same wafer', JSON.stringify(next.record));
}

async function processPhoto(t) {
  const { b, lab } = await openProcess(t, 'photo'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ phase: s.phase, spin: s.controls.spin, dose: s.controls.dose, focus: s.controls.focus, best: s.bestFocus, thickness: s.thickness, reworks: s.reworks, result: s.result && { opening: s.result.opening, ok: s.result.ok } })`);
  const press = async name => b.click(await lab.at(L.buttons[name]), 450);
  await lab.cards();
  let s = await state();
  t.expect(s.phase === 'bare' && s.thickness === 0, 'the cell starts with a bare wafer on the coater', JSON.stringify(s));
  await press('expose'); await sleep(500);
  t.expect((await state()).phase === 'bare' && /먼저 감광막/.test(await lab.guide()), 'exposure is refused before the resist is on, and the page says why', await lab.guide());

  // first pass with the dials as they stand: this wafer's best focus is not at zero, so the opening misses
  await press('coat');
  t.expect(await lab.fast(`${S}.phase === 'coated'`, 96), 'the coat button spins the resist on and bakes it');
  s = await state(); t.expect(Math.abs(s.thickness - 1000) < 1, 'at 4,000 rpm the resist is 1,000 nm thick', `${s.thickness} nm`);
  await press('expose'); await lab.fast(`${S}.phase === 'exposed'`, 96); await press('develop');
  t.expect(await lab.fast(`${S}.phase === 'developed'`, 96), 'expose and develop run in turn and the opening is measured');
  s = await state();
  t.expect(s.result && !s.result.ok && /재작업/.test(await lab.guide()), 'with the dials untouched the opening misses the target, and the page offers the rework', JSON.stringify(s.result));
  await t.shot('1-first-pass');
  await press('strip'); await sleep(400);
  s = await state(); t.expect(s.phase === 'bare' && s.reworks === 1 && !s.result, 'the rework button strips the resist for another try', JSON.stringify(s));

  // second pass: dose by dragging its dial, focus by the wheel, read from the wafer monitor before exposing
  await press('coat'); await lab.fast(`${S}.phase === 'coated'`, 96);
  const before = await lab.monitor(), dose = await lab.at(L.dials.dose), focus = await lab.at(L.dials.focus);
  await b.drag(line(dose, { x: dose.x + 140, y: dose.y }, 12)); await sleep(300);
  for (let i = 0; i < Math.round(Math.abs(s.best) * 10); i++) { await b.wheel(focus, s.best > 0 ? -100 : 100); await sleep(50); }
  await sleep(1300);
  s = await state(); const after = await lab.monitor();
  t.expect(s.dose === 240 && Math.abs(s.focus - s.best) < 0.05, 'the dose dial is dragged and the focus dial is turned with the wheel', JSON.stringify(s));
  t.expect(after.trend && /계산값/.test(after.note) && after.value > before.value && Math.abs(after.value - 1000) <= 50, 'the wafer monitor shows the image for the dials as they are, and the opening it would give', `${before.value} -> ${after.value} nm`);
  await t.shot('2-tuned');
  await press('expose'); await sleep(1200); await t.shot('3-exposing');
  await lab.fast(`${S}.phase === 'exposed'`, 96); await press('develop'); await lab.fast(`${S}.phase === 'developed'`, 96);
  s = await state(); const shown = await lab.monitor();
  t.expect(s.result && s.result.ok && Math.abs(s.result.opening - after.value) < 10 && /계측값/.test(shown.note), 'the developed opening is the one the image predicted and meets the run sheet', JSON.stringify(s.result));
  const next = await lab.handOver();
  const carried = next.wafer.resist ? next.wafer.resist.opening : next.wafer.window.width;                    // still resist if the etch has equipment, a window if it was passed
  t.expect(next.landed && next.viewing === 3 && next.record.by === 'operator' && next.record.ok && s.result && Math.abs(carried - s.result.opening) < 1e-9, 'the resist pattern goes on to the etch on the same wafer', JSON.stringify(next.record));
}

async function processEtch(t) {
  const { b, lab } = await openProcess(t, 'etch'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ inside: s.inside, plasma: s.plasma, power: s.controls.power, pressure: s.controls.pressure, chf3: s.controls.chf3, floor: s.floor, signal: s.signal, opened: s.opened, result: s.result && { open: s.result.open, ok: s.result.ok, width: s.result.width, silicon: s.result.siliconLoss } })`);
  await lab.cards();
  let s = await state();
  t.expect(s.inside === 0 && !s.plasma && s.floor === 500, 'the wafer waits on the load arm with its resist pattern on', JSON.stringify(s));
  await b.click(await lab.at(L.valves.chf3), 350);
  const power = await lab.at(L.dials.power), pressure = await lab.at(L.dials.pressure);
  await b.drag(line(power, { x: power.x + 150, y: power.y }, 12)); await sleep(500);
  s = await state(); t.expect(s.chf3 && s.power === 300 && !s.plasma, 'gas and power do not strike a plasma while the wafer is outside', JSON.stringify(s));
  await b.click(await lab.at(L.buttons.load), 400);
  t.expect(await reached(b, `${S}.plasma`, 30000), 'with the wafer in and the door shut the plasma strikes');
  for (let i = 0; i < 8; i++) { await b.wheel(pressure, 100); await sleep(50); }
  await sleep(300); s = await state(); t.expect(s.pressure === 10, 'the wheel lowers the pressure in steps of 5 mTorr', `${s.pressure} mTorr`);
  await b.click(await lab.at(L.buttons.load), 400); await sleep(700);
  const refused = await lab.guide();
  t.expect((await state()).inside === 1 && /문이 열리지/.test(refused), 'the door does not open while the plasma is on, and the page says why', refused);

  await lab.fast(`${S}.floor < 250`, 240); await sleep(900);
  const during = await state(), shown = await lab.monitor();
  t.expect(during.signal > 0.2 && shown.trend && /계산값/.test(shown.note), 'while the oxide is etched the endpoint light is high and the monitor follows the opening', JSON.stringify({ signal: during.signal, shown }));
  await t.shot('1-etching');
  t.expect(await lab.fast(`${S}.opened > 0.2 && ${S}.opened < 0.8`, 10, 240000), 'the edge opens first: for a while only part of the wafer is through');
  const partly = await state(), told = await lab.guide();
  t.expect(partly.signal < during.signal * 0.95 && partly.signal > 0.14 && /가장자리부터/.test(told), 'meanwhile the endpoint light is falling but not yet at the bottom, and the page says the edge opens first', JSON.stringify({ during: during.signal, partly: partly.signal, opened: partly.opened, told }));
  t.expect(await lab.fast(`${S}.floor <= 0 && ${S}.siliconLoss > 1`, 240), 'the opening reaches the silicon everywhere');
  await sleep(700);
  const through = await state();
  t.expect(through.signal < during.signal * 0.6, 'the endpoint light drops when the oxide is through', `${during.signal.toFixed(2)} -> ${through.signal.toFixed(2)}`);
  await b.drag(line(power, { x: power.x - 170, y: power.y }, 12)); await sleep(500);
  s = await state(); t.expect(s.power === 0 && !s.plasma, 'turning the RF power down stops the etch', JSON.stringify(s));
  await b.click(await lab.at(L.buttons.load), 400);
  t.expect(await reached(b, `!!${S}.result && ${S}.inside <= 0`, 30000), 'the wafer comes out, the resist is stripped and the window is measured');
  await sleep(900); s = await state();
  t.expect(s.result && s.result.open && s.result.ok && s.result.silicon < 20, 'stopped at the endpoint, the window is open with little silicon lost', JSON.stringify(s.result));
  await t.shot('2-measured');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 4 && next.record.by === 'operator' && next.record.ok && next.wafer.window.open && s.result && Math.abs(next.wafer.window.width - s.result.width) < 1e-9 && !next.wafer.resist, 'the window goes on to the next process on the same wafer', JSON.stringify(next.record));
}

async function processImplant(t) {
  const { b, lab } = await openProcess(t, 'deposition'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ phase: s.phase, field: s.controls.field, current: s.current, scanning: !!s.scan, scanned: s.spectrum.length, energy: s.controls.energy, dose: s.controls.dose, temperature: s.controls.temperature, minutes: s.controls.minutes, counted: s.counted, beam: s.beam, hot: s.hot, anneals: s.anneals.length, result: s.result && { junction: s.result.junction, surface: s.result.surface, ok: s.result.ok, masked: s.result.masked } })`);
  const press = async name => b.click(await lab.at(L.buttons[name]), 450);
  await lab.cards();
  let s = await state();
  t.expect(s.phase === 'ready' && s.counted === 0 && s.energy === 100 && s.dose === 14, 'the implanter starts with the wafer flat in the end station and no ion in it', JSON.stringify(s));
  await press('anneal'); await sleep(500);
  t.expect((await state()).phase === 'ready' && /먼저 이온/.test(await lab.guide()), 'the anneal is refused before the implant, and the page says why', await lab.guide());

  // the beam first: with the magnet on no peak nothing reaches the wafer; a mass scan, then the magnet onto the P+ peak
  let tuning = await lab.monitor();
  const scanOffered = await reached(b, "/질량 스캔/.test(document.getElementById('guide-text').textContent)", 8000);       // once the notice about the anneal has gone
  t.expect(s.current < 5e-6 && /패러데이/.test(tuning.note) && scanOffered, 'with the analyser on no peak there is no beam, and the page offers the mass scan', JSON.stringify({ current: s.current, note: tuning.note }));
  await press('implant'); await sleep(500);
  t.expect((await state()).phase === 'ready' && /빔 전류가 거의 없/.test(await lab.guide()), 'the implant is refused without a beam, and the page says why', await lab.guide());
  await press('scan');
  t.expect(await reached(b, `!!${S}.scan`, 5000), 'the scan button sweeps the magnet');
  t.expect(await lab.fast(`!${S}.scan && ${S}.spectrum.length > 1000`, 1, 30000), 'the scan records the beam current over the whole field');
  await sleep(900); tuning = await lab.monitor(); await t.shot('1-mass-scan');
  const peaks = await b.evaluate(`(() => { const points = [...document.querySelectorAll('#trend path')].map(p => p.getAttribute('d') || ''); return { paths: points.length, marker: points.some(d => /^M[\\d.]+,[\\d.]+ V/.test(d)) }; })()`);
  t.expect(tuning.trend && peaks.marker && /패러데이/.test(tuning.note), 'the monitor plots the scan with a mark where the magnet stands', JSON.stringify(peaks));
  const field = await lab.at(L.dials.field);
  await b.drag(line(field, { x: field.x + 294, y: field.y }, 14)); await sleep(900);
  for (let i = 0; i < 6; i++) {                                                                // the last touch: a notch either way while the current rises
    const here = (await state()).current;
    await b.wheel(field, -100); await sleep(500); if ((await state()).current > here * 1.001) continue;
    await b.wheel(field, 100); await sleep(150); await b.wheel(field, 100); await sleep(500); if ((await state()).current > here * 1.001) continue;
    await b.wheel(field, -100); await sleep(500); break;
  }
  s = await state();
  t.expect(s.current > 0.9e-3 && Math.abs(s.field - 0.347) < 0.0008, 'the magnet dial dragged onto the tallest peak near 31 gives a beam of about 1 mA: P+', JSON.stringify({ field: s.field, current: s.current }));

  // energy by dragging its dial, dose by the wheel; the wafer monitor shows the profile these dials would give
  const before = await lab.monitor(), energy = await lab.at(L.dials.energy), dose = await lab.at(L.dials.dose);
  await b.drag(line(energy, { x: energy.x - 80, y: energy.y }, 12)); await sleep(300);
  for (let i = 0; i < 10; i++) { await b.wheel(dose, -100); await sleep(50); }
  await sleep(1300);
  s = await state(); const tuned = await lab.monitor();
  t.expect(s.energy === 60 && s.dose === 15, 'the energy dial is dragged and the dose dial is turned with the wheel', JSON.stringify(s));
  t.expect(tuned.trend && /계산값/.test(tuned.note) && tuned.value < before.value - 20, 'the wafer monitor shows the doping profile for the dials as they are: a lower energy gives a shallower junction', `${before.value} -> ${tuned.value} nm`);

  await press('implant');
  t.expect(await reached(b, `${S}.beam && ${S}.counted > 1e14`, 30000), 'the implant button stands the wafer in the beam and the dose is counted up');
  await sleep(1500); await t.shot('2-implanting');
  t.expect(await lab.fast(`${S}.phase === 'implanted'`, 240), 'the beam stops when the dose on the dial has been counted');
  s = await state(); t.expect(Math.abs(s.counted - 1e15) < 1e9 && !s.beam, 'the wafer holds the dose that was set', `${s.counted}`);
  await press('implant'); await sleep(500);
  t.expect((await state()).phase === 'implanted' && /되돌릴 수 없/.test(await lab.guide()), 'a second implant is refused: implantation cannot be undone', await lab.guide());

  // a short anneal leaves the junction too shallow; a second anneal adds to it
  const temperature = await lab.at(L.dials.temperature), minutes = await lab.at(L.dials.minutes);
  await b.drag(line(temperature, { x: temperature.x + 50, y: temperature.y }, 12)); await sleep(300);
  s = await state(); t.expect(s.temperature === 950 && s.minutes === 10, 'the anneal temperature is set on its dial', JSON.stringify(s));
  await press('anneal');
  t.expect(await reached(b, `${S}.hot === 950`, 30000), 'the anneal button moves the wafer under the lamps and heats it');
  await sleep(1500); await t.shot('3-annealing');
  t.expect(await lab.fast(`${S}.phase === 'done'`, 1200), 'the anneal ends after the time on the dial and the junction is measured');
  s = await state(); const first = s.result, offered = await lab.guide();
  t.expect(first && !first.ok && first.junction < 250 && /더 할 수 있/.test(offered), 'ten minutes leave the junction too shallow, and the page says the anneal can be repeated', `${JSON.stringify(first)} | ${offered}`);
  await b.drag(line(minutes, { x: minutes.x + 50, y: minutes.y }, 12)); await sleep(300);
  s = await state(); t.expect(s.minutes === 20, 'the anneal time is set on its dial', `${s.minutes} min`);
  await press('anneal');
  t.expect(await lab.fast(`${S}.phase === 'done' && ${S}.anneals.length === 2`, 1200), 'a second anneal runs on the same wafer');
  s = await state(); const shown = await lab.monitor();
  t.expect(s.result && s.result.ok && s.result.junction > first.junction + 30 && s.result.surface >= 1e19 && /계측값/.test(shown.note) && Math.abs(shown.value - s.result.junction) < 1, 'the two anneals add up: the junction is deeper, inside the target, and the surface is doped enough', JSON.stringify(s.result));
  t.expect(Math.abs(s.result.junction - tuned.value) > 20, 'the first outlook was for the dials as they stood then (ten minutes at 900 C), not for what was done', `outlook ${tuned.value}, measured ${s.result.junction.toFixed(0)} nm`);
  await t.shot('3-measured');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 5 && next.record.by === 'operator' && next.record.ok && next.wafer.junction && Math.abs(next.wafer.junction.depth - s.result.junction) < 1e-9 && !next.wafer.junction.everywhere && next.wafer.liner === 30, 'the junction goes on to the next process on the same wafer, with the barrier film on it', JSON.stringify(next.record));
}

async function processPlating(t) {
  const { b, lab } = await openProcess(t, 'metal'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ head: s.head, target: s.controls.head, current: s.controls.current, rotation: s.controls.rotation, immersed: s.immersed, plating: s.plating, over: s.over, thickness: s.thickness, burnt: s.burnt, wet: s.wet, result: s.result && { thickness: s.result.thickness, sheet: s.result.sheet, ok: s.result.ok, burnt: s.result.burnt } })`);
  await lab.cards();
  let s = await state();
  t.expect(s.head === 0 && s.thickness === 0 && s.current === 0 && s.rotation === 30, 'the cell starts with the wafer face up on the raised head and no current', JSON.stringify(s));
  const current = await lab.at(L.dials.current), rotation = await lab.at(L.dials.rotation);
  await b.drag(line(current, { x: current.x + 200, y: current.y }, 12)); await sleep(1200);
  s = await state(); t.expect(s.current === 20 && !s.plating && s.thickness === 0, 'with the wafer out of the bath the current has nowhere to flow', JSON.stringify(s));

  const up = await lab.at(L.grip.up);
  await b.drag(line(up, { x: up.x, y: up.y + 220 }, 12)); await sleep(500);
  s = await state(); t.expect(s.target === 1, 'pulling the head down turns the wafer over and sends it into the bath', `target ${s.target}`);
  t.expect(await lab.fast(`${S}.plating && ${S}.thickness > 40`, 16, 60000), 'once the wafer is in the bath the copper starts to grow');
  const down = await lab.at(L.grip.down);
  await b.drag(line(down, { x: down.x, y: down.y - 200 }, 10)); await sleep(1200);
  s = await state(); const locked = await lab.guide();
  t.expect(s.head === 1 && s.target === 1 && /전류가 흐르는/.test(locked), 'the head does not rise while current flows, and the page says why', `head ${s.head}, guide: ${locked}`);

  // more current than the bath can carry at this rotation, briefly; then more rotation lifts the limit
  await b.evaluate(`${PL}.setSpeed(1)`);
  await b.drag(line(current, { x: current.x + 100, y: current.y }, 10)); await sleep(1500);
  s = await state(); const warned = await lab.guide();
  t.expect(s.current === 30 && s.over && /한계/.test(warned), 'at 30 A and 30 rpm the current is above the bath\'s limit and the page warns', `${JSON.stringify({ current: s.current, over: s.over })} | ${warned}`);
  await t.shot('1-over-limit');
  for (let i = 0; i < 6; i++) { await b.wheel(rotation, -100); await sleep(50); }
  await sleep(1200);
  s = await state(); t.expect(s.rotation === 60 && !s.over && s.plating, 'turning the wafer faster raises the limit above the current', JSON.stringify({ rotation: s.rotation, over: s.over }));
  await b.evaluate(`${PL}.setSpeed(4)`);
  t.expect(await reached(b, `${S}.thickness > 760`, 240000), 'the film grows toward the thickness the run sheet asks for');
  const growing = await lab.monitor();
  await b.drag(line(current, { x: current.x - 340, y: current.y }, 10)); await sleep(900);
  s = await state(); const stopped = s.thickness;
  t.expect(s.current === 0 && !s.plating && growing.trend && /계산값/.test(growing.note), 'turning the current down to zero stops the plating', JSON.stringify({ current: s.current, thickness: stopped, growing }));
  await t.shot('2-plated');

  await b.drag(line(down, { x: down.x, y: down.y - 200 }, 10)); await sleep(500);
  t.expect(await lab.fast(`${PL}.sim.canMeasure()`, 16, 120000), 'with the current off the head comes up, and the wafer is rinsed and spun dry');
  await sleep(700);
  const landed = await clickOn(b, '#guide-action', 900);
  s = await state(); const shown = await lab.monitor();
  t.expect(landed && s.result && s.result.ok && !s.result.burnt && Math.abs(s.result.thickness - stopped) < 1e-6 && Math.abs(s.result.sheet - 1.68e-6 / (stopped * 1e-7) * 1000) < 1e-6 && /계측값/.test(shown.note), 'the sheet resistance gives the thickness, and it meets the run sheet', JSON.stringify(s.result));
  await t.shot('3-measured');
  const handed = await clickOn(b, '#guide-action', 2500);
  const polisher = await reached(b, `${PL}.stage === 1 && ${PL}.station.scene === 'cmp' && document.getElementById('stage').dataset.view === 'cmp'`, 30000);
  const carried = await b.evaluate(`({ viewing: ${PL}.viewing, at: ${PL}.run.at, thickness: ${PL}.sim.incoming.thickness, step: document.getElementById('guide-step').textContent })`);
  t.expect(handed && polisher && carried.viewing === 5 && carried.at === 5 && Math.abs(carried.thickness - stopped) < 1e-6 && /평탄화/.test(carried.step), 'the plated wafer goes on to the polisher, the second piece of equipment of the same process', JSON.stringify(carried));
}

/** The second piece of equipment of metallization: the polisher of the CMP lab, on the wafer the plating cell made. */
async function processCmp(t) {
  const { b, lab } = await openProcess(t, 'metal'), S = lab.S, K = `${PL}.sim.stack`;
  const set = pairs => b.evaluate(`(() => { const d = ${PL}; return ${JSON.stringify(pairs)}.map(([name, value]) => d.station.control(d.sim, name, value)); })()`);
  const until = (expression, speed, ms = 120000) => b.evaluate(`${PL}.setSpeed(${speed})`).then(() => reached(b, expression, ms));
  // the plating cell has its own check: here it is run by its controls to get to the polisher
  await set([['head', 1]]); await until(`${S}.immersed`, 16);
  await set([['rotation', 60], ['current', 20]]); await until(`${S}.thickness > 775`, 16);
  await set([['current', 0]]); await sleep(500); await set([['head', 0]]); await until(`${PL}.sim.canMeasure()`, 16); await b.evaluate(`${PL}.sim.measure()`);
  const plated = await b.evaluate(`${S}.result.thickness`);
  await sleep(700); let landed = await clickOn(b, '#guide-action', 2500);
  t.expect(landed && await reached(b, `${PL}.stage === 1 && ${PL}.station.scene === 'cmp' && Object.keys(${PL}.scene.parts).length === 14`, 30000), 'after the plating the polisher of the CMP lab opens, with its fourteen parts');
  await sleep(3500);
  const state = () => b.evaluate(`(() => { const s = ${S}, k = ${K}; return { where: s.wafer.where, gap: s.gap, contact: s.contact, pressure: s.pressure, polishing: s.polishing, platen: s.platenRpm, covered: k.covered, mean: k.mean, centre: k.centre, edge: k.edge, alarms: Object.keys(s.alarms), result: k.result && { cleared: k.result.cleared, ok: k.result.ok, residue: k.result.residue, dishing: k.result.dishingMax, scratches: k.result.scratches.length } }; })()`);
  await lab.cards(['pedestal']);                                                                 // the wafer lies on the load position for now
  let s = await state();
  t.expect(s.where === 'pedestal' && Math.abs(s.mean - plated) < 1e-6 && s.covered === 1, 'the wafer waits on the load position with the copper the plating cell put on it', JSON.stringify(s));
  await t.shot('1-polisher');

  landed = await clickOn(b, '#guide-action', 1500); s = await state();
  t.expect(landed && s.where === 'head', 'the guide\'s button puts the wafer on the head', s.where);
  await sleep(1200); const bare = await lab.hover('pedestal');
  t.expect(bare.under === 'pedestal' && bare.shown === '로드 위치', 'with the wafer gone, the load position shows its own card', JSON.stringify(bare));
  // platen, spindle, slurry and conditioner are set by their controls here; dragging them is what the CMP lab's own check does on this same machine
  await set([['platen', 90], ['carrier', 87], ['slurry', 200], ['conditioner', true]]); await until(`${S}.coverage > 0.3 && ${S}.platenRpm > 85`, 4);
  const head = await lab.part('head');
  await b.drag(line(head, { x: head.x, y: head.y + 110 }, 14)); await sleep(1500);
  s = await state(); const pill = await lab.guide();
  t.expect(s.contact && s.pressure > 0.5, 'pulling the head down presses the wafer on the pad', JSON.stringify({ contact: s.contact, pressure: s.pressure }));
  await set([['head', 1 + 3 / 7]]);
  t.expect(await until(`${S}.polishing && ${K}.mean < ${plated} - 60`, 16), 'the copper starts to come off');
  await b.evaluate(`${PL}.setSpeed(1)`); await sleep(600);
  const again = await b.evaluate(`(() => { const e = document.getElementById('redo-piece'); return { shown: !e.hidden && e.getClientRects().length > 0, text: e.textContent }; })()`);
  landed = await clickOn(b, '#redo-piece', 2500); await sleep(1500); s = await state();
  const back = await b.evaluate(`({ stage: ${PL}.stage, scene: ${PL}.station.scene, at: ${PL}.run.at, records: ${PL}.run.records.length })`);
  t.expect(again.shown && again.text === '평탄화만 다시' && landed && back.stage === 1 && back.scene === 'cmp' && back.at === 5 && s.where === 'pedestal' && s.covered === 1 && Math.abs(s.mean - plated) < 1e-6 && !s.contact, 'the polish alone can be started again: the plated wafer is back on the load position, the plating is kept', JSON.stringify({ again, back, where: s.where, mean: s.mean }));
  await b.evaluate(`${PL}.sim.moveWafer('head')`); await set([['platen', 90], ['carrier', 87], ['slurry', 200], ['conditioner', true]]); await until(`${S}.coverage > 0.3 && ${S}.platenRpm > 85`, 4);
  await set([['head', 1 + 3 / 7]]); await until(`${S}.polishing && ${K}.mean < ${plated} - 60`, 16);
  await b.evaluate(`${PL}.setSpeed(2)`); await sleep(900); const during = await lab.monitor();
  t.expect(during.trend && /장비 계측/.test(during.note) && during.value < plated, 'the monitor follows the copper that is left', JSON.stringify(during));
  t.expect(await until(`${K}.covered < 1`, 30), 'the copper clears somewhere first');
  await b.evaluate(`${PL}.setSpeed(2)`); await sleep(400); await b.evaluate(`${PL}.scene.setView('top', true)`); await sleep(1800);
  s = await state();
  t.expect(s.covered > 0 && s.covered < 1 && Math.abs(s.centre - s.edge) > 5, 'it does not clear everywhere at once: centre and edge differ', JSON.stringify({ covered: s.covered, centre: s.centre, edge: s.edge }));
  const ahead = await b.evaluate(`(() => { const d = ${PL}, map = d.station.forecast(d.sim).tested; return map ? null : d.flow.apply('eds', d.station.forecast(d.sim)).wafer.tested.dies.filter(die => die.bin === 'residue').length; })()`);
  t.expect(ahead > 0, 'stopped now, the chips still under copper would fail at EDS as joined', `${ahead} chips`);
  await t.shot('2-clearing'); await b.evaluate(`${PL}.scene.setView('home', true)`); await sleep(1500);
  t.expect(await until(`${K}.covered === 0`, 16), 'polishing on clears the rest');
  const up = await lab.part('head');
  await b.drag(line(up, { x: up.x, y: up.y - 240 }, 14)); await sleep(500);
  t.expect(await until(`${S}.gap >= 0.117`, 8, 60000), 'pulling the head up stops the polish and lifts the wafer');
  landed = await clickOn(b, '#guide-action', 1500);
  t.expect(landed && await until(`!!${K}.result`, 4, 60000), 'on the thickness stage the wafer is scanned');
  await sleep(900); s = await state(); const shown = await lab.monitor();
  t.expect(s.where === 'stage' && s.result && s.result.cleared && s.result.ok && s.result.dishing > 0 && s.result.dishing <= 50 && s.result.scratches === 0 && /계측값/.test(shown.note), 'no copper is left over the oxide, the dishing is within the run sheet and there is no scratch', JSON.stringify(s.result));
  await t.shot('3-scanned');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 6 && next.record.by === 'operator' && next.record.ok && next.wafer.metal && next.wafer.metal.chips.length === 148 && next.wafer.metal.planar && Math.abs(next.wafer.metal.thickness - plated) < 1e-6 && /연마/.test(next.record.text), 'plating and polish go on as one record to the next process, chip by chip', JSON.stringify(next.record));
}

async function processEds(t) {
  const { b, lab } = await openProcess(t, 'eds'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ phase: s.phase, x: s.controls.x, y: s.controls.y, z: s.controls.z, offset: s.offset, contact: s.contact, tested: s.tested, good: s.good, passes: s.passes, queue: s.queue.length, result: s.result && { good: s.result.good, missed: s.result.missed, bins: s.result.bins } })`);
  const press = async name => b.click(await lab.at(L.buttons[name]), 450);
  const clean = await b.evaluate(`${PL}.flow.defects(${PL}.run.wafer.lot).filter(hit => !hit).length`), total = await b.evaluate(`${PL}.flow.DIE_COUNT`);
  await lab.cards();
  let s = await state(), shown = await lab.monitor();
  t.expect(s.phase === 'setup' && s.tested === 0 && s.z === 20 && /카메라/.test(shown.note) && Math.abs(shown.value - Math.hypot(s.offset.x, s.offset.y)) < 1, 'the prober starts with the needles off the pad centres, as the camera shows', JSON.stringify({ offset: s.offset, shown }));
  await press('contact'); await sleep(900);
  s = await state(); t.expect(s.contact && !s.contact.touching && /닿지 않/.test(await lab.guide()), 'a contact check with the dials untouched finds the needles off the pads', await lab.guide());

  // first pass as it stands: every chip reads open
  await press('probe');
  t.expect(await reached(b, `${S}.phase === 'probing' && ${S}.tested > 3`, 30000), 'the probe button steps the chuck from chip to chip');
  await sleep(600); await t.shot('1-probing');
  t.expect(await lab.fast(`${S}.phase === 'done'`, 240), 'the prober goes through the whole wafer');
  s = await state(); let said = await lab.guide();
  t.expect(s.result && s.result.good === 0 && s.result.bins.contact === total && s.result.missed === clean && /접촉 불량이 많/.test(said), 'misaligned, every chip is binned as a contact failure, and the page points at the contact', `${JSON.stringify(s.result)} | ${said}`);

  // align by the camera, raise the overdrive, check the contact, test the failed chips again
  const x = await lab.at(L.dials.x), y = await lab.at(L.dials.y), z = await lab.at(L.dials.z);
  await b.drag(line(x, { x: x.x - 4 * s.offset.x, y: x.y }, 12)); await sleep(300);
  await b.drag(line(y, { x: y.x - 4 * s.offset.y, y: y.y }, 12)); await sleep(1300);
  s = await state(); shown = await lab.monitor();
  t.expect(s.x === -s.offset.x && s.y === -s.offset.y && shown.value < 1.5 && /카메라/.test(shown.note), 'dragging the X and Y dials brings the needles onto the pad centres in the camera view', JSON.stringify({ x: s.x, y: s.y, offset: s.offset, shown }));
  await press('contact'); await sleep(900);
  s = await state(); said = await lab.guide();
  t.expect(s.contact && s.contact.touching && s.contact.resistance > 10 && /오버드라이브/.test(said), 'now the needles touch, but with too much resistance, and the page points at the overdrive', `${JSON.stringify(s.contact)} | ${said}`);
  for (let i = 0; i < 6; i++) { await b.wheel(z, -100); await sleep(50); }
  await sleep(400); await press('contact'); await sleep(900);
  s = await state(); t.expect(s.z === 50 && s.contact && s.contact.touching && s.contact.resistance < 1, 'with more overdrive the contact check reads under an ohm', JSON.stringify({ z: s.z, contact: s.contact }));
  await t.shot('2-aligned');
  await press('probe');
  t.expect(await reached(b, `${S}.phase === 'probing' && ${S}.passes === 2`, 30000) && await lab.fast(`${S}.phase === 'done'`, 240), 'the failed chips are tested again');
  await sleep(900); s = await state(); shown = await lab.monitor();
  t.expect(s.result && s.result.good === clean && s.result.missed === 0 && s.result.bins.contact === 0 && s.result.bins.leak === total - clean, 'the second pass finds every good chip; the chips with a defect leak', JSON.stringify(s.result));
  t.expect(Math.abs(shown.value - clean / total * 100) < 1 && /계측값/.test(shown.note) && shown.trend && await b.evaluate(`document.querySelectorAll('#mon-section svg rect').length === ${total}`), 'the wafer monitor shows the map and the yield', JSON.stringify(shown));
  await t.shot('3-map');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 7 && next.record.by === 'operator' && next.record.ok && next.wafer.tested.good === clean && next.wafer.tested.dies.length === total, 'the map goes on to packaging: only the good chips will be packaged', JSON.stringify(next.record));
}

async function processBond(t) {
  const { b, lab } = await openProcess(t, 'package'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ phase: s.phase, power: s.controls.power, force: s.controls.force, time: s.controls.time, wire: s.wire && { diameter: s.wire.diameter, pulled: s.wire.pulled }, onChip: s.onChip, tests: s.tests, at: s.at, passed: s.passed, result: s.result && { chips: s.result.chips, bonded: s.result.bonded, lost: s.result.lost } })`);
  const press = async name => b.click(await lab.at(L.buttons[name]), 450);
  const good = await b.evaluate(`${PL}.run.wafer.tested.good`);
  await lab.cards();
  let s = await state();
  t.expect(s.phase === 'setup' && !s.wire && s.tests.length === 0 && good > 100, 'the bonder starts with a failed chip under the tool and no wire on it', JSON.stringify(s));
  await press('pull'); await sleep(500);
  t.expect(/먼저 본드/.test(await lab.guide()), 'a pull test is refused before there is a wire, and the page says why', await lab.guide());

  // a test wire with the dials as they stand: it comes off
  await press('bond');
  t.expect(await reached(b, `${S}.phase === 'bonding'`, 20000), 'the bond button starts a test wire');
  await b.evaluate(`${PL}.scene.setView('work')`); await sleep(2500); await t.shot('1-test-bond');
  await b.evaluate(`${PL}.scene.setView('home', true)`); await sleep(1500);                              // the buttons are out of sight in the close view
  t.expect(await lab.fast(`${S}.phase === 'setup' && !!${S}.wire`, 16, 90000), 'the wire is bonded from the pad to the lead');
  await press('pull');
  t.expect(await lab.fast(`${S}.tests.length === 1`, 16, 90000), 'the pull button pulls it until it gives');
  await sleep(600); s = await state(); let shown = await lab.monitor(), said = await lab.guide();
  t.expect(!s.tests[0].ok && s.tests[0].force < 3 && Math.abs(shown.value - s.tests[0].force) < 0.06 && /계측값/.test(shown.note) && /덜 됐/.test(said), 'with the dials untouched the wire comes off below the minimum, and the monitor shows where it gave', `${JSON.stringify(s.tests[0])} | ${said}`);

  // more power by dragging, more force by dragging, more time with the wheel
  const power = await lab.at(L.dials.power), force = await lab.at(L.dials.force), time = await lab.at(L.dials.time);
  await b.drag(line(power, { x: power.x + 100, y: power.y }, 12)); await sleep(300);
  await b.drag(line(force, { x: force.x + 50, y: force.y }, 12)); await sleep(300);
  for (let i = 0; i < 5; i++) { await b.wheel(time, -100); await sleep(50); }
  await sleep(400); s = await state();
  t.expect(s.power === 80 && s.force === 30 && s.time === 15, 'the three dials are set by dragging and with the wheel', JSON.stringify({ power: s.power, force: s.force, time: s.time }));
  await press('bond'); await lab.fast(`${S}.phase === 'setup' && ${S}.onChip === 2`, 16, 90000);
  await press('pull'); await lab.fast(`${S}.tests.length === 2`, 16, 90000);
  await sleep(600); s = await state(); said = await lab.guide(); shown = await lab.monitor();
  t.expect(s.tests[1].ok && s.tests[1].mode === 'neck' && s.tests[1].force > 5 && s.wire.diameter < 60 && shown.trend && /가동/.test(said), 'now the wire itself breaks before the bonds give, and the page offers the run', `${JSON.stringify(s.tests[1])} | ${said}`);
  await t.shot('2-pull-test');

  await press('run');
  t.expect(await reached(b, `${S}.phase === 'running' && ${S}.at >= 1`, 60000), 'the run button wires the good chips one after another');
  await press('bond'); await sleep(500);
  t.expect((await state()).phase === 'running' && /가동 중/.test(await lab.guide()), 'no test wire during the run', await lab.guide());
  t.expect(await lab.fast(`${S}.phase === 'done'`, 240), 'the bonder goes through every good chip');
  await sleep(900); s = await state();
  t.expect(s.result && s.result.bonded === good && s.result.chips === good && s.result.lost === 0, 'with a wire that holds, every good chip is finished', JSON.stringify(s.result));
  await t.shot('3-done');
  const next = await lab.handOver();
  const sheet = await b.evaluate(`({ finished: ${PL}.run.finished, sheet: !!document.querySelector('.sheet'), title: document.querySelector('.bench h2').textContent, operated: document.querySelectorAll('.sheet tbody tr:not([data-before="true"])').length })`);
  t.expect(next.landed && next.record.by === 'operator' && next.record.ok && next.wafer.packaged.chips === good && sheet.finished && sheet.sheet && sheet.title.includes(String(good)) && sheet.operated === 1, 'the last process ends the run: the sheet shows the chips made', `${JSON.stringify(next.record)} | ${JSON.stringify(sheet)}`);
}

/**
 * One wafer through all eight pieces of equipment, from the crystal to the packaged chips. The controls are set through
 * each station's own control function (the same refusals apply), not with the mouse: each equipment's own check does
 * that. This one is about the hand-overs: every equipment opens on the wafer the one before it made.
 */
async function processAll(t) {
  const b = await t.open({ width: 1600, height: 1000 }), S = `${PL}.sim.state`;
  await b.goto(`${fileUrl(dist, 'process-lab.html')}?seed=5&start=wafer`);
  if (!(await reached(b, `!!${PL} && ${PL}.mode === 'station' && !!${PL}.sim`, 30000))) throw new Error('the first equipment did not open');
  await sleep(2500);
  const set = pairs => b.evaluate(`(() => { const d = ${PL}; return ${JSON.stringify(pairs)}.map(([name, value]) => d.station.control(d.sim, name, value)); })()`);
  const until = (expression, speed, ms = 180000) => b.evaluate(`${PL}.setSpeed(${speed})`).then(() => reached(b, expression, ms));
  const handOver = async (index, equipment) => {
    const done = await b.evaluate(`(() => { const d = ${PL}; if (!d.station.result(d.sim)) return null; d.finishStation(); return d.run.records.at(-1); })()`);
    const opened = equipment ? await reached(b, `${PL}.mode === 'station' && ${PL}.station.equipment === '${equipment}' && ${PL}.viewing === ${index + 1} && Object.keys(${PL}.scene.parts).length > 5`, 30000) : await reached(b, `${PL}.run.finished && !!document.querySelector('.sheet')`, 30000);
    await sleep(1800);
    return { done, opened };
  };
  const steps = [];
  const passed = (name, step) => { steps.push(step.done); t.expect(step.done && step.done.by === 'operator' && step.done.ok && step.opened, name, JSON.stringify(step.done)); };

  await set([['dopant', 2.9], ['seed', 1]]); await until(`${S}.attached`, 300);
  await set([['speed', 9]]); await until(`${S}.necked`, 600);
  await set([['speed', 1]]); await until(`2 * ${S}.radius > 292`, 3000);
  await set([['auto', true]]); await until(`${S}.body.length >= 105`, 3000);
  await set([['seed', 0]]); await until(`${PL}.sim.canMeasure()`, 300); await b.evaluate(`${PL}.sim.measure()`);
  passed('1 wafer: a crystal with a neck and a body in range gives the wafer, and the furnace opens on it', await handOver(0, 'oxidation'));

  await set([['boat', 1]]); await until(`${S}.sealed`, 1200);
  await set([['setpoint', 1000], ['h2o', true], ['n2', false]]); await until(`${S}.oxide > 494`, 600);
  await set([['h2o', false], ['n2', true], ['setpoint', 600]]); await until(`${S}.tube <= 800`, 1200);
  await set([['boat', 0]]); await until(`${PL}.sim.canMeasure()`, 1200); await b.evaluate(`${PL}.sim.measure()`);
  passed('2 oxidation: the oxide is grown on that wafer, and the photo cell opens on it', await handOver(1, 'photo'));

  await set([['coat', true]]); await until(`${S}.phase === 'coated'`, 96);
  await b.evaluate(`(() => { const d = ${PL}; d.station.control(d.sim, 'dose', 240); d.station.control(d.sim, 'focus', d.sim.state.bestFocus); d.station.control(d.sim, 'expose', true); })()`);
  await until(`${S}.phase === 'exposed'`, 96); await set([['develop', true]]); await until(`${S}.phase === 'developed'`, 96);
  passed('3 photo: the pattern is printed, and the etch chamber opens on it', await handOver(2, 'etch'));

  await set([['chf3', true], ['power', 300], ['pressure', 10], ['load', true]]); await until(`${S}.floor <= 0 && ${S}.siliconLoss > 1`, 240);
  await set([['power', 0]]); await sleep(600); await set([['load', false]]); await until(`!!${S}.result && ${S}.inside <= 0`, 30);
  passed('4 etch: the windows are opened, and the implanter opens on them', await handOver(3, 'implant'));

  await set([['field', 0.347], ['energy', 60], ['dose', 15], ['implant', true]]); await until(`${S}.phase === 'implanted'`, 600);          // the analyser onto the P+ peak first
  await set([['temperature', 950], ['minutes', 30], ['anneal', true]]); await until(`${S}.phase === 'done'`, 3000);
  passed('5 implantation: the junction is made in the windows, and the plating cell opens on it', await handOver(4, 'plating'));

  await set([['head', 1]]); await until(`${S}.immersed`, 16);
  await set([['rotation', 60], ['current', 20]]); await until(`${S}.thickness > 775`, 16);
  await set([['current', 0]]); await sleep(500); await set([['head', 0]]); await until(`${PL}.sim.canMeasure()`, 16); await b.evaluate(`${PL}.sim.measure()`);
  await b.evaluate(`${PL}.finishStation()`);
  t.expect(await reached(b, `${PL}.stage === 1 && ${PL}.station.scene === 'cmp' && ${PL}.viewing === 5`, 30000), '6 metallization: the copper is plated, and the polisher of the CMP lab opens on it');
  await sleep(2500);
  await b.evaluate(`(() => { const d = ${PL}; d.sim.moveWafer('head'); for (const [name, value] of [['platen', 90], ['carrier', 87], ['slurry', 200], ['conditioner', true]]) d.station.control(d.sim, name, value); })()`);
  await until(`${S}.coverage > 0.3 && ${S}.platenRpm > 85`, 4); await set([['head', 1 + 3 / 7]]); await until(`${PL}.sim.stack.covered === 0`, 8);
  await set([['head', 0]]); await until(`${S}.gap >= 0.117`, 8); await b.evaluate(`${PL}.sim.moveWafer('stage')`); await until(`!!${PL}.sim.stack.result`, 4);
  passed('6 metallization: the copper is polished back to the oxide, and the prober opens on that wafer', await handOver(5, 'prober'));

  await b.evaluate(`(() => { const d = ${PL}, o = d.sim.state.offset; for (const [name, value] of [['x', -o.x], ['y', -o.y], ['z', 50], ['contact', true], ['probe', true]]) d.station.control(d.sim, name, value); })()`);
  await until(`${S}.phase === 'done'`, 240);
  const map = await b.evaluate(`({ good: ${S}.result.good, missed: ${S}.result.missed, clean: ${PL}.flow.defects(${PL}.run.wafer.lot).filter(hit => !hit).length })`);
  passed('7 EDS: every chip is tested, and the bonder opens on the good ones', await handOver(6, 'bonder'));
  t.expect(map.good === map.clean && map.missed === 0, 'on a wafer made within every run sheet, the chips that fail are the ones with a defect', JSON.stringify(map));

  await set([['power', 80], ['force', 30], ['time', 15], ['run', true]]); await until(`${S}.phase === 'done'`, 240);
  passed('8 packaging: the good chips are wired, and the run ends with its sheet', await handOver(7, null));
  const sheet = await b.evaluate(`({ rows: [...document.querySelectorAll('.sheet tbody tr')].map(row => ({ who: row.querySelector('.who').textContent, state: row.querySelector('.state').textContent })), chips: ${PL}.run.wafer.packaged.chips, title: document.querySelector('.bench h2').textContent, substrate: ${PL}.run.wafer.substrate.resistivity })`);
  t.expect(sheet.rows.length === 8 && sheet.rows.every(row => row.who === '직접 조작' && /통과/.test(row.state)) && sheet.chips === map.good && sheet.title.includes(String(sheet.chips)) && Math.abs(sheet.substrate - 10) < 1, 'the sheet lists eight processes, all operated by hand and all passed, and the chips made from the crystal that was grown', JSON.stringify(sheet));
  await t.shot('1-run-sheet');
}

// ----- single-file build -----
function newerThan(file, folder) {                                                             // files under folder changed after file was written
  const built = statSync(file).mtimeMs, newer = [];
  for (const entry of readdirSync(folder, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const at = path.join(entry.parentPath ?? entry.path, entry.name);
    if (statSync(at).mtimeMs > built) newer.push(path.relative(folder, at));
  }
  return newer;
}

async function standalone(t) {
  const file = standaloneFile;
  const stale = newerThan(file, dist);
  if (stale.length) t.note(`dist/ has ${stale.length} file(s) changed after this file was built (for example ${stale[0]}): rebuild before handing it out`);
  const b = await t.open({ width: 1600, height: 1000 });
  await b.offline();                                                                           // the file has to work with the network cut off
  const F = `document.querySelector('iframe').contentWindow`, D = `${F}.Lab3DDebug`;
  const loaded = `!!document.querySelector('iframe') && ${F}.document.readyState === 'complete'`;
  const visible = selector => b.evaluate(`[...${F}.document.querySelectorAll(${JSON.stringify(selector)})].filter(e => e.getClientRects().length && ${F}.getComputedStyle(e).visibility !== 'hidden').map(e => e.getAttribute('href') || '#' + (e.dataset.page || ''))`);
  const parkedShown = () => b.evaluate(`[...${F}.document.querySelectorAll('[data-parked]')].some(e => e.getClientRects().length > 0)`);
  t.note(`${b.product}, network cut off, file of ${(statSync(file).size / 1048576).toFixed(1)} MB`);

  await b.goto(`${pathToFileURL(file).href}#index`);
  await b.until(loaded, 90000); await sleep(2500);
  const pages = await b.evaluate(`Object.keys(JSON.parse(document.getElementById('cmp-pages').textContent))`);
  t.expect(String(pages) === 'index,game,lab-3d,process-lab', 'the file holds the home page, the game, the learning lab and the 8-process lab', pages.join(' '));
  t.expect(!(await b.evaluate(`!!document.getElementById('cmp-data:lab-sim-replay')`)), 'no PHM replay data is embedded (a file built with --all holds it and must not be handed out)');
  const entries = await visible('#page-home a, #page-home button');
  t.expect(String(entries.filter(leavesHome).sort()) === './game.html,./lab-3d.html,./process-lab.html' && !(await parkedShown()), 'the home page offers the game, the learning lab and the 8-process lab only', entries.join(' '));
  t.expect(await b.evaluate(`[...${F}.document.querySelectorAll('.door-art img')].every(i => i.complete && i.naturalWidth > 0)`), 'the home pictures are inside the file');
  await t.shot('1-home');

  await b.evaluate(`${F}.document.querySelector('a.door-lab').click()`);
  const labOpen = await reached(b, `location.hash === '#lab-3d' && !!(${D} && ${D}.scene)`, 90000);
  t.expect(labOpen, 'the learning-lab picture opens the 3D tool inside the file');
  if (labOpen) {
    await sleep(3000);
    await b.evaluate(`(() => { const d = ${D}; d.setSpeed(16); for (const [name, value] of [['platen', 90], ['carrier', 87], ['slurry', 200], ['conditioner', true]]) d.sim.setControl(name, value); })()`); await sleep(1500);
    await b.evaluate(`${D}.onWafer('head')`); await sleep(900);
    await b.evaluate(`${D}.sim.setControl('head', 1 + 3 / 7)`); await sleep(3000);
    const rate = await b.evaluate(`${D}.sim.state.rate`);
    t.expect(rate > 0 && await b.evaluate(`${D}.strip`), 'the 3D tool polishes and its instrument strip comes up', `rate ${rate}`);
    await t.shot('2-lab');
    await b.evaluate(`${F}.document.querySelector('a.back').click()`);
    t.expect(await reached(b, `location.hash === '#index' && ${loaded} && !!${F}.document.querySelector('.door-lab')`, 90000), 'the lab\'s home link goes back to the home page');
  }

  await b.viewport(420, 800); await sleep(900);
  const narrow = await visible('.mobile-nav a, .mobile-nav button, .sidebar nav .nav-item');
  t.expect(!narrow.length && !(await parkedShown()), 'in a narrow window the parked menus stay hidden too', narrow.join(' '));
  await b.viewport(1600, 1000); await sleep(600);

  await b.evaluate(`location.hash = '#game'`);
  const gameOpen = await reached(b, `location.hash === '#game' && ${loaded} && !!${F}.document.querySelector('.settings-actions')`, 120000);
  t.expect(gameOpen, 'the game opens inside the file');
  if (gameOpen) {
    await sleep(4000);
    t.expect(await b.evaluate(`(() => { const a = ${F}.document.querySelector('a[href="./index.html#intro"]'); return !a || ${F}.getComputedStyle(a).display === 'none'; })()`), 'the game\'s link to the parked 5-run challenge is hidden');
    await t.shot('3-game');
    await b.evaluate(`${F}.document.querySelector('.settings-actions a[href="./lab-3d.html"]').click()`);
    t.expect(await reached(b, `location.hash === '#lab-3d' && !!(${D} && ${D}.scene)`, 90000), 'the game\'s menu link opens the learning lab');
  }

  await b.evaluate(`location.hash = '#process-lab'`);
  const PL = `${F}.ProcessLabDebug`, processOpen = await reached(b, `location.hash === '#process-lab' && ${loaded} && !!${PL}`, 90000);
  t.expect(processOpen, 'the 8-process lab opens inside the file');
  if (processOpen) {
    await b.evaluate(`${PL}.start(1)`);
    t.expect(await reached(b, `${PL}.mode === 'station' && Object.keys(${PL}.scene.parts).length > 5`, 60000), 'its oxidation furnace starts inside the file');
    await sleep(2500); await t.shot('4-process-lab');
    // the polisher is drawn by the learning lab's 3D bundle, which this page takes from another folder: plate a wafer and see that it opens
    const PS = `${PL}.sim.state`, drive = pairs => b.evaluate(`(() => { const d = ${PL}; for (const [name, value] of ${JSON.stringify(pairs)}) d.station.control(d.sim, name, value); })()`);
    await b.evaluate(`${PL}.start(5)`); await reached(b, `${PL}.mode === 'station' && ${PL}.station.equipment === 'plating'`, 60000); await b.evaluate(`${PL}.setSpeed(16)`);
    await drive([['head', 1]]); await reached(b, `${PS}.immersed`, 60000);
    await drive([['rotation', 60], ['current', 20]]); await reached(b, `${PS}.thickness > 775`, 120000);
    await drive([['current', 0]]); await sleep(500); await drive([['head', 0]]); await reached(b, `${PL}.sim.canMeasure()`, 60000);
    await b.evaluate(`(() => { const d = ${PL}; d.sim.measure(); d.finishStation(); })()`);
    t.expect(await reached(b, `${PL}.stage === 1 && ${PL}.station.scene === 'cmp' && Object.keys(${PL}.scene.parts).length === 14`, 60000), 'after the plating, the polisher of the learning lab opens inside the file');
    await sleep(3000); await t.shot('5-process-lab-polisher');
  }

  await b.evaluate(`location.hash = '#lab-sim'`);
  t.expect(await reached(b, `${loaded} && !!${F}.document.querySelector('.door-lab')`, 60000), 'the address of a parked page that is not in the file falls back to the home page');
}

// ----- runner -----
const CHECKS = {
  home: { run: home, minutes: 4, about: 'dist/index.html, the mode selection' },
  'lab-hover': { run: labHover, minutes: 8, about: 'dist/lab-3d.html, a card for every part' },
  'lab-operate': { run: labOperate, minutes: 10, about: 'dist/lab-3d.html, one wafer polished and measured by dragging the parts' },
  'lab-panels': { run: labPanels, minutes: 12, about: 'dist/lab-3d.html, instrument strip, report and record over two wafers' },
  'process-route': { run: processRoute, minutes: 4, about: 'dist/process-lab.html, the route of eight processes: start anywhere, run to the sheet' },
  'process-flow': { run: processFlow, minutes: 6, about: 'dist/process-lab.html, with the equipment on: open at a click, the same process again, pass by the standard recipe, go back' },
  'process-crystal': { run: processCrystal, minutes: 10, about: 'dist/process-lab.html, the crystal puller: neck, shoulder, body under the diameter controller, measured' },
  'process-oxidation': { run: processOxidation, minutes: 10, about: 'dist/process-lab.html, the oxidation furnace operated to a measured film' },
  'process-photo': { run: processPhoto, minutes: 8, about: 'dist/process-lab.html, the coat, expose and develop cell with a rework' },
  'process-etch': { run: processEtch, minutes: 8, about: 'dist/process-lab.html, the etch chamber stopped at the endpoint' },
  'process-implant': { run: processImplant, minutes: 8, about: 'dist/process-lab.html, the implanter: one implant and two anneals to a measured junction' },
  'process-plating': { run: processPlating, minutes: 10, about: 'dist/process-lab.html, the copper plating cell: past the limit and back, stopped at the thickness' },
  'process-cmp': { run: processCmp, minutes: 10, about: 'dist/process-lab.html, the polisher of the CMP lab as the second equipment of metallization: clear the copper, scan' },
  'process-eds': { run: processEds, minutes: 10, about: 'dist/process-lab.html, the wafer prober: a misaligned pass, then aligned and retested to the wafer map' },
  'process-bond': { run: processBond, minutes: 10, about: 'dist/process-lab.html, the wire bonder: test wires pulled, then every good chip wired' },
  'process-all': { run: processAll, minutes: 10, about: 'dist/process-lab.html, one wafer through all eight pieces of equipment, by their controls' },
  standalone: { run: standalone, minutes: 10, about: 'the single-file build, opened with the network cut off' },
};

const wanted = []; let outDir = path.join(root, 'evidence/browser-check');
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--out') outDir = path.resolve(process.argv[++i] ?? '');
  else if (arg === '--file') standaloneFile = path.resolve(process.argv[++i] ?? '');
  else if (arg.startsWith('-')) { console.log(`Usage: node tools/check-browser.mjs [check ...] [--out folder] [--file single-file.html]\nchecks: ${Object.keys(CHECKS).join(', ')} (a prefix selects several; none runs them all)`); process.exit(arg === '--help' || arg === '-h' ? 0 : 2); }
  else wanted.push(arg);
}
const selected = Object.keys(CHECKS).filter(name => !wanted.length || wanted.some(w => name.startsWith(w)));
const unknown = wanted.filter(w => !Object.keys(CHECKS).some(name => name.startsWith(w)));
if (unknown.length) { console.error(`No check is called ${unknown.join(', ')}. Checks: ${Object.keys(CHECKS).join(', ')}`); process.exit(2); }

async function runCheck(name) {
  const check = CHECKS[name], started = Date.now();
  const t = { failures: 0, passes: 0, browser: null };
  t.expect = (ok, what, detail = '') => { ok ? t.passes++ : t.failures++; console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${what}${!ok && detail !== '' ? `\n        -> ${detail}` : ''}`); return Boolean(ok); };
  t.note = text => console.log(`        ${text}`);
  t.open = async options => (t.browser = await openBrowser(options));
  t.shot = (label, options) => t.browser.screenshot(path.join(outDir, `${name}-${label}.png`), options).catch(error => t.note(`no screenshot ${label}: ${error.message}`));
  console.log(`\n${name}: ${check.about}`);
  let timer;
  try {
    await Promise.race([check.run(t), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`it took longer than ${check.minutes} minutes`)), check.minutes * 60000); })]);
    const errors = t.browser.issues.filter(issue => issue.kind !== 'warning'), warnings = t.browser.issues.length - errors.length;
    t.expect(!errors.length, 'no script error and no failed load on the pages', errors.slice(0, 4).map(issue => `${issue.kind}: ${issue.text}`).join(' | '));
    if (warnings) t.note(`${warnings} console warning(s), first: ${t.browser.issues.find(issue => issue.kind === 'warning').text.slice(0, 160)}`);
    t.expect(!t.browser.requests.length, 'nothing was requested from the internet', [...new Set(t.browser.requests)].slice(0, 4).join(' '));
  } catch (error) {
    t.expect(false, 'the check ran to its end', error.message);
    const errors = (t.browser?.issues ?? []).filter(issue => issue.kind !== 'warning');
    if (errors.length) t.note(`page errors: ${errors.slice(0, 4).map(issue => issue.text).join(' | ')}`);
  } finally { clearTimeout(timer); await t.browser?.close(); }
  console.log(`  ${t.failures ? `${t.failures} failed, ` : ''}${t.passes} ok, ${Math.round((Date.now() - started) / 1000)} s`);
  return t.failures;
}

const summary = [];
for (const name of selected) {
  if (name === 'standalone' && !existsSync(standaloneFile)) {
    console.log(`\nstandalone: ${path.relative(root, standaloneFile)} is not there. Build it first: node tools/build-standalone.mjs`);
    summary.push([name, wanted.length ? 'FAILED: not built' : 'skipped: not built']);
    continue;
  }
  const failures = await runCheck(name);
  summary.push([name, failures ? `FAILED: ${failures}` : 'ok']);
}
console.log(`\n${summary.map(([name, result]) => `${name} ${result}`).join(' | ')}\nscreenshots: ${outDir}`);
process.exit(summary.some(([, result]) => result.startsWith('FAILED')) ? 1 : 0);
