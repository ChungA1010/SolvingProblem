const test = require('node:test');
const assert = require('node:assert/strict');
const client = require('../dist/mrr-state.js');

function response(payload) {
  return {status:'OK',result_kind:'DATA_DRIVEN_STATE_FORECAST',result:{wafer_id:payload.wafer_id,
    recipe:payload.recipe,final_mrr:74,prev_mrr:75,state_ewm:73.7,model_version:'fixture',
    applied_correction:0,correction_enabled:false,recommended_polishing_time:null,
    mrr_unit:'UNIT_UNVERIFIED',warnings:[]}};
}
test('demo is an explicit synthetic history with no current target or sensor values',()=>{
  const payload=client.makePayload(client.createDemo('A456',Date.parse('2026-11-02T00:00:00Z')));
  assert.equal(payload.history.length,4);
  assert.ok(payload.wafer_id.startsWith('DEMO-'));
  assert.deepEqual(Object.keys(payload).sort(),['mode','wafer_id','recipe','wafer_start_at','history'].sort());
  for(const row of payload.history)assert.ok(Date.parse(row.measurement_completed_at)<Date.parse(payload.wafer_start_at));
  assert.equal(payload.history.at(-1).mrr,75);
});
test('timezone conversion roundtrips without changing timestamp instants',()=>{
  const iso='2026-11-02T00:12:34.000Z';
  assert.equal(client.toISO(client.toLocal(iso)),iso);
});
test('state inputs cannot be silently replaced by educational controls or booleans',()=>{
  const demo=client.createDemo('A456');
  assert.throws(()=>client.makePayload({...demo,pressure:260}));
  for(const mrr of [true,null,'',NaN,Infinity,-1,0]){
    const changed=structuredClone(demo);changed.history[0].mrr=mrr;
    assert.throws(()=>client.makePayload(changed));
  }
  assert.throws(()=>client.makePayload({...demo,history:[]}));
});
test('API receives measured-history request, not the educational engine input',async()=>{
  const payload=client.makePayload(client.createDemo('B456'));
  let actual;
  const result=await client.requestPrediction(payload,{fetchImpl:async(url,options)=>{
    actual=JSON.parse(options.body);assert.equal(options.method,'POST');
    assert.equal(url,'http://127.0.0.1:8000/api/v1/predictions');
    return {ok:true,json:async()=>response(payload)};
  }});
  assert.deepEqual(actual,payload);assert.equal(result.result.final_mrr,74);
});
test('server failures never invoke educational arithmetic as a fallback',async()=>{
  const payload=client.makePayload(client.createDemo('A456'));
  await assert.rejects(client.requestPrediction(payload,{fetchImpl:async()=>{throw new Error('offline');}}),/연결할 수 없습니다/);
  await assert.rejects(client.requestPrediction(payload,{fetchImpl:async()=>({ok:false,json:async()=>({error:{message:'N=0 requires a prior wafer measured before the current start'}})})}),/측정 완료 조건/);
});
test('unexpected MRR unit, pressure correction or nonfinite outputs are rejected',async()=>{
  const payload=client.makePayload(client.createDemo('A456'));
  for(const change of [{final_mrr:NaN},{applied_correction:2},{recommended_polishing_time:100},
    {mrr_unit:'um/min'},{recipe:'B456'},{model_version:null}]){
    const data=response(payload);Object.assign(data.result,change);
    await assert.rejects(client.requestPrediction(payload,{fetchImpl:async()=>({ok:true,json:async()=>data})}),/출력 계약/);
  }
});
