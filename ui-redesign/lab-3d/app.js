/* CMP direct-operation experiment: page logic.
 * Steps the process model in real time, hands its state to the 3D scene, and draws the instruments around it.
 * Nothing sits below the 3D view. Information comes up when it is needed: a part's card while the pointer is on it,
 * the process instruments while a wafer is being polished, the metrology report when a measurement finishes. */
(function () {
  'use strict';
  const P = window.Lab3DProcess, Tool = window.Lab3DTool, Scene = window.CMPLab3DScene, C = P.constants;
  const $ = id => document.getElementById(id);
  const RPM = 2 * Math.PI / 60, FILM = 256;
  const fmt = (v, d = 0) => Number(v).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v, d = 0) => `${v < 0 ? '−' : '+'}${fmt(Math.abs(v), d)}`;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (k === 'class') node.className = v; else if (k === 'text') node.textContent = v; else node.setAttribute(k, v); }
    node.append(...children); return node;
  }
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    node.append(...children); return node;
  }

  const SCOPE = '압력, 속도, 슬러리, 패드, 온도, 접촉은 대표적인 300 mm 산화막 CMP 조건을 가정한 값이며 이 장비의 실측값이 아닙니다. 장비 상태만 PHM 2016 기록으로 학습한 모델에서 옵니다. 그 기록은 단위를 알 수 없어 평균에 대한 비율만 가져왔습니다.';
  const FACTORS = [
    ['pressure', '압력', 'Preston 식: 제거 속도는 압력에 비례합니다. 웨이퍼 가장자리는 패드가 되튀어 더 세게 눌립니다.', 'book'],
    ['speed', '속도', '플래튼과 헤드의 회전에서 나오는 상대 속도입니다. 두 회전수가 다르면 가장자리가 더 빨리 지나갑니다.', 'book'],
    ['slurry', '슬러리', '패드가 젖은 정도에 따라 늘다가 포화합니다. 모자라면 웨이퍼 가운데부터 덜 깎입니다.', 'simple'],
    ['pad', '패드', '연마할수록 패드 표면이 무뎌지고, 컨디셔너가 다시 거칠게 만듭니다.', 'simple'],
    ['temp', '온도', '마찰열(마찰계수 × 압력 × 속도)로 패드가 데워지면 Arrhenius 식만큼 빨라집니다.', 'book'],
    ['contact', '접촉', '속도에 비해 압력이 낮으면 웨이퍼가 슬러리 막 위에 떠서 거의 깎이지 않습니다.', 'simple'],
    ['level', '장비', '같은 조건에서도 장비는 웨이퍼마다 조금씩 다릅니다. 서서히 흘러갔다가 돌아오고, 새 패드의 첫 웨이퍼와 쉬고 난 뒤의 첫 웨이퍼에서 조금 빨라집니다. PHM 2016 기록으로 학습한 모델이 정합니다.', 'data'],
  ];
  const FACTOR = Object.fromEntries(FACTORS.map(f => [f[0], f]));
  const FACTOR_MAX = 2.5;                                            // multiplier at the right end of a factor bar
  const BASIS = { book: '교과서 식', simple: '단순화 가정', data: '데이터 모델' };
  const times = v => `×${fmt(v, 2)}`;
  /** A prediction of the tool model as text: the ratio and its 90 % range. */
  const rangeText = p => p ? `${times(p.ratio)} (${fmt(p.low, 2)}~${fmt(p.high, 2)})` : '계측 기록 없음';
  const pct = v => `${fmt(v * 100)}%`;
  const zoneText = z => { const p = Math.round(z * 100); return p === 0 ? '균등' : `${p > 0 ? '가운데' : '가장자리'} +${Math.abs(p)}%`; };
  /** Card row for the factor a part sets in the removal-rate product. Shown only while the wafer is pressed on the pad. */
  const factorRow = (key, s) => s.contact ? [[`${FACTOR[key][1]} 요인`, `×${fmt(s.factors[key], 2)}`, FACTOR[key][3]]] : [];
  // What a part shows while the pointer is on it: rows are [label, value, basis of the model behind it].
  const PARTS = {
    wafer: {
      name: s => `웨이퍼 #${s.wafer ? s.wafer.id : ''}`, role: '산화막(SiO₂)을 입힌 300 mm 웨이퍼입니다. 막 두께에 따라 색이 달라집니다.', how: '끌어서 헤드 아래나 계측기에 놓습니다.',
      rows: s => { const w = s.wafer; if (!w) return []; return [['들어온 막 평균', `${fmt(w.incoming.mean)} nm`], ['가장자리 − 가운데', `${signed(w.incoming.edgeMinusCentre)} nm`]]; },
    },
    head: {
      name: '캐리어 헤드', role: '웨이퍼를 잡아 패드에 누릅니다.', how: '아래로 끌면 내려가고, 닿은 뒤 더 끌면 압력이 올라갑니다.',
      rows: s => [s.contact ? ['다운포스', `${fmt(s.pressure, 1)} psi`] : ['패드까지', `${fmt(s.gap * 1000)} mm`], ...factorRow('pressure', s)],
      pill: s => s.controls.head > 1 ? `${fmt((s.controls.head - 1) * C.pressureMax, 1)} psi` : `패드까지 ${fmt((1 - s.controls.head) * C.headTravel * 1000)} mm`,
    },
    carrier: {
      name: '헤드 스핀들', role: '헤드를 돌립니다. 헤드가 돌지 않으면 웨이퍼 한쪽만 깎입니다.', how: '좌우로 끌어 회전수를 정합니다.',
      rows: s => [['헤드 회전', `${fmt(s.carrierRpm)} rpm`], ['플래튼과 차이', `${fmt(Math.abs(s.platenRpm - s.carrierRpm))} rpm`]],
      pill: s => `${fmt(s.controls.carrier)} rpm`,
    },
    platen: {
      name: '플래튼 · 패드', role: '패드를 붙인 회전 테이블입니다. 웨이퍼가 이 위에서 깎입니다.', how: '원을 그리듯 끌어 돌립니다. 시계 반대 방향이 가속입니다.',
      rows: s => [['플래튼 회전', `${fmt(s.platenRpm)} rpm`], ['패드 온도', `${fmt(s.temp)} ℃`], ['패드 젖음', pct(s.coverage)],
        ...(sim.tool ? [['패드 사용', pct(sim.tool.status.padShare), 'data']] : []), ...factorRow('speed', s), ...factorRow('temp', s), ...(sim.tool ? factorRow('level', s) : [])],
      pill: s => `${fmt(s.controls.platen)} rpm`,
    },
    zone: {
      name: '구역 압력 조절기', role: '웨이퍼 가운데와 가장자리 사이로 압력을 옮깁니다. 평균 압력은 그대로입니다.', how: '좌우로 끌어 돌립니다. 오른쪽이 가운데입니다.',
      rows: s => [['압력 배분', zoneText(s.controls.zone)]], pill: s => zoneText(s.controls.zone),
    },
    slurry: {
      name: '슬러리 밸브', role: '연마 입자가 든 슬러리를 패드에 흘립니다.', how: '오른쪽이나 위로 끌면 더 열립니다.',
      rows: s => [['유량', `${fmt(s.flow)} mL/min`], ['패드 젖음', pct(s.coverage)], ...factorRow('slurry', s)], pill: s => `${fmt(s.controls.slurry)} mL/min`,
    },
    conditioner: {
      name: '패드 컨디셔너', role: '다이아몬드 디스크로 패드 표면을 다시 거칠게 만듭니다.', how: '누르면 쓸기 시작하고, 다시 누르면 대기 위치로 갑니다.',
      rows: s => [['상태', s.controls.conditioner ? '쓰는 중' : '대기'], ['패드 거칠기', pct(s.glaze)], ...factorRow('pad', s)],
    },
    emo: { name: '비상 정지', role: '모든 회전과 슬러리를 멈추고 헤드를 올립니다.', how: '누릅니다.' },
    pedestal: { name: '로드 위치', role: '연마할 웨이퍼가 놓이는 자리입니다.' },
    stage: { name: '두께 계측기', role: '웨이퍼 49곳의 막 두께를 재서 평균과 균일도를 냅니다.', how: '연마한 웨이퍼를 여기에 놓으면 계측합니다.' },
    hmi: { name: '장비 화면', role: '막 두께 모니터와 현재 조건을 보여 줍니다. 두께는 패드의 창을 통해 플래튼 1회전마다 한 번 읽습니다.', how: '누르면 가까이에서 봅니다.' },
    tower: { name: '신호등', role: '초록은 연마 중, 노랑은 대기, 빨강은 경보입니다.' },
    nozzle: { name: '슬러리 공급 암', role: '슬러리를 패드 가운데 쪽에 떨어뜨립니다. 패드가 돌면서 웨이퍼 아래로 실어 나릅니다.' },
    gauges: { name: '압력 게이지', role: '왼쪽 바늘이 헤드 다운포스입니다.', rows: s => [['다운포스', `${fmt(s.pressure, 1)} psi`]] },
  };

  let sim, scene, timeScale = 4, last = 0, hudClock = 1, filmClock = 1, screenClock = 1, hovered = null, dragging = null, focusName = null;
  let notice = null, noticeUntil = 0, measureAt = 0, attempts = [], filmPixels = null, filmImage = null, stripMode = 'auto';
  const spin = { platen: 0, carrier: 0, sweep: 0 }, nodes = { factors: {} };
  const drawer = { open: false, tab: 'report', selected: null };      // metrology report and record
  const layout = { right: 0, bottom: 0 };                             // how much of the 3D view the panels cover, in CSS px
  const hover = { t: null, r: null };                                 // chart cursors of the process instruments: time (s) and radius (mm)
  const track = { id: 0, time: 0, platen: 0, carrier: 0, flow: 0, zone: 0, conditioner: 0 };   // sums over the time a wafer is being polished

  // ----- film view: thin-film colour of every point of the wafer -----
  function filmGeometry() {
    const n = FILM, radius = new Float32Array(n * n), cos = new Float32Array(n * n), sin = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const dx = (x + 0.5 - n / 2) / (n / 2 - 1), dy = (y + 0.5 - n / 2) / (n / 2 - 1), r = Math.hypot(dx, dy), i = y * n + x;
      radius[i] = r; cos[i] = r ? dx / r : 1; sin[i] = r ? dy / r : 0;
    }
    return { radius, cos, sin };
  }
  function paintFilm() {
    const w = sim.state.wafer, ctx = scene.filmCanvas.getContext('2d'), n = FILM;
    filmPixels ||= filmGeometry(); filmImage ||= ctx.createImageData(n, n);
    const data = filmImage.data, { radius, cos, sin } = filmPixels, { table, step, max } = P.filmColors();
    const film = w ? w.film : null, N = C.nodes, ct = w ? Math.cos(w.tiltAngle) : 1, st = w ? Math.sin(w.tiltAngle) : 0, tilt = w ? w.tilt : 0;
    for (let i = 0; i < n * n; i++) {
      const r = radius[i], o = i * 4;
      if (r > 1 || !film) { data[o] = 132; data[o + 1] = 141; data[o + 2] = 154; data[o + 3] = 255; continue; }
      const x = r * (N - 1), k = Math.min(N - 2, x | 0), f = x - k;
      const t = film[k] + f * (film[k + 1] - film[k]) - tilt * r * (cos[i] * ct + sin[i] * st);
      const c = Math.round(Math.min(max, Math.max(0, t)) / step) * 3;
      data[o] = table[c]; data[o + 1] = table[c + 1]; data[o + 2] = table[c + 2]; data[o + 3] = 255;
    }
    ctx.putImageData(filmImage, 0, 0);
    if (w) {
      ctx.save(); ctx.translate(n / 2, n / 2); ctx.lineCap = 'round';
      for (const s of w.scratches) {
        const a = s.theta, R = s.r / C.waferRadius * (n / 2 - 2), len = s.length * 26;
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.3; ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R); ctx.quadraticCurveTo(Math.cos(a + 0.12) * (R + 4), Math.sin(a + 0.12) * (R + 4), Math.cos(a + 0.22) * R + len * Math.cos(a + 1.7), Math.sin(a + 0.22) * R + len * Math.sin(a + 1.7));
        ctx.stroke();
      }
      ctx.restore();
    }
    scene.refreshFilm();
    const view = $('film'), v = view.getContext('2d'), m = view.width;
    v.clearRect(0, 0, m, m); v.save(); v.beginPath(); v.arc(m / 2, m / 2, m / 2 - 1, 0, 7); v.clip();
    v.drawImage(scene.filmCanvas, 0, 0, m, m); v.restore();
    v.fillStyle = '#dfe5ed'; v.beginPath(); v.arc(m / 2, m - 2, 4, 0, 7); v.fill();          // notch
  }

  // The touch panel on the tool: the readouts an operator would watch, so the 3D view needs no gauge cards.
  function paintScreen() {
    const c = scene.screenCanvas, x = c.getContext('2d'), s = sim.state, w = s.wafer, W = c.width, H = c.height, F = '"Segoe UI", "Malgun Gothic", sans-serif';
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#14213a'; x.fillRect(0, 0, W, 84);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = '#e8eefc'; x.font = `700 36px ${F}`; x.fillText('CMP-01', 32, 44);
    x.fillStyle = '#8ea3c7'; x.font = `500 26px ${F}`; x.fillText('OXIDE POLISH', 190, 46);
    const alarm = Object.keys(s.alarms).length > 0, status = alarm ? ['ALARM', '#ff6b6b'] : s.polishing ? ['POLISH', '#4ade80'] : ['IDLE', '#fbbf24'];
    x.fillStyle = status[1]; x.beginPath(); x.arc(W - 186, 44, 11, 0, 7); x.fill(); x.font = `700 30px ${F}`; x.fillText(status[0], W - 162, 46);
    const panel = (px, py, pw, ph) => { x.fillStyle = '#101a2e'; x.beginPath(); x.roundRect(px, py, pw, ph, 14); x.fill(); };
    const caption = (text, px, py) => { x.fillStyle = '#7f95bb'; x.font = `600 21px ${F}`; x.textAlign = 'left'; x.fillText(text, px, py); };
    panel(24, 104, 372, 512); caption('FILM MAP', 46, 136);
    if (w) {
      x.save(); x.beginPath(); x.arc(210, 352, 150, 0, 7); x.clip(); x.drawImage(scene.filmCanvas, 60, 202, 300, 300); x.restore();
      x.strokeStyle = '#2b3b59'; x.lineWidth = 4; x.beginPath(); x.arc(210, 352, 152, 0, 7); x.stroke();
      x.fillStyle = '#8ea3c7'; x.font = `500 22px ${F}`; x.fillText(`WAFER #${w.id}   ${fmt(w.polishTime)} s`, 46, 584);
    }
    panel(416, 104, 584, 212); caption('THICKNESS', 440, 136);
    if (w && s.monitor) {
      x.fillStyle = '#e8eefc'; x.font = `700 92px ${F}`; x.fillText(fmt(s.monitor.mean), 438, 208);
      const width = x.measureText(fmt(s.monitor.mean)).width; x.font = `500 30px ${F}`; x.fillStyle = '#8ea3c7'; x.fillText('nm', 450 + width, 226);
      x.textAlign = 'right'; x.font = `500 24px ${F}`; x.fillText(`TARGET ${C.target} ± ${C.targetTol}`, 976, 136); x.textAlign = 'left';
      const span = Math.max(1, w.incoming.mean - C.target), done = Math.min(1, Math.max(0, (w.incoming.mean - s.monitor.mean) / span));
      x.fillStyle = '#1c2b47'; x.fillRect(440, 276, 536, 14); x.fillStyle = Math.abs(s.monitor.mean - C.target) <= C.targetTol ? '#4ade80' : '#3b82f6'; x.fillRect(440, 276, 536 * done, 14);
    }
    const cells = [['DOWN FORCE', fmt(s.pressure, 1), 'psi'], ['PLATEN', fmt(s.platenRpm), 'rpm'], ['HEAD', fmt(s.carrierRpm), 'rpm'], ['SLURRY', fmt(s.flow), 'mL/min'], ['PAD TEMP', fmt(s.temp), '°C'], ['RATE', fmt(s.rate), 'nm/min']];
    cells.forEach(([name, value, unit], i) => {
      const px = 416 + (i % 3) * 198, py = 332 + Math.floor(i / 3) * 146;
      panel(px, py, 188, 136); caption(name, px + 18, py + 30);
      x.fillStyle = name === 'PAD TEMP' && s.temp > C.tempAlarm ? '#ff6b6b' : '#e8eefc'; x.font = `700 52px ${F}`; x.fillText(value, px + 18, py + 82);
      x.fillStyle = '#8ea3c7'; x.font = `500 20px ${F}`; x.fillText(unit, px + 18, py + 118);
    });
    scene.refreshScreen();
  }

  // ----- charts: SVG drawn at 1:1 so the text stays sharp. Each chart has one series, so its title names it and no legend is needed. -----
  /** One tooltip for every chart: the value leads, the label follows. `at` is a pointer event or any { clientX, clientY }. */
  function showTip(at, title, rows = [], note = null, basis = null) {
    const node = $('viz-tip');
    node.replaceChildren(
      ...(title ? [el('p', { class: 'tip-title', text: title })] : []),
      ...rows.map(([value, label]) => el('p', { class: 'tip-row' }, el('b', { class: 'num', text: value }), el('span', { text: label }))),
      ...(note ? [el('p', { class: 'tip-note' }, note, ...(basis ? [el('span', { class: `src ${basis}`, text: BASIS[basis] })] : []))] : []));
    node.hidden = false;
    const r = node.getBoundingClientRect();
    node.style.left = `${Math.max(8, Math.min(window.innerWidth - r.width - 8, at.clientX + 14))}px`;
    node.style.top = `${Math.max(8, at.clientY - r.height - 14)}px`;
  }
  const hideTip = () => { $('viz-tip').hidden = true; };
  function niceTicks(lo, hi, count = 4) {
    const span = hi - lo || 1, magnitude = 10 ** Math.floor(Math.log10(span / count)), step = [1, 2, 5, 10].map(k => k * magnitude).find(v => span / v <= count) || span;
    const ticks = []; for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(6));
    return ticks;
  }
  const niceCeil = v => { const magnitude = 10 ** Math.floor(Math.log10(v)); return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(k => k * magnitude).find(top => top >= v); };
  const nearest = (points, x) => points.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, points[0]);
  /** Line chart into `host`. o: { x, y: domains, series: [[x, y]], yTicks, xTicks: [[x, label]], band: [lo, hi], limit, limitLabel, quiet, cursor, margin }. */
  function plot(host, o) {
    const W = host.clientWidth, H = host.clientHeight; if (W < 60 || H < 24) return;
    const m = o.margin || { l: 38, r: 10, t: 6, b: o.xTicks ? 16 : 4 }, [x0, x1] = o.x, [y0, y1] = o.y;
    const px = v => m.l + (W - m.l - m.r) * (v - x0) / (x1 - x0 || 1), py = v => m.t + (H - m.t - m.b) * (1 - (Math.max(y0, Math.min(y1, v)) - y0) / (y1 - y0 || 1));
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true' });
    const text = (s, x, y, anchor) => { const t = svg('text', { x, y, 'text-anchor': anchor, class: 'tick' }); t.textContent = s; root.append(t); };
    for (const v of o.yTicks || []) { root.append(svg('line', { class: 'grid', x1: m.l, x2: W - m.r, y1: py(v), y2: py(v) })); text(fmt(v), m.l - 5, py(v) + 3.5, 'end'); }
    if (o.band && o.band[1] > y0 && o.band[0] < y1) root.append(svg('rect', { class: 'band', x: m.l, y: py(o.band[1]), width: W - m.l - m.r, height: Math.max(1, py(o.band[0]) - py(o.band[1])) }));
    if (o.limit !== undefined) { root.append(svg('line', { class: 'limit', x1: m.l, x2: W - m.r, y1: py(o.limit), y2: py(o.limit) })); if (o.limitLabel) text(o.limitLabel, W - m.r, py(o.limit) - 4, 'end'); }
    root.append(svg('line', { class: 'axis', x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }));
    for (const [v, label] of o.xTicks || []) text(label, px(v), H - 3, px(v) < m.l + 14 ? 'start' : px(v) > W - m.r - 16 ? 'end' : 'middle');
    const points = o.series;
    if (points.length > 1) root.append(svg('polyline', { class: `line${o.quiet ? ' quiet' : ''}`, points: points.map(p => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(' ') }));
    if (points.length) { const p = points.at(-1); root.append(svg('circle', { class: 'dot', cx: px(p[0]), cy: py(p[1]), r: 4 })); }
    if (o.cursor != null && points.length) { const p = nearest(points, o.cursor); root.append(svg('line', { class: 'cursor', x1: px(p[0]), x2: px(p[0]), y1: m.t, y2: H - m.b }), svg('circle', { class: 'dot', cx: px(p[0]), cy: py(p[1]), r: 4 })); }
    host.replaceChildren(root);
    host._invert = offsetX => x0 + (x1 - x0) * clamp01((offsetX - m.l) / (W - m.l - m.r || 1));
  }
  /** Calls `move(dataX, event)` while the pointer is over a chart drawn by plot(), and `move(null)` when it leaves. */
  function onChart(host, move) {
    host.addEventListener('pointermove', ev => { if (host._invert) move(host._invert(ev.clientX - host.getBoundingClientRect().left), ev); });
    host.addEventListener('pointerleave', () => { move(null); hideTip(); });
  }
  const timeTicks = tMax => { const step = [15, 30, 60, 120, 300, 600].find(v => tMax / v <= 6) || 1200, ticks = []; for (let v = 0; v <= tMax + 1e-6; v += step) ticks.push([v, `${fmt(v)}초`]); return ticks; };
  const bandOf = () => [C.target - C.targetTol, C.target + C.targetTol];
  const sampleAt = (data, t) => data.reduce((best, p) => Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best, data[0]);
  const timeRows = p => [[`${fmt(p.mean)} nm`, '평균 두께'], [`${fmt(p.rate)} nm/min`, '제거 속도'], [`${fmt(p.temp)} ℃`, '패드 온도']];
  const radiusRows = v => [[`${fmt(v)} nm`, '막 두께'], [`${signed(v - C.target)} nm`, '목표 대비']];

  /** Samples of the wafer on the head, thinned for drawing. Time counts from the moment it was put on the head. */
  function trendData() {
    const h = sim.state.history; if (!h.length) return [];
    const t0 = h[0].t, step = Math.max(1, Math.ceil(h.length / 240)), out = [];
    for (let i = 0; i < h.length; i += step) out.push(h[i]);
    if (out.at(-1) !== h.at(-1)) out.push(h.at(-1));
    return out.map(p => ({ t: p.t - t0, mean: p.mean, rate: p.rate, temp: p.temp }));
  }
  /** Mean thickness against time, with the target band. Returns the end of the time axis. */
  function trendPlot(host, data, start, cursor, withTime = false) {
    const means = data.map(p => p.mean), tMax = Math.max(60, data.length ? data.at(-1).t : 0);
    const lo = Math.min(C.target - C.targetTol - 25, ...means), hi = Math.max(start, ...means) + 12;
    plot(host, { x: [0, tMax], y: [lo, hi], yTicks: niceTicks(lo, hi, 3), xTicks: withTime ? timeTicks(tMax) : undefined, band: bandOf(), series: data.map(p => [p.t, p.mean]), cursor });
    return tMax;
  }
  /** Thickness from the wafer centre to its edge. The scale follows the profile so its shape stays readable at any thickness. */
  function profilePlot(host, values, cursor) {
    const lo = Math.min(...values), hi = Math.max(...values), mid = (lo + hi) / 2, half = Math.max(32, (hi - lo) * 0.75), n = values.length, edge = C.waferRadius * 1000;
    plot(host, { x: [0, edge], y: [mid - half, mid + half], yTicks: niceTicks(mid - half, mid + half, 2), xTicks: [[0, '가운데'], [edge, '가장자리']], band: bandOf(), series: values.map((v, i) => [i / (n - 1) * edge, v]), cursor });
  }
  function renderFactors(s) {
    for (const [key] of FACTORS) {
      const v = s.factors[key], node = nodes.factors[key], shown = Math.min(FACTOR_MAX, Math.max(0, v));
      const from = Math.min(1, shown) / FACTOR_MAX * 100, to = Math.max(1, shown) / FACTOR_MAX * 100;
      node.value.textContent = `×${fmt(v, 2)}`;
      const side = Math.abs(shown - 1) < 0.005 ? '' : shown < 1 ? 'low' : 'high';
      node.bar.style.left = `${from}%`; node.bar.style.width = `${to - from}%`; node.bar.dataset.side = node.dot.dataset.side = side; node.dot.style.left = `${shown / FACTOR_MAX * 100}%`;
    }
    $('factors').dataset.live = String(s.contact);
  }
  function renderStrip(s) {
    const w = s.wafer, data = trendData();
    $('rate-value').textContent = fmt(s.polishing ? s.rate : 0);
    $('temp-value').textContent = fmt(s.temp); $('temp-value').dataset.tone = s.temp > C.tempAlarm ? 'critical' : '';
    $('wiwnu-value').textContent = w && s.monitor ? `${fmt(s.monitor.wiwnu, 1)}%` : '—';
    renderFactors(s);
    const tMax = trendPlot($('plot-trend'), data, w ? w.incoming.mean : C.filmStart, hover.t);
    const rateTop = niceCeil(Math.max(120, ...data.map(p => p.rate)) * 1.05);
    plot($('plot-rate'), { x: [0, tMax], y: [0, rateTop], yTicks: [0, rateTop], xTicks: timeTicks(tMax), series: data.map(p => [p.t, p.rate]), quiet: true, cursor: hover.t });
    plot($('plot-temp'), { margin: { l: 4, r: 8, t: 16, b: 4 }, x: [0, tMax], y: [C.ambient - 4, Math.max(C.tempAlarm + 8, ...data.map(p => p.temp)) + 2], limit: C.tempAlarm, limitLabel: `경보 ${fmt(C.tempAlarm)} ℃`,
      series: data.map(p => [p.t, p.temp]), quiet: true, cursor: hover.t });
    if (w && s.monitor) profilePlot($('plot-profile'), Array.from(s.monitor.profile), hover.r);
  }
  function timeTip(t, ev) {
    hover.t = t; renderStrip(sim.state);
    const data = trendData(); if (t == null || !data.length) return;
    const p = sampleAt(data, t); showTip(ev, `${fmt(p.t)}초`, timeRows(p));
  }
  function profileTip(r, ev) {
    hover.r = r; const s = sim.state; renderStrip(s);
    if (r == null || !s.monitor) return;
    const profile = s.monitor.profile, i = Math.round(r / (C.waferRadius * 1000) * (profile.length - 1));
    showTip(ev, `반경 ${fmt(i / (profile.length - 1) * C.waferRadius * 1000)} mm`, radiusRows(profile[i]));
  }

  // ----- instruments -----
  function build() {
    for (const [key, label, text, kind] of FACTORS) {
      const value = el('b', { class: 'num' }), bar = el('i'), dot = el('u');
      const row = el('button', { type: 'button', class: 'frow' }, el('span', { class: 'name', text: label }), el('span', { class: 'track' }, bar, dot), value);
      const tip = at => showTip(at, `${label} 요인`, [[`×${fmt(sim.state.factors[key], 2)}`, '기준 대비']], text, kind);
      row.addEventListener('pointermove', tip); row.addEventListener('pointerleave', hideTip);
      row.addEventListener('focus', () => { const r = row.getBoundingClientRect(); tip({ clientX: r.left + 30, clientY: r.top }); }); row.addEventListener('blur', hideTip);
      nodes.factors[key] = { bar, dot, value }; $('factors').append(row);
    }
    $('factors').style.setProperty('--base', `${100 / FACTOR_MAX}%`);
    $('eq-ref').textContent = fmt(C.rateRef);
    $('spec').replaceChildren(...[`${fmt(C.target)} ± ${fmt(C.targetTol)} nm`, `균일도 ≤ ${fmt(C.wiwnuMax)}%`, '스크래치 0'].map(text => el('span', { text })));
    $('scope-note').textContent = `계산 근거: 제거 속도는 기준 ${fmt(C.rateRef)} nm/min에 압력, 속도, 슬러리, 패드, 온도, 접촉, 장비 상태 일곱 요인을 곱한 값입니다. ${SCOPE}`;
    onChart($('plot-trend'), timeTip); onChart($('plot-rate'), timeTip); onChart($('plot-temp'), timeTip); onChart($('plot-profile'), profileTip);
  }

  /** Next action for a first-time operator: [step, text, button label, button action, part to point at]. It names actions, never values. */
  function guide(s) {
    const w = s.wafer, c = s.controls;
    if (measureAt) return [5, '49곳의 두께를 재는 중입니다.'];
    if (!w) return [1, '새 웨이퍼를 준비하세요.', '새 웨이퍼', () => newWafer()];
    if (w.where === 'stage') return [6, w.measured?.pass ? '기준을 모두 맞췄습니다.' : '기준에 못 미쳤습니다. 두꺼우면 헤드로 옮겨 더 연마할 수 있습니다.', '새 웨이퍼', () => newWafer()];
    if (w.where === 'pedestal') {
      if (s.gap < C.headTravel * 0.5) return [1, '헤드를 위로 끌어 올리세요.', null, null, 'head'];
      return [1, '웨이퍼를 헤드 아래로 끌어다 놓으세요.', '헤드에 올리기', () => { sim.setControl('head', 0); if (!sim.moveWafer('head')) flash('헤드가 올라간 뒤에 다시 눌러 주세요.'); }, 'wafer'];
    }
    if (w.polishTime === 0 || s.polishing || s.contact) {
      if (!s.contact) {
        if (c.platen < 5) return [2, '패드를 원을 그리듯 끌어 돌리세요.', null, null, 'platen'];
        if (c.carrier < 5) return [2, '스핀들을 옆으로 끌어 헤드를 돌리세요.', null, null, 'carrier'];
        if (c.slurry < 5) return [2, '밸브를 끌어 슬러리를 흘리세요.', null, null, 'slurry'];
        return [3, '헤드를 아래로 끌어 패드에 닿게 하세요.', null, null, 'head'];
      }
      if (s.pressure < 0.3 && c.head <= 1.02) return [3, '헤드를 더 내려 압력을 주세요.', null, null, 'head'];
      return [4, `막 두께가 ${fmt(C.target)} nm에 가까워지면 헤드를 올리세요.`];
    }
    if (s.gap < C.headTravel * 0.5) return [5, '헤드를 끝까지 올리세요.', null, null, 'head'];
    return [5, '헤드를 옆으로 끌어 웨이퍼를 꺼내 계측기에 놓으세요.', '계측기로 옮기기', () => onWafer('stage'), 'stage'];
  }
  let guideAction = null;
  function renderCallout(s) {
    const name = dragging ? null : hovered, part = name && PARTS[name], box = $('callout');
    if (!part) { box.hidden = true; return; }
    $('co-name').textContent = typeof part.name === 'function' ? part.name(s) : part.name;
    $('co-role').textContent = part.role;
    const rows = part.rows ? part.rows(s) : [], values = $('co-values');
    values.replaceChildren(...rows.flatMap(([label, value, basis]) => [el('dt', {}, label, ...(basis ? [el('span', { class: `src ${basis}`, text: BASIS[basis] })] : [])), el('dd', { class: 'num', text: value })]));
    values.hidden = !rows.length;
    const how = $('co-how'); how.hidden = !part.how;
    if (part.how) how.replaceChildren(el('b', { text: scene.parts[name] === 'control' ? '조작' : '사용' }), part.how);
    box.hidden = false;
  }
  /** The instruments are up while a wafer is being polished, or when the operator asked for them. */
  const stripActive = s => !!s.wafer && s.wafer.where === 'head' && (s.contact || s.wafer.polishTime > 0);
  /** Shows or hides the two panels and tells the 3D view how much of it they cover, so the tool stays in the free area. */
  function applyLayout(s) {
    const stage = $('stage'), strip = $('strip'), panel = $('drawer');
    const stripOpen = stripMode === 'open' || (stripMode === 'auto' && stripActive(s));
    strip.dataset.open = String(stripOpen); strip.inert = !stripOpen; $('strip-open').hidden = stripOpen;
    panel.dataset.open = String(drawer.open); panel.inert = !drawer.open;
    const right = drawer.open && stage.clientWidth - panel.offsetWidth >= 560 ? panel.offsetWidth + 14 : 0, bottom = stripOpen ? strip.offsetHeight + 14 : 0;
    stage.style.setProperty('--inset-right', `${right}px`); stage.style.setProperty('--inset-bottom', `${bottom}px`); stage.dataset.strip = stripOpen ? 'open' : 'closed';
    layout.right = right; layout.bottom = bottom; scene.setInsets(layout);
    return stripOpen;
  }
  function renderHud(now) {
    const s = sim.state, w = s.wafer;
    if (w && s.monitor) {
      const measured = w.where === 'stage' && w.measured ? w.measured.mean : null;                // the metrology value replaces the last in-situ reading
      const mean = measured ?? s.monitor.mean, left = mean - C.target, inside = Math.abs(left) <= C.targetTol;
      $('mon-mean').textContent = fmt(mean);
      $('mon-togo').replaceChildren(...(inside ? [el('b', { text: '목표 범위 안' })] : left > 0 ? ['목표까지 ', el('b', { text: `${fmt(left)} nm` })] : ['목표보다 ', el('b', { text: `${fmt(-left)} nm` }), ' 얇음']), ...(measured != null ? [' · 계측값'] : []));
      const span = Math.max(1, w.incoming.mean - (C.target - 2 * C.targetTol)), at = v => clamp01((w.incoming.mean - v) / span) * 100;
      const bar = $('mon-bar'), band = $('mon-band');
      bar.style.width = `${at(mean)}%`; bar.dataset.tone = inside ? 'ok' : left < 0 ? 'bad' : '';
      band.style.left = `${at(C.target + C.targetTol)}%`; band.style.width = `${at(C.target - C.targetTol) - at(C.target + C.targetTol)}%`;
    }
    $('log-open').hidden = !attempts.length; $('log-count').textContent = $('log-count-tab').textContent = String(attempts.length);
    if (applyLayout(s)) renderStrip(s);
    const [step, text, label, action, focus] = guide(s);
    $('guide-step').textContent = `${step} / 6`; $('guide-text').textContent = text; focusName = focus || null;
    const button = $('guide-action'); button.hidden = !label; button.textContent = label || ''; guideAction = action || null;
    const alarms = Object.values(s.alarms).map(a => a.text);
    if (notice && now < noticeUntil) alarms.push(notice);
    const host = $('alarms');
    if (host.dataset.key !== alarms.join('|')) { host.dataset.key = alarms.join('|'); host.replaceChildren(...alarms.map(t => el('div', { class: 'alarm', text: t }))); }
    renderCallout(s);
  }
  /** Keeps the callout, the value shown while dragging and the guide marker on their parts as the view moves. */
  function positionOverlays() {
    const canvas = $('scene'), W = canvas.clientWidth, s = sim.state;
    const callout = $('callout'), at = !callout.hidden && hovered ? scene.screenOf(hovered) : null;
    if (at) { callout.style.left = `${at.x}px`; callout.style.top = `${at.y}px`; callout.dataset.side = at.x > W - layout.right - 300 ? 'left' : 'right'; callout.dataset.vert = at.y < 200 ? 'down' : 'up'; }
    const pill = $('pill'), value = dragging && PARTS[dragging]?.pill, held = value ? scene.screenOf(dragging) : null;
    pill.hidden = !held; if (held) { pill.textContent = value(s); pill.style.left = `${held.x}px`; pill.style.top = `${held.y}px`; }
    const focus = $('focus'), target = focusName && !dragging && !hovered ? scene.screenOf(focusName) : null;
    focus.hidden = !target || !target.visible; if (target) { focus.style.left = `${target.x}px`; focus.style.top = `${target.y}px`; }
  }
  function flash(text, seconds = 3) { notice = text; noticeUntil = performance.now() + seconds * 1000; }

  // ----- metrology report -----
  function explain(m) {
    const notes = [], err = m.error, edge = m.profile.at(-1).end - m.profile[0].end;
    if (m.ok.thickness) notes.push(`평균 두께가 목표 범위 안입니다 (목표와 ${fmt(Math.abs(err))} nm 차이).`);
    else if (err > 0) notes.push(`목표보다 ${fmt(err)} nm 두껍습니다. 평균 제거 속도 ${fmt(m.meanRate)} nm/min이면 약 ${fmt(err / Math.max(1, m.meanRate) * 60)}초 더 연마하면 됩니다.`);
    else notes.push(`목표보다 ${fmt(-err)} nm 더 깎았습니다. 깎은 막은 되돌릴 수 없습니다. 헤드를 올리는 동안에도 조금 더 깎이므로 목표에 닿기 직전에 올리기 시작하세요.`);
    if (m.tilt > 8) notes.push(`웨이퍼가 한쪽으로 ${fmt(m.tilt)} nm 기울어 깎였습니다. 헤드가 돌지 않으면 플래튼 바깥쪽을 지나는 면만 빨리 깎입니다.`);
    else if (m.ok.uniformity) notes.push(`균일도 ${fmt(m.wiwnu, 1)}%로 기준(${fmt(C.wiwnuMax, 1)}% 이하) 안입니다.`);
    else if (edge < 0) notes.push(`가운데가 가장자리보다 ${fmt(-edge)} nm 두껍게 남았습니다. 구역 압력 조절기를 가운데 쪽(오른쪽)으로 돌리면 가운데를 더 깎습니다. 압력이 높거나 헤드와 플래튼의 회전수 차이가 크거나 슬러리가 모자라면 가장자리가 더 빨리 깎입니다.`);
    else notes.push(`가장자리가 가운데보다 ${fmt(edge)} nm 두껍게 남았습니다. 구역 압력 조절기를 가장자리 쪽(왼쪽)으로 돌리면 가장자리를 더 깎습니다.`);
    if (m.scratches) notes.push(`스크래치 ${m.scratches}개: 슬러리가 거의 없는 패드에 닿았거나 패드가 과열됐습니다.`);
    if (m.maxTemp > C.tempAlarm) notes.push(`패드 온도가 ${fmt(m.maxTemp)}℃까지 올랐습니다. 압력과 속도의 곱이 클수록 마찰열이 커집니다.`);
    if (m.tool && Math.abs(m.tool.observed - 1) >= 0.03) {
      const slow = m.tool.observed < 1;
      notes.push(`이 웨이퍼에서 장비는 평소보다 ${fmt(Math.abs(m.tool.observed - 1) * 100)}% ${slow ? '느렸습니다' : '빨랐습니다'}. 같은 조건으로 같은 시간 연마해도 그만큼 ${slow ? '덜' : '더'} 깎입니다.`);
    }
    return notes;
  }
  /** State is never colour alone: a mark and a word go with it. */
  const verdict = (ok, pass = '통과', fail = '미달') => el('em', { class: `state ${ok ? 'ok' : 'ng'}` }, el('span', { 'aria-hidden': 'true', text: ok ? '✓' : '✕' }), ok ? pass : fail);
  /** Mean thickness on a scale with the tolerance band: the marker is inside the band or it is not. */
  function targetTrack(value) {
    const lo = C.target - 4 * C.targetTol, hi = C.target + 4 * C.targetTol, at = v => clamp01((v - lo) / (hi - lo)) * 100, ok = Math.abs(value - C.target) <= C.targetTol;
    return el('div', { class: 'track target', role: 'img', 'aria-label': `평균 두께 ${fmt(value)} nm, 기준 ${fmt(C.target - C.targetTol)}~${fmt(C.target + C.targetTol)} nm` },
      el('i', { class: 'band', style: `left:${at(C.target - C.targetTol)}%;width:${at(C.target + C.targetTol) - at(C.target - C.targetTol)}%` }), el('u', { class: `mark ${ok ? 'ok' : 'ng'}`, style: `left:${at(value)}%` }));
  }
  /** Uniformity against its limit: the bar is full at twice the limit. */
  function limitMeter(value) {
    const top = C.wiwnuMax * 2, ok = value <= C.wiwnuMax;
    return el('div', { class: `track meter ${ok ? 'ok' : 'ng'}`, role: 'img', 'aria-label': `균일도 ${fmt(value, 2)}%, 기준 ${fmt(C.wiwnuMax, 1)}% 이하` },
      el('i', { class: 'fill', style: `width:${clamp01(value / top) * 100}%` }), el('u', { class: 'limit', style: `left:${C.wiwnuMax / top * 100}%` }));
  }
  // Thinner than target is blue, thicker is orange, on target is neutral grey.
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
  const diverging = d => mix([221, 226, 233], d < 0 ? [13, 110, 253] : [242, 106, 27], Math.abs(d) ** 0.85);
  function waferMap(m) {
    const size = 196, R = 84, k = R / C.waferRadius, span = Math.max(C.targetTol * 1.5, ...m.points.map(p => Math.abs(p.value - C.target)));
    const root = svg('svg', { viewBox: `${-size / 2} ${-size / 2} ${size} ${size}`, width: size, height: size, class: 'wafer-map', role: 'img', 'aria-label': `49점 두께 지도. 최소 ${fmt(m.min)} nm, 최대 ${fmt(m.max)} nm` });
    root.append(svg('circle', { r: R + 9, class: 'wafer' }), svg('path', { d: `M -6 ${R + 9} L 0 ${R + 2} L 6 ${R + 9} Z`, class: 'notch' }));
    for (const p of m.points) root.append(svg('circle', { cx: (p.x * k).toFixed(1), cy: (p.y * k).toFixed(1), r: 7, fill: diverging(Math.max(-1, Math.min(1, (p.value - C.target) / span))) }));
    const pick = svg('circle', { r: 9.5, class: 'pick', visibility: 'hidden' }); root.append(pick);
    root.addEventListener('pointermove', ev => {                         // the nearest point answers, so the pointer never has to land on a dot
      const box = root.getBoundingClientRect(), x = (ev.clientX - box.left) / box.width * size - size / 2, y = (ev.clientY - box.top) / box.height * size - size / 2;
      const p = m.points.reduce((best, q) => Math.hypot(q.x * k - x, q.y * k - y) < Math.hypot(best.x * k - x, best.y * k - y) ? q : best, m.points[0]);
      pick.setAttribute('cx', p.x * k); pick.setAttribute('cy', p.y * k); pick.setAttribute('visibility', 'visible');
      showTip(ev, `반경 ${fmt(p.r * 1000)} mm`, radiusRows(p.value));
    });
    root.addEventListener('pointerleave', () => { pick.setAttribute('visibility', 'hidden'); hideTip(); });
    return el('figure', {}, el('figcaption', { text: '49점 두께 지도' }), root,
      el('div', { class: 'scale-legend' }, el('i'), el('div', { class: 'scale num' }, el('span', { text: `${signed(-span)} nm` }), el('span', { text: `목표 ${fmt(C.target)}` }), el('span', { text: `${signed(span)} nm` }))));
  }
  /** Table twin of the map and the profile: the same numbers without colour. */
  function ringTable(m) {
    const rings = new Map();
    for (const p of m.points) { const key = Math.round(p.r * 1000); if (!rings.has(key)) rings.set(key, []); rings.get(key).push(p.value); }
    return el('details', { class: 'numbers' }, el('summary', { text: '숫자로 보기' }), el('table', {},
      el('thead', {}, el('tr', {}, ...['반경 (mm)', '점', '평균 (nm)', '최소', '최대'].map((t, i) => el('th', { class: i ? 'num' : '', text: t })))),
      el('tbody', {}, ...[...rings].sort((a, b) => a[0] - b[0]).map(([r, v]) => el('tr', {}, el('td', { text: fmt(r) }), ...[v.length, v.reduce((a, b) => a + b, 0) / v.length, Math.min(...v), Math.max(...v)].map(n => el('td', { class: 'num', text: fmt(n) })))))));
  }
  const pairs = list => list.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { class: 'num', text: v })]);
  const conditionsOf = e => e.cond ? [['다운포스', `${fmt(e.m.meanPressure, 1)} psi`], ['플래튼', `${fmt(e.cond.platen)} rpm`], ['헤드', `${fmt(e.cond.carrier)} rpm`], ['슬러리', `${fmt(e.cond.flow)} mL/min`],
    ['구역 압력', zoneText(e.cond.zone)], ['컨디셔너', e.cond.conditioner > 0.95 ? '계속 사용' : e.cond.conditioner < 0.05 ? '사용 안 함' : `시간의 ${pct(e.cond.conditioner)}`]] : [];
  /** What this wafer showed of the tool, what the model expected before it, and what it expects of the next one. */
  function toolSection(t) {
    const first = [t.afterPadChange ? '새 패드의 첫 웨이퍼' : null, t.rested ? '쉬고 난 뒤의 첫 웨이퍼' : null].filter(Boolean);
    return el('section', { class: 'tool-state' }, el('h4', {}, '장비 상태', el('span', { class: 'src data', text: BASIS.data })),
      el('p', { class: 'sub', text: '평소(×1)에 대한 제거 속도의 비율 · 괄호는 90% 범위' }),
      el('dl', { class: 'stats' }, ...pairs([['이 웨이퍼에서 본 값', times(t.observed)], ['연마 전 모델의 예상', rangeText(t.predicted)], ['다음 웨이퍼 예상', rangeText(t.next)], ['패드 사용', pct(t.padShare)]])),
      ...(first.length ? [el('p', { class: 'sub', text: first.join(' · ') })] : []));
  }
  function renderReport() {
    const host = $('report'), e = attempts.find(a => a.id === drawer.selected) || attempts[0];
    if (!e) { host.replaceChildren(el('p', { class: 'empty', text: '연마한 웨이퍼를 계측기에 올리면 리포트가 나옵니다.' })); return; }
    const m = e.m, ends = m.profile.map(p => p.end), cursor = { t: null, r: null };
    const trend = el('div', { class: 'plot', role: 'img', 'aria-label': '이 웨이퍼의 연마 시간에 따른 평균 막 두께' }), profile = el('div', { class: 'plot', role: 'img', 'aria-label': '연마 뒤 반경별 막 두께' });
    if (e.trend.length > 1) trend.setAttribute('aria-label', `이 웨이퍼의 평균 막 두께: 헤드에 올린 뒤 ${fmt(e.trend.at(-1).t)}초 동안 ${fmt(e.trend[0].mean)} nm에서 ${fmt(e.trend.at(-1).mean)} nm로 줄었습니다.`);
    const draw = () => { profilePlot(profile, ends, cursor.r); if (e.trend.length > 1) trendPlot(trend, e.trend, m.incoming, cursor.t, true); };
    onChart(profile, (r, ev) => { cursor.r = r; draw(); if (r == null) return; const i = Math.round(r / (C.waferRadius * 1000) * (ends.length - 1)); showTip(ev, `반경 ${fmt(m.profile[i].r * 1000)} mm`, radiusRows(ends[i])); });
    onChart(trend, (t, ev) => { cursor.t = t; draw(); if (t == null) return; const p = sampleAt(e.trend, t); showTip(ev, `${fmt(p.t)}초`, timeRows(p)); });
    const current = sim.state.wafer, here = !!current && current.id === e.id && current.where === 'stage';
    const again = el('button', { type: 'button', class: 'btn', text: '이어서 연마' }), next = el('button', { type: 'button', class: 'btn primary', text: '새 웨이퍼' });
    again.disabled = !here; again.addEventListener('click', () => onWafer('head')); next.addEventListener('click', newWafer);
    const conditions = conditionsOf(e);
    host.replaceChildren(
      el('div', { class: 'report-head' }, el('div', {}, el('h3', { text: `웨이퍼 #${e.id}` }), el('p', { class: 'sub', text: `49점 계측 · 연마 ${fmt(m.polishTime)}초` })),
        el('span', { class: `verdict ${m.pass ? 'pass' : 'fail'}` }, el('span', { 'aria-hidden': 'true', text: m.pass ? '✓' : '✕' }), m.pass ? '합격' : '불합격')),
      el('ul', { class: 'criteria' },
        el('li', {}, el('div', { class: 'crit' }, el('span', { text: '평균 두께' }), el('b', { text: `${fmt(m.mean)} nm` }), verdict(m.ok.thickness)), targetTrack(m.mean),
          el('div', { class: 'scale num' }, el('span', { text: fmt(C.target - 4 * C.targetTol) }), el('span', { text: `목표 ${fmt(C.target)} ± ${fmt(C.targetTol)}` }), el('span', { text: fmt(C.target + 4 * C.targetTol) }))),
        el('li', {}, el('div', { class: 'crit' }, el('span', { text: '균일도 (1σ)' }), el('b', { text: `${fmt(m.wiwnu, 2)}%` }), verdict(m.ok.uniformity)), limitMeter(m.wiwnu),
          el('div', { class: 'scale num' }, el('span', { text: '0' }), el('span', { text: `기준 ${fmt(C.wiwnuMax, 1)}% 이하` }), el('span', { text: `${fmt(C.wiwnuMax * 2)}%` }))),
        el('li', {}, el('div', { class: 'crit' }, el('span', { text: '스크래치' }), el('b', { text: `${m.scratches}개` }), verdict(m.ok.defects)))),
      el('div', { class: 'maps' }, waferMap(m), el('figure', {}, el('figcaption', { text: '반경별 두께 (nm)' }), profile)),
      ringTable(m),
      el('section', {}, el('h4', { text: '결과 풀이' }), el('ul', { class: 'notes' }, ...explain(m).map(t => el('li', { text: t })))),
      el('section', {}, el('h4', { text: '연마 기록' }),
        ...(e.trend.length > 1 ? [el('figure', {}, el('figcaption', { text: '막 두께 추이 (nm)' }), trend)] : []),
        ...(conditions.length ? [el('p', { class: 'sub', text: '연마하는 동안의 평균 조건' }), el('dl', { class: 'stats' }, ...pairs(conditions))] : []),
        el('p', { class: 'sub', text: '결과' }),
        el('dl', { class: 'stats' }, ...pairs([['깎은 양', `${fmt(m.removed)} nm`], ['평균 제거 속도', `${fmt(m.meanRate)} nm/min`], ['두께 범위', `${fmt(m.range)} nm`], ['슬러리 사용량', `${fmt(m.slurryUsed)} mL`], ['최고 패드 온도', `${fmt(m.maxTemp)} ℃`]]))),
      ...(m.tool ? [toolSection(m.tool)] : []),
      el('footer', {}, again, next));
    draw();
  }
  /** Every measured wafer in one list: the result against the work order, and the conditions that led to it. */
  function renderLog() {
    const host = $('log');
    if (!attempts.length) { host.replaceChildren(el('p', { class: 'empty', text: '아직 계측한 웨이퍼가 없습니다.' })); return; }
    host.replaceChildren(el('div', { class: 'log-head' }, ...['웨이퍼', '평균 두께', '균일도', '판정'].map(t => el('span', { text: t }))), ...attempts.map(e => {
      const m = e.m, row = el('button', { type: 'button', class: 'log-row', 'aria-pressed': String(e.id === drawer.selected) },
        el('b', { class: 'id', text: `#${e.id}` }),
        el('span', { class: 'cell' }, el('b', { class: 'num', text: `${fmt(m.mean)} nm` }), targetTrack(m.mean)),
        el('span', { class: 'cell' }, el('b', { class: 'num', text: `${fmt(m.wiwnu, 1)}%` }), limitMeter(m.wiwnu)),
        verdict(m.pass, '합격', '불합격'),
        el('span', { class: 'cond' }, ...[...conditionsOf(e).slice(0, 5).map(([k, v]) => `${k} ${v}`), `연마 ${fmt(m.polishTime)}초`, ...(m.tool ? [`장비 ${times(m.tool.observed)}`] : []), ...(m.scratches ? [`스크래치 ${m.scratches}개`] : [])].map(text => el('span', { text }))));
      row.addEventListener('click', () => { drawer.selected = e.id; showDrawer('report'); });
      return row;
    }));
  }
  function showDrawer(tab = drawer.tab) {
    drawer.open = true; drawer.tab = tab;
    for (const b of $('drawer-tabs').children) b.setAttribute('aria-pressed', String(b.dataset.tab === tab));
    $('report').hidden = tab !== 'report'; $('log').hidden = tab !== 'log';
    applyLayout(sim.state);
    if (tab === 'report') renderReport(); else renderLog();
  }
  function closeDrawer() { drawer.open = false; hideTip(); applyLayout(sim.state); }
  function finishMeasure() {
    const m = sim.measure(); if (!m) return;
    const cond = track.id === m.waferId && track.time > 0 ? { platen: track.platen / track.time, carrier: track.carrier / track.time, flow: track.flow / track.time, zone: track.zone / track.time, conditioner: track.conditioner / track.time } : null;
    attempts = [{ id: m.waferId, m, cond, trend: trendData() }, ...attempts.filter(a => a.id !== m.waferId)].slice(0, 12);   // a re-measured wafer replaces its earlier entry
    drawer.selected = m.waferId; showDrawer('report'); hudClock = 1;                    // the guide follows in the same frame
  }

  // ----- operator actions -----
  function emergencyStop() {
    for (const [name, value] of [['head', 0], ['platen', 0], ['carrier', 0], ['slurry', 0], ['conditioner', false]]) sim.setControl(name, value);
    flash('비상 정지: 회전과 슬러리를 멈추고 헤드를 올렸습니다.', 4);
  }
  function onControl(name, value) { if (name === 'emo') emergencyStop(); else sim.setControl(name, value); }
  function onWafer(target) {
    if (!sim.moveWafer(target)) { flash('헤드를 끝까지 올린 뒤에 웨이퍼를 옮길 수 있습니다.'); return; }
    if (target === 'stage') { measureAt = performance.now() + 1400; scene.startMeasuring(1.4); } else if (drawer.open) closeDrawer();
    paintFilm(); hudClock = 1;
  }
  function newWafer() {
    sim.setControl('head', 0); measureAt = 0; hover.t = hover.r = null;
    sim.newWafer(); paintFilm(); if (drawer.open) closeDrawer(); hudClock = 1;
  }
  function changePad() {
    if (!sim.replacePad()) { flash('패드는 장비를 세운 뒤에 교체합니다. 웨이퍼를 내리고 플래튼을 멈추세요.', 4); return; }
    flash('새 패드를 붙였습니다.', 4); hudClock = 1;
  }
  function showView(name) { scene.setView(name); for (const b of $('views').children) b.setAttribute('aria-pressed', String(b.dataset.view === name)); }
  function bind() {
    $('speed').addEventListener('click', ev => { const b = ev.target.closest('button[data-speed]'); if (!b) return; timeScale = Number(b.dataset.speed); for (const x of $('speed').children) x.setAttribute('aria-pressed', String(x === b)); });
    $('views').addEventListener('click', ev => { const b = ev.target.closest('button[data-view]'); if (b) showView(b.dataset.view); });
    $('new-wafer').addEventListener('click', newWafer);
    $('pad-change').addEventListener('click', changePad);
    $('guide-action').addEventListener('click', () => guideAction?.());
    $('help-open').addEventListener('click', () => $('help').showModal());
    $('strip-open').addEventListener('click', () => { stripMode = 'open'; hudClock = 1; });
    $('strip-close').addEventListener('click', () => { stripMode = 'closed'; hideTip(); hudClock = 1; });
    $('log-open').addEventListener('click', () => { if (drawer.open) closeDrawer(); else showDrawer(attempts.length > 1 ? 'log' : 'report'); });
    $('drawer-close').addEventListener('click', closeDrawer);
    $('drawer-tabs').addEventListener('click', ev => { const b = ev.target.closest('button[data-tab]'); if (b) showDrawer(b.dataset.tab); });
    const note = $('model-note'), noteTip = () => { const r = note.getBoundingClientRect(); showTip({ clientX: r.left, clientY: r.top }, '제거 속도 계산', [], `기준 ${fmt(C.rateRef)} nm/min에 아래 일곱 요인을 곱합니다. 가운데 선이 기준(×1)이고, 파랑은 느려지는 쪽, 주황은 빨라지는 쪽입니다. ${SCOPE}`); };
    note.addEventListener('pointerenter', noteTip); note.addEventListener('focus', noteTip); note.addEventListener('pointerleave', hideTip); note.addEventListener('blur', hideTip);
  }

  function viewOf(s) {
    return {
      gap: s.gap, pressure: s.pressure, contact: s.contact, polishing: s.polishing, platenRpm: s.platenRpm,
      platenAngle: spin.platen, carrierAngle: spin.carrier, sweepPhase: spin.sweep, flow: s.flow, coverage: s.coverage, glaze: s.glaze, temp: s.temp,
      controls: s.controls, wafer: s.wafer ? { where: s.wafer.where, id: s.wafer.id } : null, alarm: Object.keys(s.alarms).length > 0,
    };
  }
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    sim.step(dt * timeScale);
    const s = sim.state, visual = Math.min(timeScale, 2.5);
    spin.platen += s.platenRpm * RPM * dt * visual; spin.carrier += s.carrierRpm * RPM * dt * visual;
    if (s.controls.conditioner) spin.sweep += dt * visual * 2 * Math.PI / 6;
    if (s.polishing && s.wafer) {                                         // conditions of this wafer, weighted by polishing time
      const h = dt * timeScale;
      if (track.id !== s.wafer.id) Object.assign(track, { id: s.wafer.id, time: 0, platen: 0, carrier: 0, flow: 0, zone: 0, conditioner: 0 });
      track.time += h; track.platen += s.platenRpm * h; track.carrier += s.carrierRpm * h; track.flow += s.flow * h; track.zone += s.controls.zone * h; track.conditioner += (s.controls.conditioner ? 1 : 0) * h;
    }
    scene.update(viewOf(s), dt);
    if (measureAt && now >= measureAt) { measureAt = 0; finishMeasure(); }
    filmClock += dt; if (filmClock >= (s.polishing ? 0.1 : 0.5)) { filmClock = 0; paintFilm(); }
    hudClock += dt; if (hudClock >= 0.1) { hudClock = 0; renderHud(now); }
    screenClock += dt; if (screenClock >= 0.33) { screenClock = 0; paintScreen(); }
    positionOverlays(); scene.render();
    requestAnimationFrame(frame);
  }

  function init() {
    const seed = Number(new URLSearchParams(location.search).get('seed')) || (Date.now() % 100000) + 1;
    sim = P.create({ seed, tool: Tool.create({ seed }) }); sim.newWafer();
    scene = Scene.create({
      canvas: $('scene'), constants: C,
      on: {
        control: onControl, wafer: onWafer, hover: name => { hovered = name; renderCallout(sim.state); }, drag: name => { dragging = name; renderCallout(sim.state); },
        press: name => { if (name === 'hmi') showView('screen'); }, refuse: () => flash('헤드를 끝까지 올린 뒤에 웨이퍼를 꺼낼 수 있습니다.'),
      },
    });
    if (!scene) { $('fallback').hidden = false; $('scene').hidden = true; document.querySelector('.hud').hidden = true; return; }
    for (const name of Object.keys(scene.parts)) if (!PARTS[name]) console.warn(`lab-3d: no card for part "${name}"`);
    build(); bind(); renderReport(); renderLog(); paintFilm();
    window.Lab3DDebug = {
      sim, scene, constants: C, parts: PARTS, newWafer, onWafer, changePad, measureNow: finishMeasure, showDrawer, closeDrawer,
      setSpeed: v => { timeScale = v; }, setStrip: mode => { stripMode = mode; hudClock = 1; },
      get speed() { return timeScale; }, get attempts() { return attempts; }, get drawer() { return { ...drawer }; }, get strip() { return $('strip').dataset.open === 'true'; },
    };
    last = performance.now(); requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
