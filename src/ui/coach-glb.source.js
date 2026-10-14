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
    let model=null,drag=false,lastX=0,turn=0,failed=false;
    let raf=0,disposed=false;
    function size(){
      const w=Math.max(1,host.clientWidth||370),h=Math.max(1,host.clientHeight||270);
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    }
    function draw(){if(disposed)return;raf=root.requestAnimationFrame(draw);if(model)model.rotation.y=turn;renderer.render(scene,camera);}
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
      scene.add(model);
      // Half body framing focuses on face/torso; user can rotate the entire figure.
      camera.position.set(0,1.38,3.0);
      camera.lookAt(0,1.22,0);
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
        if(model){const tint=new THREE.Color(next.appearance?.skin||"#bc8660");model.traverse(n=>{if(n.isMesh&&n.material?.color)n.material.color.copy(tint);});}
      },
      dispose(){
        if(disposed)return;disposed=true;
        root.cancelAnimationFrame(raf);observer?.disconnect();
        renderer.domElement.removeEventListener("pointerdown",pointerDown);
        renderer.domElement.removeEventListener("pointermove",pointerMove);
        renderer.domElement.removeEventListener("pointerup",pointerUp);
        renderer.domElement.removeEventListener("pointercancel",pointerUp);
        if(model){model.traverse(n=>{if(n.isMesh){n.geometry?.dispose?.();n.material?.dispose?.();}});}
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
