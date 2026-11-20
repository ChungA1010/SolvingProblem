/* EDS station of the process lab: what the page shows and says while the wafer prober is operated.
 * Calculation: eds-model.js. Equipment: src/prober.js. The shape of a station is described in app.js. */
(function () {
  'use strict';
  const ED = window.ProcessLabEds, F = window.ProcessLabFlow, FILM = window.Lab3DProcess, C = ED.constants, L = C.limits, DIES = F.dies();
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
    for (const child of children) if (child != null) node.append(child);
    return node;
  }
  const fmt = v => Math.round(v).toLocaleString('en-US'), signed = v => `${v > 0 ? '+' : ''}${fmt(v)}`;
  const ohm = v => Number.isFinite(v) ? `${v < 10 ? v.toFixed(1) : fmt(v)} Ω` : '∞';
  const amp = a => a >= 1e-3 ? `${(a * 1e3).toFixed(1)} mA` : a >= 1e-6 ? `${(a * 1e6).toFixed(1)} µA` : a >= 1e-9 ? `${(a * 1e9).toFixed(1)} nA` : `${fmt(a * 1e12)} pA`;
  const dieText = r => r.good ? `양품 · 접촉 ${ohm(r.resistance)} · 누설 ${amp(r.leak)} · 순방향 ${r.voltage.toFixed(2)} V`
    : r.bin === 'contact' ? `접촉 불량 · ${ohm(r.resistance)}` : r.bin === 'leak' ? `누설 불량 · ${amp(r.leak)}` : `전압 불량 · ${r.voltage.toFixed(2)} V`;
  const share = c => c.tested ? c.good / c.tested * 100 : 0;
  const tested = sim => { const c = sim.count(); return { total: c.total, good: c.good, dies: sim.state.results.map(r => r ? { good: r.good, bin: r.bin, text: dieText(r) } : { good: null }) }; };
  const handed = sim => { const c = sim.count(), s = sim.state; return { dies: s.results.map(r => r ? { good: r.good, bin: r.bin, text: dieText(r) } : { good: false, bin: 'contact', text: '검사하지 않음' }), missed: c.missed, how: `오버드라이브 ${fmt(s.controls.z)} µm, 검사 ${s.passes}회` }; };

  /** What the alignment camera sees: two pads of the chip under the needles, and where the needle tips stand over them. */
  function padView(sim) {
    const e = sim.error(), half = C.probe.pad / 4, down = sim.state.down, root = svg('svg', { viewBox: '0 0 240 56', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': `정렬 카메라: 바늘이 패드 가운데에서 가로 ${signed(e.x)} µm, 세로 ${signed(e.y)} µm` });
    root.append(svg('rect', { x: 0, y: 0, width: 240, height: 56, fill: '#27303c' }));
    for (const cx of [84, 156]) {
      root.append(svg('rect', { x: cx - half, y: 28 - half, width: 2 * half, height: 2 * half, rx: 1.5, fill: '#d6a23f' }), svg('path', { d: `M${cx - 4},28 h8 M${cx},24 v8`, stroke: '#7a5a1c', 'stroke-width': 0.8 }));
      const tx = cx + e.x / 2, ty = 28 - e.y / 2;                 // 1 unit is 2 um
      root.append(svg('path', { d: `M${tx},${ty} l-26,-9`, stroke: '#cfd6df', 'stroke-width': 2.4, 'stroke-linecap': 'round' }), svg('circle', { cx: tx, cy: ty, r: 3.2, fill: down ? '#ffffff' : '#9aa3b2', stroke: '#1e293b', 'stroke-width': 0.8 }));
    }
    root.append(svg('path', { d: 'M206,49 h25', stroke: '#e2e8f0', 'stroke-width': 1.2 }), svg('text', { x: 218.5, y: 46, 'text-anchor': 'middle', 'font-size': 6.5, fill: '#e2e8f0' }, '50 µm'));
    return root;
  }

  (window.ProcessLabStations = window.ProcessLabStations || {}).eds = {
    equipment: 'prober',
    views: [['home', '전체'], ['stage', '스테이지'], ['needles', '바늘'], ['panel', '조작반']],
    speeds: [[1, '1×'], [4, '4×'], [16, '16×']], defaultSpeed: 4,
    create(wafer, seed) { const sim = ED.create({ wafer, dies: DIES, killed: F.defects(wafer.lot), seed }); sim.wafer = wafer; sim.aligning = true; return sim; },
    parts: {
      x: { name: '척 X 위치', role: '웨이퍼를 좌우로 조금 옮겨 바늘이 패드 가운데에 오게 합니다.', how: '좌우로 끌거나 휠을 굴립니다.', rows: s => [['설정', `${signed(s.controls.x)} µm`]], pill: s => `X ${signed(s.controls.x)} µm` },
      y: { name: '척 Y 위치', role: '웨이퍼를 앞뒤로 조금 옮겨 바늘이 패드 가운데에 오게 합니다.', how: '좌우로 끌거나 휠을 굴립니다.', rows: s => [['설정', `${signed(s.controls.y)} µm`]], pill: s => `Y ${signed(s.controls.y)} µm` },
      z: { name: '오버드라이브', role: '바늘이 패드에 닿은 뒤 척을 더 밀어 올리는 거리입니다. 모자라면 접촉 저항이 커서 좋은 칩도 불량으로 나옵니다.', how: '좌우로 끌거나 휠을 굴립니다.', basis: '바늘의 접촉 저항 곡선은 대표값',
        rows: s => [['설정', `${fmt(s.controls.z)} µm`]], pill: s => `${fmt(s.controls.z)} µm` },
      contact: { name: '접촉 확인', role: '지금 위치에서 바늘을 한 번 대 보고, 닿는지와 바늘의 접촉 저항을 잽니다. 다이얼을 움직이면 다시 해야 합니다.', how: '누릅니다.', rows: s => [['결과', s.contact ? (s.contact.touching ? ohm(s.contact.resistance) : '닿지 않음') : '아직 안 함']] },
      probe: { name: '검사', role: '칩을 하나씩 바늘 아래로 옮겨 가며 검사합니다. 한 번 끝난 뒤에 누르면 불량으로 나온 칩만 다시 검사합니다.', how: '누릅니다.', rows: s => [['검사한 횟수', `${s.passes}회`]] },
      card: { name: '프로브 카드', role: '칩의 패드 자리에 맞춘 바늘이 달린 판입니다. 바늘이 패드에 닿아 테스터와 칩을 잇습니다.', rows: s => [['바늘', s.down ? '패드에 닿음' : '떨어져 있음']] },
      chuck: { name: '척', role: '웨이퍼를 붙잡고 칩 하나씩 바늘 아래로 옮긴 뒤 밀어 올립니다.', rows: s => [['검사한 칩', `${s.tested} / ${DIES.length}`]] },
      camera: { name: '정렬 카메라', role: '바늘 끝과 패드를 내려다봅니다. 검사 전의 웨이퍼 모니터 화면이 이 카메라의 것입니다.', rows: () => [] },
      tester: { name: '테스터', role: '칩마다 접촉 저항, 역방향 누설 전류, 순방향 전압을 차례로 재고, 하나라도 기준을 벗어나면 그 칩을 불량으로 가립니다.', basis: '측정값: 교과서의 다이오드 식에 대표 상수를 넣은 계산',
        rows: () => [['접촉 저항', `${L.resistance} Ω 이하`], [`누설 전류 (${C.test.reverse} V)`, `${amp(L.leakage)} 이하`], ['순방향 전압 (1 mA)', `${L.voltage[0]}~${L.voltage[1]} V`]] },
      wafer: { name: '웨이퍼', role: '검사에서 불량으로 나온 칩에는 잉크 점이 찍힙니다.', rows: s => [['양품', `${s.good} / ${s.tested}`]] },
      hmi: { name: '장비 화면', role: '검사한 칩 수와 수율을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 검사 중, 노랑은 대기입니다.', rows: s => [['상태', s.phase === 'probing' ? '검사 중' : '대기']] },
    },
    control(sim, name, value) {
      const done = sim.setControl(name, value);
      if (C.dials[name]) { sim.state.contact = null; sim.aligning = true; return null; }      // the last contact check no longer holds
      if (name === 'contact') { if (done) sim.aligning = true; return done ? null : '검사하는 동안에는 할 수 없습니다.'; }
      if (name === 'probe') { if (done) sim.aligning = false; return done ? null : sim.state.phase === 'probing' ? '검사하는 중입니다.' : '다시 검사할 불량 칩이 없습니다.'; }
      return null;
    },
    guide(sim, next) {
      const s = sim.state, c = sim.count();
      if (s.phase === 'probing') return [`칩을 하나씩 검사하는 중입니다. 남은 칩 ${s.queue.length}개.`, null, null, null];
      const check = !s.contact ? ['카메라 화면을 보면서 X·Y 다이얼로 바늘을 패드 가운데에 맞추고, 접촉 확인 단추로 닿는지 보세요.', 'contact']
        : !s.contact.touching ? ['바늘이 패드에 닿지 않았습니다. X·Y 다이얼로 위치를 맞추세요.', 'x']
          : s.contact.resistance > L.resistance / 3 ? ['바늘은 닿았지만 접촉 저항이 큽니다. 오버드라이브를 올리면 더 세게 눌립니다.', 'z'] : null;
      if (s.phase === 'done') {
        const many = c.bins.contact > c.total * 0.1, text = `양품 ${c.good}개 / ${c.total}개 (수율 ${share(c).toFixed(0)}%).`;
        if (!many) return [text, `다음: ${next}`, 'finish', null];
        return [`${text} 접촉 불량이 많습니다. ${sim.aligning && check ? check[0] : '바늘 위치와 오버드라이브를 확인하면 불량 칩만 다시 검사할 수 있습니다.'}`, `다음: ${next}`, 'finish', sim.aligning && check ? check[1] : sim.aligning ? 'probe' : 'contact'];
      }
      return check ? [check[0], null, null, check[1]] : ['검사 단추를 누르면 칩을 하나씩 검사합니다.', null, null, 'probe'];
    },
    view(sim) {
      const s = sim.state;
      return { at: DIES[s.index] || { x: 0, y: 0 }, down: s.down, phase: s.phase, testing: s.phase === 'probing', dies: DIES, states: s.results.map(r => !r ? 0 : r.good ? 1 : 2), stamp: `${s.tested}|${s.good}|${s.passes}|${s.queue.length}`,
        filmColor: FILM.filmColor(sim.wafer.oxide), controls: s.controls };
    },
    live(sim, wafer) { return sim.state.tested ? { ...wafer, tested: tested(sim) } : wafer; },
    /** Before the first chip is tested, the last stop shows what the standard test would find on this wafer. */
    forecast(sim, wafer) { return sim.state.tested ? F.apply('eds', wafer, handed(sim)).wafer : F.apply('eds', wafer).wafer; },
    monitor(sim) {
      const s = sim.state, c = sim.count(), e = sim.error(), spec = [`접촉 ≤ ${L.resistance} Ω`, `누설 ≤ ${amp(L.leakage)}`, `순방향 ${L.voltage[0]}~${L.voltage[1]} V`];
      if (s.phase !== 'probing' && (sim.aligning || !c.tested)) return {
        picture: { custom: padView(sim) }, value: Math.hypot(e.x, e.y), unit: 'µm', note: '패드 가운데에서 벗어남 · 카메라', meter: null, trend: null,
        now: s.contact ? `접촉 확인: <b>${s.contact.touching ? ohm(s.contact.resistance) : '닿지 않음'}</b>` : `X <b>${signed(e.x)}</b> · Y <b>${signed(e.y)}</b> µm`, spec,
      };
      return {
        picture: { map: tested(sim) }, value: share(c), unit: '%', note: `양품 ${c.good} / ${c.tested} · 계측값`, meter: null,
        trend: { label: '검사한 칩 수에 따른 수율', points: s.history, x: p => p.n, y: p => p.yield, xMax: Math.max(c.total, s.history.length), yMax: 100, xLabel: `${fmt(Math.max(c.total, s.history.length))}번째`, tip: p => [`수율 ${p.yield.toFixed(0)}%`, ` · ${fmt(p.n)}번째 검사`] },
        now: `불량: 접촉 <b>${c.bins.contact}</b> · 누설 <b>${c.bins.leak}</b> · 전압 <b>${c.bins.voltage}</b>`, spec,
      };
    },
    screen(sim) {
      const s = sim.state, c = sim.count(), probing = s.phase === 'probing';
      return {
        name: 'PB-01', title: 'WAFER PROBER', running: probing, state: probing ? `TEST · PASS ${s.passes}` : s.down ? 'CONTACT CHECK' : s.phase === 'done' ? 'DONE' : 'SETUP',
        big: ['YIELD', c.tested ? share(c).toFixed(1) : '—', '%'],
        cells: [['TESTED', `${c.tested}/${c.total}`], ['GOOD', `${c.good}`], ['FAIL', `${c.tested - c.good}`]],
        chips: [['CONTACT', s.down], ['TEST', probing]], bar: ['WAFER', probing ? 1 - s.queue.length / c.total : c.tested / c.total],
      };
    },
    result(sim) { return sim.state.phase === 'done' ? handed(sim) : null; },
  };
})();
