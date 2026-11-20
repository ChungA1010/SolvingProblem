import * as THREE from 'three';

// Catalog parts use the cell's original contact plane. Rendering does not alter calculation.
export function createProcessFinish(asset,catalog){
  const pads=[],disks=[],originalDisks=[],originalPad=asset.getObjectByName('CmpPadSurface');
  function bake(name){
    const root=catalog.take(name);root.updateWorldMatrix(true,true);const meshes=[];
    root.traverse(o=>{if(o.isMesh)meshes.push(o);});
    for(const mesh of meshes){mesh.geometry.applyMatrix4(mesh.matrixWorld);mesh.removeFromParent();mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);}
    root.clear();root.position.set(0,0,0);root.quaternion.identity();root.scale.set(1,1,1);root.add(...meshes);root.updateMatrixWorld(true);return root;
  }
  function reshape(root,transform){root.traverse(o=>{if(o.isMesh){o.geometry.applyMatrix4(transform);o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();}});}
  for(let level=1;level<=2;level++){
    const pad=bake(`working_pad_${level}`),bounds=new THREE.Box3().setFromObject(pad),h=bounds.max.y-bounds.min.y;
    const matrix=new THREE.Matrix4().makeScale(3.2/1.43,.06/h,3.2/1.43);matrix.setPosition(0,.42-bounds.min.y*.06/h,0);reshape(pad,matrix);
    asset.getObjectByName('CmpPadRotor').add(pad);pads.push(pad);
  }
  // Split the parked disk out of the original batched arm, leaving the spindle and rinse cup intact.
  asset.getObjectByName('CmpStatic').traverse(o=>{
    if(!o.isMesh)return;const g=o.geometry,p=g.getAttribute('position'),ids=g.getAttribute('_cmp_part');if(!ids)return;
    const source=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i),keep=[],disk=[],keepGroups=[],diskGroups=[];
    const groups=g.groups.length?g.groups:[{start:0,count:source.length,materialIndex:0}];
    const inside=i=>ids.getX(i)===8&&p.getX(i)>-4&&p.getX(i)<-3.17&&p.getZ(i)>-1.16&&p.getZ(i)<-.32&&p.getY(i)>.675&&p.getY(i)<.825;
    for(const group of groups){const k=keep.length,d=disk.length;for(let j=group.start;j<group.start+group.count;j+=3){const tri=source.slice(j,j+3);(tri.every(inside)?disk:keep).push(...tri);}if(keep.length>k)keepGroups.push({start:k,count:keep.length-k,materialIndex:group.materialIndex});if(disk.length>d)diskGroups.push({start:d,count:disk.length-d,materialIndex:group.materialIndex});}
    if(!disk.length)return;
    const split=(index,groups)=>{const geometry=g.clone();geometry.setIndex(index);geometry.clearGroups();groups.forEach(a=>geometry.addGroup(a.start,a.count,a.materialIndex));return geometry;};
    const mesh=new THREE.Mesh(split(disk,diskGroups),o.material);mesh.name='OriginalConditionerDisk';mesh.position.copy(o.position);mesh.quaternion.copy(o.quaternion);mesh.scale.copy(o.scale);originalDisks.push({mesh,parent:o.parent});o.geometry=split(keep,keepGroups);g.dispose();
  });
  for(const {mesh,parent}of originalDisks)parent.add(mesh);
  for(let level=1;level<=2;level++){
    const disk=bake(`working_care_${level}`),b=new THREE.Box3().setFromObject(disk),c=b.getCenter(new THREE.Vector3()),h=b.max.y-b.min.y;
    const sx=.38/Math.max((b.max.x-b.min.x)/2,(b.max.z-b.min.z)/2),sy=-.125/h;
    const matrix=new THREE.Matrix4().makeScale(sx,sy,sx);matrix.setPosition(-3.58-c.x*sx,.75-c.y*sy,-.74-c.z*sx);reshape(disk,matrix);asset.add(disk);disks.push(disk);
  }
  return {padRoots:pads,update({pad=0,care=0}={}){originalPad.visible=pad===0;pads.forEach((o,i)=>o.visible=pad===i+1);originalDisks.forEach(({mesh})=>mesh.visible=care===0);disks.forEach((o,i)=>o.visible=care===i+1);},dispose(){}};
}
