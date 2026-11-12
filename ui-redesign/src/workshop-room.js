import * as THREE from 'three';
import { createPolishingRoomShell } from './polishing-room-shell.js';
import { createFurnishings } from './workshop-furnishings.js';

// A physical room around the existing Blender cell. No process geometry changes.
export function createWorkshopRoom() {
  const room = new THREE.Group();
  const matte = (color, roughness = .85) => new THREE.MeshStandardMaterial({color, roughness});
  const plaster = matte(0xd9dfcf), mint = matte(0x718b79), trim = matte(0xa7b59d);
  const wood = matte(0xb9966a), edge = matte(0x876747), metal = matte(0x476052);
  const cream = matte(0xf1edda);
  function box(size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);mesh.receiveShadow = true;mesh.castShadow = true;room.add(mesh);return mesh;
  }
  // The cell's original base rests at y = -0.915.
  box([19,.28,13],[0,-1.055,-1.8],cream);
  box([19,.13,.16],[0,-1.05,4.68],edge);
  box([19,1.8,.26],[0,-2.09,4.48],wood);
  box([19,.08,.14],[0,-1.31,4.65],edge);
  for(const x of [-7,-3.5,0,3.5,7])box([.018,1.65,.02],[x,-2.1,4.62],edge);
  const shell = createPolishingRoomShell({ plaster, mint, trim, metal });
  room.add(shell.root);
  room.userData.updateCamera = shell.updateCamera;
  box([23.2,.1,20.44],[0,-3.1,1.78],matte(0xbcc7b8));
  // Service shelf at the back of the polishing bench.
  box([5,.12,1.1],[4.9,1.38,-7.35],metal);
  box([4.3,.05,.83],[4.9,1.46,-7.35],cream);
  for(const x of [3.2,6.6])box([.1,.75,.1],[x,1.05,-7.4],metal);
  box([1.4,1.1,.7],[5.8,2.04,-7.2],cream);
  box([.7,.7,.02],[5.8,2.04,-6.83],mint);
  const taskLight = new THREE.PointLight(0xfff2d9, 14, 18, 2);
  taskLight.position.set(0, 6.7, -2.6);
  room.add(taskLight);
  // Visible purchases are decor only; calculations stay in the game model.
  const furnishings=createFurnishings();room.add(furnishings.root);
  const palettes={sage:[0xd9dfcf,0x718b79,0xa7b59d,0xb9966a,0x876747,0x476052],sand:[0xe9e1d2,0xa38a64,0xc4ae87,0xba885d,0x8d6142,0x6c654e],slate:[0xd8e1e7,0x6f8595,0xa2b4c0,0x8b8378,0x66646a,0x455e70]};
  room.userData.setAppearance=({theme='sage',environment=0,care=0,pad=0,endpoint=0,decor=[]}={})=>{const colors=palettes[theme]||palettes.sage;[plaster,mint,trim,wood,edge,metal].forEach((m,i)=>m.color.setHex(colors[i]));furnishings.update({environment,care,pad,endpoint,decor});};
  room.userData.ready=furnishings.ready;
  room.userData.animateInstallation=furnishings.animate;
  room.userData.disposeTextures=furnishings.disposeTextures;
  room.userData.setAppearance();
  return room;
}
