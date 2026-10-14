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
