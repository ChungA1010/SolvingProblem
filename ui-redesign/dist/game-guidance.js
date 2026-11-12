/* Evidence-based teaching copy; unavailable outcomes never enter the UI. */
(function(root,factory){const api=factory(typeof module==='object'?require('./game-model.js'):root.CMPFactory);if(typeof module==='object')module.exports=api;else root.CMPGuidance=api;})(globalThis,function(g){
  'use strict';
  const f=(n,d=1)=>n.toFixed(d);
  function tutorial(s,{dismissed=false,completed=false,applied=false}={}){
    if(dismissed||completed||s.order!==0||s.rows.length>1||['inspection','settled'].includes(s.phase))return null;
    const first=g.visibleRows(s)[0],target=g.orders[s.order].target;
    if(!first)return {step:1,title:'시간을 정하고, 한 장 연마해요',copy:`목표는 제거량 ${target} nm예요. 우선 기본 조건과 예상 시간으로 시작하고, 실제 결과는 측정해서 확인해요.`,action:'duration'};
    if(!first.measured){
      if(s.phase==='setup')return null;
      return {step:2,title:'첫 장을 측정해 확인해요',copy:'웨이퍼를 측정기로 옮겨 예상과 실제를 비교해요. 5 P와 추가 행동 1회가 들고, 주문 전체에 행동은 2회예요.',action:'measure'};
    }
    const next=g.recommendation(s,first.input);
    return {step:3,title:applied?'새 시간으로 두 번째 장을 연마해요':'측정값으로 시간을 다시 맞춰요',copy:`${first.duration}초에 ${f(first.removed)} nm가 제거됐어요. ${target} ÷ ${f(first.rate)} × 60 ≈ ${next}초. ${s.phase==='result'?'보관 슬롯에 넣은 뒤 다음 장에 예상 시간을 적용해요.':applied?'바뀐 시간을 확인하고 연마해요. 이후 마모로 결과가 달라질 수 있어요.':'예상 시간 적용을 눌러 이전 시간과 비교해요.'}`,action:s.phase==='result'?'advance':applied?'process':'use-recommendation'};
  }
  function debrief(s){
    if(!g.inspectionDone(s))return null;
    const rows=g.visibleRows(s).filter(row=>!row.discarded),summary=g.summary(s),measured=rows.filter(r=>r.measured),stops=rows.filter(r=>r.endpointStopped),services=s.events.filter(e=>e.type==='service').length;
    if(!rows.length)return [{title:'이번 판단',text:`가공한 ${s.rows.length}장을 폐기해 납품 대금이 없습니다. 가공과 추가 행동에 ${summary.spent} P를 썼어요.`}];
    const facts=[{title:'이번 판단',text:`${rows.length}장 중 ${summary.good}장 규격 충족 · 측정 ${s.events.filter(e=>e.type==='measure').length}회 · 정비 ${services}회 · 자동 정지 ${stops.length}회.`}];
    let observation,advice;
    if(measured.length){
      const runs=s.events.filter(e=>e.type==='run');
      const m=measured.find(r=>{
        const nextRun=runs[r.number];
        if(!nextRun||!rows.some(next=>next.number===r.number+1))return false;
        const between=s.events.slice(s.events.indexOf(runs[r.number-1])+1,s.events.indexOf(nextRun));
        return between.some(e=>e.type==='measure' && (e.wafer===undefined||e.wafer===r.number));
      });
      const next=m&&rows.find(r=>r.number===m.number+1);
      if(next){const same=g.sameConditions(m.input,next.input);observation=`W${m.number} 측정 ${f(m.rate,2)} nm/min 뒤 W${next.number}의 설정 시간을 ${m.duration} → ${next.duration}초로 ${m.duration===next.duration?'유지':'변경'}했어요. 목표 오차는 ${f(m.error,2)}% → ${f(next.error,2)}%였어요.${same?'':' 공정 조건도 바뀌어 시간만의 효과로 볼 수는 없어요.'}`;}
      else observation=s.events.some(e=>e.type==='measure'&&e.wafer!==undefined)?'보관한 웨이퍼를 꺼내 측정했어요. 측정 전에 끝난 가공에는 이 값이 반영되지 않았어요.':'마지막 장을 측정했지만, 바로 다음 장과 비교할 납품 기록이 없어요.';
      if(next?.endpointStopped)observation+=` W${next.number}는 종점 신호로 ${f(g.elapsed(next))}초에 멈췄어요.`;
    }else if(s.rows.some(row=>row.discarded&&row.measured)){
      observation='측정 뒤 폐기한 장의 보정값은 다음 가공에 사용할 수 있어요. 보관한 장의 제거량은 최종 검사에서 확인했어요.';
    }else observation=stops.length?`사전 측정 없이 자동 정지가 ${stops.length}번 작동했어요. 측정으로 시간을 보정한 결과는 아니에요.`:'사전 측정을 생략해 중간에 실제 제거율을 확인하지 않았어요. 결과는 최종 검사에서 처음 확인했어요.';
    // Same input, same actual time, no restart: describe observed trend, not a proved causal effect.
    const pair=rows.flatMap((a,i)=>rows.slice(i+1).map(b=>[a,b])).filter(([a,b])=>g.sameConditions(a.input,b.input)&&g.elapsed(a)===g.elapsed(b)&&!a.restart&&!b.restart).sort((x,y)=>(y[1].number-y[0].number)-(x[1].number-x[0].number))[0];
    if(pair){const [a,b]=pair;observation+=` 같은 조건·${f(g.elapsed(a))}초인 W${a.number}와 W${b.number}는 ${f(a.removed)} → ${f(b.removed)} nm였어요. 마모와 고정 변동이 함께 반영된 결과예요.`;}
    facts.push({title:'기록에서 확인한 변화',text:observation});
    if(g.usesCalibration(s)&&rows.some(r=>r.endpointRequested&&!r.endpointEnabled)){
      const waiting=rows.filter(r=>r.endpointRequested&&!r.endpointEnabled);
      advice=`W${waiting.map(r=>r.number).join('·W')}은 보정 대기라 자동 정지 없이 설정 시간만큼 연마했어요. 첫 측정과 보정 잔여 장수를 확인하고, 만료 후에는 시간을 직접 맞추거나 재측정하세요.`;
    }else if(services)advice='정비 뒤에는 제거율이 달라져요. 정비 전 측정값을 그대로 쓰기보다 남은 행동으로 다시 확인할지 판단해요.';
    else if(s.order===2&&rows[0].number===1&&rows[0].measured)advice='첫 장에는 재시작 저하가 있었어요. 정상 운전으로 돌아온 다음 장에서 다시 측정할지 판단해요.';
    else if(!s.rows.some(r=>r.measured))advice='다음 도전에서는 첫 장 또는 상태가 달라진 장을 한 번 측정해 시간을 다시 계산해보세요.';
    else if(stops.length)advice='자동 정지는 시간을 줄여주지만 최종 품질을 보장하지 않아요. 보정 유지 범위와 실제 검사 결과를 함께 확인하세요.';
    else if(summary.good<rows.length)advice=`${rows.filter(r=>r.quality==='under').length}장은 부족, ${rows.filter(r=>r.quality==='over').length}장은 과다 연마였어요. 최신 측정값으로 시간을 맞추되, 이후 마모 변화도 살펴보세요.`;
    else advice='이번에는 모두 규격 안이었어요. 다음 주문에서는 더 좁은 허용 오차와 장비 상태에 맞춰 측정 시점을 선택해보세요.';
    facts.push({title:'다음 판단',text:advice});return facts;
  }
  return Object.freeze({tutorial,debrief});
});
