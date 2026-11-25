/* Narrative and transparent customer goals; never modifies the CMP calculation or payout. */
(function(root,factory){const api=factory(typeof module==='object'?require('./game-model.js'):root.CMPFactory);if(typeof module==='object')module.exports=api;else root.CMPCustomers=api;})(globalThis,function(game){
  'use strict';
  const version='customer-story-v1';
  const customers=Object.freeze([
    Object.freeze({id:'research',name:'서윤',role:'NOVA · 공정 연구원',focus:'정밀도 우선',color:'#99c9ec',symbol:'◎'}),
    Object.freeze({id:'startup',name:'도현',role:'ORBIT · 스타트업 개발자',focus:'예산 우선',color:'#b6d9b5',symbol:'◇'}),
    Object.freeze({id:'production',name:'민재',role:'LUMEN · 생산 담당자',focus:'납기 우선',color:'#efc098',symbol:'◷'}),
    Object.freeze({id:'lee',name:'이재용',role:'가상 특별 손님',focus:'장간 편차',color:'#a9becd',symbol:'◎'}),
    Object.freeze({id:'jensen',name:'젠슨 황',role:'가상 특별 손님',focus:'시연 납기',color:'#aebc90',symbol:'◷'}),
    Object.freeze({id:'mirae',name:'미래',role:'다시소리 · 음향기사',focus:'장간 편차',color:'#dfb08d',symbol:'≈'}),
    Object.freeze({id:'nuru',name:'누리',role:'새잎온실 · 온실지기',focus:'측정 예산',color:'#afc59a',symbol:'◇'}),
    Object.freeze({id:'taeo',name:'태오',role:'별마루천문대 · 관측 장비팀',focus:'연마 시간',color:'#a9bad5',symbol:'◷'})
  ]);
  const contracts=Object.freeze([
    {customer:0,returning:false,metric:'error',limit:4,badge:'꼼꼼한 첫 납품',purpose:'온도 센서 연구용 시험 웨이퍼',opening:'온도 센서 연구에 쓸 웨이퍼 여섯 장 부탁드려요. 실험을 비교할 거라, 주문서에 적힌 만큼 깎아주시면 좋겠어요.'},
    {customer:1,returning:false,metric:'cost',limit:10,badge:'알뜰한 운영',purpose:'손목형 활동량 측정기 첫 시제품',opening:'손목형 활동량 측정기에 쓸 센서를 만들고 있어요. 쓸 수 있는 웨이퍼를 확보하면서, 측정·정비는 10 P 안으로 부탁드릴게요.'},
    {customer:2,returning:false,metric:'time',limit:900,badge:'약속한 납기',purpose:'공장 검사 장비용 광센서 시험생산',opening:'공장 검사 장비용 광센서에 쓸 여섯 장, 총 연마 시간 900초 안으로 부탁드려요. 장비를 방금 켰다니 첫 장은 잘 살펴봐 주세요.'},
    {customer:0,returning:true,metric:'error',limit:2.5,badge:'정밀 연구 파트너',purpose:'온도 센서 제작 조건 비교 실험',opening:'온도 센서 실험 때문에 또 왔어요. 이번에는 더 정밀하게 비교하려고 하니, 주문서의 새 오차 기준으로 부탁드릴게요.'},
    {customer:1,returning:true,metric:'cost',limit:5,badge:'믿고 맡기는 파트너',purpose:'손목형 활동량 측정기 후속 시제품',opening:'활동량 측정기를 더 작게 만들어보려고요. 이번에는 허용 오차가 좁아졌는데, 측정·정비도 5 P 안으로 가능할까요?'},
    {customer:3,returning:false,metric:'spread',limit:8,badge:'고른 여섯 장',purpose:'메모리 공정 비교용 시험 웨이퍼',opening:'메모리 공정 비교에 쓸 시료를 부탁드리려고요. 첫 장이랑 마지막 장이 많이 다르면 비교하기가 어렵거든요. 한 장에 150 nm씩, 여섯 장을 고르게 맞춰주실 수 있을까요?'},
    {customer:4,returning:false,metric:'time',limit:720,badge:'시연 준비 완료',purpose:'AI 가속기 시연을 위한 공정 시료',opening:'시연에 가져갈 웨이퍼 여섯 장, 부탁드려요. 한 장에 140 nm씩 깎아야 하는데 장비는 총 12분만 쓸 수 있어요. 시간 안에 규격을 맞출 수 있을까요?'},
    {customer:5,returning:false,metric:'spread',limit:6,badge:'좌우 한 쌍',purpose:'복원 마이크의 좌우 센서 비교용 시편',
      opening:'오래된 스테레오 마이크를 수리하고 있어요. 좌우 소리를 비교해 볼 건데, 센서 시험에 쓸 웨이퍼 여섯 장을 고르게 깎아 주실래요?',
      specLead:'두 장씩 짝지어 쓸 거예요.',priorityLead:'짝을 바꿔도 비교할 수 있게 여섯 장을 전부 보내 주세요.',
      advice:'첫 장을 하나 재고, 뒤쪽에서 하나 더 재 보면 어때요? 비슷하게 시작했는데 갈수록 차이가 벌어질 때가 있더라고요.',
      empty:'오늘은 받아 갈 시편이 없네요. 마이크는 수리대에 두고 다음에 다시 올게요.',
      partialAccepted:'이걸로 먼저 좌우 센서 한 쌍을 시험해 볼게요.',partialRetry:'비교용 여분까지 세 장은 있어야 테스트를 시작할 수 있어요.'},
    {customer:6,returning:false,metric:'cost',limit:5,badge:'온실 살림꾼',purpose:'온실 습도 센서 교정용 시편',
      opening:'아침마다 유리온실 습도계 두 개가 딴소리를 해요. 새 센서를 교정할 시편 여섯 장을 부탁드려요. 이번 달 남은 검사비가 좀 빠듯해요.',
      specLead:'온실 안쪽과 입구에 놓을 센서를 같이 교정하려고요.',priorityLead:'측정 한 번 값만 따로 챙겨 왔어요.',
      advice:'첫 장을 재고 시간을 조금 손보면, 뒤쪽 장들은 그 값을 참고해 볼 수 있겠죠? 어느 장에 측정비를 쓸지는 맡길게요.',
      empty:'빈손으로 돌아가네요. 오늘은 손으로 습도를 기록하고 있을게요.',
      partialAccepted:'일단 이 시편들로 온실 한 동부터 교정해 볼게요.',partialRetry:'온실 한 동에서 비교하려면 쓸 수 있는 시편이 세 장은 필요해요.'},
    {customer:7,returning:false,metric:'time',limit:750,badge:'첫 별이 뜨기 전에',purpose:'천문대 별빛 검출기 시험용 시편',
      opening:'오늘 밤은 오랜만에 하늘이 맑대요. 별빛 검출기를 시험할 웨이퍼 여섯 장을 찾으러 왔어요. 장비를 빌린 시간이 12분 30초인데, 그 안에 연마해 주실 수 있을까요?',
      specLead:'같은 검출기에서 번갈아 시험할 시편이에요.',priorityLead:'저녁에 검출기를 조립해야 해서 여섯 장 모두 필요해요.',
      advice:'한 장에 평균 125초씩 쓸 수 있어요. 첫 장에 더 썼다면 남은 시간을 남은 장수로 다시 나눠 봐 주세요.',
      empty:'오늘 관측은 기존 검출기로 가야겠네요. 다음 맑은 밤에 다시 부탁드릴게요.',
      partialAccepted:'받은 시편부터 검출기에 올려 두면 오늘 예비 시험은 해 볼 수 있겠어요.',partialRetry:'오늘 예비 시험에 필요한 세 장을 채우려면 한 번 더 와야겠어요.'}
  ].map(Object.freeze));
  const questionList=Object.freeze([
    Object.freeze({id:'spec',label:'얼마나 깎아드리면 될까요?'}),
    Object.freeze({id:'priority',label:'특히 신경 쓸 부분이 있을까요?'}),
    Object.freeze({id:'advice',label:'미리 알아둘 게 있을까요?'})
  ]);
  function contract(index){const c=contracts[index],o=game.orders[index];if(!c||!o)throw new Error('지원하지 않는 고객 주문입니다.');return {...c,profile:customers[c.customer],order:o};}
  function goalLabel(index){const c=contract(index);return c.metric==='spread'?`여섯 장의 최대·최소 제거량 차이 ${c.limit} nm 이하`:c.metric==='error'?`평균 절대 목표 오차 ${c.limit}% 이하`:c.metric==='cost'?`측정·정비 비용 ${c.limit} P 이하`:`6장 납품 · 연마 시간 합계 ${c.limit}초 이하`;}
  function answer(index,key){
    const c=contract(index),o=c.order;
    const range=`${(o.target*(1-o.tolerance/100)).toFixed(1)}–${(o.target*(1+o.tolerance/100)).toFixed(1)} nm`;
    if(key==='spec' && c.specLead)return `${c.specLead} ${o.count}장, 한 장당 ${o.target} nm에 ±${o.tolerance}%로 부탁드려요. ${range}면 쓸 수 있어요.`;
    if(key==='priority' && c.priorityLead)return `${c.priorityLead} 규격에 맞는 시편은 세 장 이상, 추가 목표는 ‘${goalLabel(index)}’예요.`;
    if(key==='advice' && c.advice)return c.advice;
    if(key==='spec')return c.profile.id==='research'
      ?`웨이퍼 ${o.count}장이고, 한 장마다 ${o.target} nm씩 깎으려고 해요. 허용 오차는 ±${o.tolerance}%라서, ${range} 사이면 쓸 수 있어요.`
      :c.profile.id==='startup'
        ?`${o.count}장 부탁드릴게요. 한 장에 ${o.target} nm씩, 오차는 ±${o.tolerance}%까지 괜찮아요. ${range} 사이로 맞춰주시면 돼요.`
        :`${o.count}장 모두 목표 제거량은 ${o.target} nm입니다. 허용 오차는 ±${o.tolerance}%, 범위로는 ${range}예요. 다음 작업에 바로 넘길 수 있도록 부탁드립니다.`;
    if(key==='priority' && o.guest){
      if(c.metric==='spread')return `여섯 장 전체에서 가장 많이 깎인 장과 가장 적게 깎인 장을 봐주세요. 목표는 ‘${goalLabel(index)}’예요. 각 장의 납품 규격도 맞아야 쓸 수 있어요.`;
      return `시연 순서가 잡혀 있어서요. ‘${goalLabel(index)}’를 지켜주세요. 설정한 시간 대신 장비가 실제 연마한 시간을 더해요.`;
    }
    if(key==='priority')return c.metric==='error'
      ?`우선 여섯 장 중 적어도 세 장은 규격 안에 들어와야 해요. 가능하면 주문서의 ‘${goalLabel(index)}’도 맞춰주셨으면 해요. 평균만 맞고 한 장씩 보면 차이가 큰 건 곤란하거든요.`
      :c.metric==='cost'
        ?`실험에 쓸 수 있는 게 최소 세 장은 필요해요. 그걸 맞추면서 ‘${goalLabel(index)}’까지 지켜주시면 정말 도움이 돼요. 측정이든 정비든 필요한 곳에는 쓰되, 둘을 합친 비용을 봐주세요.`
        :`다음 작업에 넘기려면 규격에 맞는 게 최소 세 장은 있어야 해요. 거기에 ‘${goalLabel(index)}’까지 맞으면 일정 잡기가 훨씬 수월해요. 장비가 실제로 연마한 게임 시간을 여섯 장 모두 합쳐서 봐주세요.`;
    if(key==='advice')return [
      '처음 한 장은 측정해보시는 게 어때요? 예상과 실제가 얼마나 다른지 알면, 다음 장 시간을 잡기 한결 수월할 거예요.',
      '장비를 꽤 썼다고 들었어요. 컨디셔너를 교체하면 깎이는 속도도 달라질 수 있다던데, 그전에 잰 값만 믿어도 괜찮을까요?',
      '다시 켠 직후에는 첫 장이 예상보다 덜 깎일 수 있다고 들었어요. 첫 측정값을 다음 장에 그대로 써도 될지 한번 살펴봐 주세요.',
      '이번에는 허용 범위가 좁아서, 조금만 달라져도 실험에 쓰기 어려워요. 측정을 언제 할지 잘 골라주시면 좋겠어요.',
      '첫 장이 잘 나와도 뒤까지 똑같지는 않을 수 있잖아요. 장비 사용량이랑 마지막으로 측정한 시점을 같이 살펴봐 주세요.',
      '처음과 끝에서 제거량이 얼마나 달라질지 궁금하네요. 두 번의 측정을 어느 장에 쓸지 정해보시죠.',
      '무작정 시간을 줄이면 덜 깎일 수도 있겠죠. 회전이나 유량을 조정한 뒤 예상 제거율과 시간을 같이 봐주세요.'
    ][index];
    throw new Error('지원하지 않는 질문입니다.');
  }
  function restoreDialogue(value,index){return value?.version===version&&value.order===index&&Array.isArray(value.asked)?[...new Set(value.asked.filter(id=>questionList.some(q=>q.id===id)))].slice(0,3):[];}
  function ask(asked,key){if(!questionList.some(q=>q.id===key))throw new Error('지원하지 않는 질문입니다.');return [...new Set([...asked,key])];}
  function serializeDialogue(asked,index){return {version,order:index,asked:restoreDialogue({version,order:index,asked},index)};}
  // Saved games use order indices; new orders are appended after the original guests.
  const campaignOrders=Object.freeze(game.orders.map((_,i)=>i).filter(i=>!game.orders[i].guest));
  const firstGuest=game.orders.findIndex(order=>order.guest);
  function restoreBest(value){
    const best=Array(game.orders.length).fill(0);
    if(Array.isArray(value) && [5,7,best.length].includes(value.length) &&
       value.every(n=>Number.isInteger(n)&&n>=0&&n<=3))value.forEach((n,i)=>best[i]=n);
    return best;
  }
  function unlocked(best,index){
    if(!Number.isInteger(index)||!game.orders[index])return false;
    if(game.orders[index].guest)return true;
    const position=campaignOrders.indexOf(index);
    return position===0||Number(best?.[campaignOrders[position-1]])>=1;
  }
  function nextOrder(best,index){
    const position=campaignOrders.indexOf(index);
    const next=campaignOrders[position+1];
    return position>=0&&unlocked(best,next)?next:null;
  }
  function nextCustomer(best,index){
    const followup=nextOrder(best,index);
    if(followup!==null)return followup;
    const available=campaignOrders.filter(i=>unlocked(best,i) && contracts[i].customer!==contracts[index].customer);
    return available.find(i=>!best[i]) ?? available[0] ?? firstGuest;
  }
  function evaluation(state){
    if(!game.inspectionDone(state))return null;
    const c=contract(state.order),s=game.summary(state),qualityMet=s.good>=3;
    const amounts=game.lotRows(state).map(row=>row.removed);
    const value=!amounts.length?null:c.metric==='spread'?Math.max(...amounts)-Math.min(...amounts):c.metric==='error'?s.errors.reduce((n,e)=>n+Math.abs(e),0)/amounts.length:c.metric==='cost'?s.actionCost:state.rows.reduce((n,r)=>n+game.elapsed(r),0);
    const goalMet=value!==null&&value<=c.limit+1e-9&&(!['spread','time'].includes(c.metric)||s.total===game.orders[state.order].count),achieved=qualityMet&&goalMet;
    return {qualityMet,goalMet,achieved,value,limit:c.limit,metric:c.metric,good:s.good,spent:s.spent,revenue:s.revenue,badge:c.badge};
  }
  function reaction(state){
    if(state.phase!=='settled')return null;
    const e=evaluation(state);if(!e)return null;
    const total=game.lotRows(state).length;
    const c=contract(state.order);
    if(!total)return {...e,mood:'retry',title:'납품 없이 주문 마감',message:c.empty??'이번에는 받을 수 있는 웨이퍼가 없군요. 다음번에 다시 부탁드릴게요.'};
    if(total<game.orders[state.order].count){
      const mood=!e.qualityMet?'retry':e.achieved?'delighted':'accepted';
      const result=e.good?`보내주신 ${total}장 중 ${e.good}장이 규격에 맞네요.`:`보내주신 ${total}장을 확인했는데, 이번 실험에 쓸 수 있는 건 없네요.`;
      const reply=e.qualityMet?(c.partialAccepted??'이 시료들은 실험에 가져갈게요.'):(c.partialRetry??'다음에는 규격에 맞는 시료를 세 장 이상 부탁드릴게요.');
      const message=result+' '+reply;
      return {...e,mood,title:e.qualityMet?'부분 납품 완료':'시료 수량 부족',message};
    }
    const valueText=e.metric==='spread'?`${e.value.toFixed(2)} nm`:e.metric==='error'?`${e.value.toFixed(2)}%`:e.metric==='cost'?`${e.value} P`:`${Number(e.value.toFixed(1))}초`;
    const fact=e.metric==='spread'?`가장 많이 깎인 장과 적게 깎인 장의 차이가 ${valueText}네요.`:e.metric==='error'?`한 장씩 목표와 비교한 차이가 평균 ${valueText}네요.`:e.metric==='cost'?`측정이랑 정비에 쓴 비용은 ${valueText}네요.`:`여섯 장을 연마한 시간은 모두 ${valueText}네요.`;
    const mood=!e.qualityMet?'retry':e.achieved?'delighted':'accepted';
    const result=e.good===6?'여섯 장 모두 규격에 맞네요.':`여섯 장 중 ${e.good}장이 규격에 맞네요.`;
    const replies={
      lee:{
        retry:'비교 실험에 쓸 시료가 조금 더 필요해요. 다음에는 기준에 맞는 장을 세 장 이상 확보해 주시겠어요?',
        accepted:'실험에 쓸 장수는 확보됐네요. 다음번에는 처음부터 끝까지 제거량 차이도 조금 더 줄여봅시다.',
        delighted:'이 정도면 여섯 장을 한 세트로 비교할 수 있겠네요. 메모리 실험팀에 잘 가져가겠습니다.'
      },
      jensen:{
        retry:'시연에 올릴 수 있는 시료가 세 장은 필요해요. 다음 차례에는 속도와 규격을 같이 맞춰볼까요?',
        accepted:'시연에 쓸 시료는 나왔군요. 다음에는 장비를 쓰는 시간도 12분 안으로 맞춰봅시다.',
        delighted:'좋아요, 장비 시간도 지켰고 시연에 쓸 시료도 준비됐네요. 바로 다음 공정으로 넘기죠.'
      },
      mirae:{
        retry:'이 장수로는 좌우를 맞춰 보고 다시 확인할 시편이 모자라요. 세 장은 규격에 들어오게 부탁드려요.',
        accepted:'쓸 수 있는 시편끼리 먼저 짝지어 볼게요. 다음엔 가장 많이 깎인 장과 적게 깎인 장도 조금 더 가까웠으면 해요.',
        delighted:'장마다 고르게 나왔네요. 이러면 짝을 바꿔 끼워도 좌우 소리를 비교할 수 있겠어요. 잘 쓸게요!'
      },
      nuru:{
        retry:'두 습도계 중 어느 쪽을 믿어야 할지 아직 모르겠네요. 다음번엔 비교에 쓸 만한 시편 세 장만 꼭 부탁드려요.',
        accepted:'습도 센서 교정은 시작할 수 있겠어요. 다음에는 측정하고 정비하는 비용도 5 P 안에 맞춰 볼까요?',
        delighted:'검사비까지 딱 맞춰 주셨네요. 내일 아침에는 두 습도계를 나란히 놓고 새 시편으로 점검해 볼게요.'
      },
      taeo:{
        retry:'예비 시험에 쓸 시편이 조금 모자라네요. 오늘은 기존 검출기로 관측하고 새 장비 시험은 다음으로 잡을게요.',
        accepted:'쓸 시편은 확보했네요. 조립팀에 조금 늦는다고 먼저 연락해야겠어요. 다음엔 장비 대여 시간 안으로 부탁드려요.',
        delighted:'아직 해가 남았네요. 지금 올라가면 별이 뜨기 전에 검출기를 조립할 수 있겠어요. 고맙습니다!'
      },
      research:{
        retry:'아쉽지만 이 장수로는 온도 센서 실험을 진행하기 어렵겠어요. 우선 3장 이상 쓸 수 있게, 조건을 다시 살펴봐 주시겠어요?',
        delighted:c.returning?'이번처럼 까다로운 조건도 꼼꼼하게 봐주셨네요. 덕분에 온도 센서 제작 조건을 비교할 시료를 준비할 수 있겠어요, 고맙습니다.':'부탁드린 오차까지 맞춰주셨네요. 이 웨이퍼로 온도 센서 연구를 이어갈 수 있겠어요, 고맙습니다.',
        accepted:`필요한 장수는 확보됐으니 이번 건은 받아갈게요. 다음에는 목표와의 차이도 평균 ${c.limit}% 안으로 줄여주시면 좋겠어요.`
      },
      startup:{
        retry:'음, 이 장수로는 활동량 측정기 시제품을 준비하기 어렵겠어요. 비용도 중요하지만 우선 3장 이상은 쓸 수 있어야 하거든요. 한 번 더 부탁드려도 될까요?',
        delighted:c.returning?'이 빠듯한 예산에 필요한 장수까지 맞춰주셨네요! 이제 더 작은 활동량 측정기 시제품을 위한 다음 제작에 들어갈 수 있겠어요, 감사합니다.':'오, 예산 안에서 필요한 장수까지 맞췄네요! 덕분에 활동량 측정기 시제품 준비를 이어갈 수 있겠어요, 감사합니다.',
        accepted:`필요한 장수는 나와서 다행이에요. 다만 예산을 좀 넘겼네요. 다음에는 비용도 ${c.limit} P 안으로 맞출 방법을 찾아봐요.`
      },
      production:{
        retry:'이대로는 광센서 시험생산에 넘길 물량이 부족해요. 우선 3장 이상 규격에 맞추는 것부터 다시 부탁드릴게요. 서두르다 더 많이 깎이지 않게 조심해주세요.',
        delighted:'필요한 장수도 나오고, 약속한 연마 시간 안에도 맞췄네요. 광센서 시험생산의 다음 공정으로 넘기겠습니다, 수고하셨어요.',
        accepted:`필요한 장수는 맞았으니 이번 건은 넘길 수 있겠어요. 다만 연마 시간이 길어졌네요. 다음에는 합계 ${c.limit}초 안으로 부탁드립니다.`
      }
    };
    const message=`${result} ${fact} ${replies[c.profile.id][mood]}`;
    return {...e,mood,title:mood==='retry'?'다음에는 더 잘 맞춰봐요':mood==='delighted'?'고객의 추가 목표까지 달성!':'납품 목표 달성',message};
  }
  return Object.freeze({version,campaignOrders,campaignCount:campaignOrders.length,restoreBest,customers,contracts,questionList,contract,goalLabel,answer,ask,restoreDialogue,serializeDialogue,unlocked,nextOrder,nextCustomer,evaluation,reaction});
});
