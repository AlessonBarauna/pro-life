"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {JSDOM}=require("jsdom");
require(path.join(__dirname,"../src/ui/club-crests-data.js"));
const C=require(path.join(__dirname,"../src/ui/club-crests.js"));
test("04E4: registry of 750 unique club ids",()=>{assert.equal(C.stats().total,750);assert.equal(new Set(global.ProLifeCrestData.map(x=>x.id)).size,750);});
test("04E4: verified assets only, offline fallback",()=>{const stats=C.stats();assert.equal(stats.verified+stats.pending,750);assert.ok(stats.verified>=0&&stats.verified<=750);assert.match(C.render("gf_fc27_131682"),/pl-club-crest--fallback/);assert.doesNotMatch(C.render("gf_fc27_131682"),/<img/);});
test("04E4: safely escapes labels and unknown clubs",()=>{assert.match(C.render("not-real"),/Escudo gen/);assert.equal(C.metadata("../hack"),null);assert.doesNotMatch(C.render("../hack"),/<img/);});
test("04E4: every verified crest exists and is included in the published asset manifest",()=>{
 const root=path.join(__dirname,"..");const files=new Set(require(path.join(root,"tools/assets.cjs")).files);
 for(const item of global.ProLifeCrestData.filter(item=>item.verified)){
  assert.ok(fs.existsSync(path.join(root,item.asset)),item.id+" missing file");
  assert.ok(files.has(item.asset),item.id+" missing from assets.cjs");
 }
});
test("04E4: a real image load failure is replaced with the initials fallback",()=>{
 const dom=new JSDOM("<!doctype html><div id='host'></div>");
 const sandbox={document:dom.window.document,globalThis:null,ProLifeCrestData:[{id:"broken",name:"Clube Ausente",color:"#123456",asset:"src/assets/club-crests/broken.png",verified:true}]};sandbox.globalThis=sandbox;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../src/ui/club-crests.js"),"utf8"),sandbox);
 const host=dom.window.document.querySelector("#host");host.innerHTML=sandbox.ProLifeClubCrests.render("broken",{size:"sm"});
 host.querySelector("img").dispatchEvent(new dom.window.Event("error"));
 const fallback=host.querySelector(".pl-club-crest--fallback");assert.ok(fallback);assert.equal(fallback.textContent,"CA");assert.equal(host.querySelector("img"),null);
 assert.match(sandbox.ProLifeClubCrests.inline("unknown"),/pl-club-crest--fallback/);
});
test("04E4: an existing crest renders as an image and a successful load keeps it (no fallback)",()=>{
 const root=path.join(__dirname,"..");const real=global.ProLifeCrestData.find(item=>item.verified&&fs.existsSync(path.join(root,item.asset)));assert.ok(real,"at least one installed crest");
 const dom=new JSDOM("<!doctype html><div id='host'></div>");
 const sandbox={document:dom.window.document,globalThis:null,ProLifeCrestData:[real]};sandbox.globalThis=sandbox;
 vm.runInNewContext(fs.readFileSync(path.join(root,"src/ui/club-crests.js"),"utf8"),sandbox);
 const host=dom.window.document.querySelector("#host");host.innerHTML=sandbox.ProLifeClubCrests.render(real.id,{size:"md"});
 const img=host.querySelector("img.pl-club-crest");assert.ok(img);assert.equal(img.getAttribute("src"),real.asset);assert.equal(img.dataset.clubCrestId,real.id);
 img.dispatchEvent(new dom.window.Event("load"));
 assert.ok(host.querySelector("img.pl-club-crest"),"load must not trigger the fallback");assert.equal(host.querySelector(".pl-club-crest--fallback"),null);
 // erro de outro elemento (nao-escudo) e ignorado
 host.insertAdjacentHTML("beforeend","<img id='other' src='x.png'>");host.querySelector("#other").dispatchEvent(new dom.window.Event("error"));assert.ok(host.querySelector("#other"));
});
