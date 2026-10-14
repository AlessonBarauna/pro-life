import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
// Vitruvian CC0 character assembled from the user's licensed archive.
(function(root){
"use strict";
const loader=new GLTFLoader();
let active=null;
const FILES=["src/assets/coach3d-realistic/vitruvian_body.glb","src/assets/coach3d-realistic/vitruvian_head.glb","src/assets/coach3d-realistic/vitruvian_hair.glb"];
function mount(host,config){
 if(active)active.dispose();
 const scene=new THREE.Scene();scene.background=new THREE.Color("#0c1a20");
 const camera=new THREE.PerspectiveCamera(32,1,.05,100);camera.position.set(0,1.56,2.25);camera.lookAt(0,1.42,0);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"low-power"});
 renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 host.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight("#e8f0f9","#36515a",2));
 const key=new THREE.DirectionalLight("#fff0dc",3);key.position.set(2,4,5);scene.add(key);
 const rim=new THREE.DirectionalLight("#9dd4db",2);rim.position.set(-3,3,-3);scene.add(rim);
 const assembled=new THREE.Group();scene.add(assembled);
 let disposed=false,raf=0,drag=false,lastX=0,turn=0,mixer=null,head=null,hair=null,body=null;
 const clock=new THREE.Clock();
 const skinMaterials=[],irisMaterials=[],shirtMaterials=[],pantsMaterials=[],hairMaterials=[],browMaterials=[];
 const originalColors=new Map();
 // Glasses authored for the Vitruvian head in its native meter coordinate space.
 // Curved frame mesh, temples and nose bridge; no oversized cylinder overlays.
 const eyewear=new THREE.Group();assembled.add(eyewear);
 const frameMaterial=new THREE.MeshStandardMaterial({color:0x24252b,roughness:.38,metalness:.22});
 const noseMaterial=new THREE.MeshStandardMaterial({color:0x656266,roughness:.6,metalness:.1});
 function curvedFrame(points,radius,material=frameMaterial){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*4),radius,8,false),material);
  eyewear.add(mesh);
 }
 for(const sign of [-1,1]){
  const lens=[];
  for(let i=0;i<=48;i++){
   const t=i*Math.PI*2/48,x=sign*.034+.024*Math.cos(t);
   lens.push([x,1.638+.016*Math.sin(t),.08-.008*(Math.abs(x)-.02)]);
  }
  curvedFrame(lens,.0021);
  curvedFrame([[sign*.057,1.639,.078],[sign*.068,1.641,.064],[sign*.077,1.640,.012],[sign*.077,1.637,-.033],[sign*.073,1.630,-.060]],.00165);
  curvedFrame([[sign*.013,1.632,.076],[sign*.012,1.627,.071],[sign*.010,1.626,.067]],.00135,noseMaterial);
 }
 curvedFrame([[-.011,1.639,.078],[-.006,1.635,.081],[0,1.634,.082],[.006,1.635,.081],[.011,1.639,.078]],.002);
 eyewear.visible=false;
 // Beard strands are fitted to the same Vitruvian face space as the approved eyewear.
 const facialHair=new THREE.Group();assembled.add(facialHair);
 const beardMaterial=new THREE.MeshStandardMaterial({color:0x241e1a,roughness:1,transparent:true,opacity:.84});
 const beardParts={stubble:new THREE.Group(),short:new THREE.Group(),full:new THREE.Group(),mustache:new THREE.Group(),goatee:new THREE.Group()};
 for(const part of Object.values(beardParts))facialHair.add(part);
 function strand(group,points,width){
  const curve=new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(4,points.length*3),width,4,false),beardMaterial);
  group.add(mesh);
 }
 // Fine facial strands; avoid opaque geometric caps covering lips or skin.
 for(let n=0;n<84;n++){
  const side=n%2===0?-1:1,segment=Math.floor(n/2);
  const t=segment/41,angle=t*Math.PI*.9;
  const x=side*(.018+.049*Math.sin(angle));
  const y=1.568-.063*t;
  const z=.078-.025*Math.abs(x)/.067-.009*t;
  const len=.0025+(segment%5)*.0005;
  strand(beardParts.stubble,[[x,y,z],[x+side*.0007,y-len,z+.0005]],.00035);
  strand(beardParts.short,[[x,y,z],[x+side*.0012,y-len*2,z+.0015]],.0008);
  strand(beardParts.full,[[x,y,z],[x+side*.0015,y-len*4,z+.003]],.0014);
 }
 for(let n=0;n<40;n++){
  const x=(n-19.5)*.0022,abs=Math.abs(x)/.044;
  const z=.093-.015*abs,y=1.572-.007*abs;
  const length=.004+.004*abs;
  strand(beardParts.mustache,[[x,y,z],[x+Math.sign(x)*.002,y-length,z+.002]],.0008);
 }
 for(let n=0;n<35;n++){
  const x=(n-17)*.0024,edge=Math.abs(x)/.042;
  const y=1.495+.009*edge,z=.073-.008*edge;
  strand(beardParts.goatee,[[x,y,z],[x+Math.sign(x)*.001,y-.013*(1-edge*.4),z+.001]],.0013);
 }
 const beardGroups={
  none:[],stubble:["stubble"],short:["short","mustache"],
  full:["full","mustache","goatee"],mustache:["mustache"],goatee:["mustache","goatee"]
 };

 let headBone=null,headRestInverse=null;
 const headCurrent=new THREE.Matrix4(),parentInverse=new THREE.Matrix4(),headDelta=new THREE.Matrix4();
 function attach(gltf,index){
   if(disposed)return;
   const obj=gltf.scene;assembled.add(obj);
   if(index===0){
     body=obj;
     headBone=obj.getObjectByName("mixamorig:Head");
     if(headBone){
       assembled.updateMatrixWorld(true);
       headCurrent.copy(assembled.matrixWorld).invert().multiply(headBone.matrixWorld);
       headRestInverse=headCurrent.clone().invert();
     }
     if(gltf.animations.length){
       mixer=new THREE.AnimationMixer(obj);
       const idle=gltf.animations.find(a=>/idle/i.test(a.name))||gltf.animations[0];
       // Creation preview uses a fixed neutral pose; do not auto-play movement.
     }
   } else if(index===1)head=obj;
   else hair=obj;
   obj.traverse(n=>{
     if(!n.isMesh)return;
     n.frustumCulled=false;
     if(Array.isArray(n.material))n.material=n.material.map(m=>m.clone());
     else if(n.material)n.material=n.material.clone();
     const mats=Array.isArray(n.material)?n.material:[n.material];
     for(const m of mats){
       if(!m)continue;
       const name=(m.name||"").toLowerCase();
       if(/^(vitskin|vitbody)$/i.test(name))skinMaterials.push(m);
       if(/^vitshirt$/i.test(name))shirtMaterials.push(m);
       if(/^vitpants$/i.test(name))pantsMaterials.push(m);
       if(/^vithairmat$/i.test(name))hairMaterials.push(m);
       if(/^vitbrowcardsmat$/i.test(name))browMaterials.push(m);
       if(name==="vitiris"||/^vitiris[.]\d+$/.test(name)||name.includes("iris"))irisMaterials.push(m);
       m.side=THREE.DoubleSide;
     }
   });
   const bbox=new THREE.Box3().setFromObject(obj);
   if(index===0&&Number.isFinite(bbox.min.y))assembled.position.y=-bbox.min.y;
   apply(config);
   if(index===2)host.dataset.avatarState="realistic";
 }
 function apply(next){
   config=next;
   const appearance=next.appearance||{};
   eyewear.visible=appearance.accessory==="glasses";
   const visibleBeard=beardGroups[appearance.beard]||[];
   for(const [name,part] of Object.entries(beardParts))part.visible=visibleBeard.includes(name);
   beardMaterial.color.set(appearance.hairColor||"#241e1a");
   function setTint(list,color){const tint=new THREE.Color(color);for(const material of list){if(!material.color)continue;if(!originalColors.has(material))originalColors.set(material,material.color.clone());material.color.copy(originalColors.get(material)).multiply(tint);}}
   // Preserve the source PBR materials; tint only their existing colors.
   const tint=new THREE.Color(appearance.skin||"#bc8660");
   setTint(skinMaterials,tint);
   const iris=new THREE.Color(appearance.eyeColor||"#694829");
   setTint(irisMaterials,iris);
   // Vitruvian eye textures can obscure baseColor tint; use material color and disable its base texture only for iris.
   for(const m of irisMaterials){if(m.map){m.map=null;m.needsUpdate=true;}}
   const color=new THREE.Color(appearance.hairColor||"#241e1a");
   setTint(hairMaterials,color);
   setTint(browMaterials,color);
   const outfits={suit:{shirt:"#253341",pants:"#182631"},tracksuit:{shirt:"#206052",pants:"#203b38"},polo:{shirt:"#e5e9e8",pants:"#2c394b"}};
   const chosen=outfits[next.outfit]||outfits.polo;
   setTint(shirtMaterials,chosen.shirt);
   setTint(pantsMaterials,chosen.pants);
   if(hair){
     const style=appearance.hair||"lowfade";
     // Hair and eyebrows share a GLB but are separate named meshes.
     // Do not scale the complete file: vertex coordinates are in world-space.
     hair.traverse(node=>{
       if(node.isMesh&&/^(VitHair|VitBrowCards)$/i.test(node.name)){
         node.visible=node.name!=="VitHair"||style!=="bald";
       }
     });
   }
   // The source contains one outfit, no beard/glasses meshes and no body morph targets.
   // Do not fake customization by overlaying primitive meshes.
 }
 function failure(error){
   if(disposed)return;
   host.dataset.avatarState="missing-assets";
   if(config.onError)config.onError(error);
 }
 // GLBs share the same 1.6m character-space. Loading in order keeps animation/rig stable.
 loader.load(FILES[0],g=>{
   attach(g,0);
   if(disposed)return;
   loader.load(FILES[1],h=>{
     attach(h,1);
     if(disposed)return;
     loader.load(FILES[2],x=>attach(x,2),undefined,failure);
   },undefined,failure);
 },undefined,failure);
 function resize(){const w=Math.max(1,host.clientWidth||420),h=Math.max(1,host.clientHeight||360);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;observer?.observe(host);resize();
 function down(e){drag=true;lastX=e.clientX;renderer.domElement.setPointerCapture?.(e.pointerId);}
 function move(e){if(drag){turn+=(e.clientX-lastX)*.008;lastX=e.clientX;}}
 function up(){drag=false;}
 renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointermove",move);
 renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("pointercancel",up);
 function frame(){if(disposed)return;raf=root.requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);mixer?.update(dt);assembled.rotation.y=turn;assembled.updateMatrixWorld(true);if(headBone&&headRestInverse){parentInverse.copy(assembled.matrixWorld).invert();headCurrent.multiplyMatrices(parentInverse,headBone.matrixWorld);headDelta.multiplyMatrices(headCurrent,headRestInverse);for(const part of [head,hair,eyewear,facialHair])if(part){part.matrixAutoUpdate=false;part.matrix.copy(headDelta);part.matrixWorldNeedsUpdate=true;}}renderer.render(scene,camera);}frame();
 const controller={update:apply,dispose(){
   if(disposed)return;disposed=true;root.cancelAnimationFrame(raf);observer?.disconnect();
   renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointermove",move);
   renderer.domElement.removeEventListener("pointerup",up);renderer.domElement.removeEventListener("pointercancel",up);
   mixer?.stopAllAction();
   const seen=new Set();
   assembled.traverse(n=>{if(!n.isMesh)return;n.geometry?.dispose();const mats=Array.isArray(n.material)?n.material:[n.material];for(const m of mats){if(m&&!seen.has(m)){seen.add(m);m.dispose();}}});
   eyewear.traverse(n=>{if(n.isMesh)n.geometry.dispose();});frameMaterial.dispose();noseMaterial.dispose();
   facialHair.traverse(n=>{if(n.isMesh)n.geometry.dispose();});beardMaterial.dispose();
   renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();if(active===controller)active=null;
 }};
 active=controller;return controller;
}
root.ProLifeCoachGLB={mount,files:FILES};
})(window);
