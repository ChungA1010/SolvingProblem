/* Implant station of the process lab: what the page shows and says while the ion implanter and its anneal chamber are
 * operated. It is the equipment of the process 'deposition' (증착·이온주입); the barrier film goes on by the standard
 * recipe when the wafer leaves. Calculation: implant-model.js. Equipment: src/implanter.js.
 * The shape of a station is described in app.js. */
(function () {
  'use strict';
  const IM = window.ProcessLabImplant, F = window.ProcessLabFlow, FILM = window.Lab3DProcess, C = IM.constants, J = C.spec.junction, sci = F.sci;
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const clock = seconds => { const whole = Math.round(seconds); return whole < 60 ? `${whole}초` : `${Math.floor(whole / 60)}분 ${String(whole % 60).padStart(2, '0')}초`; };   // whole seconds first: 179.6 s is 3분 00초, not 2분 60초
  /** A concentration as the page writes it; under 10¹² per cm3 there is nothing to speak of. */
  const amount = n => n >= 1e12 ? `${sci(n)} /cm³` : '거의 없음';
  /** Whether IMPLANT would be taken now: the wafer not yet implanted, no scan under way, and a beam to implant with. */
  const beamReady = s => s.phase === 'ready' && !s.scan && s.current >= C.beam.least;
  /** Whether one more anneal with the dials as they stand would raise the phosphorus at the surface: ions that stopped deep come up to it as they spread, before more spreading thins it again. */
  const annealLifts = sim => { const s = sim.state; return s.used ? sim.outcome({ parts: s.used.parts, Dt: s.Dt + IM.diffusivity(s.controls.temperature) * s.controls.minutes * 60 }).surface > sim.outcome({ parts: s.used.parts, Dt: s.Dt }).surface : false; };
  const doseOf = c => Math.pow(10, c.dose);
  const counter = v => { if (!(v > 0)) return '0'; let e = Math.floor(Math.log10(v)), m = v / 10 ** e; if (m >= 9.95) { m = 1; e += 1; } return `${m.toFixed(1)}E${e}`; };   // as the machine writes it
  const PHASE = { ready: '주입 전', implanting: '주입 중', implanted: '주입 끝', annealing: '열처리 중', done: '열처리 끝' };
  const mA = amps => `${(amps * 1000).toFixed(2)} mA`, mass = s => IM.massAt(s.field).toFixed(1);
  /** The ions in the beam as the page writes them: 'P⁺', or 'PH⁺ 86%, P⁺ 14%'. */
  const ionText = ions => !ions.length ? '없음' : ions.length === 1 ? ions[0].name : ions.map(ion => `${ion.name} ${Math.round(ion.share * 100)}%`).join(', ');
  const power = v => `10${String(Math.round(14 + v)).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`;      // a tick of the logarithmic axis of the concentration charts: 10¹⁵ for 1 above 10¹⁴
  const measuredOnce = new WeakMap(); let measurements = 0;
  /** A number for each measurement, so the page can tell a new report from the one it already shows. */
  const reportId = r => { if (!measuredOnce.has(r)) measuredOnce.set(r, ++measurements); return measuredOnce.get(r); };
  const tuning = s => s.phase === 'ready' && (Boolean(s.scan) || s.current < C.beam.least);       // no beam to implant with yet: the monitor shows the mass scan
  const REFUSED = {
    implant: s => s.phase === 'implanting' ? '주입하는 중입니다.' : s.phase !== 'ready' ? '이미 주입했습니다. 이온주입은 되돌릴 수 없습니다.' : s.scan ? '질량 스캔이 끝난 뒤에 주입할 수 있습니다.' : '빔 전류가 거의 없습니다. 분석 자석을 이온의 봉우리에 맞추세요.',
    field: s => s.scan ? '질량 스캔 중에는 자석을 돌릴 수 없습니다.' : '주입하는 동안에는 자석을 바꿀 수 없습니다.',
    scan: s => s.scan ? '스캔하는 중입니다.' : '질량 스캔은 주입하기 전에만 합니다.',
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
      const sim = IM.create({ wafer: { oxide: wafer.oxide, windows, left: windows && !win.open ? win.left : 0, resistivity: wafer.substrate.resistivity }, field: 0.2 });   // the magnet as the last user left it: on no peak. left: the oxide on the floor of the windows the implant is judged by; where some are open, those
      sim.wafer = wafer; sim.partly = windows && win.open && win.left > 1; return sim;
    },
    parts: {
      field: { name: '분석 자석 세기', role: '분석 자석의 세기를 정합니다. 자석은 이온을 휘게 하는데, 세기에 맞는 질량/전하의 이온만 굽은 길을 지나 슬릿을 빠져나갑니다.', how: '좌우로 끌거나 휠을 굴립니다. 주입하는 동안에는 바꿀 수 없습니다.', basis: '계산: Bρ = √(2mV/q). 반지름 0.40 m, 인출 전압 30 kV (대푯값)',
        rows: s => [['설정', `${s.controls.field.toFixed(3)} T`], ['통과하는 질량/전하', `${IM.massAt(s.controls.field).toFixed(1)}`], ['빔 전류', mA(IM.beamCurrent(s.controls.field))]], pill: s => `${s.controls.field.toFixed(3)} T` },
      scan: { name: '질량 스캔', role: '자석 세기를 낮은 쪽에서 높은 쪽으로 바꿔 가며 빔 전류를 잽니다. 빔에 어떤 이온이 얼마나 들었는지 봉우리로 보입니다.', how: '누릅니다. 8초 걸립니다.', rows: s => [['단추', s.phase === 'ready' && !s.scan ? '누를 수 있음' : '지금은 안 됨'], ['스캔', s.scan ? '하는 중' : s.spectrum.length ? '함' : '안 함']] },
      energy: { name: '가속 에너지', role: '이온을 가속하는 에너지입니다. 클수록 실리콘에 깊이 들어가고, 산화막도 더 깊이 파고듭니다.', how: '좌우로 끌거나 휠을 굴립니다. 주입하기 전에 정합니다.', basis: RANGE,
        rows: s => { const a = IM.range(s.controls.energy), b = IM.range(s.controls.energy, 'oxide'); return [['설정', `${fmt(s.controls.energy)} keV`], ['실리콘에서 멈추는 깊이', `${fmt(a.projected)} ± ${fmt(a.straggle)} nm`], ['산화막에서 멈추는 깊이', `${fmt(b.projected)} ± ${fmt(b.straggle)} nm`]]; },
        pill: s => `${fmt(s.controls.energy)} keV` },
      dose: { name: '주입량', role: '웨이퍼 1 cm²에 넣는 이온의 수입니다. 많을수록 농도가 높아지고, 넣는 데 오래 걸립니다.', how: '좌우로 끌거나 휠을 굴립니다. 주입하기 전에 정합니다.', basis: '시간 = 주입량 × 전하 ÷ 빔 전류 밀도',
        rows: s => [['설정', `${sci(doseOf(s.controls))} /cm²`], ['넣는 데 걸리는 시간', s.current >= C.beam.least ? clock(IM.implantSeconds(doseOf(s.controls), s.current / C.beam.area)) : '빔 없음']], pill: s => `${sci(doseOf(s.controls))} /cm²` },
      temperature: { name: '열처리 온도', role: '주입으로 흐트러진 결정을 바로잡고 인을 퍼뜨리는 온도입니다. 높을수록 빨리 퍼집니다.', how: '좌우로 끌거나 휠을 굴립니다. 열처리하기 전에 정합니다.', basis: `계산: D = ${C.diffusion.D0} cm²/s · exp(−${C.diffusion.Ea} eV / kT)`,
        rows: s => [['설정', `${fmt(s.controls.temperature)} °C`], ['이 온도의 확산 계수', `${sci(IM.diffusivity(s.controls.temperature))} cm²/s`]], pill: s => `${fmt(s.controls.temperature)} °C` },
      minutes: { name: '열처리 시간', role: '그 온도에 두는 시간입니다. 길수록 깊이 퍼집니다.', how: '좌우로 끌거나 휠을 굴립니다. 열처리하기 전에 정합니다.', basis: '퍼진 폭² = 주입 직후의 폭² + 2Dt',
        rows: s => [['설정', `${fmt(s.controls.minutes)}분`], ['이 조건으로 더 퍼지는 폭 √(2Dt)', `${fmt(Math.sqrt(2 * IM.diffusivity(s.controls.temperature) * s.controls.minutes * 60) * 1e7)} nm`]], pill: s => `${fmt(s.controls.minutes)}분` },
      implant: { name: '주입', role: '웨이퍼를 빔 앞에 세우고, 정한 주입량이 될 때까지 이온을 넣습니다. 되돌릴 수 없습니다.', how: '누릅니다.', rows: s => [['단추', beamReady(s) ? '누를 수 있음' : '지금은 안 됨']] },
      anneal: { name: '열처리', role: '웨이퍼를 열처리 챔버로 옮겨 정한 온도에 정한 시간만큼 둡니다. 여러 번 할 수 있고, 할 때마다 더 퍼집니다.', how: '누릅니다.', rows: s => [['단추', ready(s, ['implanted', 'done'])], ['한 횟수', `${s.anneals.length}회`]] },
      source: { name: '이온 소스', role: '포스핀(PH₃) 기체를 플라스마로 만들어 이온을 30 kV로 뽑아냅니다. 인 이온(P⁺)만 나오지 않고 PH⁺, PH₂⁺, P₂⁺, 수소 이온도 함께 나옵니다.', basis: '이온의 비율은 대푯값', rows: s => [['인출 전압', `${C.source.extraction} kV`], ['나오는 이온 전체', mA(C.source.current)]] },
      magnet: { name: '질량 분석 자석', role: '빔을 90° 휘게 합니다. 무거운 이온은 덜 휘고 가벼운 이온은 더 휘어, 세기에 맞는 질량/전하의 이온만 슬릿을 지나갑니다.', basis: '분해능 m/Δm = 60 (대푯값)',
        rows: s => [['세기', `${s.field.toFixed(3)} T`], ['통과하는 질량/전하', mass(s)], ['빔의 이온', ionText(IM.ionsAt(s.field))]] },
      column: { name: '가속관', role: '전극 사이에 건 전압으로 이온을 정한 에너지까지 가속합니다.', rows: s => [['에너지', `${fmt((s.used || { keV: s.controls.energy }).keV)} keV`]] },
      scanner: { name: '빔 주사기', role: '빔을 흔들어 웨이퍼 전체에 고르게 뿌립니다.', rows: () => [] },
      chamber: { name: '엔드 스테이션', role: `웨이퍼를 빔 앞에 세우는 진공 챔버입니다. 결정의 틈으로 이온이 깊이 파고들지 않도록 ${C.tilt}° 기울이고, 뒤의 패러데이 컵이 빔 전류를 세어 주입량을 잽니다.`,
        rows: s => [['빔 전류', mA(s.current)], ['넣은 양', `${sci(s.counted)} /cm²`]] },
      annealer: { name: '열처리 챔버', role: '램프로 웨이퍼를 달굽니다.', basis: '승온·냉각 시간은 계산에 넣지 않음', rows: s => [['온도', `${fmt(s.hot)} °C`]] },
      wafer: { name: '웨이퍼', role: '산화막의 창으로 드러난 실리콘에만 이온이 들어가야 합니다. 산화막이 얇거나 에너지가 크면 산화막 아래로도 들어갑니다.', rows: s => [['단계', PHASE[s.phase]]] },
      hmi: { name: '장비 화면', role: '넣은 이온의 양과 설정을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 처리 중, 노랑은 대기입니다. 받지 않는 조작을 하면 빨강이 깜박입니다.', rows: s => [['상태', s.phase === 'implanting' || s.phase === 'annealing' ? '처리 중' : '대기']] },
    },
    control(sim, name, value) { return sim.setControl(name, value) ? null : REFUSED[name] ? REFUSED[name](sim.state) : null; },
    guide(sim, next) {
      const s = sim.state, r = s.result;
      if (s.phase === 'ready' && s.scan) return ['질량 스캔 중입니다. 자석 세기를 바꿔 가며 빔 전류를 잽니다.', null, null, null];
      if (s.phase === 'ready' && s.current < C.beam.least) return [s.spectrum.length ? '자석이 통과시키는 이온이 거의 없습니다. 스캔의 봉우리 가운데 넣을 이온에 자석 세기를 맞추세요.' : '자석이 통과시키는 이온이 거의 없습니다. 질량 스캔으로 빔에 든 이온을 보세요.', null, null, s.spectrum.length ? 'field' : 'scan'];
      if (s.phase === 'ready') return ['에너지와 주입량을 정하고 주입 단추를 누르세요. 그래프의 선이 점선과 만나는 깊이가 접합입니다.', null, null, 'implant'];
      if (s.phase === 'implanting') return ['이온을 넣는 중입니다. 빔 전류를 세어 정한 주입량이 되면 멈춥니다.', null, null, null];
      if (s.phase === 'implanted') return ['열처리 온도와 시간을 정하고 열처리 단추를 누르세요. 뜨겁고 길수록 인이 깊이 퍼집니다.', null, null, 'anneal'];
      if (s.phase === 'annealing' || !r) return ['열처리 중입니다.', null, null, null];
      const shallow = r.reached && r.error < -J.tolerance, thin = r.reached && !r.surfaceOk;
      const text = !r.masked ? (sim.incoming.oxide > 0 ? '이온이 산화막을 뚫고 들어가 창 밖에도 접합이 생겼습니다.' : '산화막이 없어 웨이퍼 전면에 접합이 생겼습니다.')
        : !r.reached ? (sim.incoming.windows ? '접합이 생기지 않았습니다.' : '산화막에 창이 없어 이온이 실리콘에 닿지 않았습니다.')
          : `접합 깊이 ${fmt(r.junction)} nm, 표면 농도 ${amount(r.surface)}. ${r.ok ? '목표 범위 안입니다.' : [Math.abs(r.error) > J.tolerance ? `목표보다 ${fmt(Math.abs(r.error))} nm ${r.error < 0 ? '얕습니다' : '깊습니다'}.` : '', thin ? '표면 농도가 모자랍니다.' : '', sim.incoming.left > 0 ? '창 바닥에 산화막이 남아 있습니다.' : ''].filter(Boolean).join(' ')}`;
      const more = r.masked && (shallow || (thin && annealLifts(sim))), main = r.ions && r.ions[0];         // another anneal is offered where it would help
      const which = main && main.name !== 'P⁺' ? ` 빔은 ${ionText(r.ions)}였습니다.` : '';
      return [`${text}${which}${more ? ' 열처리는 더 할 수 있습니다.' : ''}`, `다음: ${next}`, 'finish', more ? 'anneal' : null];
    },
    view(sim) { const s = sim.state; return { phase: s.phase, beam: s.beam, scanning: Boolean(s.scan), beamReady: beamReady(s), setup: s.phase === 'ready' ? s.current / C.beam.current : 0, hot: s.hot, controls: s.controls, filmColor: FILM.filmColor(sim.wafer.oxide), windows: sim.incoming.windows }; },
    live(sim, wafer) { const o = sim.now(); return o ? F.implanted(wafer, handed(o)).wafer : wafer; },
    /** The wafer as it would leave with the dials as they are: lets the route show what follows from them. */
    forecast(sim, wafer) { return F.apply('deposition', wafer, handed(sim.state.result || sim.outlook())).wafer; },
    monitor(sim) {
      const s = sim.state;
      if (tuning(s)) {                                            // beam set-up: the Faraday cup's current against the mass the magnet passes
        const points = s.spectrum.filter(p => p.mass <= 70), most = Math.max(1, ...IM.spectrum().map(p => p.current * 1000));
        return {
          picture: { section: this.live(sim, sim.wafer), top: 150 },
          value: (s.current * 1000).toFixed(2), unit: 'mA', note: '빔 전류 · 패러데이 컵 계측값', meter: null,
          trend: { label: '질량 스캔: 자석이 통과시키는 질량/전하에 따른 빔 전류. 주황 점선은 지금의 자석', points, x: p => p.mass, y: p => p.current * 1000, xMax: 70, yMax: most * 1.15, marker: IM.massAt(s.field), noDot: true, xStart: '0', xLabel: '질량/전하 70',
            tip: p => [`${(p.current * 1000).toFixed(2)} mA`, ` · 질량/전하 ${p.mass.toFixed(1)}`] },
          now: `질량/전하 <b>${mass(s)}</b> · 자석 <b>${s.field.toFixed(3)}</b> T`,
          spec: [`접합 깊이 ${J.target} ± ${J.tolerance} nm`, `표면 농도 ≥ ${sci(C.spec.surface)} /cm³`],
        };
      }
      const r = s.phase === 'done' ? s.result : null, o = r || sim.outlook(), depth = o.reached ? o.junction : 0;
      const xMax = Math.max(800, Math.ceil(depth * 1.25 / 200) * 200), points = [];
      for (let i = 0; i <= 80; i++) points.push({ x: xMax * i / 80, n: o.at(xMax * i / 80) });
      const what = !o.masked ? (sim.incoming.oxide > 0 ? '이온이 산화막 아래로 샘' : '산화막이 없어 전면에 주입')
        : !o.reached ? '접합이 생기지 않음'
          : !r ? '접합 깊이' : r.ok ? '목표 범위 안' : Math.abs(r.error) > J.tolerance ? `목표와 <b>${fmt(Math.abs(r.error))} nm</b> 차이` : !r.surfaceOk ? '표면 농도 부족' : '창이 덜 열림';
      return {
        picture: { section: this.live(sim, sim.wafer), top: 150 },
        value: depth, unit: 'nm', note: `${what} · ${r ? '계측값' : '계산값'}`,
        meter: { value: depth, target: J.target, tolerance: J.tolerance, scale: J.target * 2 },
        trend: { label: '깊이에 따른 인 농도 (세로는 로그 눈금). 점선은 기판의 붕소 농도이고, 선이 점선과 만나는 깊이가 접합입니다', points, x: p => p.x, y: p => Math.max(0, Math.log10(Math.max(1, p.n)) - 14), xMax, yMax: 7.3,
          level: Math.log10(o.substrate) - 14, noDot: true, xStart: '표면', xLabel: `${fmt(xMax)} nm`, tip: p => [`${sci(p.n)} /cm³`, ` · 깊이 ${fmt(p.x)} nm`] },
        now: `표면 <b>${o.surface >= 1e12 ? sci(o.surface) : '거의 없음'}</b> · 산화막 아래 <b>${o.under >= 1e12 ? sci(o.under) : '거의 없음'}</b>`,   // per cm3; the unit is on the chips below
        spec: [`접합 깊이 ${J.target} ± ${J.tolerance} nm`, `표면 농도 ≥ ${sci(C.spec.surface)} /cm³`],
      };
    },
    screen(sim) {
      const s = sim.state, used = s.used || { keV: s.controls.energy, dose: doseOf(s.controls) }, annealing = s.phase === 'annealing';
      return {
        name: 'IM-01', title: 'ION IMPLANT', running: s.phase === 'implanting' || annealing,
        state: { ready: 'READY', implanting: 'BEAM ON', implanted: 'IMPLANTED', annealing: 'ANNEAL', done: 'DONE' }[s.phase],
        big: ['DOSE', counter(s.counted), 'cm⁻²'],
        cells: [['ENERGY', `${fmt(used.keV)} keV`], ['BEAM', mA(s.current)], s.phase === 'ready' || s.phase === 'implanting' ? ['AMU', mass(s)] : ['ANNEAL', `${fmt(s.hot)}°C`]],
        chips: [['BEAM', s.beam], ['IMPLANT', s.phase !== 'ready' && s.phase !== 'implanting'], ['ANNEAL', s.phase === 'done']],
        bar: annealing ? ['ANNEAL', s.progress] : ['DOSE', s.counted / used.dose],
      };
    },
    // ----- process instruments and metrology report (the frame is in app.js) -----
    /** Keeps what the instruments draw over time: beam current, the dose counted so far and the wafer's temperature, from the implant on. */
    tick(sim) {
      const s = sim.state, busy = s.phase === 'implanting' || s.phase === 'annealing';
      if (s.phase === 'ready') { sim.trace = null; return; }
      const trace = sim.trace || (sim.trace = { from: s.time, points: [] }), t = s.time - trace.from, last = trace.points.at(-1);
      if (!last || (busy && t - last.t >= (s.phase === 'annealing' ? 5 : 1)) || (!busy && last.phase !== s.phase)) {      // and one point where each step ends
        trace.points.push({ t, phase: s.phase, current: s.beam ? s.current * 1000 : 0, share: s.used ? 100 * s.counted / s.used.dose : 0, hot: s.hot });
        if (trace.points.length > 1800) trace.points.splice(0, 2);
      }
    },
    running(sim) { const s = sim.state; return s.phase !== 'ready' && s.phase !== 'done'; },
    instruments(sim) {
      const s = sim.state, points = sim.trace ? sim.trace.points : [], o = (s.phase === 'done' && s.result) || sim.outlook();
      const tMax = Math.max(60, points.length ? points.at(-1).t : 0), time = [[0, '0'], [tMax, clock(tMax)]];
      const near = (list, x) => list.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, list[0]);
      const beam = points.map(p => [p.t, p.current]), share = points.map(p => [p.t, p.share]), hot = points.map(p => [p.t, p.hot]);
      const depth = o.reached ? o.junction : 0, xMax = Math.max(800, Math.ceil(depth * 1.25 / 200) * 200), log = n => Math.max(0, Math.log10(Math.max(1, n)) - 14), level = log(o.substrate);
      const profile = Array.from({ length: 81 }, (_, i) => [xMax * i / 80, log(o.at(xMax * i / 80))]), beamTop = Math.max(1, Math.ceil(C.beam.current * 1000 * 1.2));
      return [
        { title: '빔 전류', unit: 'mA', value: (s.beam ? s.current * 1000 : 0).toFixed(2), label: '시간에 따른 웨이퍼에 닿는 빔 전류',
          plot: { x: [0, tMax], y: [0, beamTop], yTicks: [0, beamTop], xTicks: time, series: beam, quiet: true },
          tip: x => { if (!beam.length) return null; const p = near(beam, x); return [clock(p[0]), [[`${p[1].toFixed(2)} mA`, '빔 전류']]]; } },
        { title: '넣은 양', unit: '%', value: s.used ? fmt(100 * s.counted / s.used.dose) : '0', label: '시간에 따른 넣은 이온의 양, 정한 주입량의 몇 %인지',
          plot: { x: [0, tMax], y: [0, 100], yTicks: [0, 50, 100], xTicks: time, series: share },
          tip: x => { if (!share.length) return null; const p = near(share, x); return [clock(p[0]), [[`${fmt(p[1])}%`, '정한 주입량 대비'], ...(s.used ? [[`${sci(s.used.dose * p[1] / 100)} /cm²`, '넣은 양']] : [])]]; } },
        { title: '웨이퍼 온도', unit: '°C', value: fmt(s.hot), label: '시간에 따른 웨이퍼 온도. 열처리 챔버에서만 오릅니다',
          plot: { x: [0, tMax], y: [0, 1200], yTicks: [0, 600, 1200], xTicks: time, series: hot, quiet: true },
          tip: x => { if (!hot.length) return null; const p = near(hot, x); return [clock(p[0]), [[`${fmt(p[1])} °C`, '웨이퍼 온도']]]; } },
        { title: '접합 깊이', unit: 'nm', value: o.reached ? fmt(o.junction) : '—', label: '깊이에 따른 인 농도 (세로는 로그 눈금). 선은 기판의 붕소 농도이고, 인 농도가 그 선과 만나는 깊이가 접합입니다',
          plot: { x: [0, xMax], y: [0, 7.3], yTicks: [1, 3, 5, 7], yFormat: power, xTicks: [[0, '표면'], [xMax, `${fmt(xMax)} nm`]], limit: level, limitLabel: '기판의 붕소', series: profile, mark: o.reached ? [o.junction, level] : false },
          tip: x => { const p = near(profile, x); return [`깊이 ${fmt(p[0])} nm`, [[`${sci(o.at(p[0]))} /cm³`, '인 농도']]]; } },
      ];
    },
    report(sim) {
      const s = sim.state, r = s.result; if (s.phase !== 'done' || !r) return null;
      const lo = J.target - 4 * J.tolerance, hi = J.target + 4 * J.tolerance, depthOk = r.reached && Math.abs(r.error) <= J.tolerance, surfaceOk = r.surfaceOk;
      const windows = sim.incoming.windows, blocked = sim.incoming.left > 0, placeOk = r.masked && windows && !blocked, log = n => Math.max(0, Math.log10(Math.max(1, n)) - 14), level = log(r.substrate);
      const xMax = Math.max(800, Math.ceil((r.reached ? r.junction : 0) * 1.25 / 200) * 200), main = r.ions && r.ions[0], notes = [];
      if (!r.masked) notes.push(sim.incoming.oxide > 0 ? '이온이 산화막을 뚫고 들어가 창 밖에도 접합이 생겼습니다. 에너지가 클수록 이온이 산화막도 깊이 파고듭니다.' : '산화막이 없어 웨이퍼 전면에 접합이 생겼습니다.');
      if (!r.reached) notes.push(windows ? '인 농도가 어느 깊이에서도 기판의 붕소 농도를 넘지 못해 접합이 생기지 않았습니다.' : '산화막에 창이 없어 이온이 실리콘에 닿지 않았습니다.');
      else if (!depthOk) notes.push(r.error < 0 ? `접합이 목표보다 ${fmt(-r.error)} nm 얕습니다. 열처리는 더 할 수 있고, 할 때마다 인이 더 깊이 퍼집니다.` : `접합이 목표보다 ${fmt(r.error)} nm 깊습니다. 퍼진 인은 되돌릴 수 없습니다. 에너지가 클수록 깊이 들어가고, 열처리가 뜨겁고 길수록 깊이 퍼집니다.`);
      if (r.reached && !surfaceOk) notes.push(`표면 농도가 모자랍니다. 주입량이 많을수록 농도가 높아집니다. ${annealLifts(sim) ? '이온이 표면보다 깊은 곳에 몰려 있어, 열처리를 더 하면 표면 쪽으로도 퍼져 표면 농도가 올라갑니다.' : '인은 이미 표면까지 퍼져 있어, 열처리를 더 하면 표면 농도는 더 낮아집니다.'}`);
      if (blocked) notes.push('창 바닥에 산화막이 남아 있어 이온이 실리콘에 덜 닿았습니다. 식각에서 창이 끝까지 뚫려야 합니다.');
      if (sim.partly) notes.push('식각에서 창이 덜 뚫린 곳에는 이온이 실리콘에 닿지 않았습니다. 여기서는 뚫린 창을 봅니다. 덜 뚫린 칩은 EDS에서 불량이 됩니다.');
      if (main && main.name !== 'P⁺') notes.push(`빔은 ${ionText(r.ions)}였습니다. 분석 자석이 P⁺의 봉우리에 맞춰져 있지 않으면 다른 이온이 들어갑니다.`);
      if (r.ok) notes.push('접합 깊이와 표면 농도가 목표 범위 안이고, 이온은 창 안에만 들어갔습니다. 웨이퍼가 나갈 때 창 안에 장벽막을 입힙니다(표준 조건).');
      return {
        id: reportId(r), title: '접합', sub: `${ionText(r.ions || [])} · ${fmt(r.keV)} keV · ${sci(r.dose)} /cm²`, pass: r.ok,
        criteria: [
          { label: '접합 깊이', value: r.reached ? `${fmt(r.junction)} nm` : '없음', ok: depthOk, fail: !r.reached ? '없음' : r.error < 0 ? '얕음' : '깊음', track: { value: r.reached ? r.junction : 0, lo, hi, band: [J.target - J.tolerance, J.target + J.tolerance] },
            scale: [fmt(lo), `목표 ${J.target} ± ${J.tolerance}`, fmt(hi)] },
          { label: '표면 농도', value: amount(r.surface), ok: surfaceOk, fail: '낮음', meter: { value: Math.max(0, Math.log10(Math.max(1, r.surface)) - 17), limit: Math.log10(C.spec.surface) - 17, top: 4 }, scale: [sci(1e17), `${sci(C.spec.surface)} 이상`, sci(1e21)] },
          { label: '들어간 곳', value: !r.masked ? '창 밖에도' : !windows ? '창이 없음' : blocked ? '창 바닥에 산화막' : '창 안에만', ok: placeOk, fail: '벗어남' },
        ],
        figures: [{ caption: '깊이에 따른 인 농도 (/cm³, 세로는 로그 눈금). 선은 기판의 붕소 농도이고, 점이 접합입니다',
          plot: { x: [0, xMax], y: [0, 7.3], yTicks: [1, 3, 5, 7], yFormat: power, xTicks: [[0, '표면'], [xMax, `${fmt(xMax)} nm`]], limit: level, limitLabel: '기판의 붕소',
            series: Array.from({ length: 81 }, (_, i) => [xMax * i / 80, log(r.at(xMax * i / 80))]), mark: r.reached ? [r.junction, level] : false } }],
        notes,
        stats: [['이온', ionText(r.ions || [])], ['에너지', `${fmt(r.keV)} keV`], ['주입량', `${sci(r.dose)} /cm²`], ['열처리', r.anneals.map(a => `${fmt(a.celsius)} °C ${fmt(a.minutes)}분`).join(' + ') || '없음'], ['산화막 아래의 농도', r.under >= 1e12 ? `${sci(r.under)} /cm³` : '거의 없음']],
      };
    },
    result(sim) {
      const s = sim.state, r = s.result; if (s.phase !== 'done' || !r) return null;
      return { ...handed(r), how: `${ionText(r.ions || [])} ${fmt(r.keV)} keV, ${sci(r.dose)} /cm², ${r.anneals.map(a => `${fmt(a.celsius)} °C ${fmt(a.minutes)}분`).join(' + ')}` };
    },
  };
})();
