/* CMP direct-operation experiment: page logic.
 * Steps the process model in real time, hands its state to the 3D scene, and draws the instruments around it. */
(function () {
  'use strict';
  const P = window.Lab3DProcess, Scene = window.CMPLab3DScene, C = P.constants;
  const $ = id => document.getElementById(id);
  const RPM = 2 * Math.PI / 60, FILM = 256;
  const fmt = (v, d = 0) => Number(v).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });
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

  const HINTS = {
    head: '헤드: 아래로 끌면 내려가고, 패드에 닿은 뒤 더 끌면 압력이 올라갑니다. 휠로 조금씩 바꿀 수 있습니다.',
    platen: '플래튼(패드): 원을 그리듯 끌어 돌립니다. 시계 반대 방향으로 끌면 빨라집니다.',
    carrier: '헤드 회전 링: 오른쪽으로 끌면 헤드가 빨리 돕니다.',
    zone: '구역 압력 다이얼: 오른쪽으로 돌리면 웨이퍼 가운데를, 왼쪽으로 돌리면 가장자리를 더 세게 누릅니다.',
    slurry: '슬러리 밸브: 오른쪽이나 위로 끌면 더 열립니다.',
    conditioner: '컨디셔너: 누르면 패드 위를 쓸고, 다시 누르면 대기 위치로 돌아갑니다.',
    wafer: '웨이퍼: 끌어서 헤드 아래나 계측대에 놓습니다.',
  };
  const GAUGES = [
    { key: 'pressure', label: '다운포스', unit: 'psi', max: C.pressureMax, digits: 1, get: s => s.pressure },
    { key: 'platen', label: '플래튼', unit: 'rpm', max: C.rpmMax, get: s => s.platenRpm },
    { key: 'carrier', label: '헤드 회전', unit: 'rpm', max: C.rpmMax, get: s => s.carrierRpm },
    { key: 'slurry', label: '슬러리', unit: 'mL/min', max: C.slurryMax, get: s => s.flow },
    { key: 'coverage', label: '패드 젖음', unit: '%', max: 100, get: s => s.coverage * 100, tone: (v, s) => s.polishing && v < 16 ? 'bad' : s.polishing && v < 45 ? 'warn' : '' },
    { key: 'glaze', label: '패드 거칠기', unit: '%', max: 100, get: s => s.glaze * 100, tone: v => v < 50 ? 'bad' : v < 75 ? 'warn' : '' },
    { key: 'temp', label: '패드 온도', unit: '℃', max: 90, get: s => s.temp, tone: v => v > C.tempAlarm ? 'bad' : v > 58 ? 'warn' : '' },
  ];
  const FACTORS = [
    ['pressure', '압력', 'Preston 식: 제거 속도는 압력에 비례합니다. 웨이퍼 가장자리는 패드가 되튀어 더 세게 눌립니다.', 'book'],
    ['speed', '속도', '플래튼과 헤드의 회전에서 나오는 상대 속도입니다. 두 회전수가 다르면 가장자리가 더 빨리 지나갑니다.', 'book'],
    ['slurry', '슬러리', '패드가 젖은 정도에 따라 늘다가 포화합니다. 모자라면 웨이퍼 가운데부터 덜 깎입니다.', 'simple'],
    ['pad', '패드', '연마할수록 패드 표면이 무뎌지고, 컨디셔너가 다시 거칠게 만듭니다.', 'simple'],
    ['temp', '온도', '마찰열(마찰계수 × 압력 × 속도)로 패드가 데워지면 Arrhenius 식만큼 빨라집니다.', 'book'],
    ['contact', '접촉', '속도에 비해 압력이 낮으면 웨이퍼가 슬러리 막 위에 떠서 거의 깎이지 않습니다.', 'simple'],
  ];
  const TAGS = ['head', 'platen', 'carrier', 'zone', 'slurry', 'conditioner', 'wafer', 'pedestal', 'stage'];

  let sim, scene, timeScale = 4, last = 0, hudClock = 1, filmClock = 1, screenClock = 1, hovered = null, dragging = null;
  let notice = null, noticeUntil = 0, measureAt = 0, attempts = [], filmPixels = null, filmImage = null;
  const spin = { platen: 0, carrier: 0, sweep: 0 }, nodes = { gauges: {}, factors: {}, tags: {}, model: {} };

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
    v.fillStyle = '#dfe5ed'; v.beginPath(); v.arc(m / 2, m - 2, 5, 0, 7); v.fill();          // notch
  }

  function paintProfile() {
    const canvas = $('profile'), x = canvas.getContext('2d'), W = canvas.width, H = canvas.height, s = sim.state, w = s.wafer;
    x.clearRect(0, 0, W, H);
    if (!w || !s.monitor) return;
    const L = 66, R = 8, T = 8, B = 22, profile = s.monitor.profile, n = profile.length;
    let lo = Math.min(C.target - C.targetTol - 15, ...profile), hi = Math.max(C.target + C.targetTol + 15, ...profile);
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const px = i => L + (W - L - R) * i / (n - 1), py = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    x.fillStyle = 'rgba(16,185,129,.16)'; x.fillRect(L, py(C.target + C.targetTol), W - L - R, py(C.target - C.targetTol) - py(C.target + C.targetTol));
    x.strokeStyle = 'rgba(16,185,129,.8)'; x.setLineDash([5, 4]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(L, py(C.target)); x.lineTo(W - R, py(C.target)); x.stroke(); x.setLineDash([]);
    x.strokeStyle = '#0d6efd'; x.lineWidth = 3; x.lineJoin = 'round'; x.beginPath();
    for (let i = 0; i < n; i++) i ? x.lineTo(px(i), py(profile[i])) : x.moveTo(px(i), py(profile[i]));
    x.stroke();
    x.fillStyle = '#64748b'; x.font = '20px "Pretendard Variable", "Malgun Gothic", sans-serif'; x.textBaseline = 'middle';
    x.textAlign = 'right'; x.fillText(fmt(hi - pad), L - 6, py(hi - pad)); x.fillText(fmt(lo + pad), L - 6, py(lo + pad));
    x.textBaseline = 'alphabetic'; x.textAlign = 'left'; x.fillText('가운데', L, H - 3); x.textAlign = 'right'; x.fillText('가장자리', W - R, H - 3);
  }

  // The screen mounted on the tool shows the same film monitor an operator would watch.
  function paintScreen() {
    const c = scene.screenCanvas, x = c.getContext('2d'), s = sim.state, w = s.wafer;
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#16233a'; x.fillRect(0, 0, c.width, 46);
    x.fillStyle = '#8fb4ff'; x.font = '600 22px "Pretendard Variable", "Malgun Gothic", sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillText('CMP-01  FILM MONITOR', 18, 24);
    const alarm = Object.keys(s.alarms).length > 0;
    x.textAlign = 'right'; x.fillStyle = alarm ? '#ff6b6b' : s.polishing ? '#4ade80' : '#fbbf24'; x.fillText(alarm ? 'ALARM' : s.polishing ? 'POLISH' : 'IDLE', c.width - 18, 24);
    if (w) {
      x.save(); x.beginPath(); x.arc(110, 180, 88, 0, 7); x.clip(); x.drawImage(scene.filmCanvas, 22, 92, 176, 176); x.restore();
      x.strokeStyle = '#2b3b59'; x.lineWidth = 3; x.beginPath(); x.arc(110, 180, 89, 0, 7); x.stroke();
      x.textAlign = 'left'; x.fillStyle = '#e8eefc'; x.font = '700 64px "Pretendard Variable", "Malgun Gothic", sans-serif'; x.fillText(fmt(s.monitor.mean), 226, 132);
      x.font = '500 22px "Pretendard Variable", "Malgun Gothic", sans-serif'; x.fillStyle = '#8ea3c7'; x.fillText(`nm   target ${C.target}`, 228, 180);
      x.fillStyle = '#e8eefc'; x.fillText(`${fmt(s.rate)} nm/min`, 228, 224); x.fillText(`${fmt(s.temp)} C   ${fmt(w.polishTime)} s`, 228, 262);
      const span = Math.max(1, w.incoming.mean - C.target), done = Math.min(1, Math.max(0, (w.incoming.mean - s.monitor.mean) / span));
      x.fillStyle = '#1c2b47'; x.fillRect(226, 286, 262, 12); x.fillStyle = done >= 1 ? '#4ade80' : '#3b82f6'; x.fillRect(226, 286, 262 * done, 12);
    }
    scene.refreshScreen();
  }

  function paintChart() {
    const canvas = $('chart'), x = canvas.getContext('2d'), W = canvas.width, H = canvas.height, h = sim.state.history;
    x.clearRect(0, 0, W, H);
    const L = 86, R = 20, rows = [
      { label: '평균 두께 (nm)', color: '#0d6efd', get: p => p.mean, band: [C.target - C.targetTol, C.target + C.targetTol] },
      { label: '제거 속도 (nm/min)', color: '#f97316', get: p => p.rate, zero: true },
      { label: '패드 온도 (℃)', color: '#dc2626', get: p => p.temp, line: C.tempAlarm, floor: C.ambient - 2 },
    ];
    const rowH = (H - 44) / rows.length, tMax = Math.max(60, h.length ? h.at(-1).t : 0);
    x.font = '20px "Pretendard Variable", "Malgun Gothic", sans-serif';
    rows.forEach((row, k) => {
      const top = 8 + k * rowH, bottom = top + rowH - 18, values = h.map(row.get);
      let lo = Math.min(...values, ...(row.band || []), row.floor ?? Infinity, row.zero ? 0 : Infinity);
      let hi = Math.max(...values, ...(row.band || []), row.line ?? -Infinity, row.zero ? 50 : -Infinity);
      if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
      if (hi - lo < 1e-6) hi = lo + 1;
      hi += (hi - lo) * 0.28;                                            // headroom for the row label
      const px = t => L + (W - L - R) * t / tMax, py = v => bottom - (bottom - top) * (v - lo) / (hi - lo);
      x.strokeStyle = '#e5eaf2'; x.lineWidth = 1; x.strokeRect(L, top, W - L - R, bottom - top);
      if (row.band) { x.fillStyle = 'rgba(16,185,129,.14)'; x.fillRect(L, py(row.band[1]), W - L - R, py(row.band[0]) - py(row.band[1])); }
      if (row.line !== undefined) { x.strokeStyle = 'rgba(220,38,38,.5)'; x.setLineDash([6, 5]); x.beginPath(); x.moveTo(L, py(row.line)); x.lineTo(W - R, py(row.line)); x.stroke(); x.setLineDash([]); }
      x.fillStyle = '#64748b'; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(fmt(hi), L - 8, top + 8); x.fillText(fmt(lo), L - 8, bottom - 6);
      x.textAlign = 'right'; x.fillStyle = row.color; x.fillText(row.label, W - R - 10, top + 16);
      if (values.length > 1) { x.strokeStyle = row.color; x.lineWidth = 3; x.lineJoin = 'round'; x.beginPath(); h.forEach((p, i) => i ? x.lineTo(px(p.t), py(values[i])) : x.moveTo(px(p.t), py(values[i]))); x.stroke(); }
    });
    x.fillStyle = '#64748b'; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText('0초', L, H - 8);
    x.textAlign = 'right'; x.fillText(`${fmt(tMax)}초 (헤드에 올린 뒤)`, W - R, H - 8);
  }

  // ----- instruments -----
  function build() {
    for (const g of GAUGES) {
      const value = el('b', { class: 'num' }), bar = el('u');
      const node = el('div', { class: 'gauge' }, el('span', { text: g.label }), value, el('i', {}, bar));
      nodes.gauges[g.key] = { node, value, bar }; $('gauges').append(node);
    }
    for (const [key, label, text, kind] of FACTORS) {
      const chip = el('b', { class: 'num' }), cell = el('div', { class: 'factor', title: text }, el('span', { text: label }), chip);
      nodes.factors[key] = { cell, chip }; $('factors').append(cell);
      const v = el('span', { class: 'v' });
      nodes.model[key] = v;
      $('model-list').append(el('li', {}, el('b', { text: label }), v, el('span', {}, text, el('span', { class: `src ${kind}`, text: kind === 'book' ? '교과서 식' : '단순화 가정' }))));
    }
    for (const name of TAGS) { const tag = el('span', { class: `tag${['pedestal', 'stage'].includes(name) ? ' place' : ''}` }); nodes.tags[name] = tag; $('tags').append(tag); }
    $('eq-ref').textContent = fmt(C.rateRef);
    $('order-target').textContent = `${fmt(C.target)} ± ${fmt(C.targetTol)} nm`;
    $('order-wiwnu').textContent = `${fmt(C.wiwnuMax, 1)}% 이하`;
  }
  function renderOrder() {
    const w = sim.state.wafer, d = w.incoming.edgeMinusCentre;
    $('order-incoming').textContent = `웨이퍼 ${w.id} · 들어온 막 평균 ${fmt(w.incoming.mean)} nm · 가장자리가 가운데보다 ${fmt(Math.abs(d))} nm ${d > 0 ? '두꺼움' : '얇음'}`;
  }

  function guide(s) {
    const w = s.wafer, c = s.controls;
    if (measureAt) return [5, '계측 중입니다. 49곳의 두께를 재고 있습니다.'];
    if (!w) return [1, '새 웨이퍼를 준비하세요.', '새 웨이퍼', () => newWafer()];
    if (w.where === 'stage') return [6, w.measured?.pass ? '기준을 모두 맞췄습니다. 아래 결과를 확인하고 새 웨이퍼로 조건을 바꿔 보세요.' : '아래 결과를 확인하세요. 두꺼우면 헤드로 다시 옮겨 이어서 연마할 수 있습니다.', '새 웨이퍼', () => newWafer()];
    if (w.where === 'pedestal') return [1, s.gap < C.headTravel * 0.5 ? '헤드를 위로 끌어 올린 뒤 웨이퍼를 헤드 아래에 놓으세요.' : '오른쪽 앞의 웨이퍼를 끌어다 헤드 아래에 놓으세요.', '헤드에 올리기', () => { sim.setControl('head', 0); if (!sim.moveWafer('head')) flash('헤드가 올라간 뒤에 다시 눌러 주세요.'); }];
    if (w.polishTime === 0 || s.polishing || s.contact) {
      if (!s.contact) {
        if (c.platen < 5) return [2, '패드를 원을 그리듯 끌어 플래튼을 돌리세요.'];
        if (c.carrier < 5) return [2, '헤드 위쪽의 주황색 링을 오른쪽으로 끌어 헤드를 돌리세요.'];
        if (c.slurry < 5) return [2, '왼쪽의 빨간 밸브를 오른쪽으로 끌어 슬러리를 흘리세요.'];
        return [3, '헤드를 아래로 끌어 패드에 닿게 하세요.'];
      }
      if (s.pressure < 0.3 && c.head <= 1.02) return [3, '헤드를 더 아래로 끌어 압력을 주세요.'];
      return [4, `막 두께 모니터가 ${fmt(C.target)} nm에 가까워지면 헤드를 위로 끌어 올리세요. 조건은 연마 중에도 바꿀 수 있습니다.`];
    }
    if (s.gap < C.headTravel * 0.5) return [5, '헤드를 끝까지 올리세요.'];
    return [5, '헤드를 옆으로 끌어 웨이퍼를 꺼내고, 오른쪽 뒤 계측대에 놓으세요.', '계측대로 옮기기', () => onWafer('stage')];
  }
  let guideAction = null;
  function renderHud(now) {
    const s = sim.state, w = s.wafer;
    for (const g of GAUGES) {
      const v = g.get(s), n = nodes.gauges[g.key];
      n.value.replaceChildren(fmt(v, g.digits || 0), el('small', { text: g.unit }));
      n.bar.style.width = `${Math.max(0, Math.min(100, v / g.max * 100))}%`;
      n.node.dataset.tone = g.tone ? g.tone(v, s) : '';
    }
    let product = C.rateRef;
    for (const [key] of FACTORS) {
      const v = s.factors[key]; product *= v;
      nodes.factors[key].chip.textContent = `×${fmt(v, 2)}`;
      nodes.factors[key].cell.dataset.tone = !s.polishing ? '' : v < 0.9 ? 'low' : v > 1.1 ? 'high' : '';
      nodes.model[key].textContent = `×${fmt(v, 2)}`;
    }
    $('eq-rate').textContent = fmt(s.polishing ? s.rate : product * (s.contact ? 1 : 0));
    if (w && s.monitor) {
      const mean = s.monitor.mean, left = mean - C.target;
      $('mon-mean').textContent = fmt(mean);
      $('mon-togo').replaceChildren(...(Math.abs(left) <= C.targetTol ? [el('b', { text: '목표 범위 안' }), ` (${left >= 0 ? '+' : '−'}${fmt(Math.abs(left))} nm)`]
        : left > 0 ? ['목표까지 ', el('b', { text: `${fmt(left)} nm` })] : ['목표보다 ', el('b', { text: `${fmt(-left)} nm` }), ' 얇음']));
      $('mon-rate').textContent = `${fmt(s.rate)} nm/min`;
      $('mon-wiwnu').textContent = `${fmt(s.monitor.wiwnu, 1)}%`;
      $('mon-time').textContent = `${fmt(w.polishTime)}초`;
    }
    paintProfile();
    const tag = nodes.tags;
    tag.head.textContent = s.contact ? `다운포스 ${fmt(s.pressure, 1)} psi` : `헤드 ${fmt(s.gap * 1000)} mm 위`;
    tag.platen.textContent = `플래튼 ${fmt(s.platenRpm)} rpm`;
    tag.carrier.textContent = `헤드 회전 ${fmt(s.carrierRpm)} rpm`;
    const zone = Math.round(s.controls.zone * 100);
    tag.zone.textContent = zone === 0 ? '구역 압력 균등' : `구역 압력 ${zone > 0 ? '가운데' : '가장자리'} +${Math.abs(zone)}%`;
    tag.slurry.textContent = `슬러리 ${fmt(s.flow)} mL/min`;
    tag.conditioner.textContent = `컨디셔너 ${s.controls.conditioner ? '쓰는 중' : '대기'}`;
    tag.wafer.textContent = '웨이퍼';
    tag.pedestal.textContent = '로드 위치'; tag.stage.textContent = '계측대';
    for (const name of TAGS) tag[name].dataset.active = String(dragging === name || hovered === name);
    const [step, text, label, action] = guide(s);
    $('guide-step').textContent = `${step} / 6`; $('guide-text').textContent = text;
    const button = $('guide-action'); button.hidden = !label; button.textContent = label || ''; guideAction = action || null;
    const alarms = Object.values(s.alarms).map(a => a.text);
    if (notice && now < noticeUntil) alarms.push(notice);
    const host = $('alarms');
    if (host.dataset.key !== alarms.join('|')) { host.dataset.key = alarms.join('|'); host.replaceChildren(...alarms.map(t => el('div', { class: 'alarm', text: t }))); }
    const tip = $('tip'); tip.hidden = !hovered || !!dragging; if (hovered) tip.textContent = HINTS[hovered] || '';
    paintChart();
  }
  function positionTags() {
    const w = sim.state.wafer;
    for (const name of TAGS) {
      const p = scene.screenOf(name), tag = nodes.tags[name];
      const hide = !p || !p.visible || (name === 'wafer' && (!w || w.where === 'head')) || (name === 'pedestal' && w?.where === 'pedestal') || (name === 'stage' && w?.where === 'stage');
      tag.hidden = hide; if (!hide) { tag.style.left = `${p.x}px`; tag.style.top = `${p.y}px`; }
    }
  }
  function flash(text, seconds = 3) { notice = text; noticeUntil = performance.now() + seconds * 1000; }

  // ----- results -----
  function explain(m) {
    const notes = [], err = m.error, edge = m.profile.at(-1).end - m.profile[0].end;
    if (m.ok.thickness) notes.push(`평균 두께가 목표 범위 안입니다 (목표와 ${fmt(Math.abs(err))} nm 차이).`);
    else if (err > 0) notes.push(`목표보다 ${fmt(err)} nm 두껍습니다. 평균 제거 속도 ${fmt(m.meanRate)} nm/min이면 약 ${fmt(err / Math.max(1, m.meanRate) * 60)}초 더 연마하면 됩니다. 웨이퍼를 헤드로 다시 옮겨 이어서 연마할 수 있습니다.`);
    else notes.push(`목표보다 ${fmt(-err)} nm 더 깎았습니다. 깎은 막은 되돌릴 수 없습니다. 헤드를 올리는 동안에도 조금 더 깎이므로 목표에 닿기 직전에 올리기 시작하세요.`);
    if (m.tilt > 8) notes.push(`웨이퍼가 한쪽으로 ${fmt(m.tilt)} nm 기울어 깎였습니다. 헤드가 돌지 않으면 플래튼 바깥쪽을 지나는 면만 빨리 깎입니다.`);
    else if (m.ok.uniformity) notes.push(`균일도 ${fmt(m.wiwnu, 1)}%로 기준(${fmt(C.wiwnuMax, 1)}% 이하) 안입니다.`);
    else if (edge < 0) notes.push(`가운데가 가장자리보다 ${fmt(-edge)} nm 두껍게 남았습니다. 구역 압력 다이얼을 가운데 쪽(오른쪽)으로 돌리면 가운데를 더 깎습니다. 압력이 높거나 헤드와 플래튼의 회전수 차이가 크거나 슬러리가 모자라면 가장자리가 더 빨리 깎입니다.`);
    else notes.push(`가장자리가 가운데보다 ${fmt(edge)} nm 두껍게 남았습니다. 구역 압력 다이얼을 가장자리 쪽(왼쪽)으로 돌리면 가장자리를 더 깎습니다.`);
    if (m.scratches) notes.push(`스크래치 ${m.scratches}개: 슬러리가 거의 없는 패드에 닿았거나 패드가 과열됐습니다.`);
    if (m.maxTemp > C.tempAlarm) notes.push(`패드 온도가 ${fmt(m.maxTemp)}℃까지 올랐습니다. 압력과 속도의 곱이 클수록 마찰열이 커집니다.`);
    return notes;
  }
  function waferMap(m) {
    const size = 320, root = svg('svg', { viewBox: `${-size / 2} ${-size / 2} ${size} ${size}`, width: '100%', role: 'img', 'aria-label': '49점 두께 지도' });
    root.append(svg('circle', { r: 150, fill: '#f3f6fb', stroke: '#cbd5e1', 'stroke-width': 2 }));
    root.append(svg('path', { d: 'M -7 150 L 0 141 L 7 150 Z', fill: '#cbd5e1' }));
    const span = Math.max(30, ...m.points.map(p => Math.abs(p.value - C.target)));
    for (const p of m.points) {
      const d = Math.max(-1, Math.min(1, (p.value - C.target) / span)), a = Math.abs(d);
      const color = d < 0 ? `rgb(${Math.round(232 - 219 * a)},${Math.round(238 - 128 * a)},${Math.round(246 + 7 * a)})` : `rgb(${Math.round(232 + 17 * a)},${Math.round(238 - 123 * a)},${Math.round(246 - 224 * a)})`;
      const dot = svg('circle', { cx: (p.x * 1000).toFixed(1), cy: (p.y * 1000).toFixed(1), r: 11, fill: color, stroke: '#1e293b33' });
      dot.append(svg('title', {}, `반경 ${fmt(p.r * 1000)} mm: ${fmt(p.value)} nm`)); root.append(dot);
    }
    return root;
  }
  function profileChart(m) {
    const W = 520, H = 170, L = 46, R = 10, T = 10, B = 26, values = m.profile.map(p => p.end);
    let lo = Math.min(C.target - C.targetTol - 10, ...values), hi = Math.max(C.target + C.targetTol + 10, ...values); const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const px = i => L + (W - L - R) * i / (values.length - 1), py = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', class: 'profile-chart', role: 'img', 'aria-label': '반경별 연마 후 두께' });
    root.append(svg('rect', { x: L, y: py(C.target + C.targetTol), width: W - L - R, height: py(C.target - C.targetTol) - py(C.target + C.targetTol), fill: '#10b98126' }));
    root.append(svg('line', { x1: L, x2: W - R, y1: py(C.target), y2: py(C.target), stroke: '#10b981', 'stroke-dasharray': '5 4' }));
    root.append(svg('polyline', { points: values.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' '), fill: 'none', stroke: '#0d6efd', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    const label = (text, x, y, anchor) => { const t = svg('text', { x, y, 'text-anchor': anchor, 'font-size': 12, fill: '#64748b' }); t.textContent = text; root.append(t); };
    label(`${fmt(hi - pad)} nm`, L - 6, py(hi - pad) + 4, 'end'); label(`${fmt(lo + pad)}`, L - 6, py(lo + pad) + 4, 'end');
    label('가운데', L, H - 6, 'start'); label('반경 150 mm', W - R, H - 6, 'end');
    return root;
  }
  function renderResult(m) {
    const row = (name, value, spec, ok) => el('tr', {}, el('td', { text: name }), el('td', { class: 'num', text: value }), el('td', { text: spec || '' }),
      el('td', { class: ok === undefined ? '' : ok ? 'ok' : 'ng', text: ok === undefined ? '' : ok ? '통과' : '미달' }));
    const table = el('table', {}, el('thead', {}, el('tr', {}, el('th', { text: '항목' }), el('th', { class: 'num', text: '결과' }), el('th', { text: '기준' }), el('th', { text: '판정' }))), el('tbody', {},
      row('평균 두께', `${fmt(m.mean)} nm`, `${fmt(C.target)} ± ${fmt(C.targetTol)} nm`, m.ok.thickness),
      row('웨이퍼 안 균일도 (1σ)', `${fmt(m.wiwnu, 2)}%`, `${fmt(C.wiwnuMax, 1)}% 이하`, m.ok.uniformity),
      row('스크래치', `${m.scratches}개`, '0개', m.ok.defects),
      row('두께 범위 (최대 − 최소)', `${fmt(m.range)} nm`), row('깎은 양', `${fmt(m.removed)} nm`), row('연마 시간', `${fmt(m.polishTime)}초`),
      row('평균 제거 속도', `${fmt(m.meanRate)} nm/min`), row('슬러리 사용량', `${fmt(m.slurryUsed)} mL`), row('최고 패드 온도', `${fmt(m.maxTemp)}℃`)));
    const body = $('result-body');
    body.replaceChildren(
      el('p', { class: 'sub' }, el('span', { class: `verdict ${m.pass ? 'pass' : 'fail'}`, text: m.pass ? '합격' : '불합격' }), ` 웨이퍼 ${m.waferId} · 49점 계측`),
      el('div', { class: 'result-grid' }, el('div', {}, waferMap(m), el('p', { class: 'sub', text: '파랑은 목표보다 얇고 주황은 두껍습니다.' })), el('div', {}, table)),
      profileChart(m), el('ul', { class: 'notes' }, ...explain(m).map(t => el('li', { text: t }))));
    body.hidden = false; $('result-empty').hidden = true;
  }
  function renderAttempts() {
    const host = $('attempts');
    if (!attempts.length) { host.replaceChildren(el('p', { class: 'empty', text: '아직 계측한 웨이퍼가 없습니다.' })); return; }
    host.replaceChildren(el('table', {}, el('thead', {}, el('tr', {}, ...['웨이퍼', '평균 (nm)', '균일도', '스크래치', '시간', '슬러리', '판정'].map((t, i) => el('th', { class: i && i < 6 ? 'num' : '', text: t })))),
      el('tbody', {}, ...attempts.map(a => el('tr', {}, el('td', { text: `#${a.id}` }), el('td', { class: 'num', text: fmt(a.mean) }), el('td', { class: 'num', text: `${fmt(a.wiwnu, 1)}%` }),
        el('td', { class: 'num', text: String(a.scratches) }), el('td', { class: 'num', text: `${fmt(a.time)}초` }), el('td', { class: 'num', text: `${fmt(a.slurry)} mL` }), el('td', { class: a.pass ? 'ok' : 'ng', text: a.pass ? '합격' : '불합격' }))))));
  }
  function finishMeasure() {
    const m = sim.measure(); if (!m) return;
    const entry = { id: m.waferId, mean: m.mean, wiwnu: m.wiwnu, scratches: m.scratches, time: m.polishTime, slurry: m.slurryUsed, pass: m.pass };
    attempts = [entry, ...attempts.filter(a => a.id !== m.waferId)].slice(0, 12);       // a re-measured wafer replaces its earlier row
    renderResult(m); renderAttempts();
  }

  // ----- operator actions -----
  function onControl(name, value) { sim.setControl(name, value); }
  function onWafer(target) {
    if (!sim.moveWafer(target)) { flash('헤드를 끝까지 올린 뒤에 웨이퍼를 옮길 수 있습니다.'); return; }
    if (target === 'stage') { measureAt = performance.now() + 1400; scene.startMeasuring(1.4); }
    paintFilm();
  }
  function newWafer() {
    sim.setControl('head', 0); measureAt = 0;
    sim.newWafer(); renderOrder(); paintFilm();
    $('result-body').hidden = true; $('result-empty').hidden = false;
  }
  function bind() {
    $('speed').addEventListener('click', ev => { const b = ev.target.closest('button[data-speed]'); if (!b) return; timeScale = Number(b.dataset.speed); for (const x of $('speed').children) x.setAttribute('aria-pressed', String(x === b)); });
    $('views').addEventListener('click', ev => { const b = ev.target.closest('button[data-view]'); if (!b) return; scene.setView(b.dataset.view); for (const x of $('views').children) x.setAttribute('aria-pressed', String(x === b)); });
    $('new-wafer').addEventListener('click', newWafer);
    $('guide-action').addEventListener('click', () => guideAction?.());
    $('help-open').addEventListener('click', () => $('help').showModal());
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
    scene.update(viewOf(s), dt);
    if (measureAt && now >= measureAt) { measureAt = 0; finishMeasure(); }
    filmClock += dt; if (filmClock >= (s.polishing ? 0.1 : 0.5)) { filmClock = 0; paintFilm(); }
    hudClock += dt; if (hudClock >= 0.1) { hudClock = 0; renderHud(now); }
    screenClock += dt; if (screenClock >= 0.33) { screenClock = 0; paintScreen(); }
    positionTags(); scene.render();
    requestAnimationFrame(frame);
  }

  function init() {
    const seed = Number(new URLSearchParams(location.search).get('seed')) || (Date.now() % 100000) + 1;
    sim = P.create({ seed }); sim.newWafer();
    scene = Scene.create({ canvas: $('scene'), constants: C, on: { control: onControl, wafer: onWafer, hover: n => { hovered = n; }, drag: n => { dragging = n; }, refuse: () => flash('헤드를 끝까지 올린 뒤에 웨이퍼를 꺼낼 수 있습니다.') } });
    if (!scene) { $('fallback').hidden = false; $('scene').hidden = true; document.querySelector('.hud').hidden = true; return; }
    build(); bind(); renderOrder();
    renderAttempts(); paintFilm();
    window.Lab3DDebug = { sim, scene, constants: C, newWafer, onWafer, measureNow: finishMeasure, setSpeed: v => { timeScale = v; }, get speed() { return timeScale; }, get attempts() { return attempts; } };
    last = performance.now(); requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
