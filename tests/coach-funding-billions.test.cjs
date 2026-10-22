"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {JSDOM}=require("jsdom");
const creator=fs.readFileSync(path.join(__dirname,"../src/ui/coach-creator.js"),"utf8");

function createThroughUi(funding,clubId="a"){
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,globalThis:null,console};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 let started=null;
 const clubs=()=>[{id:"a",name:"Clube A",leagueId:"serieA",active:true,budget:25000000,structure:80,roster:[]},{id:"b",name:"Clube B",leagueId:"serieA",active:true,budget:40000000,structure:70,roster:[]}];
 const D={create:config=>config.name?{mode:"coach",day:0,clubId:config.clubId||null,clubs:clubs(),coachCareer:{version:1}}:{clubs:clubs()},club:(state,id)=>state.clubs.find(club=>club.id===id)||null};
 sandbox.ProLifeCoachCreator.mount({D,esc:String,toast:message=>{throw Error(message)},busy:(_message,run)=>run(),onStart:state=>{started=state;},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.name.value="Treinador Bilionário";form.elements.city.value="São Paulo";form.elements.clubId.value=clubId;form.elements.funding.value=String(funding);
 form.elements.funding.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 const preview=dom.window.document.querySelector("#coach-finance-preview").textContent;
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 return {dom,form,preview,state:started};
}

test("coach funding stepper advances from R$ 100 million to R$ 10 billion and respects both limits",()=>{
 const {dom,form}=createThroughUi(0);
 const decrease=dom.window.document.querySelector("[data-funding-decrease]");
 const increase=dom.window.document.querySelector("[data-funding-increase]");
 const output=dom.window.document.querySelector("#coach-funding-value");
 assert.equal(form.elements.funding.type,"hidden");
 assert.equal(form.elements.funding.value,"0");assert.equal(output.textContent,"Sem aporte");assert.equal(decrease.disabled,true);
 increase.click();assert.equal(form.elements.funding.value,"100000000");assert.match(output.textContent,/100\.000\.000/);assert.equal(decrease.disabled,false);
 decrease.click();assert.equal(form.elements.funding.value,"0");assert.equal(decrease.disabled,true);
 for(let step=0;step<100;step++)increase.click();
 assert.equal(form.elements.funding.value,"10000000000");assert.match(output.textContent,/10\.000\.000\.000/);assert.equal(increase.disabled,true);
 increase.click();assert.equal(form.elements.funding.value,"10000000000");
 for(let step=0;step<100;step++)decrease.click();
 assert.equal(form.elements.funding.value,"0");assert.equal(decrease.disabled,true);
 decrease.click();assert.equal(form.elements.funding.value,"0");
});

for(const funding of [1000000000,5000000000,10000000000]){
 test(`coach funding ${funding} is applied once only to the selected club`,()=>{
  const {preview,state}=createThroughUi(funding);
  assert.ok(state);assert.equal(state.clubs[0].budget,25000000+funding);assert.equal(state.clubs[1].budget,40000000);
  assert.equal(state.coachCareer.settings.funding,funding);assert.equal(state.coachCareer.settings.fundingApplied,true);
  assert.match(preview,new RegExp(funding.toLocaleString("pt-BR").replaceAll(".","\\.")));
 });
}

test("coach without a club preserves the current no-immediate-funding rule",()=>{
 const {state}=createThroughUi(10000000000,"");
 assert.ok(state);assert.deepEqual(state.clubs.map(club=>club.budget),[25000000,40000000]);
 assert.equal(state.coachCareer.settings.funding,10000000000);assert.equal(state.coachCareer.settings.fundingApplied,false);
});

test("R$ 10 billion survives save, reload, day advance and a real transfer without duplication",()=>{
 const memory=new Map();global.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
 const D=require("../src/domain/engine.js"),A=require("../src/application/game.js");
 global.ProLifeCompactSave=require("../src/infrastructure/compact-save.js");
 delete require.cache[require.resolve("../src/infrastructure/save.js")];
 const S=require("../src/infrastructure/save.js"),state=D.create({mode:"coach",clubId:"c0",catalogVersion:"fc27_v1"},424242),own=D.club(state);
 const base=own.budget;own.budget+=10000000000;
 state.coachCareer||={version:1};state.coachCareer.settings={...(state.coachCareer.settings||{}),funding:10000000000,fundingApplied:true,firstWindow:"on",installments:"off",loans:"off",marketStrictness:"normal"};
 const id=S.saveAsNew(state);assert.ok(id);
 let loaded=S.loadSlot(id);assert.equal(D.club(loaded).budget,base+10000000000);assert.equal(loaded.coachCareer.settings.fundingApplied,true);
 const hybrid=S.parse(S.encodeHybridSave(loaded,{sparseStats:true}));assert.equal(D.club(hybrid).budget,base+10000000000);assert.equal(hybrid.coachCareer.settings.funding,10000000000);
 assert.equal(S.save(loaded),true);loaded=S.loadSlot(id);assert.equal(D.club(loaded).budget,base+10000000000);
 const beforeDay=D.club(loaded).budget;D.advance(loaded,1);assert.equal(D.club(loaded).budget,beforeDay,"advancing must not reapply funding");
 const buyer=D.club(loaded),seller=loaded.clubs.find(club=>club.id!==buyer.id&&club.roster.length>18);
 buyer.structure=100;const player=seller.roster.find(candidate=>candidate.id!=="hero"),fee=A.valuation(player),sellerBefore=seller.budget,buyerBefore=buyer.budget;
 A.execute(loaded,"recruit",{clubId:seller.id,playerId:player.id,dealType:"permanent",paymentPlan:"upfront",sellOn:0});
 assert.equal(buyer.budget,buyerBefore-fee);assert.equal(seller.budget,sellerBefore+fee);
 assert.equal(S.save(loaded),true);const reloaded=S.loadSlot(id);assert.equal(D.club(reloaded).budget,buyerBefore-fee);assert.equal(reloaded.coachCareer.settings.funding,10000000000);
 delete global.localStorage;delete global.ProLifeCompactSave;
});
