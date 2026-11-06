// End-to-end check against a running local API and the supplied model bundle.
// Uses synthetic records only; does not train or write to any measurement DB.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const client=require('../dist/mrr-state.js');
const modelPath=process.argv[2];
if(!modelPath)throw new Error('Usage: node tools/verify_mrr_connection.mjs <model.json>');
const model=JSON.parse(await readFile(modelPath,'utf8'));
const payload=client.makePayload(client.createDemo('A456',Date.parse('2026-11-02T00:00:00Z')));
const envelope=await client.requestPrediction(payload,{signal:AbortSignal.timeout(5000)});
const values=[1,0,(75-model.numeric_mean[0])/model.numeric_scale[0],(73.728-model.numeric_mean[1])/model.numeric_scale[1]];
const expected=model.intercept+values.reduce((sum,value,index)=>sum+value*model.coefficients[index],0);
assert.ok(Math.abs(envelope.result.final_mrr-expected)<1e-10);
assert.equal(envelope.result.model_version,model.model_version);
assert.equal(envelope.result.history_count,4);
assert.equal(envelope.result.state_ewm,73.728);
const future=structuredClone(payload);
future.history.at(-1).measurement_completed_at=future.wafer_start_at;
await assert.rejects(client.requestPrediction(future),/측정 완료 조건/);
const unknown=structuredClone(payload);unknown.p_main=260;
await assert.rejects(client.requestPrediction(unknown));
const response=await fetch('http://127.0.0.1:8000/api/v1/capabilities',{
  headers:{Origin:'http://127.0.0.1:8510'},signal:AbortSignal.timeout(5000)});
assert.equal(response.headers.get('access-control-allow-origin'),'http://127.0.0.1:8510');
const capabilities=await response.json();
assert.equal(capabilities.pressure_correction_enabled,false);
assert.equal(capabilities.polishing_time_numerical_output,'disabled');
console.log(JSON.stringify({input_source:'synthetic',model_version:model.model_version,
  expected_mrr:expected,api_mrr:envelope.result.final_mrr,
  checks:{artifact_prediction_matches_api:'PASS',future_measurement_rejected:'PASS',
    sensor_input_rejected:'PASS',web_origin_allowed:'PASS',pressure_correction_disabled:'PASS',
    numerical_time_disabled:'PASS'},independent_validation:false},null,2));
