(function (root, make) {
  const arcade = make(root);
  if (typeof module === 'object' && module.exports) module.exports = arcade;
  else root.CMPArcade = arcade;
})(globalThis, function (root) {
  'use strict';

  const games = [
    {id:'pressure', name:'압력을 잡아!', control:'접촉압', hint:'헤드를 눌렀다 떼며 바늘을 목표 띠에 유지해요.'},
    {id:'surface', name:'표면을 다듬어!', control:'표면 가공', hint:'굵은 패드로 돌출부를 깎고, 마감 패드로 광택을 내요.'},
    {id:'slurry', name:'슬러리를 맞춰!', control:'Slurry C 유량', hint:'밸브를 밀고 유량이 설정 눈금에 닿는지 봐요.'},
    {id:'condition', name:'패드를 되살려!', control:'패드 컨디셔닝', hint:'마모된 세 구간을 찾아 헤드로 한 번에서 세 번씩 손질해요.'},
    {id:'rotation', name:'회전음을 맞춰!', control:'회전 속도', hint:'다이얼로 회전판과 기준 램프의 박자를 맞춰요.'},
    {id:'landing', name:'헤드를 안착시켜!', control:'헤드 안착', hint:'왕복하는 바늘이 초록 띠 안에 올 때 눌러요.'}
  ];
  const ids = games.map(game => game.id);
  const taskName = id => games.find(game => game.id === id).name;

  function shuffle(values, random) {
    const shuffled = [...values];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  function newDeck(first, previous, random = Math.random) {
    if (first) return [...ids.slice(0, 2), ...shuffle(ids.slice(2), random)];
    const deck = shuffle(ids, random);
    if (deck[0] === previous) {
      const other = 1 + Math.floor(random() * (deck.length - 1));
      [deck[0], deck[other]] = [deck[other], deck[0]];
    }
    return deck;
  }
  function advance(deck, random = Math.random) {
    return deck.length > 1 ? deck.slice(1) : newDeck(false, deck[0], random);
  }
  function restore(saved, first, processed, legacyFive = false) {
    if (Array.isArray(saved) && saved.length && saved.length <= ids.length &&
        new Set(saved).size === saved.length && saved.every(id => ids.includes(id))) {
      // Keep the pending wafer and order. The new instrument joins the end of the existing bag once.
      return legacyFive && !saved.includes('landing') ? [...saved, 'landing'] : [...saved];
    }
    // Older campaigns have no deck. Resume at the upcoming wafer without changing their process records.
    let deck = newDeck(first);
    for (let i = 0; i < processed; i++) deck = advance(deck);
    return deck;
  }
  function play(kind, options) {
    if (kind === 'pressure') root.CMPPolishControl.open(options);
    else if (kind === 'surface') root.CMPSurfacePractice.openRound(options);
    else if (kind === 'landing') root.CMPHeadLanding.open(options);
    else if (ids.includes(kind)) root.CMPPolishMicrogames.open({...options, kind});
  }
  function closeGame() {
    root.CMPPolishControl.close();
    root.CMPSurfacePractice.closeRound();
    root.CMPHeadLanding.close();
    root.CMPPolishMicrogames.close();
  }
  function isRoute(hash) {
    return hash === '#microgames' || ids.some(id => hash === '#microgames/' + id);
  }
  let gallery;
  function build(host, exit) {
    host.classList.add('mg-gallery');
    host.setAttribute('aria-labelledby', 'mg-title');
    host.innerHTML = `<header class="mg-head">
      <div><h1 id="mg-title">연마 미니게임</h1><p>연습할 장비를 고르세요. 공방 자금과 주문 기록은 그대로예요.</p></div>
      <button type="button" class="mg-exit"></button>
    </header><div class="mg-grid"></div>`;
    const back = host.querySelector('.mg-exit');
    back.textContent = host.tagName === 'DIALOG' ? '닫기' : '공방으로';
    back.addEventListener('click', exit);
    const grid = host.querySelector('.mg-grid');
    for (const game of games) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mg-card';
      button.dataset.playMicrogame = game.id;
      button.setAttribute('aria-haspopup', 'dialog');
      const marks=game.id==='surface'||game.id==='landing'?'':'<i></i><b></b><em></em>';
      button.innerHTML = `<span class="mg-preview" aria-hidden="true">${marks}</span>
        <span class="mg-copy"><small>${game.control}</small><strong>${game.name}</strong><span>${game.hint}</span></span>
        <span class="mg-arrow" aria-hidden="true">↗</span>`;
      button.addEventListener('click', () => play(game.id, {opener:button, practiceLabel:'종목 선택으로'}));
      grid.append(button);
    }
    return host;
  }
  function openGallery(opener) {
    if (!gallery) {
      gallery = document.createElement('dialog');
      build(gallery, () => gallery.close());
      document.body.append(gallery);
    }
    if (!gallery.open) {
      gallery.addEventListener('close', () => {
        if (opener?.isConnected && !opener.disabled) opener.focus({preventScroll:true});
      }, {once:true});
      gallery.showModal();
      gallery.querySelector('.mg-card').focus({preventScroll:true});
    }
  }
  function practicePage(exit) {
    document.title = '연마 미니게임 · CMP 팩토리';
    document.body.className = 'mg-practice-page';
    const main = build(document.createElement('main'), exit);
    document.body.replaceChildren(main);
    let routedDialog;
    function route() {
      const hash = root.location.hash;
      if (!isRoute(hash)) { exit(); return; }
      routedDialog = null;
      closeGame();
      const id = hash.split('/')[1];
      if (id) {
        main.querySelector('[data-play-microgame="' + id + '"]').click();
        routedDialog = document.querySelector('dialog[open]');
      }
    }
    document.addEventListener('close', event => {
      if (event.target !== routedDialog || routedDialog.open) return;
      routedDialog = null;
      try { root.history.replaceState(root.history.state, '', '#microgames'); }
      catch { root.location.hash = 'microgames'; }
    }, true);
    root.addEventListener('hashchange', route);
    root.addEventListener('pagehide', closeGame);
    route();
  }
  return Object.freeze({newDeck, advance, restore, taskName, play, closeGame, openGallery, practicePage, isRoute});
});
