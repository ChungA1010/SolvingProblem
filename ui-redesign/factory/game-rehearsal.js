/* One film plays continuously; chapter buttons seek within the same timeline. */
window.CMPWalkthrough=(()=>{
  'use strict';
  const films = {
    mp4: './media/workshop-guide/walkthrough.mp4',
    webm: './media/workshop-guide/walkthrough.webm'
  };
  const chapters=[
    {poster:'./media/workshop-guide/order.webp',at:0,label:'주문',copy:'손님의 말을 끝까지 듣고 주문을 받으면 작업대로 이동해요.'},
    {poster:'./media/workshop-guide/load.webp',at:2.8,label:'투입',copy:'투입 슬롯 맨 위의 웨이퍼를 잡고 연마 패드 한가운데에 놓아요.'},
    {poster:'./media/workshop-guide/polish.webp',at:5.2,label:'연마',copy:'웨이퍼를 올리고 시간을 정해요. 새 장마다 장비 하나를 직접 조작해요. 첫 장은 헤드를 눌렀다 떼며 접촉압을 맞추고, 성공하면 연마를 시작해요.'},
    {poster:'./media/workshop-guide/measure.webp',at:10.6,label:'측정·보관',copy:'연마한 웨이퍼를 측정기로 옮겨 예상값과 측정값을 비교한 뒤 보관 슬롯에 넣어요.'},
    {poster:'./media/workshop-guide/delivery.webp',at:16.0,label:'납품',copy:'보관한 웨이퍼의 검사를 마치고, 카운터에서 상자를 손님 앞으로 옮겨요.'}
  ];
  function clock(seconds){
    const whole=Math.floor(seconds);
    return Math.floor(whole/60)+':'+String(whole%60).padStart(2,'0');
  }

  function bind({checkpoint,closed}){
    const $=id=>document.getElementById(id);
    const dialog=$('game-help'),film=$('lesson-film'),play=$('lesson-play');
    const time=$('lesson-time'),copy=$('lesson-copy'),note=$('lesson-media-note');
    const preferred=film.canPlayType('video/mp4; codecs="avc1.42E01E"')?'mp4':'webm';
    let chapter=-1,pendingSeek=null,format=null,filmUrl=null;
    let wantsPlayback=false,finished=false,failed=false,playRequest=0;
    const buttons=chapters.map((scene,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.textContent=scene.label;
      button.addEventListener('click',()=>{
        if(finished)wantsPlayback=true;
        jumpTo(index);
      });
      $('lesson-chapters').append(button);
      return button;
    });

    function markChapter(index){
      if(chapter===index)return;
      if(chapter>=0)buttons[chapter].removeAttribute('aria-current');
      chapter=index;
      buttons[index].setAttribute('aria-current','step');
      copy.textContent=chapters[index].copy;
      checkpoint(index);
    }
    function controls(){
      const duration=film.duration;
      const elapsed=finished?duration:(pendingSeek??film.currentTime);
      time.textContent=Number.isFinite(duration)?clock(elapsed)+' / '+clock(duration):failed?'':'영상 준비 중…';
      play.textContent=finished?'↺ 다시 보기':wantsPlayback?'Ⅱ 일시정지':'▶ 재생';
      play.disabled=failed;
    }
    function resume(){
      if(!wantsPlayback||pendingSeek!==null||!dialog.open||document.hidden||failed)return;
      const request=++playRequest;
      film.play().catch(error=>{
        if(request!==playRequest||!dialog.open||error.name==='AbortError'||error.name==='NotSupportedError')return;
        wantsPlayback=false;
        controls();
      });
    }
    function applySeek(){
      if(pendingSeek===null||failed||film.error||film.readyState<1||!dialog.open)return;
      const target=pendingSeek;
      pendingSeek=null;
      film.currentTime=target;
      resume();
      controls();
    }
    function jumpTo(index){
      finished=false;
      pendingSeek=chapters[index].at;
      markChapter(index);
      if(failed)film.poster=chapters[index].poster;
      else applySeek();
      controls();
    }
    async function loadFilm(extension){
      format=extension;
      if(filmUrl){URL.revokeObjectURL(filmUrl);filmUrl=null;}
      const source=films[extension];
      if(location.protocol==='file:'||source.startsWith('data:')){film.src=source;return;}
      try{
        // This short local film must also seek on static hosts without byte ranges.
        const response=await fetch(source);
        if(!response.ok)throw new Error('Guide video unavailable');
        filmUrl=URL.createObjectURL(await response.blob());
        film.src=filmUrl;
      }catch{
        mediaFailed();
      }
    }
    function sync(){
      if(!dialog.open||failed||pendingSeek!==null||film.seeking)return;
      let index=0;
      while(index+1<chapters.length&&film.currentTime+.001>=chapters[index+1].at)index++;
      markChapter(index);
      controls();
    }
    film.addEventListener('loadedmetadata',applySeek);
    film.addEventListener('seeked',sync);
    film.addEventListener('timeupdate',sync);
    film.addEventListener('ended',()=>{
      if(!dialog.open||!film.ended)return;
      wantsPlayback=false;
      finished=true;
      sync();
    });
    function mediaFailed(){
      if(failed)return;
      if(format==='mp4'){
        pendingSeek=pendingSeek??film.currentTime;
        loadFilm('webm');
        return;
      }
      failed=true;
      wantsPlayback=false;
      note.hidden=false;
      film.removeAttribute('src');
      film.poster=chapters[chapter].poster;
      film.load();
      controls();
    }
    film.addEventListener('error',()=>{
      if(film.error)mediaFailed();
    });
    play.addEventListener('click',()=>{
      if(finished){wantsPlayback=true;jumpTo(0);return;}
      wantsPlayback=!wantsPlayback;
      if(wantsPlayback)resume();
      else {playRequest++;film.pause();}
      controls();
    });
    document.addEventListener('visibilitychange',()=>{
      if(!dialog.open)return;
      if(document.hidden){playRequest++;film.pause();}
      else resume();
    });
    for(const id of ['lesson-done','close-help'])$(id).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{
      playRequest++;
      wantsPlayback=false;
      film.pause();
      closed();
    });
    return {open(index,initial){
      if(dialog.open)return;
      dialog.classList.toggle('first-preview',initial);
      $('lesson-done').textContent=initial?'첫 주문 시작 →':'게임으로 돌아가기';
      dialog.showModal();
      dialog.scrollTop=0;
      wantsPlayback=true;
      if(!format||failed){
        failed=false;
        note.hidden=true;
        film.poster=chapters[index].poster;
        loadFilm(preferred);
      }
      jumpTo(index);
      $('lesson-done').focus({preventScroll:true});
    }};
  }
  return Object.freeze({bind});
})();
