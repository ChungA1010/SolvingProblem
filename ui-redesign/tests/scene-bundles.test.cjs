// The 3D scenes are committed as bundles (dist/lab-3d/scene.js, dist/process-lab/scene.js, built by tools/build-scenes.mjs).
// These tests fail when a bundle is older than its sources, so a change to a scene cannot ship without a rebuild.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const BUNDLES = { 'lab-3d': 'CMPLab3DScene', 'process-lab': 'CMPProcessLabScene' };     // folder in dist -> global the page uses

for (const [name, global] of Object.entries(BUNDLES)) {
  const record = JSON.parse(fs.readFileSync(path.join(root, 'dist', name, 'scene.build.json'), 'utf8'));

  test(`dist/${name}/scene.js was built from the current sources`, () => {
    const hash = createHash('sha256');                        // the same fingerprint as tools/build-scenes.mjs: LF text, so it is the same on every OS
    for (const file of [...record.sources].sort()) hash.update(`${file}\n${fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n')}\n`);
    assert.equal(hash.digest('hex'), record.sourcesSha256,
      `${record.sources.join(', ')} changed after the last build. Run "node tools/build-scenes.mjs ${name}" and commit dist/${name}/scene.js and scene.build.json with it.`);
  });

  test(`dist/${name}/scene.js was built with the three.js and esbuild versions that package.json names`, () => {
    assert.equal(record.three, pkg.dependencies.three);
    assert.equal(record.esbuild, pkg.devDependencies.esbuild);
  });

  test(`dist/${name}/scene.js defines the global its page uses`, () => {
    const bundle = fs.readFileSync(path.join(root, 'dist', name, 'scene.js'), 'utf8');
    assert.ok(bundle.length > 100000, 'the bundle is far too small to hold three.js');
    assert.match(bundle.slice(0, 200), new RegExp(`\\b${global}\\b`));
  });
}
