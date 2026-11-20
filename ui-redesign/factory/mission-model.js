(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.CMPDemo);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.CMPMission=api;
})(typeof globalThis==='undefined'?this:globalThis,function(engine){
  'use strict';
  const config=Object.freeze({target:72.30,tolerance:0.20,recipe:'A456',maxAttempts:5});
  const fields=['pressure',...engine.educationalFields.map(field=>field.key)];
  function inputFor(values){
    const changes=typeof values==='number'?{pressure:values}:values;
    return {...engine.educationalDefaults(config.recipe),...Object.fromEntries(fields.filter(key=>changes&&Object.hasOwn(changes,key)).map(key=>[key,changes[key]]))};
  }
  function create(){return {...inputFor(),attempts:0,last:null,trials:[]};}
  function status(state){return state.last?.achieved?'won':state.attempts>=config.maxAttempts?'lost':'playing';}
  function edit(state,values){return status(state)==='playing'?{...state,...inputFor({...state,...(typeof values==='number'?{pressure:values}:values)})}:state;}
  function evaluate(values){
    const input=inputFor(values),result=engine.calculate(input);
    // Match the two-decimal result shown to beginners, including both endpoints.
    const value=Math.round(result.mrr*100),target=Math.round(config.target*100),tolerance=Math.round(config.tolerance*100);
    const achieved=Math.abs(value-target)<=tolerance;
    const direction=achieved?'matched':value>target?'high':'low';
    return {input,result,achieved,direction,displayed:value/100,delta:(value-target)/100,
      hint:achieved?'목표 범위에 도달했습니다. 서로 다른 변수 조합으로도 같은 MRR을 만들 수 있어요.':direction==='high'?'목표보다 높습니다. 네 변수 중 하나를 조금 낮춰 보세요. 한 번에 하나씩 바꾸면 영향을 비교하기 쉽습니다.':'목표보다 낮습니다. 네 변수 중 하나를 조금 높여 보세요. 이 방향은 교육용 계산식의 가정입니다.'};
  }
  function run(state){
    if(status(state)!=='playing')throw new Error('종료된 도전입니다. 새 도전을 시작하세요.');
    const last=evaluate(state);
    return {...state,attempts:state.attempts+1,last,trials:[...state.trials,last]};
  }
  function summary(state){
    const cents=trial=>Math.round(Math.abs(trial.delta)*100);
    const best=state.trials.reduce((found,trial,index)=>!found||cents(trial)<cents(found.trial)?{trial,index}:found,null);
    const previous=state.trials.at(-2);
    return {status:status(state),remaining:Math.max(0,config.maxAttempts-state.attempts),
      bestIndex:best?.index??null,bestError:best?cents(best.trial)/100:null,
      error:state.last?cents(state.last)/100:null,
      improvement:previous?(cents(previous)-cents(state.last))/100:null};
  }
  function isCurrent(state){return Boolean(state.last&&fields.every(key=>state.last.input[key]===state[key]));}
  function bounds(){const r=engine.recipes[config.recipe];const edge=(pressure,end)=>inputFor({pressure,...Object.fromEntries(engine.educationalFields.map(f=>[f.key,f[end]]))});return {min:engine.calculate(edge(r.min,'min')).mrr,max:engine.calculate(edge(r.max,'max')).mrr};}
  return Object.freeze({config,inputFor,create,edit,evaluate,run,isCurrent,bounds,status,summary});
});
