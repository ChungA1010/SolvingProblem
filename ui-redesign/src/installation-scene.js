import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import modelBase64 from '../dist/models/cmp-polishing-cell.glb';
import { createWorkshopRoom } from './workshop-room.js';
import { createWaferHandling } from './wafer-handling.js';
import { createProcessFinish } from './process-finish.js';

export function createInstallation({canvas,before,after,item,onReady,onUnavailable}){
  let renderer,disposed=false,ready=false,processFinish=null;
  const release=root=>{const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());};
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true});}catch{queueMicrotask(onUnavailable);return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=.92;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xe3e8db);
  const camera=new THREE.OrthographicCamera(-14,14,9,-9,.1,100);camera.position.set(10,8.7,21);camera.lookAt(0,1.0,-1.6);
  scene.add(new THREE.HemisphereLight(0xfff8e9,0x687d71,1.3));const light=new THREE.DirectionalLight(0xfff3d5,2.5);light.position.set(-5,12,8);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.normalBias=.025;Object.assign(light.shadow.camera,{left:-15,right:15,top:15,bottom:-15,far:50});scene.add(light);
  const pmrem=new THREE.PMREMGenerator(renderer),studio=new RoomEnvironment(),env=pmrem.fromScene(studio,.07);scene.environment=env.texture;studio.dispose();pmrem.dispose();
  const room=createWorkshopRoom(),handling=createWaferHandling();handling.update();scene.add(room,handling.group);room.userData.setAppearance(before);
  function draw(){if(!disposed&&ready){room.userData.updateCamera(camera);try{renderer.render(scene,camera);}catch{onUnavailable();}}}
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(disposed||!w||!h)return;renderer.setSize(w,h,false);const aspect=w/h,span=Math.max(14.5,25/aspect);camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();draw();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const lost=e=>{e.preventDefault();if(!disposed)onUnavailable();};canvas.addEventListener('webglcontextlost',lost);
  const raw=atob(modelBase64),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  Promise.all([new GLTFLoader().parseAsync(bytes.buffer,''),room.userData.ready]).then(([gltf,catalog])=>{
    if(disposed){release(gltf.scene);return;}
    gltf.scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.envMapIntensity=.6;if(m.name==='Housing_Powdercoat')m.color.setHex(0xe5e3ce);if(m.name==='Anodized_Blue')m.color.setHex(0x628575);}});
    // The Blender file stores moving roles at their origins. Assemble the same idle geometry as the live cell.
    const geometry=window.CMPSceneModel.geometry(null),role=name=>gltf.scene.getObjectByName(name);
    role('CmpHeadAssembly').position.set(.8,geometry.waferTop,.18);role('CmpHeadAssembly').scale.y=.70;
    role('CmpRetainer').position.set(.8,geometry.filmBottom,.18);role('CmpWafer').visible=role('CmpFilm').visible=false;
    const bottom=geometry.waferTop+.955*.70,height=Math.max(.08,2.42-bottom);
    for(const name of ['CmpSpindle','CmpBellows']){role(name).position.set(.8,bottom+height/2,.18);role(name).scale.y=height;}
    processFinish=createProcessFinish(gltf.scene,catalog);processFinish.update(before);
    scene.add(gltf.scene);ready=true;resize();onReady();
  }).catch(()=>{if(!disposed)onUnavailable();});
  return {setFrame(frame){room.userData.setAppearance(item==='decor'&&frame.progress<.5?before:after);processFinish?.update(frame.progress<.72?before:after);room.userData.animateInstallation(item,frame);draw();},showFinal(){room.userData.setAppearance(after);processFinish?.update(after);draw();},dispose(){disposed=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);room.userData.disposeTextures();processFinish?.dispose();release(scene);env.dispose();renderer.dispose();renderer.forceContextLoss();}};
}
