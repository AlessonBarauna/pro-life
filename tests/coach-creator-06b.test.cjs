"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {JSDOM}=require("jsdom");
const creator=fs.readFileSync(path.join(__dirname,"../src/ui/coach-creator.js"),"utf8");
test("06B manager has a dedicated creator without player attributes",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};
 sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 let created=null,started=null,alerts=[];
 const D={create:(cfg,seed)=>{if(cfg.name){created={cfg,seed};return {mode:"coach",person:{name:cfg.name},seed};}return {clubs:[{id:"club-a",name:"Clube A",active:true}]};}};
 sandbox.ProLifeCoachCreator.mount({
  D,esc:s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),
  toast:s=>alerts.push(s),busy:(_message,fn)=>fn(),
  onStart:s=>{started=s;return true;},onBack:()=>{}
 });
 const form=dom.window.document.querySelector("#coach-creation-form");
 assert.ok(form);
 for(const key of ["pos","foot","style","celebration","point_pace","archetypeId"])assert.equal(form.querySelector('[name="'+key+'"]'),null);
 form.querySelector('[name="name"]').value="Treinador Exemplo";
 form.querySelector('[name="city"]').value="Mogi das Cruzes";
 form.querySelector('[name="age"]').value="35";
 form.querySelector('[name="clubId"]').value="club-a";
 form.querySelector('[name="seed"]').value="2026";
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.equal(alerts.length,0);
 assert.equal(created.cfg.mode,"coach");
 assert.equal(created.cfg.catalogVersion,"fc27_v1");
 assert.equal(created.cfg.clubId,"club-a");
 assert.equal(created.seed,2026);
 assert.equal(started.mode,"coach");
});
test("06B routes new-coach through manager creator and keeps new-player separate",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(app,/case "new-coach":\s*coachSetup = true;/);
 assert.match(app,/case "new-player":\s*coachSetup = false;/);
 assert.match(app,/if \(coachSetup && window\.ProLifeCoachCreator\)/);
});

test("06B wizard exposes five accessible stages and hides player-only inputs",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};
 sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 const D={create:()=>({clubs:[]})};
 sandbox.ProLifeCoachCreator.mount({D,esc:s=>String(s),toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.name.value="Treinador Teste";
 form.elements.city.value="Mogi das Cruzes";
 const buttons=[...dom.window.document.querySelectorAll("[data-coach-step]")];
 assert.equal(buttons.length,5);
 const panels=[...dom.window.document.querySelectorAll("[data-coach-panel]")];
 assert.equal(panels.length,5);
 assert.equal(panels.filter(p=>!p.hidden).length,1);
 buttons[2].click();
 assert.equal(panels[2].hidden,false);
 assert.equal(panels[0].hidden,true);
 assert.equal(dom.window.document.querySelector("[data-coach-finish]").hidden,true);
 buttons[4].click();
 assert.equal(dom.window.document.querySelector("[data-coach-finish]").hidden,false);
 assert.equal(dom.window.document.querySelector("[data-coach-next]").hidden,true);
});

test("06B manager briefing and review use chosen club and real initial budget",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};
 sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 const D={create:()=>({clubs:[{id:"c1",name:"Clube Real",leagueId:"serieA",budget:750000,active:true}]})};
 sandbox.ProLifeCoachCreator.mount({D,esc:s=>String(s),toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.name.value="Ana Treinadora";
 form.elements.city.value="Mogi das Cruzes";
 form.elements.clubId.value="c1";
 form.elements.clubId.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.match(dom.window.document.querySelector("#coach-club-analysis").textContent,/Clube Real/);
 assert.match(dom.window.document.querySelector("#coach-club-analysis").textContent,/750.000/);
 dom.window.document.querySelector('[data-coach-step="4"]').click();
 assert.match(dom.window.document.querySelector("#coach-confirm-details").textContent,/Ana Treinadora/);
 assert.match(dom.window.document.querySelector("#coach-confirm-details").textContent,/Clube Real/);
});

test("06B coach selections affect training focus and club tactic",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 let saved=null;
 const D={
  create:cfg=>cfg.name?{mode:"coach",person:{name:cfg.name},clubId:"c1",clubs:[{id:"c1",tactic:"balanced"}],coachCareer:{focus:"equilibrado"}}:{clubs:[{id:"c1",name:"Clube Real",active:true}]},
  CoachCareer:{setFocus:(state,focus)=>{state.coachCareer.focus=focus;}}
 };
 sandbox.ProLifeCoachCreator.mount({D,esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:state=>{saved=state;},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.name.value="Treinador Teste";form.elements.city.value="Mogi";
 form.elements.clubId.value="c1";form.elements.focus.value="jovens";form.elements.tactic.value="counter";
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.equal(saved.coachCareer.focus,"jovens");
 assert.equal(saved.clubs[0].tactic,"counter");
});

test("06B coach appearance and outfit are transferred into save state",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 let config=null,saved=null;
 const D={create:(cfg)=>cfg.name?(config=cfg,{mode:"coach",clubId:null,clubs:[],person:{appearance:cfg.appearance},coachCareer:{version:1,focus:"equilibrado"}}):{clubs:[]}};
 sandbox.ProLifeCoachCreator.mount({D,esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:s=>{saved=s;},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.name.value="Treinador";form.elements.city.value="Mogi";
 form.elements.skin.value="#884422";form.elements.hair.value="bald";form.elements.beard.value="goatee";form.elements.outfit.value="tracksuit";
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.equal(config.appearance.skin,"#884422");
 assert.equal(config.appearance.hair,"bald");
 assert.equal(config.appearance.beard,"goatee");
 assert.equal(saved.coachCareer.presentation.outfit,"tracksuit");
});

test("06B identity controls persist eyewear and body shape and update portrait",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 let config;
 const D={create:c=>c.name?(config=c,{mode:"coach",clubId:null,clubs:[],person:{appearance:c.appearance},coachCareer:{version:1}}):{clubs:[]}};
 sandbox.ProLifeCoachCreator.mount({D,esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.name.value="Treinador";form.elements.city.value="Mogi";
 form.elements.accessory.value="glasses";form.elements.body.value="strong";
 form.elements.eyeColor.value="#335577";form.elements.beard.value="full";
 form.elements.accessory.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 const preview=dom.window.document.querySelector("#coach-profile-preview");
 assert.equal(preview.querySelector("#coach-glasses").hidden,false);
 assert.equal(preview.querySelector("#coach-eyes").getAttribute("fill"),"#335577");
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.equal(config.appearance.accessory,"glasses");
 assert.equal(config.appearance.body,"strong");
});

test("06B coach preview uses isolated renderer and updates customization",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const avatarSrc=fs.readFileSync(path.join(__dirname,"../src/ui/coach-avatar-3d.js"),"utf8");
 const changes=[];
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,console,globalThis:null,
  ProLifeCoachGLB:{mount:(node,config)=>{changes.push(config);return {dispose:()=>{}};}}};
 sandbox.globalThis=sandbox;
 vm.runInNewContext(avatarSrc,sandbox,{filename:"coach-avatar-3d.js"});
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs:[]})},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 assert.equal(changes.length,1);
 form.elements.hair.value="curly";form.elements.hair.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 form.elements.skin.value="#884422";form.elements.skin.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(changes.length,3);
 assert.equal(changes.at(-1).appearance.hair,"curly");
 assert.equal(changes.at(-1).appearance.skin,"#884422");
 assert.equal(changes.at(-1).model,"src/assets/coach3d-realistic/vitruvian_body.glb");
});
test("06B coach avatar displays a safe offline placeholder without installed model",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const avatarSrc=fs.readFileSync(path.join(__dirname,"../src/ui/coach-avatar-3d.js"),"utf8");
 const sandbox={document:dom.window.document,console,globalThis:null};sandbox.globalThis=sandbox;
 vm.runInNewContext(avatarSrc,sandbox);
 const host=dom.window.document.createElement("div");
 assert.equal(sandbox.ProLifeCoachAvatar3D.render(host,{appearance:{hair:"bald"}}),false);
 assert.match(host.textContent,/Modelo 3D de alta qualidade ainda não instalado/);
 assert.equal(host.dataset.avatarState,"placeholder");
});
