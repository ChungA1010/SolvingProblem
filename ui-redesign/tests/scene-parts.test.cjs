const {test}=require('node:test');
const assert=require('node:assert/strict');
const parts=require('../dist/scene-parts.js');
test('different parts sharing a static mesh are identified from the hit face',()=>{
  const ids=[7,7,7,11,11,11,8,8,8];
  const object={geometry:{getAttribute:name=>name==='_cmp_part'?{getX:i=>ids[i]}:null}};
  assert.equal(parts.forHit({object,face:{a:0}}).key,'slurry');
  assert.equal(parts.forHit({object,face:{a:3}}).key,'base');
  assert.equal(parts.forHit({object,face:{a:6}}).key,'conditioner');
});
test('generated section faces can explain the wafer and film without a GLB attribute',()=>{
  assert.equal(parts.forHit({object:{userData:{cmpPart:2}}}).key,'wafer');
  assert.equal(parts.forHit({object:{userData:{cmpPart:3}}}).key,'film');
});
test('empty selection and missing hit metadata never invent a part',()=>{
  for(const id of ['',0,NaN,99,null])assert.equal(parts.forId(id),null);
  for(const hit of [null,{}, {object:{}}])assert.equal(parts.forHit(hit),null);
  assert.equal(parts.forId('5').title,'연마 패드');
});
