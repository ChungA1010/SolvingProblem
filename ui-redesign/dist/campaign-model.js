/* Shared teaching-game wallet. Replayed transactions are the sole source of balance. */
(function(root,factory){
  const api=factory(typeof module==='object'?require('./game-model.js'):root.CMPFactory,
    typeof module==='object'?require('./factory-upgrades.js'):root.CMPUpgrades);
  if(typeof module==='object')module.exports=api;else root.CMPCampaign=api;
})(globalThis,function(game,upgrades){
  'use strict';
  const validId=id=>typeof id==='string'&&/^[\w-]{1,100}$/.test(id);
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  function initialize(growth){
    return upgrades.transition(growth,{type:'campaignInitialize'});
  }
  function sync(growth,runId,session){
    assert(validId(runId),'주문 기록을 확인해주세요.');
    if(session.version!==game.fundedVersion){
      if(session.phase!=='settled')return growth;
      const bill=game.summary(session);
      return upgrades.transition(growth,{type:'income',id:runId,amount:Math.max(0,bill.revenue-bill.spent)});
    }
    const bill=game.summary(session);
    const previous=growth.operating.find(record=>record.id===runId);
    if(!previous)assert(session.initialWallet===growth.balance,'주문 시작 자금과 공방 잔액이 다릅니다. 최신 진행을 다시 불러와주세요.');
    assert(session.wallet===session.initialWallet-bill.spent+(session.phase==='settled'?bill.revenue:0),'주문 자금 기록이 일치하지 않습니다.');
    const next=upgrades.transition(growth,{type:'operating',id:runId,cost:bill.spent,
      revenue:session.phase==='settled'?bill.revenue:0,settled:session.phase==='settled'});
    if(session.phase!=='settled')assert(next.balance===session.wallet,'진행 중인 주문과 공방 잔액이 다릅니다. 최신 진행을 다시 불러와주세요.');
    return next;
  }
  function canSupport(growth,id){
    return growth.campaignInitialized===true&&validId(id)&&growth.balance<40&&!growth.supports.includes(id);
  }
  function support(growth,id){
    return upgrades.transition(growth,{type:'campaignSupport',id});
  }
  function dailySummary(growth,day=Math.floor(growth.credited.length/3)+1){
    assert(Number.isInteger(day)&&day>=1,'영업일을 확인해주세요.');
    const entries=growth.cashflow.filter(entry=>entry.day===day);
    const sum=kind=>entries.filter(entry=>entry.kind===kind).reduce((total,entry)=>total+entry.amount,0);
    const revenue=sum('sale'),costs=-sum('cost'),legacyIncome=sum('legacyIncome');
    const prior=growth.cashflow.filter(entry=>entry.day<day).at(-1);
    const opening=entries[0]?.before??prior?.after??0;
    return {day,orders:entries.filter(entry=>entry.kind==='sale'||entry.kind==='legacyIncome').length,
      opening,balance:entries.at(-1)?.after??opening,revenue,costs,support:sum('support'),
      initial:sum('initial'),purchases:-sum('purchase'),legacyIncome,profit:revenue-costs+legacyIncome};
  }
  return Object.freeze({initialize,sync,support,canSupport,dailySummary});
});
