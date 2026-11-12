import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import catalogBase64 from '../dist/models/workshop-catalog.glb';

// Each scene owns its materials/geometry, so closing an installation cannot
// dispose the live workbench. Embedded GLB also supports the file:// preview.
export async function loadWorkshopCatalog(){
  const bytes=Uint8Array.from(atob(catalogBase64),c=>c.charCodeAt(0));
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer,'');
  const objects=new Map(scene.children.map(o=>[o.name,o]));
  scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])m.envMapIntensity=.55;}});
  return {scene,take(name){const item=objects.get(name);if(!item)throw new Error(`Missing catalog model: ${name}`);objects.delete(name);item.removeFromParent();return item;},dispose(){
    const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.clear();
  }};
}
