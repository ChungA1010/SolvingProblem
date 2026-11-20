(function (root) {
  'use strict';
  function toLocal(iso) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) throw new Error('올바른 시각을 입력하세요.');
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,19);
  }
  function toISO(local) {
    if (typeof local !== 'string' || !local) throw new Error('투입시각과 측정 완료시각을 모두 입력하세요.');
    const date = new Date(local);
    if (!Number.isFinite(date.getTime())) throw new Error('올바른 시각을 입력하세요.');
    return date.toISOString();
  }
  function createDemo(recipe, now = Date.now()) {
    if (!['A456','B456'].includes(recipe)) throw new Error('A456 또는 B456을 선택하세요.');
    const values = recipe === 'A456' ? [72,74,73,75] : [80,82,81,83];
    return {wafer_id:`DEMO-${recipe}-NEXT`, recipe, wafer_start_at:new Date(now+3600000).toISOString(),
      history:values.map((mrr,index) => ({wafer_id:`DEMO-${recipe}-${index+1}`,recipe,mrr,
        wafer_started_at:new Date(now-(5-index)*3600000).toISOString(),
        measurement_completed_at:new Date(now-(5-index)*3600000+900000).toISOString()}))};
  }
  function makePayload(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('예측 요청 형식을 확인하세요.');
    const allowed=['mode','wafer_id','recipe','wafer_start_at','history'];
    if(Object.keys(input).some(key=>!allowed.includes(key))) throw new Error('측정 이력 요청에 압력 등 다른 계산 입력을 섞을 수 없습니다.');
    if (!['A456','B456'].includes(input.recipe)) throw new Error('A456 또는 B456을 선택하세요.');
    const wafer_id = String(input.wafer_id || '').trim();
    if (!wafer_id) throw new Error('현재 웨이퍼 ID를 입력하세요.');
    if (!Array.isArray(input.history) || !input.history.length) throw new Error('측정 이력을 한 건 이상 입력하세요.');
    const history = input.history.map(item => {
      if(!item || typeof item !== 'object' || Array.isArray(item))throw new Error('측정 이력 형식을 확인하세요.');
      if (!String(item.wafer_id || '').trim()) throw new Error('과거 웨이퍼 ID를 입력하세요.');
      if (!['A456','B456'].includes(item.recipe)) throw new Error('이력 레시피를 확인하세요.');
      const mrr = (typeof item.mrr !== 'string' && typeof item.mrr !== 'number') ||
        (typeof item.mrr === 'string' && !item.mrr.trim()) ? NaN : Number(item.mrr);
      if (!Number.isFinite(mrr) || mrr <= 0) throw new Error('실측 MRR은 0보다 큰 유한한 숫자여야 합니다.');
      return {wafer_id:String(item.wafer_id).trim(),recipe:item.recipe,mrr,
        wafer_started_at:toISO(item.wafer_started_at),measurement_completed_at:toISO(item.measurement_completed_at)};
    });
    return {mode:'expert',wafer_id,recipe:input.recipe,wafer_start_at:toISO(input.wafer_start_at),history};
  }
  async function requestPrediction(payload, {fetchImpl, base='http://127.0.0.1:8000', signal} = {}) {
    let response;
    try {
      response = await (fetchImpl || root.fetch)(base+'/api/v1/predictions', {
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal});
    } catch(error) {
      if (error.name === 'AbortError') throw error;
      throw new Error('모델 서버에 연결할 수 없습니다. 예측을 생성하지 않았습니다. 로컬 모델 API 실행 상태를 확인하세요.');
    }
    let envelope;
    try {envelope=await response.json();} catch {throw new Error('모델 서버 응답을 해석할 수 없습니다.');}
    if (!response.ok || envelope.status !== 'OK') {
      const message=envelope.error?.message || '모델 예측 요청이 거부됐습니다.';
      if (message.includes('prior wafer measured before')) throw new Error('투입 전 측정 완료 조건 위반: 과거 투입·측정 완료시각은 현재 투입보다 이전이어야 합니다.');
      if (message.includes('Duplicate or current')) throw new Error('중복된 웨이퍼 또는 현재 웨이퍼가 이력에 포함돼 있습니다.');
      if (message.includes('same-recipe MRR')) throw new Error('같은 레시피의 측정 완료 이력이 필요합니다.');
      throw new Error(message);
    }
    const result=envelope.result;
    if (envelope.result_kind !== 'DATA_DRIVEN_STATE_FORECAST' || !result ||
        !Number.isFinite(result.final_mrr) || result.final_mrr <= 0 ||
        !Number.isFinite(result.prev_mrr) || !Number.isFinite(result.state_ewm) ||
        result.recipe !== payload.recipe || result.wafer_id !== payload.wafer_id ||
        result.recommended_polishing_time !== null || result.applied_correction !== 0 ||
        result.correction_enabled !== false || result.mrr_unit !== 'UNIT_UNVERIFIED' ||
        typeof result.model_version !== 'string' || !Array.isArray(result.warnings)) {
      throw new Error('모델 응답의 버전 또는 출력 계약이 일치하지 않습니다.');
    }
    return envelope;
  }
  const api={toLocal,toISO,createDemo,makePayload,requestPrediction};
  if (typeof module !== 'undefined' && module.exports) {module.exports=api;return;}
  root.CMPStateMRR=api;
  const $=id=>document.getElementById(id);
  if (!$('mrr-form')) return;
  const base=root.CMP_MRR_API_BASE || 'http://127.0.0.1:8000';
  let revision=0, active=null, exportable=null, source='manual', checking=false;
  function invalidate() {
    revision++; active?.abort(); active=null;exportable=null;
    $('mrr-result').hidden=true;$('mrr-error').hidden=true;
    $('mrr-result-status').textContent='입력 변경 · 다시 예측해주세요.';
    $('mrr-result-status').dataset.stale='true';
    $('mrr-submit').disabled=false;$('mrr-submit').textContent='MRR 예측 실행';
  }
  function setSource(value) {
    source=value;$('mrr-source').dataset.synthetic=String(value==='synthetic');
    $('mrr-source').textContent=value==='synthetic'
      ? '가상 이력 체험 · 아래 시각과 MRR은 형식 설명용 가상 값이며 실제 PHM 측정이나 독립 검증 자료가 아닙니다.'
      : '직접 입력·파일 이력 · 실제 측정 여부와 전체 이력의 완전성은 입력자가 확인해야 합니다.';
  }
  function showError(message) {$('mrr-error').textContent=message;$('mrr-error').hidden=false;}
  function addRow(item={}) {
    const tr=document.createElement('tr');
    for(const field of ['wafer_id','recipe','wafer_started_at','measurement_completed_at','mrr']) {
      const td=document.createElement('td');
      const el=document.createElement(field==='recipe'?'select':'input');
      if(field==='recipe') for(const recipe of ['A456','B456']) {const option=document.createElement('option');option.textContent=recipe;el.append(option);}
      else {el.type=field==='mrr'?'number':field.includes('_at')?'datetime-local':'text';el.required=true;if(field==='mrr'){el.min='0.000000001';el.step='any';}else if(field.includes('_at'))el.step='1';}
      el.dataset.field=field;el.setAttribute('aria-label',({wafer_id:'과거 웨이퍼 ID',recipe:'이력 레시피',wafer_started_at:'과거 투입시각',measurement_completed_at:'MRR 측정 완료시각',mrr:'과거 실측 MRR'})[field]);
      if(item[field] !== undefined) el.value=field.includes('_at')?toLocal(item[field]):item[field];
      else if(field==='recipe')el.value=$('mrr-recipe').value;
      td.append(el);tr.append(td);
    }
    const td=document.createElement('td'),button=document.createElement('button');
    button.type='button';button.textContent='삭제';button.setAttribute('aria-label','해당 측정 이력 삭제');
    button.addEventListener('click',()=>{tr.remove();invalidate();});td.append(button);tr.append(td);
    $('mrr-history').append(tr);
  }
  function fillRequest(payload) {
    const clean=makePayload(payload);
    // Validate all timestamp conversions before replacing current form values.
    $('mrr-wafer').value=clean.wafer_id;$('mrr-recipe').value=clean.recipe;
    $('mrr-start').value=toLocal(clean.wafer_start_at);$('mrr-history').replaceChildren();clean.history.forEach(addRow);
    invalidate();
  }
  function readForm() {
    return makePayload({wafer_id:$('mrr-wafer').value,recipe:$('mrr-recipe').value,wafer_start_at:$('mrr-start').value,
      history:Array.from($('mrr-history').children,tr=>Object.fromEntries(Array.from(tr.querySelectorAll('[data-field]'),el=>[el.dataset.field,el.value])))});
  }
  function render(envelope) {
    const result=envelope.result, format=value=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:4}).format(value);
    $('mrr-value').textContent=format(result.final_mrr);$('mrr-prev').textContent=format(result.prev_mrr);
    $('mrr-ewma').textContent=format(result.state_ewm);$('mrr-count').textContent=result.history_count+'건';
    $('mrr-support').textContent=({WITHIN_MARGINAL_TRAINING_RANGES:'단변량 범위 내',OUTSIDE_TRAINING_RANGE:'범위 밖 · 해석 주의',UNKNOWN:'확인 불가'})[result.state_support]||'확인 불가';
    $('mrr-model-version').textContent='모델 버전 · '+result.model_version;
    $('mrr-warnings').replaceChildren();
    const warnings=['이전 같은 레시피 MRR이 투입 전에 측정 완료된 N=0 조건입니다.','독립 최종 검증이 없는 개발용 모델입니다.','EWMA 재현에는 같은 레시피의 전체 가용 이력이 필요합니다.'];
    if(source==='synthetic')warnings.unshift('가상 측정값으로 모델 호출을 체험한 결과입니다. 실측 검증이 아닙니다.');
    if(result.state_support==='OUTSIDE_TRAINING_RANGE')warnings.push('입력 상태가 학습 데이터의 단변량 범위를 벗어났습니다.');
    else if(result.state_support==='UNKNOWN')warnings.push('학습 상태 범위를 확인할 수 없습니다.');
    warnings.forEach(text=>{const li=document.createElement('li');li.textContent=text;$('mrr-warnings').append(li);});
    $('mrr-chart').replaceChildren();
    const values=[['최근 실측',result.prev_mrr],['EWMA 상태',result.state_ewm],['예상 MRR',result.final_mrr]];
    const max=Math.max(...values.map(pair=>pair[1]));
    values.forEach(([label,value])=>{
      const row=document.createElement('div');row.className='mrr-chart-row';
      const name=document.createElement('span');name.textContent=label;
      const track=document.createElement('div');track.className='mrr-chart-track';
      const bar=document.createElement('div');bar.className='mrr-chart-bar';bar.style.width=(100*value/max)+'%';track.append(bar);
      const number=document.createElement('span');number.textContent=format(value);row.append(name,track,number);$('mrr-chart').append(row);
    });
    $('mrr-result').hidden=false;$('mrr-result-status').dataset.stale='false';
    $('mrr-result-status').textContent=source==='synthetic'?'가상 이력으로 실제 모델 호출 완료':'측정 이력으로 모델 호출 완료 · 실측 여부는 별도 확인';
  }
  async function checkConnection() {
    if(checking)return;checking=true;
    try {
      const response=await root.fetch(base+'/api/v1/capabilities',{signal:AbortSignal.timeout(5000)});
      const data=await response.json();
      if(!response.ok||!data.model_version||data.pressure_correction_enabled!==false)throw new Error();
      $('mrr-connection').textContent='Ridge 모델 연결됨';
    } catch {$('mrr-connection').textContent='모델 연결 확인 필요';}
    finally {checking=false;}
  }
  $('mrr-add').addEventListener('click',()=>{addRow();invalidate();});
  $('mrr-form').addEventListener('input',()=>invalidate());
  $('mrr-demo').addEventListener('click',()=>{fillRequest(createDemo($('mrr-recipe').value));setSource('synthetic');});
  $('mrr-import').addEventListener('change',async()=>{
    const file=$('mrr-import').files[0];if(!file)return;
    invalidate();const version=revision;
    try {
      if(file.size>1048576)throw new Error('JSON 파일은 1 MiB 이하여야 합니다.');
      const parsed=JSON.parse(await file.text());if(version!==revision)return;
      fillRequest(parsed.request || parsed);setSource(parsed.input_source==='synthetic'?'synthetic':'manual');
    } catch(error) {if(version===revision)showError('불러오기 실패: '+error.message);}
    finally {$('mrr-import').value='';}
  });
  $('mrr-form').addEventListener('submit',async event=>{
    event.preventDefault();invalidate();const version=revision;
    const controller=new AbortController();active=controller;
    const timeout=setTimeout(()=>controller.abort(),10000);
    try {
      const payload=readForm();$('mrr-submit').disabled=true;$('mrr-submit').textContent='모델 계산 중…';
      const envelope=await requestPrediction(payload,{base,signal:controller.signal});
      if(version!==revision)return;
      render(envelope);exportable={input_source:source,request:payload,response:envelope};
      $('mrr-connection').textContent='Ridge 모델 연결됨';
    } catch(error) {
      if(version!==revision)return;
      showError(error.name==='AbortError'?'모델 응답 시간이 초과됐습니다. 다시 실행해주세요.':error.message);
      $('mrr-result-status').textContent='예측 실패 · 결과를 생성하지 않았습니다.';
    } finally {
      clearTimeout(timeout);if(version===revision){active=null;$('mrr-submit').disabled=false;$('mrr-submit').textContent='MRR 예측 실행';}
    }
  });
  $('mrr-download').addEventListener('click',()=>{
    if(!exportable)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(exportable,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='mrr-state-prediction.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('mrr-start').value=toLocal(new Date().toISOString());addRow();
  if(location.hash==='#prediction')checkConnection();
  root.addEventListener('hashchange',()=>{if(location.hash==='#prediction')checkConnection();});
})(typeof globalThis!=='undefined'?globalThis:this);
