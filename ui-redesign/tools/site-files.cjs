// What the site is made of, in one place: its parts (one folder each), its pages, and which files of this folder
// belong to the site as a visitor gets it. The tools that build, check and export the site and
// tests/site-layout.test.cjs all read it from here.
//
// The site root is this folder (ui-redesign/): index.html and one folder per part. A part's folder holds what the
// browser loads at its top level and in media/ and models/; what only its makers need sits in the folders named in
// WORKSHOP below and never goes out with the site.
const fs = require('node:fs');
const path = require('node:path');

/** Folder of each part -> what it is and which other parts its files may load from (links to pages are free). */
const PARTS = {
  home: { what: 'the mode selection page (index.html at the root)', uses: ['shared', 'factory'] },
  shared: { what: 'what several parts load: the base stylesheet, the font, licence texts', uses: [] },
  factory: { what: 'CMP Factory, the game; also the scripts of the parked inner screens of index.html', uses: ['shared'] },
  'lab-3d': { what: 'the learning lab, the 3D polisher', uses: ['shared'] },
  'process-lab': { what: 'the 8-process lab', uses: ['shared', 'lab-3d'] },
  'lab-sim': { what: 'the lab simulator (parked)', uses: ['shared', 'factory'], parked: true },
};
/** Name of a page (as the single-file build and the checks call it) -> its file. */
const PAGES = { index: 'index.html', game: 'factory/game.html', 'lab-3d': 'lab-3d/lab-3d.html', 'process-lab': 'process-lab/process-lab.html', 'lab-sim': 'lab-sim/lab-sim.html' };
/** Files at the root that belong to the site. game.html only sends an old address on to factory/game.html. */
const ROOT_FILES = ['index.html', 'game.html'];
/** Folders inside a part that hold sources, tests, tools, notes and local data: not part of the site. */
const WORKSHOP = ['src', 'tests', 'tools', 'docs', 'model-source', 'data'];
const leftOut = name => name.startsWith('.') || name.endsWith('.md') || name === 'scene.build.json';

/** The part a file of the site belongs to (index.html and game.html belong to the home page). */
const partOf = file => (file.includes('/') ? file.split('/')[0] : 'home');

/** Files of the site, as paths from the site root with forward slashes. `parked` adds the parked parts. */
function siteFiles(root, { parked = false } = {}) {
  const files = ROOT_FILES.filter(name => fs.existsSync(path.join(root, name)));
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (leftOut(entry.name)) continue;
      if (entry.isDirectory()) { if (!WORKSHOP.includes(entry.name)) walk(`${dir}/${entry.name}`); }
      else files.push(`${dir}/${entry.name}`);
    }
  };
  for (const [name, part] of Object.entries(PARTS)) if (parked || !part.parked) walk(name);
  return files.sort();
}

module.exports = { PARTS, PAGES, ROOT_FILES, WORKSHOP, partOf, siteFiles };
