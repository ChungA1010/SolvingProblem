// Browser checks of what a visitor can reach: the home page, the learning lab (the 3D tool) and the single-file build.
//
// Each check opens the page in a headless Chrome or Edge, uses it with real mouse and keyboard input and compares
// what the page shows with what it should show. The unit tests (node --test tests/*.test.cjs) cover the calculations;
// these checks cover what only a browser can tell: layout, hover cards, dragging the parts, panels that open and close,
// links between the pages, and that nothing is fetched from the internet.
//
// Usage: node tools/check-browser.mjs [check ...] [--out folder] [--file single-file.html]
//   checks: home, lab-hover, lab-operate, lab-panels, standalone. A prefix selects several ("lab"); none runs them all.
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
const leavesHome = entry => !['#home', '#main'].includes(entry);   // the brand link and the skip link stay on the home page

// ----- home page -----
async function home(t) {
  const b = await t.open({ width: 1600, height: 1000, room: [2040, 1300] });
  const shown = selector => b.evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].some(e => e.getClientRects().length > 0)`);
  await b.goto(fileUrl(dist, 'index.html'));
  await b.until(`document.readyState === 'complete' && document.querySelectorAll('.door-art img').length === 2 && [...document.querySelectorAll('.door-art img')].every(i => i.complete)`);
  await sleep(1500);

  const entries = await b.evaluate(`[...document.querySelectorAll('a[href], button')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(e => e.getAttribute('href') || '#' + (e.dataset.page || ''))`);
  t.expect(String(entries.filter(leavesHome).sort()) === './game.html,./lab-3d.html', 'the page offers the factory game and the learning lab, and nothing else', entries.join(' '));
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
  // Every click that reaches the page is noted, with whether it landed on the element a check was aiming at.
  await b.evaluate(`(() => { window.__clicks = 0; window.__onTarget = false; document.addEventListener('click', event => { window.__clicks++; window.__onTarget = !!event.target.closest('[data-check-target]'); }, true); })()`);
  const canvasBox = () => b.evaluate(`(() => { const r = document.getElementById('scene').getBoundingClientRect(); return { x: r.x, y: r.y }; })()`);
  const onPage = async point => { const box = await canvasBox(); return { x: point.x + box.x, y: point.y + box.y }; };
  const lab = {
    // A real click on a page element. Panels slide with CSS transitions, which lag at 3 frames per second, so the
    // element can still be moving: the click is repeated until it has landed on the element. False if it never does.
    clickOn: async (selector, settle = 900) => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const aim = await b.evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; e.setAttribute('data-check-target', ''); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, clicks: window.__clicks }; })()`);
        if (aim) await b.click(aim, 250);
        const landed = await b.evaluate(`(() => { const hit = window.__clicks > ${aim ? aim.clicks : 'Infinity'} && window.__onTarget; for (const e of document.querySelectorAll('[data-check-target]')) e.removeAttribute('data-check-target'); return hit; })()`);
        if (landed) { await sleep(settle); return true; }
        await sleep(600);
      }
      return false;
    },
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
  t.expect(String(pages) === 'index,game,lab-3d', 'the file holds the home page, the game and the learning lab', pages.join(' '));
  t.expect(!(await b.evaluate(`!!document.getElementById('cmp-data:lab-sim-replay')`)), 'no PHM replay data is embedded (a file built with --all holds it and must not be handed out)');
  const entries = await visible('#page-home a, #page-home button');
  t.expect(String(entries.filter(leavesHome).sort()) === './game.html,./lab-3d.html' && !(await parkedShown()), 'the home page offers the game and the learning lab only', entries.join(' '));
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

  await b.evaluate(`location.hash = '#lab-sim'`);
  t.expect(await reached(b, `${loaded} && !!${F}.document.querySelector('.door-lab')`, 60000), 'the address of a parked page that is not in the file falls back to the home page');
}

// ----- runner -----
const CHECKS = {
  home: { run: home, minutes: 4, about: 'dist/index.html, the mode selection' },
  'lab-hover': { run: labHover, minutes: 8, about: 'dist/lab-3d.html, a card for every part' },
  'lab-operate': { run: labOperate, minutes: 10, about: 'dist/lab-3d.html, one wafer polished and measured by dragging the parts' },
  'lab-panels': { run: labPanels, minutes: 12, about: 'dist/lab-3d.html, instrument strip, report and record over two wafers' },
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
