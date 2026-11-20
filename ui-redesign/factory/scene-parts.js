(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CMPSceneParts=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
  'use strict';
  const parts=[
    {id:1,key:'head',title:'연마 헤드',description:'웨이퍼 뒷면을 지지하고 눌러, 앞면이 연마 패드에 닿도록 합니다.'},
    {id:2,key:'wafer',title:'웨이퍼',description:'가공할 반도체 기판입니다. 앞면은 아래쪽 패드와 접촉하며, 헤드에 가려진 부분은 투명 보기나 단면으로 확인할 수 있습니다.'},
    {id:3,key:'film',title:'앞면 연마층',description:'패드와 슬러리의 작용으로 제거되는 앞면의 층입니다. 단면에서는 얇아지는 모습을 확대해 보여줍니다.'},
    {id:4,key:'retainer',title:'리테이너 링',description:'웨이퍼 둘레를 감싸 연마 중 웨이퍼가 헤드 밖으로 벗어나지 않도록 잡아줍니다.'},
    {id:5,key:'pad',title:'연마 패드',description:'웨이퍼 앞면과 접촉해 연마하는 표면입니다. 표면의 홈은 슬러리와 부산물의 이동을 돕습니다.'},
    {id:6,key:'platen',title:'플래튼 · 회전 테이블',description:'연마 패드를 받쳐 주고 회전시키는 테이블입니다. 이 체험에서는 Stage 회전 입력과 연결됩니다.'},
    {id:7,key:'slurry',title:'슬러리 공급부',description:'연마에 쓰이는 슬러리를 패드에 공급합니다. 이 체험에서는 Slurry C 유량의 변화에 맞춰 공급 표현이 달라집니다.'},
    {id:8,key:'conditioner',title:'패드 컨디셔너',description:'패드 표면의 상태를 관리하는 장치입니다. 현재 시뮬레이터에서는 세정 컵 위 대기 상태로 표시합니다.'},
    {id:9,key:'spindle',title:'스핀들 · 보호 커버',description:'헤드에 회전과 상하 움직임을 전달하는 축입니다. 주름진 보호 커버가 축 주변을 감쌉니다.'},
    {id:10,key:'support',title:'헤드 지지 암 · 구동부',description:'헤드와 축을 지지하고 연마 위치에 유지하는 구조입니다. 뒤쪽 기둥과 암이 헤드의 하중을 받습니다.'},
    {id:11,key:'base',title:'베이스 · 배수부',description:'장비를 지지하는 하부 구조입니다. 패드 둘레의 배수부는 사용한 슬러리와 세정액을 모으는 역할을 합니다.'}
  ].map(Object.freeze);
  const byId=new Map(parts.map(part=>[part.id,part]));
  function forId(id){return byId.get(Number(id))||null;}
  function forHit(hit){
    if(!hit?.object)return null;
    const attribute=hit.object.geometry?.getAttribute('_cmp_part');
    const id=attribute&&hit.face?attribute.getX(hit.face.a):hit.object.userData?.cmpPart;
    return forId(id);
  }
  return {parts:Object.freeze(parts),forId,forHit};
});
