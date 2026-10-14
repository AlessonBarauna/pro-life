(function(root){
"use strict";
// Coach-only renderer controller. A real licensed GLB replaces the legacy figure.
// Never fetch remote assets; keep browser/offline saves working.
const MODEL="src/assets/coach3d/coach-base.glb";
let renderer=null,lastConfig=null,version=0;
function configFromForm(form){
 const a={};
 for(const key of ["skin","hairColor","eyeColor","hair","beard","body","accessory"])a[key]=form.elements[key]?.value||"";
 return {appearance:a,outfit:form.elements.outfit?.value||"suit",name:form.elements.name?.value||""};
}
function render(host,configuration){
 if(!host)return false;
 lastConfig=configuration;
 const id=++version;
 if(renderer?.dispose)renderer.dispose();renderer=null;
 host.textContent="";
 // The heavy GLB viewer is an optional offline module. Never show the old geometric character.
 if(root.ProLifeCoachGLB?.mount){
  try{
   renderer=root.ProLifeCoachGLB.mount(host,{model:MODEL,...configuration,
    onError:()=>{if(id===version)fallback(host,configuration);}});
   return true;
  }catch(err){console.warn("GLB do treinador indisponível",err);}
 }
 fallback(host,configuration);
 return false;
}
function fallback(host,configuration){
 if(!host)return;
 host.innerHTML='<div class="coach-avatar-placeholder" role="status"><div class="coach-avatar-silhouette" aria-hidden="true"></div><strong>Prévia do treinador</strong><small>Modelo 3D de alta qualidade ainda não instalado. As personalizações serão preservadas na carreira.</small></div>';
 host.dataset.avatarState="placeholder";
 host.dataset.appearance=JSON.stringify(configuration?.appearance||{});
}
function dispose(){version++;if(renderer?.dispose)renderer.dispose();renderer=null;lastConfig=null;}
root.ProLifeCoachAvatar3D={render,dispose,configFromForm,model:MODEL,version:1};
})(typeof globalThis!=="undefined"?globalThis:this);
