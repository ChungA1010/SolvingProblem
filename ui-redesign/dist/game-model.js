/* Fictional teaching game. No fitted wear model, real metrology or money. */
(function(root,factory){const api=factory(typeof module==='object'?require('./engine.js'):root.CMPDemo);if(typeof module==='object')module.exports=api;else root.CMPFactory=api;})(globalThis,function(engine){
  'use strict';
  const version='factory-v2',legacyVersion='factory-v1';
  const orders=Object.freeze([
    {title:'첫 납품',client:'NOVA · 센서 연구팀',target:150,tolerance:8,wear:40,pad:25,lesson:'첫 측정으로 예상과 실제의 차이를 확인해보세요.'},
    {title:'정비의 타이밍',client:'ORBIT · 소자 개발팀',target:135,tolerance:6,wear:70,pad:35,lesson:'컨디셔너를 교체하면 제거율도 달라집니다. 이전 측정값을 그대로 믿어도 될까요?'},
    {title:'다시 켠 장비',client:'LUMEN · 광학 연구팀',target:165,tolerance:5,wear:45,pad:45,lesson:'정지 후 첫 웨이퍼에는 가상의 재시작 효과가 있습니다. 첫 측정을 다음 장에 그대로 적용할지 판단하세요.'},
    {title:'좁아지는 공차',client:'MOSAIC · 패키징 팀',target:145,tolerance:4,wear:60,pad:55,lesson:'측정비를 아끼는 것과 불량을 줄이는 것 사이에서 균형을 찾아보세요.'},
    {title:'마지막 정밀 주문',client:'APEX · 공정 연구팀',target:155,tolerance:3,wear:55,pad:60,lesson:'사용량 변화와 측정 최신성을 함께 보고 여섯 장을 납품하세요.'}
  ].map(o=>Object.freeze({...o,count:6,measureCost:5,serviceCost:30,goodPay:100,underPay:40})));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  function create(index=0){assert(Number.isInteger(index)&&index>=0&&index<orders.length,'지원하지 않는 주문입니다.');return {version,order:index,phase:'setup',wallet:100,spent:0,wear:orders[index].wear,pad:orders[index].pad,estimateScale:1,lastMeasured:null,servicedSinceMeasure:false,inspected:0,rows:[],events:[]};}
  function actions(state){const used=state.events.filter(e=>['measure','service'].includes(e.type)).length,limit=state.version===legacyVersion?null:2;return {used,limit,remaining:limit===null?null:Math.max(0,limit-used)};}
  function requireAction(state){assert(actions(state).remaining!==0,'추가 행동 2회를 모두 사용했습니다. 가공과 최종 검사는 계속할 수 있습니다.');}
  function settings(values={}){return {...engine.educationalDefaults(),...values};}
  function nominal(input){assert(input.recipe==='A456'&&input.scenario==='continuous'&&input.mrr===74.1&&input.model===engine.educationalModel,'게임은 고정된 A456 교육용 기준을 사용합니다.');return engine.calculate(input).mrr;}
  function estimate(state,input){return nominal(input)*state.estimateScale;}
  function recommendation(state,input){return Math.max(30,Math.min(240,Math.round(orders[state.order].target/estimate(state,input)*60)));}
  function quality(value,order){return value<order.target*(1-order.tolerance/100)?'under':value>order.target*(1+order.tolerance/100)?'over':'good';}
  function summary(state){const o=orders[state.order],good=state.rows.filter(r=>r.quality==='good').length;return {good,total:state.rows.length,stars:good>=5?3:good>=4?2:good>=3?1:0,revenue:state.rows.reduce((n,r)=>n+(r.quality==='good'?o.goodPay:r.quality==='under'?o.underPay:0),0),spent:state.spent,errors:state.rows.map(r=>r.error)};}
  function transition(previous,event){
    const s=clone(previous),o=orders[s.order];
    assert(event&&typeof event.type==='string','진행 명령을 확인해주세요.');
    if(event.type==='run'){
      assert(s.phase==='setup'&&s.rows.length<o.count,'현재 웨이퍼의 결과를 확인해주세요.');
      const input=settings(event.input),base=nominal(input),duration=event.duration;
      assert(Number.isInteger(duration)&&duration>=30&&duration<=240,'연마 시간은 30–240초의 정수로 입력하세요.');
      // Fixed per-wafer perturbation: refresh/replay never rerolls a result.
      const n=s.rows.length,noise=1+Math.sin((s.order+1)*13+(n+1)*7)*.012;
      const restart=s.order===2&&n===0?.88:1;
      const rate=base*(1-.16*s.wear/100)*(1-.08*s.pad/100)*restart*noise;
      const removed=rate*duration/60;
      s.rows.push({number:n+1,input,duration,rate,removed,error:(removed/o.target-1)*100,quality:quality(removed,o),measured:false,wear:s.wear,pad:s.pad,restart:restart!==1});
      s.wear=Math.min(100,s.wear+4);s.pad=Math.min(100,s.pad+1.5);s.phase='result';
    }else if(event.type==='measure'){
      const row=s.rows.at(-1);assert(s.phase==='result'&&row&&!row.measured,'이미 측정했거나 측정할 웨이퍼가 없습니다.');
      requireAction(s);
      assert(s.wallet>=o.measureCost,'측정할 운영 자금이 부족합니다.');
      row.measured=true;s.wallet-=o.measureCost;s.spent+=o.measureCost;s.estimateScale=row.rate/nominal(row.input);s.lastMeasured=row.number;s.servicedSinceMeasure=false;
    }else if(event.type==='advance'){
      assert(s.phase==='result','가공한 웨이퍼의 결과가 없습니다.');s.phase=s.rows.length===o.count?'inspection':'setup';if(s.phase==='inspection'&&s.version===legacyVersion)s.inspected=o.count;
    }else if(event.type==='service'){
      assert(s.phase==='setup'&&s.order>=1,'컨디셔너 교체는 두 번째 주문부터, 가공 전에 가능합니다.');
      requireAction(s);
      assert(s.wallet>=o.serviceCost,'교체할 운영 자금이 부족합니다.');assert(s.wear>0,'새 컨디셔너입니다.');
      s.wallet-=o.serviceCost;s.spent+=o.serviceCost;s.wear=0;s.servicedSinceMeasure=true;
    }else if(event.type==='inspect'){
      assert(s.phase==='inspection'&&s.inspected<o.count,'검사를 시작할 수 없거나 이미 완료했습니다.');
      assert(Number.isInteger(event.count)&&event.count>=1&&event.count<=o.count-s.inspected,'검사할 장수를 확인해주세요.');s.inspected+=event.count;
    }else if(event.type==='ship'){
      assert(s.phase==='inspection'&&s.rows.length===o.count&&s.inspected===o.count,'여섯 장의 가공과 검사를 먼저 완료하세요.');s.wallet+=summary(s).revenue;s.phase='settled';
    }else throw new Error('지원하지 않는 진행 명령입니다.');
    s.events.push(clone(event));return s;
  }
  function restore(serialized){
    try{const value=typeof serialized==='string'?JSON.parse(serialized):serialized;assert([version,legacyVersion].includes(value?.version)&&Array.isArray(value.events)&&value.events.length<=60,'저장 형식 오류');let s=create(value.order);s.version=value.version;for(const event of value.events)s=transition(s,event);return s;}catch{return null;}
  }
  function serialize(state){return JSON.stringify({version:state.version,order:state.order,events:state.events});}
  function visibleRows(state){return state.rows.map(r=>r.measured||r.number<=state.inspected||state.phase==='settled'?clone(r):{number:r.number,input:clone(r.input),duration:r.duration,measured:false,wear:r.wear,pad:r.pad,restart:r.restart,rate:null,removed:null,error:null,quality:null});}
  function clues(state){
    const o=orders[state.order],next=state.rows.length+1,result=[];
    if(state.order===2&&next===1)result.push({kind:'warning',title:'정지 후 첫 가공',detail:'이번 장에는 제거율이 낮아지는 재시작 효과가 적용됩니다. 다음 장에는 이 효과가 사라집니다.'});
    if(state.order===2&&next===2)result.push({kind:'warning',title:'재시작 영향 해제',detail:'첫 장의 일시적인 저하가 사라집니다. 첫 측정값으로 시간을 늘렸다면 과다 연마 가능성을 다시 생각하세요.'});
    if(state.servicedSinceMeasure)result.push({kind:'changed',title:'컨디셔너 교체 후',detail:'사용량이 초기화됐습니다. 교체 전보다 제거율이 높아질 수 있어 이전 측정값의 적용에 주의하세요.'});
    result.push({kind:state.wear>=70?'warning':'normal',title:state.wear>=70?'컨디셔너 사용량 높음':'컨디셔너 점진적 마모',detail:`사용량 ${state.wear.toFixed(0)}% · 한 장마다 4%p 증가합니다. 이 게임에서는 마모가 쌓일수록 제거율이 낮아집니다.`});
    result.push({kind:state.pad>=55?'warning':'normal',title:state.pad>=55?'패드 사용량도 확인하세요':'패드 상태',detail:`사용량 ${state.pad.toFixed(1)}% · 컨디셔너를 교체해도 패드 사용량은 그대로 남습니다.`});
    if(state.lastMeasured&&state.rows.length>state.lastMeasured)result.push({kind:'changed',title:'측정 이후 상태 변화',detail:`마지막 측정 후 ${state.rows.length-state.lastMeasured}장을 더 가공했습니다. 이전 측정값은 현재 제거율을 보장하지 않습니다.`});
    return result;
  }
  function comparison(current,previous){
    if(!previous||current.order!==previous.order||current.version!==previous.version||current.inspected!==6||previous.phase!=='settled')return null;
    const metrics=s=>{const v=summary(s);return {good:v.good,mae:v.errors.reduce((a,b)=>a+Math.abs(b),0)/6,profit:v.revenue-v.spent,actions:actions(s).used,measures:s.events.filter(e=>e.type==='measure').length,services:s.events.filter(e=>e.type==='service').length};};
    const before=metrics(previous),after=metrics(current);return {before,after,delta:Object.fromEntries(Object.keys(after).map(k=>[k,after[k]-before[k]]))};
  }
  function restoreArchive(entries){if(!Array.isArray(entries))return [];const seen=new Set();return entries.filter(e=>{if(!e||typeof e.id!=='string'||!/^[\w-]{1,100}$/.test(e.id)||seen.has(e.id)||!Number.isFinite(Date.parse(e.at)))return false;const s=restore(e.session);if(s?.phase!=='settled')return false;seen.add(e.id);return true;}).slice(-30).map(e=>({id:e.id,at:e.at,session:JSON.parse(serialize(restore(e.session)))}));}
  function archiveSettlement(entries,id,at,state){assert(state.phase==='settled','납품 완료 기록만 보관할 수 있습니다.');const archive=restoreArchive(entries);if(archive.some(e=>e.id===id))return archive;return restoreArchive([...archive,{id,at,session:JSON.parse(serialize(state))}]);}
  function previousAttempt(entries,state,id){const entry=restoreArchive(entries).filter(e=>e.id!==id&&e.session.order===state.order&&e.session.version===state.version).at(-1);return entry?restore(entry.session):null;}
  return Object.freeze({version,legacyVersion,orders,create,settings,estimate,recommendation,quality,summary,transition,restore,serialize,visibleRows,actions,clues,comparison,restoreArchive,archiveSettlement,previousAttempt});
});
