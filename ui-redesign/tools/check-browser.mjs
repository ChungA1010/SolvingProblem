// Browser checks of what a visitor can reach: the home page, the game page as far as its files and links go, the
// learning lab (the 3D CMP tool), the 8-process lab and the single-file build.
//
// Each check opens the page in a headless Chrome or Edge, uses it with real mouse and keyboard input and compares
// what the page shows with what it should show. The unit tests (npm test) cover the calculations;
// these checks cover what only a browser can tell: layout, hover cards, dragging the parts, panels that open and close,
// links between the pages, and that nothing is fetched from the internet.
//
// Usage: node tools/check-browser.mjs [check ...] [--out folder] [--file single-file.html] [--site folder]
//   checks: home, game, lab-hover, lab-operate, lab-panels, lab-lot, lab-fit, lab-context, process-route, process-flow, process-crystal, process-oxidation, process-photo, process-etch, process-implant, process-plating, process-cmp, process-eds, process-bond, process-all, process-fit, process-context, standalone.
//   A prefix selects several ("lab", "process"); none runs them all.
//   Screenshots go to evidence/browser-check/ (kept out of git), or to the folder given with --out.
//   The standalone check opens standalone/CMP-Lab.html, or the file given with --file.
//   The pages are opened from this folder, or from the copy of the site given with --site (tools/export-site.mjs makes one).
// The 3D pages render in software at about 3 frames per second (the whole line of the 8-process lab at about 1.5),
// so a full run takes about an hour: the fourteen process checks alone took 47 minutes on 2026-11-25, the six lab checks 15.
// Needs Node 22 or newer and Chrome or Edge (see tools/headless-browser.mjs). The exit code is 1 if anything failed.
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openBrowser, sleep } from './headless-browser.mjs';
import layout from './site-files.cjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');   // the site root
let site = root;                                                                  // where the pages are opened from; --site changes it
/** Address of a page of the site, by its name in tools/site-files.cjs: index, game, lab-3d, process-lab. */
const pageUrl = name => pathToFileURL(path.join(site, layout.PAGES[name])).href;
/** What the home page has to offer and nothing else: the game, the learning lab and the tab of the 8-process lab. */
const DOORS = ['game', 'lab-3d', 'process-lab'].map(name => `./${layout.PAGES[name]}`).sort().join(',');
const same = (a, b, tolerance = 1) => Math.abs(a - b) <= tolerance;
const line = (a, b, steps = 10) => Array.from({ length: steps + 1 }, (_, i) => ({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps }));
const reached = (browser, expression, ms) => browser.until(expression, ms).then(() => true, () => false);
let standaloneFile = path.join(root, 'standalone/CMP-Lab.html');   // --file changes it
const LAB = 'window.Lab3DDebug';   // the hooks lab-3d/app.js leaves for these checks
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
  await b.goto(pageUrl('index'));
  await b.until(`document.readyState === 'complete' && document.querySelectorAll('.door-art img').length === 2 && [...document.querySelectorAll('.door-art img')].every(i => i.complete)`);
  await sleep(1500);

  const entries = await b.evaluate(`[...document.querySelectorAll('a[href], button')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(e => e.getAttribute('href') || '#' + (e.dataset.page || ''))`);
  t.expect(String(entries.filter(leavesHome).sort()) === DOORS, 'the page offers the factory game, the learning lab and the tab of the 8-process lab, and nothing else', entries.join(' '));
  const parked = await b.evaluate(`[...document.querySelectorAll('[data-parked]')].map(e => e.getClientRects().length > 0)`);
  t.expect(parked.length > 0 && !parked.includes(true), `the ${parked.length} parked entries stay out of sight`);
  t.expect(!(await shown('.sidebar')) && !(await shown('.topbar')), 'the workspace frame (side menu, top bar) is hidden on the home page');
  t.expect(await b.evaluate(`[...document.querySelectorAll('.door-art img')].every(i => i.naturalWidth > 0)`), 'both pictures load');
  // The page is kept to few words: what CMP is at the top, and under each picture a name, one line and the way in.
  const words = await b.evaluate(`(() => { const lines = e => e.innerText.split('\\n').map(s => s.trim()).filter(Boolean), thesis = document.querySelector('.home-thesis');
    return { thesis: thesis.innerText.trim(), thesisShown: thesis.getClientRects().length > 0, foot: lines(document.querySelector('.home-foot')), tabs: [...document.querySelectorAll('.home-tabs a')].map(a => a.innerText.trim()), scripts: [...document.scripts].map(s => s.getAttribute('src') || '').filter(src => /lab-3d|home\\//.test(src)),
      caps: [...document.querySelectorAll('.door')].map(door => ({ lines: lines(door.querySelector('.door-cap')), name: door.querySelector('.door-name').innerText.trim(), what: door.querySelector('.door-what').innerText.trim(), go: door.querySelector('.door-go').innerText.trim() })) }; })()`);
  t.expect(words.caps.length === 2 && words.caps.every(c => c.lines.length === 3 && c.lines[0] === c.name && c.lines[1] === c.what && c.lines[2] === c.go && c.what.length <= 30),
    'under each picture there are three things and no more: the name of the mode, one short line on what is done there, and the way in', JSON.stringify(words.caps));
  t.expect(words.thesisShown && /CMP/.test(words.thesis) && /연마/.test(words.thesis) && words.thesis.length <= 40 && words.foot.length === 1 && /PHM 2016/.test(words.foot[0]) && String(words.tabs) === '모드 선택,8대 공정 실험실' && words.scripts.length === 0,
    'one line at the top says what CMP is, the tabs carry their names only, the foot names the data source and nothing else, and the page loads no script of the lab for itself', JSON.stringify({ thesis: words.thesis, tabs: words.tabs, foot: words.foot, scripts: words.scripts }));

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

// ----- game page -----
// The game has its own tests and play records (factory/README.md). This only looks at what the folder split can break:
// that the page, opened from its own folder, gets every file it asks for, and that its links reach the other pages.
async function game(t) {
  const b = await t.open({ width: 1600, height: 1000 });
  await b.goto(pageUrl('game'));
  await b.until(`document.readyState === 'complete' && !!document.querySelector('.settings-actions')`, 120000);
  await sleep(5000);                                                                           // the 3D bundle is 23 MB
  const page = await b.evaluate(`(async () => { await document.fonts.ready; return {
    scene: typeof window.CMPScene,
    tokens: getComputedStyle(document.documentElement).getPropertyValue('--dp-color-accent').trim(),
    font: [...document.fonts].filter(face => /Pretendard/.test(face.family)).map(face => face.status).join(','),
    pictures: [...document.images].filter(image => image.currentSrc).map(image => image.complete && image.naturalWidth > 0),
    figure: getComputedStyle(document.getElementById('shop-figure')).backgroundImage }; })()`);
  t.expect(page.scene === 'object', 'the game page loads its 3D bundle from its own folder', JSON.stringify(page.scene));
  t.expect(page.tokens !== '' && page.font.includes('loaded'), 'the shared stylesheet and the font beside it arrive from shared/', JSON.stringify({ tokens: page.tokens, font: page.font }));
  t.expect(page.pictures.length >= 4 && !page.pictures.includes(false), `its ${page.pictures.length} pictures load`, JSON.stringify(page.pictures));
  t.expect(/media\/counter-art\/[a-z]+-expressions\.png/.test(page.figure), 'the customer, whose picture path a script builds, is drawn from the game\'s own media', page.figure);
  await t.shot('1-counter');

  await b.evaluate(`document.querySelector('.settings-actions a[href="../index.html#home"]').click()`);
  t.expect(await reached(b, `location.pathname.endsWith('/index.html') && location.hash === '#home' && document.querySelectorAll('.door').length === 2`, 60000), 'its menu link leads to the mode selection');
  await b.evaluate(`document.querySelector('a.door-factory').click()`);
  t.expect(await reached(b, `location.pathname.endsWith('/factory/game.html') && !!document.querySelector('.settings-actions')`, 120000), 'and the home page leads back to the game');
  await sleep(1500);
  await b.evaluate(`document.querySelector('.settings-actions a[href="../lab-3d/lab-3d.html"]').click()`);
  t.expect(await reached(b, `location.pathname.endsWith('/lab-3d/lab-3d.html') && !!(${LAB} && ${LAB}.scene)`, 90000), 'its other menu link opens the learning lab');
  await b.goto(pathToFileURL(path.join(site, 'game.html')).href);
  t.expect(await reached(b, `location.pathname.endsWith('/factory/game.html') && !!document.querySelector('.settings-actions')`, 120000), 'the old address of the game (game.html beside index.html) is sent on to it');
}

// ----- learning lab -----
async function openLab(t, width = 1600, height = 1000) {
  const b = await t.open({ width, height });
  await b.goto(`${pageUrl('lab-3d')}?seed=11`);                                   // a fixed seed: the same incoming wafers every run
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
  await b.drag(line(up, await lab.at(L.cleaner[0], L.carryY, L.cleaner[2]), 16));
  const washing = await reached(b, `${LAB}.sim.state.wafer.where === 'cleaner' && ${LAB}.sim.state.cleaner.phase === 'scrub'`, 15000);
  t.expect(washing, 'pulling the raised head to the cleaner puts the wafer on its chuck and starts the scrub', JSON.stringify(await b.evaluate(`({ where: ${LAB}.sim.state.wafer.where, cleaner: ${LAB}.sim.state.cleaner })`)));
  const knob = await lab.at(L.brush[0], L.brush[1], L.brush[2]);
  await b.drag(line(knob, { x: knob.x + 40, y: knob.y }, 8)); await sleep(300);
  s = await lab.state(); t.expect(s.controls.brush > C.brushRef && s.controls.brush < C.brushSafe, 'dragging the dial beside the cleaner presses the scrub brush in further', `brush ${s.controls.brush} mm`);
  await sleep(2200); await lab.shot('2-cleaning');
  await b.evaluate(`${LAB}.setSpeed(64)`);
  await reached(b, `${LAB}.sim.state.cleaner.phase === 'rinse'`, 120000); await b.evaluate(`${LAB}.setSpeed(1)`); await sleep(400);
  await b.click(await lab.at(L.cleaner[0] + 0.05, L.cleaner[1] + 0.004, L.cleaner[2] + 0.07), 200); await sleep(500);
  const skipped = await b.evaluate(`({ phase: ${LAB}.sim.state.cleaner.phase, clean: ${LAB}.sim.state.wafer.cleanTime, where: ${LAB}.sim.state.wafer.where })`);
  t.expect(skipped.phase === 'dry' && skipped.where === 'cleaner' && skipped.clean < C.cleanScrub + C.cleanRinse - 1, 'a click on the running cleaner ends the rinse early and the spin dry starts', JSON.stringify(skipped));
  await b.evaluate(`${LAB}.setSpeed(64)`);
  const dried = await reached(b, `${LAB}.sim.state.cleaner.phase === 'done' && !${LAB}.sim.state.wafer.wet`, 120000);
  await b.evaluate(`${LAB}.setSpeed(4)`); await sleep(1500);
  t.expect(dried && /세정이 끝났습니다/.test(await b.evaluate(`document.getElementById('guide-text').innerText`)), 'the cleaner scrubs, rinses and dries by itself, and the guide then points to the metrology stage', await b.evaluate(`document.getElementById('guide-text').innerText`));
  await b.drag(line(await lab.at(L.cleaner[0], L.cleaner[1] + 0.004, L.cleaner[2]), await lab.at(L.stage[0], L.carryY, L.stage[2]), 18));
  const measured = await reached(b, `${LAB}.drawer.open && ${LAB}.attempts.length === 1`, 30000);
  await sleep(2000);
  const p = await lab.panels(), report = await b.evaluate(`document.getElementById('report').innerText.replace(/\\n+/g, ' | ')`);
  s = await lab.state();
  t.expect(measured && s.where === 'stage' && p.drawer.tab === 'report' && report.length > 100, 'pulling the raised head to the metrology stage measures the wafer and opens the report', `wafer at ${s.where}, ${JSON.stringify(p.drawer)}`);
  if (p.wafers[0]) {
    t.expect(p.wafers[0].mean > 500 && p.wafers[0].mean < 600, 'the measured thickness is where the polish was stopped', `${p.wafers[0].mean} nm`);
    t.note(`this wafer: ${Math.round(p.wafers[0].mean)} nm, ${p.wafers[0].pass ? 'passed' : 'did not pass'} (the verdict depends on the drags above; the model itself is covered by the unit tests)`);
    const cleaned = await b.evaluate(`(() => { const m = ${LAB}.attempts[0].m; return { particles: m.particles, wet: m.wet, clean: m.ok.clean }; })()`);
    t.expect(cleaned.clean === true && !cleaned.wet && cleaned.particles <= C.particlesMax, 'the wafer that went through the cleaner is dry and within the particle limit', JSON.stringify(cleaned));
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
  // A first-time operator is shown which way to drag: the arrow starts on the part to operate and ends where the drag goes.
  const arrow = () => b.evaluate(`(() => { const d = ${LAB}, g = document.getElementById('gesture'), hand = document.getElementById('gesture-hand');
    const points = (document.getElementById('gesture-line').getAttribute('d') || '').split(/[ML]/).filter(Boolean).map(pair => pair.trim().split(' ').map(Number));
    const wafer = d.scene.screenOf('wafer'), head = d.scene.project(d.scene.layout.head[0], d.scene.layout.carryY, d.scene.layout.head[2]);
    return { coach: d.coach, hidden: getComputedStyle(g).display === 'none', kind: g.dataset.kind, guide: document.getElementById('guide-text').innerText, points: points.length, from: points[0], to: points.at(-1), wafer, head, hand: [Number(hand.getAttribute('cx')), Number(hand.getAttribute('cy'))] }; })()`);
  await b.mouse('mouseMoved', { x: 300, y: 300 }); await sleep(600);
  let a = await arrow();
  const close = (p, q) => !!p && Math.hypot(p[0] - q.x, p[1] - q.y) < 4;
  t.expect(a.coach && !a.hidden && a.kind === 'carry' && /웨이퍼/.test(a.guide) && close(a.from, a.wafer) && close(a.to, a.head) && Math.hypot(a.wafer.x - a.head.x, a.wafer.y - a.head.y) > 60,
    'on a first visit an arrow runs from the wafer to the place under the head, as the guide asks', JSON.stringify(a));
  const hands = []; for (let i = 0; i < 4; i++) { hands.push((await arrow()).hand); await sleep(350); }
  t.expect(new Set(hands.map(h => h.map(Math.round).join(','))).size > 1, 'a dot travels the arrow the way the pointer should', JSON.stringify(hands));
  await b.evaluate(`${LAB}.sim.moveWafer('head')`);
  await reached(b, `document.getElementById('gesture').dataset.kind === 'turn'`, 20000);
  a = await arrow(); t.expect(!a.hidden && a.kind === 'turn' && /패드/.test(a.guide) && a.points > 8 && Math.hypot(a.from[0] - a.to[0], a.from[1] - a.to[1]) > 60, 'the next arrow is an arc round the pad', JSON.stringify(a));
  await lab.shot('0-arrow');
  await b.evaluate(`${LAB}.sim.moveWafer('pedestal')`); await sleep(300);

  await lab.startPolishing({ platen: 90, carrier: 87, slurry: 200, conditioner: true });
  p = await lab.panels(); t.expect(p.strip && p.bottom > 0, 'the instrument strip comes up when the wafer touches the pad, and the 3D view makes room for it', JSON.stringify(p));
  await lab.polishTo(800); await sleep(1500);
  const wording = await b.evaluate(`({ tile: document.querySelector('.tile.profile h3').innerText, spec: document.getElementById('spec').innerText, guide: document.getElementById('guide-text').innerText })`);
  t.expect(/불균일도/.test(wording.tile) && /불균일도 ≤/.test(wording.spec) && /입자 ≤ 30개/.test(wording.spec) && !/컨디셔너/.test(wording.guide),
    'the lower-is-better figure is called non-uniformity, the work order carries the particle limit, and the guide does not mention a conditioner that is already sweeping', JSON.stringify(wording));
  await lab.shot('1-strip');
  const tips = {};
  for (const [name, selector, fx] of [['thickness trend', '#plot-trend', 0.55], ['radial profile', '#plot-profile', 0.8], ['rate factor', '#factors .frow:nth-child(5)', 0.5], ['model note', '#model-note', 0.5]]) { await lab.hover(await lab.centre(selector, fx)); tips[name] = await lab.tip(); }
  t.expect(Object.values(tips).every(text => text.length > 0), 'the charts, the factors and the note show their values under the pointer', JSON.stringify(tips).slice(0, 300));
  await b.mouse('mouseMoved', { x: 300, y: 300 }); await sleep(300);
  const factorRows = await b.evaluate(`[...document.querySelectorAll('#factors .frow')].map(row => row.innerText.replace(/\\s+/g, ' ').trim())`);
  const live = await b.evaluate(`(() => { const s = ${LAB}.sim.state; return { level: s.level, factor: s.factors.level, wafers: ${LAB}.sim.tool.status.wafers }; })()`);
  t.expect(factorRows.length === 7 && /^장비 ×\d\.\d\d$/.test(factorRows[6]) && live.wafers === 1 && live.level === live.factor && Math.abs(live.level - 1) < 0.25,
    'the seventh factor is the state of the tool, set by the data model when the wafer was pressed', `${JSON.stringify(factorRows)} ${JSON.stringify(live)}`);

  await lab.polishTo(566); await lab.liftAndMeasure(1);
  p = await lab.panels(); t.expect(!p.strip && p.drawer.open && p.drawer.tab === 'report' && p.right > 0 && p.wafers.length === 1, 'after metrology the strip goes down, the report opens and the 3D view makes room for it', JSON.stringify(p));
  const lesson = await b.evaluate(`({ coach: ${LAB}.coach, kept: localStorage.getItem('cmp-lab3d-coach'), hidden: getComputedStyle(document.getElementById('gesture')).display === 'none' })`);
  t.expect(!lesson.coach && lesson.kept === 'off' && lesson.hidden, 'once a wafer has been polished and measured the arrows stop, and stay off on the next visit', JSON.stringify(lesson));
  await lab.shot('2-report');
  const toolText = () => b.evaluate(`(document.querySelector('#report .tool-state')?.innerText || '').replace(/\\n+/g, ' | ')`);
  const firstTool = await toolText(), firstSeen = await b.evaluate(`${LAB}.attempts[0].m.tool`);
  t.expect(/장비 상태/.test(firstTool) && /데이터 모델/.test(firstTool) && /이 웨이퍼에서 본 값 \| ×\d\.\d\d/.test(firstTool) && /연마 전 모델의 예상 \| 계측 기록 없음/.test(firstTool) && /다음 웨이퍼 예상 \| ×\d\.\d\d \(\d\.\d\d~\d\.\d\d\)/.test(firstTool),
    'the report says what this wafer showed of the tool and what the model now expects of the next one', firstTool);
  t.expect(firstSeen && Math.abs(firstSeen.observed - live.level) < 0.01 && firstSeen.next.low < firstSeen.next.ratio && firstSeen.next.ratio < firstSeen.next.high,
    'what the wafer showed is the state it met, and the expectation is a range around a value', JSON.stringify(firstSeen));
  await lab.hover(await lab.centre('.wafer-map', 0.5, 0.25));
  t.expect((await lab.tip()).length > 0, 'a point of the 49-point map shows its thickness under the pointer');
  await b.mouse('mouseMoved', { x: 300, y: 300 }); await sleep(200);

  // This wafer went from the pad straight to the stage: the report counts what is left on it and offers the cleaner.
  const cleanRow = () => b.evaluate(`[...document.querySelectorAll('#report .criteria li')].map(li => li.innerText.replace(/\\s+/g, ' ').trim()).find(row => /남은 입자/.test(row)) || ''`);
  const result = () => b.evaluate(`(() => { const m = ${LAB}.attempts[0].m; return { particles: m.particles, wet: m.wet, clean: m.ok.clean, pass: m.pass, cycle: m.cycle, notes: document.querySelector('#report .notes').innerText }; })()`);
  let row = await cleanRow(), m = await result();
  t.expect(/초과/.test(row) && /젖음/.test(row) && m.particles > 1500 && m.wet && m.clean === false && !m.pass && /세정하지 않아/.test(m.notes),
    'a wafer measured straight off the pad fails on the particles left on its wet surface, and the report says why', `${row} ${JSON.stringify(m)}`);
  const through = await b.evaluate(`(document.querySelector('#report .throughput')?.innerText || '').replace(/\\n+/g, ' | ')`);
  t.expect(/처리량/.test(through) && /이 장비 한 대 \| 시간당 \d+\.\d장/.test(through) && /양산 구성 \(연마 모듈 4대\) \| 시간당 \d+장/.test(through) && m.cycle.clean === 0 && Math.abs(m.cycle.perHour - 3600 / (m.cycle.polish + 30)) < 1e-6,
    'the report gives the time this wafer took and the wafers per hour of one tool and of a line of four polishing modules', through);
  await b.evaluate("document.querySelector('#report footer').scrollIntoView({ block: 'end' })"); await sleep(600);
  const sent = await lab.clickOn('#report footer button:nth-child(2)', 1200), washing = await b.evaluate(`({ where: ${LAB}.sim.state.wafer.where, phase: ${LAB}.sim.state.cleaner.phase, drawer: ${LAB}.drawer.open, guide: document.getElementById('guide-text').innerText })`);
  t.expect(sent && washing.where === 'cleaner' && washing.phase === 'scrub' && !washing.drawer && /솔질 중/.test(washing.guide), 'the report\'s button sends the wafer back to the cleaner, which starts to scrub', JSON.stringify(washing));
  await sleep(2500); await lab.shot('2-cleaning');
  await b.evaluate(`${LAB}.setSpeed(64)`); const dried = await reached(b, `${LAB}.sim.state.cleaner.phase === 'done'`, 120000); await b.evaluate(`${LAB}.setSpeed(4)`);
  await b.evaluate(`${LAB}.onWafer('stage')`); await b.until(`${LAB}.drawer.open && ${LAB}.attempts[0].m.ok.clean === true`, 30000); await sleep(1500);
  row = await cleanRow(); m = await result();
  t.expect(dried && /통과/.test(row) && /마름/.test(row) && m.particles <= 30 && !m.wet && Math.abs(m.cycle.clean - 45) < 0.5 && (await lab.panels()).wafers.length === 1,
    'after scrub, rinse and dry the same wafer is within the particle limit, and its time now includes the 45 s clean', `${row} ${JSON.stringify(m.cycle)}`);
  await lab.shot('2-cleaned-report');

  await b.evaluate(`${LAB}.newWafer()`); await sleep(600);
  p = await lab.panels(); t.expect(!p.drawer.open, 'a new wafer closes the report');
  await lab.startPolishing({ platen: 90, carrier: 0, slurry: 200, conditioner: false });                         // on purpose: the head does not turn
  const hint = await b.evaluate(`document.getElementById('guide-text').innerText`);
  t.expect(/연마 중에도 컨디셔너/.test(hint), 'while a wafer is polished with the conditioner parked, the guide says it can be used during the polish', hint);
  await lab.polishTo(600); await lab.liftAndMeasure(2);
  p = await lab.panels();
  t.note(`wafers: ${p.wafers.map(w => `#${w.id} ${Math.round(w.mean)} nm ${w.pass ? 'passed' : 'did not pass'}`).join(', ')}`);
  await lab.shot('3-second-report');
  const secondTool = await toolText();
  t.expect(/연마 전 모델의 예상 \| ×\d\.\d\d \(\d\.\d\d~\d\.\d\d\)/.test(secondTool) && (await b.evaluate(`${LAB}.sim.tool.status.measured`)) === 2,
    'for the second wafer the report also shows what the model expected before it was polished', secondTool);

  // Two polishes with the conditioner (all of the first, none of the second) have cut the pad: it started about half used.
  const life = await b.evaluate(`(() => { const d = ${LAB}; return { left: d.sim.state.padLeft, cut: d.sim.state.padCut, chip: document.getElementById('lot-chip').innerText, lot: d.sim.lotSummary() }; })()`);
  t.expect(life.left > 0.2 && life.left < 0.5 && /로트 1 · 2\/5장/.test(life.chip) && life.lot.count === 2 && !life.lot.done,
    'the conditioner has used up part of the pad, and the work order shows the lot at two wafers of five', JSON.stringify({ left: life.left, chip: life.chip, count: life.lot.count }));
  // The pad is changed on a tool that stands still, and the model then knows the next wafer is the first on a new pad.
  await b.evaluate(`(() => { const d = ${LAB}; d.sim.setControl('platen', 90); })()`); await sleep(1500);
  let padClick = await lab.clickOn('#pad-change'); await sleep(400);
  const refused = await b.evaluate(`({ text: document.getElementById('alarms').innerText, isNew: ${LAB}.sim.tool.status.padIsNew })`);
  t.expect(padClick && /세운 뒤/.test(refused.text) && !refused.isNew, 'the pad cannot be changed while the platen turns, and the page says why', JSON.stringify(refused));
  await b.evaluate(`(() => { const d = ${LAB}; for (const name of ['platen', 'carrier', 'slurry']) d.sim.setControl(name, 0); d.sim.setControl('conditioner', false); })()`);
  await reached(b, `${LAB}.sim.state.platenRpm < 1`, 30000);
  padClick = await lab.clickOn('#pad-change'); await sleep(400);
  const changed = await b.evaluate(`(() => { const d = ${LAB}; return { ...d.sim.tool.status, text: document.getElementById('alarms').innerText, expects: d.sim.tool.predict() }; })()`);
  t.expect(padClick && changed.padIsNew && changed.padUsage === 0 && changed.padChanges === 1 && /새 패드/.test(changed.text), 'on a tool that stands still the pad is changed, and its usage starts again', JSON.stringify(changed));

  let landed = await lab.clickOn('#drawer-tabs button[data-tab="log"]');
  const rows = await b.evaluate(`document.querySelectorAll('#log .log-row').length`);
  t.expect(landed && rows === 2 && (await lab.panels()).drawer.tab === 'log', 'the record tab lists both wafers', `click landed: ${landed}, ${rows} rows`);
  const lotView = await b.evaluate(`(() => { const d = ${LAB}, lot = d.sim.lotSummary(), host = document.querySelector('#log .lot');
    return { text: host ? host.innerText.replace(/\\n+/g, ' | ') : '', charts: host ? host.querySelectorAll('.lot-chart').length : 0, marks: host ? host.querySelectorAll('.lot-chart .ok, .lot-chart .ng').length : 0, seen: host ? host.querySelectorAll('.lot-chart .seen').length : 0,
      passed: lot.passed, count: lot.count, padChanges: lot.padChanges, padChange: lot.time.padChange, total: lot.time.total, wafers: lot.time.wafers, exSitu: lot.time.exSitu, perHour: lot.goodPerHour, left: d.sim.state.padLeft }; })()`);
  t.expect(new RegExp(`합격 \\| ${lotView.passed} / 2장`).test(lotView.text) && /패드 교체 1회 \| 5분 00초/.test(lotView.text) && /양품 처리량 \| 시간당 \d+\.\d장/.test(lotView.text) && /패드 수명 남음 \| 100%/.test(lotView.text)
    && lotView.charts === 2 && lotView.marks === 2 && lotView.seen === 2 && lotView.padChange === 300 && lotView.left === 1 && Math.abs(lotView.total - (lotView.wafers + 300 + lotView.exSitu)) < 1e-6 && Math.abs(lotView.perHour - lotView.passed / lotView.total * 3600) < 1e-6,
    'the record opens with the lot: both wafers on the thickness and tool charts, the good ones, the time with the pad change in it, and good wafers per hour', JSON.stringify(lotView));
  await lab.shot('4-record');
  await b.evaluate("document.querySelector('#log .log-row:last-child').scrollIntoView({ block: 'end' })"); await sleep(600);   // the lot stands above the list
  landed = await lab.clickOn('#log .log-row:last-child');
  p = await lab.panels(); t.expect(landed && p.drawer.tab === 'report' && p.drawer.selected === p.wafers.at(-1).id, 'choosing a wafer in the record opens its report', `click landed: ${landed}, ${JSON.stringify(p.drawer)}`);
  landed = await lab.clickOn('#drawer-close');
  p = await lab.panels(); t.expect(landed && !p.drawer.open && p.right === 0, 'closing the report gives the room back to the 3D view', `click landed: ${landed}, ${JSON.stringify(p)}`);
  landed = await lab.clickOn('#log-open');
  p = await lab.panels(); t.expect(landed && p.drawer.open, 'the film monitor\'s record link opens it again', `click landed: ${landed}, ${JSON.stringify(p.drawer)}`);
}

// A whole lot through the tool by the page's hooks: five wafers, the pad worn out on the way and changed, the result of the
// lot, the lot after it, and a wafer that is passed on without a measurement.
async function labLot(t) {
  const { b, lab } = await openLab(t);
  const C = await b.evaluate(`${LAB}.constants`), SIZE = C.lotSize;
  const RECIPE = { platen: 90, carrier: 87, slurry: 200, conditioner: true };                   // the conditioner sweeps all the time: that is what wears the pad out
  const view = () => b.evaluate(`(() => { const d = ${LAB}, s = d.sim.state, action = document.getElementById('guide-action');
    return { lot: d.sim.lotSummary(), past: s.lots.map(p => ({ id: p.id, count: p.count, passed: p.passed })), left: s.padLeft, worn: !!s.alarms.worn, alarms: document.getElementById('alarms').innerText,
      chip: document.getElementById('lot-chip').innerText, guide: document.getElementById('guide-text').innerText, action: action.hidden ? '' : action.innerText, drawer: d.drawer }; })()`);
  const brief = v => JSON.stringify({ chip: v.chip, guide: v.guide, action: v.action, left: v.left, worn: v.worn, alarms: v.alarms, lot: { id: v.lot.id, count: v.lot.count, passed: v.lot.passed, done: v.lot.done, time: v.lot.time, padChanges: v.lot.padChanges }, past: v.past, drawer: v.drawer });
  const lift = async () => { await b.evaluate(`${LAB}.sim.setControl('head', 0)`); await b.until(`${LAB}.sim.state.gap > 0.1`, 30000); };
  /** One wafer: polish to just above the target, lift, clean to the end, measure. `measured` is how many wafers the record then holds. */
  const runWafer = async measured => {
    await lab.startPolishing(RECIPE); await lab.polishTo(566); await lift();
    await b.evaluate(`(() => { const d = ${LAB}; d.onWafer('cleaner'); d.setSpeed(64); })()`);
    await b.until(`${LAB}.sim.state.cleaner.phase === 'done'`, 120000); await b.evaluate(`${LAB}.setSpeed(4)`);
    await b.evaluate(`${LAB}.onWafer('stage')`);
    await b.until(`${LAB}.drawer.open && ${LAB}.attempts.length === ${measured} && !!${LAB}.sim.state.wafer.measured`, 30000); await sleep(1200);
  };

  let v = await view();
  t.expect(new RegExp(`로트 1 · 0/${SIZE}장`).test(v.chip) && v.lot.count === 0 && v.left > 0.4 && v.left < 0.6 && !v.worn, 'the work order starts on lot 1 with no wafer in it, on a pad that is about half used', brief(v));

  // Wafer 1 with the scrub brush pressed in all the way: it cleans, and it scratches (about three scratches; none once in twenty).
  await b.evaluate(`${LAB}.sim.setControl('brush', ${C.brushMax})`);
  await runWafer(1);
  const first = await b.evaluate(`(() => { const m = ${LAB}.attempts[0].m; return { brush: m.brushScratches, scratches: m.scratches, defects: m.ok.defects, clean: m.ok.clean, notes: document.querySelector('#report .notes').innerText }; })()`);
  t.expect(first.clean === true && (first.brush > 0) === /세정기의 솔을 너무 깊이/.test(first.notes) && first.scratches >= first.brush && (first.brush === 0 || first.defects === false),
    'a brush pressed in all the way cleans the wafer, and the report names the scratches it left whenever it left any', JSON.stringify(first));
  t.note(`the brush at ${C.brushMax} mm left ${first.brush} scratch(es) on wafer 1`);
  await b.evaluate(`${LAB}.sim.setControl('brush', ${C.brushRef})`);

  for (let n = 2; n <= SIZE - 1; n++) { await b.evaluate(`${LAB}.newWafer()`); await sleep(500); await runWafer(n); }
  v = await view();
  t.expect(v.lot.count === SIZE - 1 && !v.lot.done && new RegExp(`로트 1 · ${SIZE - 1}/${SIZE}장`).test(v.chip) && new RegExp(`로트 ${SIZE - 1}/${SIZE}장`).test(v.guide) && v.action === '새 웨이퍼',
    'one wafer before the end, the work order and the guide count the wafers of the lot', brief(v));
  t.expect(v.left === 0 && v.worn && /패드 수명이 다했습니다/.test(v.alarms), 'with the conditioner sweeping all the time the pad is worn out inside the lot, and the alarm says to change it', brief(v));
  await lab.shot('1-pad-worn-out');

  await b.evaluate(`(() => { const d = ${LAB}; d.setSpeed(16); for (const name of ['platen', 'carrier', 'slurry']) d.sim.setControl(name, 0); d.sim.setControl('conditioner', false); })()`);
  await reached(b, `${LAB}.sim.state.platenRpm < 1`, 60000);
  let landed = await lab.clickOn('#pad-change'); await sleep(700);
  v = await view();
  t.expect(landed && v.left === 1 && !v.worn && !/패드 수명이 다했습니다/.test(v.alarms) && v.lot.padChanges === 1 && v.lot.time.padChange === C.padChangeTime, 'a new pad ends the alarm, and the time the change takes goes on the lot', brief(v));

  await b.evaluate(`${LAB}.newWafer()`); await sleep(500); await runWafer(SIZE);
  v = await view();
  t.expect(v.lot.done && v.lot.count === SIZE && v.drawer.tab === 'report' && new RegExp(`1번 로트의 ${SIZE}장을 모두 돌렸습니다`).test(v.guide) && v.action === '로트 결과', 'when the last wafer of the lot is measured, the guide says so and offers the result of the lot', brief(v));
  landed = await lab.clickOn('#guide-action', 1200);
  const result = await b.evaluate(`(() => { const d = ${LAB}, lot = d.sim.lotSummary(), host = document.querySelector('#log .lot'), action = document.getElementById('guide-action'), count = s => host ? host.querySelectorAll(s).length : 0;
    const whole = Math.round(lot.time.total), one = v => v.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return { tab: d.drawer.tab, text: host ? host.innerText.replace(/\\n+/g, ' | ') : '', verdict: host?.querySelector('.verdict')?.innerText.replace(/\\s+/g, ' ').trim() || '', button: host?.querySelector('footer button')?.innerText || '',
      marks: count('.lot-chart .ok, .lot-chart .ng, .lot-chart .none'), seen: count('.lot-chart .seen'), ranges: count('.lot-chart .range'), guide: document.getElementById('guide-text').innerText, action: action.hidden ? '' : action.innerText,
      clock: Math.floor(whole / 60) + '분 ' + String(whole % 60).padStart(2, '0') + '초', perHour: one(lot.goodPerHour), rate: lot.goodPerHour, passed: lot.passed, count: lot.count, time: lot.time }; })()`);
  t.expect(landed && result.tab === 'log' && result.verdict === `합격 ${result.passed}/${result.count}` && result.button === '새 로트' && result.marks === SIZE && result.seen === SIZE && result.ranges === SIZE - 1,
    'the record opens on the finished lot: a mark for every wafer, what each showed of the tool against what the model expected, the verdict, and the way to the next lot', JSON.stringify({ ...result, text: undefined }));
  t.expect(result.text.includes(`걸린 시간 | ${result.clock}`) && /패드 교체 1회 \| 5분 00초/.test(result.text) && result.text.includes(`양품 처리량 | 시간당 ${result.perHour}장`)
    && Math.abs(result.time.total - (result.time.wafers + result.time.padChange + result.time.exSitu)) < 1e-6 && Math.abs(result.rate - result.passed / result.time.total * 3600) < 1e-6,
    'the time of the lot is its wafers, the pad change and the conditioning between wafers, in minutes and whole seconds, and good wafers per hour follow from it', result.text);
  t.expect(new RegExp(`^1번 로트가 끝났습니다\\. 합격 ${result.passed}/${result.count}장\\.$`).test(result.guide.trim()) && result.action === '새 로트', 'with the result open, the guide names the lot and offers the next one', JSON.stringify({ guide: result.guide, action: result.action }));
  t.note(`lot 1: ${result.passed} of ${result.count} passed, ${result.clock}, ${result.perHour} good wafers an hour`);
  await lab.shot('2-lot-result');

  landed = await lab.clickOn('#guide-action', 900);
  v = await view();
  t.expect(landed && v.lot.id === 2 && v.lot.count === 0 && new RegExp(`로트 2 · 0/${SIZE}장`).test(v.chip) && v.past.length === 1 && v.past[0].id === 1 && v.past[0].count === SIZE && !v.drawer.open, 'the next wafer opens lot 2, and lot 1 is kept', brief(v));

  // A wafer that is polished and passed on without a measurement counts in its lot, and not as a good one.
  await lab.startPolishing(RECIPE); await lab.polishTo(900); await lift();
  await b.evaluate(`${LAB}.newWafer()`); await sleep(600);
  landed = await lab.clickOn('#log-open', 1200);
  const next = await b.evaluate(`(() => { const d = ${LAB}, lot = d.sim.lotSummary(), log = document.getElementById('log'), text = s => (log.querySelector(s)?.innerText || '').replace(/\\n+/g, ' | ');
    return { tab: d.drawer.tab, count: lot.count, passed: lot.passed, measured: lot.wafers.map(e => e.measured), none: log.querySelectorAll('.lot .lot-chart .none').length, lot: text('.lot'), past: text('.past-lots') }; })()`);
  t.expect(landed && next.tab === 'log' && next.count === 1 && next.passed === 0 && next.measured[0] === false && next.none === 1 && /합격 \| 0 \/ 1장/.test(next.lot) && new RegExp(`로트 1 · 합격 ${result.passed}/${SIZE}장`).test(next.past),
    'a wafer polished and passed on unmeasured is in lot 2 as a failed one, with its own mark, and lot 1 stands below as one line', JSON.stringify(next));
  await lab.shot('3-next-lot');
}

// ----- 8-process lab -----
const PL = 'window.ProcessLabDebug';
/** A point on a machine of the lab's line, in page pixels: found by going down from its top until the pointer is on it. Null if there is none. */
async function onMachine(b, key) {
  const top = await b.evaluate(`(() => { const p = ${PL}.scene.stationPoint(${JSON.stringify(key)}), r = document.getElementById('scene').getBoundingClientRect(); return p && p.visible ? { x: p.x + r.left, y: p.y + r.top } : null; })()`);
  for (let down = 8; top && down <= 320; down += 12) {
    const point = { x: top.x, y: top.y + down };
    if (await b.evaluate(`${PL}.scene.stationAt(${point.x}, ${point.y})`) === key) return { x: point.x, y: point.y + 8 };
  }
  return null;
}
/** The line the lab opens on and the route by itself, with every process passed by the standard recipe (equipment=off). */
async function processRoute(t) {
  const b = await t.open({ width: 1600, height: 1000 });
  await b.goto(`${pageUrl('process-lab')}?seed=5&equipment=off`);
  if (!(await reached(b, `!!${PL}`, 30000))) throw new Error('the page did not start');
  await sleep(800); await watchClicks(b);
  const bench = () => b.evaluate(`({ title: document.querySelector('.bench h2').textContent, at: ${PL}.run ? ${PL}.run.at : -1, start: ${PL}.run ? ${PL}.run.start : -1, records: ${PL}.run ? ${PL}.run.records.length : 0, finished: !!${PL}.run && ${PL}.run.finished,
    redo: !!document.getElementById('redo-here'), fresh: !!document.getElementById('start-here'), back: !!document.getElementById('back') })`);

  const names = await b.evaluate(`[...document.querySelectorAll('.stop .name')].map(e => e.textContent)`);
  t.expect(String(names) === '웨이퍼 제조,산화,포토,식각,증착·이온주입,금속배선,EDS,패키징', 'the route holds the eight processes in order', names.join(' '));
  const landing = await b.evaluate(`(() => { const d = ${PL}, box = document.getElementById('scene').getBoundingClientRect(), at = d.scene.stations.map(key => d.scene.stationPoint(key));
    return { mode: d.mode, run: !!d.run, start: !document.getElementById('line-start').hidden, back: !document.getElementById('line-back').hidden, machines: d.scene.stations.length,
      inOrder: at.every((p, i) => p.visible && p.x > 0 && p.x < box.width && p.y > 0 && p.y < box.height && (!i || p.x > at[i - 1].x)),
      words: document.getElementById('line-head').innerText.replace(/\\s+/g, ' ').trim().length, goal: [...document.querySelectorAll('#help-goal svg text')].map(e => e.textContent) }; })()`);
  t.expect(landing.mode === 'line' && !landing.run && landing.start && !landing.back && landing.machines === 8 && landing.inOrder && landing.words < 60,
    'the lab opens on its line: the eight machines stand in order in one 3D picture, under one heading and one button', JSON.stringify({ ...landing, goal: undefined }));
  t.expect(['구리', '산화막', 'n+ 접합', '장벽막', '창', '실리콘'].every(word => landing.goal.some(label => label.includes(word))), 'what the lab makes, the finished chip with every layer named after its process, is in the help window', landing.goal.join(' | '));
  await sleep(2500); await t.shot('1-line');

  const etcher = await onMachine(b, 'etch');
  if (etcher) { await b.mouse('mouseMoved', { x: etcher.x - 3, y: etcher.y }); await sleep(200); await b.mouse('mouseMoved', etcher); await reached(b, `${PL}.line.tagged === 3`, 30000); await sleep(600); }
  const tag = await b.evaluate(`(() => { const box = document.getElementById('line-tag'); return { shown: !box.hidden, text: box.innerText.replace(/\\s+/g, ' ').trim(), picture: !!box.querySelector('svg'), hot: [...document.querySelectorAll('.stop')].findIndex(stop => 'hot' in stop.dataset) }; })()`);
  t.expect(Boolean(etcher) && tag.shown && /^4 식각/.test(tag.text) && /산화막을 깎아/.test(tag.text) && tag.picture && tag.hot === 3,
    'under the pointer a machine of the line shows its number and process, the wafer as it leaves and what the process does, and its step of the route lights up', JSON.stringify(tag));
  await t.shot('1-line-hover');
  if (etcher) await b.click(etcher, 1900);
  let landed = await reached(b, `!!${PL}.run && ${PL}.mode === 'bench'`, 20000);
  const tagGone = await b.evaluate(`document.getElementById('line-tag').hidden || getComputedStyle(document.getElementById('line-tag')).display === 'none'`);
  const begun = await b.evaluate(`({ title: document.querySelector('.bench h2').textContent, start: ${PL}.run.start, before: ${PL}.run.records.filter(r => r.before).length, oxide: ${PL}.run.wafer.oxide, window: !!${PL}.run.wafer.window, result: document.querySelector('.bench .result').textContent })`);
  t.expect(landed && tagGone && begun.title === '식각' && begun.start === 3 && begun.before === 3 && begun.oxide === 500 && begun.window && begun.result.length > 5, 'a click on a machine starts there at once, on a wafer finished up to that process by the standard recipe', JSON.stringify(begun));
  await t.shot('2-etch');
  let mapped = null;
  for (let i = 0; i < 8 && landed && !(await b.evaluate(`!!document.querySelector('.sheet')`)); i++) {         // the last click opens the run sheet
    if (await b.evaluate(`${PL}.viewing === 6 && ${PL}.mode === 'bench'`)) mapped = await b.evaluate(`(() => { const key = document.querySelector('#bench .legend'), cells = [...document.querySelectorAll('#bench .figure svg rect[width="18.4"]')]; return { key: key && key.textContent, cells: cells.length, failed: cells.filter(r => r.getAttribute('fill') === '#e34948').length, tips: cells.filter(r => r.querySelector('title') && /결함/.test(r.querySelector('title').textContent)).length, good: ${PL}.run.wafer.tested.good }; })()`);
    landed = await clickOn(b, '#next-step', 1700);
  }
  t.expect(mapped && mapped.cells === 148 && mapped.failed === 148 - mapped.good && mapped.tips === mapped.failed && new RegExp(`양품 ${mapped.good}`).test(mapped.key) && new RegExp(`결함 ${mapped.failed}`).test(mapped.key), 'the EDS map colours failed chips by what failed them, says so under the pointer, and the key counts them', JSON.stringify(mapped));
  const sheet = await b.evaluate(`({ finished: ${PL}.run.finished, rows: document.querySelectorAll('.sheet tbody tr').length, before: document.querySelectorAll('.sheet tr[data-before="true"]').length, again: document.querySelectorAll('.sheet [data-redo]').length, chips: ${PL}.run.wafer.packaged.chips, good: ${PL}.run.wafer.tested.good, clean: ${PL}.flow.defects(${PL}.run.wafer.lot).filter(hit => !hit).length, title: document.querySelector('.bench h2').textContent })`);
  t.expect(sheet.finished && sheet.rows === 8 && sheet.before === 3 && sheet.again === 5 && sheet.chips === sheet.good && sheet.good === sheet.clean && sheet.good > 100 && sheet.good < 148 && sheet.title.includes(String(sheet.chips)), 'the run goes on from there to packaging and ends with the sheet of all eight processes; the chips without a defect are the ones packaged', JSON.stringify(sheet));
  const finish = await b.evaluate(`(() => { const row = document.querySelector('.sheet tbody tr:nth-child(6)'), line = row.querySelector('.text span'), before = getComputedStyle(line).whiteSpace; row.click();
    return { cells: document.querySelectorAll('.finish-map svg rect[width="18.4"]').length, share: document.querySelector('.finish-head p').textContent, before, open: row.classList.contains('open'), after: getComputedStyle(line).whiteSpace }; })()`);
  t.expect(finish.cells === 148 && new RegExp(`양품 ${sheet.good}개`).test(finish.share) && /수율 \d+%/.test(finish.share) && finish.before === 'nowrap' && finish.open && finish.after === 'normal',
    'the end of a run shows the wafer map and the yield; each process is one line, and a click on it shows all it did', JSON.stringify(finish));
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

  landed = await clickOn(b, '#to-line', 2500);
  const lineAgain = await b.evaluate(`({ mode: ${PL}.mode, back: !document.getElementById('line-back').hidden, start: !document.getElementById('line-start').hidden })`);
  t.expect(landed && lineAgain.mode === 'line' && lineAgain.back && lineAgain.start, 'the title shows the line again, with the way back to the process in hand', JSON.stringify(lineAgain));
  landed = await clickOn(b, '#line-back', 1500); page = await bench();
  t.expect(landed && page.title === '웨이퍼 제조' && page.records === 1, 'and that way leads back to it', JSON.stringify(page));
}

/**
 * The same route with the equipment on: a click on a process opens its equipment at once, the process in hand can be
 * done again on the same wafer or passed by the standard recipe, and an earlier process of the run can be gone back to.
 */
async function processFlow(t) {
  const b = await t.open({ width: 1600, height: 1000 }), S = `${PL}.sim.state`;
  await b.goto(`${pageUrl('process-lab')}?seed=5`);
  if (!(await reached(b, `!!${PL}`, 30000))) throw new Error('the page did not start');
  await sleep(1200); await watchClicks(b);
  const at = () => b.evaluate(`({ mode: ${PL}.mode, equipment: ${PL}.station ? ${PL}.station.equipment : null, at: ${PL}.run ? ${PL}.run.at : -1, start: ${PL}.run ? ${PL}.run.start : -1, records: ${PL}.run ? ${PL}.run.records.length : 0,
    redo: !!document.getElementById('redo-here'), fresh: !!document.getElementById('start-here') })`);
  const opens = equipment => reached(b, `${PL}.mode === 'station' && !!${PL}.station && ${PL}.station.equipment === '${equipment}' && Object.keys(${PL}.scene.parts).length > 5`, 30000);
  t.expect(await b.evaluate(`${PL}.mode === 'line' && !${PL}.run && !document.getElementById('line-start').hidden && document.getElementById('redo').hidden && document.getElementById('skip').hidden`), 'with nothing in hand the lab shows its line of equipment');

  const etcher = await onMachine(b, 'etch');
  if (etcher) await b.click(etcher, 500);
  const opened = Boolean(etcher) && await opens('etch'), flying = opened && await b.evaluate(`${PL}.scene.gliding`);
  const dials = () => b.evaluate(`JSON.stringify(${PL}.sim.state.controls)`), before = opened ? await dials() : '';
  if (flying) { await b.click(etcher, 60); await b.wheel(etcher, -100); await sleep(200); }       // a second press and a wheel notch while the camera is on its way: a double click, an impatient hand
  const still = flying && await b.evaluate(`${PL}.scene.gliding`);
  const arrived = opened && await reached(b, `!${PL}.scene.gliding && ${PL}.scene.active === 'etch'`, 120000);
  const top = await b.evaluate(`({ redo: !document.getElementById('redo').hidden, skip: !document.getElementById('skip').hidden, start: ${PL}.run ? ${PL}.run.start : -1 })`);
  t.expect(opened && flying && arrived && top.start === 3 && top.redo && top.skip, 'a click on a machine of the line opens that equipment at once, and the camera flies to it', JSON.stringify({ ...top, found: Boolean(etcher), opened, flying, arrived }));
  const there = arrived ? await b.evaluate(`(() => { const s = ${PL}.scene, c = document.getElementById('scene'), p = s.project(0, 1, 0); return { x: Math.round(p.x), y: Math.round(p.y), width: c.clientWidth, height: c.clientHeight }; })()`) : null;
  t.expect(still && there && there.x > 0 && there.x < there.width && there.y > 0 && there.y < there.height && (await dials()) === before,
    'a second press and a wheel notch during the flight do not stop it or work a control: the camera arrives with the machine in the picture', JSON.stringify({ still, there }));
  let landed = opened;
  const step = await b.evaluate(`(() => { const r = document.querySelector('.stop:nth-child(4)').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await b.mouse('mouseMoved', { x: step.x - 4, y: step.y }); await sleep(200); await b.mouse('mouseMoved', step); await sleep(900);
  const pop = await b.evaluate(`(() => { const box = document.getElementById('route-pop'); return { shown: !box.hidden, text: box.innerText, picture: !!box.querySelector('svg') }; })()`);
  t.expect(pop.shown && pop.picture && /산화막을 깎아/.test(pop.text), 'under the pointer a step of the route shows the wafer as it leaves that process and says what the process does', JSON.stringify(pop));
  await b.mouse('mouseMoved', { x: 500, y: 640 }); await sleep(400);
  t.expect(await b.evaluate(`document.getElementById('route-pop').hidden`), 'and puts it away when the pointer leaves');
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

  // out to the line with the run in hand, and from there to the equipment again
  landed = await clickOn(b, '#to-line', 1200);
  const out = landed && await reached(b, `${PL}.mode === 'line' && !${PL}.scene.gliding`, 120000);
  const offered = await b.evaluate(`({ back: !document.getElementById('line-back').hidden, start: !document.getElementById('line-start').hidden, redo: document.getElementById('redo').hidden, hud: getComputedStyle(document.getElementById('hud')).display })`);
  t.expect(out && offered.back && offered.start && offered.redo && offered.hud === 'none', 'the title takes the camera back out to the line, which offers the way back to the process in hand', JSON.stringify(offered));
  await sleep(2500); await t.shot('3-line-in-hand');
  landed = await clickOn(b, '#line-back', 1200);
  const again = landed && await opens('prober') && await reached(b, `!${PL}.scene.gliding && ${PL}.scene.active === 'prober'`, 120000); page = await at();
  t.expect(again && page.mode === 'station' && page.at === 6 && page.records === 6, 'and from the line the camera returns to the equipment in hand, the run as it was', JSON.stringify(page));
}

/** Opens the 8-process lab at a process that has equipment, and returns helpers for checking that equipment. */
async function openProcess(t, id) {
  const b = await t.open({ width: 1600, height: 1000 }), S = `${PL}.sim.state`;
  await b.goto(`${pageUrl('process-lab')}?seed=5&start=${id}`);
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
    /**
     * Waits until the 3D view stands still. Panels that open or close move it, and a point taken before that no longer holds.
     * Still means: the same place three times running, each time at least two frames after the time before. Counting frames
     * and not seconds matters: the page lays its panels out on a frame, and a slow display can go a second without one, so
     * two looks a moment apart can agree before anything has begun to move.
     */
    settle: async () => {
      const look = async () => JSON.parse(await b.evaluate(`JSON.stringify({ frames: ${PL}.frames, at: ${PL}.scene.project(0, 1, 0) })`));
      let last = await look(), same = 0;
      for (let i = 0; i < 160 && same < 3; i++) {
        await sleep(200);
        const now = await look();
        if (now.frames - last.frames < 2) continue;
        same = Math.hypot(now.at.x - last.at.x, now.at.y - last.at.y) < 0.3 ? same + 1 : 0; last = now;
      }
      return same >= 3;
    },
    /** The process instruments: whether they are up, the heading of each tile, how many charts have a line, and the room they take from the 3D view. */
    strip: () => b.evaluate(`(() => { const d = ${PL}; return { open: d.panels.strip, titles: [...document.querySelectorAll('#tiles .tile h3')].map(h => h.innerText.replace(/\\s+/g, ' ').trim()), lines: document.querySelectorAll('#tiles .plot svg polyline').length,
      bottom: parseFloat(getComputedStyle(document.getElementById('stage')).getPropertyValue('--inset-bottom')) || 0 }; })()`),
    /** The metrology report as it reads: verdict, each criterion in one line, whether it has a figure, how many notes, the way on. */
    report: () => b.evaluate(`(() => { const d = ${PL}, box = document.getElementById('report'), flat = e => e ? e.innerText.replace(/\\s+/g, ' ').trim() : '';
      return { open: d.panels.report, verdict: flat(box.querySelector('.verdict')), criteria: [...box.querySelectorAll('.criteria .crit')].map(flat), figure: !!box.querySelector('figure svg'), notes: box.querySelectorAll('.notes li').length,
        next: flat(box.querySelector('#report-next')), stray: /object|null|undefined|NaN/.test(box.innerText) }; })()`),
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
  let speed = await lab.at(L.dials.speed), dopant = await lab.at(L.dials.dopant);
  await b.drag(line(dopant, { x: dopant.x + 145, y: dopant.y }, 12)); await sleep(400);
  s = await state(); t.expect(Math.abs(s.dopant - 2.9) < 1e-9, 'the boron dial is set before the seed goes in', `${s.dopant} mg`);
  const seed = await lab.part('seed');
  await b.drag(line(seed, { x: seed.x, y: seed.y + 240 }, 12)); await sleep(500);
  s = await state(); t.expect(s.target === 1, 'pulling the seed down sends it into the melt', `target ${s.target}`);
  t.expect(await lab.fast(`${S}.attached`, 300, 60000), 'the seed touches the melt');
  // The process instruments come up now and the 3D view moves into the room that is left: the dials are elsewhere on the screen.
  await lab.settle(); speed = await lab.at(L.dials.speed); dopant = await lab.at(L.dials.dopant);
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
  // While the crystal grows the process instruments are up: four charts, each with its value under the pointer.
  const strip = await b.evaluate(`(() => { const d = ${PL}; return { ...d.panels, titles: [...document.querySelectorAll('#tiles .tile h3')].map(h => h.innerText.replace(/\\s+/g, ' ').trim()), lines: document.querySelectorAll('#tiles .plot svg polyline').length,
    bottom: parseFloat(getComputedStyle(document.getElementById('stage')).getPropertyValue('--inset-bottom')) || 0 }; })()`);
  t.expect(strip.strip && strip.tiles === 4 && strip.lines === 4 && strip.bottom > 100 && /^지름 30\d mm/.test(strip.titles[0]) && /^인상 속도 \d/.test(strip.titles[1]) && /^용융액 1,4\d\d °C/.test(strip.titles[2]) && /^비저항 \d+\.\d Ω·cm/.test(strip.titles[3]),
    'while the crystal grows the process instruments are up (diameter, pull speed, melt temperature, resistivity) and the 3D view makes room for them', JSON.stringify(strip));
  const chart = await b.evaluate(`(() => { const r = document.querySelector('#tiles .tile:nth-child(1) .plot').getBoundingClientRect(); return { x: r.left + r.width * 0.6, y: r.top + r.height / 2 }; })()`);
  await b.mouse('mouseMoved', { x: chart.x - 3, y: chart.y }); await sleep(200); await b.mouse('mouseMoved', chart); await sleep(700);
  const tip = await b.evaluate(`document.getElementById('viz-tip').hidden ? '' : document.getElementById('viz-tip').innerText.replace(/\\n+/g, ' | ')`);
  t.expect(/mm 지점/.test(tip) && /지름/.test(tip), 'a chart of the instruments shows its value under the pointer', tip);
  await b.mouse('mouseMoved', { x: 300, y: 300 }); await sleep(300);

  // out of the melt and measured
  const hanging = await lab.part('seed');
  await b.drag(line(hanging, { x: hanging.x, y: hanging.y - 220 }, 12)); await sleep(500);
  s = await state(); t.expect(s.target === 0 && s.ended, 'pulling the seed up takes the crystal off the melt', JSON.stringify({ target: s.target, ended: s.ended }));
  t.expect(await lab.fast(`${PL}.sim.canMeasure()`, 300, 60000), 'the crystal is lifted out');
  await sleep(700);
  const landed = await clickOn(b, '#guide-action', 900);
  s = await state(); shown = await lab.monitor();
  t.expect(landed && s.result && s.result.valid && s.result.ok && s.result.necked && Math.abs(s.result.rho - 10) < 1 && /계측값/.test(shown.note), 'the crystal is measured: a body in range, a neck, and the resistivity the run sheet asks for', JSON.stringify(s.result));
  await sleep(900);
  const report = await b.evaluate(`(() => { const d = ${PL}, box = document.getElementById('report'), flat = e => e ? e.innerText.replace(/\\s+/g, ' ').trim() : '';
    return { ...d.panels, verdict: flat(box.querySelector('.verdict')), criteria: [...box.querySelectorAll('.criteria .crit')].map(flat), figure: !!box.querySelector('figure svg'), notes: box.querySelectorAll('.notes li').length, next: flat(box.querySelector('#report-next')),
      right: parseFloat(getComputedStyle(document.getElementById('stage')).getPropertyValue('--inset-right')) || 0, stray: /object|null|undefined|NaN/.test(box.innerText) }; })()`);
  t.expect(report.report && !report.strip && /합격/.test(report.verdict) && report.criteria.length === 3 && report.criteria.every(c => /통과|전위 없음/.test(c)) && report.figure && report.notes >= 1 && report.next === '다음: 산화' && report.right > 300 && !report.stray,
    'the measurement opens the report: the verdict, each criterion against its limit, the crystal in side view, what the result means and the way on', JSON.stringify(report));
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
  await lab.settle();                                             // the process instruments have come up, and the 3D view has moved into the room that is left
  const strip = await lab.strip();
  t.expect(strip.open && strip.titles.length === 3 && /^산화막/.test(strip.titles[0]) && /^성장 속도/.test(strip.titles[1]) && /^튜브/.test(strip.titles[2]) && strip.bottom > 100,
    'with the boat in the tube the process instruments are up: the film, its growth rate and the tube temperature', JSON.stringify(strip));

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
  await sleep(900); const report = await lab.report(), lines = (await lab.strip()).lines;
  t.expect(report.open && /합격/.test(report.verdict) && report.criteria.length === 1 && /평균 두께/.test(report.criteria[0]) && /통과/.test(report.criteria[0]) && report.figure && report.notes >= 1 && report.next === '다음: 포토' && !report.stray && lines === 3,
    'the measurement opens the report: the verdict, the mean against its limits, the five places on the wafer, what the result means and the way on', JSON.stringify({ ...report, lines }));
  await t.shot('2-measured');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 2 && measured && Math.abs(next.wafer.oxide - measured.mean) < 1e-9 && next.record.by === 'operator' && next.record.ok, 'the measured film goes on to the next process on the same wafer', JSON.stringify(next.record));
}

async function processPhoto(t) {
  const { b, lab } = await openProcess(t, 'photo'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ phase: s.phase, spin: s.controls.spin, dose: s.controls.dose, focus: s.controls.focus, best: s.bestFocus, thickness: s.thickness, reworks: s.reworks, result: s.result && { opening: s.result.opening, ok: s.result.ok } })`);
  const press = async name => { await lab.settle(); await b.click(await lab.at(L.buttons[name]), 450); };     // the instruments and the report move the 3D view when they open or close
  await lab.cards();
  let s = await state();
  t.expect(s.phase === 'bare' && s.thickness === 0, 'the cell starts with a bare wafer on the coater', JSON.stringify(s));
  await press('expose'); await sleep(500);
  t.expect((await state()).phase === 'bare' && /먼저 감광막/.test(await lab.guide()), 'exposure is refused before the resist is on, and the page says why', await lab.guide());

  // first pass with the dials as they stand: this wafer's best focus is not at zero, so the opening misses
  await press('coat');
  t.expect(await lab.fast(`${S}.phase === 'coated'`, 96), 'the coat button spins the resist on and bakes it');
  s = await state(); t.expect(Math.abs(s.thickness - 1000) < 1, 'at 4,000 rpm the resist is 1,000 nm thick', `${s.thickness} nm`);
  await lab.settle(); const strip = await lab.strip();
  t.expect(strip.open && strip.titles.length === 4 && /^회전수/.test(strip.titles[0]) && /^감광막 1,000 nm/.test(strip.titles[1]) && /^노광한 칸 0/.test(strip.titles[2]) && /^창 가운데의 노광량 \d\.\d\d 배/.test(strip.titles[3]) && strip.lines === 4 && strip.bottom > 100,
    'from the coat on the process instruments are up: spin speed, resist thickness, exposed fields, and the image across the window against what clears the resist', JSON.stringify(strip));
  await press('expose'); await lab.fast(`${S}.phase === 'exposed'`, 96); await press('develop');
  t.expect(await lab.fast(`${S}.phase === 'developed'`, 96), 'expose and develop run in turn and the opening is measured');
  s = await state();
  t.expect(s.result && !s.result.ok && /재작업/.test(await lab.guide()), 'with the dials untouched the opening misses the target, and the page offers the rework', JSON.stringify(s.result));
  await sleep(1200); let report = await lab.report();
  t.expect(report.open && /불합격/.test(report.verdict) && report.criteria.length === 2 && /무늬 창이 열림 .*통과/.test(report.criteria[0]) && /창 너비 [\d,]+ nm .*(좁음|넓음)/.test(report.criteria[1]) && report.figure && report.notes === 2 && report.next === '다음: 식각' && !report.stray,
    'the measurement opens the report: failed, the opening against its limits, the image across the window, why it missed and that it can be done again', JSON.stringify(report));
  await t.shot('1-first-pass');
  await press('strip'); await sleep(900);
  s = await state(); report = await lab.report(); t.expect(s.phase === 'bare' && s.reworks === 1 && !s.result && !report.open, 'the rework button strips the resist for another try, and the report of the stripped pattern goes away', JSON.stringify({ ...s, report: report.open }));

  // second pass: dose by dragging its dial, focus by the wheel, read from the wafer monitor before exposing
  await press('coat'); await lab.fast(`${S}.phase === 'coated'`, 96); await lab.settle();
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
  await sleep(1200); report = await lab.report();
  t.expect(report.open && /합격/.test(report.verdict) && report.criteria.every(line => /통과/.test(line)) && report.figure && report.next === '다음: 식각' && !report.stray, 'and the report of the second try passes it', JSON.stringify(report));
  await t.shot('4-report');
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
  let power = await lab.at(L.dials.power), pressure = await lab.at(L.dials.pressure);
  await b.drag(line(power, { x: power.x + 150, y: power.y }, 12)); await sleep(500);
  s = await state(); t.expect(s.chf3 && s.power === 300 && !s.plasma, 'gas and power do not strike a plasma while the wafer is outside', JSON.stringify(s));
  await b.click(await lab.at(L.buttons.load), 400);
  t.expect(await reached(b, `${S}.plasma`, 30000), 'with the wafer in and the door shut the plasma strikes');
  await lab.settle(); power = await lab.at(L.dials.power); pressure = await lab.at(L.dials.pressure);          // the process instruments have come up and the 3D view has moved
  const strip = await lab.strip();
  t.expect(strip.open && strip.titles.length === 3 && /^종점 신호/.test(strip.titles[0]) && /^뚫린 면적/.test(strip.titles[1]) && /^가운데 창의 산화막/.test(strip.titles[2]) && strip.bottom > 100,
    'with the wafer in the chamber the process instruments are up: the endpoint light, the share that is through, the oxide left at the centre', JSON.stringify(strip));
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
  const report = await lab.report();
  t.expect(report.open && /합격/.test(report.verdict) && report.criteria.length === 3 && /뚫린 면적 100% .*모두 뚫림/.test(report.criteria[0]) && /실리콘 깎임/.test(report.criteria[1]) && /창 너비/.test(report.criteria[2]) && report.criteria.slice(1).every(line => /통과/.test(line))
    && report.figure && report.notes >= 1 && report.next === '다음: 증착·이온주입' && !report.stray && !(await lab.strip()).open,
    'the measurement opens the report: the verdict, the three criteria against their limits, the windows from centre to edge, what the result means and the way on', JSON.stringify(report));
  await t.shot('2-measured');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 4 && next.record.by === 'operator' && next.record.ok && next.wafer.window.open && s.result && Math.abs(next.wafer.window.width - s.result.width) < 1e-9 && !next.wafer.resist, 'the window goes on to the next process on the same wafer', JSON.stringify(next.record));
}

async function processImplant(t) {
  const { b, lab } = await openProcess(t, 'deposition'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ phase: s.phase, field: s.controls.field, current: s.current, scanning: !!s.scan, scanned: s.spectrum.length, energy: s.controls.energy, dose: s.controls.dose, temperature: s.controls.temperature, minutes: s.controls.minutes, counted: s.counted, beam: s.beam, hot: s.hot, anneals: s.anneals.length, result: s.result && { junction: s.result.junction, surface: s.result.surface, ok: s.result.ok, masked: s.result.masked } })`);
  const press = async name => { await lab.settle(); await b.click(await lab.at(L.buttons[name]), 450); };     // the instruments and the report move the 3D view when they open or close
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
  // 8 s of process time at 1x: the page never takes more than 0.05 s a frame, so that is 160 frames, about a minute at 3 frames a second
  t.expect(await lab.fast(`!${S}.scan && ${S}.spectrum.length > 1000`, 1, 150000), 'the scan records the beam current over the whole field');
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
  await lab.settle(); const strip = await lab.strip();
  t.expect(strip.open && strip.titles.length === 4 && /^빔 전류 \d\.\d\d mA/.test(strip.titles[0]) && /^넣은 양 \d+ %/.test(strip.titles[1]) && /^웨이퍼 온도 25 °C/.test(strip.titles[2]) && /^접합 깊이/.test(strip.titles[3]) && strip.bottom > 100,
    'from the implant on the process instruments are up: beam current, the dose counted, the wafer temperature, and the phosphorus against depth', JSON.stringify(strip));
  await sleep(1500); await t.shot('2-implanting');
  t.expect(await lab.fast(`${S}.phase === 'implanted'`, 240), 'the beam stops when the dose on the dial has been counted');
  s = await state(); t.expect(Math.abs(s.counted - 1e15) < 1e9 && !s.beam, 'the wafer holds the dose that was set', `${s.counted}`);
  await press('implant'); await sleep(500);
  t.expect((await state()).phase === 'implanted' && /되돌릴 수 없/.test(await lab.guide()), 'a second implant is refused: implantation cannot be undone', await lab.guide());

  // a short anneal leaves the junction too shallow; a second anneal adds to it
  await lab.settle(); let temperature = await lab.at(L.dials.temperature), minutes = await lab.at(L.dials.minutes);
  await b.drag(line(temperature, { x: temperature.x + 50, y: temperature.y }, 12)); await sleep(300);
  s = await state(); t.expect(s.temperature === 950 && s.minutes === 10, 'the anneal temperature is set on its dial', JSON.stringify(s));
  await press('anneal');
  t.expect(await reached(b, `${S}.hot === 950`, 30000), 'the anneal button moves the wafer under the lamps and heats it');
  await sleep(1500); await t.shot('3-annealing');
  t.expect(await lab.fast(`${S}.phase === 'done'`, 1200), 'the anneal ends after the time on the dial and the junction is measured');
  s = await state(); const first = s.result, offered = await lab.guide();
  t.expect(first && !first.ok && first.junction < 250 && /더 할 수 있/.test(offered), 'ten minutes leave the junction too shallow, and the page says the anneal can be repeated', `${JSON.stringify(first)} | ${offered}`);
  await sleep(1200); let report = await lab.report();
  t.expect(report.open && /불합격/.test(report.verdict) && report.criteria.length === 3 && /접합 깊이 \d+ nm .*얕음/.test(report.criteria[0]) && /표면 농도/.test(report.criteria[1]) && /들어간 곳 창 안에만 .*통과/.test(report.criteria[2]) && report.figure && report.notes >= 1 && report.next === '다음: 금속배선' && !report.stray,
    'the measurement opens the report: failed for a shallow junction, with the phosphorus against depth and the word that the anneal can be repeated', JSON.stringify(report));
  await lab.settle(); minutes = await lab.at(L.dials.minutes);                                                // the report has moved the 3D view
  await b.drag(line(minutes, { x: minutes.x + 50, y: minutes.y }, 12)); await sleep(300);
  s = await state(); t.expect(s.minutes === 20, 'the anneal time is set on its dial', `${s.minutes} min`);
  await press('anneal');
  t.expect(await lab.fast(`${S}.phase === 'done' && ${S}.anneals.length === 2`, 1200), 'a second anneal runs on the same wafer');
  s = await state(); const shown = await lab.monitor();
  t.expect(s.result && s.result.ok && s.result.junction > first.junction + 30 && s.result.surface >= 1e19 && /계측값/.test(shown.note) && Math.abs(shown.value - s.result.junction) < 1, 'the two anneals add up: the junction is deeper, inside the target, and the surface is doped enough', JSON.stringify(s.result));
  t.expect(Math.abs(s.result.junction - tuned.value) > 20, 'the first outlook was for the dials as they stood then (ten minutes at 900 C), not for what was done', `outlook ${tuned.value}, measured ${s.result.junction.toFixed(0)} nm`);
  await sleep(1200); report = await lab.report();
  t.expect(report.open && /합격/.test(report.verdict) && !/불합격/.test(report.verdict) && report.criteria.every(line => /통과/.test(line)) && report.figure && !report.stray, 'and the report of the two anneals together passes it', JSON.stringify(report));
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
  let current = await lab.at(L.dials.current), rotation = await lab.at(L.dials.rotation);
  await b.drag(line(current, { x: current.x + 200, y: current.y }, 12)); await sleep(1200);
  s = await state(); t.expect(s.current === 20 && !s.plating && s.thickness === 0, 'with the wafer out of the bath the current has nowhere to flow', JSON.stringify(s));

  const up = await lab.at(L.grip.up);
  await b.drag(line(up, { x: up.x, y: up.y + 220 }, 12)); await sleep(500);
  s = await state(); t.expect(s.target === 1, 'pulling the head down turns the wafer over and sends it into the bath', `target ${s.target}`);
  t.expect(await lab.fast(`${S}.plating && ${S}.thickness > 40`, 16, 60000), 'once the wafer is in the bath the copper starts to grow');
  await lab.settle(); current = await lab.at(L.dials.current); rotation = await lab.at(L.dials.rotation);    // the process instruments have come up and the 3D view has moved
  const strip = await lab.strip();
  t.expect(strip.open && strip.titles.length === 3 && /^구리 두께/.test(strip.titles[0]) && /^가장자리 − 가운데/.test(strip.titles[1]) && /^가장자리 전류 밀도/.test(strip.titles[2]) && strip.bottom > 100,
    'with the wafer in the bath the process instruments are up: the copper, how much thicker the edge is, the current density at the edge against its limit', JSON.stringify(strip));
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
  await sleep(900); const report = await lab.report();
  t.expect(report.open && /합격/.test(report.verdict) && report.criteria.length === 3 && /가장 얇은 곳/.test(report.criteria[0]) && /가장 두꺼운 곳/.test(report.criteria[1]) && /탄 곳 없음/.test(report.criteria[2]) && report.criteria.every(line => /통과/.test(line))
    && report.figure && report.notes >= 2 && report.next === '다음: 평탄화' && !report.stray,
    'the measurement opens the report: the verdict, the thinnest and the thickest place against the limits, the copper across the wafer, what it means and the way on to the polisher', JSON.stringify(report));
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
  await lab.settle(); const strip = await lab.strip();          // with the wafer on the head the process instruments come up and the 3D view moves
  t.expect(strip.open && strip.titles.length === 3 && /^구리가 덮은 면적 100 %/.test(strip.titles[0]) && /^남은 구리/.test(strip.titles[1]) && /^다운포스/.test(strip.titles[2]) && strip.bottom > 100,
    'with the wafer on the head the process instruments are up: the area still under copper, the copper left, the downforce', JSON.stringify(strip));
  await sleep(1200); const bare = await lab.hover('pedestal');
  t.expect(bare.under === 'pedestal' && bare.shown === '로드 위치', 'with the wafer gone, the load position shows its own card', JSON.stringify(bare));
  // platen, spindle, slurry and conditioner are set by their controls here; dragging them is what the CMP lab's own check does on this same machine
  await set([['platen', 90], ['carrier', 87], ['slurry', 200], ['conditioner', true]]); await until(`${S}.coverage > 0.3 && ${S}.platenRpm > 85`, 4);
  await lab.settle(); const head = await lab.part('head');
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
  await lab.settle(); const up = await lab.part('head');
  await b.drag(line(up, { x: up.x, y: up.y - 240 }, 14)); await sleep(500);
  t.expect(await until(`${S}.gap >= 0.117`, 8, 60000), 'pulling the head up stops the polish and lifts the wafer');
  landed = await clickOn(b, '#guide-action', 1500);
  t.expect(landed && await until(`!!${K}.result`, 4, 60000), 'on the thickness stage the wafer is scanned');
  await sleep(900); s = await state(); const shown = await lab.monitor();
  t.expect(s.where === 'stage' && s.result && s.result.cleared && s.result.ok && s.result.dishing > 0 && s.result.dishing <= 50 && s.result.scratches === 0 && /계측값/.test(shown.note), 'no copper is left over the oxide, the dishing is within the run sheet and there is no scratch', JSON.stringify(s.result));
  const report = await lab.report();
  t.expect(report.open && /합격/.test(report.verdict) && !/불합격/.test(report.verdict) && report.criteria.length === 3 && /남은 구리 .*다 걷힘/.test(report.criteria[0]) && /접시 파임 .*통과/.test(report.criteria[1]) && /스크래치 없음 .*통과/.test(report.criteria[2])
    && report.figure && report.notes >= 1 && report.next === '다음: EDS' && !report.stray && !(await lab.strip()).open,
    'the scan opens the report: no copper left, the dishing against its limit, no scratch, the wafer from above, and the way on', JSON.stringify(report));
  await t.shot('3-scanned');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 6 && next.record.by === 'operator' && next.record.ok && next.wafer.metal && next.wafer.metal.chips.length === 148 && next.wafer.metal.planar && Math.abs(next.wafer.metal.thickness - plated) < 1e-6 && /연마/.test(next.record.text), 'plating and polish go on as one record to the next process, chip by chip', JSON.stringify(next.record));
}

async function processEds(t) {
  const { b, lab } = await openProcess(t, 'eds'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ phase: s.phase, x: s.controls.x, y: s.controls.y, z: s.controls.z, offset: s.offset, contact: s.contact, tested: s.tested, good: s.good, passes: s.passes, queue: s.queue.length, result: s.result && { good: s.result.good, missed: s.result.missed, bins: s.result.bins } })`);
  const press = async name => { await lab.settle(); await b.click(await lab.at(L.buttons[name]), 450); };     // the instruments and the report move the 3D view when they open or close
  const clean = await b.evaluate(`${PL}.flow.defects(${PL}.run.wafer.lot).filter(hit => !hit).length`), total = await b.evaluate(`${PL}.flow.DIE_COUNT`);
  await lab.cards();
  let s = await state(), shown = await lab.monitor();
  t.expect(s.phase === 'setup' && s.tested === 0 && s.z === 20 && /카메라/.test(shown.note) && Math.abs(shown.value - Math.hypot(s.offset.x, s.offset.y)) < 1, 'the prober starts with the needles off the pad centres, as the camera shows', JSON.stringify({ offset: s.offset, shown }));
  await press('contact'); await sleep(900);
  s = await state(); t.expect(s.contact && !s.contact.touching && /닿지 않/.test(await lab.guide()), 'a contact check with the dials untouched finds the needles off the pads', await lab.guide());

  // first pass as it stands: every chip reads open
  await press('probe');
  t.expect(await reached(b, `${S}.phase === 'probing' && ${S}.tested > 3`, 30000), 'the probe button steps the chuck from chip to chip');
  await lab.settle(); const strip = await lab.strip();
  t.expect(strip.open && strip.titles.length === 4 && /^수율/.test(strip.titles[0]) && /^접촉 저항/.test(strip.titles[1]) && /^누설 전류/.test(strip.titles[2]) && /^순방향 전압/.test(strip.titles[3]) && strip.bottom > 100,
    'while the wafer is probed the process instruments are up: the yield, and what the tester measures chip by chip against its limits', JSON.stringify(strip));
  await sleep(600); await t.shot('1-probing');
  t.expect(await lab.fast(`${S}.phase === 'done'`, 240), 'the prober goes through the whole wafer');
  s = await state(); let said = await lab.guide();
  t.expect(s.result && s.result.good === 0 && s.result.bins.contact === total && s.result.missed === clean && new RegExp(`바늘이 제대로 닿지 않아 양품 ${clean}개가 불량으로`).test(said) && /바늘 위치와 오버드라이브/.test(said), 'misaligned, every chip is binned as a contact failure, and the page says that the needles missed the good chips and what to look at', `${JSON.stringify(s.result)} | ${said}`);

  await sleep(1200); let report = await lab.report();
  t.expect(report.open && /불합격/.test(report.verdict) && report.criteria.length === 3 && new RegExp(`검사한 칩 ${total} / ${total} .*통과`).test(report.criteria[0]) && new RegExp(`바늘 접촉 양품 ${clean}개를 불량으로 가림`).test(report.criteria[1]) && /양품 0개/.test(report.criteria[2])
    && report.figure && report.notes >= 2 && report.next === '다음: 패키징' && !report.stray,
    'the test opens the report: failed, because the needles missed every good chip; the wafer map; what to do about it', JSON.stringify(report));
  // align by the camera, raise the overdrive, check the contact, test the failed chips again
  await lab.settle();                                             // the report has moved the 3D view
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
  await sleep(900); report = await lab.report();
  t.expect(report.open && /합격/.test(report.verdict) && !/불합격/.test(report.verdict) && report.criteria.every(line => /통과|있음/.test(line)) && report.figure && !report.stray, 'and the report of the second pass passes the test: no good chip was missed', JSON.stringify(report));
  await t.shot('3-map');
  const next = await lab.handOver();
  t.expect(next.landed && next.viewing === 7 && next.record.by === 'operator' && next.record.ok && next.wafer.tested.good === clean && next.wafer.tested.dies.length === total, 'the map goes on to packaging: only the good chips will be packaged', JSON.stringify(next.record));
}

async function processBond(t) {
  const { b, lab } = await openProcess(t, 'package'), S = lab.S, L = lab.layout;
  const state = () => lab.state(`({ phase: s.phase, power: s.controls.power, force: s.controls.force, time: s.controls.time, wire: s.wire && { diameter: s.wire.diameter, pulled: s.wire.pulled }, onChip: s.onChip, tests: s.tests, at: s.at, passed: s.passed, result: s.result && { chips: s.result.chips, bonded: s.result.bonded, lost: s.result.lost } })`);
  const press = async name => { await lab.settle(); await b.click(await lab.at(L.buttons[name]), 450); };     // the instruments and the report move the 3D view when they open or close
  const good = await b.evaluate(`${PL}.run.wafer.tested.good`);
  await lab.cards();
  let s = await state();
  t.expect(s.phase === 'setup' && !s.wire && s.tests.length === 0 && good > 100, 'the bonder starts with a failed chip under the tool and no wire on it', JSON.stringify(s));
  await press('pull'); await sleep(500);
  t.expect(/먼저 시험 본딩 단추로/.test(await lab.guide()), 'a pull test is refused before there is a wire, and the page names the button that makes one', await lab.guide());

  // a test wire with the dials as they stand: it comes off
  await press('bond');
  t.expect(await reached(b, `${S}.phase === 'bonding'`, 20000), 'the bond button starts a test wire');
  await b.evaluate(`${PL}.scene.setView('work')`); await sleep(2500); await t.shot('1-test-bond');
  await b.evaluate(`${PL}.scene.setView('home', true)`); await sleep(1500);                              // the buttons are out of sight in the close view
  t.expect(await lab.fast(`${S}.phase === 'setup' && !!${S}.wire`, 16, 90000), 'the wire is bonded from the pad to the lead');
  await press('pull');
  t.expect(await lab.fast(`${S}.tests.length === 1`, 16, 90000), 'the pull button pulls it until it gives');
  await sleep(600); s = await state(); let shown = await lab.monitor(), said = await lab.guide();
  t.expect(!s.tests[0].ok && s.tests[0].force < 3 && Math.abs(shown.value - s.tests[0].force) < 0.06 && /계측값/.test(shown.note) && /덜 붙었/.test(said), 'with the dials untouched the wire comes off below the minimum, and the monitor shows where it gave', `${JSON.stringify(s.tests[0])} | ${said}`);

  await lab.settle(); const strip = await lab.strip();
  t.expect(strip.open && strip.titles.length === 3 && /^풀 강도 \d\.\d gf/.test(strip.titles[0]) && /^완성한 칩 0 개/.test(strip.titles[1]) && /^금선 불량 0 개/.test(strip.titles[2]) && strip.bottom > 100,
    'from the first test wire on the process instruments are up: the pull strength against its minimum, chips finished, chips lost', JSON.stringify(strip));
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
  await sleep(600); const report = await lab.report();
  t.expect(report.open && /합격/.test(report.verdict) && !/불합격/.test(report.verdict) && report.criteria.length === 2 && new RegExp(`완성한 칩 ${good} / ${good} .*통과`).test(report.criteria[0]) && /시험 선의 풀 강도 \d\.\d gf .*통과/.test(report.criteria[1])
    && report.figure && report.notes >= 2 && report.next === '다음: 공정 기록' && !report.stray && !(await lab.strip()).open,
    'the end of the run opens the report: every good chip finished, the test wire above the minimum, the wire in side view, and the way to the run sheet', JSON.stringify(report));
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
  await b.goto(`${pageUrl('process-lab')}?seed=5&start=wafer`);
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
  const sheet = await b.evaluate(`({ rows: [...document.querySelectorAll('.sheet tbody tr')].map(row => ({ who: row.querySelector('.state small').textContent, state: row.querySelector('.state').textContent })), chips: ${PL}.run.wafer.packaged.chips, title: document.querySelector('.bench h2').textContent, substrate: ${PL}.run.wafer.substrate.resistivity })`);
  t.expect(sheet.rows.length === 8 && sheet.rows.every(row => row.who === '직접' && /합격/.test(row.state) && !/불합격/.test(row.state)) && sheet.chips === map.good && sheet.title.includes(String(sheet.chips)) && Math.abs(sheet.substrate - 10) < 1, 'the sheet lists eight processes, all operated by hand and all passed, and the chips made from the crystal that was grown', JSON.stringify(sheet));
  await t.shot('1-run-sheet');
}

// ----- the labs in windows of other sizes -----
// Both labs fill the window: the stage takes the height the window has left, the panels lie inside it, and the 3D
// picture is framed in what the panels leave free (applyView in the two scenes). The checks above use a large window.
// These two open a lab in a large window, in the window a small laptop has (a 1366 x 768 or a 1280 x 720 screen less
// the browser's own bars) and at a phone's width, and look at numbers: does the page scroll, do the panels meet, how
// far does the machine run out of the free area. Flights are cut short (reduced motion), since the framing is the subject.
const ANY = '(window.ProcessLabDebug || window.Lab3DDebug)';
/** In the page: the box of the machine in use against what the panels leave free, the frame of the picture, the panels and the page. */
const FIT = `(() => {
  const lab = window.ProcessLabDebug, own = ${ANY}.scene, stage = document.getElementById('stage'), box = stage.getBoundingClientRect();
  const css = name => parseFloat(stage.style.getPropertyValue(name)) || 0, held = own.__held || null;
  const right = held ? held.right : css('--inset-right'), bottom = held ? held.bottom : css('--inset-bottom');
  let min, max, deck = null;
  if (lab) { const st = own.lineLayout.find(entry => entry.name === own.active); if (!st) return null; min = st.min; max = st.max; }
  else { const b = own.box; min = b.min; max = b.max; deck = Math.max(...b.deckFront.map(p => own.project(p[0], p[1], p[2]).y)); }   // of the polisher the deck has to stay clear; its cabinet may go under a panel
  let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
  for (let i = 0; i < 8; i++) { const p = own.project(i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]); l = Math.min(l, p.x); r = Math.max(r, p.x); t = Math.min(t, p.y); b = Math.max(b, p.y); }
  const w = box.width, h = box.height, rect = id => { const n = document.getElementById(id); if (!n || n.hidden) return null; const q = n.getBoundingClientRect(); return q.width ? { top: q.top - box.top, bottom: q.bottom - box.top, left: q.left - box.left, right: q.right - box.left } : null; };
  const strip = document.getElementById('strip'), edge = strip.getBoundingClientRect();
  const spill = strip.dataset.open !== 'true' ? 0 : Math.max(0, ...[...strip.querySelectorAll('.tile *')].map(n => { const q = n.getBoundingClientRect(); return q.width && q.height ? q.bottom - edge.bottom : 0; }));
  return { stage: [Math.round(w), Math.round(h)], frame: own.frame, out: { left: Math.round(-l), top: Math.round(-t), right: Math.round(r - (w - right)), bottom: Math.round((deck ?? b) - (h - bottom)) },
    wider: document.documentElement.scrollWidth - innerWidth, longer: document.documentElement.scrollHeight - innerHeight, monitor: rect('monitor'), strip: rect('strip'), guide: rect('guide-text'), spill: Math.round(spill) };
})()`;
/** The frame of the picture holds still over three looks: the panels are where they belong and the picture has followed. */
async function framed(b) {
  let last = '', same = 0;
  for (let i = 0; i < 60 && same < 3; i++) { await sleep(450); const now = await b.evaluate(`JSON.stringify(${ANY}.scene.frame)`); same = now === last ? same + 1 : 0; last = now; }
  return b.evaluate(FIT);
}
/** Tells the scene that a report covers the right of the view, without the page having one: the page's own word is kept out until released. */
const holdInsets = (b, insets) => b.evaluate(`(() => { const s = ${ANY}.scene; if (!s.__real) s.__real = s.setInsets; s.setInsets = () => {}; s.__held = ${JSON.stringify(insets)}; s.__real(s.__held); })()`);
const releaseInsets = b => b.evaluate(`(() => { const s = ${ANY}.scene; if (s.__real) { s.setInsets = s.__real; delete s.__real; delete s.__held; } })()`);
/** What is wrong with a framing under panels, in words. `bare` is the same machine with no panel open: a side its home view cuts on purpose may stay cut as far. */
function fitFaults(now, bare) {
  const faults = [];
  if (now.wider > 0 || now.longer > 0) faults.push(`the page is ${Math.max(0, now.wider)} px wider and ${Math.max(0, now.longer)} px longer than the window`);
  if (now.monitor && now.strip && now.monitor.bottom > now.strip.top - 2) faults.push(`the monitor ends ${Math.round(now.monitor.bottom - now.strip.top)} px under the top of the instruments`);
  if (now.spill > 1) faults.push(`a tile of the instruments runs ${now.spill} px out of their strip`);
  for (const side of ['left', 'top', 'right', 'bottom']) if (now.out[side] > Math.max(0, bare.out[side]) + 3) faults.push(`its ${side} is ${now.out[side]} px outside what is free (${bare.out[side]} with no panel)`);
  return faults;
}
const untouched = frame => Math.abs(frame.x) < 1 && Math.abs(frame.y) < 1 && Math.abs(frame.scale - 1) < 0.003;
const WINDOWS = [[1600, 1000], [1366, 633], [1280, 552]];
const NARROW = `(() => { const title = document.querySelector('.title h1').getBoundingClientRect(); return { wider: document.documentElement.scrollWidth - innerWidth, longer: document.documentElement.scrollHeight - innerHeight, title: Math.round(title.height), bar: Math.round(document.querySelector('.topbar').getBoundingClientRect().height) }; })()`;
/** The three states of one machine in the window as it is: no panel, the instruments, the instruments and a report. Returns what is wrong, by state. */
async function fitStates(b, openStrip) {
  const bare = await framed(b); if (!bare) return { bare: ['no machine is in use'] };
  const wrong = { bare: untouched(bare.frame) && bare.wider <= 0 && bare.longer <= 0 ? [] : [`with no panel the picture is moved or the page scrolls: ${JSON.stringify({ frame: bare.frame, wider: bare.wider, longer: bare.longer })}`] };
  await b.evaluate(openStrip); await sleep(900);
  const strip = await framed(b); wrong.strip = fitFaults(strip, bare);
  await holdInsets(b, { right: 418, bottom: (strip.stage[1] - strip.strip.top) });
  wrong.both = fitFaults(await framed(b), bare);
  await releaseInsets(b);
  return wrong;
}
const faultList = found => Object.entries(found).flatMap(([name, by]) => Object.entries(by).flatMap(([state, faults]) => faults.map(fault => `${name}, ${state}: ${fault}`)));

/**
 * Shows the card of every part that is in the picture, one after the other, as the pointer over the part would, and
 * returns the cards that are cut by the edge of what the panels leave free (a card taller than that: by the edge of the
 * stage) or that lie over the monitor. `D`: the page's
 * debug object (its parts, its scene, point()).
 */
const cardFaults = (b, D) => b.evaluate(`(async () => {
  const d = ${D}, stage = document.getElementById('stage'), frames = n => new Promise(done => { const tick = () => (n-- > 0 ? requestAnimationFrame(tick) : done()); tick(); });
  const covered = name => parseFloat(stage.style.getPropertyValue(name)) || 0, faults = [];
  let shown = 0;
  for (const name of Object.keys(d.parts)) {
    const at = d.scene.screenOf(name); if (!at || !at.visible) continue;
    d.point(name); await frames(3);
    const box = document.getElementById('callout'); if (box.hidden) continue;
    shown++;
    const all = stage.getBoundingClientRect(), free = { left: all.left, top: all.top, right: all.right - covered('--inset-right'), bottom: all.bottom - covered('--inset-bottom') };
    const card = box.firstElementChild.getBoundingClientRect(), monitor = document.getElementById('monitor').getBoundingClientRect();
    const floor = card.height + 16 <= free.bottom - free.top ? free.bottom : all.bottom;                // a card too tall for what the instruments leave free may lie over them, not out of the stage
    const out = Math.max(free.left - card.left, card.right - free.right, free.top - card.top, card.bottom - floor);
    if (out > 1) faults.push(name + ': ' + Math.round(out) + ' px of its card (' + Math.round(card.height) + ' px high) outside');
    else if (card.left < monitor.right && card.right > monitor.left && card.top < monitor.bottom && card.bottom > monitor.top) faults.push(name + ': its card lies over the monitor');
  }
  d.point(null); await frames(2);
  return { shown, faults };
})()`);

/** The longest sentences a machine says after a measurement, about as long as they get: the guide has to hold them in a low window too. */
const LONG_GUIDE = '창이 웨이퍼 면적의 62%에서만 뚫렸습니다. 가운데 쪽 창 바닥에 산화막이 최대 118 nm 남았습니다. 감광막을 벗겨서 다시 깎을 수는 없습니다. 바늘 위치와 오버드라이브를 확인하면 불량 칩만 다시 검사할 수 있습니다.';
/** In the page: where the guide lies among the other panels of the stage, and what it lies over. */
const GUIDE = `(() => { const stage = document.getElementById('stage').getBoundingClientRect(), box = selector => { const q = document.querySelector(selector).getBoundingClientRect(); return { left: q.left - stage.left, right: q.right - stage.left, top: q.top - stage.top, bottom: q.bottom - stage.top }; };
  const guide = box('.guide'), strip = box('#strip'), meets = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  return { height: Math.round(guide.bottom - guide.top), width: Math.round(guide.right - guide.left), faults: [guide.top < 0 ? 'it runs ' + Math.round(-guide.top) + ' px out of the top of the stage' : '', meets(guide, box('#monitor')) ? 'it lies over the monitor' : '',
    meets(guide, box('.views')) ? 'it lies over the view buttons' : '', document.getElementById('strip').dataset.open === 'true' && guide.bottom > strip.top + 1 ? 'it lies over the instruments' : ''].filter(Boolean) }; })()`;

async function labFit(t) {
  const b = await t.open({ width: 1600, height: 1000, room: [1760, 1140] });
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const [width, height] of WINDOWS) {
    await b.viewport(width, height);
    await b.goto(`${pageUrl('lab-3d')}?seed=11`);
    if (!(await reached(b, `!!(${LAB} && ${LAB}.scene)`, 60000))) throw new Error('the 3D tool did not start');
    await sleep(2500);
    const found = { polisher: await fitStates(b, `${LAB}.setStrip('open')`) }, faults = faultList(found);
    t.expect(!faults.length, `${width} x ${height}: the page does not scroll, the panels lie apart, and under them the polisher keeps its deck clear and its top in the picture`, faults.join(' | '));
    if (height < 700) await t.shot(`${width}x${height}-instruments`);
    await b.evaluate(`${LAB}.setStrip('open')`); await framed(b);
    const cards = await cardFaults(b, LAB);
    t.expect(cards.shown >= 10 && !cards.faults.length, `${width} x ${height}: the card of every part is whole beside the instruments, and none lies over the film monitor (${cards.shown} cards)`, cards.faults.join(' | '));
  }
  await b.viewport(390, 844);
  await b.goto(`${pageUrl('lab-3d')}?seed=11`);
  if (!(await reached(b, `!!(${LAB} && ${LAB}.scene)`, 60000))) throw new Error('the 3D tool did not start at a phone\'s width');
  await sleep(2500); await b.evaluate(`${LAB}.setStrip('open')`); await sleep(1500);
  const narrow = await b.evaluate(NARROW);
  t.expect(narrow.wider <= 0 && narrow.title < 34, 'at a phone\'s width the page is no wider than the window and its title stays on one line', JSON.stringify(narrow));
  await t.shot('390x844');
}

async function processFit(t) {
  const b = await t.open({ width: 1600, height: 1000, room: [1760, 1140] });
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const [width, height] of [WINDOWS[0], WINDOWS[2]]) {
    await b.viewport(width, height);
    await b.goto(pageUrl('process-lab'));
    if (!(await reached(b, `!!${PL}`, 60000))) throw new Error('the page did not start');
    await sleep(3000);
    const line = await b.evaluate(NARROW);
    t.expect(line.wider <= 0 && line.longer <= 0, `${width} x ${height}: the line fits the window, the page does not scroll`, JSON.stringify(line));
    const found = {}, steps = await b.evaluate(`${PL}.flow.STEPS.length`), cut = [], tall = [], said = [];
    let seen = 0;
    for (let i = 0; i < steps; i++) {
      await b.evaluate(`${PL}.start(${i})`); await sleep(600);
      const name = await b.evaluate(`${PL}.mode === 'station' ? ${PL}.scene.active : null`);
      if (!name) { found[`process ${i + 1}`] = { bare: ['its machine did not open'] }; continue; }
      found[name] = await fitStates(b, `${PL}.setStrip('open')`);
      if (name === 'oxidation') { await b.evaluate(`${PL}.setStrip('open')`); await framed(b); await t.shot(`${width}x${height}-furnace`); }   // the tallest machine under the instruments
      if (height < 700) {                                                                       // the low window: the cards of the parts, from the front and at the control panel, beside the instruments
        await b.evaluate(`${PL}.setStrip('open')`); await framed(b);
        for (const view of ['home', 'panel']) {
          if (!(await b.evaluate(`${PL}.scene.views.includes('${view}')`))) continue;
          await b.evaluate(`${PL}.scene.setView('${view}', true)`); await sleep(400);
          const cards = await cardFaults(b, PL);
          seen += cards.shown; cut.push(...cards.faults.map(fault => `${name}, ${view}: ${fault}`));
        }
        await b.evaluate(`${PL}.scene.setView('home', true)`);
        await b.evaluate(`${PL}.say(${JSON.stringify(LONG_GUIDE)}, 20)`); await sleep(1200);                // the longest a machine says, beside the instruments
        const guide = await b.evaluate(GUIDE);
        tall.push(guide.height); said.push(...guide.faults.map(fault => `${name}: with a long sentence the guide is ${guide.width} x ${guide.height} px and ${fault}`));
        await b.evaluate(`${PL}.say('', 0)`);
      }
    }
    if (height < 700) t.expect(tall.length === steps && !said.length, `${width} x ${height}: the guide holds the longest sentence a machine says without leaving the stage or lying over another panel (${Math.max(0, ...tall)} px high at most)`, said.join(' | '));
    if (height < 700) t.expect(seen >= 60 && !cut.length, `${width} x ${height}: the card of every part of every machine is whole, and none lies over the wafer monitor (${seen} cards)`, cut.join(' | '));
    const faults = faultList(found);
    t.expect(Object.keys(found).length === steps && !faults.length, `${width} x ${height}: every machine of the line stays in what its panels leave free (${Object.keys(found).join(', ')})`, faults.join(' | '));
  }
  await b.viewport(390, 844);
  await b.goto(`${pageUrl('process-lab')}?start=oxidation`);
  if (!(await reached(b, `!!${PL} && ${PL}.mode === 'station'`, 60000))) throw new Error('the furnace did not open at a phone\'s width');
  await sleep(2500); await b.evaluate(`${PL}.setStrip('open')`); await sleep(1500);
  const narrow = await b.evaluate(NARROW);
  t.expect(narrow.wider <= 0 && narrow.title < 34, 'at a phone\'s width the page is no wider than the window and its title stays on one line', JSON.stringify(narrow));
  await t.shot('390x844');
}

// ----- a graphics context that is lost and comes back -----
// The driver, a sleeping laptop or too many 3D pages can take the context away. three.js sets itself up again when it
// returns; what the scenes baked once (the light of the room) they have to bake again, or the metal parts stay black.
/** Mean brightness and the share of dark pixels of the 3D picture. It is drawn again for the reading: a WebGL canvas keeps its picture only until it is shown. */
const picture = (b, D, canvas) => b.evaluate(`(() => { const c = document.getElementById('${canvas}'), probe = document.createElement('canvas'); probe.width = 96; probe.height = 60;
  const g = probe.getContext('2d', { willReadFrequently: true }); ${D}.scene.render(); g.drawImage(c, 0, 0, 96, 60);
  const px = g.getImageData(0, 0, 96, 60).data; let sum = 0, dark = 0;
  for (let i = 0; i < px.length; i += 4) { const v = (px[i] + px[i + 1] + px[i + 2]) / 3; sum += v; if (v < 48) dark++; }
  return { mean: Math.round(sum / (px.length / 4) * 10) / 10, dark: Math.round(dark / (px.length / 4) * 1000) / 1000 }; })()`);
/** Loses the context of a canvas and gives it back. `said`: a page expression for the text in which the page speaks of it. */
async function contextBack(t, b, D, canvas, said, what) {
  await sleep(1500);
  const before = await picture(b, D, canvas);
  const lost = await b.evaluate(`(() => { const gl = document.getElementById('${canvas}').getContext('webgl2'), ext = gl && gl.getExtension('WEBGL_lose_context'); if (!ext) return false; window.__lose = ext; ext.loseContext(); return true; })()`);
  if (!lost) { t.note(`${what}: this browser cannot take a context away on request (no WEBGL_lose_context), so this was not checked`); return; }
  const told = await reached(b, `/그래픽 장치/.test(${said})`, 20000);
  await b.evaluate('window.__lose.restoreContext()');
  const back = await reached(b, `!/그래픽 장치/.test(${said})`, 40000);
  await sleep(3000);
  const after = await picture(b, D, canvas);
  t.expect(told && back && before.mean > 60 && Math.abs(after.mean - before.mean) < 8 && after.dark < before.dark + 0.04,
    `${what}: while the graphics context is lost the page says so, and when it is back the picture is as it was`, JSON.stringify({ told, back, before, after }));
}
async function labContext(t) {
  const b = await t.open({ width: 1280, height: 800 });
  await b.goto(`${pageUrl('lab-3d')}?seed=11`);
  if (!(await reached(b, `!!(${LAB} && ${LAB}.scene)`, 60000))) throw new Error('the 3D tool did not start');
  await contextBack(t, b, LAB, 'scene', `document.getElementById('alarms').innerText`, 'the polisher of the learning lab');
  await t.shot('lab-after-restore');
}
async function processContext(t) {
  const b = await t.open({ width: 1280, height: 800 });
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await b.goto(pageUrl('process-lab'));
  if (!(await reached(b, `!!${PL} && ${PL}.mode === 'line'`, 60000))) throw new Error('the page did not start');
  await contextBack(t, b, PL, 'scene', `document.getElementById('line-title').textContent`, 'the line of the 8-process lab');
  t.expect(await b.evaluate(`document.getElementById('line-title').textContent`) === '웨이퍼 한 장이 여덟 공정을 거쳐 칩이 됩니다', 'and the first screen has its heading again');
  await t.shot('line-after-restore');
  await b.evaluate(`${PL}.start(1)`);
  if (!(await reached(b, `${PL}.mode === 'station' && ${PL}.scene.active === 'oxidation'`, 60000))) throw new Error('the furnace did not open');
  await contextBack(t, b, PL, 'scene', `document.getElementById('guide-text').textContent`, 'the furnace of the 8-process lab');
  await t.shot('furnace-after-restore');
}

// ----- single-file build -----
function newerThan(file) {                                                                     // files of the site changed after file was written
  const built = statSync(file).mtimeMs;
  return layout.siteFiles(root).filter(name => statSync(path.join(root, name)).mtimeMs > built);
}

async function standalone(t) {
  const file = standaloneFile;
  const stale = newerThan(file);
  if (stale.length) t.note(`the site has ${stale.length} file(s) changed after this file was built (for example ${stale[0]}): rebuild before handing it out`);
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
  t.expect(String(entries.filter(leavesHome).sort()) === DOORS && !(await parkedShown()), 'the home page offers the game, the learning lab and the 8-process lab only', entries.join(' '));
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
    t.expect(await b.evaluate(`(() => { const a = ${F}.document.querySelector('a[href="../index.html#intro"]'); return !a || ${F}.getComputedStyle(a).display === 'none'; })()`), 'the game\'s link to the parked 5-run challenge is hidden');
    await t.shot('3-game');
    await b.evaluate(`${F}.document.querySelector('.settings-actions a[href="../lab-3d/lab-3d.html"]').click()`);
    t.expect(await reached(b, `location.hash === '#lab-3d' && !!(${D} && ${D}.scene)`, 90000), 'the game\'s menu link opens the learning lab');
  }

  await b.evaluate(`location.hash = '#process-lab'`);
  const PL = `${F}.ProcessLabDebug`, processOpen = await reached(b, `location.hash === '#process-lab' && ${loaded} && !!${PL}`, 90000);
  t.expect(processOpen, 'the 8-process lab opens inside the file');
  if (processOpen) {
    await sleep(1200);
    const opening = await b.evaluate(`({ mode: ${PL}.mode, machines: ${PL}.scene.stations.length, heading: ${F}.document.getElementById('line-title').textContent })`);
    t.expect(opening.mode === 'line' && opening.machines === 8 && opening.heading.length > 5, 'it opens on its line of eight machines', JSON.stringify(opening));
    await sleep(3000); await t.shot('4-process-lab-line');
    await b.evaluate(`${PL}.start(1)`);
    t.expect(await reached(b, `${PL}.mode === 'station' && Object.keys(${PL}.scene.parts).length > 5 && !${PL}.scene.gliding`, 120000), 'its oxidation furnace starts inside the file, and the camera gets there');
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
  home: { run: home, minutes: 4, about: 'index.html, the mode selection' },
  game: { run: game, minutes: 8, about: 'factory/game.html, opened from its own folder: its files load and its links reach the other pages' },
  'lab-hover': { run: labHover, minutes: 8, about: 'lab-3d/lab-3d.html, a card for every part' },
  'lab-operate': { run: labOperate, minutes: 10, about: 'lab-3d/lab-3d.html, one wafer polished and measured by dragging the parts' },
  'lab-panels': { run: labPanels, minutes: 12, about: 'lab-3d/lab-3d.html, instrument strip, report and record over two wafers' },
  'lab-lot': { run: labLot, minutes: 14, about: 'lab-3d/lab-3d.html, a lot of five wafers: the pad worn out and changed, the result of the lot, the lot after it' },
  'lab-fit': { run: labFit, minutes: 9, about: 'lab-3d/lab-3d.html in a large window, in a small laptop\'s and at a phone\'s width: no scrolling, the panels apart, the polisher in what they leave free' },
  'lab-context': { run: labContext, minutes: 3, about: 'lab-3d/lab-3d.html: the graphics context taken away and given back' },
  'process-route': { run: processRoute, minutes: 4, about: 'process-lab/process-lab.html, the line it opens on and the route of eight processes: start at any machine, run to the sheet' },
  'process-flow': { run: processFlow, minutes: 6, about: 'process-lab/process-lab.html, with the equipment on: fly to a machine of the line, the same process again, pass by the standard recipe, go back, out to the line' },
  'process-crystal': { run: processCrystal, minutes: 10, about: 'process-lab/process-lab.html, the crystal puller: neck, shoulder, body under the diameter controller, measured' },
  'process-oxidation': { run: processOxidation, minutes: 10, about: 'process-lab/process-lab.html, the oxidation furnace operated to a measured film' },
  'process-photo': { run: processPhoto, minutes: 8, about: 'process-lab/process-lab.html, the coat, expose and develop cell with a rework' },
  'process-etch': { run: processEtch, minutes: 8, about: 'process-lab/process-lab.html, the etch chamber stopped at the endpoint' },
  'process-implant': { run: processImplant, minutes: 8, about: 'process-lab/process-lab.html, the implanter: one implant and two anneals to a measured junction' },
  'process-plating': { run: processPlating, minutes: 10, about: 'process-lab/process-lab.html, the copper plating cell: past the limit and back, stopped at the thickness' },
  'process-cmp': { run: processCmp, minutes: 10, about: 'process-lab/process-lab.html, the polisher of the CMP lab as the second equipment of metallization: clear the copper, scan' },
  'process-eds': { run: processEds, minutes: 10, about: 'process-lab/process-lab.html, the wafer prober: a misaligned pass, then aligned and retested to the wafer map' },
  'process-bond': { run: processBond, minutes: 10, about: 'process-lab/process-lab.html, the wire bonder: test wires pulled, then every good chip wired' },
  'process-all': { run: processAll, minutes: 14, about: 'process-lab/process-lab.html, one wafer through all eight pieces of equipment, by their controls' },
  'process-fit': { run: processFit, minutes: 18, about: 'process-lab/process-lab.html in a large window, in a small laptop\'s and at a phone\'s width: no scrolling, the panels apart, every machine in what they leave free' },
  'process-context': { run: processContext, minutes: 5, about: 'process-lab/process-lab.html: the graphics context taken away and given back, on the line and at a machine' },
  standalone: { run: standalone, minutes: 10, about: 'the single-file build, opened with the network cut off' },
};

const wanted = []; let outDir = path.join(root, 'evidence/browser-check');
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--out') outDir = path.resolve(process.argv[++i] ?? '');
  else if (arg === '--file') standaloneFile = path.resolve(process.argv[++i] ?? '');
  else if (arg === '--site') site = path.resolve(process.argv[++i] ?? '');
  else if (arg.startsWith('-')) { console.log(`Usage: node tools/check-browser.mjs [check ...] [--out folder] [--file single-file.html] [--site folder]\nchecks: ${Object.keys(CHECKS).join(', ')} (a prefix selects several; none runs them all)`); process.exit(arg === '--help' || arg === '-h' ? 0 : 2); }
  else wanted.push(arg);
}
const selected = Object.keys(CHECKS).filter(name => !wanted.length || wanted.some(w => name.startsWith(w)));
const unknown = wanted.filter(w => !Object.keys(CHECKS).some(name => name.startsWith(w)));
if (unknown.length) { console.error(`No check is called ${unknown.join(', ')}. Checks: ${Object.keys(CHECKS).join(', ')}`); process.exit(2); }
if (!existsSync(path.join(site, layout.PAGES.index))) { console.error(`${site} holds no index.html: not a copy of the site`); process.exit(2); }
if (site !== root) console.log(`pages are opened from ${site}`);

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
