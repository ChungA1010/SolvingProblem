/* Home page: the colour scale in the learning-lab caption.
 * An oxide film changes colour as it gets thinner. The lab computes that colour from thin-film interference, so the
 * scale is painted here by the lab's own process model, from the incoming thickness down to the target. */
(function () {
  'use strict';
  const P = window.Lab3DProcess, canvas = document.getElementById('home-film');
  if (!P || !canvas) return;
  const C = P.constants, x = canvas.getContext('2d'), w = canvas.width, h = canvas.height, nm = v => `${v.toLocaleString('ko-KR')} nm`;
  for (let i = 0; i < w; i++) {
    const [r, g, b] = P.filmColor(C.filmStart + (C.target - C.filmStart) * i / (w - 1));
    x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(i, 0, 1, h);
  }
  document.getElementById('home-film-from').textContent = nm(C.filmStart);
  document.getElementById('home-film-to').textContent = nm(C.target);
})();
