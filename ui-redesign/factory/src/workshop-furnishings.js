import * as THREE from 'three';
import { loadWorkshopCatalog } from './workshop-catalog.js';

// Visible game upgrades. Dimensions and installation are illustrative.
export function createFurnishings(){
  const root=new THREE.Group(),groups={},textures=[];let disposed=false,catalog=null;
  const material=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness:.55});
  const cream=material(0xecebd8),green=material(0x557a69),steel=material(0x929f9e,.55),rubber=material(0x293f3a),amber=material(0xdca45e);
  const led=new THREE.MeshBasicMaterial({color:0x96e0c2});
  const part=(g,size,pos,mat)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat===led?mat.clone():mat);mesh.userData.isLed=mat===led;mesh.position.set(...pos);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;};
  function group(key,pos){const g=new THREE.Group();g.position.set(...pos);g.userData.home=g.position.clone();groups[key]=g;root.add(g);return g;}
  function cylinder(g,r,h,pos,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),mat);m.position.set(...pos);m.castShadow=true;g.add(m);return m;}
  function label(g,text,pos,w=1.5){const c=document.createElement('canvas');c.width=384;c.height=96;const x=c.getContext('2d');x.fillStyle='#244c40';x.fillRect(0,0,384,96);x.fillStyle='#ebf2db';x.font='600 35px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,192,49);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map:t}));m.position.set(...pos);g.add(m);}
  const isolation=group('isolation',[0,-1.5,4.82]);
  part(isolation,[18.4,.34,.32],[0,0,0],green);label(isolation,'ISOLATION',[0,.02,.18],2.2);
  for(const x of [-7.6,7.6]){part(isolation,[1.25,1.3,.75],[x,-.8,-.1],steel);for(let j=0;j<4;j++)part(isolation,[1.4,.11,.95],[x,-.7-j*.17,-.04],rubber);part(isolation,[1.8,.16,1.2],[x,-1.5,0],green);part(isolation,[.65,.12,.08],[x,-.83,.47],amber);}

  const control=group('control',[0,0,0]);
  part(control,[16,.4,2.1],[0,5.7,-2.3],cream);part(control,[15.5,.15,1.9],[0,5.4,-2.3],green);
  for(const x of [-6,-3,0,3,6])for(let z=0;z<4;z++)part(control,[2.3,.06,.08],[x,5.29,-2.9+z*.4],steel);
  for(const x of [-8.15,8.15]){part(control,[.17,5.95,.18],[x,2.25,-2.3],green);part(control,[.17,4,.18],[x,1.05,1.2],green);part(control,[.17,.14,3.5],[x,3.0,-.55],green);part(control,[.055,3.75,3.4],[x,1,-.55],new THREE.MeshPhysicalMaterial({color:0xa7d7cb,transparent:true,opacity:.20,roughness:.08,depthWrite:false}));}
  part(control,[3,1.75,.28],[-3.1,2.8,-7.72],rubber);label(control,'ENV / CONTROL',[-3.1,3.23,-7.55],2.6);
  for(let i=0;i<3;i++){part(control,[1.8,.10,.03],[-3.25,2.87-i*.25,-7.54],steel);part(control,[1.3-i*.25,.10,.04],[-3.5,2.87-i*.25,-7.51],led);}
  part(control,[17.9,.055,.09],[0,-.93,4.77],led);

  const highlight=new THREE.Box3Helper(new THREE.Box3(),0xd5af6b);highlight.material.transparent=true;highlight.material.depthTest=false;highlight.renderOrder=10;root.add(highlight);highlight.visible=false;
  let settings={environment:0,care:0,pad:0,endpoint:0,decor:[]};
  const slots={
    air:['shop_environment',[3.1,3.1,-7.65],1.05],
    tools:['shop_care_1',[-7.1,-.915,-.3],1.05],station:['shop_care_2',[-7.1,-.915,-.3],1.05],
    pad1:['shop_pad_1',[-6.5,-.915,-4.5],.82],pad2:['shop_pad_2',[-6.5,-.915,-4.5],.82],
    endpoint1:['shop_endpoint_1',[6.45,-.915,-2.3],.95],endpoint2:['shop_endpoint_2',[6.45,-.915,-2.3],.95],
    task_lamp:['shop_task_lamp',[-7.35,-.915,2.45],1.05],storage_cabinet:['shop_storage_cabinet',[7.4,-.915,-5.9],.92],
    note_board:['shop_note_board',[-.2,1.75,-7.7],.85],floor_plant:['shop_floor_plant',[-9.5,-3.05,5.8],1.7],
    wall_clock:['shop_wall_clock',[-9.2,3.5,-7.85],1.0],wall_shelf:['shop_wall_shelf',[7.6,3.7,-7.7],1.1]
  };
  const ready=loadWorkshopCatalog().then(loaded=>{
    if(disposed){loaded.dispose();return null;}catalog=loaded;
    for(const [key,[name,pos,scale]]of Object.entries(slots)){
      const g=group(key,pos),item=loaded.take(name);item.scale.setScalar(scale);g.add(item);g.userData.catalogModel=name;
    }
    update(settings);return loaded;
  });
  function update(next){
    settings={...settings,...next};
    const shown={air:settings.environment>=1,isolation:settings.environment>=2,control:settings.environment>=3,tools:settings.care===1,station:settings.care===2,pad1:settings.pad===1,pad2:settings.pad===2,endpoint1:settings.endpoint===1,endpoint2:settings.endpoint===2};
    for(const [key,g]of Object.entries(groups)){g.visible=Object.hasOwn(shown,key)?shown[key]:(settings.decor||[]).includes(key);g.position.copy(g.userData.home);g.traverse(o=>{if(o.userData.isLed)o.material.color.setHex(0x96e0c2);});}
    highlight.visible=false;
  }
  function animate(key,frame){update(settings);const g=groups[key];if(!g)return;g.visible=true;g.position.y+=frame.lift;g.position.x+=frame.slide;g.traverse(o=>{if(o.userData.isLed)o.material.color.setHex(frame.progress<.72?0x405a4f:0x96e0c2);});g.updateWorldMatrix(true,true);highlight.box.setFromObject(g);highlight.visible=frame.progress<1;highlight.material.opacity=.2+frame.pulse*.65;}
  update(settings);
  return {root,ready,update,animate,disposeTextures(){disposed=true;textures.forEach(t=>t.dispose());catalog?.dispose();}};
}
