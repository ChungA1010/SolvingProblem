/* Fictional teaching game. No fitted wear model, real metrology or money. */
(function(root,factory){const api=factory(typeof module==='object'?require('./engine.js'):root.CMPDemo,typeof module==='object'?require('./factory-upgrades.js'):root.CMPUpgrades);if(typeof module==='object')module.exports=api;else root.CMPFactory=api;})(globalThis,function(engine,upgrades){
  'use strict';
  const version='factory-v2',legacyVersion='factory-v1';
  const upgradedVersion='factory-v3',equipmentVersion='factory-v4',balancedVersion='factory-v5',economyVersion='factory-v6',fundedVersion='factory-v7';
  const orders=Object.freeze([
    {title:'첫 납품',client:'NOVA · 센서 연구팀',target:150,tolerance:8,wear:40,pad:25,lesson:'첫 측정으로 예상과 실제의 차이를 확인해보세요.'},
    {title:'정비의 타이밍',client:'ORBIT · 소자 개발팀',target:135,tolerance:6,wear:70,pad:35,lesson:'컨디셔너를 교체하면 제거율도 달라집니다. 이전 측정값을 그대로 믿어도 될까요?'},
    {title:'다시 켠 장비',client:'LUMEN · 광학 연구팀',target:165,tolerance:5,wear:45,pad:45,lesson:'정지 후 첫 웨이퍼에는 가상의 재시작 효과가 있습니다. 첫 측정을 다음 장에 그대로 적용할지 판단하세요.'},
    {title:'좁아지는 공차',client:'MOSAIC · 패키징 팀',target:145,tolerance:4,wear:60,pad:55,lesson:'측정비를 아끼는 것과 불량을 줄이는 것 사이에서 균형을 찾아보세요.'},
    {title:'마지막 정밀 주문',client:'APEX · 공정 연구팀',target:155,tolerance:3,wear:55,pad:60,lesson:'사용량 변화와 측정 최신성을 함께 보고 여섯 장을 납품하세요.'},
    {guest:true,title:'여섯 장의 간격',client:'이재용 · 가상 특별 손님',target:150,tolerance:5,wear:28,pad:20,lesson:'여섯 장 중 가장 많이 깎인 장과 가장 적게 깎인 장을 비교해요.'},
    {guest:true,title:'시연 전 마지막 로트',client:'젠슨 황 · 가상 특별 손님',target:140,tolerance:6,wear:42,pad:22,lesson:'규격을 맞추면서 여섯 장의 실제 연마 시간을 합계 720초 안으로 맞춰요.'}
  ].map(o=>Object.freeze({...o,count:6,measureCost:5,serviceCost:30,goodPay:100,underPay:40})));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  function create(index=0,equipment={}){assert(Number.isInteger(index)&&index>=0&&index<orders.length,'지원하지 않는 주문입니다.');return {version:economyVersion,equipment:upgrades.levels(equipment),order:index,phase:'setup',wallet:100,spent:0,wear:orders[index].wear,pad:orders[index].pad,estimateScale:1,lastMeasured:null,servicedSinceMeasure:false,inspected:0,rows:[],events:[]};}
  function createFunded(index=0,equipment={},initialWallet=100){
    assert(Number.isSafeInteger(initialWallet)&&initialWallet>=0&&initialWallet<=1000000000,'시작 운영 자금을 확인해주세요.');
    return {...create(index,equipment),version:fundedVersion,initialWallet,wallet:initialWallet};
  }
  // A quoted teaching-game resource charge; not a physical CMP operating cost.
  // It uses requested settings only, never a hidden removal result or sensor reading.
  function processingQuote(state,input=settings(),duration=120){
    nominal(input);
    assert(Number.isInteger(duration)&&duration>=30&&duration<=240,'연마 시간은 30–240초의 정수로 입력하세요.');
    if(state.version!==fundedVersion)return {total:prices(state).run,base:prices(state).run,time:0,pressure:0,rotation:0,slurry:0};
    const recipe=engine.recipes.A456;
    const pressureRatio=Math.max(0,Math.min(1,(input.pressure-recipe.min)/(recipe.max-recipe.min)));
    const parts={base:5,time:Math.ceil(duration/60),pressure:Math.ceil(1.5*pressureRatio),
      rotation:Math.ceil(((input.wafer_rotation_pct/100)**2+(input.stage_rotation_pct/100)**2)/2),
      slurry:Math.ceil((input.slurry_c_pct/100)**2)};
    return {total:Object.values(parts).reduce((sum,cost)=>sum+cost,0),...parts};
  }
  function equipment(state){return [upgradedVersion,equipmentVersion,balancedVersion,economyVersion,fundedVersion].includes(state.version)?upgrades.levels(state.equipment):upgrades.levels();}
  function usesCalibration(state) {
    return [balancedVersion,economyVersion,fundedVersion].includes(state.version);
  }
  function prices(state) {
    const current = [economyVersion,fundedVersion].includes(state.version);
    return { run: state.version===fundedVersion?8:current?10:0, good: orders[state.order].goodPay, under: current ? 0 : orders[state.order].underPay };
  }
  function availableForActions(state) {
    const unfinished = orders[state.order].count - state.rows.length;
    return state.wallet - unfinished * prices(state).run;
  }
  const sameConditions=(a,b)=>['pressure','wafer_rotation_pct','stage_rotation_pct','slurry_c_pct'].every(k=>a[k]===b[k]);
  // Calibration is a visible teaching-game contract, not a model of a commercial sensor.
  // Reconstruct it from paid measurements; no extra hidden save-state or reroll.
  function endpointStatus(state,input=settings()){
    const tier=equipment(state).endpoint,limit=tier===2?3:2;
    const result=(ready,reason,remaining=0)=>({ready,reason,remaining,limit,tier});
    if(!tier)return result(false,'미장착');
    if(!usesCalibration(state))return result(true,'이전 도전 규칙',null);
    if(!state.lastMeasured)return result(false,'첫 측정 필요');
    const row=state.rows[state.lastMeasured-1],age=state.rows.length-state.lastMeasured;
    if(state.servicedSinceMeasure)return result(false,'정비 후 재측정 필요');
    if(row.restart)return result(false,'재시작 이후 정상 장 재측정 필요');
    if(!sameConditions(row.input,input))return result(false,'조건 변경 · 재측정 필요');
    if(age>=limit)return result(false,'보정 만료 · 재측정 필요');
    return result(true,`W${row.number} 보정 · ${limit-age}장 남음`,limit-age);
  }
  function actions(state){const used=state.events.filter(e=>['measure','service'].includes(e.type)).length,limit=state.version===legacyVersion?null:2;return {used,limit,remaining:limit===null?null:Math.max(0,limit-used)};}
  function requireAction(state){assert(actions(state).remaining!==0,'추가 행동 2회를 모두 사용했습니다. 가공과 최종 검사는 계속할 수 있습니다.');}
  function settings(values={}){return {...engine.educationalDefaults(),...values};}
  function nominal(input){assert(input.recipe==='A456'&&input.scenario==='continuous'&&input.mrr===74.1&&input.model===engine.educationalModel,'게임은 고정된 A456 교육용 기준을 사용합니다.');return engine.calculate(input).mrr;}
  function rated(state,input){return nominal(input)*upgrades.effects(equipment(state)).rateScale;}
  function estimate(state,input){return rated(state,input)*state.estimateScale;}
  function elapsed(row){return row.actualDuration??row.duration;}
  function recommendation(state,input){return Math.max(30,Math.min(240,Math.round(orders[state.order].target/estimate(state,input)*60)));}
  function quality(value,order){return value<order.target*(1-order.tolerance/100)?'under':value>order.target*(1+order.tolerance/100)?'over':'good';}
  // Inspections count pieces in the output cassette, not wafer serial numbers.
  function lotRows(state) {
    return state.rows.filter(row => !row.discarded);
  }
  function storedRows(state) {
    return state.rows.filter(row => Number.isInteger(row.slot) && !row.discarded && row.number !== state.recalled);
  }
  function freeSlot(state) {
    const occupied = new Set(storedRows(state).map(row => row.slot));
    return Array.from({length:orders[state.order].count}, (_,i)=>i).find(i=>!occupied.has(i));
  }
  function inspectionDone(state) {
    return ['inspection', 'settled'].includes(state.phase) && state.inspected === lotRows(state).length;
  }
  function summary(state) {
    const price = prices(state);
    const lot = lotRows(state);
    const good = lot.filter(row => row.quality === 'good').length;
    const under = lot.filter(row => row.quality === 'under').length;
    const processingCost = state.version===fundedVersion?state.rows.reduce((sum,row)=>sum+row.processingFee,0):price.run * state.rows.length;
    return {
      good, total: lot.length, stars: good >= 5 ? 3 : good >= 4 ? 2 : good >= 3 ? 1 : 0,
      revenue: good * price.good + under * price.under,
      processingCost, actionCost: state.spent, spent: processingCost + state.spent,
      errors: lot.map(row => row.error)
    };
  }
  function transition(previous,event){
    const s=clone(previous),o=orders[s.order];
    assert(event&&typeof event.type==='string','진행 명령을 확인해주세요.');
    if(s.recalled)assert(['rackReturn','rackDiscard'].includes(event.type),'측정기 위의 웨이퍼를 먼저 옮겨주세요.');
    const fromRack = event.wafer !== undefined;
    const selected = fromRack && s.rows.find(row=>row.number===event.wafer && Number.isInteger(row.slot) && !row.discarded);
    if(fromRack){
      assert(['measure','rackReview','rackReturn','rackDiscard'].includes(event.type),'보관함 이송 명령을 확인해주세요.');
      assert(['setup','result'].includes(s.phase) && selected,'이 층에 보관된 웨이퍼가 없습니다.');
      if(s.recalled)assert(s.recalled===event.wafer,'측정기에 있는 웨이퍼를 확인해주세요.');
    }
    if(event.type==='run'){
      assert(s.phase==='setup'&&s.rows.length<o.count,'현재 웨이퍼의 결과를 확인해주세요.');
      const input=settings(event.input),base=rated(s,input),duration=event.duration;
      assert(Number.isInteger(duration)&&duration>=30&&duration<=240,'연마 시간은 30–240초의 정수로 입력하세요.');
      assert(event.endpointEnabled===undefined||typeof event.endpointEnabled==='boolean','종점 감지 설정을 확인해주세요.');
      // Fixed per-wafer perturbation: refresh/replay never rerolls a result.
      const effect=upgrades.effects(equipment(s));
      const n=s.rows.length,noise=1+Math.sin((s.order+1)*13+(n+1)*7)*.012*effect.noiseScale;
      const restart=s.order===2&&n===0?.88:1;
      const rate=base*(1-.16*s.wear/100)*(1-.08*s.pad/100)*restart*noise;
      // A synthetic in-situ sensor, distinct from the final thickness measurement.
      // Deterministic error prevents reload/replay from rerolling a stop point.
      const calibration=endpointStatus(s,input),endpointRequested=equipment(s).endpoint>0&&event.endpointEnabled!==false;
      const endpointEnabled=endpointRequested&&calibration.ready;
      const drift=usesCalibration(s)&&calibration.ready?(n-s.lastMeasured)*(equipment(s).endpoint===2?.005:.012):0;
      const sensorBias=Math.sin((s.order+1)*19+(n+1)*11)*effect.sensorError+drift;
      const stopSeconds=o.target/(rate*(1+sensorBias))*60;
      const actualDuration=endpointEnabled?Math.min(duration,Math.ceil(stopSeconds*10)/10):duration;
      const removed=rate*actualDuration/60;
      const processingFee = processingQuote(s,input,duration).total;
      assert(s.wallet >= processingFee, '가공할 운영 자금이 부족합니다.');
      s.wallet -= processingFee;
      s.rows.push({number:n+1,input,duration,...(s.version===fundedVersion?{processingFee}:{}),...([equipmentVersion,balancedVersion,economyVersion,fundedVersion].includes(s.version)?{actualDuration,endpointEnabled,endpointStopped:endpointEnabled&&actualDuration<duration}:{}),...(usesCalibration(s)?{endpointRequested,endpointReason:calibration.reason,calibrationRemaining:calibration.remaining}:{}),rate,removed,error:(removed/o.target-1)*100,quality:quality(removed,o),measured:false,wear:s.wear,pad:s.pad,restart:restart!==1});
      const services=s.events.filter(e=>e.type==='service').length;
      if(services)s.rows.at(-1).servicesAtRun=services;
      s.wear=Math.min(100,s.wear+effect.wearStep);s.pad=Math.min(100,s.pad+1.5);s.phase='result';
    }else if(event.type==='measure'){
      const row=fromRack?selected:s.rows.at(-1);assert((fromRack||s.phase==='result')&&row&&!row.measured,'이미 측정했거나 측정할 웨이퍼가 없습니다.');
      requireAction(s);
      assert(availableForActions(s)>=o.measureCost,'남은 가공비를 제외하면 측정 비용이 부족합니다.');
      if(fromRack){
        assert(s.phase!=='result'||!s.rows.at(-1).measured,'측정기가 사용 중입니다.');
        s.recalled=row.number;
      }
      row.measured=true;
      s.wallet-=o.measureCost;
      s.spent+=o.measureCost;
      // A sample made before maintenance cannot calibrate the serviced tool.
      const servicesAtRun=s.events.filter(e=>e.type==='service').length;
      if(!fromRack || (row.number>=(s.lastMeasured||0) && servicesAtRun===(row.servicesAtRun||0))){
        s.estimateScale=row.rate/rated(s,row.input);
        s.lastMeasured=row.number;
        s.servicedSinceMeasure=false;
      }
    }else if(event.type==='rackReview'){
      assert(selected && selected.measured && (s.phase!=='result'||!s.rows.at(-1).measured),'측정기를 사용할 수 없습니다.');
      s.recalled=selected.number;
    }else if(event.type==='rackReturn'){
      assert(selected && selected.number===s.recalled,'측정기의 웨이퍼를 확인해주세요.');
      delete s.recalled;
      // Reopening an existing reading is free and may be repeated indefinitely.
      if(s.events.at(-1)?.type==='rackReview'){s.events.pop();return s;}
    }else if(event.type==='rackDiscard'){
      assert(selected,'폐기할 웨이퍼를 확인해주세요.');
      selected.discarded=true;
      delete s.recalled;
    }else if(event.type==='advance'||event.type==='discard'){
      assert(s.phase==='result','가공한 웨이퍼의 결과가 없습니다.');
      if(event.type==='discard')s.rows.at(-1).discarded=true;
      if(event.type==='advance')s.rows.at(-1).slot=freeSlot(s);
      s.phase=s.rows.length===o.count&&event.keepOpen!==true?'inspection':'setup';if(s.phase==='inspection'&&s.version===legacyVersion)s.inspected=lotRows(s).length;
    }else if(event.type==='finishLot'){
      assert(s.phase==='setup' && (s.rows.length>0||s.version===fundedVersion),'웨이퍼를 먼저 보관하거나 폐기하세요.');
      s.phase='inspection';
      if(s.version===legacyVersion)s.inspected=lotRows(s).length;
    }else if(event.type==='service'){
      assert(s.phase==='setup'&&s.order>=1,'컨디셔너 교체는 두 번째 주문부터, 가공 전에 가능합니다.');
      requireAction(s);
      assert(availableForActions(s)>=o.serviceCost,'남은 가공비를 제외하면 정비 비용이 부족합니다.');assert(s.wear>0,'새 컨디셔너입니다.');
      s.wallet-=o.serviceCost;s.spent+=o.serviceCost;s.wear=0;s.servicedSinceMeasure=true;
    }else if(event.type==='inspect'){
      assert(s.phase==='inspection'&&s.inspected<lotRows(s).length,'검사를 시작할 수 없거나 이미 완료했습니다.');
      assert(Number.isInteger(event.count)&&event.count>=1&&event.count<=lotRows(s).length-s.inspected,'검사할 장수를 확인해주세요.');s.inspected+=event.count;
    }else if(event.type==='ship'){
      assert(s.phase==='inspection'&&inspectionDone(s),'보관한 웨이퍼의 검사를 먼저 완료하세요.');s.wallet+=summary(s).revenue;s.phase='settled';
    }else throw new Error('지원하지 않는 진행 명령입니다.');
    s.events.push(clone(event));return s;
  }
  function restore(serialized){
    try{const value=typeof serialized==='string'?JSON.parse(serialized):serialized;assert([version,legacyVersion,upgradedVersion,equipmentVersion,balancedVersion,economyVersion,fundedVersion].includes(value?.version)&&Array.isArray(value.events)&&value.events.length<=60,'저장 형식 오류');assert(value.version!==fundedVersion||(Number.isSafeInteger(value.initialWallet)&&value.initialWallet>=0),'시작 자금 기록 누락');const enhanced=[upgradedVersion,equipmentVersion,balancedVersion,economyVersion,fundedVersion].includes(value.version);if(enhanced)assert(value.equipment&&Object.hasOwn(value.equipment,'environment')&&Object.hasOwn(value.equipment,'care'),'장비 기록 누락');if([equipmentVersion,balancedVersion,economyVersion,fundedVersion].includes(value.version))assert(['pad','endpoint'].every(k=>Object.hasOwn(value.equipment,k)),'새 장비 기록 누락');if(value.version===upgradedVersion)assert(!value.equipment.pad&&!value.equipment.endpoint,'이전 기록의 장비가 변경됐습니다.');let s=value.version===fundedVersion?createFunded(value.order,value.equipment,value.initialWallet):create(value.order,enhanced?value.equipment:{});s.version=value.version;if(!enhanced)delete s.equipment;for(const event of value.events)s=transition(s,event);return s;}catch{return null;}
  }
  function serialize(state){return JSON.stringify({version:state.version,...(state.version===fundedVersion?{initialWallet:state.initialWallet}:{}),...([upgradedVersion,equipmentVersion,balancedVersion,economyVersion,fundedVersion].includes(state.version)?{equipment:equipment(state)}:{}),order:state.order,events:state.events});}
  function visibleRows(state){
    const inspected=new Set(lotRows(state).slice(0,state.inspected).map(row=>row.number));
    return state.rows.map(r=>r.measured||inspected.has(r.number)?clone(r):{number:r.number,...(r.discarded?{discarded:true}:{}),input:clone(r.input),duration:r.duration,...(r.processingFee!==undefined?{processingFee:r.processingFee}:{}),...(r.actualDuration!==undefined?{actualDuration:r.actualDuration,endpointEnabled:r.endpointEnabled,endpointStopped:r.endpointStopped}:{}),measured:false,wear:r.wear,pad:r.pad,restart:r.restart,rate:null,removed:null,error:null,quality:null});}
  function clues(state){
    const o=orders[state.order],next=state.rows.length+1,result=[];
    if(state.order===2&&next===1)result.push({kind:'warning',title:'정지 후 첫 가공',detail:'이번 장에는 제거율이 낮아지는 재시작 효과가 적용됩니다. 다음 장에는 이 효과가 사라집니다.'});
    if(state.order===2&&next===2)result.push({kind:'warning',title:'재시작 영향 해제',detail:'첫 장의 일시적인 저하가 사라집니다. 첫 측정값으로 시간을 늘렸다면 과다 연마 가능성을 다시 생각하세요.'});
    if(state.servicedSinceMeasure)result.push({kind:'changed',title:'컨디셔너 교체 후',detail:'사용량이 초기화됐습니다. 교체 전보다 제거율이 높아질 수 있어 이전 측정값의 적용에 주의하세요.'});
    const effect=upgrades.effects(equipment(state));
    result.push({kind:state.wear>=70?'warning':'normal',title:state.wear>=70?'컨디셔너 사용량 높음':'컨디셔너 점진적 마모',detail:`사용량 ${state.wear.toFixed(0)}% · 한 장마다 ${effect.wearStep}%p 증가합니다. 이 게임에서는 마모가 쌓일수록 제거율이 낮아집니다.`});
    if([upgradedVersion,equipmentVersion,balancedVersion,economyVersion,fundedVersion].includes(state.version))result.push({kind:'normal',title:'이번 주문에 적용된 장비',detail:`패드 ${equipment(state).pad} · 컨디셔너 ${equipment(state).care} · 종점 ${equipment(state).endpoint}단계. 가공률 ×${effect.rateScale.toFixed(2)}, 외부 변동 ±${(1.2*effect.noiseScale).toFixed(2)}%. 교육용 수치이며 실제 장비 성능이 아닙니다.`});
    result.push({kind:state.pad>=55?'warning':'normal',title:state.pad>=55?'패드 사용량도 확인하세요':'패드 상태',detail:`사용량 ${state.pad.toFixed(1)}% · 컨디셔너를 교체해도 패드 사용량은 그대로 남습니다.`});
    if(state.lastMeasured&&state.rows.length>state.lastMeasured)result.push({kind:'changed',title:'측정 이후 상태 변화',detail:`마지막 측정 후 ${state.rows.length-state.lastMeasured}장을 더 가공했습니다. 이전 측정값은 현재 제거율을 보장하지 않습니다.`});
    return result;
  }
  function comparison(current,previous){
    if(!previous||current.order!==previous.order||current.version!==previous.version||!upgrades.same(equipment(current),equipment(previous))||!inspectionDone(current)||!current.inspected||!previous.inspected||previous.phase!=='settled')return null;
    const metrics=s=>{const v=summary(s);return {good:v.good,mae:v.errors.reduce((a,b)=>a+Math.abs(b),0)/v.total,profit:v.revenue-v.spent,actions:actions(s).used,measures:s.events.filter(e=>e.type==='measure').length,services:s.events.filter(e=>e.type==='service').length};};
    const before=metrics(previous),after=metrics(current);return {before,after,delta:Object.fromEntries(Object.keys(after).map(k=>[k,after[k]-before[k]]))};
  }
  function restoreArchive(entries){if(!Array.isArray(entries))return [];const seen=new Set();return entries.filter(e=>{if(!e||typeof e.id!=='string'||!/^[\w-]{1,100}$/.test(e.id)||seen.has(e.id)||!Number.isFinite(Date.parse(e.at)))return false;const s=restore(e.session);if(s?.phase!=='settled')return false;seen.add(e.id);return true;}).slice(-30).map(e=>({id:e.id,at:e.at,session:JSON.parse(serialize(restore(e.session)))}));}
  function archiveSettlement(entries,id,at,state){assert(state.phase==='settled','납품 완료 기록만 보관할 수 있습니다.');const archive=restoreArchive(entries);if(archive.some(e=>e.id===id))return archive;return restoreArchive([...archive,{id,at,session:JSON.parse(serialize(state))}]);}
  function previousAttempt(entries,state,id){const entry=restoreArchive(entries).filter(e=>e.id!==id&&e.session.order===state.order&&e.session.version===state.version&&upgrades.same(equipment(state),equipment(restore(e.session)))).at(-1);return entry?restore(entry.session):null;}
  return Object.freeze({version,legacyVersion,upgradedVersion,equipmentVersion,balancedVersion,economyVersion,fundedVersion,usesCalibration,prices,processingQuote,availableForActions,equipment,endpointStatus,sameConditions,orders,create,createFunded,settings,estimate,recommendation,elapsed,quality,summary,lotRows,storedRows,freeSlot,inspectionDone,transition,restore,serialize,visibleRows,actions,clues,comparison,restoreArchive,archiveSettlement,previousAttempt});
});
