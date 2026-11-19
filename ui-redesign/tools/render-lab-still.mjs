// Render the learning-lab picture of the home page: a still of the real 3D tool while it polishes.
//
// Opens dist/lab-3d.html in a headless Chromium browser over the DevTools protocol, hides the page's overlays, runs
// the process for a while, places the camera and saves the 3D view. Run it again after the tool's look changes.
// Output: dist/media/home/lab.webp (1800 x 1500 px).
//
// Usage: node tools/render-lab-still.mjs [--camera x,y,z] [--target x,y,z] [--out file.webp]
//   Node 22 or newer. Set BROWSER to a Chrome or Edge executable if Edge is not at its usual Windows path.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const option = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const numbers = text => text.split(',').map(Number);
const CAMERA = numbers(option('camera', '1.72,1.62,3.42')), TARGET = numbers(option('target', '0.12,1.10,-0.05'));
const out = path.resolve(option('out', path.join(here, '../dist/media/home/lab.webp')));
const page = `${pathToFileURL(path.resolve(here, '../dist/lab-3d.html')).href}?seed=10`;     // a fixed seed: the same wafer every time
const BROWSER = process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const WIDTH = 900, HEIGHT = 750, SCALE = 2, PORT = 9338;   // CSS size of the 3D view and the device pixel ratio
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const profile = await mkdtemp(path.join(os.tmpdir(), 'cmp-lab-still-'));
const browser = spawn(BROWSER, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  `--window-size=${WIDTH + 160},${HEIGHT + 260}`, 'about:blank'], { stdio: 'ignore' });
const timeout = setTimeout(() => { console.error('timed out'); browser.kill(); process.exit(2); }, 300000);

let socket, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); socket.send(JSON.stringify({ id: i, method, params })); });
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function until(expression, ms = 120000) {
  for (const t0 = Date.now(); Date.now() - t0 < ms; await sleep(200)) if (await evaluate(expression).catch(() => false)) return;
  throw new Error(`timed out waiting for ${expression}`);
}

try {
  let target;
  for (let i = 0; i < 100 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch { await sleep(200); } }
  if (!target) throw new Error(`could not start ${BROWSER}`);
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve));
  socket.addEventListener('message', event => { const m = JSON.parse(event.data), p = pending.get(m.id); if (!p) return; pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH + 40, height: HEIGHT + 100, deviceScaleFactor: SCALE, mobile: false });   // the page gives the 3D view the window minus 40 x 100 px
  await send('Page.navigate', { url: page });
  const lab = 'window.Lab3DDebug';
  await until(`!!(${lab} && ${lab}.scene)`);
  // Only the tool: no overlays, no rounded frame.
  await evaluate(`(() => { const s = document.createElement('style'); s.textContent = '.hud, .stage::after { display: none !important } .stage { border: 0 !important; border-radius: 0 !important; box-shadow: none !important }'; document.head.append(s); })()`);
  await evaluate(`(() => { const d = ${lab}; d.setStrip('closed'); d.scene.holdPixelRatio(${SCALE}); d.setSpeed(16);
    for (const [name, value] of [['platen', 90], ['carrier', 87], ['slurry', 200], ['conditioner', true]]) d.sim.setControl(name, value); })()`);
  await sleep(2500);
  await evaluate(`${lab}.onWafer('head')`); await sleep(1500);
  await evaluate(`(() => { const d = ${lab}; d.sim.setControl('head', 1 + d.constants.pressureRef / d.constants.pressureMax); d.setSpeed(64); })()`);
  await until(`${lab}.sim.meanThickness() < 760`);                                             // well into the polish: wet pad, warm, slurry running
  await evaluate(`(() => { const d = ${lab}; d.setSpeed(1); d.scene.lookFrom(${JSON.stringify(CAMERA)}, ${JSON.stringify(TARGET)}); })()`);
  await sleep(6000);                                                                           // let a few frames and the tool's screen settle
  const box = await evaluate(`(() => { const r = document.getElementById('scene').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
  const shot = await send('Page.captureScreenshot', { format: 'webp', quality: 88, clip: { ...box, scale: 1 } });
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(shot.data, 'base64'));
  console.log(`wrote ${out} (${Math.round(shot.data.length * 0.75 / 1024)} KB, ${Math.round(box.width * SCALE)}x${Math.round(box.height * SCALE)}, camera ${CAMERA} -> ${TARGET})`);
} finally {
  clearTimeout(timeout); try { socket?.close(); } catch { /* already closed */ }
  browser.kill(); await sleep(400); await rm(profile, { recursive: true, force: true }).catch(() => {});
}
