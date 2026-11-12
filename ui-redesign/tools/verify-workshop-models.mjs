import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createProcessFinish} from '../src/process-finish.js';
const root=new URL('../',import.meta.url);
const load=async name=>{const b=await readFile(new URL(`dist/models/${name}.glb`,root));return (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;};
const [cell,catalog]=await Promise.all([load('cmp-polishing-cell'),load('workshop-catalog')]);
const manifest=JSON.parse(await readFile(new URL('dist/models/workshop-catalog.json',root),'utf8'));
for(const [id,entry]of Object.entries(manifest.assets)){
 assert.ok(catalog.getObjectByName(entry.node),id);
 assert.equal(createHash('sha256').update(await readFile(new URL(entry.source,root))).digest('hex'),entry.sha256,id+' source consistency');
 assert.ok((await readFile(new URL(`dist/media/workshop-catalog/${id}.png`,root))).length>1000);
}
const count=catalog.children.length;
const finish=createProcessFinish(cell,{take(name){const o=catalog.getObjectByName(name);assert.ok(o,name);o.removeFromParent();return o;}});
assert.equal(count-catalog.children.length,4);
assert.ok(cell.getObjectByName('OriginalConditionerDisk'),'original disk must be isolated, without removing the arm');
for(const [i,pad]of finish.padRoots.entries()){
 const b=new THREE.Box3().setFromObject(pad);assert.ok(Math.abs(b.min.y-.42)<1e-6);assert.ok(Math.abs(b.max.y-.48)<1e-6);assert.ok(b.max.x<=3.21);
 pad.traverse(o=>{if(o.isMesh){assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));assert.ok(Array.from(o.geometry.getAttribute('_cmp_part').array).every(x=>x===5));}});
 finish.update({pad:i+1,care:i+1});assert.equal(pad.visible,true);assert.equal(cell.getObjectByName('CmpPadSurface').visible,false);assert.equal(cell.getObjectByName('OriginalConditionerDisk').visible,false);
 assert.equal(finish.padRoots[1-i].visible,false);
}
finish.update();assert.equal(cell.getObjectByName('CmpPadSurface').visible,true);assert.equal(cell.getObjectByName('OriginalConditionerDisk').visible,true);assert.ok(finish.padRoots.every(o=>!o.visible));
console.log(`Verified ${Object.keys(manifest.assets).length} Blender source/preview pairs, live pad contact plane, semantic picking and tier replacement.`);
