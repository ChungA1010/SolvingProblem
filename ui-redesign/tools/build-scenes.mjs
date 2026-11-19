// Builds the 3D scene bundles (three.js inside) that the pages load as classic scripts:
//   lab-3d        src/lab-3d-scene.js       -> dist/lab-3d/scene.js        the CMP learning lab
//   process-lab   src/process-lab-scene.js  -> dist/process-lab/scene.js   the 8-process lab (with src/process-lab/*.js)
//
// The bundles are committed so that the site runs without a build step. To keep them from going stale, each build also
// writes scene.build.json beside the bundle with a fingerprint of the source files it was made from, and
// tests/scene-bundles.test.cjs fails when a source has changed since. Run this after every change to a scene source
// and commit the bundle and the record with it.
//
// Usage: node tools/build-scenes.mjs [name ...]     no name builds all (npm run build:lab3d / build:process-lab build one)
// esbuild and three are taken from the first of these that is there:
//   1. ESBUILD_BIN, an esbuild executable, with three found through NODE_PATH
//   2. node_modules of this folder (after npm ci)
//   3. ~/.cache/cmp-lab-build/ for a PC without npm: esbuild/esbuild[.exe] and node_modules/three, unpacked from the
//      npm packages @esbuild/<platform>-<arch> and three
// Their versions have to be the ones package.json names; otherwise the build stops and nothing is written.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLES = {
  'lab-3d': { entry: 'src/lab-3d-scene.js', output: 'dist/lab-3d/scene.js', global: 'CMPLab3DScene' },
  'process-lab': { entry: 'src/process-lab-scene.js', output: 'dist/process-lab/scene.js', global: 'CMPProcessLabScene' },
};
const FLAGS = ['--bundle', '--format=iife', '--target=es2020', '--minify', '--legal-comments=eof'];
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const asked = { esbuild: pkg.devDependencies.esbuild, three: pkg.dependencies.three };
const windows = process.platform === 'win32';

function fail(message) { console.error(`build-scenes: ${message}`); process.exit(1); }

function locate() {
  if (process.env.ESBUILD_BIN) return { from: 'ESBUILD_BIN and NODE_PATH', esbuild: process.env.ESBUILD_BIN, modules: (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean) };
  const local = path.join(root, 'node_modules'), cache = path.join(os.homedir(), '.cache/cmp-lab-build');
  const places = [
    { from: 'node_modules', esbuild: path.join(local, '@esbuild', `${process.platform}-${process.arch}`, windows ? 'esbuild.exe' : 'bin/esbuild'), modules: [local] },
    { from: '~/.cache/cmp-lab-build', esbuild: path.join(cache, 'esbuild', windows ? 'esbuild.exe' : 'esbuild'), modules: [path.join(cache, 'node_modules')] },
  ];
  const found = places.find(place => existsSync(place.esbuild) && existsSync(path.join(place.modules[0], 'three/package.json')));
  if (!found) fail('esbuild and three were not found. Run "npm ci" in this folder, or see the top of tools/build-scenes.mjs for a PC without npm.');
  return found;
}

/** Fingerprint of the source files of a bundle, as git stores them (LF line endings), so it is the same on every PC. */
function fingerprint(sources, base = root) {
  const hash = createHash('sha256');
  for (const file of [...sources].sort()) hash.update(`${file}\n${readFileSync(path.join(base, file), 'utf8').replace(/\r\n/g, '\n')}\n`);
  return hash.digest('hex');
}

const names = process.argv.slice(2);
const unknown = names.filter(name => !BUNDLES[name]);
if (unknown.length) fail(`no bundle is called ${unknown.join(', ')}. Bundles: ${Object.keys(BUNDLES).join(', ')}`);

const tools = locate();
const run = args => spawnSync(tools.esbuild, args, { cwd: root, encoding: 'utf8', env: { ...process.env, NODE_PATH: tools.modules.join(path.delimiter) } });
const version = run(['--version']);
if (version.error || version.status !== 0) fail(`could not run ${tools.esbuild}: ${version.error?.message || version.stderr}`);
const threeAt = tools.modules.map(dir => path.join(dir, 'three/package.json')).find(file => existsSync(file));
if (!threeAt) fail(`three was not found in ${tools.modules.join(', ') || 'NODE_PATH (empty)'}`);
const used = { esbuild: version.stdout.trim(), three: JSON.parse(readFileSync(threeAt, 'utf8')).version };
for (const name of ['esbuild', 'three']) if (used[name] !== asked[name]) fail(`${name} ${used[name]} was found (${tools.from}), but package.json names ${asked[name]}`);

const scratch = mkdtempSync(path.join(os.tmpdir(), 'cmp-build-'));
try {
  for (const name of names.length ? names : Object.keys(BUNDLES)) {
    const bundle = BUNDLES[name], meta = path.join(scratch, `${name}.json`);
    const built = run([bundle.entry, ...FLAGS, `--global-name=${bundle.global}`, `--outfile=${bundle.output}`, `--metafile=${meta}`]);
    if (built.error || built.status !== 0) fail(`esbuild stopped on ${bundle.entry}:\n${built.error?.message || built.stderr}`);
    const sources = Object.keys(JSON.parse(readFileSync(meta, 'utf8')).inputs).map(file => file.replace(/\\/g, '/')).filter(file => file.startsWith('src/')).sort();
    const record = {
      about: 'Written by tools/build-scenes.mjs. tests/scene-bundles.test.cjs compares sourcesSha256 with the source files.',
      sources, sourcesSha256: fingerprint(sources), esbuild: used.esbuild, three: used.three,
    };
    writeFileSync(path.join(root, path.dirname(bundle.output), 'scene.build.json'), `${JSON.stringify(record, null, 2)}\n`);
    console.log(`${bundle.output}: ${Math.round(statSync(path.join(root, bundle.output)).size / 1024)} KB from ${sources.join(', ')}`);
  }
  console.log(`esbuild ${used.esbuild} and three ${used.three} from ${tools.from}`);
} finally { rmSync(scratch, { recursive: true, force: true }); }
