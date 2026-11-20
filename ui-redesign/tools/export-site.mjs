// Copy the site, as a visitor gets it, into one folder that can be uploaded as it is: site/ (kept out of git).
//
// The site root is this folder (ui-redesign/), where the sources, tests, tools and notes of every part sit beside its
// pages. Uploading the folder itself would send those along, and on a PC that has them also the single-file builds and
// the lab simulator's replay data. This copies only what tools/site-files.cjs counts as the site.
//
// The parked lab simulator is left out, as in the single-file build; --parked puts its page in. Its replay data
// (lab-sim/data/, derived from the PHM 2016 data) is never copied, with or without --parked.
// Usage: node tools/export-site.mjs [--parked] [output folder]      (default: site/)
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import layout from './site-files.cjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), parked = args.includes('--parked');
const out = path.resolve(args.find(arg => !arg.startsWith('--')) || path.join(root, 'site'));
const MARK = '.cmp-lab-site';   // written into the output folder, so that a later run knows the folder is its own
const fail = message => { console.error(`export-site: ${message}`); process.exit(1); };

const inside = (child, parent) => child === parent || child.startsWith(parent + path.sep);
if (inside(root, out)) fail(`${out} holds the site itself`);
if (inside(out, root) && [...Object.keys(layout.PARTS), 'tools', 'tests', 'standalone', 'evidence', 'node_modules'].some(name => inside(out, path.join(root, name)))) fail(`${out} is inside a folder of the site`);
if (existsSync(out) && readdirSync(out).length && !existsSync(path.join(out, MARK))) fail(`${out} is not empty and was not made by this tool. Give another folder, or empty it yourself.`);

const files = layout.siteFiles(root, { parked });
const data = files.filter(file => file.split('/').includes('data'));
if (data.length) fail(`local data would go out: ${data[0]}`);   // site-files.cjs leaves data/ out; this stops the export if that ever changes

rmSync(out, { recursive: true, force: true });
let bytes = 0;
for (const file of files) {
  const to = path.join(out, file);
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(path.join(root, file), to);
  bytes += statSync(to).size;
}
writeFileSync(path.join(out, MARK), `Written by tools/export-site.mjs on ${new Date().toISOString().slice(0, 10)}. The next run empties this folder first.\n`);

const perPart = {};
for (const file of files) perPart[layout.partOf(file)] = (perPart[layout.partOf(file)] || 0) + 1;
console.log(`wrote ${out}: ${files.length} files, ${(bytes / 1048576).toFixed(1)} MB`);
console.log(`  ${Object.entries(perPart).map(([part, count]) => `${part} ${count}`).join(', ')}`);
console.log(`  ${parked ? 'with the parked lab simulator page (without its replay data)' : 'left out (parked): ' + Object.keys(layout.PARTS).filter(name => layout.PARTS[name].parked).join(', ')}`);
console.log('  open index.html in it, or upload the folder as it is');
