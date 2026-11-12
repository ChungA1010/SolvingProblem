import * as THREE from 'three';

// Optional furniture; placement never changes the process model.
export function createDecorations(){
  const root=new THREE.Group(),groups={},textures=[];
  const material=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness:.48});
  const ivory=material(0xece3ca),sage=material(0x6a8e77),brass=material(0xc69a50,.65),dark=material(0x314b40),wood=material(0xaf805a),paper=material(0xfff3d1);
  const box=(g,size,pos,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.set(...pos);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
  function group(key,pos){const g=new THREE.Group();g.position.set(...pos);g.userData.home=g.position.clone();root.add(g);groups[key]=g;return g;}
  function cylinder(g,r,h,pos,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),mat);m.position.set(...pos);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
  function rod(g,a,b,r,mat){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),16),mat);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());g.add(mesh);return mesh;}

  const lamp=group('task_lamp',[7.15,-.9,1.35]);
  cylinder(lamp,.64,.15,[0,.08,0],dark);cylinder(lamp,.49,.09,[0,.20,0],brass);
  rod(lamp,[0,.25,0],[0,1.65,-.15],.075,brass);rod(lamp,[0,1.65,-.15],[-.72,2.35,-.1],.065,sage);
  for(const pos of [[0,1.65,-.15],[-.72,2.35,-.1]]){const joint=new THREE.Mesh(new THREE.SphereGeometry(.14,16,10),dark);joint.position.set(...pos);lamp.add(joint);}
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.48,.45,32,1,true),sage);shade.position.set(-.72,2.16,-.1);shade.rotation.z=-.15;lamp.add(shade);
  const glow=new THREE.Mesh(new THREE.CircleGeometry(.4,32),new THREE.MeshBasicMaterial({color:0xffe3a3,side:THREE.DoubleSide}));glow.rotation.x=-Math.PI/2;glow.position.set(-.72,1.95,-.1);lamp.add(glow);
  const light=new THREE.PointLight(0xffdb9e,6,6,2);light.position.set(-.72,1.85,-.1);light.userData.installPower=6;lamp.add(light);

  const cabinet=group('storage_cabinet',[7.15,-.9,-3.6]);
  box(cabinet,[2.15,2.7,1.7],[0,1.4,0],sage);box(cabinet,[2.3,.13,1.85],[0,2.82,0],wood);
  for(let i=0;i<3;i++){box(cabinet,[1.92,.62,.09],[0,.52+i*.72,.9],ivory);box(cabinet,[.7,.065,.09],[0,.59+i*.72,.99],brass);box(cabinet,[.38,.17,.015],[.54,.4+i*.72,.96],paper);}
  for(const x of [-.8,.8])box(cabinet,[.2,.22,.2],[x,.1,.5],dark);
  const folders=[ivory,sage,paper];for(let i=0;i<3;i++)box(cabinet,[.43,.4,.74],[-.55+i*.49,3.09,-.18],folders[i]);

  const board=group('note_board',[-.2,3.5,-7.65]);
  box(board,[2.55,2.35,.16],[0,0,0],wood);box(board,[2.32,2.12,.05],[0,0,.11],material(0xbca176));
  const c=document.createElement('canvas');c.width=512;c.height=440;const ctx=c.getContext('2d');ctx.fillStyle='#bca176';ctx.fillRect(0,0,512,440);
  const notes=[{x:25,y:30,w:230,h:175,c:'#fff6df'},{x:282,y:48,w:205,h:125,c:'#d7e6d4'},{x:100,y:241,w:308,h:170,c:'#e6d4b9'}];
  for(const n of notes){ctx.fillStyle='#76664a30';ctx.fillRect(n.x+5,n.y+5,n.w,n.h);ctx.fillStyle=n.c;ctx.fillRect(n.x,n.y,n.w,n.h);ctx.fillStyle='#6b7c61';ctx.beginPath();ctx.arc(n.x+n.w/2,n.y+10,6,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='#678577';ctx.lineWidth=3;ctx.beginPath();ctx.arc(138,125,52,0,Math.PI*2);ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(101+i*17,90);ctx.lineTo(101+i*17,158);ctx.stroke();}ctx.fillStyle='#556c5a';ctx.font='600 19px sans-serif';ctx.fillText('PROCESS NOTES',299,93);for(let i=0;i<3;i++)ctx.fillRect(300,112+i*16,130-i*20,3);ctx.fillText('NEXT EXPERIMENT',132,281);ctx.beginPath();ctx.moveTo(133,370);ctx.lineTo(166,351);ctx.lineTo(204,360);ctx.lineTo(246,315);ctx.lineTo(307,327);ctx.lineTo(364,304);ctx.stroke();
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);const face=new THREE.Mesh(new THREE.PlaneGeometry(2.31,2.10),new THREE.MeshBasicMaterial({map:texture}));face.position.z=.145;board.add(face);

  function update(placed=[]){for(const [key,g]of Object.entries(groups)){g.visible=placed.includes(key);g.position.copy(g.userData.home);g.traverse(o=>{if(o.userData.installPower)o.intensity=o.userData.installPower;});}}
  update();return {root,groups,update,disposeTextures(){textures.forEach(t=>t.dispose());}};
}
