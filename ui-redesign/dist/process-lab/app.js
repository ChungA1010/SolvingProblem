/* Page logic of the 8-process lab: the route, the run, the bench views and the host of the equipment stations.
 * Route and wafer: flow-model.js. 3D: scene.js (built from src/process-lab-scene.js).
 * window.ProcessLabDebug at the end is what tools/check-browser.mjs drives the page with.
 *
 * A process with equipment has a station object in window.ProcessLabStations (station-<process>.js):
 *   equipment            key of its 3D equipment in src/process-lab-scene.js
 *   views, speeds        [[view, label] ...] and [[process seconds per second, label] ...]; the first speed is the default
 *   create(wafer, seed)  its process model: { state, step(dt), setControl(name, value), ... }
 *   parts                card of every part: { name, role, how, basis, rows(state), pill(state) }
 *   control(sim, name, value)   passes a move to the model; returns a message when the move is refused
 *   dragEnd(sim, name), tick(sim)   optional
 *   guide(sim, nextName) [text, action label, action, part to point at]; action is a function of sim, or 'finish'
 *   view(sim)            what the equipment needs to draw itself
 *   live(sim, wafer)     the wafer as it is inside the equipment right now (for the route pictures)
 *   monitor(sim)         the wafer monitor: picture, value, unit, note, meter, trend, now, spec
 *   screen(sim)          what the equipment's touch screen shows
 *   result(sim)          the measured result to hand to the next process, or null while there is none
 */
(function () {
  'use strict';
  const F = window.ProcessLabFlow, FILM = window.Lab3DProcess, STATIONS = window.ProcessLabStations || {};
  const $ = id => document.getElementById(id), SVGNS = 'http://www.w3.org/2000/svg';
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fmt = v => Math.round(v).toLocaleString('en-US');
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
    const root = svg('svg', { viewBox: thumb ? '120 118 480 112' : `0 ${from} ${WIDTH} ${HEIGHT - from}`, preserveAspectRatio: thumb ? 'xMidYMid slice' : 'xMidYMid meet', role: 'img',
      'aria-label': wafer.substrate ? `웨이퍼 단면: ${layersOf(wafer).map(k => NAMES[k]).join(', ')}` : '아직 웨이퍼가 없습니다' });
    root.append(svg('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: '#f3f5f9' }));
    if (!wafer.substrate) return root;
    const top = SURFACE - wafer.oxide * SY, floor = wafer.window ? SURFACE - wafer.window.left * SY : SURFACE;
    const gaps = wafer.window ? CENTRES.map(c => [c - wafer.window.width * SX / 2, c + wafer.window.width * SX / 2]) : [];
    const box = (x0, x1, y0, y1, fill) => svg('rect', { x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0), fill });
    root.append(box(0, WIDTH, SURFACE, HEIGHT, INK.silicon));
    if (wafer.window && wafer.window.siliconLoss > 4) for (const [a, b] of gaps) root.append(box(a, b, SURFACE, SURFACE + wafer.window.siliconLoss * SY, '#f3f5f9'));   // the over-etch bit into the silicon
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
      const t = wafer.liner * SY;
      if (wafer.metal) for (const [a, b] of gaps) root.append(box(a + t, b - t, top + (wafer.metal.dishing || 0) * SY, floor - t, INK.metal));
      for (const [a, b] of gaps) root.append(svg('path', { d: `M${a + t / 2},${top} V${floor - t / 2} H${b - t / 2} V${top}`, fill: 'none', stroke: INK.liner, 'stroke-width': t }));
      if (!wafer.metal) for (const [a, b] of lands(gaps)) root.append(box(a, b, top - t, top, INK.liner));          // the film still covers the top until it is polished off
      else if (wafer.metal.over > 0) root.append(box(0, WIDTH, top - wafer.metal.over * SY, top, INK.metal));        // metal still lying over the oxide
    }
    if (!thumb) root.append(svg('path', { d: `M${WIDTH - 104},${HEIGHT - 18} h80`, stroke: '#1e293b', 'stroke-width': 2 }), svg('text', { x: WIDTH - 64, y: HEIGHT - 24, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: '#1e293b' }, '1 µm'));
    return root;
  }
  function waferMap(tested, thumb = false) {
    const root = svg('svg', { viewBox: '-162 -162 324 324', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': tested ? `웨이퍼 맵: 양품 ${tested.good}개, 불량 ${tested.total - tested.good}개` : '웨이퍼 맵' });
    root.append(svg('circle', { cx: 0, cy: 0, r: 150, fill: '#dfe4ec', stroke: '#b8c1ce', 'stroke-width': thumb ? 3 : 1.5 }), svg('path', { d: 'M-5,150 L0,143 L5,150 Z', fill: '#f3f5f9' }));
    F.dies().forEach((die, i) => {
      const good = !tested ? null : tested.dies ? tested.dies[i].good : tested.good > 0;
      root.append(svg('rect', { x: die.x - 9.2, y: -die.y - 9.2, width: 18.4, height: 18.4, rx: 1.5, fill: good === null ? '#aeb8c6' : good ? INK.good : INK.bad }));
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
    return el('p', { class: 'legend' }, layersOf(wafer).map(key => el('span', {}, el('i', { style: `background:${INK[key]}` }), NAMES[key])), el('span', { class: 'scale', text: '세로를 1.6배 늘려 그렸습니다' }));
  }

  // ----- state -----
  const seed = Number(new URLSearchParams(location.search).get('seed')) || (Date.now() % 100000);
  let run = null, after = [], viewing = -1, selected = 0, mode = 'bench', runBench = [];
  let station = null, sim = null, scene = null, mountedEquipment = null, timeScale = 60, hovered = null, dragging = null, last = 0, hudClock = 0, notice = null, noticeUntil = 0;
  const stationOf = i => scene && F.STEPS[i].equipment ? STATIONS[F.STEPS[i].id] : null;
  const stationLive = () => Boolean(run && !run.finished && sim && station);

  // ----- route -----
  const stops = [];
  function waferAfter(i) {
    if (!run) return F.arriving(i + 1);
    if (i < run.at) return after[i];
    let wafer = run.wafer, k = run.at;
    if (stationLive()) { wafer = station.live(sim, wafer); k += 1; }           // what is in the equipment right now
    for (; k <= i; k++) wafer = F.apply(F.STEPS[k].id, wafer).wafer;
    return wafer;
  }
  function buildRoute() {
    $('route').replaceChildren(...F.STEPS.map((step, i) => {
      const mark = el('span', { class: 'mark' }), holder = el('span', { class: 'thumb' });
      const button = el('button', { type: 'button', class: 'stop', 'aria-pressed': 'false', title: step.does, onclick: () => select(i) },
        el('span', { class: 'head' }, el('span', { class: 'no', text: String(i + 1) }), el('span', { class: 'name', text: step.name }), mark), holder);
      stops[i] = { button, mark, holder };
      return button;
    }));
  }
  function renderRoute() {
    F.STEPS.forEach((step, i) => {
      const s = stops[i], record = run ? run.records.find(r => r.step === step.id) : null;
      s.button.dataset.state = !run ? 'todo' : run.finished || i < viewing ? 'done' : i === viewing ? 'current' : 'todo';
      s.button.setAttribute('aria-pressed', String(i === selected));
      if (run && !run.finished && i === viewing) s.button.setAttribute('aria-current', 'step'); else s.button.removeAttribute('aria-current');
      const [tone, text] = !record ? ['', ''] : record.ok === false ? ['bad', record.by === 'operator' ? '✕ 규격 밖' : '✕ 불량'] : record.by === 'operator' ? ['ok', '✓ 직접'] : ['', '표준'];
      s.mark.dataset.tone = tone; s.mark.textContent = text;
      s.holder.replaceChildren(picture(i, waferAfter(i), true));
    });
  }

  // ----- bench: a process as pictures of the wafer -----
  function setMode(next) {
    mode = next; $('stage').dataset.mode = next; $('speed').hidden = next !== 'station';
    if (next === 'station') { last = performance.now(); hudClock = 0; scene.resize(); }
  }
  function showBench(nodes) { $('bench').replaceChildren(el('div', { class: 'bench-inner' }, nodes)); setMode('bench'); }
  const head = (i, actions) => el('div', { class: 'bench-head' },
    el('div', {}, el('p', { class: 'no', text: `공정 ${i + 1}` }), el('h2', { text: F.STEPS[i].name }), el('p', { text: F.STEPS[i].does })), el('div', { class: 'bench-actions' }, actions));
  function showIntro(i) {
    selected = i;
    const incoming = F.arriving(i === 0 ? 1 : i);
    showBench([
      head(i, el('button', { type: 'button', class: 'btn primary', id: 'start-here', text: '여기서 시작', onclick: () => start(i) })),
      el('div', { class: 'figure' }, picture(i === 0 ? 0 : i - 1, incoming, false, frameTop(incoming))),
      i <= 6 ? legend(incoming) : null,
      el('p', { class: 'assumed', text: `${i === 0 ? '이 공정에서 웨이퍼가 만들어집니다.' : `들어오는 웨이퍼입니다. 앞의 공정 ${i}개는 표준 조건으로 끝낸 상태입니다.`} ${stationOf(i) ? '이 공정은 장비를 직접 조작합니다.' : '이 공정의 장비는 아직 없어 표준 조건으로 지나갑니다.'}` }),
    ]);
    renderRoute();
  }
  function showPass(i, before, record) {
    const next = F.STEPS[i + 1], same = i <= 5, from = frameTop(before, run.wafer);
    runBench = [
      head(i, el('button', { type: 'button', class: 'btn primary', id: 'next-step', text: next ? `다음: ${next.name}` : '공정 기록 보기', onclick: enter })),
      el('div', { class: 'figure' }, same ? section(before, false, from) : picture(i, run.wafer), same ? el('div', { class: 'after' }, section(run.wafer, false, from)) : null),
      same ? legend(run.wafer) : null,
      el('p', { class: 'result', 'data-tone': record.ok === false ? 'bad' : '', text: record.text }),
      el('p', { class: 'assumed', text: '표준 조건으로 처리했습니다. 위 수치는 가정한 값이며 계산한 결과가 아닙니다.' }),
    ];
    showBench(runBench);
  }
  function showFinished() {
    const chips = run.wafer.packaged.chips, startIndex = run.start;
    runBench = [
      el('div', { class: 'bench-head' },
        el('div', {}, el('p', { class: 'no', text: '공정 기록' }), el('h2', { text: chips ? `칩 ${fmt(chips)}개를 만들었습니다` : '완성된 칩이 없습니다' }), el('p', { text: `${F.STEPS[startIndex].name}에서 시작해 패키징까지 지났습니다.` })),
        el('div', { class: 'bench-actions' }, el('button', { type: 'button', class: 'btn', id: 'again', text: `${F.STEPS[startIndex].name}부터 다시`, onclick: () => start(startIndex) }), el('button', { type: 'button', class: 'btn primary', id: 'from-first', text: '처음부터', onclick: () => start(0) }))),
      el('table', { class: 'sheet' },
        el('thead', {}, el('tr', {}, ['', '공정', '한 일', '방식', '판정'].map(text => el('th', { text })))),
        el('tbody', {}, run.records.map((record, i) => el('tr', { 'data-before': String(Boolean(record.before)) },
          el('td', { class: 'no', text: String(i + 1) }), el('td', { class: 'name', text: F.STEPS[i].name }), el('td', { class: 'text', text: record.text }),
          el('td', { class: 'who', text: record.before ? '시작 전 · 표준' : record.by === 'operator' ? '직접 조작' : '표준 조건' }),
          el('td', { class: 'state', 'data-tone': record.ok === false ? 'bad' : record.ok ? 'ok' : '', text: record.ok === false ? '✕ 불량' : record.ok ? '✓ 통과' : '—' }))))),
      el('p', { class: 'assumed', text: '표준 조건으로 지나간 공정의 수치는 가정한 값입니다. 직접 조작한 공정의 결과만 계산한 값입니다.' }),
    ];
    showBench(runBench);
  }

  // ----- run -----
  function start(i) {
    run = F.createRun(F.STEPS[i].id); after = []; sim = null; station = null;
    let wafer = F.empty();
    for (let k = 0; k < i; k++) { wafer = F.apply(F.STEPS[k].id, wafer).wafer; after[k] = wafer; }
    enter();
  }
  function enter() {
    if (run.finished) { viewing = selected = F.STEPS.length - 1; showFinished(); renderRoute(); return; }
    const i = run.at; viewing = selected = i;
    if (stationOf(i)) openStation(stationOf(i));
    else { const before = run.wafer, record = F.complete(run); after[i] = run.wafer; showPass(i, before, record); }
    renderRoute();
  }
  function select(i) {
    if (run && !run.finished && i === viewing) { selected = i; if (stationLive()) setMode('station'); else showBench(runBench); renderRoute(); return; }
    if (run && run.finished && i === F.STEPS.length - 1) { selected = i; showBench(runBench); renderRoute(); return; }
    showIntro(i);
  }

  // ----- station: one piece of equipment, operated -----
  const pressed = (group, key, value) => { for (const b of group.children) b.setAttribute('aria-pressed', String(b.dataset[key] === String(value))); };
  function showView(name) { scene.setView(name); pressed($('views'), 'view', name); }
  function openStation(next) {
    station = next; sim = station.create(run.wafer, seed);
    if (mountedEquipment !== station.equipment) { scene.mount(station.equipment); mountedEquipment = station.equipment; for (const name of Object.keys(scene.parts)) if (!station.parts[name]) console.warn(`process-lab: no card for part "${name}"`); }
    $('views').replaceChildren(...station.views.map(([view, text]) => el('button', { type: 'button', 'data-view': view, 'aria-pressed': 'false', text })));
    $('speed').replaceChildren(...station.speeds.map(([speed, text]) => el('button', { type: 'button', 'data-speed': speed, 'aria-pressed': 'false', text })));
    timeScale = station.speeds[0][0]; pressed($('speed'), 'speed', timeScale);
    scene.setView('home', true); pressed($('views'), 'view', 'home');
    hovered = dragging = null; notice = null;
    setMode('station');
  }
  function finishStation() {
    const result = station.result(sim); if (!result) return;
    const i = run.at; F.complete(run, result); after[i] = run.wafer; sim = null; station = null;
    enter();
  }
  function flash(text, seconds = 3.5) { notice = text; noticeUntil = performance.now() + seconds * 1000; hudClock = 0; }
  function onControl(name, value) {
    if (!sim) return;
    const refused = station.control(sim, name, value);
    if (refused) flash(refused);
    hudClock = 0;
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
  /** Small chart of the monitor: one series over the run, an optional band for the target and an optional level line. */
  function renderTrend(t) {
    trendNow = t; $('trend').hidden = !t; if (!t) return;
    const w = 218, h = 56, pad = 2, X = v => pad + (w - 2 * pad) * clamp(v / t.xMax, 0, 1), Y = v => h - 12 - (h - 16) * clamp(v / t.yMax, 0, 1.04);
    const line = t.points.map((p, i) => `${i ? 'L' : 'M'}${X(t.x(p)).toFixed(1)},${Y(t.y(p)).toFixed(1)}`).join(''), end = t.points.at(-1);
    $('trend').replaceChildren(svg('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': t.label },
      t.band ? svg('rect', { x: pad, y: Y(t.band[1]), width: w - 2 * pad, height: Math.max(1, Y(t.band[0]) - Y(t.band[1])), fill: '#10b98133' }) : null,
      svg('path', { d: `M${pad},${h - 12} H${w - pad}`, stroke: '#cbd3df', 'stroke-width': 1 }),
      t.level != null ? svg('path', { d: `M${pad},${Y(t.level)} H${w - pad}`, stroke: '#f26a1b', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }) : null,
      line ? svg('path', { d: line, fill: 'none', stroke: '#0d6efd', 'stroke-width': 2, 'stroke-linejoin': 'round' }) : null,
      end && !t.noDot ? svg('circle', { cx: X(t.x(end)), cy: Y(t.y(end)), r: 3.2, fill: '#0d6efd', stroke: '#fff', 'stroke-width': 1.5 }) : null,
      svg('text', { x: pad, y: h - 1, 'font-size': 10, fill: '#8b98ab' }, t.xStart ?? '0'), svg('text', { x: w - pad, y: h - 1, 'font-size': 10, fill: '#8b98ab', 'text-anchor': 'end' }, t.xLabel)));
  }
  function renderHud() {
    const d = station.monitor(sim);
    $('mon-mean').textContent = typeof d.value === 'number' ? fmt(d.value) : d.value; $('mon-unit').textContent = d.unit;
    $('mon-togo').innerHTML = d.note; $('mon-now').innerHTML = d.now;
    $('meter').hidden = !d.meter;
    if (d.meter) {
      const m = d.meter, gap = m.target - m.value;
      Object.assign($('mon-band').style, { left: `${(m.target - m.tolerance) / m.scale * 100}%`, width: `${2 * m.tolerance / m.scale * 100}%` });
      $('mon-bar').style.width = `${clamp(m.value / m.scale, 0, 1) * 100}%`; $('mon-bar').dataset.tone = Math.abs(gap) <= m.tolerance ? 'ok' : gap < -m.tolerance ? 'bad' : '';
    }
    $('spec').replaceChildren(...d.spec.map(text => el('span', { text })));
    const film = d.picture.film != null; $('film').hidden = !film; $('mon-section').hidden = film;
    if (film) paintFilm(d.picture.film, d.picture.hot ?? 25); else $('mon-section').replaceChildren(d.picture.map ? waferMap(d.picture.map, true) : section(d.picture.section, true));
    renderTrend(d.trend);
    const now = performance.now(), next = F.STEPS[run.at + 1], [text, label, action, part] = station.guide(sim, next ? next.name : '공정 기록');
    $('guide-step').textContent = F.STEPS[run.at].name;
    $('guide-text').textContent = notice && now < noticeUntil ? notice : text;
    guideAction = action === 'finish' ? finishStation : action ? () => { action(sim); hudClock = 0; } : null;
    focusPart = part; $('guide-action').hidden = !label; if (label) $('guide-action').textContent = label;
  }
  /** The equipment's touch screen, from the station's description: name, title, state, one big value, cells, chips, a bar. */
  function drawScreen() {
    const c = scene.screenCanvas; if (!c) return;
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
    scene.refreshScreen();
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
  function positionOverlays() {
    const stage = $('stage').getBoundingClientRect(), canvas = $('scene').getBoundingClientRect();
    const place = (node, name) => { const p = name && scene.screenOf(name); if (!p || !p.visible) return false; node.style.left = `${p.x + canvas.left - stage.left}px`; node.style.top = `${p.y + canvas.top - stage.top}px`; return p; };
    const box = $('callout');
    if (!box.hidden) { const p = place(box, hovered); if (!p) box.hidden = true; else { box.dataset.side = p.x > canvas.width - 320 ? 'left' : 'right'; box.dataset.vert = p.y < 230 ? 'down' : 'up'; } }
    const pill = $('pill'), part = dragging && station.parts[dragging];
    if (part && part.pill && place(pill, dragging)) { pill.textContent = part.pill(sim.state); pill.hidden = false; } else pill.hidden = true;
    const focus = $('focus'); focus.hidden = !focusPart || hovered === focusPart || Boolean(dragging) || !place(focus, focusPart);
  }

  function frame(now) {
    const elapsed = Math.max(0, (now - last) / 1000), dt = Math.min(0.05, elapsed); last = now;      // the process never jumps more than 0.05 s of screen time
    if (mode === 'station' && sim) {
      sim.step(dt * timeScale); station.tick?.(sim);
      scene.update({ ...station.view(sim), alarm: Boolean(notice) && now < noticeUntil }, dt); scene.render();
      hudClock -= elapsed; if (hudClock <= 0) { hudClock = 0.25; renderHud(); drawScreen(); renderRoute(); }   // by the clock, so the readouts keep up on a slow display
      renderCallout(); positionOverlays();
    }
    requestAnimationFrame(frame);
  }

  function init() {
    buildRoute();
    scene = window.CMPProcessLabScene.create({
      canvas: $('scene'),
      on: {
        control: onControl,
        hover: name => { hovered = name; },
        drag: (name, ended) => { dragging = name; if (!name && ended && sim) { station.dragEnd?.(sim, ended); hudClock = 0; } },
        press: name => { if (name === 'hmi') showView('screen'); },
      },
    });
    $('views').addEventListener('click', ev => { const b = ev.target.closest('button[data-view]'); if (b && scene) showView(b.dataset.view); });
    $('speed').addEventListener('click', ev => { const b = ev.target.closest('button[data-speed]'); if (!b) return; timeScale = Number(b.dataset.speed); pressed($('speed'), 'speed', timeScale); });
    $('guide-action').addEventListener('click', () => guideAction?.());
    $('help-open').addEventListener('click', () => $('help').showModal());
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

    const from = new URLSearchParams(location.search).get('start'), index = F.STEPS.findIndex(step => step.id === from);
    if (index >= 0) start(index); else showIntro(0);
    window.ProcessLabDebug = {
      flow: F, scene, stations: STATIONS, start, enter, select, finishStation,
      setSpeed: v => { timeScale = v; }, get speed() { return timeScale; },
      get run() { return run; }, get sim() { return sim; }, get station() { return station; }, get parts() { return station ? station.parts : {}; },
      get mode() { return mode; }, get viewing() { return viewing; }, get selected() { return selected; },
    };
    last = performance.now(); requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
