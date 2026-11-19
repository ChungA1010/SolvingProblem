/* Etch station of the process lab: what the page shows and says while the etch chamber is operated.
 * Calculation: etch-model.js. Equipment: src/process-lab/etcher.js. The shape of a station is described in app.js. */
(function () {
  'use strict';
  const ET = window.ProcessLabEtch, F = window.ProcessLabFlow, FILM = window.Lab3DProcess, C = ET.constants;
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const clock = seconds => `${Math.floor(seconds / 60)}분 ${String(Math.round(seconds % 60)).padStart(2, '0')}초`;
  const onOff = open => open ? '열림' : '닫힘';
  const gasText = c => [c.chf3 && 'CHF₃', c.cf4 && 'CF₄'].filter(Boolean).join(' + ') || '가스 없음';
  const rateRows = s => { const r = ET.rates(s.controls); return r ? [['산화막 식각 속도', `${r.oxide.toFixed(0)} nm/분`], ['산화막 : 실리콘', `${(r.oxide / r.silicon).toFixed(1)} : 1`]] : []; };
  const BASIS = '속도와 선택비: 측정 사례의 대표값 (CHF₃ 16:1, CF₄ 1.2:1)';

  (window.ProcessLabStations = window.ProcessLabStations || {}).etch = {
    equipment: 'etch',
    views: [['home', '전체'], ['chamber', '챔버'], ['panel', '조작반']],
    speeds: [[10, '10초/초'], [30, '30초/초'], [120, '2분/초']], defaultSpeed: 30,
    create(wafer, seed) { const sim = ET.create({ wafer: { oxide: wafer.oxide, resist: wafer.resist }, seed }); sim.recipe = null; return sim; },
    parts: {
      power: { name: 'RF 전력', role: '플라스마를 만드는 전력입니다. 클수록 빨리 깎입니다. 50 W 아래에서는 플라스마가 켜지지 않습니다.', how: '좌우로 끌거나 휠을 굴립니다. 0으로 내리면 식각이 멈춥니다.', basis: '속도 ∝ 전력 (단순화)',
        rows: s => [['설정', `${fmt(s.controls.power)} W`], ...rateRows(s).slice(0, 1)], pill: s => `${fmt(s.controls.power)} W` },
      pressure: { name: '압력', role: '챔버 안의 압력입니다. 낮을수록 이온이 곧게 내려와 벽이 수직으로 깎이고, 높을수록 옆으로도 깎입니다.', how: '좌우로 끌거나 휠을 굴립니다.', basis: '이방성 0.97(10 mTorr)~0.70(200 mTorr) (방향은 교과서, 수치는 가정)',
        rows: s => [['설정', `${fmt(s.controls.pressure)} mTorr`], ['수직 대 옆 방향', `${ET.rates({ ...s.controls, chf3: true, power: 150 }).anisotropy.toFixed(2)}`]], pill: s => `${fmt(s.controls.pressure)} mTorr` },
      chf3: { name: 'CHF₃ 밸브', role: '실리콘 위에 얇은 막을 남겨 실리콘을 덜 깎는 가스입니다. 느리지만 산화막만 골라 깎습니다.', how: '누르면 열리고 닫힙니다.', basis: BASIS, rows: s => [['밸브', onOff(s.controls.chf3)], ...rateRows(s)] },
      cf4: { name: 'CF₄ 밸브', role: '빨리 깎지만 실리콘도 거의 같은 속도로 깎는 가스입니다.', how: '누르면 열리고 닫힙니다.', basis: BASIS, rows: s => [['밸브', onOff(s.controls.cf4)], ...rateRows(s)] },
      load: { name: '웨이퍼 투입 · 배출', role: '웨이퍼를 챔버에 넣거나 꺼냅니다. 꺼내면 감광막을 벗기고 창을 잽니다.', how: '누릅니다. 플라스마가 켜져 있으면 문이 열리지 않습니다.', rows: s => [['웨이퍼', s.inside >= 1 ? '챔버 안' : s.inside <= 0 ? '밖' : '이동 중']] },
      chamber: { name: '식각 챔버', role: '위아래 전극 사이에 플라스마를 만들어, 감광막이 열린 곳의 산화막을 깎습니다.', rows: s => [['플라스마', s.plasma ? '켜짐' : '꺼짐'], ['가스', gasText(s.controls)], ...rateRows(s).slice(0, 1)] },
      pump: { name: '진공 펌프', role: '챔버를 낮은 압력으로 유지하고 깎여 나온 기체를 빼냅니다.', rows: s => [['압력', `${fmt(s.controls.pressure)} mTorr`]] },
      rf: { name: 'RF 정합기', role: '아래 전극에 고주파 전력을 넣습니다.', rows: s => [['전력', `${fmt(s.controls.power)} W`]] },
      oes: { name: '종점 검출기', role: '플라스마의 빛을 봅니다. 산화막이 깎일 때 나오는 빛이 줄어들면 창이 실리콘까지 뚫린 것입니다.', rows: s => [['신호', s.signal.toFixed(2)]] },
      wafer: { name: '웨이퍼', role: '감광막이 열린 곳만 깎입니다.', rows: s => [['남은 감광막', `${fmt(s.resist)} nm`]] },
      hmi: { name: '장비 화면', role: '전력, 압력, 가스, 식각 시간을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 식각 중, 노랑은 대기입니다.', rows: s => [['상태', s.plasma ? '식각 중' : '대기']] },
    },
    control(sim, name, value) { return sim.setControl(name, value) ? null : name === 'load' ? '플라스마가 켜져 있는 동안에는 문이 열리지 않습니다. RF 전력을 내리세요.' : null; },
    tick(sim) { const s = sim.state; if (s.plasma) sim.recipe = { gas: gasText(s.controls), power: s.controls.power, pressure: s.controls.pressure }; },
    guide(sim, next) {
      const s = sim.state, r = s.result, c = s.controls;
      if (r && s.inside <= 0) {
        const text = r.stripped ? '산화막이 모두 깎여 나갔습니다.' : r.width <= 0 ? '감광막이 열리지 않아 창이 생기지 않았습니다.'
          : !r.open ? `창 바닥에 산화막 ${fmt(r.left)} nm가 남았습니다. 다시 넣어 더 깎을 수는 없습니다(감광막을 벗겼습니다).`
            : `창이 뚫렸습니다. 실리콘 ${fmt(r.siliconLoss)} nm 깎임, 창 너비 ${fmt(r.width)} nm. ${r.ok ? '목표 범위 안입니다.' : '목표를 벗어났습니다.'}`;
        return [text, `다음: ${next}`, 'finish', null];
      }
      if (s.inside < 1) return [c.load ? '웨이퍼가 챔버로 들어가는 중입니다.' : s.inside > 0 ? '웨이퍼가 나오는 중입니다.' : '투입 단추를 눌러 웨이퍼를 챔버에 넣으세요.', null, null, c.load || s.inside > 0 ? null : 'load'];
      if (s.plasma) return ['식각 중입니다. 종점 신호가 떨어지면 RF 전력을 내려 멈추세요.', null, null, null];
      if (s.etched > 0) return ['배출 단추를 눌러 웨이퍼를 꺼내세요. 꺼내면 감광막을 벗기고 창을 잽니다.', null, null, 'load'];
      return ['가스를 열고 압력과 RF 전력을 정하세요. 전력이 50 W를 넘으면 플라스마가 켜집니다.', null, null, c.chf3 || c.cf4 ? 'power' : 'chf3'];
    },
    view(sim) {
      const s = sim.state, start = sim.incoming.resist ? sim.incoming.resist.thickness : 0, out = Boolean(s.result) && s.inside <= 0;
      return { inside: s.inside, plasma: s.plasma, controls: s.controls, filmColor: FILM.filmColor(s.field), resist: out || !start ? 0 : s.resist / start, windows: s.opening > 0,
        open: sim.incoming.oxide > 0 ? 1 - s.floor / sim.incoming.oxide : 1 };
    },
    live(sim, wafer) {
      const s = sim.state, out = Boolean(s.result) && s.inside <= 0, touched = s.etched > 0;
      return {
        ...wafer, oxide: s.field, resist: out || s.resist <= 0 ? null : { thickness: s.resist, opening: s.opening }, unmasked: touched && s.field <= 0,
        window: touched && s.opening > 0 && s.field > 0 ? { width: s.opening + 2 * s.undercut, depth: s.field - s.floor, open: s.floor <= 1e-9, left: s.floor, siliconLoss: s.siliconLoss } : null,
      };
    },
    /** Before the etch has begun, the later stops show what the standard etch would make of this wafer. */
    forecast(sim, wafer) { return sim.state.etched > 0 ? this.live(sim, wafer) : F.apply('etch', wafer).wafer; },
    monitor(sim) {
      const s = sim.state, r = s.result && s.inside <= 0 ? s.result : null, through = s.opening > 0 && s.floor <= 1e-9, tMax = Math.max(120, s.history.length ? s.history.at(-1).t : 0);
      return {
        picture: { section: this.live(sim, { substrate: {}, oxide: s.field, resist: null, window: null, junction: null, liner: 0, metal: null }) },
        value: through ? s.siliconLoss : s.floor, unit: 'nm',
        note: r ? (through ? '깎인 실리콘 · 계측값' : '남은 산화막 · 계측값') : through ? '깎인 실리콘 · 계산값' : '창에 남은 산화막 · 계산값',
        meter: null,
        trend: { label: '종점 신호: 산화막이 깎일 때 나오는 빛', points: s.history, x: p => p.t, y: p => p.signal, xMax: tMax, yMax: Math.max(0.5, ...s.history.map(p => p.signal)) * 1.15, xLabel: clock(tMax), tip: p => [`신호 ${p.signal.toFixed(2)}`, ` · ${clock(p.t)}`] },
        now: `RF <b>${fmt(s.controls.power)} W</b> · <b>${fmt(s.controls.pressure)}</b> mTorr · 식각 <b>${clock(s.etched)}</b>`,
        spec: [`실리콘 깎임 ≤ ${C.spec.siliconLoss} nm`, `창 너비 ${fmt(C.spec.width.target)} ± ${C.spec.width.tolerance}`],
      };
    },
    screen(sim) {
      const s = sim.state;
      return {
        name: 'ET-01', title: 'OXIDE ETCH', running: s.plasma, state: s.plasma ? 'PLASMA ON' : s.inside >= 1 ? 'READY' : s.inside > 0 ? 'TRANSFER' : 'WAFER OUT',
        big: ['RF POWER', fmt(s.controls.power), 'W'],
        cells: [['PRESSURE', `${fmt(s.controls.pressure)}`], ['TIME', `${Math.floor(s.etched / 60)}:${String(Math.floor(s.etched % 60)).padStart(2, '0')}`], ['ENDPOINT', s.signal.toFixed(2)]],
        chips: [['CHF₃', s.controls.chf3], ['CF₄', s.controls.cf4], ['WAFER', s.inside >= 1]],
      };
    },
    result(sim) {
      const s = sim.state, r = s.result; if (!r || s.inside > 0) return null;
      const how = sim.recipe ? `${sim.recipe.gas}, ${fmt(sim.recipe.power)} W, ${fmt(sim.recipe.pressure)} mTorr, ${clock(r.seconds)}` : '식각하지 않음';
      return { oxide: r.oxide, stripped: r.stripped, width: r.width, depth: r.depth, open: r.open, left: r.left, siliconLoss: r.siliconLoss, how };
    },
  };
})();
