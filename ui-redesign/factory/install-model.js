/* Presentation only: never spends funds or changes process results. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CMPInstall=api;})(globalThis,function(){
  const items={
    environment:[{key:'air',title:'온습도 관리',detail:'벽걸이 공조기와 환경 센서가 들어왔어요.'},{key:'isolation',title:'진동 저감',detail:'작업대를 받치는 방진 지지대와 보강 레일을 설치했어요.'},{key:'control',title:'환경 통합 제어',detail:'보호 패널, 상부 필터와 환경 제어 화면을 추가했어요.'}],
    care:[{key:'tools',title:'정밀 컨디셔너 I',detail:'정밀 디스크와 교체 도구를 설치했어요. 다음 주문부터 사용량 증가가 완만해져요.'},{key:'station',title:'정밀 컨디셔너 II',detail:'고내구 디스크와 관리 스테이션을 설치했어요.'}],
    pad:[{key:'pad1',title:'고효율 연마 패드 I',detail:'홈이 다른 패드와 전용 카트리지를 설치했어요. 다음 주문부터 가공률 ×1.10.'},{key:'pad2',title:'고효율 연마 패드 II',detail:'이중 홈 패드로 교체했어요. 다음 주문부터 가공률 ×1.20.'}],
    endpoint:[{key:'endpoint1',title:'종점 감지기 I',detail:'감지 창과 센서 제어 모듈을 설치했어요. 다음 주문부터 측정 보정 후 2장 동안 자동 정지.'},{key:'endpoint2',title:'종점 감지기 II',detail:'신호 보정 모듈을 추가했어요. 다음 주문부터 보정 유지 3장 · 보정 직후 교육용 감지 오차 ±0.8%.'}]
  };
  const decorations={task_lamp:{key:'task_lamp',title:'조절식 작업등',detail:'작업대 오른쪽에 조명을 설치했어요. 작은 물건들을 따뜻하게 비춰줍니다.'},storage_cabinet:{key:'storage_cabinet',title:'모듈 수납장',detail:'오른쪽 뒤편에 수납장을 놓았어요. 서랍과 정리함이 공방의 모습을 바꿔줍니다.'},note_board:{key:'note_board',title:'실험 메모 보드',detail:'작업대 뒤쪽 벽에 스케치와 메모 보드를 걸었어요.'}};
  Object.assign(decorations,{
    floor_plant:{key:'floor_plant',title:'창가 화분',detail:'작업대 왼쪽 바닥에 화분을 놓았어요. 연마 조건은 바뀌지 않아요.'},
    wall_clock:{key:'wall_clock',title:'공방 벽시계',detail:'뒤쪽 벽에 시계를 걸었어요. 연마 타이머와는 별도인 장식입니다.'},
    wall_shelf:{key:'wall_shelf',title:'오크 벽 선반',detail:'오른쪽 벽에 노트와 정리함을 올려둘 선반을 설치했어요.'}
  });
  const smooth=x=>x*x*(3-2*x),clamp=x=>Math.min(1,Math.max(0,x));
  function describe(event,after){const item=items[event?.id]?.[after[event.id]-1];return item||decorations[event?.id]||{key:'decor',title:'작업대 새 단장',detail:'벽과 작업대 마감을 새 색상으로 바꿨어요.'};}
  function frame(progress){const p=clamp(Number.isFinite(progress)?progress:0);return {progress:p,phase:p<.24?'delivery':p<.72?'fit':p<1?'activate':'done',lift:1.5*(1-smooth(clamp((p-.18)/.54))),slide:1.4*(smooth(clamp(p/.45))-1),pulse:p>=.72&&p<1?Math.sin((p-.72)/.28*Math.PI):0};}
  function createPlayer({requestFrame,cancelFrame,now,onFrame,onComplete}){
    let id=null,token=0,active=false,start=0;
    function cancel(){token++;active=false;if(id!==null)cancelFrame(id);id=null;}
    function finish(){if(!active)return;cancel();onFrame(frame(1));onComplete();}
    function play({reducedMotion=false}={}){cancel();active=true;start=now();const generation=token;if(reducedMotion){finish();return;}onFrame(frame(0));function tick(){if(token!==generation||!active)return;const progress=(now()-start)/3600;if(progress>=1){finish();return;}onFrame(frame(progress));id=requestFrame(tick);}id=requestFrame(tick);}
    return {play,finish,cancel};
  }
  return {items,decorations,describe,frame,createPlayer};
});
