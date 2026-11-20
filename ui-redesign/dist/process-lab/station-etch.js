/* Etch station of the process lab: what the page shows and says while the etch chamber is operated.
 * Calculation: etch-model.js. Equipment: src/process-lab/etcher.js. The shape of a station is described in app.js. */
(function () {
  'use strict';
  const ET = window.ProcessLabEtch, F = window.ProcessLabFlow, FILM = window.Lab3DProcess, C = ET.constants;
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const clock = seconds => `${Math.floor(seconds / 60)}분 ${String(Math.round(seconds % 60)).padStart(2, '0')}초`;
  const onOff = open => open ? '열림' : '닫힘';
  const share = v => `${fmt(v * 100)}%`;
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
      chamber: { name: '식각 챔버', role: '위아래 전극 사이에 플라스마를 만들어, 감광막이 열린 곳의 산화막을 깎습니다. 웨이퍼 가장자리가 가운데보다 조금 빨리 깎입니다.', basis: '가운데 −5%, 가장자리 +5% (대표값)',
        rows: s => [['플라스마', s.plasma ? '켜짐' : '꺼짐'], ['가스', gasText(s.controls)], ...rateRows(s).slice(0, 1), ...(s.plasma ? [['가운데 · 가장자리', `${fmt(s.rate * s.across[0])} · ${fmt(s.rate * s.across[s.across.length - 1])} nm/분`]] : [])] },
      pump: { name: '진공 펌프', role: '챔버를 낮은 압력으로 유지하고 깎여 나온 기체를 빼냅니다.', rows: s => [['압력', `${fmt(s.controls.pressure)} mTorr`]] },
      rf: { name: 'RF 정합기', role: '아래 전극에 고주파 전력을 넣습니다.', rows: s => [['전력', `${fmt(s.controls.power)} W`]] },
      oes: { name: '종점 검출기', role: '플라스마의 빛을 봅니다. 산화막이 깎일 때 나오는 빛이 줄어들면 창이 실리콘까지 뚫린 것입니다. 가장자리부터 뚫리므로 빛은 한동안에 걸쳐 줄어듭니다.', rows: s => [['신호', s.signal.toFixed(2)], ['뚫린 면적', share(s.opened)]] },
      wafer: { name: '웨이퍼', role: '감광막이 열린 곳만 깎입니다.', rows: s => [['남은 감광막 (가장 얇은 곳)', `${fmt(s.resist)} nm`], ['뚫린 면적', share(s.opened)]] },
      hmi: { name: '장비 화면', role: '전력, 압력, 가스, 식각 시간을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 식각 중, 노랑은 대기입니다.', rows: s => [['상태', s.plasma ? '식각 중' : '대기']] },
    },
    control(sim, name, value) { return sim.setControl(name, value) ? null : name === 'load' ? '플라스마가 켜져 있는 동안에는 문이 열리지 않습니다. RF 전력을 내리세요.' : null; },
    tick(sim) { const s = sim.state; if (s.plasma) sim.recipe = { gas: gasText(s.controls), power: s.controls.power, pressure: s.controls.pressure }; },
    guide(sim, next) {
      const s = sim.state, r = s.result, c = s.controls;
      if (r && s.inside <= 0) {
        const text = r.stripped ? '산화막이 모두 깎여 나갔습니다.' : r.width <= 0 ? '감광막이 열리지 않아 창이 생기지 않았습니다.'
          : !r.open ? (r.opened > 0 ? `창이 웨이퍼 면적의 ${share(r.opened)}에서만 뚫렸습니다. 가운데 쪽 창 바닥에 산화막이 최대 ${fmt(r.left)} nm 남았습니다. 감광막을 벗겨서 다시 깎을 수는 없습니다.`
            : `창 바닥에 산화막 ${fmt(r.left)} nm가 남았습니다. 다시 넣어 더 깎을 수는 없습니다(감광막을 벗겼습니다).`)
            : `창이 웨이퍼 전체에서 뚫렸습니다. 실리콘은 가장 많이 깎인 곳이 ${fmt(r.siliconLoss)} nm, 창 너비는 평균 ${fmt(r.width)} nm. ${r.ok ? '목표 범위 안입니다.' : '목표를 벗어났습니다.'}`;
        return [text, `다음: ${next}`, 'finish', null];
      }
      if (s.inside < 1) return [c.load ? '웨이퍼가 챔버로 들어가는 중입니다.' : s.inside > 0 ? '웨이퍼가 나오는 중입니다.' : '투입 단추를 눌러 웨이퍼를 챔버에 넣으세요.', null, null, c.load || s.inside > 0 ? null : 'load'];
      if (s.plasma) return [s.opened <= 0 ? '식각 중입니다. 창이 실리콘까지 뚫리면 종점 신호가 떨어집니다.' : s.opened < 1 ? '종점 신호가 떨어지고 있습니다. 가장자리부터 뚫리는 중이고, 가운데는 아직입니다.' : '종점 신호가 바닥까지 내려왔습니다. 웨이퍼 전체가 뚫렸습니다. RF 전력을 내려 멈추세요.', null, null, s.opened >= 1 ? 'power' : null];
      if (s.etched > 0) return ['배출 단추를 눌러 웨이퍼를 꺼내세요. 꺼내면 감광막을 벗기고 창을 잽니다.', null, null, 'load'];
      return ['가스를 열고 압력과 RF 전력을 정하세요. 전력이 50 W를 넘으면 플라스마가 켜집니다.', null, null, c.chf3 || c.cf4 ? 'power' : 'chf3'];
    },
    view(sim) {
      const s = sim.state, start = sim.incoming.resist ? sim.incoming.resist.thickness : 0, out = Boolean(s.result) && s.inside <= 0;
      return { inside: s.inside, plasma: s.plasma, controls: s.controls, filmColor: FILM.filmColor(s.field), resist: out || !start ? 0 : s.resist / start, windows: s.opening > 0,
        open: Array.from(s.places.floor, v => sim.incoming.oxide > 0 ? 1 - v / sim.incoming.oxide : 1) };          // how far each place has etched through, centre to edge
    },
    /** The wafer at its centre, where the windows open last: the picture of the monitor and of this stop of the route. */
    live(sim, wafer) {
      const s = sim.state, P = s.places, out = Boolean(s.result) && s.inside <= 0, touched = s.etched > 0;
      return {
        ...wafer, oxide: P.field[0], resist: out || P.resist[0] <= 0 ? null : { thickness: P.resist[0], opening: s.opening }, unmasked: touched && s.field <= 0,
        window: touched && s.opening > 0 && P.field[0] > 0 ? { width: s.opening + 2 * P.undercut[0], depth: P.field[0] - P.floor[0], open: P.floor[0] <= 1e-9, left: P.floor[0], siliconLoss: P.siliconLoss[0] } : null,
      };
    },
    /** The later stops show what this wafer would make if it came out now, place by place; before the etch has begun, what the standard etch would make of it. */
    forecast(sim, wafer) { return sim.state.etched > 0 ? F.apply('etch', wafer, this.result(sim, true)).wafer : F.apply('etch', wafer).wafer; },
    monitor(sim) {
      const s = sim.state, r = s.result && s.inside <= 0 ? s.result : null, through = s.opening > 0 && s.floor <= 1e-9, tMax = Math.max(120, s.history.length ? s.history.at(-1).t : 0);
      return {
        picture: { section: this.live(sim, { substrate: {}, oxide: s.field, resist: null, window: null, junction: null, liner: 0, metal: null }) },
        value: through ? s.siliconLoss : s.floor, unit: 'nm',                         // the most at any place: oxide at the centre, silicon at the edge
        note: r ? (through ? '깎인 실리콘 (최대) · 계측값' : '가운데 창의 산화막 · 계측값') : through ? '깎인 실리콘 (최대) · 계산값' : '가운데 창의 산화막 · 계산값',
        meter: null,
        trend: { label: '종점 신호: 산화막이 깎일 때 나오는 빛', points: s.history, x: p => p.t, y: p => p.signal, xMax: tMax, yMax: Math.max(0.5, ...s.history.map(p => p.signal)) * 1.15, xLabel: clock(tMax), tip: p => [`신호 ${p.signal.toFixed(2)}`, ` · 뚫린 면적 ${share(p.opened || 0)} · ${clock(p.t)}`] },
        now: s.opened > 0 && s.opened < 1 ? `뚫린 면적 <b>${share(s.opened)}</b> · 식각 <b>${clock(s.etched)}</b>` : `RF <b>${fmt(s.controls.power)} W</b> · <b>${fmt(s.controls.pressure)}</b> mTorr · 식각 <b>${clock(s.etched)}</b>`,
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
    /** What goes on along the route; with `now`, the wafer as it would come out at this moment. */
    result(sim, now) {
      const s = sim.state, r = now ? sim.measure() : s.result; if (!r || (!now && s.inside > 0)) return null;
      const how = sim.recipe ? `${sim.recipe.gas}, ${fmt(sim.recipe.power)} W, ${fmt(sim.recipe.pressure)} mTorr, ${clock(r.seconds)}` : '식각하지 않음';
      return { oxide: r.oxide, stripped: r.stripped, width: r.width, depth: r.depth, open: r.open, opened: r.opened, left: r.left, siliconLoss: r.siliconLoss, profile: r.profile, how };
    },
  };
})();
