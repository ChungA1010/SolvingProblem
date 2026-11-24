// Render the pictures of the 8-process lab's first screen: a still of each piece of equipment, taken from its own 3D scene.
//
// Opens process-lab/process-lab.html at each process in a headless browser (tools/headless-browser.mjs), hides the page's
// overlays, frames the equipment and saves the 3D view. Every picture is taken from the same height and angle, so the floor
// and the horizon run through all eight when they stand side by side. Run it again after the look of a piece of equipment changes.
// Output: process-lab/media/line-<equipment>.webp (960 x 640 px each). The page crops them to the shape of its tiles, so
// the equipment is framed with room to spare on every side.
//
// Usage: node tools/render-process-stills.mjs [process ...] [--out folder]
//   process: wafer, oxidation, photo, etch, deposition, metal, eds, package, the ids of process-lab/flow-model.js (none renders all eight).
//   Node 22 or newer and Chrome or Edge. BROWSER=<executable> picks a browser that is not in a usual place.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openBrowser, sleep } from './headless-browser.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), outAt = args.indexOf('--out');
const outDir = path.resolve(outAt >= 0 ? args[outAt + 1] : path.join(here, '../process-lab/media'));
const asked = args.filter((a, i) => !a.startsWith('--') && i !== outAt + 1);
const WIDTH = 480, HEIGHT = 320, SCALE = 2;                    // CSS size of the 3D view and the device pixel ratio
const AZIMUTH = 30 * Math.PI / 180, ELEVATION = 13 * Math.PI / 180;   // where the camera stands: to the front right, a little above
const FOV = 34 * Math.PI / 180;                                // the scene's upright angle of view in a window of this shape
const lab = 'window.ProcessLabDebug';
mkdirSync(outDir, { recursive: true });

const browser = await openBrowser({ width: WIDTH + 40, height: HEIGHT + 220, scale: SCALE, room: [WIDTH + 200, HEIGHT + 420] });
const timeout = setTimeout(async () => { console.error('timed out'); await browser.close(); process.exit(2); }, 600000);
try {
  const page = pathToFileURL(path.resolve(here, '../process-lab/process-lab.html')).href;
  await browser.goto(`${page}?seed=5`);
  await browser.until(`!!${lab}`, 60000);
  const steps = await browser.evaluate(`${lab}.flow.STEPS.map(step => step.id)`);
  for (const id of steps.filter(step => !asked.length || asked.includes(step))) {
    await browser.goto(`${page}?seed=5&start=${id}`);
    await browser.until(`!!${lab} && ${lab}.mode === 'station' && !!${lab}.sim`, 120000);
    // Only the equipment: no overlays, no frame, no scroll bar, and a stage of the size of the picture.
    await browser.evaluate(`(() => { const s = document.createElement('style'); s.textContent = 'html { overflow: hidden !important } .hud, .stage::after, .topbar, .route { display: none !important } main { padding: 0 !important } .stage { width: ${WIDTH}px !important; height: ${HEIGHT}px !important; min-height: 0 !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important }'; document.head.append(s); })()`);
    await sleep(600);
    // The camera stands in the same direction for every picture and comes as close as the equipment's box allows:
    // the box fills FILL of the picture's width or height, whichever it reaches first, and sits a little below the middle.
    const framed = await browser.evaluate(`(() => { const scene = ${lab}.scene, b = scene.bounds;
      if (!b) return null;
      scene.holdPixelRatio(${SCALE}); scene.resize();
      const W = ${WIDTH}, H = ${HEIGHT}, FILL = [0.84, 0.80], MIDDLE = 0.54;
      const dir = [Math.sin(${AZIMUTH}) * Math.cos(${ELEVATION}), Math.sin(${ELEVATION}), Math.cos(${AZIMUTH}) * Math.cos(${ELEVATION})], right = [Math.cos(${AZIMUTH}), 0, -Math.sin(${AZIMUTH})];
      const corners = Array.from({ length: 8 }, (_, i) => [i & 1 ? b.max[0] : b.min[0], i & 2 ? b.max[1] : b.min[1], i & 4 ? b.max[2] : b.min[2]]);
      let target = b.min.map((v, i) => (v + b.max[i]) / 2), distance = b.radius / Math.sin(${FOV} / 2);
      for (let pass = 0; pass < 6; pass++) {
        scene.lookFrom(target.map((v, i) => v + dir[i] * distance), target);
        const at = corners.map(c => scene.project(c[0], c[1], c[2])), xs = at.map(p => p.x), ys = at.map(p => p.y);
        const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys), perPixel = 2 * distance * Math.tan(${FOV} / 2) / H;
        const dx = W / 2 - (Math.max(...xs) + Math.min(...xs)) / 2, dy = H * MIDDLE - (Math.max(...ys) + Math.min(...ys)) / 2;
        target = target.map((v, i) => v - right[i] * dx * perPixel + (i === 1 ? dy * perPixel : 0));
        distance *= Math.max(w / (W * FILL[0]), h / (H * FILL[1]));
      }
      scene.lookFrom(target.map((v, i) => v + dir[i] * distance), target);
      return { equipment: ${lab}.station.equipment, radius: b.radius, distance }; })()`);
    if (!framed) { console.log(`${id}: no equipment of this lab's own scene, skipped`); continue; }
    await sleep(5000);                                          // a few frames, and the equipment's screen
    const box = await browser.evaluate(`(() => { const r = document.getElementById('scene').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
    const file = path.join(outDir, `line-${framed.equipment}.webp`);
    const bytes = await browser.screenshot(file, { clip: box, format: 'webp', quality: 86 });
    console.log(`${id}: wrote ${file} (${Math.round(bytes / 1024)} KB, ${Math.round(box.width * SCALE)}x${Math.round(box.height * SCALE)}, ball of ${framed.radius.toFixed(2)} m seen from ${framed.distance.toFixed(1)} m)`);
  }
} finally {
  clearTimeout(timeout);
  await browser.close();
}
