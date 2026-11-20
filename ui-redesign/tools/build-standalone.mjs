// Build the whole CMP Lab web app (index.html and the pages of its parts: factory/game.html, lab-3d/lab-3d.html,
// process-lab/process-lab.html, lab-sim/lab-sim.html) as ONE self-contained HTML file that opens straight from disk
// (file://) with no server. Nothing in the site's folders is changed.
//
// How it works: the file is a small shell that shows one page at a time in a full-window <iframe srcdoc>. Each page
// is the original HTML with its stylesheets and scripts inlined. What the pages share is stored once in the shell:
// the 3D scene bundle (cmp-scene.js), the images, video and font (as data URIs) and the simulator's model and replay
// data. Media paths that scripts build at run time are wrapped in __cmpAsset(...), which returns the embedded copy.
// A page's references are relative to its own folder; in here every file goes by its path from the site root.
// A short prelude at the top of every page defines that function and turns links between the pages into shell
// navigation. The shell URL keeps the current page (#index, #game, #lab-sim, #lab-3d) and the page's own fragment
// (e.g. #index/lab), so reload and the back button work.
//
// Pages that the home page has parked (their entry points carry `hidden data-parked`) are left out by default, so the
// file holds only what a visitor can reach. `--all` puts them back in. With the lab simulator included the output
// embeds the PHM 2016-derived replay data; the output folder is kept out of git (see .gitignore) for that case, until
// the data publication decision for issue #6.
// Usage: node tools/build-standalone.mjs [--all] [output.html]   (default: standalone/CMP-Lab.html)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import layout from './site-files.cjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, '..');   // the site root: index.html and the folders of its parts
const args = process.argv.slice(2), everything = args.includes('--all');
const out = path.resolve(args.find(a => !a.startsWith('--')) || path.join(here, '../standalone/CMP-Lab.html'));
const PAGES = layout.PAGES;   // page name = file name without .html
const PARKED = Object.keys(PAGES).filter(name => layout.PARTS[layout.partOf(PAGES[name])].parked);   // not linked from the home page for now; bundled only with --all
for (const [name, file] of Object.entries(PAGES)) if (path.posix.basename(file, '.html') !== name) throw new Error(`${file}: a page is found by its file name, which has to be ${name}.html`);
const bundled = Object.entries(PAGES).filter(([name]) => everything || !PARKED.includes(name));
const withSimulator = bundled.some(([name]) => name === 'lab-sim');
const SHARED_SCRIPT_BYTES = 1 << 20; // scripts at least this large are stored once in the shell, not in every page
const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };
const posix = path.posix;
const read = (rel, enc = 'utf8') => readFile(path.join(site, rel), enc);
/** A reference found in a file of the site, as a path from the site root. */
function resolve(from, ref) {
  const rel = posix.normalize(posix.join(posix.dirname(from), ref));
  if (rel.startsWith('..')) throw new Error(`${from}: ${ref} points outside the site`);
  return rel;
}

function replaceOnce(text, from, to, where) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected exactly one ${JSON.stringify(from)} in ${where}, found ${n}`);
  return text.replace(from, () => to); // a function, so "$&"-style sequences in inlined code are not expanded
}
async function replaceAsync(text, re, fn) {
  const parts = []; let last = 0;
  for (const m of text.matchAll(re)) { parts.push(text.slice(last, m.index), await fn(...m)); last = m.index + m[0].length; }
  return parts.join('') + text.slice(last);
}
// JSON inside <script type="application/json">: escaping "<" keeps it valid JSON and unable to end the element.
const jsonScript = (id, value) => `<script type="application/json" id="${id}">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;

// ---------- assets: stored once in the shell as data URIs, referenced from pages as "cmp-asset:<path>" ----------
const assets = new Map();
async function asset(rel) {
  rel = posix.normalize(rel);
  if (!assets.has(rel)) {
    const type = MIME[posix.extname(rel)];
    if (!type) throw new Error(`no media type for ${rel}`);
    assets.set(rel, `data:${type};base64,${(await read(rel, null)).toString('base64')}`);
  }
  return `cmp-asset:${rel}`;
}
const mediaFiles = layout.siteFiles(site, { parked: everything }).filter(f => MIME[posix.extname(f)]);
// End index of the string or template literal opening at src[start] (template expressions may nest literals).
function literalEnd(src, start) {
  const q = src[start];
  for (let i = start + 1; i < src.length; i++) {
    if (src[i] === '\\') i++;
    else if (src[i] === q) return i + 1;
    else if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
      let depth = 1;
      for (i += 2; depth > 0; i++) {
        if (i >= src.length) throw new Error('unterminated template expression');
        if ('`\'"'.includes(src[i])) i = literalEnd(src, i) - 1;
        else if (src[i] === '{') depth++;
        else if (src[i] === '}') depth--;
      }
      i--;
    }
  }
  throw new Error('unterminated literal');
}
// Scripts build some media paths at run time, e.g. `./media/counter-art/${person}-expressions.png`. Wrap each such
// literal in __cmpAsset(...) (defined by the page prelude), which returns the embedded copy, and embed every file
// under the literal's fixed prefix. Such a path is the page's, so it is resolved from the page that loads the script.
async function wrapMediaLiterals(rel, js, page) {
  let out = '', last = 0;
  for (const m of js.matchAll(/[`'"]\.\/(media\/[^`'"$]*)/g)) {
    if (m.index < last) continue;
    const prefix = resolve(page, `./${m[1]}`), hits = mediaFiles.filter(f => f.startsWith(prefix));
    if (!hits.length) throw new Error(`${rel}: no media file matches ./${m[1]} from ${page}`);
    for (const f of hits) await asset(f);
    const end = literalEnd(js, m.index);
    out += `${js.slice(last, m.index)}__cmpAsset(${js.slice(m.index, end)})`;
    last = end;
  }
  if (!last) return js;
  out += js.slice(last);
  try { new Function(out); } catch (e) { throw new Error(`${rel}: wrapping media paths broke the script (${e.message})`); }
  return out;
}

// ---------- shared scripts and data, stored once in the shell ----------
const shared = new Map();
async function inlineScript(rel, page) {
  const js = await wrapMediaLiterals(rel, await read(rel), page);
  if (js.includes('<!--')) throw new Error(`${rel} contains "<!--", which is unsafe inside an inline script`);
  if (Buffer.byteLength(js) >= SHARED_SCRIPT_BYTES) {
    if (/<\/script/i.test(js)) throw new Error(`${rel} contains "</script" and cannot be stored as text`);
    if (shared.has(rel) && shared.get(rel) !== js) throw new Error(`${rel} is stored once for all pages, but its media paths differ between them`);
    shared.set(rel, js);
    return `<script>/* ${rel} (shared) */ __cmpRunShared(${JSON.stringify(rel)});</script>`;
  }
  return `<script>/* ${rel} */\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
}
async function inlineCss(rel) {
  const dir = posix.dirname(rel);
  const css = await replaceAsync(await read(rel), /url\(\s*(['"]?)(?!data:|https?:|#)([^'")]+)\1\s*\)/g,
    async (all, q, ref) => `url("${await asset(posix.join(dir, ref))}")`);
  if (/<\/style/i.test(css)) throw new Error(`${rel} contains "</style"`);
  return `<style>/* ${rel} */\n${css}\n</style>`;
}

// ---------- runs first in every page (serialized into the page) ----------
function pagePrelude(page, folder) {
  'use strict';
  const bundle = parent.CMPLabBundle;
  // Media paths that scripts build at run time arrive here (the build wraps them); return the embedded copy.
  // They are relative to the page: `folder` is the page's folder from the site root ('' or, say, 'factory/').
  window.__cmpAsset = url => { const m = /^\.\/(media\/[^?#]+)$/.exec(url); return (m && bundle.asset(folder + m[1])) || url; };
  // Large shared scripts are kept once in the shell; run one in place of its original <script> tag.
  window.__cmpRunShared = rel => {
    const s = document.createElement('script');
    s.textContent = bundle.text(`cmp-lib:${rel}`);
    document.currentScript.after(s);
  };
  // Links between the pages switch the shell's page; links to other sites open in a new tab, outside the app.
  document.addEventListener('click', e => {
    const a = e.target instanceof Element && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0) return;
    const m = /^\.{1,2}\/(?:[\w-]+\/)*([\w-]+)\.html(?:#(.*))?$/.exec(a.getAttribute('href'));   // ./factory/game.html, ../index.html#home: a page goes by its file name
    if (m && bundle.has(m[1])) { e.preventDefault(); bundle.go(m[1], m[2] || ''); }
    else if (/^https?:/i.test(a.getAttribute('href')) && !a.target) { e.preventDefault(); window.open(a.href, '_blank', 'noopener'); }
  });
  // The page's own fragment (tabs such as #lab) lives in the shell URL, so reload and links like index.html#lab work.
  // (history.replaceState is refused in an about:srcdoc page opened from disk, so set the fragment directly.)
  const inner = bundle.innerHash();
  if (inner) location.hash = inner;
  window.addEventListener('hashchange', () => bundle.setInner(page, location.hash.slice(1)));
  // The browser tab shows the shell's title; keep it in step with the page's (pages retitle themselves per tab).
  document.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('title');
    const sync = () => bundle.setTitle(document.title);
    if (title) new MutationObserver(sync).observe(title, { childList: true, characterData: true, subtree: true });
    sync();
  });
}

// ---------- the shell ----------
function shellMain() {
  'use strict';
  const text = id => document.getElementById(id).textContent;
  const pages = JSON.parse(text('cmp-pages'));
  const assets = JSON.parse(text('cmp-assets'));
  const where = () => {
    const m = /^#([\w-]+)(?:\/(.*))?$/.exec(location.hash);
    return m && pages[m[1]] ? { page: m[1], inner: m[2] || '' } : { page: 'index', inner: '' };
  };
  const hashOf = (page, inner) => `#${page}${inner ? `/${inner}` : ''}`;
  let frame = null, quiet = null;
  function render() {
    const next = document.createElement('iframe');
    next.title = 'CMP Lab';
    next.allow = 'fullscreen';
    next.srcdoc = pages[where().page].replace(/cmp-asset:([\w\-./]+)/g, (all, rel) => assets[rel] || all);
    next.addEventListener('load', () => next.contentWindow?.focus());
    if (frame) frame.replaceWith(next); else document.body.prepend(next);
    frame = next; // a fresh frame per page: no state or timers carry over, as with a normal page load
  }
  window.CMPLabBundle = Object.freeze({
    text,
    has: page => Object.hasOwn(pages, page),
    asset: rel => assets[rel],
    innerHash: () => where().inner,
    setTitle(title) { document.title = title || 'CMP Lab'; },
    // Record the page's fragment without reloading the page: replaceState where allowed, else a marked replace.
    setInner(page, inner) {
      const h = hashOf(page, inner);
      if (location.hash === h) return;
      try { history.replaceState(null, '', h); } catch { quiet = h; location.replace(h); }
    },
    go(page, inner) { const h = hashOf(page, inner); if (location.hash === h) render(); else location.hash = h; },
  });
  window.addEventListener('hashchange', () => { if (location.hash === quiet) { quiet = null; return; } render(); });
  render();
}

// ---------- pages ----------
async function buildPage(name, file) {
  let html = await read(file);
  const folder = posix.dirname(file) === '.' ? '' : `${posix.dirname(file)}/`;
  html = await replaceAsync(html, /<link rel="stylesheet" href="(\.\.?\/[^"]+)">/g, (all, ref) => inlineCss(resolve(file, ref)));
  // All page scripts are deferred <script src> tags in <head>; inline them in order at the end of <body>, where the
  // DOM they expect already exists, as with defer.
  const tag = /\s*<script src="(\.\.?\/[^"]+)" defer><\/script>/g;
  const sources = [...html.matchAll(tag)].map(m => resolve(file, m[1]));
  html = html.replace(tag, '');
  if (!sources.length || /<script[^>]*\ssrc=/i.test(html)) throw new Error(`${file}: expected only deferred <script src> tags`);
  const scripts = [];
  for (const rel of sources) scripts.push(await inlineScript(rel, file));
  if (name === 'lab-sim') scripts.unshift(`<script>window.LabSimEmbeddedData = Object.freeze({
    model: JSON.parse(parent.CMPLabBundle.text('cmp-data:lab-sim-model')),
    replay: JSON.parse(parent.CMPLabBundle.text('cmp-data:lab-sim-replay')) });</script>`);
  html = replaceOnce(html, '</body>', `${scripts.join('\n')}\n</body>`, file);
  // Embedded media needs no preload (the browser would warn that a data: preload goes unused).
  const media = ref => !!MIME[posix.extname(ref)];
  html = html.replace(/<link rel="preload"[^>]*href="(\.\.?\/[^"]*)"[^>]*>/g, (all, ref) => media(ref) ? '' : all);
  html = await replaceAsync(html, /(\s(?:src|poster|href)=")(\.\.?\/[^"#?]+)"/g, async (all, attr, ref) => media(ref) ? `${attr}${await asset(resolve(file, ref))}"` : all);
  html = replaceOnce(html, '<head>', `<head><script>(${pagePrelude})(${JSON.stringify(name)}, ${JSON.stringify(folder)});</script>`, file);
  const left = [...html.matchAll(/(?:src|href|poster)="(\.\.?\/[^"#]*)/g)].map(m => m[1]).filter(ref => !Object.values(PAGES).includes(resolve(file, ref)));   // links between the pages stay: the prelude follows them
  if (left.length) throw new Error(`${file}: relative references left: ${[...new Set(left)].join(', ')}`);
  return html;
}

const pages = {};
for (const [name, file] of bundled) pages[name] = await buildPage(name, file);

let simulatorData = '';
if (withSimulator) {
  let replay;
  try { replay = JSON.parse(await read('lab-sim/data/replay.json')); } catch {
    throw new Error('lab-sim/data/replay.json is missing. Build it first: python -m tools.lab_sim.build_lab_data --wafer-table <wafer_table.csv> --traces <CMP-data/training>');
  }
  simulatorData = `${jsonScript('cmp-data:lab-sim-model', JSON.parse(await read('lab-sim/state-model-v2.json')))}\n${jsonScript('cmp-data:lab-sim-replay', replay)}`;
}
const ofl = await read('shared/fonts/OFL-pretendard.txt');
if (ofl.includes('-->')) throw new Error('OFL text cannot go in an HTML comment');
const icon = /<link rel="icon" href="data:[^"]+">/.exec(await read('index.html'))?.[0] ?? '';
const shellJs = `(${shellMain})();`;
if (/<\/script|<!--/i.test(shellJs)) throw new Error('shell script cannot be inlined');

const html = `<!doctype html>
<!-- CMP Lab: single-file build of the site (tools/build-standalone.mjs), ${new Date().toISOString().slice(0, 10)}.
     Pages: ${Object.keys(pages).join(', ')}.${withSimulator ? ' Contains replay data derived from the PHM 2016 data challenge; share only within\n     the team until the data publication decision.' : ' The lab simulator and its PHM-derived replay data are not included.'} -->
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CMP Lab</title>
${icon}
<style>html,body{margin:0;height:100%;background:#f5f7fb}iframe{display:block;width:100%;height:100%;border:0}</style>
<!-- Pretendard font (embedded below):
${ofl}
-->
</head>
<body>
<noscript>CMP Lab을 보려면 JavaScript를 켜 주세요.</noscript>
${jsonScript('cmp-pages', pages)}
${jsonScript('cmp-assets', Object.fromEntries(assets))}
${[...shared].map(([rel, js]) => `<script type="text/plain" id="cmp-lib:${rel}">${js}</script>`).join('\n')}
${simulatorData}
<script>${shellJs}</script>
</body>
</html>
`;

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, html, 'utf8');
const mb = n => (n / 1048576).toFixed(1);
const assetBytes = [...assets.values()].reduce((s, v) => s + v.length, 0);
console.log(`wrote ${out} (${mb(Buffer.byteLength(html))} MB)`);
console.log(`  ${withSimulator ? 'includes the lab simulator and its PHM-derived replay data' : `left out (parked): ${PARKED.join(', ')}; no replay data inside`}`);
console.log(`  pages: ${Object.keys(pages).join(', ')}; shared scripts: ${[...shared.keys()].join(', ') || 'none'}; assets: ${assets.size} files, ${mb(assetBytes)} MB as data URIs`);
