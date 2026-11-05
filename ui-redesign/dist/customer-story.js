/* Narrative and transparent customer goals; never modifies the CMP calculation or payout. */
(function(root,factory){const api=factory(typeof module==='object'?require('./game-model.js'):root.CMPFactory);if(typeof module==='object')module.exports=api;else root.CMPCustomers=api;})(globalThis,function(game){
  'use strict';
  const version='customer-story-v1';
  const customers=Object.freeze([
    Object.freeze({id:'research',name:'서윤',role:'NOVA · 공정 연구원',focus:'정밀도 우선',color:'#99c9ec',symbol:'◎'}),
    Object.freeze({id:'startup',name:'도현',role:'ORBIT · 스타트업 개발자',focus:'예산 우선',color:'#b6d9b5',symbol:'◇'}),
    Object.freeze({id:'production',name:'민재',role:'LUMEN · 생산 담당자',focus:'납기 우선',color:'#efc098',symbol:'◷'})
  ]);
  const contracts=Object.freeze([
    {customer:0,returning:false,metric:'error',limit:4,badge:'꼼꼼한 첫 납품',opening:'안녕하세요. 다음 실험에 쓸 웨이퍼 6장을 맡기려고 해요. 목표 제거량에 얼마나 가깝게 맞췄는지도 함께 보고 싶어요.'},
    {customer:1,returning:false,metric:'cost',limit:10,badge:'알뜰한 운영',opening:'첫 시제품을 준비하고 있어요. 품질은 지키면서 측정·정비 비용을 10 P 안으로 관리할 수 있을까요? 장비 사용량이 높아 고민이 되네요.'},
    {customer:2,returning:false,metric:'time',limit:900,badge:'약속한 납기',opening:'후속 작업 일정이 잡혀 있어요. 여섯 장에 설정한 연마 시간의 합을 900초 안으로 부탁드려요. 다시 켠 장비라는 점도 확인해주세요.'},
    {customer:0,returning:true,metric:'error',limit:2.5,badge:'정밀 연구 파트너',opening:'다시 찾아왔어요. 이번에는 더 좁은 공차로 실험하려고 해요. 평균 절대 목표 오차도 2.5% 이내에 도전해볼까요?'},
    {customer:1,returning:true,metric:'cost',limit:5,badge:'믿고 맡기는 파트너',opening:'이번에는 정밀한 후속 시제품이에요. 측정·정비 비용을 5 P 안으로 맞추는 추가 도전도 부탁드려요. 품질이 우선이라는 건 잊지 말아주세요.'}
  ].map(Object.freeze));
  const questionList=Object.freeze([
    Object.freeze({id:'spec',label:'어떤 규격인가요?'}),
    Object.freeze({id:'priority',label:'무엇을 가장 중시하나요?'}),
    Object.freeze({id:'advice',label:'주의할 점이 있나요?'})
  ]);
  function contract(index){const c=contracts[index],o=game.orders[index];if(!c||!o)throw new Error('지원하지 않는 고객 주문입니다.');return {...c,profile:customers[c.customer],order:o};}
  function goalLabel(index){const c=contract(index);return c.metric==='error'?`평균 절대 목표 오차 ${c.limit}% 이하`:c.metric==='cost'?`측정·정비 비용 ${c.limit} P 이하`:`설정 연마 시간 합계 ${c.limit}초 이하`;}
  function answer(index,key){
    const c=contract(index),o=c.order;
    if(key==='spec')return `웨이퍼 ${o.count}장, 목표 제거량 ${o.target} nm, 허용 오차 ±${o.tolerance}%예요. ${(o.target*(1-o.tolerance/100)).toFixed(1)}–${(o.target*(1+o.tolerance/100)).toFixed(1)} nm이면 규격 안으로 판정해요. 3장 이상 규격을 맞춰 납품하면 다음 의뢰가 열립니다.`;
    if(key==='priority')return `우선 6장 중 3장 이상이 규격 안이어야 해요. 추가 목표는 ‘${goalLabel(index)}’입니다. ${c.metric==='time'?'버튼을 누르는 속도나 3D 재생 시간은 세지 않고, 입력한 연마 시간만 더해요.':c.metric==='error'?'6장 각각의 목표 대비 오차에서 부호를 빼고 평균해요. 평균 제거량만 맞추는 것과는 달라요.':'정비와 측정에 쓴 비용만 더해요. 비용을 아껴도 품질 기준을 못 맞추면 목표 달성이 아니에요.'} 추가 목표는 달성 배지를 위한 것이며 대금·별점·다음 의뢰 해제 조건을 바꾸지 않아요.`;
    if(key==='advice')return `${o.lesson} 측정·정비는 공통 2회 한도예요. 이 대화와 주문서 확인은 무료이고 행동을 쓰지 않아요. 납품 전 필수 검사도 무료예요. 이전 규칙으로 저장된 도전의 행동 한도는 화면 안내를 따라주세요.`;
    throw new Error('지원하지 않는 질문입니다.');
  }
  function restoreDialogue(value,index){return value?.version===version&&value.order===index&&Array.isArray(value.asked)?[...new Set(value.asked.filter(id=>questionList.some(q=>q.id===id)))].slice(0,3):[];}
  function ask(asked,key){if(!questionList.some(q=>q.id===key))throw new Error('지원하지 않는 질문입니다.');return [...new Set([...asked,key])];}
  function serializeDialogue(asked,index){return {version,order:index,asked:restoreDialogue({version,order:index,asked},index)};}
  function unlocked(best,index){return Number.isInteger(index)&&index>=0&&index<contracts.length&&(index===0||Number(best?.[index-1])>=1);}
  function nextOrder(best,index){return index<contracts.length-1&&unlocked(best,index+1)?index+1:null;}
  function evaluation(state){
    if(!['inspection','settled'].includes(state.phase)||state.inspected!==6||state.rows.length!==6)return null;
    const c=contract(state.order),s=game.summary(state),qualityMet=s.good>=3;
    const value=c.metric==='error'?s.errors.reduce((n,e)=>n+Math.abs(e),0)/6:c.metric==='cost'?s.spent:state.rows.reduce((n,r)=>n+r.duration,0);
    const goalMet=value<=c.limit+1e-9,achieved=qualityMet&&goalMet;
    return {qualityMet,goalMet,achieved,value,limit:c.limit,metric:c.metric,good:s.good,spent:s.spent,revenue:s.revenue,badge:c.badge};
  }
  function reaction(state){
    if(state.phase!=='settled')return null;
    const e=evaluation(state);if(!e)return null;
    const c=contract(state.order),valueText=e.metric==='error'?`${e.value.toFixed(2)}%`:e.metric==='cost'?`${e.value} P`:`${e.value}초`;
    const fact=e.metric==='error'?`평균 절대 목표 오차는 ${valueText}예요.`:e.metric==='cost'?`측정·정비에 ${valueText}를 썼네요.`:`설정 연마 시간 합계는 ${valueText}예요.`;
    const mood=!e.qualityMet?'retry':e.achieved?'delighted':'accepted';
    const message=!e.qualityMet?`6장 중 ${e.good}장이 규격 안이네요. ${fact} 우선 3장 이상 규격을 맞추는 것부터 다시 도전해봐요. 대금은 각 장의 검사 결과대로 정산했어요.`:e.achieved?`6장 중 ${e.good}장이 규격 안이에요. ${fact} ${c.metric==='error'?'목표와의 차이까지 세심하게 관리해주셨네요.':c.metric==='cost'?'품질 기준을 지키면서 예산도 맞춰주셨네요.':'품질 기준과 약속한 가공 시간을 함께 지켜주셨네요.'} 추가 목표도 달성했어요!`:`6장 중 ${e.good}장이 규격 안이에요. ${fact} 납품 목표는 달성했어요. 다음에는 ‘${goalLabel(state.order)}’에도 도전해봐요.`;
    return {...e,mood,title:mood==='retry'?'다음에는 더 잘 맞춰봐요':mood==='delighted'?'고객의 추가 목표까지 달성!':'납품 목표 달성',message};
  }
  return Object.freeze({version,customers,contracts,questionList,contract,goalLabel,answer,ask,restoreDialogue,serializeDialogue,unlocked,nextOrder,evaluation,reaction});
});
