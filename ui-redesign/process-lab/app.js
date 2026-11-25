/* Page logic of the 8-process lab: the line it opens on, the route, the run, the bench views and the host of the
 * equipment stations. Route and wafer: flow-model.js. 3D: scene.js (built from src/process-lab-scene.js) holds the whole
 * line and the piece of equipment in use; for the polish, the scene of the CMP learning lab itself (../lab-3d/scene.js)
 * on a canvas of its own.
 * window.ProcessLabDebug at the end is what tools/check-browser.mjs drives the page with.
 *
 * A process with equipment has a station object in window.ProcessLabStations (station-<process>.js):
 *   equipment            key of its 3D equipment in src/process-lab-scene.js
 *   scene                'cmp' when the piece is the polisher of the CMP learning lab, shown by that lab's own scene. Such a station may also have
 *                        wafer(sim, target) for a wafer dropped on a place of the machine, frame(sim, dt, timeScale) once per frame, paint(sim, canvas) for the wafer's face
 *   views, speeds        [[view, label] ...] and [[process seconds per second, label] ...]; defaultSpeed, or the first speed, is used at the start
 *   title                optional: name of this piece when the process has two (the page then lists them as an array, in the order they are used)
 *   create(wafer, seed, context)  its process model: { state, step(dt), setControl(name, value), ... }. context: { base: the wafer the process began with, results: what the earlier pieces of this process measured }
 *   parts                card of every part: { name, role, how, basis, rows(state), pill(state) }
 *   control(sim, name, value)   passes a move to the model; returns a message when the move is refused
 *   dragEnd(sim, name), tick(sim)   optional
 *   guide(sim, nextName) [text, action label, action, part to point at]; action is a function of sim, or 'finish'
 *   view(sim)            what the equipment needs to draw itself
 *   live(sim, wafer)     the wafer as it is inside the equipment right now (for the route pictures)
 *   forecast(sim, wafer) optional: the wafer as it would leave with the controls as they are (for the later stops)
 *   monitor(sim)         the wafer monitor: picture ({ film, hot }, { map }, { section, top, height } or { custom: an SVG element }), value, unit, note, meter, trend, now, spec
 *   screen(sim)          what the equipment's touch screen shows
 *   result(sim)          the measured result to hand to the next process, or null while there is none
 *   running(sim)         optional: true while the equipment is at work; the process instruments are up while it is
 *   instruments(sim)     optional: the tiles of the process instruments, [{ title, unit, value, tone, plot, tip }]. plot is what plot() draws
 *                        ({ x, y: domains, series: [[x, y]], yTicks, xTicks: [[x, label]], band: [lo, hi], limit, limitLabel, quiet, mark: [x, y] | false }); tip(x) gives [title, [[value, label] ...]] for the pointer
 *   report(sim)          optional: the metrology report once something is measured, { id, title, sub, pass, criteria, figures, notes, stats }.
 *                        criteria: [{ label, value, ok, track: { value, lo, hi, band: [lo, hi] } | meter: { value, limit, top, atLeast }, scale: [left, middle, right] }];
 *                        figures: [{ caption, node | plot | map }] (an SVG the station drew, a chart as plot() draws it, or a tested wafer for the wafer map); notes: [text]; stats: [[name, value]]. A new id opens the report.
 *   interim(wafer, result)  for a piece that is not the last of its process: the wafer as it goes on to the next piece
 */
(function () {
  'use strict';
  const F = window.ProcessLabFlow, FILM = window.Lab3DProcess, STATIONS = window.ProcessLabStations || {};
  const $ = id => document.getElementById(id), SVGNS = 'http://www.w3.org/2000/svg';
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fmt = v => Math.round(v).toLocaleString('en-US');
  /** A value of a report's record with each of its parts kept whole (a number stays beside its unit); a list joined by " + " may still break between two parts. */
  const whole = value => String(value).split(' + ').map(part => part.replace(/ /g, ' ')).join(' + ');
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === false || value == null) continue;
      if (key === 'class') node.className = value; else if (key === 'text') node.textContent = value; else if (key === 'html') node.innerHTML = value;
      else if (key === 'onclick') node.addEventListener('click', value); else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) if (child != null) node.append(child);
    return node;
  }
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
    for (const child of children.flat()) if (child != null) node.append(child);
    return node;
  }

  // ----- pictures of the wafer: cross-section through three windows, the wafer map, the packaged chip -----
  const INK = { silicon: '#9aa3b2', oxide: '#9cc3f5', resist: '#e2815a', junction: '#3fb58d', liner: '#3b4048', metal: '#d6a23f', good: '#2f9e79', bad: '#dc2626' };
  const NAMES = { silicon: '실리콘', oxide: '산화막', resist: '감광막', junction: 'n+ 접합', liner: '장벽막', metal: '금속' };
  const SX = 0.08, SY = 0.125;                                 // px per nm: 1 um is 80 px across and 125 px up (drawn 1.6 times taller)
  const WIDTH = 720, HEIGHT = 300, SURFACE = 215, CENTRES = [120, 360, 600];
  const layersOf = w => ['silicon', w.oxide > 3 && 'oxide', w.resist && 'resist', w.junction && 'junction', w.liner && w.window && 'liner', w.metal && 'metal'].filter(Boolean);
  const lands = gaps => { const out = []; let x = 0; for (const [a, b] of gaps) { out.push([x, a]); x = b; } out.push([x, WIDTH]); return out; };
  /** Top of the tallest layer, in drawing units: lets a figure start just above what is on the wafer. */
  const reach = wafer => SURFACE - (wafer.oxide + (wafer.resist ? wafer.resist.thickness : 0) + (wafer.liner && wafer.window && !wafer.metal ? wafer.liner : 0)) * SY;
  function section(wafer, thumb = false, from = 0) {
    const strip = thumb === true ? { top: 118 } : thumb;          // thumb: true, or { top, height } of the strip to show
    const root = svg('svg', { viewBox: strip ? `120 ${strip.top} 480 ${strip.height ?? 112}` : `0 ${from} ${WIDTH} ${HEIGHT - from}`, preserveAspectRatio: strip && !strip.height ? 'xMidYMid slice' : 'xMidYMid meet', role: 'img',
      'aria-label': wafer.substrate ? `웨이퍼 단면: ${layersOf(wafer).map(k => NAMES[k]).join(', ')}` : '아직 웨이퍼가 없습니다' });
    root.append(svg('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: '#f3f5f9' }));
    if (!wafer.substrate) return root;
    const top = SURFACE - wafer.oxide * SY, floor = wafer.window ? SURFACE - wafer.window.left * SY : SURFACE;
    const gaps = wafer.window ? CENTRES.map(c => [c - wafer.window.width * SX / 2, c + wafer.window.width * SX / 2]) : [];
    const box = (x0, x1, y0, y1, fill) => svg('rect', { x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0), fill });
    root.append(box(0, WIDTH, SURFACE, HEIGHT, INK.silicon));
    if (wafer.window && wafer.window.siliconLoss > 4) for (const [a, b] of gaps) root.append(box(a, b, SURFACE, SURFACE + wafer.window.siliconLoss * SY, '#f3f5f9'));   // the over-etch bit into the silicon
    if (wafer.junction && wafer.junction.everywhere) root.append(box(0, WIDTH, SURFACE, SURFACE + wafer.junction.depth * SY, INK.junction));     // no oxide mask: implanted all over
    if (wafer.junction) for (const [a, b] of gaps) {
      const d = wafer.junction.depth * SY, side = wafer.junction.depth * 0.7 * SX, x0 = a - side, x1 = b + side, r = Math.min(d, 14), y = SURFACE + d;
      root.append(svg('path', { d: `M${x0},${SURFACE} V${y - r} Q${x0},${y} ${x0 + r},${y} H${x1 - r} Q${x1},${y} ${x1},${y - r} V${SURFACE} Z`, fill: INK.junction }));
    }
    if (wafer.oxide > 0) {
      for (const [a, b] of lands(gaps)) root.append(box(a, b, top, SURFACE, INK.oxide));
      if (wafer.window && wafer.window.left > 0) for (const [a, b] of gaps) root.append(box(a, b, floor, SURFACE, INK.oxide));
    }
    if (wafer.resist) {
      const open = wafer.resist.opening > 0 ? CENTRES.map(c => [c - wafer.resist.opening * SX / 2, c + wafer.resist.opening * SX / 2]) : [];
      for (const [a, b] of lands(open)) root.append(box(a, b, top - wafer.resist.thickness * SY, top, INK.resist));
    }
    if (wafer.window && wafer.liner) {
      const t = wafer.liner * SY, m = wafer.metal, grown = m && m.conformal != null;
      if (grown) {                                                 // as plated: the same thickness on every face, until the window has closed
        const g = m.conformal * SY, s = m.conformal * SX;
        root.append(box(0, WIDTH, top - t - g, top - t, INK.metal));
        for (const [a, b] of gaps) {
          if (2 * s >= b - a - 2 * t || g >= floor - top) { root.append(box(a + t, b - t, top - t - g, floor - t, INK.metal)); continue; }
          root.append(box(a, b, top - t - g, top, '#f3f5f9'), box(a, a + t + s, top - t - g, floor - t, INK.metal), box(b - t - s, b, top - t - g, floor - t, INK.metal), box(a + t, b - t, floor - t - g, floor - t, INK.metal));
        }
      } else if (m) for (const [a, b] of gaps) root.append(box(a + t, b - t, top + (m.dishing || 0) * SY, floor - t, INK.metal));
      for (const [a, b] of gaps) root.append(svg('path', { d: `M${a + t / 2},${top} V${floor - t / 2} H${b - t / 2} V${top}`, fill: 'none', stroke: INK.liner, 'stroke-width': t }));
      if (!m || grown || m.over > 0) for (const [a, b] of lands(gaps)) root.append(box(a, b, top - t, top, INK.liner));   // the film still covers the top until it is polished off
      if (m && !grown && m.over > 0) root.append(box(0, WIDTH, top - t - m.over * SY, top - t, INK.metal));              // metal still lying over the oxide
    }
    if (!thumb) root.append(svg('path', { d: `M${WIDTH - 104},${HEIGHT - 18} h80`, stroke: '#1e293b', 'stroke-width': 2 }), svg('text', { x: WIDTH - 64, y: HEIGHT - 24, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: '#1e293b' }, '1 µm'));
    return root;
  }
  /**
   * What failed a chip, for the colours of the large wafer map: in the route's own test, the process behind it; on the
   * prober, the test it failed. The four colours with the good one were checked for colour-blind separation on the map's
   * grey, every pair against every other (the dataviz validator); failed chips also carry a cross, and the legend counts them.
   */
  const CAUSE = { defect: 'defect', closed: 'etch', residue: 'metal', scratch: 'metal', burnt: 'metal', dish: 'metal', process: 'process', contact: 'contact', leak: 'leak', voltage: 'voltage' };
  const CAUSE_INK = { defect: '#e34948', etch: '#2a78d6', metal: '#eda100', process: '#e34948', contact: '#2a78d6', leak: '#e34948', voltage: '#eda100' };
  const CAUSE_NAME = { defect: '결함', etch: '식각 (창 막힘)', metal: '금속배선', process: '공정 불량', contact: '접촉', leak: '누설', voltage: '전압' };
  const causeOf = entry => entry && CAUSE[entry.bin];
  /** The large wafer map's key: good chips and each cause of failure on this wafer, with how many. */
  function mapLegend(tested) {
    if (!tested || !tested.dies) return null;
    const counts = new Map();
    for (const die of tested.dies) if (die.good === false) { const cause = causeOf(die) || 'process'; counts.set(cause, (counts.get(cause) || 0) + 1); }
    return el('p', { class: 'legend' }, el('span', {}, el('i', { style: `background:${INK.good}` }), `양품 ${fmt(tested.good)}`),
      [...counts].map(([cause, n]) => el('span', {}, el('i', { style: `background:${CAUSE_INK[cause]}` }), `${CAUSE_NAME[cause]} ${fmt(n)}`)));
  }
  function waferMap(tested, thumb = false) {
    const root = svg('svg', { viewBox: '-162 -162 324 324', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': tested ? `웨이퍼 맵: 양품 ${tested.good}개, 불량 ${tested.total - tested.good}개` : '웨이퍼 맵' });
    root.append(svg('circle', { cx: 0, cy: 0, r: 150, fill: '#dfe4ec', stroke: '#b8c1ce', 'stroke-width': thumb ? 3 : 1.5 }), svg('path', { d: 'M-5,150 L0,143 L5,150 Z', fill: '#f3f5f9' }));
    F.dies().forEach((die, i) => {
      const entry = tested && tested.dies ? tested.dies[i] : null, good = !tested ? null : entry ? entry.good : tested.good > 0;
      const tip = thumb || good == null ? null : entry && entry.text ? entry.text : good ? '양품' : `불량 · ${(entry && F.BIN_NAMES[entry.bin]) || (tested.reason ? tested.reason : '공정')}`;
      const failed = thumb ? INK.bad : CAUSE_INK[causeOf(entry) || 'process'];                                               // a thumbnail only tells good from bad
      root.append(svg('rect', { x: die.x - 9.2, y: -die.y - 9.2, width: 18.4, height: 18.4, rx: 1.5, fill: good == null ? '#aeb8c6' : good ? INK.good : failed }, tip ? svg('title', {}, tip) : null));   // the title shows under the pointer
      if (good === false && !thumb) root.append(svg('path', { d: `M${die.x - 5},${-die.y - 5} l10,10 m0,-10 l-10,10`, stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));   // not by colour alone
    });
    return root;
  }
  function packagePicture(packaged, thumb = false) {
    const made = !packaged || packaged.chips > 0;
    const root = svg('svg', { viewBox: thumb ? '130 90 460 170' : `0 0 ${WIDTH} ${HEIGHT}`, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': made ? '패키지 단면: 칩, 금선, 리드프레임, 몰드' : '칩이 없는 빈 리드프레임' });
    root.append(svg('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: '#f3f5f9' }));
    if (made) root.append(svg('rect', { x: 170, y: 104, width: 380, height: 140, rx: 16, fill: '#2b2f36' }));
    else root.append(svg('rect', { x: 170, y: 104, width: 380, height: 140, rx: 16, fill: 'none', stroke: '#9aa3b2', 'stroke-width': 2, 'stroke-dasharray': '7 6' }));
    for (const [x, w] of [[110, 130], [262, 196], [480, 130]]) root.append(svg('rect', { x, y: 198, width: w, height: 12, rx: 2, fill: '#b9c0cb' }));       // leads and die pad
    if (made) {
      root.append(svg('rect', { x: 300, y: 166, width: 120, height: 32, fill: '#6b7483' }), svg('rect', { x: 300, y: 166, width: 120, height: 5, fill: INK.metal }));
      for (const d of ['M316,166 C290,112 236,118 214,198', 'M404,166 C430,112 484,118 506,198']) root.append(svg('path', { d, fill: 'none', stroke: INK.metal, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    }
    return root;
  }
  /** The picture that shows the wafer after process `index`. */
  const picture = (index, wafer, thumb = false, from = 0) => index <= 5 ? section(wafer, thumb, from) : index === 6 ? waferMap(wafer.tested, thumb) : packagePicture(wafer.packaged, thumb);
  const frameTop = (...wafers) => Math.max(0, Math.min(150, ...wafers.filter(w => w.substrate).map(reach)) - 34);
  function legend(wafer) {
    return el('p', { class: 'legend' }, layersOf(wafer).map(key => el('span', {}, el('i', { style: `background:${INK[key]}` }), NAMES[key])), el('span', { class: 'scale', text: '세로를 1.6배로 늘려 그렸습니다' }));
  }

  // ----- state -----
  const query = new URLSearchParams(location.search), seed = Number(query.get('seed')) || (Date.now() % 100000);
  const passAll = query.get('equipment') === 'off';             // ?equipment=off passes every process by the standard recipe (the route alone)
  let run = null, after = [], entries = [], viewing = -1, selected = 0, mode = 'bench', runBench = [];   // mode: 'line', 'bench' or 'station'; entries[i]: the run as it was when it came to process i
  let station = null, sim = null, stage = 0, staged = [], stageWafer = null;      // a process with two pieces of equipment: which one is in use, the results so far, the wafer between them
  let scene = null, polisher = null, view3d = null, scanning = false, timeScale = 60,   // scene: this lab's own; polisher: the CMP lab's, made when first needed; view3d: the one in use
      hovered = null, dragging = null, last = 0, hudClock = 0, notice = null, noticeUntil = 0,
      stripMode = 'auto', tiles = [], reportOpen = false, reportId = null;                    // the process instruments and the metrology report of the station on show
  /** The equipment of process i in the order it is used. Most processes have one piece, some have two. */
  const stationsOf = i => { const s = scene && !passAll && F.STEPS[i].equipment ? STATIONS[F.STEPS[i].id] : null; return !s ? [] : Array.isArray(s) ? s : [s]; };
  const stationLive = () => Boolean(run && !run.finished && sim && station);
  /** The first piece of equipment of process i (a process can have two): the one that stands in the line. */
  const firstStation = i => { const s = STATIONS[F.STEPS[i].id]; return Array.isArray(s) ? s[0] : s; };
  const lineKeys = F.STEPS.map((step, i) => { const first = firstStation(i); return first ? first.equipment : null; });

  // ----- route -----
  const stops = [];
  let popped = -1;                                              // the step whose picture of the wafer is on show
  function waferAfter(i) {
    if (!run) return F.arriving(i + 1, seed);
    if (i < run.at) return after[i];
    let wafer = run.wafer, k = run.at;
    if (stationLive()) { wafer = i === k || !station.forecast ? station.live(sim, stageWafer) : station.forecast(sim, stageWafer); k += 1; }   // in the equipment now; for the later stops, what it is heading for
    for (; k <= i; k++) wafer = F.apply(F.STEPS[k].id, wafer).wafer;
    return wafer;
  }
  function buildRoute() {
    $('route').replaceChildren(...F.STEPS.map((step, i) => {
      const mark = el('span', { class: 'mark' });
      const button = el('button', { type: 'button', class: 'stop', 'aria-pressed': 'false', 'aria-label': `${i + 1} ${step.name}: ${step.does}`, onclick: () => select(i) },
        el('span', { class: 'no', text: String(i + 1) }), el('span', { class: 'name', text: step.name }), mark);
      const point = () => { showPop(i); scene?.mark(lineKeys[i]); }, leave = () => { hidePop(); scene?.mark(null); };     // on the line the machine of the step lights up
      button.addEventListener('pointerenter', point); button.addEventListener('focus', point);
      button.addEventListener('pointerleave', leave); button.addEventListener('blur', leave);
      stops[i] = { button, mark };
      return button;
    }));
  }
  /** Under the pointer a step shows the wafer as it leaves that process (as the run stands now) and what the process does. */
  function renderPop() { if (popped >= 0) $('route-pop').replaceChildren(picture(popped, waferAfter(popped), true), el('p', { text: F.STEPS[popped].does })); }
  function showPop(i) {
    popped = i; renderPop();
    const box = $('route-pop'), at = stops[i].button.getBoundingClientRect(); box.hidden = false;
    box.style.left = `${clamp(at.left + at.width / 2 - box.offsetWidth / 2, 8, window.innerWidth - box.offsetWidth - 8)}px`; box.style.top = `${at.bottom + 8}px`;
  }
  function hidePop() { popped = -1; $('route-pop').hidden = true; }
  function renderRoute() {
    F.STEPS.forEach((step, i) => {
      const s = stops[i], record = run ? run.records.find(r => r.step === step.id) : null;
      s.button.dataset.state = !run ? 'todo' : run.finished || i < viewing ? 'done' : i === viewing ? 'current' : 'todo';
      s.button.setAttribute('aria-pressed', String(i === selected));
      if (run && !run.finished && i === viewing) s.button.setAttribute('aria-current', 'step'); else s.button.removeAttribute('aria-current');
      // a sign and a word; where the stop is too narrow for the name beside them, the word is kept for a screen reader and the sign stands alone (process-lab.css)
      const [tone, sign, word] = !record ? ['', '', ''] : record.ok === false ? ['bad', '✕', '불합격'] : record.by === 'operator' ? ['ok', '✓', '직접'] : ['', '', '표준'];
      const shown = `${tone}${sign}${word}`;
      if (s.mark.dataset.shown !== shown) {
        s.mark.dataset.shown = shown; s.mark.dataset.tone = tone;
        s.mark.replaceChildren(...(sign ? [el('span', { 'aria-hidden': 'true', text: sign })] : []), ...(word ? [el('span', { class: sign ? 'word' : '', text: word })] : []));
      }
    });
    renderPop();
  }

  // ----- bench: a process as pictures of the wafer -----
  function setMode(next) {
    mode = next; $('stage').dataset.mode = next; $('speed').hidden = $('redo').hidden = $('skip').hidden = next !== 'station';
    $('redo-piece').hidden = next !== 'station' || stage === 0;       // only on the second piece of a process: the first one is 'this process again'
    if (next !== 'line') showTag(-1);
    if (next !== 'bench') { last = performance.now(); hudClock = 0; (next === 'line' ? scene : view3d).resize(); }
  }
  function showBench(nodes) { $('bench').replaceChildren(el('div', { class: 'bench-inner' }, nodes)); $('bench').scrollTop = 0; setMode('bench'); }
  const head = (i, actions) => el('div', { class: 'bench-head' },
    el('div', {}, el('p', { class: 'no', text: `공정 ${i + 1}` }), el('h2', { text: F.STEPS[i].name }), el('p', { text: F.STEPS[i].does })), el('div', { class: 'bench-actions' }, actions));
  /** The finished chip in cross-section, with every layer named after the process that makes it. */
  function goalPicture() {
    const root = section(F.arriving(6), false, 96);
    root.setAttribute('aria-label', '완성된 칩의 단면: p형 실리콘 웨이퍼, 산화막, 산화막의 창, 창 아래의 n+ 접합, 창 안쪽의 장벽막, 창을 채운 구리');
    const note = (x, y, tx, ty, text, anchor = 'middle') => root.append(
      svg('path', { d: `M${x},${y} L${tx},${ty}`, stroke: '#1e293b', 'stroke-width': 1.1, fill: 'none' }), svg('circle', { cx: x, cy: y, r: 2.4, fill: '#1e293b' }),
      svg('text', { x: tx + (anchor === 'start' ? 6 : 0), y: ty + (anchor === 'start' ? 4 : -6), 'text-anchor': anchor, 'font-size': 13, 'font-weight': 650, fill: '#1e293b' }, text));
    note(120, 160, 120, 128, '창 · 3 포토, 4 식각'); note(360, 182, 360, 128, '구리 · 6 금속배선'); note(480, 186, 486, 128, '산화막 · 2 산화'); note(562, 192, 614, 128, '장벽막 · 5 증착');
    note(360, 240, 412, 268, 'n+ 접합 · 5 이온주입', 'start');
    root.append(svg('text', { x: 22, y: 286, 'font-size': 13, 'font-weight': 650, fill: '#1e293b' }, 'p형 실리콘 웨이퍼 · 1 웨이퍼 제조'));
    return root;
  }
  /**
   * Where the lab opens: the whole line in one 3D picture. The eight pieces of equipment stand in the order of the
   * processes and a carriage takes the box of wafers along the rail in front of them. A click on a machine starts there
   * and the camera goes to it; with a run in hand it asks first, like the route does. From a machine the camera flies back out.
   */
  function showLine() {
    selected = -1;
    if (!scene) {                                                 // no 3D: the route above is the way in
      showBench([el('div', { class: 'bench-head' }, el('div', {}, el('h2', { text: $('line-title').textContent }), el('p', { text: '이 브라우저에서는 3D 장비를 그릴 수 없어, 모든 공정을 표준 조건으로 지나갑니다.' })),
        el('div', { class: 'bench-actions' }, el('button', { type: 'button', class: 'btn primary', id: 'start-first', text: '처음부터 시작', onclick: () => start(0) })))]);
      renderRoute(); return;
    }
    const inHand = Boolean(run && !run.finished), flying = mode === 'station' && view3d === scene;
    $('line-back').hidden = !inHand; $('line-start').className = inHand ? 'btn' : 'btn primary';
    $('stage').dataset.view = 'own'; $('scene').setAttribute('aria-label', '공정 라인. 장비를 누르면 그 공정으로 갑니다.');
    scene.setInsets({}); scene.park(inHand ? lineKeys[run.at] : null); scene.showLine(!flying);
    setMode('line'); renderRoute();
  }
  /** The card of the machine of the line under the pointer: its number and process, the wafer as it leaves that process, what the process does. */
  let tagged = -1;
  function showTag(i) {
    if (i === tagged) return;
    if (tagged >= 0) delete stops[tagged].button.dataset.hot;
    tagged = i; const box = $('line-tag'); box.hidden = i < 0;
    if (i < 0) return;
    stops[i].button.dataset.hot = '';
    box.replaceChildren(el('p', { class: 'name' }, el('span', { class: 'no', text: String(i + 1) }), F.STEPS[i].name), picture(i, waferAfter(i), true), el('p', { text: F.STEPS[i].does }));
    placeTag();
  }
  function placeTag() {
    if (tagged < 0) return;
    const box = $('line-tag'), p = scene.stationPoint(lineKeys[tagged]), stage = $('stage');
    if (!p || !p.visible) { box.style.visibility = 'hidden'; return; }
    const w = box.offsetWidth, h = box.offsetHeight;
    box.style.visibility = ''; box.style.left = `${clamp(p.x - w / 2, 8, stage.clientWidth - w - 8)}px`; box.style.top = `${clamp(p.y - h - 14, 64, stage.clientHeight - h - 8)}px`;
  }
  function onLine(kind, key) {
    const i = lineKeys.indexOf(key);
    if (kind === 'hover') showTag(mode === 'line' ? i : -1);
    else if (kind === 'pick' && i >= 0 && mode === 'line') { showTag(-1); select(i); }
  }
  /** A process picked while a run is in hand (or over): do it again on the wafer this run brought to it, or start a new run there. */
  function showChoice(i) {
    selected = i;
    const mine = entries[i], done = Boolean(mine) && (run.finished || i < run.at), record = done ? run.records.find(r => r.step === F.STEPS[i].id) : null;
    const incoming = mine ? mine.wafer : F.arriving(i === 0 ? 1 : i, seed), from = done ? frameTop(incoming, after[i]) : frameTop(incoming), same = i <= 5;
    showBench([
      head(i, [
        el('button', { type: 'button', class: 'btn', id: 'back', text: run.finished ? '공정 기록으로' : '하던 공정으로', onclick: () => { if (run.finished) { selected = F.STEPS.length - 1; showFinished(); renderRoute(); } else select(viewing); } }),
        el('button', { type: 'button', class: mine ? 'btn' : 'btn primary', id: 'start-here', text: '표준 웨이퍼로 새로 시작', onclick: () => start(i) }),
        mine ? el('button', { type: 'button', class: 'btn primary', id: 'redo-here', text: '이 웨이퍼로 다시 하기', onclick: () => redo(i) }) : null,
      ]),
      el('div', { class: 'figure' }, !done ? picture(i === 0 ? 0 : i - 1, incoming, false, from) : same ? section(incoming, false, from) : picture(i, after[i]), done && same ? el('div', { class: 'after' }, section(after[i], false, from)) : null),
      i === 6 && done ? mapLegend(after[i].tested) : i <= 6 ? legend(done ? after[i] : incoming) : null,
      record ? el('p', { class: 'result', 'data-tone': record.ok === false ? 'bad' : '', text: record.text }) : null,
      el('p', { class: 'assumed', text: mine ? '다시 하면 이 공정과 그 뒤 공정의 결과가 지워집니다. 새로 시작하면 지금 웨이퍼는 버립니다.'
        : i === 0 ? '새로 시작하면 지금 웨이퍼는 버립니다.' : `새로 시작하면 앞의 공정 ${i}개는 표준 조건으로 지난 것으로 치고, 지금 웨이퍼는 버립니다.` }),
    ]);
    renderRoute();
  }
  function showPass(i, before, record, piece = null) {
    const next = F.STEPS[i + 1], same = i <= 5, from = frameTop(before, run.wafer);
    runBench = [
      head(i, el('button', { type: 'button', class: 'btn primary', id: 'next-step', text: next ? `다음: ${next.name}` : '공정 기록 보기', onclick: enter })),
      el('div', { class: 'figure' }, same ? section(before, false, from) : picture(i, run.wafer), same ? el('div', { class: 'after' }, section(run.wafer, false, from)) : null),
      same ? legend(run.wafer) : i === 6 ? mapLegend(run.wafer.tested) : null,
      el('p', { class: 'result', 'data-tone': record.ok === false ? 'bad' : '', text: record.text }),
      el('p', { class: 'assumed', text: piece ? `${piece}는 표준 조건으로 지났습니다. 그 수치는 가정값입니다.` : '표준 조건으로 지났습니다. 수치는 가정값입니다.' }),
    ];
    showBench(runBench);
  }
  /** The end of a run: how many chips, the wafer map they came from, and one line for each process (a click on a line shows all of it). */
  function showFinished() {
    const chips = run.wafer.packaged.chips, startIndex = run.start, tested = run.wafer.tested;
    const share = tested && tested.total ? `칩 ${fmt(tested.total)}개 중 양품 ${fmt(tested.good)}개 · 수율 ${Math.round(100 * tested.good / tested.total)}%` : `${F.STEPS[startIndex].name}에서 시작해 패키징까지 지났습니다.`;
    runBench = [
      el('div', { class: 'finish' },
        tested ? el('div', { class: 'finish-map' }, waferMap(tested, true)) : null,
        el('div', { class: 'finish-head' }, el('h2', { text: chips ? `칩 ${fmt(chips)}개를 만들었습니다` : '완성된 칩이 없습니다' }), el('p', { text: share }),
          el('div', { class: 'bench-actions' }, el('button', { type: 'button', class: 'btn primary', id: 'from-first', text: '새 웨이퍼로 처음부터', onclick: () => start(0) }),
            startIndex > 0 ? el('button', { type: 'button', class: 'btn', id: 'again', text: `새 웨이퍼로 ${F.STEPS[startIndex].name}부터`, onclick: () => start(startIndex) }) : null))),
      el('table', { class: 'sheet' },
        el('tbody', {}, run.records.map((record, i) => {
          const row = el('tr', { 'data-before': String(Boolean(record.before)) },
            el('td', { class: 'no', text: String(i + 1) }), el('td', { class: 'name', text: F.STEPS[i].name }), el('td', { class: 'text' }, el('span', { text: record.text })),
            el('td', { class: 'state', 'data-tone': record.ok === false ? 'bad' : record.ok ? 'ok' : '' }, record.ok === false ? '✕ 불합격' : record.ok ? '✓ 합격' : '—',
              el('small', { text: record.before ? '시작 전' : record.by === 'operator' ? '직접' : '표준' })),
            el('td', { class: 'again' }, entries[i] ? el('button', { type: 'button', class: 'link', 'data-redo': String(i), 'aria-label': `${F.STEPS[i].name}부터 이 웨이퍼로 다시`, text: '다시', onclick: () => redo(i) }) : null));
          row.addEventListener('click', ev => { if (!ev.target.closest('button')) row.classList.toggle('open'); });
          return row;
        }))),
      el('p', { class: 'assumed', text: '표준으로 지난 공정의 수치는 가정값입니다.' }),
    ];
    showBench(runBench);
  }

  // ----- run -----
  /** A new run on a new wafer, from process i. The processes before it are taken as done by the standard recipe. */
  function start(i) {
    run = F.createRun(F.STEPS[i].id, seed); after = []; entries = []; sim = null; station = null;
    let wafer = F.empty(seed);
    for (let k = 0; k < i; k++) { wafer = F.apply(F.STEPS[k].id, wafer).wafer; after[k] = wafer; }
    enter();
  }
  /** Comes to the process the run is at: opens its equipment, or passes it by the standard recipe where there is none. */
  function enter() {
    if (run.finished) { viewing = selected = F.STEPS.length - 1; sim = null; station = null; showFinished(); renderRoute(); return; }
    const i = run.at, list = stationsOf(i); viewing = selected = i;
    entries[i] = F.snapshot(run); stage = 0; staged = []; stageWafer = run.wafer;
    if (list.length) openStation(list[0]); else pass();
    renderRoute();
  }
  /** Finishes the process the run is at by the standard recipe. What its equipment had already measured (the first of two pieces) is kept. */
  function pass() {
    const i = run.at, before = run.wafer, record = F.complete(run, staged.length ? Object.assign({}, ...staged) : undefined);
    const piece = staged.length && station && station.title ? station.title : null;      // the first machine of this process was run by hand: only this one goes by the standard recipe
    after[i] = run.wafer; sim = null; station = null; showPass(i, before, record, piece);
  }
  /** Back to process i with the wafer this run brought to it: what the earlier processes made stays, the rest is done again. */
  function redo(i) {
    if (!run || !entries[i]) return;
    F.restore(run, entries[i]); after.length = i; entries.length = i; sim = null; station = null;
    enter();
  }
  /** The piece of equipment in use again, on the wafer as the piece before it handed it over. Of a process with two pieces, the second can be done again alone. */
  function restage() { if (stationLive() && stage > 0) { openStation(stationsOf(run.at)[stage]); renderRoute(); } }
  function skip() { if (stationLive()) { pass(); renderRoute(); } }
  function select(i) {
    if (!run) { start(i); return; }                               // nothing in hand: the equipment of that process opens at once
    if (!run.finished && i === run.at && !entries[i]) { enter(); return; }      // the wafer stands before this process (the one before it was passed): go on with it
    if (!run.finished && i === viewing) { selected = i; if (stationLive()) showStation(mode === 'line'); else showBench(runBench); renderRoute(); return; }
    showChoice(i);
  }

  // ----- station: one piece of equipment, operated -----
  const pressed = (group, key, value) => { for (const b of group.children) b.setAttribute('aria-pressed', String(b.dataset[key] === String(value))); };
  function showView(name) { view3d.setView(name); pressed($('views'), 'view', name); }
  const sceneEvents = {
    control: onControl,
    hover: name => { hovered = name; },
    drag: (name, ended) => { dragging = name; if (!name && ended && sim) { station.dragEnd?.(sim, ended); hudClock = 0; } },
    press: name => { if (name === 'hmi') showView('screen'); },
    station: onLine,
    wafer: target => { if (!sim || !station.wafer) return; const refused = station.wafer(sim, target); if (refused) flash(refused); hudClock = 0; },
    refuse: () => flash('헤드를 끝까지 올린 뒤에 웨이퍼를 꺼낼 수 있습니다.'),
    context: alive => {                                       // the graphics context was lost, or has come back: said in the guide, and on the first screen (which has no guide) in its heading
      const title = $('line-title'); title.dataset.usual ??= title.textContent;
      title.textContent = alive ? title.dataset.usual : '그래픽 장치와 연결이 끊겨 3D 화면이 멈췄습니다. 돌아오면 다시 그립니다.';
      flash(alive ? '3D 화면을 다시 그렸습니다.' : '그래픽 장치와 연결이 끊겨 3D 화면이 멈췄습니다. 돌아오면 다시 그립니다.', alive ? 3.5 : 600);
    },
  };
  /**
   * The 3D view a station is shown in: this lab's scene with the station's machine of the line in use, or the polisher of
   * the CMP lab. Null if it cannot be made. `fly`: the camera goes to the machine instead of being put there.
   */
  function sceneOf(next, fly = false) {
    const cmp = next.scene === 'cmp';
    if (cmp && !polisher && window.CMPLab3DScene) polisher = window.CMPLab3DScene.create({ canvas: $('scene-cmp'), constants: FILM.constants, on: sceneEvents });
    if (cmp && !polisher) return null;
    $('stage').dataset.view = cmp ? 'cmp' : 'own';
    if (!cmp) { $('scene').setAttribute('aria-label', '공정 장비. 부품을 끌거나 눌러 조작합니다.'); if (scene.active !== next.equipment) { scene.mount(next.equipment, fly); pressed($('views'), 'view', 'home'); } }
    return cmp ? polisher : scene;
  }
  /** The equipment in use on show again, as it was left: from the line the camera flies to it. */
  function showStation(fly = false) { sceneOf(station, fly); setMode('station'); }
  function openStation(next) {
    // From the line, and from one machine of this scene to the next, the camera goes there; everything else is a cut.
    const fly = next.scene !== 'cmp' && (mode === 'line' || (mode === 'station' && view3d === scene && scene.active !== next.equipment));
    const target = sceneOf(next, fly);
    if (!target) { console.warn('process-lab: the polisher could not be shown, so the polish goes by the standard recipe'); pass(); return; }
    if (!fly) target.setInsets({}, true);                         // a cut: no panel is open on the equipment that comes into use, so its picture is not left framed for the panels of the one before
    station = next; view3d = target; scanning = false; sim = station.create(stageWafer, seed, { base: run.wafer, results: staged });
    for (const name of Object.keys(view3d.parts)) if (!station.parts[name]) console.warn(`process-lab: no card for part "${name}"`);
    $('views').replaceChildren(...station.views.map(([view, text]) => el('button', { type: 'button', 'data-view': view, 'aria-pressed': 'false', text })));
    $('speed').replaceChildren(...station.speeds.map(([speed, text]) => el('button', { type: 'button', 'data-speed': speed, 'aria-pressed': 'false', text })));
    timeScale = station.defaultSpeed ?? station.speeds[0][0]; pressed($('speed'), 'speed', timeScale);
    if (!fly) view3d.setView('home', true);
    pressed($('views'), 'view', 'home');
    hovered = dragging = null; notice = null;
    stripMode = 'auto'; reportOpen = false; reportId = null; buildTiles();
    $('redo-piece').textContent = station.title ? `${station.title}만 다시` : '이 장비만 다시';
    setMode('station');
  }
  function finishStation() {
    const result = station.result(sim); if (!result) return;
    const i = run.at, list = stationsOf(i);
    if (stage < list.length - 1) { staged.push(result); stageWafer = station.interim(stageWafer, result); stage += 1; openStation(list[stage]); renderRoute(); return; }   // on to the second piece of this process
    F.complete(run, Object.assign({}, ...staged, result)); after[i] = run.wafer; sim = null; station = null;
    enter();
  }
  function flash(text, seconds = 3.5) { notice = text; noticeUntil = performance.now() + seconds * 1000; hudClock = 0; }
  function onControl(name, value) {
    if (!sim) return;
    const refused = station.control(sim, name, value);
    if (refused) flash(refused);
    hudClock = 0;
  }

  // ----- process instruments and metrology report: the frame is here, the station on show fills it -----
  const tipBox = () => $('viz-tip');
  function showTip(at, title, rows = []) {
    const node = tipBox();
    node.replaceChildren(...(title ? [el('p', { class: 'tip-title', text: title })] : []), ...rows.map(([value, label]) => el('p', { class: 'tip-row' }, el('b', { class: 'num', text: value }), el('span', { text: label }))));
    node.hidden = false;
    const r = node.getBoundingClientRect();
    node.style.left = `${Math.max(8, Math.min(window.innerWidth - r.width - 8, at.clientX + 14))}px`; node.style.top = `${Math.max(8, at.clientY - r.height - 14)}px`;
  }
  const hideTip = () => { tipBox().hidden = true; };
  function niceTicks(lo, hi, count = 3) {
    const span = hi - lo || 1, magnitude = 10 ** Math.floor(Math.log10(span / count)), step = [1, 2, 5, 10].map(k => k * magnitude).find(v => span / v <= count) || span;
    const ticks = []; for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(6));
    return ticks;
  }
  /** Line chart into `host`, drawn 1:1 so the text stays sharp. One series: the tile's title names it. */
  function plot(host, o) {
    const W = host.clientWidth, H = host.clientHeight; if (W < 60 || H < 24) return;
    const m = { l: 40, r: 10, t: 6, b: o.xTicks ? 16 : 4 }, [x0, x1] = o.x, [y0, y1] = o.y;
    const px = v => m.l + (W - m.l - m.r) * (v - x0) / (x1 - x0 || 1), py = v => m.t + (H - m.t - m.b) * (1 - (clamp(v, y0, y1) - y0) / (y1 - y0 || 1));
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true' });
    const text = (s, x, y, anchor) => root.append(svg('text', { x, y, 'text-anchor': anchor, class: 'tick' }, s));
    for (const v of o.yTicks || niceTicks(y0, y1)) { root.append(svg('line', { class: 'grid', x1: m.l, x2: W - m.r, y1: py(v), y2: py(v) })); text((o.yFormat || fmt)(v), m.l - 5, py(v) + 3.5, 'end'); }
    if (o.band && o.band[1] > y0 && o.band[0] < y1) root.append(svg('rect', { class: 'band', x: m.l, y: py(o.band[1]), width: W - m.l - m.r, height: Math.max(1, py(o.band[0]) - py(o.band[1])) }));
    if (o.limit !== undefined && o.limit > y0 && o.limit < y1) { root.append(svg('line', { class: 'limit', x1: m.l, x2: W - m.r, y1: py(o.limit), y2: py(o.limit) })); if (o.limitLabel) text(o.limitLabel, W - m.r, py(o.limit) - 4, 'end'); }
    root.append(svg('line', { class: 'axis', x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }));
    // Labels along the bottom. On a narrow chart one that would run into the label before it is left out; the last one stays.
    const along = (o.xTicks || []).map(([v, label]) => {
      const at = px(v), anchor = at < m.l + 14 ? 'start' : at > W - m.r - 16 ? 'end' : 'middle', wide = [...label].reduce((sum, ch) => sum + (ch.codePointAt(0) > 0x2e7f ? 10.5 : 6.1), 0);
      return { label, at, anchor, from: at - (anchor === 'start' ? 0 : anchor === 'end' ? wide : wide / 2), to: at + (anchor === 'start' ? wide : anchor === 'end' ? 0 : wide / 2) };
    }), shown = [];
    for (const tick of along) { if (!shown.length || tick.from > shown.at(-1).to + 5) shown.push(tick); else if (tick === along.at(-1) && shown.length > 1) shown[shown.length - 1] = tick; }
    for (const tick of shown) text(tick.label, tick.at, H - 3, tick.anchor);
    const points = o.series;
    if (points.length > 1) root.append(svg('polyline', { class: `line${o.quiet ? ' quiet' : ''}`, points: points.map(p => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(' ') }));
    const marked = o.mark === false ? null : o.mark || points.at(-1);          // the dot: the newest point, or the one the station marks, or none
    if (marked) root.append(svg('circle', { class: 'dot', cx: px(marked[0]), cy: py(marked[1]), r: 4 }));
    if (o.cursor != null && points.length) { const p = points.reduce((best, q) => Math.abs(q[0] - o.cursor) < Math.abs(best[0] - o.cursor) ? q : best, points[0]); root.append(svg('line', { class: 'cursor', x1: px(p[0]), x2: px(p[0]), y1: m.t, y2: H - m.b }), svg('circle', { class: 'dot', cx: px(p[0]), cy: py(p[1]), r: 4 })); }
    host.replaceChildren(root);
    host._invert = offsetX => x0 + (x1 - x0) * clamp((offsetX - m.l) / (W - m.l - m.r || 1), 0, 1);
  }
  /** The tiles of the station on show: built once when it opens, filled on every tick of the readouts. */
  function buildTiles() {
    const list = station && station.instruments ? station.instruments(sim) : [];
    tiles = list.map((tile, i) => {
      const value = el('b', { class: 'value' }), unit = el('span', { class: 'unit' }), host = el('div', { class: 'plot', role: 'img' });
      const node = el('div', { class: 'tile' }, el('h3', {}, tile.title, ' ', value, unit), host), entry = { node, value, unit, host, cursor: null };
      host.addEventListener('pointermove', ev => {
        if (!host._invert || !sim) return;
        entry.cursor = host._invert(ev.clientX - host.getBoundingClientRect().left);
        const now = station.instruments(sim)[i], tip = now && now.tip ? now.tip(entry.cursor) : null;
        if (tip) showTip(ev, tip[0], tip[1]); renderStrip();
      });
      host.addEventListener('pointerleave', () => { entry.cursor = null; hideTip(); renderStrip(); });
      return entry;
    });
    $('tiles').replaceChildren(...tiles.map(t => t.node));
  }
  function renderStrip() {
    if (!tiles.length || !sim) return;
    station.instruments(sim).forEach((tile, i) => {
      const t = tiles[i]; if (!t) return;
      t.value.textContent = tile.value; t.value.dataset.tone = tile.tone || ''; t.unit.textContent = tile.unit || '';
      t.host.setAttribute('aria-label', tile.label || tile.title);
      plot(t.host, { ...tile.plot, cursor: t.cursor });
    });
  }
  /** State is never colour alone: a mark and a word go with it. */
  const verdict = (ok, pass = '통과', fail = '미달') => el('em', { class: `state ${ok ? 'ok' : 'ng'}` }, el('span', { 'aria-hidden': 'true', text: ok ? '✓' : '✕' }), ok ? pass : fail);
  function criterion(c) {
    const at = (v, lo, hi) => clamp((v - lo) / (hi - lo), 0, 1) * 100;
    const bar = c.track ? el('div', { class: 'track target', role: 'img', 'aria-label': `${c.label} ${c.value}` },
        el('i', { class: 'band', style: `left:${at(c.track.band[0], c.track.lo, c.track.hi)}%;width:${at(c.track.band[1], c.track.lo, c.track.hi) - at(c.track.band[0], c.track.lo, c.track.hi)}%` }),
        el('u', { class: `mark ${c.ok ? 'ok' : 'ng'}`, style: `left:${at(c.track.value, c.track.lo, c.track.hi)}%` }))
      : c.meter ? el('div', { class: `track meter ${c.ok ? 'ok' : 'ng'}`, role: 'img', 'aria-label': `${c.label} ${c.value}` },
        el('i', { class: 'fill', style: `width:${at(c.meter.value, 0, c.meter.top)}%` }), el('u', { class: 'limit', style: `left:${at(c.meter.limit, 0, c.meter.top)}%` })) : null;
    return el('li', {}, el('div', { class: 'crit' }, el('span', { text: c.label }), el('b', { text: c.value }), verdict(c.ok, c.pass, c.fail)), bar,
      c.scale ? el('div', { class: 'scale num' }, c.scale.map(text => el('span', { text }))) : null);
  }
  /** A figure of the report: an SVG the station drew, a chart, or a wafer map. A chart is drawn once its box is in the page and has a size. */
  function figureBox(f) {
    if (!f.plot) return el('div', { class: 'figure-box' }, f.map ? [waferMap(f.map), mapLegend(f.map)] : f.node);
    const host = el('div', { class: 'plot', role: 'img', 'aria-label': f.caption });
    requestAnimationFrame(() => plot(host, f.plot));
    return el('div', { class: 'figure-box chart' }, host);
  }
  function renderReport(r) {
    const result = station.result(sim), list = stationsOf(run.at), following = stage < list.length - 1 ? list[stage + 1].title : F.STEPS[run.at + 1] ? F.STEPS[run.at + 1].name : '공정 기록';
    $('report').replaceChildren(...[                                      // replaceChildren takes nodes one by one: no lists, no nulls
      el('div', { class: 'report-head' }, el('div', {}, el('h3', { text: r.title }), r.sub ? el('p', { class: 'sub', text: r.sub }) : null),
        el('span', { class: `verdict ${r.pass ? 'pass' : 'fail'}` }, el('span', { 'aria-hidden': 'true', text: r.pass ? '✓' : '✕' }), r.pass ? '합격' : '불합격')),
      el('ul', { class: 'criteria' }, r.criteria.map(criterion)),
      (r.figures || []).map(f => el('figure', {}, el('figcaption', { text: f.caption }), figureBox(f))),
      r.notes && r.notes.length ? el('section', {}, el('h4', { text: '결과 풀이' }), el('ul', { class: 'notes' }, r.notes.map(text => el('li', { text })))) : null,
      r.stats && r.stats.length ? el('section', {}, el('h4', { text: '기록' }), el('dl', { class: 'stats' }, r.stats.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { class: 'num', text: whole(v) })]))) : null,
      el('footer', {}, el('button', { type: 'button', class: 'btn', id: 'report-redo', text: stage > 0 ? (station.title ? `${station.title}만 다시` : '이 장비만 다시') : '이 공정 다시', onclick: () => { if (stage > 0) restage(); else redo(run.at); } }),
        result ? el('button', { type: 'button', class: 'btn primary', id: 'report-next', text: `다음: ${following}`, onclick: finishStation }) : null),
    ].flat().filter(Boolean));
  }
  /** Shows or hides the two panels and tells the 3D view how much of it they cover, so the equipment stays in the free area. */
  function applyLayout() {
    const box = $('stage'), strip = $('strip'), panel = $('drawer');
    const running = Boolean(station && station.running && sim && station.running(sim));
    const stripOpen = tiles.length > 0 && (stripMode === 'open' || (stripMode === 'auto' && running));
    strip.dataset.open = String(stripOpen); strip.inert = !stripOpen; $('strip-open').hidden = stripOpen || !tiles.length;
    panel.dataset.open = String(reportOpen); panel.inert = !reportOpen; $('report-open').hidden = reportOpen || reportId == null;
    const right = reportOpen && box.clientWidth - panel.offsetWidth >= 560 ? panel.offsetWidth + 14 : 0, bottom = stripOpen ? strip.offsetHeight + 14 : 0;
    box.style.setProperty('--inset-right', `${right}px`); box.style.setProperty('--inset-bottom', `${bottom}px`); box.dataset.strip = stripOpen ? 'open' : 'closed';
    view3d.setInsets?.({ right, bottom });
    const stands = stripOpen ? view3d.homeBox : null;             // beside the instruments the guide lies to the left of the machine: it is as wide as the room there, and no narrower than it can be read
    const room = stands ? Math.max(250, Math.round(stands.left) - 26) : Infinity;
    box.style.setProperty('--guide-room', stands ? `${room}px` : '100vw'); box.dataset.guide = room < 340 ? 'narrow' : 'wide';   // narrow: the sentence gets the whole width, the step and the button a row under it
    return stripOpen;
  }
  /** A measurement that is new opens the report; the same one stays as the operator left it. */
  function followReport() {
    const r = station.report ? station.report(sim) : null;
    if (!r) { if (reportOpen || reportId != null) { reportOpen = false; reportId = null; } return; }
    if (r.id !== reportId) { reportId = r.id; reportOpen = true; renderReport(r); }
  }

  let guideAction = null, focusPart = null, trendNow = null;
  function paintFilm(nm, celsius) {
    const c = $('film'), x = c.getContext('2d'), n = c.width, rgb = FILM.filmColor(nm);
    x.clearRect(0, 0, n, n); x.save(); x.beginPath(); x.arc(n / 2, n / 2, n / 2 - 2, 0, 7); x.clip();
    x.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; x.fillRect(0, 0, n, n);
    const shine = x.createLinearGradient(0, 0, n, n); shine.addColorStop(0, 'rgba(255,255,255,.34)'); shine.addColorStop(0.5, 'rgba(255,255,255,0)'); shine.addColorStop(1, 'rgba(0,0,0,.14)');
    x.fillStyle = shine; x.fillRect(0, 0, n, n);
    const glow = clamp((celsius - 550) / 500, 0, 1); if (glow > 0) { x.fillStyle = `rgba(255,112,26,${0.75 * glow})`; x.fillRect(0, 0, n, n); }      // hot wafers glow; the film colour shows when they cool
    x.restore(); x.fillStyle = '#f8f9fc'; x.beginPath(); x.moveTo(n / 2 - 6, n); x.lineTo(n / 2, n - 9); x.lineTo(n / 2 + 6, n); x.fill();
  }
  /** Small chart of the monitor: one series over the run, an optional band for the target, an optional level line and an optional upright marker. */
  function renderTrend(t) {
    trendNow = t; $('trend').hidden = !t; if (!t) return;
    const w = 218, h = 56, pad = 2, X = v => pad + (w - 2 * pad) * clamp(v / t.xMax, 0, 1), Y = v => h - 12 - (h - 16) * clamp(v / t.yMax, 0, 1.04);
    const line = t.points.map((p, i) => `${i ? 'L' : 'M'}${X(t.x(p)).toFixed(1)},${Y(t.y(p)).toFixed(1)}`).join(''), end = t.points.at(-1);
    $('trend').replaceChildren(svg('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': t.label },
      t.band ? svg('rect', { x: pad, y: Y(t.band[1]), width: w - 2 * pad, height: Math.max(1, Y(t.band[0]) - Y(t.band[1])), fill: '#10b98133' }) : null,
      svg('path', { d: `M${pad},${h - 12} H${w - pad}`, stroke: '#cbd3df', 'stroke-width': 1 }),
      t.level != null ? svg('path', { d: `M${pad},${Y(t.level)} H${w - pad}`, stroke: '#f26a1b', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }) : null,
      t.marker != null ? svg('path', { d: `M${X(t.marker).toFixed(1)},${pad} V${h - 12}`, stroke: '#f26a1b', 'stroke-width': 1.2, 'stroke-dasharray': '3 2' }) : null,
      line ? svg('path', { d: line, fill: 'none', stroke: '#0d6efd', 'stroke-width': 2, 'stroke-linejoin': 'round' }) : null,
      end && !t.noDot ? svg('circle', { cx: X(t.x(end)), cy: Y(t.y(end)), r: 3.2, fill: '#0d6efd', stroke: '#fff', 'stroke-width': 1.5 }) : null,
      svg('text', { x: pad, y: h - 1, 'font-size': 10, fill: '#8b98ab' }, t.xStart ?? '0'), svg('text', { x: w - pad, y: h - 1, 'font-size': 10, fill: '#8b98ab', 'text-anchor': 'end' }, t.xLabel)));
  }
  function renderHud() {
    followReport(); if (applyLayout()) renderStrip();
    const d = station.monitor(sim);
    $('mon-mean').textContent = typeof d.value === 'number' ? fmt(d.value) : d.value; $('mon-unit').textContent = d.unit;
    $('mon-togo').innerHTML = d.note; $('mon-now').innerHTML = d.now;
    $('meter').hidden = !d.meter;
    if (d.meter) {
      const m = d.meter, from = m.from ?? null, low = from ?? m.value, gap = m.target - m.value;          // with `from` the bar spans from..value (the thinnest to the thickest place)
      Object.assign($('mon-band').style, { left: `${(m.target - m.tolerance) / m.scale * 100}%`, width: `${2 * m.tolerance / m.scale * 100}%` });
      $('mon-bar').style.left = from == null ? '' : `${clamp(from / m.scale, 0, 1) * 100}%`;
      $('mon-bar').style.width = `${clamp((m.value - (from ?? 0)) / m.scale, 0, 1) * 100}%`;
      $('mon-bar').dataset.tone = low >= m.target - m.tolerance && m.value <= m.target + m.tolerance ? 'ok' : gap < -m.tolerance ? 'bad' : '';
    }
    $('spec').replaceChildren(...d.spec.map(text => el('span', { text })));
    const film = d.picture.film != null; $('film').hidden = !film; $('mon-section').hidden = film;
    if (film) paintFilm(d.picture.film, d.picture.hot ?? 25); else $('mon-section').replaceChildren(d.picture.custom ? d.picture.custom : d.picture.map ? waferMap(d.picture.map, true) : section(d.picture.section, d.picture.top != null ? { top: d.picture.top, height: d.picture.height } : true));
    renderTrend(d.trend);
    const list = stationsOf(run.at), following = stage < list.length - 1 ? list[stage + 1].title : F.STEPS[run.at + 1] ? F.STEPS[run.at + 1].name : '공정 기록';
    const now = performance.now(), [text, label, action, part] = station.guide(sim, following);
    $('guide-step').textContent = station.title ? `${F.STEPS[run.at].name} · ${station.title}` : F.STEPS[run.at].name;
    $('guide-text').textContent = notice && now < noticeUntil ? notice : text;
    guideAction = action === 'finish' ? finishStation : action ? () => { action(sim); hudClock = 0; } : null;
    focusPart = part; $('guide-action').hidden = !label; if (label) $('guide-action').textContent = label;
  }
  /** The equipment's touch screen, from the station's description: name, title, state, one big value, cells, chips, a bar. */
  function drawScreen() {
    const c = view3d.screenCanvas; if (!c) return;
    const d = station.screen(sim), x = c.getContext('2d'), W = c.width, H = c.height, font = (weight, size) => { x.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`; };
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, W, H); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = '#e2e8f0'; font(700, 40); x.fillText(d.name, 44, 62); const nameWidth = x.measureText(d.name).width;
    x.fillStyle = '#7dd3fc'; font(600, 28); x.fillText(d.title, 64 + nameWidth, 64);
    x.textAlign = 'right'; x.fillStyle = d.alarm ? '#f87171' : d.running ? '#4ade80' : '#fbbf24'; x.fillText(`● ${d.state}`, W - 44, 64);
    x.fillStyle = '#1e293b'; x.fillRect(44, 104, W - 88, 2);
    x.textAlign = 'left'; x.fillStyle = '#94a3b8'; font(600, 26); x.fillText(d.big[0], 44, 160);
    x.fillStyle = '#f8fafc'; font(700, 150); x.fillText(d.big[1], 40, 248); const bigWidth = x.measureText(d.big[1]).width;
    font(600, 44); x.fillStyle = '#94a3b8'; x.fillText(d.big[2], 56 + bigWidth, 276);
    const cell = (W - 88) / Math.max(3, d.cells.length);
    d.cells.forEach(([name, value], i) => { x.fillStyle = '#94a3b8'; font(600, 26); x.fillText(name, 44 + i * cell, 344); x.fillStyle = '#f8fafc'; font(700, 60); x.fillText(value, 44 + i * cell, 410); });
    const room = d.bar ? 640 : W - 88, chip = Math.min(180, (room - 30 * (d.chips.length - 1)) / Math.max(1, d.chips.length));
    d.chips.forEach(([name, on], i) => {
      const gx = 44 + i * (chip + 30); x.fillStyle = on ? '#16a34a' : '#1e293b'; x.beginPath(); x.roundRect(gx, 500, chip, 88, 14); x.fill();
      x.fillStyle = on ? '#f0fdf4' : '#64748b'; font(700, 40); x.textAlign = 'center'; x.fillText(name, gx + chip / 2, 546, chip - 12); x.textAlign = 'left';
    });
    if (d.bar) { x.fillStyle = '#94a3b8'; font(600, 26); x.fillText(d.bar[0], 720, 520); x.fillStyle = '#1e293b'; x.fillRect(720, 546, 260, 18); x.fillStyle = '#38bdf8'; x.fillRect(720, 546, 260 * clamp(d.bar[1], 0, 1), 18); }
    view3d.refreshScreen();
  }
  function renderCallout() {
    const box = $('callout'), part = hovered && !dragging ? station.parts[hovered] : null;
    if (!part) { box.hidden = true; return; }
    $('co-name').textContent = part.name; $('co-role').textContent = part.role;
    const rows = part.rows ? part.rows(sim.state) : [];
    $('co-values').hidden = !rows.length; $('co-values').replaceChildren(...rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]));
    $('co-how').hidden = !part.how && !part.basis;
    $('co-how').replaceChildren(...(part.how ? [document.createTextNode(part.how)] : []), ...(part.basis ? [el('span', { class: 'basis', style: part.how ? 'display:block' : '', text: part.basis })] : []));
    box.hidden = false;
  }
  /**
   * Puts a part's card beside the point it belongs to: to the right and above where it has the room, otherwise on the side
   * where the least of it would be outside the free part of the stage or over a panel. What is still outside is taken up
   * by moving the card along its edge, so that a tall card is whole in a low window. Sizes are the card's own, measured.
   * `height` is what the instruments leave free and `full` the whole stage: a card too tall for the first may lie over them.
   */
  function placeCard(box, at, width, height, avoid = [], full = height) {
    const info = box.firstElementChild, w = info.offsetWidth, h = info.offsetHeight, M = 8, X = 21, Y = 16, room = h + 2 * M <= height ? height : full;
    const tried = [['right', 'up'], ['left', 'up'], ['right', 'down'], ['left', 'down']].map(([side, vert]) => {
      const left = side === 'right' ? at.x + X : at.x - X - w, top = vert === 'up' ? at.y - Y - h : at.y + Y;
      const dx = Math.max(0, M - left) - Math.max(0, left + w - (width - M)), dy = Math.max(0, M - top) - Math.max(0, top + h - (room - M));
      const over = avoid.some(r => left + dx < r.right + M && left + dx + w > r.left - M && top + dy < r.bottom + M && top + dy + h > r.top - M);
      return { side, vert, dx, dy, cost: (over ? 1e6 : 0) + Math.abs(dx) + Math.abs(dy) };
    });
    const best = tried.reduce((a, b) => (b.cost < a.cost ? b : a));
    box.dataset.side = best.side; box.dataset.vert = best.vert; box.style.setProperty('--dx', `${best.dx}px`); box.style.setProperty('--dy', `${best.dy}px`);
  }
  function positionOverlays() {
    const stage = $('stage').getBoundingClientRect(), canvas = stage;                 // both canvases fill the stage
    const place = (node, name) => { const p = name && view3d.screenOf(name); if (!p || !p.visible) return false; node.style.left = `${p.x + canvas.left - stage.left}px`; node.style.top = `${p.y + canvas.top - stage.top}px`; return p; };
    const box = $('callout');
    if (!box.hidden) {
      const p = place(box, hovered), monitor = $('monitor').getBoundingClientRect();
      if (!p) box.hidden = true;
      else {
        const covered = name => parseFloat($('stage').style.getPropertyValue(name)) || 0;                    // what the report (right) and the instruments (bottom) cover while they are open
        placeCard(box, { x: p.x, y: p.y }, stage.width - covered('--inset-right'), stage.height - covered('--inset-bottom'),
          [{ left: monitor.left - stage.left, right: monitor.right - stage.left, top: monitor.top - stage.top, bottom: monitor.bottom - stage.top }], stage.height);   // not over the wafer monitor
      }
    }
    const pill = $('pill'), part = dragging && station.parts[dragging];
    if (part && part.pill && place(pill, dragging)) { pill.textContent = part.pill(sim.state); pill.hidden = false; } else pill.hidden = true;
    const focus = $('focus'); focus.hidden = !focusPart || hovered === focusPart || Boolean(dragging) || Boolean(view3d.gliding) || !place(focus, focusPart);
  }

  let frames = 0;                                                 // frames drawn since the page opened: the checks wait by them, because a slow display draws few
  function frame(now) {
    const elapsed = Math.max(0, (now - last) / 1000), dt = Math.min(0.05, elapsed); last = now; frames++;      // the process never jumps more than 0.05 s of screen time
    if (mode === 'station' && sim) {
      sim.step(dt * timeScale); station.tick?.(sim); station.frame?.(sim, dt, timeScale);
      const shown = station.view(sim);
      if (shown.measuring && !scanning) view3d.startMeasuring?.(1.4);              // the thickness stage of the polisher sweeps its sensor
      scanning = Boolean(shown.measuring);
      view3d.update({ ...shown, alarm: Boolean(shown.alarm) || (Boolean(notice) && now < noticeUntil) }, dt); view3d.render();
      hudClock -= elapsed;
      if (hudClock <= 0) {                                                        // by the clock, so the readouts keep up on a slow display
        hudClock = 0.25; renderHud(); drawScreen(); renderRoute();
        if (view3d.filmCanvas && station.paint) { station.paint(sim, view3d.filmCanvas); view3d.refreshFilm(); }
      }
      renderCallout(); positionOverlays();
    } else if (mode === 'line') { scene.update(null, dt); scene.render(); placeTag(); }
    requestAnimationFrame(frame);
  }

  function init() {
    scene = window.CMPProcessLabScene.create({ canvas: $('scene'), on: sceneEvents, line: F.STEPS.map((step, i) => ({ equipment: lineKeys[i], number: i + 1, name: step.name })) });
    buildRoute();
    $('views').addEventListener('click', ev => { const b = ev.target.closest('button[data-view]'); if (b && view3d) showView(b.dataset.view); });
    $('speed').addEventListener('click', ev => { const b = ev.target.closest('button[data-speed]'); if (!b) return; timeScale = Number(b.dataset.speed); pressed($('speed'), 'speed', timeScale); });
    $('guide-action').addEventListener('click', () => guideAction?.());
    $('strip-open').addEventListener('click', () => { stripMode = 'open'; hudClock = 0; });
    $('strip-close').addEventListener('click', () => { stripMode = 'closed'; hideTip(); hudClock = 0; });
    $('drawer-close').addEventListener('click', () => { reportOpen = false; hudClock = 0; });
    $('report-open').addEventListener('click', () => { reportOpen = true; hudClock = 0; });
    $('help-open').addEventListener('click', () => $('help').showModal());
    $('help-goal').replaceChildren(goalPicture());
    $('to-line').addEventListener('click', showLine);
    $('line-start').addEventListener('click', () => start(0));
    $('line-back').addEventListener('click', () => select(viewing));
    $('redo').addEventListener('click', () => { if (run && !run.finished) redo(run.at); });
    $('redo-piece').addEventListener('click', restage);
    $('skip').addEventListener('click', skip);
    const tip = $('viz-tip');
    $('trend').addEventListener('pointermove', ev => {
      const t = trendNow; if (!t || !t.tip || !t.points.length) return;
      const r = $('trend').getBoundingClientRect(), at = clamp((ev.clientX - r.left) / r.width, 0, 1) * t.xMax;
      const p = t.points.reduce((best, q) => Math.abs(t.x(q) - at) < Math.abs(t.x(best) - at) ? q : best), [lead, rest] = t.tip(p);
      tip.replaceChildren(el('b', { text: lead }), document.createTextNode(rest));
      tip.hidden = false; tip.style.left = `${Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, ev.clientX - tip.offsetWidth - 14))}px`; tip.style.top = `${ev.clientY + 14}px`;
    });
    $('trend').addEventListener('pointerleave', () => { tip.hidden = true; });
    if (!scene) console.warn('process-lab: WebGL 2 is not available, so the equipment views are passed by the standard recipe');

    const from = query.get('start'), index = F.STEPS.findIndex(step => step.id === from);
    if (index >= 0) start(index); else showLine();
    window.ProcessLabDebug = {
      flow: F, stations: STATIONS, start, enter, select, finishStation, redo, restage, skip, showLine,
      get scene() { return mode === 'line' ? scene : view3d || scene; },   // the 3D view in use: the checks project points and read parts through it
      get line() { return { keys: lineKeys, tagged, tag: $('line-tag').hidden ? '' : $('line-tag').innerText }; },
      get stage() { return stage; }, get entries() { return entries; },
      setSpeed: v => { timeScale = v; }, get speed() { return timeScale; },
      get run() { return run; }, get sim() { return sim; }, get station() { return station; }, get parts() { return station ? station.parts : {}; },
      get mode() { return mode; }, get viewing() { return viewing; }, get selected() { return selected; }, get frames() { return frames; },
      get panels() { return { strip: $('strip').dataset.open === 'true', report: reportOpen, tiles: tiles.length, reportId }; }, setStrip: next => { stripMode = next; hudClock = 0; },
      point: name => sceneEvents.hover(name),                  // shows the card of a part as the pointer over it would (checks)
      say: (text, seconds) => flash(text, seconds),            // puts a notice into the guide, as a refused move would (checks)
    };
    last = performance.now(); requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
