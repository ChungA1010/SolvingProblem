import * as THREE from 'three';

// Explanatory tabletop transport. All wafers look identical before measurement.
export function createWaferHandling(){
  const group=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:0x819286,metalness:.45,roughness:.45});
  const cream=new THREE.MeshStandardMaterial({color:0xe6e7cf,roughness:.65}),dark=new THREE.MeshStandardMaterial({color:0x385947,roughness:.7});
  const silicon=new THREE.MeshPhysicalMaterial({color:0x455c72,metalness:.86,roughness:.15,clearcoat:.9,iridescence:.8,iridescenceThicknessMinimum:280,iridescenceThicknessMaximum:420});
  const source=[-4.9,0,2.1],output=[7.55,0,1.8],meter=[4.6,-.19,-2.2];
  const box=(size,pos,material,parent=group)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
  // The smooth back faces up. A small orientation notch and a polished rim
  // make the loose disc legible against the chuck without marking its quality.
  const outline=new THREE.Shape();
  const radius=1.15,notch=.052;
  outline.absarc(0,0,radius,-Math.PI/2+notch,Math.PI*1.5-notch,false);
  outline.lineTo(0,-radius+.063);
  outline.closePath();
  const discGeometry=new THREE.ExtrudeGeometry(outline,{depth:.022,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:2,curveSegments:48});
  discGeometry.rotateX(-Math.PI/2);
  const edge=new THREE.MeshStandardMaterial({color:0xa2b4bf,metalness:.78,roughness:.26});
  silicon.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vDisc;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDisc=position;');
    shader.fragmentShader='varying vec3 vDisc;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float band=dot(vDisc.xz,vec2(.78,.63));
      vec3 finish=mix(vec3(.24,.36,.47),vec3(.53,.66,.68),smoothstep(-1.15,.85,band));
      finish+=vec3(.16,.08,.05)*exp(-20.*(band-.28)*(band-.28));
      diffuseColor.rgb=finish;
    `);
  };
  const disc=()=>{const m=new THREE.Mesh(discGeometry,[silicon,edge]);m.castShadow=m.receiveShadow=true;return m;};
  const pitch=base=>base===output?.41:.17;
  const slot=(base,i)=>[base[0],-.51+i*pitch(base),base[2]];
  for(const base of [source,output]){
    box([2.65,.22,2.7],[base[0],-.77,base[2]],dark);
    box([2.45,.08,2.5],[base[0],-.62,base[2]],cream);
    for(const dx of [-1.28,1.28])box([.10,.70+5*pitch(base),2.7],[base[0]+dx,-.35+2.5*pitch(base),base[2]],metal);
    for(let i=0;i<6;i++)for(const dx of [-1.12,1.12])box([.23,.045,2.42],[base[0]+dx,-.55+i*pitch(base),base[2]],cream);
  }
  const graphite=new THREE.MeshStandardMaterial({color:0x273d43,metalness:.35,roughness:.42});
  const padLights = {};
  for(const [key,pos,color] of [['measure',meter,0x53b7b9],['store',output,0xe4aa5c]]){
    const light=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.18});
    padLights[key]=light;
    const z=pos[2]+1.28;
    box([2.20,.09,.11],[pos[0],-.59,z],graphite);
    box([1.98,.045,.12],[pos[0],-.575,z+.015],light);
  }
  const loose=disc();
  group.add(loose);
  // Shared notched silhouette for the solids, their in-world guides, and picking.
  const perimeter=outline.getPoints(48);
  const rimY=.028;
  const profile=perimeter.slice(0,-1).map(p=>new THREE.Vector3(p.x,rimY,-p.y));
  function band(inner,outer,dashed=false){
    const vertices=[];
    for(let i=0;i<profile.length;i++){
      if(dashed && i%8>=5)continue;
      const a=profile[i],b=profile[(i+1)%profile.length];
      for(const [p,k] of [[a,inner],[a,outer],[b,outer],[a,inner],[b,outer],[b,inner]])
        vertices.push(p.x*k,rimY,p.z*k);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));return g;
  }
  const guideMat=(color,opacity=1)=>new THREE.MeshBasicMaterial({
    color,opacity,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false
  });
  const edgeBand=band(.968,1),underBand=band(.945,.97),brokenBand=band(.958,1,true);
  const sourceRim=new THREE.Mesh(edgeBand,guideMat(0xffdc85));
  const sourceKeyline=new THREE.Mesh(underBand,guideMat(0x79502c,.86));
  loose.add(sourceRim,sourceKeyline);
  sourceRim.renderOrder=sourceKeyline.renderOrder=5;
  const guides={};
  for(const [key,tint] of [['place',0x32cabb],['measure',0x32cabb],['store',0xffc171],['discard',0xe88975]]){
    const root=new THREE.Group();
    const fill=new THREE.Mesh(discGeometry,guideMat(tint,.32));
    const rim=new THREE.Mesh(brokenBand,guideMat(tint,.99));
    fill.renderOrder=2;rim.renderOrder=3;root.add(fill,rim);group.add(root);
    guides[key]={root,fill,rim};
  }
  let showLandingLights=false;
  const carriedStored=disc(), parked=disc();
  group.add(carriedStored,parked);
  let slotInHand=null, pointedSlot=null, seating=null;
  function resetSeating(){
    if(!seating)return;
    seating.mesh.position.copy(seating.position);
    seating.mesh.rotation.z=0;
    seating=null;
  }
  function settle(point){
    resetSeating();
    // Find the actual wafer left at the committed drop location. No state or
    // anchors move, and discarded wafers do not reappear for the animation.
    const mesh=[loose,parked,...finished].find(w=>w.visible && w.position.distanceToSquared(point)<.025);
    if(!mesh)return false;
    seating={mesh,position:mesh.position.clone(),elapsed:0};
    mesh.position.y+=.09;
    return true;
  }
  function animateSeating(delta){
    if(!seating)return false;
    seating.elapsed=Math.min(180,seating.elapsed+delta);
    const remaining=1-seating.elapsed/180;
    seating.mesh.position.y=seating.position.y+.09*remaining*remaining;
    seating.mesh.rotation.z=.015*Math.sin(remaining*Math.PI*2)*remaining;
    if(!remaining)resetSeating();
    return !!seating;
  }
  function carry(position,landing,slotIndex){
    resetSeating();
    if(Number.isInteger(slotIndex)){
      slotInHand=slotIndex;
      finished[slotIndex].visible=false;
      carriedStored.visible=true;
      carriedStored.position.copy(position);
      carriedStored.rotation.z=landing?0:.03;
      return;
    }
    loose.position.copy(position);
    loose.rotation.z=landing?0:.035;
    sourceRim.material.color.setHex(landing?0xfff4ce:0xffdc85);
    for(const [key,{fill,rim}] of Object.entries(guides)){
      fill.visible=rim.visible=landing!==key;
    }
    for(const [key,light] of Object.entries(padLights))light.emissiveIntensity=showLandingLights&&landing===key?1.8:.18;
  }
  const supply=Array.from({length:6},(_,i)=>{const w=disc();w.position.set(...slot(source,5-i));group.add(w);return w;});
  const finished=Array.from({length:6},(_,i)=>{const w=disc();w.position.set(...slot(output,i));group.add(w);return w;});
  // Open optical inspection bridge. The beam is an illustration, not a sensor model.
  box([3,.38,3.05],[meter[0],-.68,meter[2]],dark);
  box([2.7,.08,2.75],[meter[0],-.45,meter[2]],metal);
  const bed=new THREE.Mesh(new THREE.CylinderGeometry(1.22,1.22,.22,64),cream);bed.position.set(meter[0],-.30,meter[2]);group.add(bed);
  for(const dx of [-1.35,1.35])box([.16,1.9,.38],[meter[0]+dx,.35,meter[2]-.4],cream);
  box([2.9,.3,.65],[meter[0],1.4,meter[2]-.4],cream);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.20,.27,.3,24),dark);lens.position.set(meter[0],1.1,meter[2]-.4);group.add(lens);
  const lamp=box([.5,.05,.12],[meter[0]+.7,1.22,meter[2]-.05],new THREE.MeshBasicMaterial({color:0x63bfb1}));
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.075),new THREE.MeshBasicMaterial({color:0x4bffd9,side:THREE.DoubleSide,toneMapped:false}));beam.rotation.x=-Math.PI/2;group.add(beam);
  // Freestanding reject bin. The cabinet front is at z=4.7 and the floor at y=-3.05.
  const rejectX=5.8,rejectZ=6.4,floor=-3.05;
  const enamel=new THREE.MeshStandardMaterial({color:0xa75843,roughness:.65});
  const lining=new THREE.MeshStandardMaterial({color:0x493d39,roughness:.9});
  box([2.66,.16,2.64],[rejectX,floor+.08,rejectZ],enamel);
  for(const sign of [-1,1]){
    box([.14,1.52,2.64],[rejectX+1.26*sign,floor+.76,rejectZ],enamel);
    box([2.40,1.52,.14],[rejectX,floor+.76,rejectZ+1.25*sign],enamel);
  }
  const binBed=floor+1.16;
  box([2.40,.08,2.38],[rejectX,binBed-.04,rejectZ],lining);
  for(const angle of [-.78,.78]){
    const mark=box([.92,.024,.11],[rejectX,binBed+.013,rejectZ],cream);
    mark.rotation.y=angle;
  }
  const anchors = {
    port: new THREE.Vector3(...source),
    incoming: new THREE.Vector3(),
    platen: new THREE.Vector3(.8,.484,.18),
    out: new THREE.Vector3(),
    meter: new THREE.Vector3(...meter),
    reject: new THREE.Vector3(rejectX,binBed+.03,rejectZ),
    rack: new THREE.Vector3(...output)
  };
  finished.forEach((disc,i)=>{anchors['slot'+i]=disc.position.clone();});
  function hoverSlot(index){
    pointedSlot=index;
  }
  function reach(index){ return finished[index].position.z-output[2]; }
  function animateHover(factor){
    let moving=false;
    finished.forEach((disc,index)=>{
      const rest=output[2], target=rest+(index===pointedSlot && slotInHand===null?.48:0);
      const gap=target-disc.position.z;
      disc.position.z=Math.abs(gap)<.004?target:disc.position.z+gap*factor;
      moving ||= disc.position.z!==target;
    });
    return moving;
  }
  function update({docked=true,station='idle',completed=0,measured=false,canMeasure=false,interactive=true,guided=false,slots=[],returnSlot=null,freeSlot=0,parkedAt=null,frame=null,padTop=.48}={}){
    resetSeating();
    showLandingLights=guided;
    const n=Math.max(0,Math.min(6,completed));
    const onBench=station==='feed'||station==='setup';
    slotInHand=null;carriedStored.visible=false;
    parked.visible=!!parkedAt;
    if(parkedAt)parked.position.copy(anchors[parkedAt]);
    anchors.incoming.set(...slot(source,Math.max(0,5-n)));
    anchors.platen.y=padTop+.004;
    anchors.rack.set(...slot(output,returnSlot??freeSlot??0));
    anchors.out.copy(measured?anchors.meter:anchors.platen);
    supply.forEach((w,i)=>w.visible=docked && i>=n+(onBench?1:0));
    finished.forEach((w,i)=>{w.visible=slots.includes(i);if(!w.visible)w.position.z=output[2];});
    loose.visible=(onBench && n<6) || station==='result';
    const resting=station==='feed'?anchors.incoming:station==='setup'?anchors.platen:anchors.out;
    const feed=interactive && guided && station==='feed',sort=interactive && guided && station==='result';
    sourceRim.visible=sourceKeyline.visible=feed||sort;
    sourceRim.material.color.setHex(0xffdc85);
    for(const [key,anchor,visible] of [['place',anchors.platen,feed],['measure',anchors.meter,sort&&canMeasure&&!measured],['store',anchors.rack,sort],['discard',anchors.reject,sort]]){
      const {root,fill,rim}=guides[key];
      root.position.copy(anchor);root.visible=visible;fill.visible=rim.visible=true;
    }
    loose.position.copy(resting);
    loose.rotation.z=0;
    for(const light of Object.values(padLights))light.emissiveIntensity=.18;
    beam.visible=station==='result' && frame?.phase==='scan';
    lamp.material.color.setHex(beam.visible?0xa2ffe0:0x63bfb1);
    if(beam.visible)beam.position.set(meter[0],meter[1]+.035,meter[2]-.7+frame.local*1.4);
  }
  update();
  return {group,update,anchors,carry,profile,hoverSlot,animateHover,reach,settle,animateSeating};
}
