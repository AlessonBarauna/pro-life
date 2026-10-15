"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/domain/career.js"),"utf8");
test("Deferred transfer debts are paid only once when day advances",()=>{
 const root={};root.globalThis=root;
 vm.runInNewContext(src,root,{filename:"career.js"});
 const C=root.ProLifeCareer;
 const s={mode:"coach",day:179,season:2026,person:{name:"Treinador",condition:100},clubs:[{id:"a",budget:1000000},{id:"b",budget:1000000}],news:[],
  coachCareer:{transferDebts:[{id:"d1",buyerClubId:"a",sourceClubId:"b",amount:100000,dueDay:180,paid:false}]}};
 C.daily(s);
 assert.equal(s.clubs[0].budget,1000000);
 s.day=180;C.daily(s);
 assert.equal(s.clubs[0].budget,900000);
 assert.equal(s.clubs[1].budget,1100000);
 assert.equal(s.coachCareer.transferDebts[0].paid,true);
 C.daily(s);
 assert.equal(s.clubs[0].budget,900000);
 assert.equal(s.clubs[1].budget,1100000);
});
test("Transfer installment option is isolated to coach rules",()=>{
 const actions=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(actions,/rules\?\.installments==="on"/);
 assert.match(actions,/if\(due\)/);
 assert.match(ui,/data-recruit-plan/);
});

test("Coach loan matures, returns the same player, and never duplicates him",()=>{
 const root={};root.globalThis=root;vm.runInNewContext(src,root,{filename:"career.js"});
 const C=root.ProLifeCareer,player={id:"p1",name:"Jogador X",pos:"ATA"};
 const s={mode:"coach",day:179,season:2026,person:{name:"Treinador",condition:100},news:[],
  clubs:[{id:"a",name:"Origem",roster:[],lineup:[]},{id:"b",name:"Destino",roster:[player],lineup:["p1"]}],
  coachCareer:{loans:[{id:"l1",fromClubId:"a",toClubId:"b",playerId:"p1",dueDay:180,returned:false}]}};
 C.daily(s);assert.equal(s.clubs[1].roster.length,1);
 s.day=180;C.daily(s);C.daily(s);
 assert.equal(s.clubs[0].roster.filter(x=>x.id==="p1").length,1);
 assert.equal(s.clubs[1].roster.length,0);
 assert.equal(s.coachCareer.loans[0].returned,true);
});
test("Manager recruitment includes loan and sell-on terms",()=>{
 const actions=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(actions,/sellOnClauses/);
 assert.match(actions,/data\.dealType==="loan"/);
 assert.match(ui,/data-loan-days/);
 assert.match(ui,/data-sell-on/);
});

test("Reloaded loan salary shares settle once and keep the purchase option",()=>{
 const root={};root.globalThis=root;vm.runInNewContext(src,root,{filename:"career.js"});
 const C=root.ProLifeCareer;
 const initial={mode:"coach",day:29,season:2026,person:{name:"Treinador",condition:100},news:[],
 clubs:[{id:"a",name:"Origem",budget:100000,roster:[],lineup:[]},{id:"b",name:"Destino",budget:100000,roster:[{id:"p1",name:"Atleta",salary:20000}],lineup:["p1"]}],
 coachCareer:{loans:[{id:"l1",playerId:"p1",fromClubId:"a",toClubId:"b",dueDay:180,nextSalaryDay:30,salaryShare:50,buyOption:300000,returned:false}]}};
 let s=JSON.parse(JSON.stringify(initial));s.day=30;C.daily(s);
 assert.equal(s.clubs[0].budget,110000);assert.equal(s.clubs[1].budget,90000);
 s=JSON.parse(JSON.stringify(s));C.daily(s);
 assert.equal(s.clubs[0].budget,110000);assert.equal(s.clubs[1].budget,90000);
 assert.equal(s.coachCareer.loans[0].buyOption,300000);
 s.day=60;C.daily(s);assert.equal(s.clubs[0].budget,120000);
 C.daily(s);assert.equal(s.clubs[0].budget,120000);
});
test("Coach market offers loan buy-out and counterproposal commands",()=>{
 const actions=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 for(const action of ['case "buyLoan"','case "counterRecruit"'])assert.ok(actions.includes(action));
 for(const control of ["data-loan-buy","data-counter-recruit","data-salary-share","data-buy-option"])assert.ok(ui.includes(control));
});

test("Manager negotiations survive JSON reload and failed purchases do not consume offers",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const root={};root.globalThis=root;
 root.ProLife={club:(s,id=s.clubId)=>s.clubs.find(c=>c.id===id),overall:p=>p.overall,
  Career:{windowStatus:()=>({open:true}),transfer:()=>{}}};
 vm.runInNewContext(appSource,root,{filename:"game.js"});
 const p={id:"p1",name:"Atleta",age:25,overall:75,pos:"ATA"};
 const others=Array.from({length:18},(_,i)=>({id:"s"+i,name:"Reserva"}));
 let state={mode:"coach",clubId:"b",day:0,season:2026,news:[],
  coachCareer:{settings:{marketStrictness:"normal",firstWindow:"on",loans:"on",installments:"off"}},
  clubs:[{id:"a",name:"Origem",budget:100000,structure:90,roster:[p,...others],lineup:["p1"]},
   {id:"b",name:"Destino",budget:0,structure:90,roster:[],lineup:[]}]};
 const base=root.ProLifeApp.valuation(p);
 root.ProLifeApp.execute(state,"counterRecruit",{clubId:"a",playerId:"p1",offer:base/2});
 state=JSON.parse(JSON.stringify(state));
 assert.equal(state.coachCareer.negotiations.length,1);
 assert.throws(()=>root.ProLifeApp.execute(state,"recruit",{clubId:"a",playerId:"p1"}),/Orçamento insuficiente/);
 assert.equal(state.coachCareer.negotiations[0].status,"pending");
 state.clubs[1].budget=base*3;
 root.ProLifeApp.execute(state,"recruit",{clubId:"a",playerId:"p1"});
 assert.equal(state.coachCareer.negotiations[0].status,"accepted");
 assert.equal(state.clubs[1].roster.length,1);
 assert.equal(state.clubs[0].roster.length,18);
});

test("Loan purchase persists after reload, charges once, and prevents automatic return",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const root={};root.globalThis=root;
 root.ProLife={club:(s,id=s.clubId)=>s.clubs.find(c=>c.id===id),Career:{transfer:()=>{},windowStatus:()=>({open:true})},overall:p=>p.overall};
 vm.runInNewContext(appSource,root,{filename:"game.js"});
 vm.runInNewContext(src,root,{filename:"career.js"});
 const C=root.ProLifeCareer,p={id:"p",name:"Jogador",salary:20000};
 let state={mode:"coach",day:30,season:2026,clubId:"b",person:{name:"Treinador",condition:100},news:[],
 clubs:[{id:"a",name:"Origem",budget:0,roster:[],lineup:[]},{id:"b",name:"Destino",budget:500000,roster:[p],lineup:["p"]}],
 coachCareer:{loans:[{id:"l",fromClubId:"a",toClubId:"b",playerId:"p",dueDay:180,returned:false,purchased:false,buyOption:250000,nextSalaryDay:60,salaryShare:50}]}};
 root.ProLifeApp.execute(state,"buyLoan",{loanId:"l"});
 assert.equal(state.clubs[1].budget,250000);
 assert.equal(state.clubs[0].budget,250000);
 assert.throws(()=>root.ProLifeApp.execute(state,"buyLoan",{loanId:"l"}),/indisponível/);
 state=JSON.parse(JSON.stringify(state));state.day=180;C.daily(state);C.daily(state);
 assert.equal(state.clubs[1].roster.length,1);
 assert.equal(state.clubs[0].roster.length,0);
 assert.equal(state.clubs[1].budget,250000);
});

test("Coach negotiation centre renders five real finance sections from persisted save",()=>{
 const viewSource=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const root={};root.globalThis=root;
 vm.runInNewContext(viewSource,root,{filename:"coach-career-view.js"});
 const V=root.ProLifeCoachCareerView;
 V.setTab("negociacoes");
 const state={mode:"coach",clubId:"b",season:2026,day:6,person:{nationality:"Brasil"},clubs:[{id:"a",name:"Origem",roster:[]},{id:"b",name:"Destino",roster:[]}],
 coachCareer:{negotiations:[{id:"n1",playerId:"p1",sellerClubId:"a",buyerClubId:"b",status:"pending",expiresDay:10,finalFee:10000}],loans:[{id:"l1",playerId:"p2",fromClubId:"a",toClubId:"b",returned:false,dueDay:180,buyOption:50000,salaryShare:50}],transferDebts:[{id:"d1",buyerClubId:"b",sourceClubId:"a",amount:4000,dueDay:180,paid:false}],sellOnClauses:[{playerId:"p3",sellerClubId:"a",percentage:20,active:true}]}};
 const D={club:(s,id)=>s.clubs.find(x=>x.id===id),CoachCareer:{snapshot:()=>({club:{name:"Destino"},reputation:50,hasClub:true})}};
 const expected=[
  ["propostas","Propostas e contrapropostas","data-coach-deal-accept","data-coach-deal-reject"],
  ["emprestimos","Empréstimos ativos","data-coach-deal-buy"],
  ["financeiro","Obrigações financeiras","R$ 4.000"],
  ["clausulas","Cláusulas de revenda","20%"],
  ["historico","Histórico financeiro e de transferências"]
 ];
 for(const [tab,...markers] of expected){
   V.setDealTab(tab);
   const html=V.render(state,D);
   assert.ok(html.includes('data-coach-deal-tab="'+tab+'"'),tab);
   assert.ok(html.includes('aria-label="Categorias de negociações"'));
   for(const marker of markers)assert.ok(html.includes(marker),tab+" / "+marker);
 }
 V.setTab("central");
});
test("Coach central rejection is persistent and prevents accepting closed offer",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const root={};root.globalThis=root;
 root.ProLife={club:(s,id=s.clubId)=>s.clubs.find(c=>c.id===id),overall:p=>p.overall,Career:{windowStatus:()=>({open:true}),transfer:()=>{}}};
 vm.runInNewContext(appSource,root,{filename:"game.js"});
 const state={mode:"coach",clubId:"b",day:1,season:2026,news:[],clubs:[{id:"a",name:"Origem",roster:[]},{id:"b",name:"Destino",roster:[]}],coachCareer:{negotiations:[{id:"n",status:"pending",expiresDay:7,playerId:"p",sellerClubId:"a",buyerClubId:"b"}]}};
 root.ProLifeApp.execute(state,"rejectCoachDeal",{id:"n"});
 assert.equal(state.coachCareer.negotiations[0].status,"rejected");
 const reloaded=JSON.parse(JSON.stringify(state));
 assert.throws(()=>root.ProLifeApp.execute(reloaded,"acceptCoachDeal",{id:"n"}),/indisponível/);
});
