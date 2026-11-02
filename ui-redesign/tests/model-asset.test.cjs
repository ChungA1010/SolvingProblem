const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const bytes=fs.readFileSync(path.join(__dirname,'../dist/models/cmp-polishing-cell.glb'));
const jsonLength=bytes.readUInt32LE(12);
const asset=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
const binary=bytes.subarray(20+jsonLength+8);
const roles=['CmpStatic','CmpPadRotor','CmpPadSurface','CmpHeadAssembly','CmpHeadCover','CmpRetainer','CmpWafer','CmpFilm','CmpSpindle','CmpBellows'];
function positions(accessorIndex){
  const a=asset.accessors[accessorIndex],v=asset.bufferViews[a.bufferView];
  assert.equal(a.componentType,5126);assert.equal(a.type,'VEC3');
  const offset=(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||12;
  return Array.from({length:a.count},(_,i)=>[0,4,8].map(j=>binary.readFloatLE(offset+i*stride+j)));
}
test('the Blender GLB includes each required animation role once in neutral rest space',()=>{
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
  for(const role of roles){
    const nodes=asset.nodes.filter(n=>n.name===role);assert.equal(nodes.length,1,role);
    assert.equal(nodes[0].extras.cmp_role,role);
    assert.deepEqual(nodes[0].translation||[0,0,0],[0,0,0]);
    assert.deepEqual(nodes[0].scale||[1,1,1],[1,1,1]);
    assert.deepEqual(nodes[0].rotation||[0,0,0,1],[0,0,0,1]);
  }
});
test('model is self-contained and bounded for the local browser preview',()=>{
  for(const b of [...asset.buffers,...(asset.images||[])])assert.ok(!b.uri,'External asset dependency');
  assert.ok(bytes.length<6*1024*1024);
  const primitives=asset.meshes.flatMap(m=>m.primitives);
  assert.ok(primitives.length<=40);
  assert.ok(primitives.reduce((n,p)=>n+asset.accessors[p.indices].count/3,0)<160000);
});

test('every rendered triangle retains one valid semantic part after Blender batching',()=>{
  const {parts}=require('../dist/scene-parts.js');
  const allowed=new Set(parts.map(part=>part.id)),found=new Set();
  function scalars(index){
    const a=asset.accessors[index],v=asset.bufferViews[a.bufferView];assert.equal(a.type,'SCALAR');
    const size={5126:4,5125:4,5123:2,5121:1}[a.componentType];assert.ok(size);
    const read={5126:'readFloatLE',5125:'readUInt32LE',5123:'readUInt16LE',5121:'readUInt8'}[a.componentType];
    const start=(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||size;
    return Array.from({length:a.count},(_,i)=>binary[read](start+i*stride));
  }
  for(const primitive of asset.meshes.flatMap(mesh=>mesh.primitives)){
    assert.ok('_CMP_PART' in primitive.attributes,'A visible primitive is missing its part ID');
    const ids=scalars(primitive.attributes._CMP_PART),indices=scalars(primitive.indices);
    assert.equal(ids.length,asset.accessors[primitive.attributes.POSITION].count);
    ids.forEach(id=>{assert.ok(allowed.has(id),`Unknown part ${id}`);found.add(id);});
    for(let i=0;i<indices.length;i+=3){
      assert.equal(ids[indices[i]],ids[indices[i+1]]);assert.equal(ids[indices[i]],ids[indices[i+2]]);
    }
  }
  assert.deepEqual([...found].sort((a,b)=>a-b),[...allowed].sort((a,b)=>a-b));
});
test('retaining ring has a genuine central opening, not a filled cylinder',()=>{
  const n=asset.nodes.find(n=>n.name==='CmpRetainer_Mesh');
  const p=asset.meshes[n.mesh].primitives.find(p=>asset.materials[p.material].name==='PEEK_Retainer');
  const points=positions(p.attributes.POSITION);
  for(const [x,y,z] of points){assert.ok(Math.hypot(x,z)>1.164);assert.ok(Math.hypot(x,z)<1.311);assert.ok(y>=-1e-6&&y<=.121);}
});
test('pad rest geometry is aligned with the animation contact datum',()=>{
  const n=asset.nodes.find(n=>n.name==='CmpPadSurface_Mesh');
  const pts=asset.meshes[n.mesh].primitives.flatMap(p=>positions(p.attributes.POSITION));
  const ys=pts.map(p=>p[1]);
  assert.ok(Math.abs(Math.max(...ys)-.48)<1e-5);
  assert.ok(Math.abs(Math.min(...ys)-.42)<1e-5);
});

test('device pattern material belongs only to downward faces; upper wafer stays plain silicon',()=>{
  for(const role of ['CmpWafer','CmpFilm']){
    const n=asset.nodes.find(n=>n.name===role+'_Mesh');
    const primitives=asset.meshes[n.mesh].primitives;
    const front=primitives.filter(p=>asset.materials[p.material].name==='Device_Front');
    assert.ok(front.length>0);
    for(const p of front){
      for(const [,y] of positions(p.attributes.POSITION))assert.ok(Math.abs(y)<1e-6);
      for(const [,ny] of positions(p.attributes.NORMAL))assert.ok(ny<-.99);
    }
    if(role==='CmpWafer')assert.ok(primitives.some(p=>asset.materials[p.material].name==='Silicon_Back'));
  }
});
