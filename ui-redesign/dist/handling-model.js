/* Presentation only. Never accepts removal, quality, or hidden machine state. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CMPHandling=api;})(typeof globalThis==='undefined'?this:globalThis,function(){
  'use strict';
  const durations={load:1500,unload:1300,measure:3600,scan:2000};
  function frame(kind,progress){
    if(!Object.hasOwn(durations,kind))throw new Error('Unknown handling action');
    const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
    const phase=kind==='measure'?(p<.25?'to-meter':p<.75?'scan':'return'):kind;
    const local=kind==='measure'?(p<.25?p*4:p<.75?(p-.25)*2:(p-.75)*4):p;
    return {kind,phase,progress:p,local};
  }
  function createPlayer({requestFrame,cancelFrame,now,onFrame,onComplete}){
    let id=null,generation=0,kind=null,start=0;
    function cancel(){generation++;if(id!==null)cancelFrame(id);id=null;kind=null;}
    function finish(){if(!kind)return;const k=kind;cancel();onFrame(frame(k,1));onComplete(k);}
    function play(next,{reducedMotion=false,atScanner=false}={}){
      cancel();frame(next,0);kind=next;const initial=atScanner && kind==='measure' ? .25 : 0;start=now()-initial*durations[kind];const token=generation;
      onFrame(frame(kind,initial));if(reducedMotion){finish();return;}
      function tick(){if(token!==generation||!kind)return;const p=(now()-start)/durations[kind];if(p>=1){finish();return;}onFrame(frame(kind,p));id=requestFrame(tick);}
      id=requestFrame(tick);
    }
    return {play,cancel,finish};
  }
  return {durations,frame,createPlayer};
});
