// A headless Chrome or Edge driven over the DevTools protocol. Nothing to install: Node 22 or newer and a browser.
// Used by tools/check-browser.mjs (page checks) and tools/render-lab-still.mjs (the home page's lab picture).
//
// WebGL is rendered in software (SwiftShader), so the 3D pages run at a few frames per second. That is slow, but it
// is the same on every PC, with or without a graphics card.
// The executable is BROWSER if that is set, otherwise the first one found in the usual install locations.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const USUAL_PLACES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
];

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function findBrowser() {
  const asked = process.env.BROWSER;
  if (asked) { if (!existsSync(asked)) throw new Error(`BROWSER points to a file that does not exist: ${asked}`); return asked; }
  const found = USUAL_PLACES.find(place => existsSync(place));
  if (!found) throw new Error('Chrome or Edge was not found in the usual places. Set BROWSER to the executable.');
  return found;
}

const freePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
});

// Opens one browser with one page. width, height and scale describe the page's viewport; room is the size of the
// browser window, which has to be at least as large as the largest viewport the caller will set.
export async function openBrowser({ width = 1600, height = 1000, scale = 1, room = [width + 120, height + 120] } = {}) {
  const executable = findBrowser(), port = await freePort();
  const profile = await mkdtemp(path.join(os.tmpdir(), 'cmp-headless-'));
  const child = spawn(executable, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-sync',
    '--disable-background-networking', '--disable-component-update', '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', `--window-size=${room[0]},${room[1]}`, 'about:blank'], { stdio: 'ignore' });

  let closed = false, socket, nextId = 0;
  const pending = new Map(), issues = [], requests = [];
  async function close() {
    if (closed) return;
    closed = true;
    for (const { reject } of pending.values()) reject(new Error('the browser was closed'));
    pending.clear();
    try { socket?.close(); } catch { /* already closed */ }
    child.kill();
    await sleep(400);
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});   // the profile can stay locked for a moment
  }

  try {
    let target;
    for (let i = 0; i < 150 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(entry => entry.type === 'page'); } catch { /* not listening yet */ }
      if (!target) await sleep(200);
    }
    if (!target) throw new Error(`${executable} did not start`);
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', () => reject(new Error('could not connect to the browser')), { once: true }); });
  } catch (error) { await close(); throw error; }

  socket.addEventListener('close', () => { for (const { reject } of pending.values()) reject(new Error('the browser closed the connection')); pending.clear(); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data), waiting = message.id && pending.get(message.id);
    if (waiting) { pending.delete(message.id); message.error ? waiting.reject(new Error(message.error.message)) : waiting.resolve(message.result); return; }
    const p = message.params;
    if (message.method === 'Runtime.exceptionThrown') issues.push({ kind: 'exception', text: p.exceptionDetails.exception?.description || p.exceptionDetails.text });
    else if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(p.type)) issues.push({ kind: p.type, text: p.args.map(a => a.value ?? a.description).join(' ').slice(0, 300) });
    else if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(p.entry.level)) issues.push({ kind: p.entry.level, text: `${p.entry.text} ${p.entry.url || ''}`.trim().slice(0, 300) });
    else if (message.method === 'Network.requestWillBeSent' && /^(https?|wss?):/i.test(p.request.url)) requests.push(p.request.url.slice(0, 160));
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    if (closed || socket.readyState !== WebSocket.OPEN) { reject(new Error('the browser is not connected')); return; }
    const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  // The value of a JavaScript expression in the page. A promise is awaited.
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(`in the page: ${result.exceptionDetails.exception?.description || result.exceptionDetails.text}`);
    return result.result.value;
  }
  // Waits until the expression is true in the page. An expression that throws counts as not yet true.
  async function until(expression, ms = 60000, every = 200) {
    for (const start = Date.now(); Date.now() - start < ms; await sleep(every)) if (await evaluate(expression).catch(() => false)) return;
    throw new Error(`waited ${Math.round(ms / 1000)} s for: ${expression}`);
  }
  const viewport = (w, h, s = 1) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: s, mobile: false });
  // Saves a picture of the page. clip is { x, y, width, height } in CSS pixels; beyond also captures what is scrolled out of view.
  async function screenshot(file, { clip, beyond = false, format = 'png', quality } = {}) {
    const shot = await send('Page.captureScreenshot', { format, ...(quality ? { quality } : {}), ...(beyond ? { captureBeyondViewport: true } : {}), ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    await mkdir(path.dirname(file), { recursive: true });
    const bytes = Buffer.from(shot.data, 'base64');
    await writeFile(file, bytes);
    return bytes.length;
  }
  // Real pointer input. Points are { x, y } in page pixels.
  const mouse = (type, point, buttons = 0) => send('Input.dispatchMouseEvent', { type, x: point.x, y: point.y, button: type === 'mouseMoved' ? (buttons ? 'left' : 'none') : 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'mouse' });
  async function click(point, settle = 300) {
    await mouse('mouseMoved', point); await sleep(100);
    await mouse('mousePressed', point, 1); await sleep(60);
    await mouse('mouseReleased', point, 0); await sleep(settle);
  }
  async function drag(points, hold = 60) {
    await mouse('mouseMoved', points[0]); await sleep(hold);
    await mouse('mousePressed', points[0], 1); await sleep(hold);
    for (const point of points.slice(1)) { await mouse('mouseMoved', point, 1); await sleep(35); }
    await sleep(hold); await mouse('mouseReleased', points.at(-1), 0); await sleep(hold);
  }
  const wheel = (point, deltaY) => send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: point.x, y: point.y, deltaX: 0, deltaY });
  async function press(key, keyCode) { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: keyCode }); }

  try {
    await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable');
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
    await send('Page.bringToFront').catch(() => {});
    await viewport(width, height, scale);
    const { product } = await send('Browser.getVersion');
    return {
      executable, product, issues, requests, send, evaluate, until, viewport, screenshot, mouse, click, drag, wheel, press, close,
      goto: url => send('Page.navigate', { url }),
      offline: () => send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }),
    };
  } catch (error) { await close(); throw error; }
}
