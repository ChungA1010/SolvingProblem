/* Local teaching-game progression. All equipment effects are fictional balancing rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CMPUpgrades=api;})(globalThis,function(){
  'use strict';
  const version='workshop-v4',legacyVersion='workshop-v1';
  const catalog=Object.freeze({
    environment:{title:'환경 안정화',tag:'ENVIRONMENT',costs:[180,300,480],stages:['온습도 관리','진동 저감','환경 통합 제어'],description:'주변 환경을 정돈해 장마다 달라지는 가상의 외부 변동 폭을 줄입니다.'},
    care:{title:'정밀 컨디셔너',tag:'STABILITY',costs:[220,360],stages:['정밀 디스크','고내구 디스크'],description:'사용에 따른 가공률 저하를 늦춰요. 쌓인 사용량은 정비로 초기화해요.',reference:'3M Trizact T Series',url:'https://multimedia.3m.com/mws/media/2353993O/3m-cmp-pad-conditioners-product-selection-guide.pdf'},
    pad:{title:'고효율 연마 패드',tag:'SPEED',costs:[240,420],stages:['고효율 패드 I','고효율 패드 II'],description:'같은 조건에서 더 빨리 깎아요. 연마 시간도 다시 맞춰주세요.',reference:'Ikonic CMP 패드',url:'https://www.nittadupont.co.jp/en/products/ikonic'},
    endpoint:{title:'종점 감지기',tag:'PRECISION',costs:[380,600],stages:['종점 감지 I','종점 감지 II'],description:'측정으로 보정한 뒤 목표 도달 시 멈춰요. I단계 2장, II단계 3장 동안 보정을 유지해요.',reference:'Reflexion LK 종점 제어',url:'https://www.appliedmaterials.com/kr/ko/semiconductor/products/processes/cmp/reflection-lk-cmp.html'}
  });
  const themes=Object.freeze([
    {id:'sage',title:'세이지 그린',price:0,colors:['#718b79','#b9966a','#e6e6cf']},
    {id:'sand',title:'허니 오크',price:120,colors:['#a38a64','#ba885d','#e9e1d2']},
    {id:'slate',title:'블루 그레이',price:120,colors:['#6f8595','#8b8378','#d8e1e7']}
  ]);
  const decorations=Object.freeze([
    {id:'task_lamp',title:'조절식 작업등',price:140,slot:'작업대 오른쪽',description:'관절형 조명과 따뜻한 빛을 더해요. 가공·측정 성능은 바뀌지 않아요.'},
    {id:'storage_cabinet',title:'모듈 수납장',price:180,slot:'오른쪽 뒤편',description:'서랍과 정리함이 달린 수납장을 놓아요. 정비 효과는 장비 강화에서 선택해요.'},
    {id:'note_board',title:'실험 메모 보드',price:90,slot:'작업대 뒤쪽 벽',description:'메모와 웨이퍼 스케치가 붙은 보드예요. 실제 주문 기록과는 별도인 장식입니다.'},
    {id:'floor_plant',title:'공방 화분',price:120,slot:'작업대 왼쪽 바닥',description:'작업대 옆에 초록빛 여유를 놓아요. 공정에는 영향을 주지 않아요.'},
    {id:'wall_clock',title:'공방 벽시계',price:90,slot:'뒤쪽 벽 상단',description:'하루를 함께하는 아날로그 시계. 연마 타이머와는 별도인 장식이에요.'},
    {id:'wall_shelf',title:'오크 벽 선반',price:160,slot:'오른쪽 벽면',description:'노트와 정리함을 벽에 모아두어요. 작업 공간을 가리지 않아요.'}
  ]);
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  function levels(raw={}){assert(raw&&typeof raw==='object','장비 정보를 확인해주세요.');const result=Object.fromEntries(Object.keys(catalog).map(key=>[key,raw[key]??0]));for(const key of Object.keys(result))assert(Number.isInteger(result[key])&&result[key]>=0&&result[key]<=catalog[key].costs.length,'장비 단계가 올바르지 않습니다.');return result;}
  function effects(raw={}){const l=levels(raw);return {noiseScale:[1,.7,.45,.25][l.environment],wearStep:[4,3,2.4][l.care],rateScale:[1,1.10,1.20][l.pad],sensorError:[0,.02,.008][l.endpoint]};}
  function same(a,b){const x=levels(a),y=levels(b);return Object.keys(catalog).every(key=>x[key]===y[key]);}
  function create(){return {version,balance:0,levels:levels(),owned:['sage'],theme:'sage',decorOwned:[],placed:[],credited:[],events:[],campaignInitialized:false,supports:[],operating:[],cashflow:[]};}
  const validId=id=>typeof id==='string'&&/^[\w-]{1,100}$/.test(id);
  const campaignDay=s=>Math.floor(s.credited.length/3)+1;
  function book(s,kind,amount,id,day=campaignDay(s)){
    const before=s.balance;
    assert(Number.isSafeInteger(amount)&&Number.isSafeInteger(before+amount)&&before+amount>=0,'운영 자금이 부족합니다.');
    // A closing-shop purchase belongs to the just-finished day. Never insert
    // cash movements into an earlier day after the next day has already begun.
    day=Math.max(day,s.cashflow.at(-1)?.day??1);
    s.balance+=amount;
    s.cashflow.push({kind,id,day,amount,before,after:s.balance});
  }
  function appearance(s){return {theme:s.theme,...levels(s.levels),decor:[...s.placed]};}
  function transition(previous,event){
    const s=JSON.parse(JSON.stringify(previous));assert(event&&typeof event.type==='string','공방 작업을 확인해주세요.');
    if(event.type==='campaignInitialize'){
      if(s.campaignInitialized)return s;
      s.campaignInitialized=true;
      // A legacy save may open at the third customer's closing shop. Keep the
      // migration grant with that day's purchases, before any next-day trade.
      book(s,'initial',100,'daily-wallet-v1',Math.max(1,Math.ceil(s.credited.length/3)));
    }else if(event.type==='campaignSupport'){
      assert(s.campaignInitialized&&validId(event.id),'재료 지원 기록을 확인해주세요.');
      if(s.supports.includes(event.id))return s;
      assert(s.balance<40,'재료 지원은 잔액이 40 P 미만일 때 받을 수 있어요.');
      book(s,'support',100-s.balance,event.id);
      s.supports.push(event.id);
    }else if(event.type==='operating'){
      assert(s.campaignInitialized&&validId(event.id),'운영 기록을 확인해주세요.');
      assert(Number.isSafeInteger(event.cost)&&event.cost>=0&&event.cost<=200,'운영 비용을 확인해주세요.');
      assert(typeof event.settled==='boolean'&&Number.isSafeInteger(event.revenue)&&event.revenue>=0&&event.revenue<=600&&
        (event.settled||event.revenue===0),'납품 대금을 확인해주세요.');
      let record=s.operating.find(item=>item.id===event.id);
      if(record?.settled){
        assert(record.cost===event.cost&&record.revenue===event.revenue&&event.settled,'완료된 운영 기록은 변경할 수 없습니다.');
        return s;
      }
      assert(!s.credited.includes(event.id),'이미 이전 규칙으로 정산된 주문입니다.');
      if(!record){record={id:event.id,day:campaignDay(s),cost:0,revenue:0,settled:false};s.operating.push(record);}
      assert(event.cost>=record.cost,'운영 비용을 이전 상태로 되돌릴 수 없습니다.');
      const delta=event.cost-record.cost;
      if(!delta&&!event.settled&&s.events.some(e=>e.type==='operating'&&e.id===event.id))return s;
      if(delta)book(s,'cost',-delta,event.id,record.day);
      record.cost=event.cost;
      if(event.settled){
        book(s,'sale',event.revenue,event.id,record.day);
        record.revenue=event.revenue;record.settled=true;s.credited.push(event.id);
      }
    }else if(event.type==='income'){
      assert(typeof event.id==='string'&&/^[\w-]{1,100}$/.test(event.id),'납품 기록을 확인해주세요.');
      assert(Number.isInteger(event.amount)&&event.amount>=0&&event.amount<=600,'납품 수익을 확인해주세요.');
      if(s.credited.includes(event.id))return s;
      book(s,'legacyIncome',event.amount,event.id);s.credited.push(event.id);
    }else if(event.type==='buy'){
      const item=Object.hasOwn(catalog,event.id)?catalog[event.id]:null,theme=themes.find(t=>t.id===event.id),decoration=decorations.find(d=>d.id===event.id);let price;
      if(item){const n=s.levels[event.id];if(event.level!==undefined)assert(event.level===n,'장비 단계가 변경됐습니다. 다음 단계를 다시 확인해주세요.');assert(n<item.costs.length,'이미 최고 단계입니다.');price=item.costs[n];}
      else if(decoration){assert(!s.decorOwned.includes(decoration.id),'이미 보유한 꾸미기입니다.');price=decoration.price;}
      else{assert(theme&&!s.owned.includes(theme.id),'이미 보유했거나 없는 꾸미기입니다.');price=theme.price;}
      assert(s.balance>=price,'공방 기금이 부족합니다. 주문을 납품하면 기금이 쌓여요.');book(s,'purchase',-price,event.id,Math.max(1,Math.ceil(s.credited.length/3)));
      if(item)s.levels[event.id]++;else if(decoration){s.decorOwned.push(decoration.id);s.placed.push(decoration.id);}else s.owned.push(theme.id);
    }else if(event.type==='equip'){
      assert(s.owned.includes(event.id),'구매한 꾸미기만 적용할 수 있습니다.');if(s.theme===event.id)return s;s.theme=event.id;
    }else if(event.type==='place'||event.type==='store'){
      assert(s.decorOwned.includes(event.id),'구매한 소품만 배치하거나 보관할 수 있어요.');
      const placed=s.placed.includes(event.id);if((event.type==='place')===placed)return s;
      if(event.type==='place')s.placed.push(event.id);else s.placed=s.placed.filter(id=>id!==event.id);
    }else throw new Error('지원하지 않는 공방 작업입니다.');
    s.events.push(JSON.parse(JSON.stringify(event)));return s;
  }
  function serialize(s){return {version,events:s.events};}
  function restore(raw){try{assert([version,legacyVersion,'workshop-v2','workshop-v3'].includes(raw?.version)&&Array.isArray(raw.events)&&raw.events.length<=20000,'공방 저장 형식 오류');let s=create();for(const event of raw.events)s=transition(s,event);return s;}catch{return null;}}
  return Object.freeze({version,legacyVersion,catalog,themes,decorations,appearance,levels,effects,same,create,transition,serialize,restore});
});
