/* Page logic of the 8-process lab: the route, the run, the bench views and the HUD of the oxidation furnace.
 * Models: flow-model.js (route and wafer), oxidation-model.js (furnace). 3D: scene.js (built from src/process-lab-scene.js).
 * window.ProcessLabDebug at the end is what tools/check-browser.mjs drives the page with. */
(function () {
  'use strict';
  const F = window.ProcessLabFlow, OX = window.ProcessLabOxidation, FILM = window.Lab3DProcess;
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
    if (wafer.junction) for (const [a, b] of gaps) {
      const d = wafer.junction.depth * SY, side = wafer.junction.depth * 0.7 * SX, x0 = a - side, x1 = b + side, r = Math.min(d, 14), y = SURFACE + d;
      root.append(svg('path', { d: `M${x0},${SURFACE} V${y - r} Q${x0},${y} ${x0 + r},${y} H${x1 - r} Q${x1},${y} ${x1},${y - r} V${SURFACE} Z`, fill: INK.junction }));
    }
    if (wafer.oxide > 0) {
      for (const [a, b] of lands(gaps)) root.append(box(a, b, top, SURFACE, INK.oxide));
      if (wafer.window && wafer.window.left > 0) for (const [a, b] of gaps) root.append(box(a, b, floor, SURFACE, INK.oxide));
    }
    if (wafer.resist) {
      const open = CENTRES.map(c => [c - wafer.resist.opening * SX / 2, c + wafer.resist.opening * SX / 2]);
      for (const [a, b] of lands(open)) root.append(box(a, b, top - wafer.resist.thickness * SY, top, INK.resist));
    }
    if (wafer.window && wafer.liner) {
      const t = wafer.liner * SY;
      if (wafer.metal) for (const [a, b] of gaps) root.append(box(a + t, b - t, top, floor - t, INK.metal));
      for (const [a, b] of gaps) root.append(svg('path', { d: `M${a + t / 2},${top} V${floor - t / 2} H${b - t / 2} V${top}`, fill: 'none', stroke: INK.liner, 'stroke-width': t }));
      if (!wafer.metal) for (const [a, b] of lands(gaps)) root.append(box(a, b, top - t, top, INK.liner));          // the film still covers the top until it is polished off
    }
    if (!thumb) root.append(svg('path', { d: `M${WIDTH - 104},${HEIGHT - 18} h80`, stroke: '#1e293b', 'stroke-width': 2 }), svg('text', { x: WIDTH - 64, y: HEIGHT - 24, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: '#1e293b' }, '1 µm'));
    return root;
  }
  function waferMap(tested, thumb = false) {
    const root = svg('svg', { viewBox: '-162 -162 324 324', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': tested ? `웨이퍼 맵: 양품 ${tested.good}개, 불량 ${tested.total - tested.good}개` : '웨이퍼 맵' });
    root.append(svg('circle', { cx: 0, cy: 0, r: 150, fill: '#dfe4ec', stroke: '#b8c1ce', 'stroke-width': thumb ? 3 : 1.5 }), svg('path', { d: 'M-5,150 L0,143 L5,150 Z', fill: '#f3f5f9' }));
    const good = !tested || tested.good > 0;
    for (const die of F.dies()) {
      root.append(svg('rect', { x: die.x - 9.2, y: -die.y - 9.2, width: 18.4, height: 18.4, rx: 1.5, fill: !tested ? '#aeb8c6' : good ? INK.good : INK.bad }));
      if (tested && !good && !thumb) root.append(svg('path', { d: `M${die.x - 5},${-die.y - 5} l10,10 m0,-10 l-10,10`, stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));   // not by colour alone
    }
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
  let sim = null, scene = null, mounted = false, timeScale = 60, hovered = null, dragging = null, last = 0, hudClock = 0, notice = null, noticeUntil = 0;
  const stationLive = () => Boolean(run && !run.finished && sim && F.STEPS[run.at].equipment);

  // ----- route -----
  const stops = [];
  function waferAfter(i) {
    if (!run) return F.arriving(i + 1);
    if (i < run.at) return after[i];
    let wafer = run.wafer, k = run.at;
    if (stationLive()) { wafer = { ...wafer, oxide: sim.state.oxide }; k += 1; }           // what is in the furnace right now
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
    const step = F.STEPS[i], incoming = F.arriving(i === 0 ? 1 : i);
    showBench([
      head(i, el('button', { type: 'button', class: 'btn primary', id: 'start-here', text: '여기서 시작', onclick: () => start(i) })),
      el('div', { class: 'figure' }, picture(i === 0 ? 0 : i - 1, incoming, false, frameTop(incoming))),
      i <= 6 ? legend(incoming) : null,
      el('p', { class: 'assumed', text: `${i === 0 ? '이 공정에서 웨이퍼가 만들어집니다.' : `들어오는 웨이퍼입니다. 앞의 공정 ${i}개는 표준 조건으로 끝낸 상태입니다.`} ${step.equipment && scene ? '이 공정은 장비를 직접 조작합니다.' : '이 공정의 장비는 아직 없어 표준 조건으로 지나갑니다.'}` }),
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
    run = F.createRun(F.STEPS[i].id); after = []; sim = null;
    let wafer = F.empty();
    for (let k = 0; k < i; k++) { wafer = F.apply(F.STEPS[k].id, wafer).wafer; after[k] = wafer; }
    enter();
  }
  function enter() {
    if (run.finished) { viewing = selected = F.STEPS.length - 1; showFinished(); renderRoute(); return; }
    const i = run.at; viewing = selected = i;
    if (F.STEPS[i].equipment && scene) openStation();
    else { const before = run.wafer, record = F.complete(run); after[i] = run.wafer; showPass(i, before, record); }
    renderRoute();
  }
  function select(i) {
    if (run && !run.finished && i === viewing) { selected = i; if (stationLive()) setMode('station'); else showBench(runBench); renderRoute(); return; }
    if (run && run.finished && i === F.STEPS.length - 1) { selected = i; showBench(runBench); renderRoute(); return; }
    showIntro(i);
  }

  // ----- oxidation station -----
  const F0 = OX.constants.furnace;
  const AMBIENT = { wet: '습식 (H₂O)', dry: '건식 (O₂)', inert: '질소', none: '가스 없음' };
  const rateText = s => s.growing ? `${s.rate >= 10 ? s.rate.toFixed(0) : s.rate.toFixed(1)} nm/분` : '0';
  const onOff = open => open ? '열림' : '닫힘';
  const PARTS = {
    boat: { name: '보트', role: '웨이퍼 25장을 싣고 튜브 안으로 올라갑니다.', how: `위로 끌면 튜브에 넣고 아래로 끌면 꺼냅니다. 튜브가 ${F0.boatLock} °C보다 뜨거우면 움직이지 않습니다.`,
      rows: s => [['위치', s.sealed ? '튜브 안' : s.boat < 0.02 ? '아래' : '이동 중'], ['웨이퍼 온도', `${fmt(s.wafer)} °C`]], pill: s => s.controls.boat > 0.5 ? '튜브에 넣기' : '꺼내기' },
    setpoint: { name: '온도 조절기', role: `히터의 목표 온도입니다. 히터는 1분에 ${F0.rampUp} °C씩 오르고 ${F0.rampDown} °C씩 내립니다.`, how: '좌우로 끌거나 휠을 굴립니다.',
      rows: s => [['설정', `${fmt(s.controls.setpoint)} °C`], ['튜브', `${fmt(s.tube)} °C`]], pill: s => `${fmt(s.controls.setpoint)} °C` },
    n2: { name: '질소 밸브', role: '반응하지 않는 가스입니다. 웨이퍼를 넣고 꺼낼 때와 식힐 때 흘립니다. 산화 가스와 함께 열면 산화 가스가 묽어집니다.', how: '누르면 열리고 닫힙니다.', rows: s => [['밸브', onOff(s.controls.n2)]] },
    o2: { name: '산소 밸브', role: '건식 산화입니다. 느리지만 얇은 막을 고르게 기릅니다.', how: '누르면 열리고 닫힙니다.', basis: '계산: Massoud 식 (1000 °C 위는 Deal–Grove 상수)',
      rows: s => [['밸브', onOff(s.controls.o2)], ...(s.ambient === 'dry' ? [['성장 속도', rateText(s)]] : [])] },
    h2o: { name: '수증기 밸브', role: '습식 산화입니다. 수소와 산소를 태워 만든 수증기로, 건식보다 훨씬 빨리 자랍니다.', how: '누르면 열리고 닫힙니다.', basis: '계산: Deal–Grove 식',
      rows: s => [['밸브', onOff(s.controls.h2o)], ...(s.ambient === 'wet' ? [['성장 속도', rateText(s)]] : [])] },
    tube: { name: '공정 튜브', role: '석영으로 만든 반응실입니다. 보트가 올라와 아래를 막으면 가스가 웨이퍼 사이로 흐릅니다.',
      rows: s => [['분위기', s.sealed ? AMBIENT[s.ambient] : '열려 있음'], ...(s.pressure > 0 && s.pressure < 1 ? [['산화 가스 분압', `${s.pressure.toFixed(2)} 기압`]] : []), ['성장 속도', rateText(s)]] },
    heater: { name: '히터', role: '튜브를 둘러싼 가열선입니다. 뜨거워지면 붉게 달아오릅니다.', rows: s => [['튜브 온도', `${fmt(s.tube)} °C`], ['설정', `${fmt(s.controls.setpoint)} °C`]] },
    hmi: { name: '장비 화면', role: '온도, 가스, 지난 시간을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
    tower: { name: '신호등', role: '초록은 산화막이 자라는 중, 노랑은 대기입니다.', rows: s => [['상태', s.growing ? '산화 중' : '대기']] },
    exhaust: { name: '배기', role: '쓰고 난 가스를 빼냅니다.', rows: () => [] },
  };
  function openStation() {
    if (!sim) sim = OX.create({ target: F.SPEC.oxide.target, tolerance: F.SPEC.oxide.tolerance, seed, oxide: OX.constants.nativeOxide });
    if (!mounted) { scene.mount('oxidation'); mounted = true; for (const name of Object.keys(scene.parts)) if (!PARTS[name]) console.warn(`process-lab: no card for part "${name}"`); }
    scene.setView('home', true); for (const b of $('views').children) b.setAttribute('aria-pressed', String(b.dataset.view === 'home'));
    setMode('station');
  }
  function recipeText(m) {
    const parts = [];
    if (m.wetMinutes >= 1) parts.push(`습식 ${fmt(m.wetMinutes)}분`);
    if (m.dryMinutes >= 1) parts.push(`건식 ${fmt(m.dryMinutes)}분`);
    return `${parts.join(' + ') || '산화 없음'}, 최고 ${fmt(m.peak)} °C`;
  }
  function finishStation() {
    const m = sim.state.measured; if (!m) return;
    const i = run.at; F.complete(run, { mean: m.mean, how: recipeText(m) }); after[i] = run.wafer; sim = null;
    enter();
  }
  function flash(text, seconds = 3.5) { notice = text; noticeUntil = performance.now() + seconds * 1000; hudClock = 0; }
  function onControl(name, value) {
    if (!sim) return;
    if (name === 'boat') { if (!sim.setControl('boat', clamp(value, 0, 1))) flash(`튜브가 ${F0.boatLock} °C보다 뜨거워 보트가 잠겨 있습니다. 온도를 내리세요.`); }
    else sim.setControl(name, value);
    hudClock = 0;
  }
  /** What the operator can do next. Text only: no temperature, time or gas is suggested. Returns [text, action label, action, part to point at]. */
  function guide(s) {
    const next = F.STEPS[run.at + 1], grown = s.minutes.wet + s.minutes.dry > 0.5, oxidant = s.controls.o2 || s.controls.h2o;
    if (s.measured) {
      const m = s.measured, verdict = m.ok ? '목표 범위 안입니다' : m.error < 0 ? `목표보다 ${fmt(-m.error)} nm 얇습니다` : `목표보다 ${fmt(m.error)} nm 두껍습니다`;
      return [`산화막 ${fmt(m.mean)} nm. ${verdict}.${m.error < -m.tolerance ? ' 보트를 다시 올려 더 기를 수 있습니다.' : ''}`, `다음: ${next.name}`, finishStation, null];
    }
    if (s.boat < 0.02 && s.controls.boat < 0.02) {
      if (!grown) return ['보트를 위로 끌어 웨이퍼를 튜브에 넣으세요.', null, null, 'boat'];
      return sim.canMeasure() ? ['웨이퍼가 식었습니다. 산화막 두께를 잽니다.', '두께 재기', () => { sim.measure(); hudClock = 0; }, null] : [`웨이퍼가 식는 중입니다 (${fmt(s.wafer)} °C).`, null, null, null];
    }
    if (!s.sealed) return [s.controls.boat > s.boat ? '보트가 올라가는 중입니다.' : s.controls.boat < s.boat ? '보트가 내려오는 중입니다.' : '보트가 중간에 멈춰 있습니다. 끝까지 올리거나 내리세요.', null, null, null];
    if (oxidant) return [s.growing ? '산화막이 자라고 있습니다. 원하는 두께가 되면 산화 가스를 잠그세요.' : '산화 가스가 흐릅니다. 온도가 낮으면 거의 자라지 않습니다.', null, null, null];
    if (!grown) return ['온도 조절기로 온도를 정하고 산화 가스를 여세요. O₂는 건식, H₂O는 습식 산화입니다.', null, null, s.controls.setpoint <= F0.standby ? 'setpoint' : 'h2o'];
    if (s.tube > F0.boatLock) return [`보트는 튜브가 ${F0.boatLock} °C 아래로 식어야 내려옵니다. 온도를 내리세요 (지금 ${fmt(s.tube)} °C).`, null, null, s.controls.setpoint > F0.boatLock ? 'setpoint' : null];
    return ['보트를 아래로 끌어 웨이퍼를 꺼내세요.', null, null, 'boat'];
  }

  let guideAction = null, focusPart = null;
  function paintFilm(s) {
    const c = $('film'), x = c.getContext('2d'), n = c.width, rgb = FILM.filmColor(s.oxide);
    x.clearRect(0, 0, n, n); x.save(); x.beginPath(); x.arc(n / 2, n / 2, n / 2 - 2, 0, 7); x.clip();
    x.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; x.fillRect(0, 0, n, n);
    const shine = x.createLinearGradient(0, 0, n, n); shine.addColorStop(0, 'rgba(255,255,255,.34)'); shine.addColorStop(0.5, 'rgba(255,255,255,0)'); shine.addColorStop(1, 'rgba(0,0,0,.14)');
    x.fillStyle = shine; x.fillRect(0, 0, n, n);
    const glow = clamp((s.wafer - 550) / 500, 0, 1); if (glow > 0) { x.fillStyle = `rgba(255,112,26,${0.75 * glow})`; x.fillRect(0, 0, n, n); }      // hot wafers glow; the film colour shows when they cool
    x.restore(); x.fillStyle = '#f8f9fc'; x.beginPath(); x.moveTo(n / 2 - 6, n); x.lineTo(n / 2, n - 9); x.lineTo(n / 2 + 6, n); x.fill();
  }
  let trendScale = null;
  function renderTrend(s) {
    const w = 218, h = 56, pad = 2, data = s.history, tMax = Math.max(60, data.length ? data.at(-1).t : 0), yMax = Math.max(sim.target * 1.3, s.oxide * 1.12);
    const X = t => pad + (w - 2 * pad) * t / tMax, Y = v => h - 12 - (h - 16) * v / yMax;
    trendScale = { tMax, w, pad };
    const line = data.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.oxide).toFixed(1)}`).join('');
    const root = svg('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': `산화막 두께 추이. 지금 ${fmt(s.oxide)} nm, ${fmt(tMax)}분 동안` },
      svg('rect', { x: pad, y: Y(sim.target + sim.tolerance), width: w - 2 * pad, height: Y(sim.target - sim.tolerance) - Y(sim.target + sim.tolerance), fill: '#10b98133' }),
      svg('path', { d: `M${pad},${h - 12} H${w - pad}`, stroke: '#cbd3df', 'stroke-width': 1 }),
      line ? svg('path', { d: line, fill: 'none', stroke: '#0d6efd', 'stroke-width': 2, 'stroke-linejoin': 'round' }) : null,
      data.length ? svg('circle', { cx: X(data.at(-1).t), cy: Y(data.at(-1).oxide), r: 3.2, fill: '#0d6efd', stroke: '#fff', 'stroke-width': 1.5 }) : null,
      svg('text', { x: pad, y: h - 1, 'font-size': 10, fill: '#8b98ab' }, '0'), svg('text', { x: w - pad, y: h - 1, 'font-size': 10, fill: '#8b98ab', 'text-anchor': 'end' }, `${fmt(tMax)}분`));
    $('trend').replaceChildren(root);
  }
  function renderHud(s) {
    const m = s.measured, value = m ? m.mean : s.oxide, target = sim.target, tolerance = sim.tolerance, gap = target - value;
    $('mon-mean').textContent = fmt(value);
    $('mon-togo').innerHTML = m ? (m.ok ? '목표 범위 안 · 계측값' : `목표와 <b>${fmt(Math.abs(m.error))} nm</b> 차이 · 계측값`) : gap >= 0 ? `목표까지 <b>${fmt(gap)} nm</b> · 계산값` : `목표보다 <b>${fmt(-gap)} nm</b> 두꺼움 · 계산값`;
    const scale = target * 1.6;
    Object.assign($('mon-band').style, { left: `${(target - tolerance) / scale * 100}%`, width: `${2 * tolerance / scale * 100}%` });
    $('mon-bar').style.width = `${clamp(value / scale, 0, 1) * 100}%`; $('mon-bar').dataset.tone = Math.abs(gap) <= tolerance ? 'ok' : gap < -tolerance ? 'bad' : '';
    const minutes = s.minutes.wet + s.minutes.dry;
    $('mon-now').innerHTML = `웨이퍼 <b>${fmt(s.wafer)} °C</b> · ${s.sealed ? AMBIENT[s.ambient] : '튜브 밖'}${minutes >= 1 ? ` · 산화 <b>${fmt(minutes)}분</b>` : ''}`;
    $('spec').replaceChildren(el('span', { text: `목표 ${fmt(target)} ± ${fmt(tolerance)} nm` }));
    paintFilm(s); renderTrend(s);
    const now = performance.now(), [text, label, action, part] = guide(s);
    $('guide-step').textContent = F.STEPS[run.at].name;
    $('guide-text').textContent = notice && now < noticeUntil ? notice : text;
    guideAction = action; focusPart = part; $('guide-action').hidden = !label; if (label) $('guide-action').textContent = label;
  }
  function drawScreen(s) {
    const c = scene.screenCanvas; if (!c) return;
    const x = c.getContext('2d'), W = c.width, H = c.height, state = s.growing ? `OXIDATION · ${s.ambient === 'wet' ? 'WET' : 'DRY'}` : !s.sealed ? (s.boat > 0.02 ? 'BOAT MOVING' : 'BOAT DOWN') : Math.abs(s.controls.setpoint - s.tube) > 2 ? (s.controls.setpoint > s.tube ? 'RAMP UP' : 'COOL DOWN') : 'HOLD';
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#e2e8f0'; x.font = '700 40px "Segoe UI", Arial, sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('VF-01', 44, 62);
    x.fillStyle = '#7dd3fc'; x.font = '600 28px "Segoe UI", Arial, sans-serif'; x.fillText('OXIDATION', 190, 64);
    x.textAlign = 'right'; x.fillStyle = s.growing ? '#4ade80' : '#fbbf24'; x.fillText(`● ${state}`, W - 44, 64);
    x.fillStyle = '#1e293b'; x.fillRect(44, 104, W - 88, 2);
    x.textAlign = 'left'; x.fillStyle = '#94a3b8'; x.font = '600 26px "Segoe UI", Arial, sans-serif'; x.fillText('TUBE', 44, 160); x.fillText('SET', 44, 344); x.fillText('WAFER', 330, 344); x.fillText('TIME', 660, 344);
    x.fillStyle = '#f8fafc'; x.font = '700 150px "Segoe UI", Arial, sans-serif'; x.fillText(fmt(s.tube), 40, 248);
    const numberWidth = x.measureText(fmt(s.tube)).width;
    x.font = '600 44px "Segoe UI", Arial, sans-serif'; x.fillStyle = '#94a3b8'; x.fillText('°C', 56 + numberWidth, 276);
    x.fillStyle = '#f8fafc'; x.font = '700 64px "Segoe UI", Arial, sans-serif'; x.fillText(fmt(s.controls.setpoint), 44, 410); x.fillText(fmt(s.wafer), 330, 410);
    const total = Math.floor(s.time / 60); x.fillText(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`, 660, 410);
    [['N₂', s.controls.n2], ['O₂', s.controls.o2], ['H₂O', s.controls.h2o]].forEach(([name, open], i) => {
      const gx = 44 + i * 210; x.fillStyle = open ? '#16a34a' : '#1e293b'; x.beginPath(); x.roundRect(gx, 500, 180, 88, 14); x.fill();
      x.fillStyle = open ? '#f0fdf4' : '#64748b'; x.font = '700 44px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center'; x.fillText(name, gx + 90, 546); x.textAlign = 'left';
    });
    x.fillStyle = '#94a3b8'; x.font = '600 26px "Segoe UI", Arial, sans-serif'; x.fillText('BOAT', 720, 520);
    x.fillStyle = '#1e293b'; x.fillRect(720, 546, 260, 18); x.fillStyle = '#38bdf8'; x.fillRect(720, 546, 260 * s.boat, 18);
    scene.refreshScreen();
  }
  function renderCallout(s) {
    const box = $('callout'), part = hovered && !dragging ? PARTS[hovered] : null;
    if (!part) { box.hidden = true; return; }
    $('co-name').textContent = part.name; $('co-role').textContent = part.role;
    const rows = part.rows(s);
    $('co-values').hidden = !rows.length; $('co-values').replaceChildren(...rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]));
    $('co-how').hidden = !part.how && !part.basis;
    $('co-how').replaceChildren(...(part.how ? [document.createTextNode(part.how)] : []), ...(part.basis ? [el('span', { class: 'basis', style: part.how ? 'display:block' : '', text: part.basis })] : []));
    box.hidden = false;
  }
  function positionOverlays(s) {
    const stage = $('stage').getBoundingClientRect(), canvas = $('scene').getBoundingClientRect();
    const place = (node, name) => { const p = name && scene.screenOf(name); if (!p || !p.visible) return false; node.style.left = `${p.x + canvas.left - stage.left}px`; node.style.top = `${p.y + canvas.top - stage.top}px`; return p; };
    const box = $('callout');
    if (!box.hidden) { const p = place(box, hovered); if (!p) box.hidden = true; else { box.dataset.side = p.x > canvas.width - 320 ? 'left' : 'right'; box.dataset.vert = p.y < 230 ? 'down' : 'up'; } }
    const pill = $('pill'), part = dragging && PARTS[dragging];
    if (part && part.pill && place(pill, dragging)) { pill.textContent = part.pill(s); pill.hidden = false; } else pill.hidden = true;
    const focus = $('focus'); focus.hidden = !focusPart || hovered === focusPart || Boolean(dragging) || !place(focus, focusPart);
  }
  const viewOf = s => ({ boat: s.boat, tube: s.tube, wafer: s.wafer, controls: s.controls, growing: s.growing, alarm: Boolean(notice) && performance.now() < noticeUntil,
    filmColor: FILM.filmColor(s.oxide), filmStrength: clamp((s.oxide - 3) / 40, 0, 1) });

  function frame(now) {
    const elapsed = Math.max(0, (now - last) / 1000), dt = Math.min(0.05, elapsed); last = now;      // the process never jumps more than 0.05 s of screen time
    if (mode === 'station' && sim) {
      sim.step(dt * timeScale);
      const s = sim.state;
      if (s.measured && s.boat > 0.05) s.measured = null;              // back in the furnace: the old measurement no longer holds
      scene.update(viewOf(s), dt); scene.render();
      hudClock -= elapsed; if (hudClock <= 0) { hudClock = 0.25; renderHud(s); drawScreen(s); renderRoute(); }   // by the clock, so the readouts keep up on a slow display
      renderCallout(s); positionOverlays(s);
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
        drag: (name, ended) => { dragging = name; if (!name && ended === 'boat' && sim) sim.setControl('boat', sim.state.controls.boat > 0.5 ? 1 : 0); },   // the boat goes all the way
        press: name => { if (name === 'hmi') showView('screen'); },
      },
    });
    function showView(name) { scene.setView(name); for (const b of $('views').children) b.setAttribute('aria-pressed', String(b.dataset.view === name)); }
    $('views').addEventListener('click', ev => { const b = ev.target.closest('button[data-view]'); if (b && scene) showView(b.dataset.view); });
    $('speed').addEventListener('click', ev => { const b = ev.target.closest('button[data-speed]'); if (!b) return; timeScale = Number(b.dataset.speed); for (const x of $('speed').children) x.setAttribute('aria-pressed', String(x === b)); });
    $('guide-action').addEventListener('click', () => guideAction?.());
    $('help-open').addEventListener('click', () => $('help').showModal());
    const tip = $('viz-tip');
    $('trend').addEventListener('pointermove', ev => {
      if (!sim || !trendScale || !sim.state.history.length) return;
      const r = $('trend').getBoundingClientRect(), t = clamp((ev.clientX - r.left) / r.width * trendScale.w - trendScale.pad, 0, trendScale.w) / (trendScale.w - 2 * trendScale.pad) * trendScale.tMax;
      const p = sim.state.history.reduce((best, q) => Math.abs(q.t - t) < Math.abs(best.t - t) ? q : best);
      tip.replaceChildren(el('b', { text: `${fmt(p.oxide)} nm` }), document.createTextNode(` · ${fmt(p.t)}분 · 웨이퍼 ${fmt(p.wafer)} °C`));
      tip.hidden = false; tip.style.left = `${Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, ev.clientX - tip.offsetWidth - 14))}px`; tip.style.top = `${ev.clientY + 14}px`;
    });
    $('trend').addEventListener('pointerleave', () => { tip.hidden = true; });
    if (!scene) console.warn('process-lab: WebGL 2 is not available, so the equipment views are passed by the standard recipe');

    const from = new URLSearchParams(location.search).get('start'), index = F.STEPS.findIndex(step => step.id === from);
    if (index >= 0) start(index); else showIntro(0);
    window.ProcessLabDebug = {
      flow: F, oxidation: OX, scene, parts: PARTS, start, enter, select, finishStation,
      setSpeed: v => { timeScale = v; }, get speed() { return timeScale; },
      get run() { return run; }, get sim() { return sim; }, get mode() { return mode; }, get viewing() { return viewing; }, get selected() { return selected; },
    };
    last = performance.now(); requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
