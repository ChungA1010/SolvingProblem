/* Operator-visible estimates only. Never reads unmeasured wafer results. */
(function(root,factory){const api=factory(typeof module==='object'?require('./game-model.js'):root.CMPFactory);if(typeof module==='object')module.exports=api;else root.CMPWorkshop=api;})(globalThis,function(game){
  'use strict';
  function preview(state,input,seconds){
    if(!Number.isInteger(seconds)||seconds<30||seconds>240)throw new Error('연마 시간은 30–240초의 정수로 입력하세요.');
    const rate=game.estimate(state,input),target=game.orders[state.order].target;
    const removal=rate*seconds/60,rawSeconds=target/rate*60;
    return {rate,target,seconds,removal,delta:removal-target,deltaPct:(removal/target-1)*100,
      recommendation:game.recommendation(state,input),rawSeconds,limited:rawSeconds<30||rawSeconds>240};
  }
  const phases=Object.freeze({approach:{step:0,title:'헤드가 패드로 내려가요.',copy:'헤드에 고정된 웨이퍼의 연마면이 아래 패드를 향합니다.'},contact:{step:1,title:'패드와 접촉해 연마하고 있어요.',copy:'설정한 압력·회전·유량에 따른 동작을 관찰하세요.'},release:{step:2,title:'헤드가 분리되고 있어요.',copy:'제거량은 다음 화면의 측정 또는 최종 검사에서 확인합니다.'},complete:{step:2,title:'연마 동작이 끝났어요.',copy:'측정 여부를 결정할 차례입니다.'}});
  function phase(key){return phases[key]||phases.approach;}
  return Object.freeze({preview,phase});
});
