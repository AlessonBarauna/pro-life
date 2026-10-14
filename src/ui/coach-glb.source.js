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
 function attach(gltf,index){
   if(disposed)return;
   const obj=gltf.scene;assembled.add(obj);
   if(index===0){
     body=obj;
     if(gltf.animations.length){
       mixer=new THREE.AnimationMixer(obj);
       const idle=gltf.animations.find(a=>/idle/i.test(a.name))||gltf.animations[0];
       if(idle)mixer.clipAction(idle).play();
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
       if(/skin|dermis|vitbody/i.test(name))skinMaterials.push(m);
       if(/vitshirt/i.test(name))shirtMaterials.push(m);
       if(/vitpants/i.test(name))pantsMaterials.push(m);
       if(/vithairmat/i.test(name))hairMaterials.push(m);
       if(/vitbrowcards/i.test(name))browMaterials.push(m);
       if(/iris/i.test(name))irisMaterials.push(m);
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
   // Preserve the source PBR materials; tint only their existing colors.
   const tint=new THREE.Color(appearance.skin||"#bc8660");
   for(const m of skinMaterials)if(m.color)m.color.copy(tint);
   const iris=new THREE.Color(appearance.eyeColor||"#694829");
   for(const m of irisMaterials)if(m.color)m.color.copy(iris);
   const color=new THREE.Color(appearance.hairColor||"#241e1a");
   for(const m of hairMaterials)if(m.color)m.color.copy(color);
   for(const m of browMaterials)if(m.color)m.color.copy(color);
   const outfits={suit:{shirt:"#253341",pants:"#182631"},tracksuit:{shirt:"#206052",pants:"#203b38"},polo:{shirt:"#e5e9e8",pants:"#2c394b"}};
   const chosen=outfits[next.outfit]||outfits.polo;
   for(const m of shirtMaterials)if(m.color)m.color.set(chosen.shirt);
   for(const m of pantsMaterials)if(m.color)m.color.set(chosen.pants);
   if(hair){
     const style=appearance.hair||"lowfade";
     hair.visible=style!=="bald";
     // One licensed hair mesh. These are honest silhouette variations,
     // not invented meshes for different hairstyles.
     const transforms={
       lowfade:[1,.93,1],crew:[.97,.85,.96],highfade:[.96,.89,.95],
       buzz:[.95,.78,.95],curly:[1.08,1.08,1.1],afro:[1.15,1.2,1.15],
       twists:[1.05,1.04,1.04],braids:[1,1.05,1.02],
       mullet:[1,1.08,1.12],long:[1,1.14,1.12],bald:[1,1,1]
     };
     const v=transforms[style]||transforms.lowfade;
     hair.scale.set(v[0],v[1],v[2]);
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
 function frame(){if(disposed)return;raf=root.requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);mixer?.update(dt);assembled.rotation.y=turn;renderer.render(scene,camera);}frame();
 const controller={update:apply,dispose(){
   if(disposed)return;disposed=true;root.cancelAnimationFrame(raf);observer?.disconnect();
   renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointermove",move);
   renderer.domElement.removeEventListener("pointerup",up);renderer.domElement.removeEventListener("pointercancel",up);
   mixer?.stopAllAction();
   const seen=new Set();
   assembled.traverse(n=>{if(!n.isMesh)return;n.geometry?.dispose();const mats=Array.isArray(n.material)?n.material:[n.material];for(const m of mats){if(m&&!seen.has(m)){seen.add(m);m.dispose();}}});
   renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();if(active===controller)active=null;
 }};
 active=controller;return controller;
}
root.ProLifeCoachGLB={mount,files:FILES};
})(window);
