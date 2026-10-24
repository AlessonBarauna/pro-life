"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {JSDOM}=require("jsdom");
const root=path.resolve(__dirname,"..");
const A=require("../src/ui/coach-avatar-2d.js");
const creatorSource=fs.readFileSync(path.join(root,"src/ui/coach-creator.js"),"utf8");
const avatarSource=fs.readFileSync(path.join(root,"src/ui/coach-avatar-2d.js"),"utf8");
function mount(dom,extra){
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,Event:dom.window.Event,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(avatarSource,sandbox,{filename:"coach-avatar-2d.js"});
 vm.runInNewContext(creatorSource,sandbox,{filename:"coach-creator.js"});
 const created=[];
 const D={create:(cfg)=>cfg.name?(created.push(cfg),{mode:"coach",clubId:null,clubs:[],person:{appearance:cfg.appearance},coachCareer:{version:1,focus:"equilibrado"}}):{clubs:[]}};
 sandbox.ProLifeCoachCreator.mount(Object.assign({D,esc:String,toast:()=>{},busy:(_m,fn)=>fn(),onStart:s=>{extra&&(extra.saved=s);},onBack:()=>{}},extra?.ctx));
 return {sandbox,created,form:dom.window.document.querySelector("#coach-creation-form")};
}
test("2D avatar is registered offline and the 3D viewer is no longer loaded",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 const files=require("../tools/assets.cjs").files;
 assert.ok(html.indexOf("src/ui/coach-avatar-2d.js")<html.indexOf("src/ui/coach-creator.js"));
 assert.ok(files.includes("src/ui/coach-avatar-2d.js"));
 assert.doesNotMatch(html,/coach-glb\.js|coach-avatar-3d\.js/);
 assert.ok(!files.some(f=>/coach-glb|coach3d|vitruvian/.test(f)));
});
test("every preset and every option renders valid SVG without external requests",()=>{
 for(const preset of A.PRESETS){
  const svg=A.svg(preset.cfg);
  assert.match(svg,/^<svg[\s\S]*<\/svg>$/);
  assert.doesNotMatch(svg,/NaN|undefined|href=|<image/);
 }
 for(const [key,list] of Object.entries(A.CATALOG)){
  for(const [value] of list){
   const svg=A.svg({[key]:value});
   assert.doesNotMatch(svg,/NaN|undefined/,key+":"+value);
  }
 }
 assert.ok(A.PRESETS.length>=8);
});
test("configuration is normalized and accepts old saves",()=>{
 const n=A.normalize({skin:"nope",hair:"qualquer",beard:"full",accessory:"glasses",age:500,grey:-4});
 assert.equal(n.skin,A.DEFAULTS.skin);assert.equal(n.hair,A.DEFAULTS.hair);assert.equal(n.beard,"full");
 assert.equal(n.glasses,"round");assert.equal(n.age,100);assert.equal(n.grey,0);
 assert.deepEqual(A.normalize(A.normalize(n)),n);
 const legacy=A.toAppearance({skin:"#884422",hair:"bald",beard:"none",glasses:"sun",body:"strong"});
 assert.deepEqual(legacy,{skin:"#884422",hairColor:A.DEFAULTS.hairColor,eyeColor:A.DEFAULTS.eyeColor,hair:"bald",beard:"none",body:"strong",accessory:"glasses"});
});
test("randomize is deterministic per seed and produces different looks",()=>{
 assert.deepEqual(A.randomize(7),A.randomize(7));
 const seen=new Set();for(let i=1;i<40;i++)seen.add(JSON.stringify(A.randomize(i)));
 assert.ok(seen.size>30);
});
test("visible options change the picture",()=>{
 const base=A.svg(A.DEFAULTS);
 for(const change of [{hair:"afro"},{beard:"full"},{glasses:"round"},{age:90},{grey:100},{face:"square"},{expression:"grin"},{outfit:"tracksuit"},{skin:"#3d2519"},{eyeColor:"#3f7fb0"},{body:"strong"}])
  assert.notEqual(A.svg(Object.assign({},A.DEFAULTS,change)),base,JSON.stringify(change));
});
test("creator edits the portrait, applies presets and saves the 2D configuration",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const extra={};const {form,created}=mount(dom,extra);
 const doc=dom.window.document;
 assert.equal(doc.querySelectorAll("[data-coach-preset]").length,A.PRESETS.length);
 assert.ok(doc.querySelector("#coach-2d-stage svg"));
 assert.equal(form.elements.age.type,"number","idade do treinador não pode colidir com marcas de idade");
 doc.querySelector('[data-coach-preset="veterano"]').click();
 assert.equal(form.elements.hair.value,"bald");assert.equal(form.elements.beard.value,"full");
 form.elements.glasses.value="square";form.elements.glasses.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.match(doc.querySelector("#coach-2d-stage").dataset.looks,/"glasses":"square"/);
 form.elements.outfit.value="polo";form.elements.outfit.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.equal(form.elements.outfitColor.value,A.OUTFIT_DEFAULT.polo[0]);
 doc.querySelector("[data-coach-random]").click();
 doc.querySelector("[data-coach-reset]").click();
 assert.equal(form.elements.hair.value,A.DEFAULTS.hair);
 doc.querySelector('[data-coach-preset="mentor"]').click();
 form.elements.name.value="Treinador";form.elements.city.value="Mogi";
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 const cfg=created[0];
 assert.equal(cfg.appearance.beard,"short");assert.equal(cfg.appearance.accessory,"glasses");
 assert.equal(extra.saved.coachCareer.presentation.avatar2d.face,"square");
 assert.equal(extra.saved.coachCareer.presentation.avatar2d.grey,80);
});
test("swatches fill the matching color field",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const {form}=mount(dom);
 dom.window.document.querySelector('[data-swatch="skin"][data-value="#5a3826"]').click();
 assert.equal(form.elements.skin.value,"#5a3826");
});
