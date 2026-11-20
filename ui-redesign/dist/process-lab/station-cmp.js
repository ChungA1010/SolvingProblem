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
  const clock = seconds => `${Math.floor(seconds / 60)}분 ${String(Math.round(seconds % 60)).padStart(2, '0')}초`;
  const pct = v => `${fmt(v * 100)}%`;
  const downforce = s => s.contact ? s.pressure : 0;
  const zoneText = z => { const p = Math.round(z * 100); return p === 0 ? '균등' : `${p > 0 ? '가운데' : '가장자리'} +${Math.abs(p)}%`; };
  const alarmOf = s => Object.values(s.alarms)[0];

  // ----- the wafer as the camera of the machine would see it: copper, then the barrier film, then the oxide with its copper-filled windows -----
  const COPPER = [214, 140, 92], BARRIER = [118, 110, 104], BARE = [132, 141, 154];
  let grid = null;
  function paint(sim, canvas) {
    const n = canvas.width, ctx = canvas.getContext('2d'), w = sim.state.wafer, plated = sim.incoming.thickness, linerFull = sim.incoming.liner;
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
        const removed = a + f * (b - a) + w.tilt * r * (grid.cos[i] * ct + grid.sin[i] * st), copper = plated - removed;
        if (copper > K.cleared) { const t = Math.min(1, copper / 80); data[o] = BARRIER[0] + (COPPER[0] - BARRIER[0]) * t; data[o + 1] = BARRIER[1] + (COPPER[1] - BARRIER[1]) * t; data[o + 2] = BARRIER[2] + (COPPER[2] - BARRIER[2]) * t; data[o + 3] = 255; continue; }
        const px = i % n, py = (i / n) | 0;
        c = (px % 10 < 5 && py % 10 < 5) ? COPPER : linerFull - (removed - plated) * K.barrier > 0 ? BARRIER : oxide;      // windows filled with copper show through once the field is clear
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
    return { chips, centre: { over: k.copper[0], dishing: k.dishing[0] }, residue, cleared: residue <= K.cleared, dishingMax, scratches, ok: residue <= K.cleared && dishingMax <= K.spec.dishing && scratches === 0 };
  }

  const plating = STATIONS.metal;
  const cmp = {
    scene: 'cmp', equipment: 'cmp', title: '평탄화',
    views: [['home', '전체'], ['head', '헤드'], ['top', '위'], ['side', '옆']],
    speeds: [[1, '1×'], [2, '2×'], [4, '4×'], [8, '8×']], defaultSpeed: 2,
    create(wafer, seed, context) {
      const base = context.base, win = base.window && base.window.width > 0 ? base.window : null, plated = context.results[0];
      const sim = CM.create({ wafer: { thickness: plated.thickness, depth: win ? win.depth + win.siliconLoss : 0, liner: base.liner }, seed });
      sim.base = base; sim.plated = plated; sim.oxide = base.oxide; sim.spin = { platen: 0, carrier: 0, sweep: 0 }; sim.state.stack = sim.stack;
      return sim;
    },
    parts: {
      wafer: { name: '웨이퍼', role: '구리를 도금한 웨이퍼입니다. 산화막 위의 구리를 걷어내면 창 안의 구리만 남습니다.', how: '끌어서 헤드 아래나 계측기에 놓습니다.',
        rows: s => [['남은 구리 (평균)', `${fmt(s.stack.mean)} nm`], ['가운데 · 가장자리', `${fmt(s.stack.centre)} · ${fmt(s.stack.edge)} nm`]] },
      head: { name: '캐리어 헤드', role: '웨이퍼를 잡아 패드에 누릅니다. 세게 누를수록 빨리 깎입니다.', how: '아래로 끌면 내려가고, 닿은 뒤 더 끌면 압력이 올라갑니다. 위로 끌면 올라옵니다.', basis: '계산: Preston 식 (제거 속도 ∝ 압력 × 속도). CMP 학습 실험실과 같은 모델',
        rows: s => [s.contact ? ['다운포스', `${fmt(s.pressure, 1)} psi`] : ['패드까지', `${fmt(s.gap * 1000)} mm`]], pill: s => s.controls.head > 1 ? `${fmt((s.controls.head - 1) * C.pressureMax, 1)} psi` : `패드까지 ${fmt((1 - s.controls.head) * C.headTravel * 1000)} mm` },
      carrier: { name: '헤드 스핀들', role: '헤드를 돌립니다. 헤드가 돌지 않으면 웨이퍼 한쪽만 깎입니다.', how: '좌우로 끌어 회전수를 정합니다.', rows: s => [['헤드 회전', `${fmt(s.carrierRpm)} rpm`], ['플래튼과 차이', `${fmt(Math.abs(s.platenRpm - s.carrierRpm))} rpm`]], pill: s => `${fmt(s.controls.carrier)} rpm` },
      platen: { name: '플래튼 · 패드', role: '패드를 붙인 회전 테이블입니다. 웨이퍼가 이 위에서 깎입니다.', how: '원을 그리듯 끌어 돌립니다. 시계 반대 방향이 가속입니다.',
        rows: s => [['플래튼 회전', `${fmt(s.platenRpm)} rpm`], ['패드 온도', `${fmt(s.temp)} ℃`], ['패드 젖음', pct(s.coverage)]], pill: s => `${fmt(s.controls.platen)} rpm` },
      zone: { name: '구역 압력 조절기', role: '웨이퍼 가운데와 가장자리 사이로 압력을 옮깁니다. 구리가 한쪽부터 걷힐 때 씁니다.', how: '좌우로 끌어 돌립니다. 오른쪽이 가운데입니다.', rows: s => [['압력 배분', zoneText(s.controls.zone)]], pill: s => zoneText(s.controls.zone) },
      slurry: { name: '슬러리 밸브', role: '구리를 녹이고 긁어내는 슬러리를 패드에 흘립니다. 모자라면 웨이퍼가 긁힙니다.', how: '오른쪽이나 위로 끌면 더 열립니다.', basis: '구리 슬러리의 속도는 산화막의 2배로 둠 (대표값)',
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
    wafer(sim, target) { return sim.moveWafer(target) ? null : '헤드를 끝까지 올린 뒤에 웨이퍼를 옮길 수 있습니다.'; },
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
          : `구리가 다 걷혔습니다. 접시 파임 최대 ${fmt(r.dishingMax)} nm${r.scratches.length ? `, 스크래치 ${r.scratches.length}개` : ''}. ${r.ok ? '목표 안입니다.' : r.dishingMax > K.spec.dishing ? '너무 오래 갈았습니다.' : '마른 패드에 긁혔습니다.'}`;
        return [text, `다음: ${next}`, 'finish', r.cleared ? null : 'wafer'];
      }
      if (w.where === 'pedestal') {
        if (w.polishTime > 0) return ['웨이퍼를 계측기에 끌어다 놓으면 남은 구리와 접시 파임을 잽니다.', '계측기로 옮기기', x => { x.moveWafer('stage'); }, 'stage'];
        return ['웨이퍼를 헤드 아래로 끌어다 놓으세요.', '헤드에 올리기', x => { x.setControl('head', 0); x.moveWafer('head'); }, 'wafer'];
      }
      if (alarm) return [alarm.text, null, null, null];
      if (!s.contact) {
        if (w.polishTime > 0 && s.controls.head === 0) return s.gap < C.headTravel * 0.98 ? ['헤드가 올라가는 중입니다.', null, null, null] : ['웨이퍼를 계측기에 끌어다 놓으면 남은 구리와 접시 파임을 잽니다.', '계측기로 옮기기', x => { x.moveWafer('stage'); }, 'stage'];
        const missing = s.controls.platen < 1 ? 'platen' : s.controls.carrier < 1 ? 'carrier' : s.controls.slurry < 1 ? 'slurry' : 'head';
        return ['플래튼과 헤드를 돌리고 슬러리를 연 다음, 헤드를 아래로 끌어 웨이퍼를 패드에 누르세요.', null, null, missing];
      }
      if (k.covered > 0) return [s.polishing ? '구리를 걷어내는 중입니다. 다 걷히면 헤드를 올리세요. 더 갈면 창 안의 구리가 파입니다.' : '헤드를 더 끌어내리면 압력이 걸려 깎이기 시작합니다.', null, null, s.polishing ? null : 'head'];
      return ['구리가 다 걷혔습니다. 헤드를 위로 끌어 올리세요.', null, null, 'head'];
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
  };
  STATIONS.metal = [plating, cmp];
})();
