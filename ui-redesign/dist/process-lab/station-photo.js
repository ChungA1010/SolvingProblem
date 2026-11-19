/* Photo station of the process lab: what the page shows and says while the coat, expose and develop cell is operated.
 * Calculation: photo-model.js. Equipment: src/process-lab/track.js. The shape of a station is described in app.js. */
(function () {
  'use strict';
  const PH = window.ProcessLabPhoto, FILM = window.Lab3DProcess, C = PH.constants;
  const fmt = v => Math.round(v).toLocaleString('en-US'), signed = v => `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
  const PHASE = { bare: '도포 전', coating: '도포하고 굽는 중', coated: '도포 끝', exposing: '노광 중', exposed: '노광 끝', developing: '현상 중', developed: '현상 끝' };
  const BUSY = ['coating', 'exposing', 'developing'];
  const REFUSED = {
    coat: s => BUSY.includes(s.phase) ? '진행 중입니다.' : '감광막이 이미 있습니다. 다시 바르려면 재작업 단추로 벗겨 내세요.',
    expose: s => s.phase === 'bare' ? '먼저 감광막을 바르세요.' : BUSY.includes(s.phase) ? '진행 중입니다.' : '이미 노광했습니다. 현상하거나 재작업하세요.',
    develop: s => s.phase === 'developed' ? '이미 현상했습니다.' : BUSY.includes(s.phase) ? '진행 중입니다.' : '먼저 노광하세요.',
    strip: s => BUSY.includes(s.phase) ? '진행 중입니다.' : '벗겨 낼 감광막이 없습니다.',
  };
  /** The resist as the current dial settings would leave it, on this wafer: thickness and the developed image. */
  function outlook(sim) {
    const s = sim.state, nm = s.thickness > 0 && s.phase !== 'coating' ? s.thickness : PH.thickness(s.controls.spin), used = s.used || s.controls;
    return { nm, ...PH.develop({ thickness: nm, dose: used.dose, focus: used.focus - s.bestFocus }) };
  }
  const ready = (s, phases) => phases.includes(s.phase) ? '누를 수 있음' : '지금은 안 됨';

  (window.ProcessLabStations = window.ProcessLabStations || {}).photo = {
    equipment: 'photo',
    views: [['home', '전체'], ['coater', '코터'], ['stepper', '스테퍼'], ['panel', '조작반']],
    speeds: [[1, '1×'], [4, '4×'], [16, '16×']], defaultSpeed: 4,
    create(wafer, seed) { const sim = PH.create({ seed }); sim.oxide = wafer.oxide; return sim; },
    parts: {
      spin: { name: '회전수', role: '감광막을 펴 바를 때의 회전 속도입니다. 빨리 돌릴수록 막이 얇아집니다.', how: '좌우로 끌거나 휠을 굴립니다. 도포하기 전에 정합니다.', basis: '계산: 두께 ∝ 1/√회전수 (대표 곡선)',
        rows: s => [['설정', `${fmt(s.controls.spin)} rpm`], ['이 속도의 막 두께', `${fmt(PH.thickness(s.controls.spin))} nm`]], pill: s => `${fmt(s.controls.spin)} rpm` },
      dose: { name: '노광량', role: '감광막에 주는 빛의 양입니다. 많을수록 창이 넓게 열리고, 모자라면 열리지 않습니다.', how: '좌우로 끌거나 휠을 굴립니다. 노광하기 전에 정합니다.', basis: '계산: 문턱 모델 (노광량 눈금은 대표값)',
        rows: s => [['설정', `${fmt(s.controls.dose)} mJ/cm²`]], pill: s => `${fmt(s.controls.dose)} mJ/cm²` },
      focus: { name: '초점', role: '상이 맺히는 높이입니다. 웨이퍼마다 맞는 위치가 0에서 조금 벗어나 있습니다.', how: '좌우로 끌거나 휠을 굴립니다. 노광하기 전에 정합니다.', basis: '계산: 회절 결상 (Abbe)',
        rows: s => [['설정', `${signed(s.controls.focus)} µm`]], pill: s => `${signed(s.controls.focus)} µm` },
      coat: { name: '도포', role: '감광액을 떨어뜨려 돌려 펴고, 굽습니다.', how: '누릅니다.', rows: s => [['단추', ready(s, ['bare'])]] },
      expose: { name: '노광', role: '마스크의 무늬를 웨이퍼 위에 한 칸씩 옮겨 가며 찍습니다.', how: '누릅니다.', rows: s => [['단추', ready(s, ['coated'])]] },
      develop: { name: '현상', role: '빛을 받은 감광막을 녹여 냅니다. 끝나면 창 너비를 잽니다.', how: '누릅니다.', rows: s => [['단추', ready(s, ['exposed'])]] },
      strip: { name: '재작업', role: '감광막을 모두 벗겨 내고 처음부터 다시 합니다. 포토는 되돌릴 수 있는 공정입니다.', how: '누릅니다.', rows: s => [['단추', ready(s, ['coated', 'exposed', 'developed'])], ['재작업 횟수', `${s.reworks}회`]] },
      coater: { name: '스핀 코터', role: '웨이퍼를 돌려 감광액을 고르게 폅니다.', rows: s => [['회전', `${fmt(s.rpm)} rpm`]] },
      lens: { name: '투영 렌즈', role: '마스크의 무늬를 웨이퍼에 맺습니다. 파장이 짧고 NA가 클수록 가는 무늬를 옮깁니다.', basis: `λ/NA = ${fmt(C.wavelength / C.NA)} nm, λ/NA² = ${(C.wavelength / C.NA / C.NA / 1000).toFixed(1)} µm`,
        rows: () => [['파장', `${C.wavelength} nm (i-line)`], ['NA', C.NA.toFixed(2)]] },
      reticle: { name: '마스크', role: `웨이퍼에 옮길 무늬가 그려진 판입니다. 너비 ${fmt(C.mask.opening)} nm의 열린 선이 ${fmt(C.mask.pitch)} nm마다 있습니다.`, rows: () => [] },
      developer: { name: '현상기', role: '현상액을 올려 두었다가 씻어 냅니다.', rows: s => [['상태', s.phase === 'developing' ? '현상 중' : '대기']] },
      wafer: { name: '웨이퍼', role: '산화막 위에 감광막을 바르고 무늬를 옮깁니다.', rows: s => [['단계', PHASE[s.phase]], ['감광막', s.thickness > 0 ? `${fmt(s.thickness)} nm` : '없음']] },
      hmi: { name: '장비 화면', role: '감광막 두께와 설정을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 처리 중, 노랑은 대기입니다.', rows: s => [['상태', BUSY.includes(s.phase) ? '처리 중' : '대기']] },
    },
    control(sim, name, value) { return sim.setControl(name, value) ? null : REFUSED[name] ? REFUSED[name](sim.state) : null; },
    guide(sim, next) {
      const s = sim.state, r = s.result;
      if (s.phase === 'bare') return ['회전수를 정하고 도포 단추를 누르세요.', null, null, 'coat'];
      if (s.phase === 'coated') return ['노광량과 초점을 정하고 노광 단추를 누르세요. 그래프의 선이 기준선보다 높은 곳의 감광막이 열립니다.', null, null, 'expose'];
      if (s.phase === 'exposed') return ['현상 단추를 누르세요.', null, null, 'develop'];
      if (s.phase !== 'developed') return [`${PHASE[s.phase]}입니다.`, null, null, null];
      const text = r.washed ? '감광막이 모두 녹아 남지 않았습니다.' : !r.cleared ? '창이 열리지 않았습니다.' : `창 너비 ${fmt(r.opening)} nm. ${r.ok ? '목표 범위 안입니다' : r.error < 0 ? `목표보다 ${fmt(-r.error)} nm 좁습니다` : `목표보다 ${fmt(r.error)} nm 넓습니다`}.`;
      return [`${text}${r.ok ? '' : ' 재작업 단추로 벗기고 다시 할 수 있습니다.'}`, `다음: ${next}`, 'finish', r.ok ? null : 'strip'];
    },
    view(sim) {
      const s = sim.state, coatSeconds = s.progress * (C.times.coat + C.times.bake);
      return { phase: s.phase, progress: s.progress, rpm: s.rpm, fields: s.fields, shutter: s.shutter, controls: s.controls, result: s.result, filmColor: FILM.filmColor(sim.oxide),
        coverage: s.phase === 'bare' ? 0 : s.phase === 'coating' ? Math.min(1, coatSeconds / 6) : s.result && s.result.washed ? 0 : 1 };
    },
    live(sim, wafer) {
      const s = sim.state;
      if (s.phase === 'bare' || (s.result && s.result.washed)) return wafer;
      return { ...wafer, resist: { thickness: s.thickness, opening: s.result ? s.result.opening : 0 } };
    },
    /** The wafer as this cell would hand it on with the dials as they are now: lets the route show what follows from them. */
    forecast(sim, wafer) {
      const s = sim.state, o = s.result || outlook(sim), nm = s.result ? s.result.thickness : o.nm;
      return o.washed ? { ...wafer, resist: null } : { ...wafer, resist: { thickness: nm, opening: o.opening } };
    },
    monitor(sim) {
      const s = sim.state, r = s.result, o = outlook(sim), value = r ? r.opening : o.opening;
      return {
        picture: { section: this.live(sim, { substrate: {}, oxide: sim.oxide, resist: null, window: null, junction: null, liner: 0, metal: null }) },
        value, unit: 'nm',
        note: r ? (r.ok ? '목표 범위 안 · 계측값' : `목표와 <b>${fmt(Math.abs(r.error))} nm</b> 차이 · 계측값`) : o.washed ? '감광막이 남지 않음 · 계산값' : !o.cleared ? '창이 안 열림 · 계산값' : '열릴 창 너비 · 계산값',
        meter: { value, target: C.target, tolerance: C.tolerance, scale: C.target * 1.6 },
        trend: { label: '창을 가로지른 노광량. 기준선은 감광막이 뚫리는 양', points: o.profile, x: p => p.x + C.mask.pitch / 2, y: p => p.exposure, xMax: C.mask.pitch, yMax: Math.max(2, o.peak * 1.12), level: 1, noDot: true,
          xStart: `−${(C.mask.pitch / 2000).toFixed(1)} µm`, xLabel: `+${(C.mask.pitch / 2000).toFixed(1)} µm`, tip: p => [`뚫리는 양의 ${p.exposure.toFixed(2)}배`, ` · 창 가운데에서 ${fmt(p.x)} nm`] },
        now: `막 <b>${fmt(o.nm)} nm</b> · <b>${fmt((s.used || s.controls).dose)}</b> mJ/cm² · 초점 <b>${signed((s.used || s.controls).focus)}</b>`,
        spec: [`창 너비 ${fmt(C.target)} ± ${fmt(C.tolerance)} nm`],
      };
    },
    screen(sim) {
      const s = sim.state, done = phase => ['coated', 'exposing', 'exposed', 'developing', 'developed'].indexOf(s.phase) >= ['coated', 'exposing', 'exposed', 'developing', 'developed'].indexOf(phase);
      return {
        name: 'PH-01', title: 'LITHOGRAPHY', running: BUSY.includes(s.phase),
        state: { bare: 'READY', coating: 'COAT · BAKE', coated: 'COATED', exposing: 'EXPOSE', exposed: 'EXPOSED', developing: 'DEVELOP', developed: 'DONE' }[s.phase],
        big: ['RESIST', s.thickness > 0 ? fmt(s.thickness) : '—', 'nm'],
        cells: [['SPIN', fmt(s.controls.spin)], ['DOSE', fmt(s.controls.dose)], ['FOCUS', signed(s.controls.focus)]],
        chips: [['COAT', done('coated')], ['EXPOSE', done('exposed')], ['DEV', s.phase === 'developed']], bar: ['FIELDS', s.fields / C.times.fields],
      };
    },
    result(sim) {
      const s = sim.state, r = s.result; if (s.phase !== 'developed' || !r) return null;
      return { thickness: r.thickness, opening: r.opening, how: `${fmt(r.spin)} rpm, ${fmt(r.dose)} mJ/cm², 초점 ${signed(r.focus)} µm${s.reworks ? `, 재작업 ${s.reworks}회` : ''}` };
    },
  };
})();
