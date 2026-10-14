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
 assert.equal(buttons.length,6);
 const panels=[...dom.window.document.querySelectorAll("[data-coach-panel]")];
 assert.equal(panels.length,6);
 assert.equal(panels.filter(p=>!p.hidden).length,1);
 buttons[4].click();
 assert.equal(panels[4].hidden,false);
 assert.equal(panels[0].hidden,true);
 assert.equal(dom.window.document.querySelector("[data-coach-finish]").hidden,true);
 buttons[5].click();
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
 dom.window.document.querySelector('[data-coach-step="5"]').click();
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
 form.elements.skin.value="#884422";form.elements.hair.value="bald";form.elements.beard.value="none";form.elements.outfit.value="tracksuit";
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.equal(config.appearance.skin,"#884422");
 assert.equal(config.appearance.hair,"bald");
 assert.equal(config.appearance.beard,"none");
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
 form.elements.accessory.value="none";form.elements.body.value="normal";
 form.elements.eyeColor.value="#335577";form.elements.beard.value="none";
 form.elements.accessory.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 const preview=dom.window.document.querySelector("#coach-profile-preview");
 assert.equal(preview.querySelector("#coach-glasses").hidden,true);
 assert.equal(preview.querySelector("#coach-eyes").getAttribute("fill"),"#335577");
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.equal(config.appearance.accessory,"none");
 assert.equal(config.appearance.body,"normal");
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
 form.elements.hair.value="bald";form.elements.hair.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 form.elements.skin.value="#884422";form.elements.skin.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(changes.length,3);
 assert.equal(changes.at(-1).appearance.hair,"bald");
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

test("06B controls with missing 3D meshes are visibly disabled",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs:[]})},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 for(const [field,values] of Object.entries({hair:["crew","curly","afro","mullet"],beard:[],accessory:[],body:["strong","slim"]})){
  for(const val of values){const option=form.elements[field].querySelector('option[value="'+val+'"]');assert.ok(option,field+":"+val);assert.equal(option.disabled,true,field+":"+val);}
 }
 assert.equal(form.elements.hair.querySelector('option[value="bald"]').disabled,false);
 assert.equal(form.elements.hair.querySelector('option[value="lowfade"]').disabled,false);
});

test("06B eyewear is selectable after native-space 3D fitting",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 let config=null;
 sandbox.ProLifeCoachCreator.mount({D:{create:c=>c.name?(config=c,{mode:"coach",clubs:[],coachCareer:{}}):{clubs:[]}},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 const option=form.elements.accessory.querySelector('option[value="glasses"]');
 assert.equal(option.disabled,false);
 form.elements.name.value="Treinador";form.elements.city.value="Mogi";
 form.elements.accessory.value="glasses";
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.equal(config.appearance.accessory,"glasses");
});

test("06B facial hair choices are enabled in trainer identity",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs:[]})},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 for(const name of ["none","stubble","short","full","mustache","goatee"]){
  assert.equal(form.elements.beard.querySelector('option[value="'+name+'"]').disabled,false,name);
 }
});

test("27 manager first-club search filters the canonical club catalog",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 const clubs=[{id:"a",name:"Clube Alfa",active:true,leagueId:"A"},{id:"b",name:"Clube Beta",active:true,leagueId:"B"},{id:"c",name:"Outro Alfa",active:true,leagueId:"B"}];
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs})},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.leagueFilter.value="B";
 form.elements.leagueFilter.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.deepEqual([...form.elements.clubId.options].map(o=>o.value),["","b","c"]);
 form.elements.clubSearch.value="Alfa";
 form.elements.clubSearch.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.deepEqual([...form.elements.clubId.options].map(o=>o.value),["","c"]);
 form.elements.leagueFilter.value="";
 form.elements.leagueFilter.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.deepEqual([...form.elements.clubId.options].map(o=>o.value),["","a","c"]);
});

test("08 first club briefing uses canonical ranking roster morale and budget",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 const clubs=[
  {id:"a",name:"Clube Alfa",leagueId:"A",active:true,strength:95,budget:750000,roster:[{morale:80},{morale:60}]},
  {id:"b",name:"Clube Beta",leagueId:"A",active:true,strength:72,budget:230000,roster:[{morale:40}]},
  {id:"c",name:"Clube Gama",leagueId:"A",active:true,strength:60,budget:100000,roster:[]}
 ];
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs})},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.clubId.value="a";form.elements.clubId.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 const text=dom.window.document.querySelector("#coach-club-analysis").textContent;
 assert.match(text,/750.000/);assert.match(text,/Jogadores no elenco: 2/);
 assert.match(text,/Moral média: 70\/100/);assert.match(text,/Título/);
 form.elements.clubId.value="";
 form.elements.clubId.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.match(dom.window.document.querySelector("#coach-club-analysis").textContent,/começa sem clube/);
});

test("27 manager nationality list has broad FC 27 nations and persists chosen nationality",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 let actual=null;
 sandbox.ProLifeCoachCreator.mount({D:{create:cfg=>cfg.name?(actual=cfg,{mode:"coach",clubId:null,clubs:[],coachCareer:{}}):{clubs:[]}},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 assert.ok(form.elements.nationality.options.length>=150);
 assert.equal(form.elements.nationality.value,"Brasil");
 form.elements.name.value="Treinador";
 form.elements.city.value="Mogi";
 form.elements.nationality.value="Japão";
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.equal(actual.nationality,"Japão");
 const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
 assert.match(engine,/mode === "coach" \? \(GlobalFootball\?\.resolveNationality/);
});

test("FC27 coach wizard provides six stages and explicitly disables unsupported routes",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs:[]})},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 assert.equal(dom.window.document.querySelectorAll("[data-coach-panel]").length,6);
 assert.equal(form.elements.careerType.value,"original");
 assert.equal(form.elements.coachType.value,"custom");
 assert.equal(form.elements.careerType.querySelector('[value="live"]').disabled,true);
 assert.equal(form.elements.coachType.querySelector('[value="real"]').disabled,true);
 for(const v of ["tracksuit","polo","classic","suit"])assert.ok(form.elements.outfit.querySelector('[value="'+v+'"]'));
});

test("27 coach picks real international clubs from shared player club browser",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={document:dom.window.document,FormData:dom.window.FormData,console,globalThis:null,
  ProLifeClubBrowser:{collect:()=>[
   {id:"local",name:"Clube Local",leagueId:"serieA",leagueName:"Série A",country:"Brasil",source:"local",players:[]},
   {id:"betis",name:"Real Betis",leagueId:"laliga",leagueName:"La Liga",country:"Espanha",source:"global",players:[]}
  ]}};
 sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs:[{id:"local",name:"Clube Local",active:true}]})},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.countryFilter.value="Espanha";
 form.elements.countryFilter.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.deepEqual([...form.elements.clubId.options].map(o=>o.value),["","betis"]);
 form.elements.clubSearch.value="betis";
 form.elements.clubSearch.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.deepEqual([...form.elements.clubId.options].map(o=>o.value),["","betis"]);
 form.elements.clubId.value="betis";
 form.elements.clubId.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.match(dom.window.document.querySelector("#coach-club-analysis").textContent,/Real Betis/);
 assert.match(dom.window.document.querySelector("#coach-club-analysis").textContent,/Espanha/);
 const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
 assert.match(engine,/mode === "coach" && \(s\.globalFootball\?\.clubs/);
});

test("FC-inspired coach selection uses human league labels and clickable real club cards",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={document:dom.window.document,FormData:dom.window.FormData,console,globalThis:null,
   ProLifeClubBrowser:{collect:()=>[
     {id:"a",name:"Clube Local",country:"Brasil",leagueId:"serieA",leagueName:"Série A",source:"local",players:[]},
     {id:"betis",name:"Real Betis",country:"Espanha",leagueId:"gf_fc27_la_liga",leagueName:"La Liga",source:"global",players:[]}
   ]}};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs:[{id:"a",name:"Clube Local"}]})},esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:()=>{},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 const league=[...form.elements.leagueFilter.options].find(o=>o.value==="gf_fc27_la_liga");
 assert.ok(league);assert.equal(league.textContent,"La Liga");
 form.elements.clubSearch.value="BeTiS";
 form.elements.clubSearch.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(form.elements.countryFilter.value,"");
 const card=dom.window.document.querySelector('[data-club-choice="betis"]');
 assert.ok(card);assert.match(card.textContent,/Real Betis/);assert.match(card.textContent,/Espanha/);
 card.click();
 assert.equal(form.elements.clubId.value,"betis");
 assert.equal(card.getAttribute("aria-pressed"),"true");
});
