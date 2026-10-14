import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

(function(root){
  "use strict";
  const loader=new GLTFLoader();
  let active=null;
  function mount(host,config){
    if(!host)throw Error("Área 3D não encontrada.");
    if(active)active.dispose();
    const scene=new THREE.Scene();
    scene.background=new THREE.Color("#0c2029");
    const camera=new THREE.PerspectiveCamera(33,1,.05,120);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,1.6));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.25;
    renderer.shadowMap.enabled=false;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight("#d3e5ff","#34515a",2.2));
    const light=new THREE.DirectionalLight("#fff4e5",3);
    light.position.set(2,5,5);scene.add(light);
    const fill=new THREE.DirectionalLight("#81b8d6",2);
    fill.position.set(-3,3,-4);scene.add(fill);
    const stand=new THREE.Mesh(new THREE.CylinderGeometry(.85,.93,.07,48),new THREE.MeshStandardMaterial({color:"#192d35",roughness:.54,metalness:.28}));
    stand.position.y=-.04;scene.add(stand);
    // Visual accessories share a parent with the loaded, normalized humanoid mesh.
    const wardrobe=new THREE.Group();
    const mat=(color,roughness=.82)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
    const parts=[];
    function add(geometry,material,x,y,z,rotation=0){
      const mesh=new THREE.Mesh(geometry,material);
      mesh.position.set(x,y,z);mesh.rotation.z=rotation;wardrobe.add(mesh);parts.push(mesh);return mesh;
    }
    function rebuildWardrobe(){
      for(const item of parts){item.geometry.dispose();item.material.dispose();wardrobe.remove(item);}
      parts.length=0;
      const a=config.appearance||{},body=a.body||"normal",factor=body==="strong"?1.13:body==="slim"?.89:1;
      const color=a.hairColor||"#241e1a",outfit=config.outfit||"suit";
      const jacket=mat(outfit==="suit"?"#1b2530":outfit==="tracksuit"?"#214f43":"#365972");
      const pants=mat(outfit==="suit"?"#1b2530":outfit==="tracksuit"?"#193c39":"#263b4d");
      const trim=mat(outfit==="suit"?"#f0eee8":outfit==="tracksuit"?"#a7cfb5":"#9ebaca");
      const hair=mat(color),eye=mat("#c1d8e3",.45);
      // Coordinates normalized from floor 0 to crown ~1.72. The clothing
      // masks the bare torso and legs; all meshes rotate with the model.
      const torso=add(new THREE.CylinderGeometry(.19*factor,.235*factor,.59,24),jacket,0,1.05,0);
      torso.scale.z=.78;
      add(new THREE.CylinderGeometry(.22*factor,.16*factor,.32,24),pants,0,.66,0).scale.z=.85;
      for(const side of [-1,1]){
        add(new THREE.CylinderGeometry(.103*factor,.085*factor,.59,14),pants,side*.12,.34,0);
        // Relaxed vertical sleeve, not a horizontal pipe across the T-pose.
        add(new THREE.CylinderGeometry(.115*factor,.087*factor,.46,18),mat(outfit==="suit"?"#1b2530":outfit==="tracksuit"?"#214f43":"#365972"),side*.265,1.075,0,-side*.12);
      }
      if(outfit==="suit"){
        add(new THREE.ConeGeometry(.075,.25,3),trim,0,1.27,.177).rotation.z=Math.PI;
        add(new THREE.ConeGeometry(.027,.19,3),mat("#7c9c7a"),0,1.15,.2).rotation.z=Math.PI;
      } else if(outfit==="tracksuit"){
        add(new THREE.BoxGeometry(.022,.34,.016),trim,0,1.15,.185);
      } else {
        add(new THREE.TorusGeometry(.095,.012,6,22),trim,0,1.37,.065).rotation.x=Math.PI/2;
      }
      const style=a.hair||"lowfade";
      if(style!=="bald"){
        const height=style==="afro"?.21:style==="curly"||style==="twists"?.17:style==="mullet"||style==="long"?.13:.08;
        const cap=add(new THREE.SphereGeometry(.115,22,14),hair,0,1.655+height*.4,-.008);
        cap.scale.set(style==="afro"?1.34:1.04,height/.115,1.03);
        if(style==="long"||style==="mullet")add(new THREE.BoxGeometry(.18,.18,.1),mat(color),0,1.51,-.078);
        if(style==="braids"||style==="twists")for(const side of [-1,1])add(new THREE.CylinderGeometry(.018,.026,.17,9),mat(color),side*.09,1.53,-.04);
      }
      const beard=a.beard||"none";
      if(beard!=="none"){
        const beardSize=beard==="full"?.16:beard==="goatee"?.065:beard==="mustache"?.045:.11;
        const b=add(new THREE.SphereGeometry(beardSize,18,12),mat(color),0,beard==="mustache"?1.552:1.508,.095);
        b.scale.set(beard==="mustache"?1.6:1,.45,.62);
      }
      if(a.accessory==="glasses"){
        for(const side of [-1,1]){
          add(new THREE.TorusGeometry(.052,.008,7,22),eye,side*.057,1.573,.115);
          add(new THREE.BoxGeometry(.065,.009,.012),mat("#b4d1dc"),side*.115,1.577,.087);
        }
        add(new THREE.BoxGeometry(.035,.009,.01),mat("#b4d1dc"),0,1.58,.121);
      }
      if(a.eyeColor){
        for(const side of [-1,1])add(new THREE.SphereGeometry(.009,10,8),mat(a.eyeColor,.4),side*.043,1.585,.118);
      }
    }
    let model=null,drag=false,lastX=0,turn=0,failed=false;
    let raf=0,disposed=false;
    function size(){
      const w=Math.max(1,host.clientWidth||370),h=Math.max(1,host.clientHeight||270);
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    }
    function draw(){if(disposed)return;raf=root.requestAnimationFrame(draw);if(model){model.rotation.y=turn;wardrobe.rotation.y=turn;}renderer.render(scene,camera);}
    function pointerDown(e){drag=true;lastX=e.clientX;renderer.domElement.setPointerCapture?.(e.pointerId);}
    function pointerMove(e){if(drag){turn+=(e.clientX-lastX)*.008;lastX=e.clientX;}}
    function pointerUp(){drag=false;}
    renderer.domElement.addEventListener("pointerdown",pointerDown);
    renderer.domElement.addEventListener("pointermove",pointerMove);
    renderer.domElement.addEventListener("pointerup",pointerUp);
    renderer.domElement.addEventListener("pointercancel",pointerUp);
    const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(size):null;
    observer?.observe(host);
    size();draw();
    let onError=config.onError;
    loader.load(config.model,gltf=>{
      if(disposed)return;
      model=gltf.scene;
      const box=new THREE.Box3().setFromObject(model);
      const height=Math.max(.1,box.max.y-box.min.y),scale=1.72/height;
      model.scale.setScalar(scale);
      const scaledBox=new THREE.Box3().setFromObject(model);
      const center=scaledBox.getCenter(new THREE.Vector3());
      model.position.set(-center.x,-scaledBox.min.y,-center.z);
      // The CC0 GLB is a real skinned humanoid, not the previous primitive avatar.
      // Apply the user-selected palette while retaining mesh normals and original topology.
      const tint=new THREE.Color(config.appearance?.skin||"#bc8660");
      model.traverse(node=>{if(node.isMesh){node.material=new THREE.MeshStandardMaterial({color:tint,roughness:.73,metalness:0,side:THREE.DoubleSide});node.frustumCulled=false;}});
      // Character has a true skinned skeleton. Lower the arms from T-pose
      // into a relaxed standing stance before overlaying manager attire.
      model.traverse(node=>{
        if(!node.isBone)return;
        if(node.name==="upperarm_l")node.rotation.z=-1.05;
        if(node.name==="upperarm_r")node.rotation.z=1.05;
        if(node.name==="lowerarm_l")node.rotation.z=-.13;
        if(node.name==="lowerarm_r")node.rotation.z=.13;
      });
      scene.add(model);
      scene.add(wardrobe);rebuildWardrobe();
      // Half body framing focuses on face/torso; user can rotate the entire figure.
      camera.position.set(0,1.42,1.9);
      camera.lookAt(0,1.36,0);
      host.dataset.avatarState="glb";
    },undefined,error=>{
      if(disposed)return;
      failed=true;
      if(typeof onError==="function")onError(error);
    });
    const controller={
      update(next){
        if(disposed)return;
        config=next;
        if(model){const tint=new THREE.Color(next.appearance?.skin||"#bc8660");model.traverse(n=>{if(n.isMesh&&n.material?.color)n.material.color.copy(tint);});rebuildWardrobe();}
      },
      dispose(){
        if(disposed)return;disposed=true;
        root.cancelAnimationFrame(raf);observer?.disconnect();
        renderer.domElement.removeEventListener("pointerdown",pointerDown);
        renderer.domElement.removeEventListener("pointermove",pointerMove);
        renderer.domElement.removeEventListener("pointerup",pointerUp);
        renderer.domElement.removeEventListener("pointercancel",pointerUp);
        if(model){model.traverse(n=>{if(n.isMesh){n.geometry?.dispose?.();n.material?.dispose?.();}});}
        for(const item of parts){item.geometry.dispose();item.material.dispose();}parts.length=0;
        stand.geometry.dispose();stand.material.dispose();
        renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
        if(active===controller)active=null;
      }
    };
    active=controller;
    return controller;
  }
  root.ProLifeCoachGLB={mount};
})(window);
