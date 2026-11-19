// Render the learning-lab picture of the home page: a still of the real 3D tool while it polishes.
//
// Opens dist/lab-3d.html in a headless browser (tools/headless-browser.mjs), hides the page's overlays, runs the
// process for a while, places the camera and saves the 3D view. Run it again after the tool's look changes.
// Output: dist/media/home/lab.webp (1800 x 1500 px).
//
// Usage: node tools/render-lab-still.mjs [--camera x,y,z] [--target x,y,z] [--out file.webp]
//   Node 22 or newer and Chrome or Edge. BROWSER=<executable> picks a browser that is not in a usual place.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openBrowser, sleep } from './headless-browser.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const option = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const numbers = text => text.split(',').map(Number);
const CAMERA = numbers(option('camera', '1.60,1.60,3.18')), TARGET = numbers(option('target', '0.17,1.12,-0.05'));   // the framing of the committed picture
const out = path.resolve(option('out', path.join(here, '../dist/media/home/lab.webp')));
const page = `${pathToFileURL(path.resolve(here, '../dist/lab-3d.html')).href}?seed=10`;     // a fixed seed: the same wafer every time
const WIDTH = 900, HEIGHT = 750, SCALE = 2;   // CSS size of the 3D view and the device pixel ratio
const lab = 'window.Lab3DDebug';

const browser = await openBrowser({ width: WIDTH + 40, height: HEIGHT + 100, scale: SCALE, room: [WIDTH + 160, HEIGHT + 260] });   // the page gives the 3D view the window minus 40 x 100 px
const timeout = setTimeout(async () => { console.error('timed out'); await browser.close(); process.exit(2); }, 300000);
try {
  await browser.goto(page);
  await browser.until(`!!(${lab} && ${lab}.scene)`, 120000);
  // Only the tool: no overlays, no rounded frame.
  await browser.evaluate(`(() => { const s = document.createElement('style'); s.textContent = '.hud, .stage::after { display: none !important } .stage { border: 0 !important; border-radius: 0 !important; box-shadow: none !important }'; document.head.append(s); })()`);
  await browser.evaluate(`(() => { const d = ${lab}; d.setStrip('closed'); d.scene.holdPixelRatio(${SCALE}); d.setSpeed(16);
    for (const [name, value] of [['platen', 90], ['carrier', 87], ['slurry', 200], ['conditioner', true]]) d.sim.setControl(name, value); })()`);
  await sleep(2500);
  await browser.evaluate(`${lab}.onWafer('head')`); await sleep(1500);
  await browser.evaluate(`(() => { const d = ${lab}; d.sim.setControl('head', 1 + d.constants.pressureRef / d.constants.pressureMax); d.setSpeed(64); })()`);
  await browser.until(`${lab}.sim.meanThickness() < 760`, 120000);                             // well into the polish: wet pad, warm, slurry running
  await browser.evaluate(`(() => { const d = ${lab}; d.setSpeed(1); d.scene.lookFrom(${JSON.stringify(CAMERA)}, ${JSON.stringify(TARGET)}); })()`);
  await sleep(6000);                                                                           // let a few frames and the tool's screen settle
  const box = await browser.evaluate(`(() => { const r = document.getElementById('scene').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
  const bytes = await browser.screenshot(out, { clip: box, format: 'webp', quality: 88 });
  console.log(`wrote ${out} (${Math.round(bytes / 1024)} KB, ${Math.round(box.width * SCALE)}x${Math.round(box.height * SCALE)}, camera ${CAMERA} -> ${TARGET})`);
} finally {
  clearTimeout(timeout);
  await browser.close();
}
