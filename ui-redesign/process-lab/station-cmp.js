/* Polish station of the process lab: the plated wafer on the polisher of the CMP learning lab. It is the second piece
 * of equipment of the process 'metal' (금속배선), after the plating cell.
 * The 3D machine is the CMP lab's own (../lab-3d/scene.js, asked for with `scene: 'cmp'`) and so is the removal model;
 * cmp-model.js says what is added for a patterned copper wafer. The shape of a station is described in app.js. */
(function () {
  'use strict';
  const CM = window.ProcessLabCmp, P = window.Lab3DProcess, F = window.ProcessLabFlow, STATIONS = window.ProcessLabStations = window.ProcessLabStations || {};
  const C = P.constants, K = CM.constants, DIES = F.dies(), RPM = 2 * Math.PI / 60, N = C.nodes;
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
    for (const child of children) if (child != null) node.append(child);
    return node;
  }
  const fmt = (v, digits = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const clock = seconds => { const whole = Math.round(seconds); return whole < 60 ? `${whole}초` : `${Math.floor(whole / 60)}분 ${String(whole % 60).padStart(2, '0')}초`; };   // whole seconds first: 59.6 s is 1분 00초, not 59초 or 0분 60초; under a minute only the seconds
  const measuredOnce = new WeakMap(); let measurements = 0;
  /** A number for each scan, so the page can tell a new report from the one it already shows. */
  const reportId = r => { if (!measuredOnce.has(r)) measuredOnce.set(r, ++measurements); return measuredOnce.get(r); };
  const pct = v => `${fmt(v * 100)}%`;
  const downforce = s => s.contact ? s.pressure : 0;
  const zoneText = z => { const p = Math.round(z * 100); return p === 0 ? '균등' : `${p > 0 ? '가운데' : '가장자리'} +${Math.abs(p)}%`; };
  const alarmOf = s => Object.values(s.alarms)[0];
  /** What scratched the wafer, from what each scratch remembers (lab-3d/process-model.js): one short sentence for each cause there was. */
  const SCRATCHED = { dry: ['마른 패드에 긁혔습니다.', '슬러리가 거의 없는 패드에 닿았습니다.'], hot: ['과열된 패드에 긁혔습니다.', '패드가 과열된 채로 연마했습니다.'], glazed: ['무뎌진 패드에 긁혔습니다.', '컨디셔너를 쓰지 않아 무뎌진 패드로 연마했습니다.'] };
  const scratchedBy = r => [...new Set(r.scratches.map(scratch => scratch.by))].filter(by => SCRATCHED[by]);

  // ----- the wafer as the camera of the machine would see it: copper, then the barrier film, then the oxide with its copper-filled windows -----
  const COPPER = [214, 140, 92], BARRIER = [118, 110, 104], BARE = [132, 141, 154];
  let grid = null;
  function paint(sim, canvas) {
    const n = canvas.width, ctx = canvas.getContext('2d'), w = sim.state.wafer, plated = sim.profile, linerFull = sim.incoming.liner;
    if (!grid || grid.n !== n) {
      const radius = new Float32Array(n * n), cos = new Float32Array(n * n), sin = new Float32Array(n * n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const dx = (x + 0.5 - n / 2) / (n / 2 - 1), dy = -(y + 0.5 - n / 2) / (n / 2 - 1), r = Math.hypot(dx, dy), i = y * n + x; radius[i] = r; cos[i] = r ? dx / r : 1; sin[i] = r ? dy / r : 0; }
      grid = { n, radius, cos, sin, image: ctx.createImageData(n, n) };
    }
    const data = grid.image.data, oxide = P.filmColor(sim.oxide), ct = Math.cos(w.tiltAngle), st = Math.sin(w.tiltAngle);
    for (let i = 0; i < n * n; i++) {
      const r = grid.radius[i], o = i * 4; let c = BARE;
      if (r <= 1) {
        const x = r * (N - 1), k = Math.min(N - 2, x | 0), f = x - k, a = w.start[k] - w.film[k], b = w.start[k + 1] - w.film[k + 1];
        const top = plated[k] + f * (plated[k + 1] - plated[k]), removed = a + f * (b - a) + w.tilt * r * (grid.cos[i] * ct + grid.sin[i] * st), copper = top - removed;
        if (copper > K.cleared) { const t = Math.min(1, copper / 80); data[o] = BARRIER[0] + (COPPER[0] - BARRIER[0]) * t; data[o + 1] = BARRIER[1] + (COPPER[1] - BARRIER[1]) * t; data[o + 2] = BARRIER[2] + (COPPER[2] - BARRIER[2]) * t; data[o + 3] = 255; continue; }
        const px = i % n, py = (i / n) | 0;
        c = (px % 10 < 5 && py % 10 < 5) ? COPPER : linerFull - (removed - top) * K.barrier > 0 ? BARRIER : oxide;      // windows filled with copper show through once the field is clear
      }
      data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
    }
    ctx.putImageData(grid.image, 0, 0);
    ctx.save(); ctx.translate(n / 2, n / 2); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.3;
    for (const s of w.scratches) { const a = s.theta, R = s.r / C.waferRadius * (n / 2 - 2), len = s.length * 26; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R, -Math.sin(a) * R); ctx.lineTo(Math.cos(a + 0.22) * R + len * Math.cos(a + 1.7), -(Math.sin(a + 0.22) * R + len * Math.sin(a + 1.7))); ctx.stroke(); }
    ctx.restore();
  }
  /** The wafer from above for the monitor: rings of what is on top at each radius. */
  function ringsView(sim) {
    const k = sim.stack, root = svg('svg', { viewBox: '-120 -70 240 140', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': `웨이퍼 위에서 본 모습: 구리가 덮은 면적 ${pct(k.covered)}` });
    root.append(svg('rect', { x: -120, y: -70, width: 240, height: 140, fill: '#f3f5f9' }));
    for (let i = N - 1; i >= 0; i--) root.append(svg('circle', { cx: 0, cy: 0, r: Math.max(1.2, 64 * (i + 0.5) / (N - 0.5)), fill: k.copper[i] > K.cleared ? '#d6a23f' : k.liner[i] > 0 ? '#6b6f78' : '#9cc3f5' }));
    root.append(svg('circle', { cx: 0, cy: 0, r: 65, fill: 'none', stroke: '#8b98ab', 'stroke-width': 1 }));
    return root;
  }
  /** What the polish left on every chip of the wafer: the worst of its centre and four corners, and whether a scratch runs through it. */
  function chipsOf(sim) {
    const scratches = sim.state.wafer.scratches.map(s => {
      const r = s.r * 1000, L = s.length * 26 * 150 / 126, x0 = r * Math.cos(s.theta), y0 = r * Math.sin(s.theta), x1 = r * Math.cos(s.theta + 0.22) + L * Math.cos(s.theta + 1.7), y1 = r * Math.sin(s.theta + 0.22) + L * Math.sin(s.theta + 1.7);
      return Array.from({ length: 7 }, (_, j) => [x0 + (x1 - x0) * j / 6, y0 + (y1 - y0) * j / 6]);
    });
    return DIES.map(die => {
      let over = 0, dishing = 0;
      for (const [dx, dy] of [[0, 0], [-8, -8], [8, -8], [8, 8], [-8, 8]]) { const x = die.x + dx, y = die.y + dy, s = sim.at(Math.hypot(x, y) / 1000, Math.atan2(y, x)); over = Math.max(over, s.copper); dishing = Math.max(dishing, s.dishing); }
      return { over, dishing, scratched: scratches.some(points => points.some(([x, y]) => Math.abs(x - die.x) <= 10 && Math.abs(y - die.y) <= 10)) };
    });
  }
  /** The polish as the flow model takes it, from the scan or, before there is one, from the wafer as it is now. */
  function polishOf(sim) {
    const k = sim.stack, r = k.result, chips = chipsOf(sim), residue = r ? r.residue : Math.max(...chips.map(c => c.over)), dishingMax = r ? r.dishingMax : Math.max(...chips.map(c => c.dishing)), scratches = sim.state.wafer.scratches.length;
    return { chips, centre: { over: k.copper[0], dishing: k.dishing[0] }, residue, cleared: residue <= K.cleared, dishingMax, scratches, ok: residue <= K.cleared && Math.round(dishingMax) <= K.spec.dishing && scratches === 0 };
  }

  const plating = STATIONS.metal;
  const cmp = {
    scene: 'cmp', equipment: 'cmp', title: '평탄화',
    views: [['home', '전체'], ['head', '헤드'], ['top', '위'], ['side', '앞']],
    speeds: [[1, '1×'], [2, '2×'], [4, '4×'], [8, '8×']], defaultSpeed: 2,
    create(wafer, seed, context) {
      const base = context.base, win = base.window && base.window.width > 0 ? base.window : null, plated = context.results[0];
      const sim = CM.create({ wafer: { thickness: plated.thickness, profile: plated.profile, depth: win ? win.depth + win.siliconLoss : 0, liner: base.liner }, seed });
      sim.base = base; sim.plated = plated; sim.oxide = base.oxide; sim.spin = { platen: 0, carrier: 0, sweep: 0 }; sim.state.stack = sim.stack;
      return sim;
    },
    parts: {
      wafer: { name: '웨이퍼', role: '구리를 도금한 웨이퍼입니다. 산화막 위의 구리를 걷어내면 창 안의 구리만 남습니다.', how: '끌어서 헤드 아래나 계측기에 놓습니다.',
        rows: s => [['남은 구리 (평균)', `${fmt(s.stack.mean)} nm`], ['가운데 · 가장자리', `${fmt(s.stack.centre)} · ${fmt(s.stack.edge)} nm`]] },
      head: { name: '캐리어 헤드', role: '웨이퍼를 잡아 패드에 누릅니다. 세게 누를수록 빨리 깎입니다.', how: '아래로 끌면 내려가고, 닿은 뒤 더 끌면 누르는 압력(다운포스)이 올라갑니다. 위로 끌면 올라옵니다.', basis: '계산: Preston 식 (제거 속도 ∝ 압력 × 속도). CMP 학습 실험실과 같은 모델',
        rows: s => [s.contact ? ['다운포스', `${fmt(s.pressure, 1)} psi`] : ['패드까지', `${fmt(s.gap * 1000)} mm`]], pill: s => s.controls.head > 1 ? `${fmt((s.controls.head - 1) * C.pressureMax, 1)} psi` : `패드까지 ${fmt((1 - s.controls.head) * C.headTravel * 1000)} mm` },
      carrier: { name: '헤드 스핀들', role: '헤드를 돌립니다. 헤드가 돌지 않으면 웨이퍼 한쪽만 깎입니다.', how: '좌우로 끌어 회전수를 정합니다.', rows: s => [['헤드 회전', `${fmt(s.carrierRpm)} rpm`], ['플래튼과 차이', `${fmt(Math.abs(s.platenRpm - s.carrierRpm))} rpm`]], pill: s => `${fmt(s.controls.carrier)} rpm` },
      platen: { name: '플래튼 · 패드', role: '패드를 붙인 회전 테이블입니다. 웨이퍼가 이 위에서 깎입니다.', how: '원을 그리듯 끌어 돌립니다. 시계 반대 방향이 가속입니다.',
        rows: s => [['플래튼 회전', `${fmt(s.platenRpm)} rpm`], ['패드 온도', `${fmt(s.temp)} °C`], ['패드 젖음', pct(s.coverage)]], pill: s => `${fmt(s.controls.platen)} rpm` },
      zone: { name: '구역 압력 조절기', role: '웨이퍼 가운데와 가장자리 사이로 압력을 옮깁니다. 구리가 한쪽부터 걷힐 때 씁니다.', how: '좌우로 끌어 돌립니다. 오른쪽이 가운데입니다.', rows: s => [['압력 배분', zoneText(s.controls.zone)]], pill: s => zoneText(s.controls.zone) },
      slurry: { name: '슬러리 밸브', role: '구리를 녹이고 긁어내는 슬러리를 패드에 흘립니다. 모자라면 웨이퍼가 긁힙니다.', how: '오른쪽이나 위로 끌면 더 열립니다.', basis: '구리 슬러리의 속도는 산화막의 2배로 둠 (대푯값)',
        rows: s => [['유량', `${fmt(s.flow)} mL/min`], ['패드 젖음', pct(s.coverage)]], pill: s => `${fmt(s.controls.slurry)} mL/min` },
      conditioner: { name: '패드 컨디셔너', role: '다이아몬드 디스크로 패드 표면을 다시 거칠게 만듭니다. 쓰지 않으면 패드가 매끈해져 속도가 떨어집니다.', how: '누르면 쓸기 시작하고, 다시 누르면 대기 위치로 갑니다.', rows: s => [['상태', s.controls.conditioner ? '쓰는 중' : '대기'], ['패드 거칠기', pct(s.glaze)]] },
      emo: { name: '비상 정지', role: '모든 회전과 슬러리를 멈추고 헤드를 올립니다.', how: '누릅니다.', rows: () => [] },
      pedestal: { name: '로드 위치', role: '연마할 웨이퍼가 놓이는 자리입니다.', rows: () => [] },
      stage: { name: '계측기', role: '연마한 웨이퍼를 훑어 남은 구리, 접시 파임, 스크래치를 잽니다.', how: '웨이퍼를 여기에 놓으면 계측합니다.', rows: s => { const r = s.stack.result; return r ? [['남은 구리 (최대)', `${fmt(r.residue)} nm`], ['접시 파임 (최대)', `${fmt(r.dishingMax)} nm`], ['스크래치', `${r.scratches.length}개`]] : [['상태', s.stack.measuring > 0 ? '재는 중' : '대기']]; } },
      hmi: { name: '장비 화면', role: '남은 구리와 지금 조건을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 연마 중, 노랑은 대기, 빨강은 경보입니다.', rows: s => [['상태', alarmOf(s) ? '경보' : s.polishing ? '연마 중' : '대기']] },
      nozzle: { name: '슬러리 공급 암', role: '슬러리를 패드 가운데 쪽에 떨어뜨립니다. 패드가 돌면서 웨이퍼 아래로 실어 나릅니다.', rows: () => [] },
      gauges: { name: '압력 게이지', role: '왼쪽 바늘이 헤드 다운포스입니다.', rows: s => [['다운포스', `${fmt(downforce(s), 1)} psi`]] },
    },
    control(sim, name, value) { if (name === 'emo') { sim.stop(); return '비상 정지: 회전과 슬러리를 멈추고 헤드를 올렸습니다.'; } sim.setControl(name, value); return null; },
    /** The wafer was dropped on a place of the machine. Returns a message when it cannot go there. */
    wafer(sim, target) {
      if (!sim.moveWafer(target)) return '헤드를 끝까지 올린 뒤에 웨이퍼를 옮길 수 있습니다.';
      sim.again = target === 'head' && sim.state.wafer.polishTime > 0;      // back on the head for more: the guide then says how to go on, not where to take it
      return null;
    },
    frame(sim, dt, timeScale) {
      const s = sim.state, visual = Math.min(timeScale, 2.5);
      sim.spin.platen += s.platenRpm * RPM * dt * visual; sim.spin.carrier += s.carrierRpm * RPM * dt * visual;
      if (s.controls.conditioner) sim.spin.sweep += dt * visual * 2 * Math.PI / 6;
    },
    paint,
    guide(sim, next) {
      const s = sim.state, k = sim.stack, w = s.wafer, r = k.result, alarm = alarmOf(s);
      if (w.where === 'stage') {
        if (!r) return ['남은 구리와 접시 파임을 재는 중입니다.', null, null, null];
        const text = !r.cleared ? `구리가 가장 두꺼운 곳에 ${fmt(r.residue)} nm 남았습니다. 헤드에 다시 올려 더 갈 수 있습니다.`
          : `구리가 다 걷혔습니다. 접시 파임 최대 ${fmt(r.dishingMax)} nm${r.scratches.length ? `, 스크래치 ${r.scratches.length}개` : ''}. ${r.ok ? '기준 안입니다.' : Math.round(r.dishingMax) > K.spec.dishing ? (r.unfilled > K.spec.dishing ? '도금이 얇아 창이 다 차지 않았습니다.' : '너무 오래 갈았습니다.') : (SCRATCHED[scratchedBy(r)[0]] || ['웨이퍼가 긁혔습니다.'])[0]}`;
        return [text, `다음: ${next}`, 'finish', r.cleared ? null : 'wafer'];
      }
      if (w.where === 'pedestal') {
        if (w.polishTime > 0) return ['웨이퍼를 계측기에 끌어다 놓으면 남은 구리와 접시 파임을 잽니다.', '계측기로 옮기기', x => { x.moveWafer('stage'); }, 'stage'];
        return ['웨이퍼를 헤드 아래로 끌어다 놓으세요.', '헤드에 올리기', x => { x.setControl('head', 0); x.moveWafer('head'); }, 'wafer'];
      }
      if (alarm) return [/[.!?]$/.test(alarm.text) ? alarm.text : `${alarm.text}.`, null, null, null];
      if (!s.contact) {
        if (w.polishTime > 0 && s.controls.head === 0 && !sim.again) return s.gap < C.headTravel * 0.98 ? ['헤드가 올라가는 중입니다.', null, null, null] : ['웨이퍼를 계측기에 끌어다 놓으면 남은 구리와 접시 파임을 잽니다.', '계측기로 옮기기', x => { x.moveWafer('stage'); }, 'stage'];
        const missing = s.controls.platen < 1 ? 'platen' : s.controls.carrier < 1 ? 'carrier' : s.controls.slurry < 1 ? 'slurry' : 'head';
        return ['플래튼과 헤드를 돌리고 슬러리를 연 다음, 헤드를 아래로 끌어 웨이퍼를 패드에 누르세요.', null, null, missing];
      }
      if (k.covered > 0) return [s.polishing ? '구리를 걷어내는 중입니다. 다 걷히면 헤드를 올리세요. 더 갈면 창 안의 구리가 파입니다.' : '헤드를 더 끌어내리면 압력이 걸려 깎이기 시작합니다.', null, null, s.polishing ? null : 'head'];
      return ['구리가 다 걷혔습니다. 헤드를 위로 끌어올리세요.', null, null, 'head'];
    },
    view(sim) {
      const s = sim.state;
      return { gap: s.gap, pressure: s.pressure, contact: s.contact, polishing: s.polishing, platenRpm: s.platenRpm, platenAngle: sim.spin.platen, carrierAngle: sim.spin.carrier, sweepPhase: sim.spin.sweep,
        flow: s.flow, coverage: s.coverage, glaze: s.glaze, temp: s.temp, controls: s.controls, wafer: { where: s.wafer.where, id: s.wafer.id }, alarm: Boolean(alarmOf(s)), measuring: sim.stack.measuring > 0 };
    },
    live(sim, wafer) { const k = sim.stack; return { ...wafer, metal: { thickness: sim.incoming.thickness, over: k.copper[0], dishing: k.dishing[0] } }; },
    /** The later stops show what the wafer would make as it is now: where copper is still left, the chips are joined. */
    forecast(sim) { return F.apply('metal', sim.base, { ...sim.plated, polish: polishOf(sim) }).wafer; },
    monitor(sim) {
      const s = sim.state, k = sim.stack, r = s.wafer.where === 'stage' ? k.result : null, tMax = Math.max(120, k.history.length ? k.history.at(-1).t : 0), deepest = Math.max(...k.dishing);
      return {
        picture: { custom: ringsView(sim) },
        value: r ? (r.cleared ? r.dishingMax : r.residue) : k.covered > 0 ? k.mean : deepest, unit: 'nm',
        note: r ? `${r.cleared ? '접시 파임' : '남은 구리'} · 계측값` : k.covered > 0 ? '남은 구리 · 장비 계측' : '접시 파임 · 계산값',
        meter: null,
        trend: { label: '구리가 덮고 있는 면적. 0이 되면 다 걷힌 것', points: k.history, x: p => p.t, y: p => p.covered * 100, xMax: tMax, yMax: 100, xLabel: clock(tMax), tip: p => [`구리 ${pct(p.covered)}`, ` · ${clock(p.t)} · 평균 ${fmt(p.mean)} nm`] },
        now: `가운데 <b>${fmt(k.centre)}</b> · 가장자리 <b>${fmt(k.edge)}</b> nm`,
        spec: ['구리 남김 없음', `접시 파임 ≤ ${K.spec.dishing} nm`, '스크래치 없음'],
      };
    },
    screen(sim) {
      const s = sim.state, k = sim.stack, alarm = alarmOf(s);
      return {
        name: 'CMP-01', title: 'COPPER POLISH', running: s.polishing, alarm: Boolean(alarm), state: alarm ? 'ALARM' : s.polishing ? 'POLISH' : k.measuring > 0 ? 'SCAN' : 'IDLE',
        big: ['COPPER LEFT', fmt(k.mean), 'nm'],
        cells: [['HEAD', `${fmt(downforce(s), 1)} psi`], ['PLATEN', `${fmt(s.platenRpm)} rpm`], ['SLURRY', `${fmt(s.flow)}`]],
        chips: [['POLISH', s.polishing], ['COND', s.controls.conditioner], ['CLEAR', k.covered === 0]], bar: ['CLEARED', 1 - k.covered],
      };
    },
    result(sim) {
      const s = sim.state, r = sim.stack.result; if (!r || s.wafer.where !== 'stage') return null;
      return { polish: polishOf(sim), how: `${sim.plated.how} · 연마 ${clock(r.seconds)}` };
    },

    // ----- process instruments and metrology report (the frame is in app.js) -----
    /** Keeps what the instruments draw and the model does not: the downforce, a point for every second of polishing. */
    tick(sim) {
      const s = sim.state, w = s.wafer, trace = sim.trace || (sim.trace = []);
      if (s.contact) sim.again = false;                                           // pressed again: from here it is a polish like the first
      if (w.where === 'head' && s.polishing && (!trace.length || w.polishTime - trace.at(-1).t >= 1)) { trace.push({ t: w.polishTime, psi: downforce(s) }); if (trace.length > 1800) trace.splice(0, 2); }
    },
    running(sim) { return sim.state.wafer.where === 'head'; },                    // while the wafer is on the head
    instruments(sim) {
      const s = sim.state, k = sim.stack, h = k.history, trace = sim.trace || [], tMax = Math.max(120, h.length ? h.at(-1).t : 0), time = [[0, '0'], [tMax, clock(tMax)]];
      const near = (points, x) => points.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, points[0]);
      const covered = h.map(p => [p.t, 100 * p.covered]), mean = h.map(p => [p.t, p.mean]), force = trace.map(p => [p.t, p.psi]);
      const top = Math.max(100, sim.incoming.thickness || 0, ...mean.map(p => p[1])), forceTop = Math.max(6, Math.ceil(Math.max(0, ...force.map(p => p[1]))));
      return [
        { title: '구리가 덮은 면적', unit: '%', value: fmt(100 * k.covered), label: '연마 시간에 따른 구리가 덮고 있는 면적. 0이 되면 다 걷힌 것입니다',
          plot: { x: [0, tMax], y: [0, 100], yTicks: [0, 50, 100], xTicks: time, series: covered },
          tip: x => { if (!covered.length) return null; const p = near(covered, x); return [clock(p[0]), [[`${fmt(p[1])}%`, '구리가 덮은 면적'], [`${fmt(near(mean, x)[1])} nm`, '남은 구리 (평균)']]]; } },
        { title: '남은 구리', unit: 'nm', value: fmt(k.mean), label: '연마 시간에 따른 산화막 위에 남은 구리의 평균 두께',
          plot: { x: [0, tMax], y: [0, top], yTicks: [0, top], xTicks: time, series: mean, quiet: true },
          tip: x => { if (!mean.length) return null; const p = near(mean, x); return [clock(p[0]), [[`${fmt(p[1])} nm`, '남은 구리 (평균)']]]; } },
        { title: '다운포스', unit: 'psi', value: fmt(downforce(s), 1), label: '연마 시간에 따른 헤드가 웨이퍼를 누르는 압력',
          plot: { x: [0, tMax], y: [0, forceTop], yTicks: [0, forceTop], xTicks: time, series: force, quiet: true },
          tip: x => { if (!force.length) return null; const p = near(force, x); return [clock(p[0]), [[`${fmt(p[1], 1)} psi`, '다운포스']]]; } },
      ];
    },
    report(sim) {
      const s = sim.state, r = sim.stack.result; if (!r || s.wafer.where !== 'stage') return null;
      const limit = K.spec.dishing, dishOk = Math.round(r.dishingMax) <= limit, clean = r.scratches.length === 0, notes = [];
      if (!r.cleared) notes.push(`구리가 가장 두꺼운 곳에 ${fmt(r.residue)} nm 남았습니다. 산화막 위에 구리가 남은 칩은 이웃 칩과 이어져 EDS에서 불량이 됩니다. 헤드에 다시 올려 더 갈 수 있습니다.`);
      if (r.cleared && !dishOk) notes.push(r.unfilled > limit
        ? `창 안의 구리가 가장 깊은 곳에서 ${fmt(r.dishingMax)} nm 낮습니다 (기준 ${limit} nm 이하). 도금한 구리가 창 깊이보다 얇아, 갈기 전부터 창이 ${fmt(r.unfilled)} nm 덜 차 있었습니다. 도금을 더 두껍게 해야 합니다.`
        : `창 안의 구리가 가장 깊은 곳에서 ${fmt(r.dishingMax)} nm 파였습니다 (기준 ${limit} nm 이하). 구리가 다 걷힌 뒤에도 갈면 무른 구리가 산화막보다 빨리 깎여 접시처럼 파입니다.`);
      if (!clean) notes.push(`스크래치가 ${r.scratches.length}개 났습니다. ${scratchedBy(r).map(by => SCRATCHED[by][1]).join(' ')} 긁힌 칩은 구리 길이 끊겨 EDS에서 불량이 됩니다.`.replace('  ', ' '));
      if (r.ok) notes.push('구리가 다 걷혔고 접시 파임이 기준 안입니다. 창 안에만 구리가 남아 칩마다 따로 떨어진 길이 됩니다.');
      return {
        id: reportId(r), title: '평탄화한 웨이퍼', sub: `연마 ${clock(r.seconds)}`, pass: r.ok,
        criteria: [
          { label: '남은 구리 (가장 두꺼운 곳)', value: `${fmt(r.residue)} nm`, ok: r.cleared, pass: '다 걷힘', fail: '남음' },
          { label: '접시 파임 (최대)', value: `${fmt(r.dishingMax)} nm`, ok: dishOk, fail: '초과', meter: { value: r.dishingMax, limit, top: 2 * limit }, scale: ['0', `${limit} nm 이하`, `${2 * limit}`] },
          { label: '스크래치', value: clean ? '없음' : `${r.scratches.length}개`, ok: clean, fail: '긁힘' },
        ],
        figures: [{ caption: '웨이퍼를 위에서 본 모습. 금색은 구리가 남은 곳, 회색은 장벽막, 파란색은 산화막이 드러난 곳입니다', node: ringsView(sim) }],
        notes,
        stats: [['연마 시간', clock(r.seconds)], ['접시 파임 (평균)', `${fmt(r.dishingMean)} nm`], ['스크래치', `${r.scratches.length}개`]],
      };
    },
  };
  STATIONS.metal = [plating, cmp];
})();
