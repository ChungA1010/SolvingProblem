(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.CMPDemo);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.CMPLearning=api;
})(typeof globalThis==='undefined'?this:globalThis,function(engine){
  'use strict';
  const tasks=Object.freeze({
    pressure:Object.freeze({title:'압력과 MRR',question:'압력을 낮추면 계산 MRR은 어떻게 될까요?',goal:'다른 조건을 고정하고 압력의 영향을 비교합니다.',variable:'pressure',target:'mrr',startPressure:269.765,suggested:260,suggestion:'압력 260 적용',reflection:'MRR이 더 높은 조건을 최적 조건이라고 할 수 있을까요?',answer:'결함·균일도·손상을 계산하지 않으므로 MRR만으로 최적 조건을 판단할 수 없습니다.'}),
    duration:Object.freeze({title:'MRR과 환산시간',question:'압력을 높여 MRR이 증가하면 환산시간은 어떻게 될까요?',goal:'같은 목표 제거량에서 MRR과 시간의 관계를 확인합니다.',variable:'pressure',target:'time',startPressure:260,suggested:269.765,suggestion:'압력 269.765 적용',reflection:'이 시간은 화면에서 재생되는 6초와 같은 의미일까요?',answer:'환산시간은 같은 제거량을 가정한 수식 결과입니다. 6초 애니메이션은 접근·연마·분리를 설명하는 시연입니다.'}),
    evidence:Object.freeze({title:'측정 최신성과 근거',question:'측정 후 경과 웨이퍼 수가 늘어나면 근거 등급은 어떻게 될까요?',goal:'계산값의 변화와 입력 근거의 변화를 구분합니다.',variable:'scenario',target:'grade',startPressure:269.765,suggested:'measure10',suggestion:'측정 후 10장 적용',reflection:'등급이 C가 됐다는 것은 MRR이 감소했다는 뜻일까요?',answer:'아닙니다. 등급은 입력 범위와 측정 최신성에 따른 규칙입니다. 현재 모델은 측정 지연에 따른 MRR 변화를 계산하지 않습니다.'})
  });
  function taskInput(id){
    const t=tasks[id];if(!t)throw new Error('지원하지 않는 과제입니다.');
    return {...engine.defaults('A456'),pressure:t.startPressure};
  }
  function constrain(input,id,base){
    if(!id)return {...input};const t=tasks[id],fixed=base?base.input:taskInput(id);
    if(!t)throw new Error('지원하지 않는 과제입니다.');
    return base?{...fixed,[t.variable]:input[t.variable]}:{...fixed};
  }
  const fields=[['pressure','Main outer 압력'],...engine.educationalFields.map(f=>[f.key,f.label]),['mrr','기준 MRR'],['scenario','측정 정보']];
  const finite=value=>Number.isFinite(value)?value:null;
  function delta(a,b){return a===null||b===null?{value:null,percent:null}:{value:finite(b-a),percent:finite((b/a-1)*100)};}
  function compare(base,next){
    if(!base||!next)return {ok:false,reason:'비교할 실험 두 개가 필요합니다.'};
    if(base.input.recipe!==next.input.recipe)return {ok:false,reason:'서로 다른 레시피는 비교할 수 없습니다. 같은 레시피의 실험을 선택하거나 비교 기준을 다시 지정하세요.'};
    if(engine.modelId(base.input)!==engine.modelId(next.input))return {ok:false,reason:'계산 모델이 다릅니다. 같은 모델의 실험을 선택하거나 비교 기준을 다시 지정하세요.'};
    const changed=fields.filter(([key])=>base.input[key]!==next.input[key]).map(([key,label])=>({key,label}));
    const mrr=delta(base.result.mrr,next.result.mrr),time=delta(base.result.time,next.result.time);
    let explanation;
    if(!changed.length)explanation='두 실험의 입력 조건이 같습니다. 현재 수식에서 계산 MRR·환산시간·근거 등급도 같습니다.';
    else if(changed.length>1)explanation=`${changed.map(c=>c.label).join('·')}이 함께 바뀌었습니다. 이 차이를 한 변수만의 영향으로 해석할 수 없습니다.`;
    else if(changed[0].key==='pressure')explanation=`Main outer 압력이 ${next.input.pressure>base.input.pressure?'높아져':'낮아져'} 현재 수식의 압력 배율 (p_main / p_ref)^0.682가 ${next.input.pressure>base.input.pressure?'커졌습니다':'작아졌습니다'}. 기준 MRR과 측정 조건은 동일합니다.`;
    else if(changed[0].key==='mrr')explanation='최근 측정값인 기준 MRR만 바뀌었습니다. 계산 MRR은 기준 MRR에 비례합니다. 장비 압력을 바꾼 실험과는 구분해 해석하세요.';
    else if(engine.educationalFields.some(f=>f.key===changed[0].key))explanation=`${changed[0].label}만 바뀌었습니다. 교육용 수식에서 이 값이 증가하면 계산 MRR도 증가하도록 가정했습니다. Slurry C는 증가 효과가 점차 줄어드는 포화형 함수를 사용합니다.`;
    else explanation=`측정 정보만 바뀌었습니다. 이 조건은 MRR·시간 계산식에 포함되지 않아 두 값은 같습니다. 입력 근거 등급은 ${base.result.grade} → ${next.result.grade}입니다. 정지 효과도 계산하지 않습니다.`;
    if(changed.some(c=>c.key!=='scenario')){
      explanation+=time.value===null?' 연마시간 또는 그 차이를 유한한 값으로 환산할 수 없습니다.':mrr.value===0?' 계산 MRR이 같으므로 환산시간도 같습니다.':` 같은 목표 제거량을 가정하므로 MRR이 ${next.result.mrr>base.result.mrr?'증가하면 환산시간은 줄어듭니다':'감소하면 환산시간은 늘어납니다'}.`;
    }
    if(base.result.grade!==next.result.grade&&changed.some(c=>c.key==='pressure'))explanation+=` 입력 근거 등급 ${base.result.grade} → ${next.result.grade}는 압력 범위와 측정 최신성 규칙에 따른 변화이며 예측 정확도 등급이 아닙니다.`;
    if(engine.isEducational(base.input))explanation+=' 회전·유량 계수는 학습용 가정이며 실측 데이터로 검증한 인과관계가 아닙니다.';
    return {ok:true,changed,mrr,time,explanation};
  }
  function single(input,result){
    const r=engine.recipes[input.recipe];
    if(engine.isEducational(input))return `교육용 다변수 v1: 기준 MRR × (압력/${r.pressure})^0.682 × (Wafer 회전/100)^0.25 × (Stage 회전/100)^0.40 × 2q/(1+q), q = Slurry C/100입니다. 회전·유량의 100%는 가상 기준이며 계수와 50–150% 범위는 교육용 가정입니다. 실제 상대속도·물성·공정 품질은 예측하지 않습니다. 환산시간은 같은 목표 제거량에서 MRR에 반비례합니다. 근거 등급은 압력·측정 최신성만 평가하며 세 추가 변수의 신뢰도를 뜻하지 않습니다.`;
    const text=r.pressure===null?'A123은 입력한 기준 MRR을 그대로 참조합니다.':`현재 수식은 기준 MRR에 (Main outer 압력 / ${r.pressure})^0.682를 곱합니다. ${input.pressure===r.pressure?'기준 압력과 같아 계산 MRR도 기준 MRR과 같습니다.':`기준 압력보다 ${input.pressure>r.pressure?'높아 계산 MRR이 기준 MRR보다 큽니다':'낮아 계산 MRR이 기준 MRR보다 작습니다'}.`}`;
    return text+(result.time===null?' 이 값의 연마시간은 환산할 수 없습니다.':' 환산시간은 같은 목표 제거량을 가정하며 MRR에 반비례합니다.')+' 측정 최신성은 근거 등급에만 반영됩니다.';
  }
  function assessment(id,base,next,prediction=''){
    const t=tasks[id],c=compare(base,next);
    if(!t||!c.ok)return {complete:false,message:c.reason||'과제를 선택하세요.'};
    if(c.changed.length!==1||c.changed[0].key!==t.variable)return {complete:false,message:`${t.variable==='pressure'?'압력':'측정 정보'}만 바꿔 다시 계산해 보세요. 나머지 조건은 기준 실험과 같아야 합니다.`};
    if((id==='pressure'&&next.input.pressure>=base.input.pressure)||(id==='duration'&&next.input.pressure<=base.input.pressure))return {complete:false,message:`이 과제에서는 기준 실험보다 압력을 ${id==='pressure'?'낮춰':'높여'} 비교하세요. 위의 변경 조건 적용 버튼을 사용할 수 있습니다.`};
    if(id==='evidence'&&next.result.age<=base.result.age)return {complete:false,message:'측정 후 경과 웨이퍼 수를 기준 실험보다 늘려 비교하세요.'};
    const scores={A:3,B:2,C:1};
    const a=t.target==='grade'?scores[base.result.grade]:base.result[t.target];
    const b=t.target==='grade'?scores[next.result.grade]:next.result[t.target];
    if(a===null||b===null)return {complete:false,message:'환산 가능한 시간 값으로 비교해야 합니다.'};
    const direction=b>a?'increase':b<a?'decrease':'same';
    const message=prediction?(prediction===direction?'예상과 결과가 같습니다.':'예상과 결과가 다릅니다. 아래 해설에서 바뀐 조건과 수식을 확인하세요.'):'비교를 완료했습니다. 결과가 달라진 이유를 아래 해설로 확인하세요.';
    return {complete:true,direction,message};
  }
  function select(ids,id,rows){
    if(ids.includes(id))return {ids:ids.filter(x=>x!==id),message:''};
    const row=rows.find(r=>r.id===id),base=rows.find(r=>r.id===ids[0]);
    if(!row)return {ids:[...ids],message:'선택한 기록을 찾을 수 없습니다.'};
    if(ids.length>=2)return {ids:[...ids],message:'두 개까지 선택할 수 있습니다. 선택한 실험 하나를 먼저 해제하세요.'};
    if(base&&base.input.recipe!==row.input.recipe)return {ids:[...ids],message:'서로 다른 레시피는 비교할 수 없습니다. 같은 레시피를 선택하세요.'};
    if(base&&engine.modelId(base.input)!==engine.modelId(row.input))return {ids:[...ids],message:'계산 모델이 다릅니다. 같은 모델의 기록을 선택하세요.'};
    return {ids:[...ids,id],message:''};
  }
  return {tasks,taskInput,constrain,compare,single,assessment,select};
});
