/* Presentation only. No campaign events, random outcomes or economic effects. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CMPShop=api;})(globalThis,function(){
  'use strict';
  const portraits=Object.freeze({research:'seoyun',startup:'dohyeon',production:'minjae',lee:'lee',jensen:'jensen'});
  function artwork(customer,mood='neutral'){
    const person=portraits[customer]||portraits.research;
    const expression=mood==='retry'?2:['delighted','accepted'].includes(mood)?1:0;
    return {src:`./media/counter-art/${person}-expressions.png`,position:`${expression*50}% 0`,label:['기본','만족','아쉬움'][expression]};
  }
  function lines(text){return String(text||'').match(/.+?(?:[.!?。！？](?=\s|$)|$)/gs)?.map(s=>s.trim()).filter(Boolean)||[''];}
  function create({schedule=setTimeout,cancel=clearTimeout,onChange=()=>{}}={}){
    let key=null,timer=null,epoch=0,current={visible:false,phase:'hidden',index:0,lines:[''],mood:'neutral'};
    function publish(){onChange({...current,lines:[...current.lines],last:current.index===current.lines.length-1});}
    function stop(){epoch++;if(timer!==null)cancel(timer);timer=null;}
    function ready(){stop();if(!current.visible)return;current.phase='talking';publish();}
    function enter({id,text,delivery=false,mood='neutral',reduced=false}){
      if(key===id)return;stop();key=id;
      current={visible:true,phase:reduced?'talking':delivery?'delivery':'arriving',index:0,lines:lines(text),mood};publish();
      if(!reduced){const ticket=epoch;timer=schedule(()=>{if(ticket===epoch)ready();},delivery?750:1100);}
    }
    function say(text){ready();current.lines=lines(text);current.index=0;publish();}
    function next(){if(current.phase!=='talking'){ready();return;}current.index=Math.min(current.index+1,current.lines.length-1);publish();}
    function leave(){stop();key=null;current.visible=false;current.phase='hidden';publish();}
    return Object.freeze({enter,say,next,ready,leave,destroy:stop});
  }
  return Object.freeze({lines,create,artwork});
});
