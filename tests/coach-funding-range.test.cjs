"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {JSDOM}=require("jsdom");
const creator=fs.readFileSync(path.join(__dirname,"../src/ui/coach-creator.js"),"utf8");
const economy=require("../src/domain/club-economy.js");
function mount(){
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,Event:dom.window.Event,globalThis:null,console,ProLifeClubEconomy:economy,setTimeout,clearTimeout,setInterval,clearInterval};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 const mk=()=>[{id:"a",name:"Clube A",leagueId:"serieA",active:true,budget:51000000,structure:80,roster:[]}];
 sandbox.ProLifeCoachCreator.mount({D:{create:()=>({clubs:mk()})},esc:String,toast:()=>{},busy:(_m,run)=>run(),onStart:()=>{},onBack:()=>{}});
 return {dom,form:dom.window.document.querySelector("#coach-creation-form")};
}
test("scenarios are percentages of the club's own budget",()=>{
 const rows=economy.scenarios({id:"x",leagueId:"laliga",structure:70,budget:51000000});
 assert.deepEqual(rows.map(r=>r.proposedTransferBudget),[35700000,51000000,76500000]);
 const noBudget=economy.scenarios({id:"y",leagueId:"laliga",structure:70});
 assert.ok(noBudget[0].proposedTransferBudget<noBudget[1].proposedTransferBudget);
});
test("scenario choice shows the club value and changes the previewed total",()=>{
 const {dom,form}=mount();
 form.elements.clubId.value="a";form.elements.clubId.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 const labels=[...form.elements.financialScenario.options].map(o=>o.textContent);
 assert.match(labels[0],/Original do clube — R\$ 51\.000\.000/);
 assert.match(labels[1],/Conservador \(70%\) — R\$ 35\.700\.000/);
 assert.match(labels[3],/Ambicioso \(150%\) — R\$ 76\.500\.000/);
 const preview=()=>dom.window.document.querySelector("#coach-finance-preview").textContent;
 form.elements.financialScenario.value="ambitious";form.elements.financialScenario.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 assert.match(preview(),/Orçamento base: R\$ 76\.500\.000/);
 assert.match(dom.window.document.querySelector("#coach-club-analysis").textContent,/Orçamento disponível: R\$ 76\.500\.000/);
});
test("range bar sets the funding and follows the buttons",()=>{
 const {dom,form}=mount();
 const range=form.elements.fundingRange;
 range.value="50";range.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(form.elements.funding.value,"5000000000");
 dom.window.document.querySelector("[data-funding-increase]").click();
 assert.equal(range.value,"51");
 range.value="100";range.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(form.elements.funding.value,"10000000000");
 assert.equal(dom.window.document.querySelector("[data-funding-increase]").disabled,true);
});
test("holding the plus button keeps increasing until the limit",async()=>{
 const {dom,form}=mount();
 const plus=dom.window.document.querySelector("[data-funding-increase]");
 plus.dispatchEvent(new dom.window.Event("pointerdown",{bubbles:true}));
 await new Promise(r=>setTimeout(r,1500));
 plus.dispatchEvent(new dom.window.Event("pointerup",{bubbles:true}));
 const held=Number(form.elements.funding.value);
 assert.ok(held>=500000000,"segurar deve subir várias vezes: "+held);
 await new Promise(r=>setTimeout(r,300));
 assert.equal(Number(form.elements.funding.value),held,"soltar para de subir");
});
test("initial finance (scenario + funding) is recorded for the board tab",()=>{
 const dom=new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>",{url:"http://localhost"});
 const sandbox={window:dom.window,document:dom.window.document,FormData:dom.window.FormData,Event:dom.window.Event,globalThis:null,console,ProLifeClubEconomy:economy,setTimeout,clearTimeout,setInterval,clearInterval};sandbox.globalThis=sandbox;
 vm.runInNewContext(creator,sandbox,{filename:"coach-creator.js"});
 let saved=null;
 const mk=()=>[{id:"a",name:"Clube A",leagueId:"serieA",active:true,budget:51000000,structure:80,roster:[]}];
 const D={create:cfg=>{const clubs=mk();if(cfg.name&&cfg.financialScenario==="conservative")clubs[0].budget=35700000;return cfg.name?{mode:"coach",day:0,clubId:cfg.clubId,clubs,coachCareer:{version:1}}:{clubs};},club:(st,id)=>st.clubs.find(c=>c.id===id)};
 sandbox.ProLifeCoachCreator.mount({D,esc:String,toast:m=>{throw Error(m);},busy:(_m,run)=>run(),onStart:s=>{saved=s;},onBack:()=>{}});
 const form=dom.window.document.querySelector("#coach-creation-form");
 form.elements.name.value="T";form.elements.city.value="C";form.elements.clubId.value="a";form.elements.financialScenario.value="conservative";form.elements.funding.value="200000000";
 form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
 assert.deepEqual(JSON.parse(JSON.stringify(saved.coachCareer.settings.initialBudget)),{clubId:"a",scenario:"conservative",base:35700000,funding:200000000,total:235700000});
 assert.equal(saved.clubs[0].budget,235700000);
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(app,/Início da carreira: \$\{money\(ib\.total\)\}/);
});
