// The learning lab's 3D scene is committed as a bundle (dist/lab-3d/scene.js, built by tools/build-lab3d.mjs).
// These tests fail when the bundle is older than its source, so a change to the scene cannot ship without a rebuild.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const record = JSON.parse(fs.readFileSync(path.join(root, 'dist/lab-3d/scene.build.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('dist/lab-3d/scene.js was built from the current src/lab-3d-scene.js', () => {
  const source = fs.readFileSync(path.join(root, record.source), 'utf8').replace(/\r\n/g, '\n');   // the same text on every OS
  assert.equal(createHash('sha256').update(source).digest('hex'), record.sourceSha256,
    `${record.source} changed after the last build. Run "node tools/build-lab3d.mjs" and commit dist/lab-3d/scene.js and scene.build.json with it.`);
});

test('the bundle was built with the three.js and esbuild versions that package.json names', () => {
  assert.equal(record.three, pkg.dependencies.three);
  assert.equal(record.esbuild, pkg.devDependencies.esbuild);
});

test('the bundle defines the global that dist/lab-3d/app.js uses', () => {
  const bundle = fs.readFileSync(path.join(root, 'dist/lab-3d/scene.js'), 'utf8');
  assert.ok(bundle.length > 100000, 'the bundle is far too small to hold three.js');
  assert.match(bundle.slice(0, 200), /\bCMPLab3DScene\b/);
});
