// The site is split into one folder per part, so that each part can be worked on without touching the others
// (tools/site-files.cjs names the parts and what each may load from another). These tests keep the split whole:
// every file a page asks for is there and goes out with the site, and no part loads a file from a part it is not
// declared to use. Paths are compared letter for letter, so a wrong capital fails here and not only on a web server.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PARTS, PAGES, ROOT_FILES, WORKSHOP, partOf, siteFiles } = require('../tools/site-files.cjs');

const root = path.join(__dirname, '..'), posix = path.posix;
const site = siteFiles(root, { parked: true }), inSite = new Set(site);
const pages = new Set([...Object.values(PAGES), ...ROOT_FILES]);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const local = ref => !/^(#|data:|https?:|mailto:|about:|blob:|javascript:)/i.test(ref);
/** A reference found in `from`, as a path from the site root (query and fragment dropped). */
const resolve = (from, ref) => posix.normalize(posix.join(posix.dirname(from), ref.replace(/[?#].*$/, '')));

/** Every local file a page or stylesheet of the site asks for: [{ from, ref, to }]. */
function references() {
  const found = [];
  for (const file of site) {
    const text = /\.(html|css)$/.test(file) ? read(file) : null;
    if (file.endsWith('.html')) for (const m of text.matchAll(/\s(?:src|href|poster)="([^"]+)"/g)) if (local(m[1])) found.push({ from: file, ref: m[1], to: resolve(file, m[1]) });
    if (file.endsWith('.css')) for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) if (local(m[1])) found.push({ from: file, ref: m[1], to: resolve(file, m[1]) });
  }
  return found;
}
/** Scripts a page loads, as paths from the site root. */
const scriptsOf = page => [...read(page).matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].filter(m => local(m[1])).map(m => resolve(page, m[1]));
const allowed = (from, to) => partOf(from) === partOf(to) || PARTS[partOf(from)].uses.includes(partOf(to));
/** True if the path is there with every name spelled as on disk. Windows and macOS would open it either way; Linux, where the tests also run, would not. */
const listing = new Map();
function onDisk(file) {
  let dir = root;
  for (const name of file.split('/')) {
    if (!listing.has(dir)) listing.set(dir, new Set(fs.existsSync(dir) && fs.statSync(dir).isDirectory() ? fs.readdirSync(dir) : []));
    if (!listing.get(dir).has(name)) return false;
    dir = path.join(dir, name);
  }
  return true;
}

test('every part of the site has its folder, and every page is where the tools expect it', () => {
  for (const name of Object.keys(PARTS)) assert.ok(fs.statSync(path.join(root, name)).isDirectory(), `${name}/ is missing`);
  for (const [name, file] of Object.entries(PAGES)) assert.ok(inSite.has(file), `the page ${name} should be ${file}`);
  for (const part of Object.values(PARTS)) for (const used of part.uses) assert.ok(PARTS[used], `${used} is not a part`);
});

test('every file a page or a stylesheet asks for is in the site, spelled as on disk', () => {
  const missing = references().filter(r => !inSite.has(r.to)).map(r => `${r.from}: ${r.ref}`);
  assert.deepEqual(missing, [], 'not in the site (missing, misspelled, or inside a folder that is not uploaded)');
});

test('media paths that scripts build at run time lead to files of the page that loads the script', () => {
  const missing = [];
  for (const page of pages) if (inSite.has(page)) for (const script of scriptsOf(page)) {
    if (!inSite.has(script)) continue;                                              // reported by the test above
    for (const m of read(script).matchAll(/[`'"]\.\/(media\/[^`'"$]*)/g)) {
      const prefix = resolve(page, `./${m[1]}`);                                    // the fixed start of the path, e.g. factory/media/counter-art/
      if (!site.some(file => file.startsWith(prefix))) missing.push(`${script}, loaded by ${page}: ./${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('a part loads files only from its own folder and from the parts it is declared to use', () => {
  // Links to other pages are free; scripts, styles, pictures and fonts are not.
  const outside = references().filter(r => inSite.has(r.to) && !pages.has(r.to) && !allowed(r.from, r.to)).map(r => `${r.from} loads ${r.to}`);
  assert.deepEqual(outside, [], 'add the part to "uses" in tools/site-files.cjs if this is meant, and say so in README.md');
});

test('scripts, tests and 3D sources require or import only from their own part and the parts it uses', () => {
  const outside = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { if (entry.name !== 'model-source' && entry.name !== 'data' && entry.name !== 'media' && entry.name !== 'models') walk(file); continue; }
      if (!/\.(js|cjs|mjs)$/.test(entry.name) || fs.statSync(path.join(root, file)).size > 2e6) continue;   // not the 3D bundles
      for (const m of read(file).matchAll(/(?:require\(|from\s+|import\s+)['"](\.\.?\/[^'"]+)['"]/g)) {
        const to = resolve(file, m[1]);
        if (to.startsWith('..')) { outside.push(`${file} reaches outside the site: ${m[1]}`); continue; }
        if (!to.includes('/')) continue;                                             // a file at the root, such as package.json
        if (PARTS[partOf(to)] && !allowed(file, to)) outside.push(`${file} takes ${to}`);
        if (!onDisk(to)) outside.push(`${file}: ${m[1]} is not there under that name`);
      }
    }
  };
  for (const name of Object.keys(PARTS)) walk(name);
  assert.deepEqual(outside, []);
});

test('what only the makers need stays out of the site', () => {
  const stray = site.filter(file => file.split('/').some(name => WORKSHOP.includes(name)) || file.endsWith('.md'));
  assert.deepEqual(stray, []);
  assert.ok(!site.some(file => file.startsWith('lab-sim/data/')), 'the replay data must never be counted as part of the site');
  assert.ok(siteFiles(root).every(file => !file.startsWith('lab-sim/')), 'the parked simulator is left out unless asked for');
});
