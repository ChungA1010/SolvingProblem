/* Implant station of the process lab: what the page shows and says while the ion implanter and its anneal chamber are
 * operated. It is the equipment of the process 'deposition' (증착·이온주입); the barrier film goes on by the standard
 * recipe when the wafer leaves. Calculation: implant-model.js. Equipment: src/process-lab/implanter.js.
 * The shape of a station is described in app.js. */
(function () {
  'use strict';
  const IM = window.ProcessLabImplant, F = window.ProcessLabFlow, FILM = window.Lab3DProcess, C = IM.constants, J = C.spec.junction, sci = F.sci;
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const clock = seconds => seconds < 60 ? `${Math.round(seconds)}초` : `${Math.floor(seconds / 60)}분 ${String(Math.round(seconds % 60)).padStart(2, '0')}초`;
  const doseOf = c => Math.pow(10, c.dose);
  const counter = v => { if (!(v > 0)) return '0'; let e = Math.floor(Math.log10(v)), m = v / 10 ** e; if (m >= 9.95) { m = 1; e += 1; } return `${m.toFixed(1)}E${e}`; };   // as the machine writes it
  const PHASE = { ready: '주입 전', implanting: '주입 중', implanted: '주입 끝', annealing: '열처리 중', done: '열처리 끝' };
  const REFUSED = {
    implant: s => s.phase === 'implanting' ? '주입하는 중입니다.' : '이미 주입했습니다. 이온주입은 되돌릴 수 없습니다.',
    anneal: s => s.phase === 'ready' ? '먼저 이온을 주입하세요.' : '진행 중입니다.',
  };
  const ready = (s, phases) => phases.includes(s.phase) ? '누를 수 있음' : '지금은 안 됨';
  /** The implant's outcome as the flow model takes it. */
  const handed = o => ({ depth: o.reached ? o.junction : 0, surface: o.surface, peak: o.peak, masked: o.masked });
  const RANGE = '계산: ZBL 핵 저지 + LSS 전자 저지 (해석식, 채널링 제외)';

  (window.ProcessLabStations = window.ProcessLabStations || {}).deposition = {
    equipment: 'implant',
    views: [['home', '전체'], ['beamline', '빔라인'], ['chamber', '웨이퍼'], ['panel', '조작반']],
    speeds: [[10, '10초/초'], [30, '30초/초'], [300, '5분/초']], defaultSpeed: 30,
    create(wafer) {
      const win = wafer.window, windows = Boolean(win && win.width > 0);
      const sim = IM.create({ wafer: { oxide: wafer.oxide, windows, left: windows ? win.left : 0, resistivity: wafer.substrate.resistivity } });
      sim.wafer = wafer; return sim;
    },
    parts: {
      energy: { name: '가속 에너지', role: '이온을 가속하는 에너지입니다. 클수록 실리콘 깊이 들어가고, 산화막도 더 깊이 파고듭니다.', how: '좌우로 끌거나 휠을 굴립니다. 주입하기 전에 정합니다.', basis: RANGE,
        rows: s => { const a = IM.range(s.controls.energy), b = IM.range(s.controls.energy, 'oxide'); return [['설정', `${fmt(s.controls.energy)} keV`], ['실리콘에서 멈추는 깊이', `${fmt(a.projected)} ± ${fmt(a.straggle)} nm`], ['산화막에서 멈추는 깊이', `${fmt(b.projected)} ± ${fmt(b.straggle)} nm`]]; },
        pill: s => `${fmt(s.controls.energy)} keV` },
      dose: { name: '주입량', role: '웨이퍼 1 cm²에 넣는 이온의 수입니다. 많을수록 농도가 높아지고, 넣는 데 오래 걸립니다.', how: '좌우로 끌거나 휠을 굴립니다. 주입하기 전에 정합니다.', basis: '시간 = 주입량 × 전하 ÷ 빔 전류 밀도',
        rows: s => [['설정', `${sci(doseOf(s.controls))} /cm²`], ['넣는 데 걸리는 시간', clock(IM.implantSeconds(doseOf(s.controls)))]], pill: s => `${sci(doseOf(s.controls))} /cm²` },
      temperature: { name: '열처리 온도', role: '주입으로 흐트러진 결정을 바로잡고 인을 퍼뜨리는 온도입니다. 높을수록 빨리 퍼집니다.', how: '좌우로 끌거나 휠을 굴립니다. 열처리하기 전에 정합니다.', basis: `계산: D = ${C.diffusion.D0} cm²/s · exp(−${C.diffusion.Ea} eV / kT)`,
        rows: s => [['설정', `${fmt(s.controls.temperature)} °C`], ['이 온도의 확산 계수', `${sci(IM.diffusivity(s.controls.temperature))} cm²/s`]], pill: s => `${fmt(s.controls.temperature)} °C` },
      minutes: { name: '열처리 시간', role: '그 온도에 두는 시간입니다. 길수록 깊이 퍼집니다.', how: '좌우로 끌거나 휠을 굴립니다. 열처리하기 전에 정합니다.', basis: '퍼진 폭² = 주입 직후의 폭² + 2Dt',
        rows: s => [['설정', `${fmt(s.controls.minutes)}분`], ['이 조건으로 더 퍼지는 폭 √(2Dt)', `${fmt(Math.sqrt(2 * IM.diffusivity(s.controls.temperature) * s.controls.minutes * 60) * 1e7)} nm`]], pill: s => `${fmt(s.controls.minutes)}분` },
      implant: { name: '주입', role: '웨이퍼를 빔 앞에 세우고, 정한 주입량이 될 때까지 이온을 넣습니다. 되돌릴 수 없습니다.', how: '누릅니다.', rows: s => [['단추', ready(s, ['ready'])]] },
      anneal: { name: '열처리', role: '웨이퍼를 열처리 챔버로 옮겨 정한 온도에 정한 시간만큼 둡니다. 여러 번 할 수 있고, 할 때마다 더 퍼집니다.', how: '누릅니다.', rows: s => [['단추', ready(s, ['implanted', 'done'])], ['한 횟수', `${s.anneals.length}회`]] },
      source: { name: '이온 소스', role: '포스핀(PH₃) 기체를 플라스마로 만들어 인 이온을 뽑아냅니다.', rows: s => [['빔', s.beam ? '나오는 중' : '꺼짐']] },
      magnet: { name: '질량 분석 자석', role: '빔을 90° 휘게 합니다. 질량이 맞는 인 이온(³¹P⁺)만 이 굽은 길을 따라 나갑니다.', rows: () => [] },
      column: { name: '가속관', role: '전극 사이에 건 전압으로 이온을 정한 에너지까지 가속합니다.', rows: s => [['에너지', `${fmt((s.used || { keV: s.controls.energy }).keV)} keV`]] },
      scanner: { name: '빔 주사기', role: '빔을 흔들어 웨이퍼 전체에 고르게 뿌립니다.', rows: () => [] },
      chamber: { name: '엔드 스테이션', role: `웨이퍼를 빔 앞에 세우는 진공 챔버입니다. 결정의 틈으로 이온이 깊이 파고들지 않도록 ${C.tilt}° 기울이고, 뒤의 패러데이 컵이 빔 전류를 세어 주입량을 잽니다.`,
        rows: s => [['빔 전류', s.beam ? `${(C.beam.current * 1000).toFixed(1)} mA` : '0 mA'], ['넣은 양', `${sci(s.counted)} /cm²`]] },
      annealer: { name: '열처리 챔버', role: '램프로 웨이퍼를 달굽니다.', basis: '승온·냉각 시간은 계산에 넣지 않음', rows: s => [['온도', `${fmt(s.hot)} °C`]] },
      wafer: { name: '웨이퍼', role: '산화막의 창으로 드러난 실리콘에만 이온이 들어가야 합니다. 산화막이 얇거나 에너지가 크면 산화막 아래로도 들어갑니다.', rows: s => [['단계', PHASE[s.phase]]] },
      hmi: { name: '장비 화면', role: '넣은 이온의 양과 설정을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 처리 중, 노랑은 대기입니다.', rows: s => [['상태', s.phase === 'implanting' || s.phase === 'annealing' ? '처리 중' : '대기']] },
    },
    control(sim, name, value) { return sim.setControl(name, value) ? null : REFUSED[name] ? REFUSED[name](sim.state) : null; },
    guide(sim, next) {
      const s = sim.state, r = s.result;
      if (s.phase === 'ready') return ['에너지와 주입량을 정하고 주입 단추를 누르세요. 그래프의 선이 점선과 만나는 깊이가 접합입니다.', null, null, 'implant'];
      if (s.phase === 'implanting') return ['이온을 넣는 중입니다. 빔 전류를 세어 정한 주입량이 되면 멈춥니다.', null, null, null];
      if (s.phase === 'implanted') return ['열처리 온도와 시간을 정하고 열처리 단추를 누르세요. 뜨겁고 길수록 인이 깊이 퍼집니다.', null, null, 'anneal'];
      if (s.phase === 'annealing' || !r) return ['열처리 중입니다.', null, null, null];
      const shallow = r.reached && r.junction < J.target - J.tolerance, thin = r.reached && r.surface < C.spec.surface;
      const text = !r.masked ? (sim.incoming.oxide > 0 ? '이온이 산화막을 뚫고 들어가 창 밖에도 접합이 생겼습니다.' : '산화막이 없어 웨이퍼 전면에 접합이 생겼습니다.')
        : !r.reached ? (sim.incoming.windows ? '접합이 생기지 않았습니다.' : '산화막에 창이 없어 이온이 실리콘에 닿지 않았습니다.')
          : `접합 깊이 ${fmt(r.junction)} nm, 표면 농도 ${sci(r.surface)} /cm³. ${r.ok ? '목표 범위 안입니다.' : [Math.abs(r.error) > J.tolerance ? `목표보다 ${fmt(Math.abs(r.error))} nm ${r.error < 0 ? '얕습니다' : '깊습니다'}.` : '', thin ? '표면 농도가 모자랍니다.' : '', sim.incoming.left > 0 ? '창 바닥에 산화막이 남아 있습니다.' : ''].filter(Boolean).join(' ')}`;
      const more = r.masked && (shallow || thin);
      return [`${text}${more ? ' 열처리는 더 할 수 있습니다.' : ''}`, `다음: ${next}`, 'finish', more ? 'anneal' : null];
    },
    view(sim) { const s = sim.state; return { phase: s.phase, beam: s.beam, hot: s.hot, controls: s.controls, filmColor: FILM.filmColor(sim.wafer.oxide), windows: sim.incoming.windows }; },
    live(sim, wafer) { const o = sim.now(); return o ? F.implanted(wafer, handed(o)).wafer : wafer; },
    /** The wafer as it would leave with the dials as they are: lets the route show what follows from them. */
    forecast(sim, wafer) { return F.apply('deposition', wafer, handed(sim.state.result || sim.outlook())).wafer; },
    monitor(sim) {
      const s = sim.state, r = s.phase === 'done' ? s.result : null, o = r || sim.outlook(), depth = o.reached ? o.junction : 0;
      const xMax = Math.max(800, Math.ceil(depth * 1.25 / 200) * 200), points = [];
      for (let i = 0; i <= 80; i++) points.push({ x: xMax * i / 80, n: o.at(xMax * i / 80) });
      const what = !o.masked ? (sim.incoming.oxide > 0 ? '이온이 산화막 아래로 샘' : '산화막이 없어 전면에 주입')
        : !o.reached ? '접합이 생기지 않음'
          : !r ? '접합 깊이' : r.ok ? '목표 범위 안' : Math.abs(r.error) > J.tolerance ? `목표와 <b>${fmt(Math.abs(r.error))} nm</b> 차이` : r.surface < C.spec.surface ? '표면 농도 부족' : '창이 덜 열림';
      return {
        picture: { section: this.live(sim, sim.wafer), top: 150 },
        value: depth, unit: 'nm', note: `${what} · ${r ? '계측값' : '계산값'}`,
        meter: { value: depth, target: J.target, tolerance: J.tolerance, scale: J.target * 2 },
        trend: { label: '깊이에 따른 인 농도 (세로는 로그 눈금). 점선은 기판의 붕소 농도이고, 선이 점선과 만나는 깊이가 접합입니다', points, x: p => p.x, y: p => Math.max(0, Math.log10(Math.max(1, p.n)) - 14), xMax, yMax: 7.3,
          level: Math.log10(o.substrate) - 14, noDot: true, xStart: '표면', xLabel: `${fmt(xMax)} nm`, tip: p => [`${sci(p.n)} /cm³`, ` · 깊이 ${fmt(p.x)} nm`] },
        now: `표면 <b>${sci(o.surface)}</b> · 산화막 아래 <b>${o.under >= 1 ? sci(o.under) : '0'}</b>`,                       // per cm3; the unit is on the chips below
        spec: [`접합 깊이 ${J.target} ± ${J.tolerance} nm`, `표면 농도 ≥ ${sci(C.spec.surface)} /cm³`],
      };
    },
    screen(sim) {
      const s = sim.state, used = s.used || { keV: s.controls.energy, dose: doseOf(s.controls) }, annealing = s.phase === 'annealing';
      return {
        name: 'IM-01', title: 'ION IMPLANT', running: s.phase === 'implanting' || annealing,
        state: { ready: 'READY', implanting: 'BEAM ON', implanted: 'IMPLANTED', annealing: 'ANNEAL', done: 'DONE' }[s.phase],
        big: ['DOSE', counter(s.counted), 'cm⁻²'],
        cells: [['ENERGY', `${fmt(used.keV)} keV`], ['BEAM', s.beam ? `${(C.beam.current * 1000).toFixed(1)} mA` : '0 mA'], ['ANNEAL', `${fmt(s.hot)}°C`]],
        chips: [['BEAM', s.beam], ['IMPLANT', s.phase !== 'ready' && s.phase !== 'implanting'], ['ANNEAL', s.phase === 'done']],
        bar: annealing ? ['ANNEAL', s.progress] : ['DOSE', s.counted / used.dose],
      };
    },
    result(sim) {
      const s = sim.state, r = s.result; if (s.phase !== 'done' || !r) return null;
      return { ...handed(r), how: `P⁺ ${fmt(r.keV)} keV, ${sci(r.dose)} /cm², ${r.anneals.map(a => `${fmt(a.celsius)} °C ${fmt(a.minutes)}분`).join(' + ')}` };
    },
  };
})();
