import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import modelBase64 from '../dist/models/cmp-polishing-cell.glb';

// Blender-authored role nodes are driven by the shared six-second playback.
// The GLB is bundled as bytes so file:// does not need fetch, CORS or a CDN.
export function create({host,canvas,fallback,detail,onUnavailable}) {
  let renderer,asset=null,roles=null,lastFrame=null,ready=false,lost=false,disposed=false;
  let transparent=host.querySelector('#scene-transparent').checked;
  let cutaway=host.querySelector('#scene-cutaway').checked;
  const padMeshes=[],headMaterials=[],ringMaterials=[],waferMaterials=[],textures=[];
  const model=window.CMPSceneModel;
  const partModel=window.CMPSceneParts;
  const tip=host.querySelector('#scene-part-tip'),partSelect=host.querySelector('#scene-part-select');
  const activePart={value:0},pickMeshes=[];
  const raycaster=new THREE.Raycaster(),pointerNdc=new THREE.Vector2();
  let selectedPart=null,pinned=false,pointer=null,gesture=null,hoverFrame=null,lastPickTime=0;
  partSelect.replaceChildren(new Option('부품 역할 보기',''),...partModel.parts.map(part=>new Option(part.title,String(part.id))));
  partSelect.disabled=true;
  const unavailable=()=>{
    host.dataset.renderer='unavailable';fallback.hidden=false;
    partSelect.disabled=true;
    clearPart(false);
    fallback.textContent='3D 화면을 사용할 수 없어 아래 표면·단면 시연으로 표시합니다.';
    canvas.hidden=true;host.querySelector('.scene-labels').hidden=true;detail.open=true;onUnavailable?.();
  };
  try {
    const context=canvas.getContext('webgl2',{antialias:true,alpha:true});
    if(!context){unavailable();return null;}
    renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:true});
  } catch {unavailable();return null;}
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-6,6,4.4,-4.4,.1,100);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.localClippingEnabled=true;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.0;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.06);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  scene.background=new THREE.Color(0xdbe2eb);
  scene.add(new THREE.HemisphereLight(0xf5f8ff,0x93a4ba,1.4));
  const key=new THREE.DirectionalLight(0xfffaf2,3.0);key.position.set(-4,9,6);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);key.shadow.normalBias=.016;key.shadow.radius=3;
  Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.5,far:25});scene.add(key);
  const fill=new THREE.DirectionalLight(0xd7e6ff,1.5);fill.position.set(6,5,0);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffffff,2.0);rim.position.set(-2,6,-6);scene.add(rim);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:new THREE.Color().setRGB(.79,.85,.94),roughness:.78}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.915;ground.receiveShadow=true;scene.add(ground);
  const controls=new OrbitControls(camera,canvas);controls.target.set(-.15,.65,-.15);
  controls.enablePan=false;controls.enableDamping=false;controls.rotateSpeed=.65;controls.zoomSpeed=.65;
  controls.minPolarAngle=.035;controls.maxPolarAngle=Math.PI*.49;
  controls.minZoom=.65;controls.maxZoom=3;
  controls.addEventListener('change',render);
  function customView(){host.dataset.view='custom';host.querySelectorAll('[data-scene-view]').forEach(b=>b.setAttribute('aria-pressed','false'));}
  const slice=new THREE.Plane(new THREE.Vector3(0,0,-1),.18);

  // Small local surface maps complement the actual bevels, sockets and pad channels.
  function makeTexture(kind){
    const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
    if(kind==='silicon'){
      const g=x.createLinearGradient(0,0,512,512);
      [[0,'#274358'],[.3,'#698a9d'],[.5,'#8b7d9e'],[.73,'#4d8c94'],[1,'#233f53']].forEach(([p,color])=>g.addColorStop(p,color));
      x.fillStyle=g;x.fillRect(0,0,512,512);
      for(let i=0;i<512;i+=26)for(let j=0;j<512;j+=26){x.fillStyle='#0b203e50';x.fillRect(i+1,j+1,23,23);x.strokeStyle='#c1e0eb55';x.strokeRect(i+4,j+4,15,16);}
    }else{
      x.fillStyle='#888888';x.fillRect(0,0,512,512);let seed=19;
      for(let i=0;i<(kind==='brush'?512:12000);i++){
        seed=(seed*1664525+1013904223)>>>0;const v=95+seed%60;x.fillStyle=`rgb(${v},${v},${v})`;
        if(kind==='brush')x.fillRect(0,i,512,1);else x.fillRect(seed%512,(seed>>>10)%512,1.2,1.2);
      }
    }
    const t=new THREE.CanvasTexture(c);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    if(kind==='silicon')t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;
  }
  const brush=makeTexture('brush'),padGrain=makeTexture('grain'),waferMap=makeTexture('silicon');
  function uvProject(mesh,radius){
    const p=mesh.geometry.attributes.position,uv=new Float32Array(p.count*2);
    for(let i=0;i<p.count;i++){uv[i*2]=.5+p.getX(i)/(radius*2);uv[i*2+1]=.5+p.getZ(i)/(radius*2);}
    mesh.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  }
  function releaseObject(root){
    const geometries=new Set(),mats=new Set();
    root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});
    geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
  }
  function cloneRoleMaterials(root,list){
    const copies=new Map();root.traverse(o=>{
      if(!o.isMesh)return;
      const clone=m=>{if(!copies.has(m)){const n=m.clone();copies.set(m,n);list.push(n);}return copies.get(m);};
      o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);
    });
  }
  const liquidMat=new THREE.MeshStandardMaterial({color:0x6ebac6,metalness:.15,roughness:.22});
  const droplets=Array.from({length:14},()=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),liquidMat);m.scale.y=1.7;m.visible=false;scene.add(m);return m;
  });
  const liquid=new THREE.Mesh(new THREE.CircleGeometry(.22,32),new THREE.MeshStandardMaterial({color:0x9ed8df,transparent:true,opacity:.40,roughness:.14}));
  liquid.rotation.x=-Math.PI/2;liquid.visible=false;scene.add(liquid);
  const contactRing=new THREE.Mesh(new THREE.TorusGeometry(1.335,.018,8,96),new THREE.MeshStandardMaterial({color:0x49c5c9,transparent:true,opacity:.5,roughness:.35}));
  contactRing.rotation.x=Math.PI/2;contactRing.visible=false;scene.add(contactRing);
  const force=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(),.5,0x1687ce,.14,.08);force.visible=false;scene.add(force);
  // Section faces are explanatory cut surfaces, not a device pattern on the back.
  const sectionWafer=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1),new THREE.MeshStandardMaterial({color:0x596b7b,roughness:.5,side:THREE.DoubleSide}));
  const sectionFilm=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1),new THREE.MeshStandardMaterial({color:0x35b4b8,roughness:.5,side:THREE.DoubleSide}));
  scene.add(sectionWafer,sectionFilm);sectionWafer.visible=sectionFilm.visible=false;
  sectionWafer.userData.cmpPart=2;sectionFilm.userData.cmpPart=3;
  pickMeshes.push(sectionWafer,sectionFilm);

  function showPart(part,shouldRender=true){
    if(selectedPart?.id===part?.id)return;
    selectedPart=part;activePart.value=part?.id||0;
    host.dataset.activePart=part?.key||'';
    tip.hidden=!part;partSelect.value=part?String(part.id):'';
    if(part){host.querySelector('#scene-part-title').textContent=part.title;host.querySelector('#scene-part-description').textContent=part.description;}
    sectionWafer.material.emissive.setHex(part?.id===2?0x153557:0);
    sectionFilm.material.emissive.setHex(part?.id===3?0x153557:0);
    if(shouldRender)render();
  }
  function clearPart(shouldRender=true){pinned=false;pointer=null;showPart(null,shouldRender);}
  function partAt(clientX,clientY){
    if(!ready||lost||disposed)return null;
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    pointerNdc.set((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2);
    scene.updateMatrixWorld(true);camera.updateMatrixWorld();raycaster.setFromCamera(pointerNdc,camera);
    for(const hit of raycaster.intersectObjects(pickMeshes,false)){
      let shown=true;for(let obj=hit.object;obj;obj=obj.parent){if(!obj.visible){shown=false;break;}}
      if(!shown)continue;
      const material=Array.isArray(hit.object.material)?hit.object.material[hit.face.materialIndex]:hit.object.material;
      // A clipped or transparent head must not conceal the underlying wafer from picking.
      if(material.opacity<.25||material.clippingPlanes?.some(plane=>plane.distanceToPoint(hit.point)<-1e-5))continue;
      const part=partModel.forHit(hit);if(part)return part;
    }
    return null;
  }
  function updateHover(){
    if(!pointer||pinned||gesture?.moved)return;
    lastPickTime=performance.now();showPart(partAt(pointer.x,pointer.y),false);
  }
  const pointerMove=event=>{
    if(gesture){
      if(Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>6){gesture.moved=true;host.dataset.dragging='true';clearPart(false);customView();}
      return;
    }
    if(event.pointerType!=='mouse'||pinned)return;
    pointer={x:event.clientX,y:event.clientY};
    if(hoverFrame===null)hoverFrame=requestAnimationFrame(()=>{hoverFrame=null;if(!disposed){updateHover();render();}});
  };
  const pointerDown=event=>{gesture={x:event.clientX,y:event.clientY,moved:false};};
  const pointerUp=event=>{
    const tap=gesture&&!gesture.moved&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<=6;
    gesture=null;host.dataset.dragging='false';
    if(tap){pinned=true;pointer=null;const part=partAt(event.clientX,event.clientY);if(!part)pinned=false;showPart(part);}
  };
  const pointerCancel=()=>{gesture=null;host.dataset.dragging='false';clearPart();};
  const pointerLeave=event=>{pointer=null;if(!pinned&&!tip.contains(event.relatedTarget))showPart(null);};
  const tipLeave=()=>{if(!pinned)showPart(null);};
  const closePart=()=>{clearPart();};
  const choosePart=()=>{pointer=null;pinned=Boolean(partSelect.value);showPart(partModel.forId(partSelect.value));};
  const dismissPart=event=>{if(event.key==='Escape'&&!tip.hidden)clearPart();};
  const documentHidden=()=>{if(document.hidden)clearPart(false);};
  canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);canvas.addEventListener('pointerleave',pointerLeave);
  tip.addEventListener('pointerleave',tipLeave);host.querySelector('#scene-part-close').addEventListener('click',closePart);
  partSelect.addEventListener('change',choosePart);document.addEventListener('keydown',dismissPart);document.addEventListener('visibilitychange',documentHidden);

  const labelPoints={head:new THREE.Vector3(),wafer:new THREE.Vector3(),front:new THREE.Vector3(),pad:new THREE.Vector3(),slurry:new THREE.Vector3(-1.7,1.18,.95),conditioner:new THREE.Vector3(-3.58,1.47,-.74)};
  const labels=Object.entries(labelPoints).map(([name,point])=>({name,point,element:host.querySelector(`[data-scene-label="${name}"]`)}));
  const projected=new THREE.Vector3();
  function render(){
    if(!ready||disposed||lost||!host.getClientRects().length)return;
    if(pointer&&performance.now()-lastPickTime>100)updateHover();
    try{renderer.render(scene,camera);}catch{lost=true;unavailable();return;}
    const w=canvas.clientWidth,h=canvas.clientHeight;
    for(const {name,point,element} of labels){
      projected.copy(point).project(camera);element.hidden=(name==='front'&&!cutaway)||projected.z>1||Math.abs(projected.x)>.90||Math.abs(projected.y)>.93;
      element.style.left=`${(projected.x+1)/2*w}px`;element.style.top=`${(1-projected.y)/2*h}px`;
    }
  }
  function setView(view='perspective'){
    const positions={perspective:[8.5,8.0,11.8],front:[0,3.2,14.2],top:[.01,15.5,.01]};if(!positions[view])return;
    clearPart(false);camera.position.set(...positions[view]);camera.zoom=1;camera.updateProjectionMatrix();
    controls.update();host.dataset.view=view;
    host.querySelectorAll('[data-scene-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sceneView===view)));render();
  }
  function resize(){
    if(disposed)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h){clearPart(false);return;}
    renderer.setSize(w,h,false);const aspect=w/h,span=8.8*Math.max(1,1.28/aspect);
    camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
    camera.updateProjectionMatrix();controls.update();render();
  }
  function deformPad(depth,angle,baseHeight){
    const c=Math.cos(angle),s=Math.sin(angle);
    for(const {mesh,positions,normals} of padMeshes){
      const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
      for(let i=0;i<p.count;i++){
        const j=i*3,x=positions[j],y=positions[j+1],z=positions[j+2];
        const sample=model.padContact(c*x+s*z,-s*x+c*z,depth);
        const weight=THREE.MathUtils.clamp((y-.42)/.06,0,1);
        p.array[j+1]=.42+(baseHeight-sample.drop)*weight;
        const dx=sample.dx*c-sample.dz*s,dz=sample.dx*s+sample.dz*c;
        const b=(baseHeight-sample.drop)/.06,ny=normals[j+1]/b;
        const nx=normals[j]+dx*weight*ny,nz=normals[j+2]+dz*weight*ny;
        const length=Math.hypot(nx,ny,nz)||1;n.array[j]=nx/length;n.array[j+1]=ny/length;n.array[j+2]=nz/length;
      }
      p.needsUpdate=true;n.needsUpdate=true;
    }
  }
  function setFrame(frame){
    lastFrame=frame;const g=model.geometry(frame,{cutaway});
    host.dataset.phase=g.phase;host.dataset.film=g.filmHeight.toFixed(4);host.dataset.gap=g.gap.toFixed(4);
    host.dataset.padDepth=g.padDepth.toFixed(4);
    host.dataset.displayMode=cutaway?'section-exaggerated':'overview';
    host.dataset.removedFraction=String(frame?.removedFraction||0);
    host.querySelector('.scene-phase').textContent=({idle:'장비 구조',approach:'접근',contact:'접촉 연마',release:'분리',complete:'연마 종료'})[g.phase];
    if(!roles)return;
    roles.CmpPadRotor.rotation.y=g.padRotation;deformPad(g.padDepth,g.padRotation,g.padBaseHeight);
    for(const name of ['CmpHeadAssembly','CmpRetainer','CmpWafer','CmpFilm'])roles[name].rotation.y=g.headRotation;
    roles.CmpFilm.position.set(.8,g.filmBottom,.18);roles.CmpFilm.scale.y=g.filmHeight;
    roles.CmpWafer.position.set(.8,g.waferBottom,.18);roles.CmpWafer.scale.y=g.waferHeight/.075;
    roles.CmpHeadAssembly.position.set(.8,g.waferTop,.18);roles.CmpHeadAssembly.scale.y=.70;
    roles.CmpRetainer.position.set(.8,g.filmBottom,.18);
    const shaftBottom=g.waferTop+.955*.70,shaftHeight=Math.max(.08,2.42-shaftBottom);
    for(const name of ['CmpSpindle','CmpBellows']){
      roles[name].position.set(.8,shaftBottom+shaftHeight/2,.18);roles[name].scale.y=shaftHeight;
    }
    contactRing.position.set(.8,g.padTop+.012,.18);contactRing.visible=g.contacting&&cutaway;
    contactRing.material.opacity=frame?frame.contactOpacity:0;
    force.visible=g.contacting&&cutaway;force.position.set(.8,g.waferTop+1.25,.18);
    force.setLength(.30+(frame?frame.compression/14*.3:0),.14,.08);
    liquid.visible=g.contacting;liquid.position.set(-1.55,g.padRestTop+.004,.95);
    const flow=frame?.slurryRatio ?? 1;
    liquid.scale.setScalar(Math.sqrt(flow));
    droplets.forEach((drop,i)=>{drop.visible=g.contacting;drop.scale.setScalar(Math.sqrt(flow));const t=((frame?frame.progress*18*flow:0)+i/14)%1;drop.position.set(-1.55+.014*Math.sin(i*2),.86-t*(.86-g.padRestTop),.95);});
    sectionWafer.visible=sectionFilm.visible=cutaway;
    sectionWafer.position.set(.8,(g.waferTop+g.waferBottom)/2,.181);sectionWafer.scale.y=g.waferHeight;
    sectionFilm.position.set(.8,g.filmBottom+g.filmHeight/2,.182);sectionFilm.scale.y=g.filmHeight;
    labelPoints.head.set(1.87,g.waferTop+(cutaway?.95:.40),.15);labelPoints.wafer.set(.4,g.waferTop,cutaway?.18:1.60);
    labelPoints.front.set(1.8,g.filmBottom,1.2);labelPoints.pad.set(-1.65,g.padRestTop,2.55);
    render();
  }
  function setTransparent(value){
    transparent=value;
    headMaterials.forEach(m=>{m.transparent=value;m.opacity=value?.16:1;m.depthWrite=!value;m.needsUpdate=true;});render();
  }
  function setCutaway(value){
    cutaway=value;host.dataset.cutaway=String(value);
    [...headMaterials,...ringMaterials,...waferMaterials].forEach(m=>{m.clippingPlanes=value?[slice]:[];m.clipShadows=true;m.needsUpdate=true;});
    host.querySelector('#scene-scale-note').textContent=value
      ? '단면: 눌림·막 두께 확대 · 실측 배율 아님'
      : '일반: 변형 축소 · 연마면은 아래쪽';
    if(roles)setFrame(lastFrame);
  }
  function zoom(factor){
    clearPart(false);camera.zoom=THREE.MathUtils.clamp(camera.zoom/factor,controls.minZoom,controls.maxZoom);
    camera.updateProjectionMatrix();controls.update();render();
  }
  const keydown=event=>{
    const k=event.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(k))return;
    event.preventDefault();if(k==='Home'){setView();return;}if(k==='+'||k==='='){zoom(.9);return;}if(k==='-'){zoom(1.1);return;}
    const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta+=k==='ArrowLeft'?-.13:k==='ArrowRight'?.13:0;
    spherical.phi=THREE.MathUtils.clamp(spherical.phi+(k==='ArrowUp'?-.1:k==='ArrowDown'?.1:0),controls.minPolarAngle,controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();customView();render();
  };
  canvas.addEventListener('keydown',keydown);
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const contextLost=event=>{event.preventDefault();lost=true;unavailable();};
  const contextRestored=()=>{
    lost=false;canvas.hidden=false;fallback.hidden=ready;host.querySelector('.scene-labels').hidden=!ready;
    host.querySelectorAll('button,input').forEach(item=>{item.disabled=false;});
    partSelect.disabled=!ready;
    host.dataset.renderer='webgl';setFrame(lastFrame);resize();
  };
  canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
  host.dataset.renderer='webgl';host.dataset.model='loading';host.querySelector('.scene-labels').hidden=true;
  fallback.textContent='장비 모델을 불러오는 중입니다.';setView();resize();
  const raw=atob(modelBase64),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  new GLTFLoader().parseAsync(bytes.buffer,'').then(gltf=>{
    if(disposed){releaseObject(gltf.scene);return;}
    asset=gltf.scene;roles={};
    for(const name of ['CmpStatic','CmpPadRotor','CmpPadSurface','CmpHeadAssembly','CmpHeadCover','CmpRetainer','CmpWafer','CmpFilm','CmpSpindle','CmpBellows']){
      roles[name]=asset.getObjectByName(name);if(!roles[name])throw new Error(`Missing model role: ${name}`);
    }
    const studioMaterials={Housing_Powdercoat:[[.76,.82,.9],.12,.3],Brushed_Steel:[[.36,.44,.56],.72,.3],Machined_Aluminum:[[.67,.75,.87],.68,.25],Anodized_Blue:[[.016,.16,.61],.48,.27],Pad_Polyurethane:[[.19,.24,.32],.02,.86],Silicon_Back:[[.13,.22,.37],.7,.19]};
    const seen=new Set();asset.traverse(o=>{
      if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;pickMeshes.push(o);
      if(!o.geometry.getAttribute('_cmp_part'))throw new Error('Missing semantic part attribute');
      for(const m of (Array.isArray(o.material)?o.material:[o.material])){
        if(seen.has(m))continue;seen.add(m);m.envMapIntensity=.65;
        const style=studioMaterials[m.name];if(style){m.color.setRGB(...style[0]);m.metalness=style[1];m.roughness=style[2];}
        if(/Steel|Aluminum|Chrome/.test(m.name)){m.bumpMap=brush;m.bumpScale=.0018;}
        if(m.name==='Pad_Polyurethane'){m.bumpMap=padGrain;m.bumpScale=.004;}
        if(m.name==='Device_Front'){m.color.setHex(0xffffff);m.map=waferMap;}
      }
    });
    roles.CmpWafer.traverse(o=>{if(o.isMesh)uvProject(o,1.15);});
    roles.CmpFilm.traverse(o=>{if(o.isMesh)uvProject(o,1.15);});
    roles.CmpPadSurface.traverse(o=>{
      if(!o.isMesh)return;uvProject(o,3.2);
      o.geometry.boundingBox=null;o.geometry.computeBoundingSphere();o.geometry.boundingSphere.radius+=.3;
      padMeshes.push({mesh:o,positions:o.geometry.attributes.position.array.slice(),normals:o.geometry.attributes.normal.array.slice()});
    });
    cloneRoleMaterials(roles.CmpHeadAssembly,headMaterials);cloneRoleMaterials(roles.CmpRetainer,ringMaterials);
    cloneRoleMaterials(roles.CmpWafer,waferMaterials);cloneRoleMaterials(roles.CmpFilm,waferMaterials);
    const highlighted=new Set();asset.traverse(o=>{
      if(!o.isMesh)return;
      for(const material of Array.isArray(o.material)?o.material:[o.material]){
        if(highlighted.has(material))continue;highlighted.add(material);
        material.onBeforeCompile=shader=>{
          shader.uniforms.cmpActivePart=activePart;
          shader.vertexShader='attribute float _cmp_part; varying float vCmpPart;\n'+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCmpPart = _cmp_part;');
          shader.fragmentShader='uniform float cmpActivePart; varying float vCmpPart;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.025, 0.14, 0.36) * (1.0 - step(0.1, abs(vCmpPart - cmpActivePart)));');
        };
        material.customProgramCacheKey=()=> 'cmp-semantic-highlight-v1';
      }
    });
    scene.add(asset);ready=true;partSelect.disabled=false;host.dataset.model='blender-glb';
    if(!lost){fallback.hidden=true;host.querySelector('.scene-labels').hidden=false;}
    setTransparent(transparent);setCutaway(cutaway);setFrame(lastFrame);resize();
  }).catch(()=>{if(!disposed){host.dataset.model='failed';ready=false;unavailable();}});
  return {
    setFrame,setView,setTransparent,setCutaway,resize,zoom,
    setState(next){host.dataset.playback=next;},
    dispose(){
      disposed=true;observer.disconnect();controls.dispose();canvas.removeEventListener('keydown',keydown);
      if(hoverFrame!==null)cancelAnimationFrame(hoverFrame);
      canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);
      canvas.removeEventListener('pointercancel',pointerCancel);canvas.removeEventListener('pointerleave',pointerLeave);
      tip.removeEventListener('pointerleave',tipLeave);host.querySelector('#scene-part-close').removeEventListener('click',closePart);
      partSelect.removeEventListener('change',choosePart);document.removeEventListener('keydown',dismissPart);document.removeEventListener('visibilitychange',documentHidden);
      canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);
      releaseObject(scene);textures.forEach(t=>t.dispose());environment.dispose();renderer.dispose();
    }
  };
}
