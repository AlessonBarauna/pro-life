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

test("Individual negotiation desk opens and closes without changing save state",()=>{
 const srcView=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const root={};root.globalThis=root;vm.runInNewContext(srcView,root);
 const V=root.ProLifeCoachCareerView;
 const state={mode:"coach",clubId:"b",day:1,season:2026,person:{nationality:"Brasil"},clubs:[{id:"a",name:"Origem",roster:[{id:"p",name:"Jogador",pos:"ATA",age:24,overall:76}]},{id:"b",name:"Destino",roster:[]}],coachCareer:{negotiations:[{id:"n",playerId:"p",sellerClubId:"a",buyerClubId:"b",status:"pending",requested:12000,finalFee:16000,expiresDay:8}]}};
 const D={club:(s,id)=>s.clubs.find(c=>c.id===id),CoachCareer:{snapshot:()=>({hasClub:true,club:{name:"Destino"},reputation:50})}};
 const saved=JSON.stringify(state);
 V.setTab("negociacoes");V.setDealTab("propostas");V.openDeal("n");
 let html=V.render(state,D);
 assert.match(html,/Mesa de negociação/);
 assert.match(html,/R\$ 12\.000/);
 assert.match(html,/R\$ 16\.000/);
 assert.match(html,/data-coach-deal-accept="n"/);
 V.closeDeal();html=V.render(state,D);
 assert.doesNotMatch(html,/Mesa de negociação/);
 assert.equal(JSON.stringify(state),saved);
 V.setTab("central");
});

test("Multiround negotiations persist and close after three rounds without spending budget",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const root={};root.globalThis=root;
 root.ProLife={club:(s,id=s.clubId)=>s.clubs.find(c=>c.id===id),overall:p=>p.overall,Career:{windowStatus:()=>({open:true}),transfer:()=>{}}};
 vm.runInNewContext(appSource,root,{filename:"game.js"});
 const p={id:"p",name:"Atleta",age:23,overall:70,pos:"ATA"};
 const source={id:"a",name:"Origem",roster:[p,...Array.from({length:18},(_,i)=>({id:"r"+i}))],budget:100000,structure:90,lineup:["p"]};
 const buyer={id:"b",name:"Destino",roster:[],budget:2000000,structure:90,lineup:[]};
 let state={mode:"coach",clubId:"b",day:1,season:2026,news:[],clubs:[source,buyer],coachCareer:{settings:{marketStrictness:"normal",installments:"on"}}};
 const original=buyer.budget;
 root.ProLifeApp.execute(state,"counterRecruit",{clubId:"a",playerId:"p",offer:20000});
 const id=state.coachCareer.negotiations[0].id;
 state=JSON.parse(JSON.stringify(state));
 root.ProLifeApp.execute(state,"reviseCoachDeal",{id,offer:30000});
 assert.equal(state.coachCareer.negotiations[0].round,2);
 assert.equal(state.coachCareer.negotiations[0].history.length,2);
 state=JSON.parse(JSON.stringify(state));
 root.ProLifeApp.execute(state,"reviseCoachDeal",{id,offer:40000});
 assert.equal(state.coachCareer.negotiations[0].round,3);
 assert.throws(()=>root.ProLifeApp.execute(state,"reviseCoachDeal",{id,offer:50000}),/três rodadas/);
 assert.equal(state.clubs[1].budget,original);
 assert.equal(state.clubs[0].roster.length,19);
 root.ProLifeApp.execute(state,"acceptCoachDeal",{id,paymentPlan:"split"});
 assert.equal(state.coachCareer.negotiations[0].status,"accepted");
 assert.equal(state.coachCareer.transferDebts.length,1);
 assert.equal(state.clubs[1].roster.length,1);
 assert.throws(()=>root.ProLifeApp.execute(state,"acceptCoachDeal",{id}),/indisponível/);
});
test("Negotiation detail exposes editable terms and round history",()=>{
 const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const root={};root.globalThis=root;vm.runInNewContext(source,root);
 const V=root.ProLifeCoachCareerView;
 V.setTab("negociacoes");V.openDeal("n");
 const state={mode:"coach",clubId:"b",day:3,season:2026,person:{nationality:"Brasil"},clubs:[{id:"a",name:"Origem",roster:[{id:"p",name:"Atleta",overall:75}]},{id:"b",name:"Destino",roster:[]}],coachCareer:{settings:{installments:"on"},negotiations:[{id:"n",status:"pending",playerId:"p",sellerClubId:"a",buyerClubId:"b",requested:20000,finalFee:25000,expiresDay:10,round:2,history:[{round:1,day:1,offered:20000,response:25000,accepted:false}]}]}};
 const D={club:(s,id)=>s.clubs.find(c=>c.id===id),CoachCareer:{snapshot:()=>({club:{name:"Destino"},hasClub:true,reputation:60})}};
 const html=V.render(state,D);
 for(const marker of ['rodada 2/3','data-coach-deal-revise="n"','data-coach-deal-plan="n"','Rodadas da negociação','50% agora'])assert.ok(html.includes(marker),marker);
 V.closeDeal();V.setTab("central");
});

test("Incoming club offers transfer a player exactly once, credit budget and persist",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const root={};root.globalThis=root;
 let transfers=0;
 root.ProLife={club:(s,id=s.clubId)=>s.clubs.find(c=>c.id===id),overall:p=>p.overall,Career:{windowStatus:()=>({open:true}),transfer:()=>{transfers++;}}};
 vm.runInNewContext(appSource,root,{filename:"game.js"});
 const roster=Array.from({length:20},(_,i)=>({id:"p"+i,name:"Atleta "+i,age:25,overall:65,pos:"ATA"}));
 let state={mode:"coach",clubId:"a",day:10,season:2026,news:[],clubs:[{id:"a",name:"Meu Clube",budget:500000,roster,lineup:["p0"]},{id:"b",name:"Comprador",budget:2000000,roster:[],lineup:[]}],coachCareer:{settings:{marketStrictness:"normal"},sellOnClauses:[]}};
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 const offer=state.coachCareer.saleOffers[0];
 assert.equal(offer.status,"pending");
 state=JSON.parse(JSON.stringify(state));
 const price=offer.amount,fromBudget=state.clubs[0].budget,toBudget=state.clubs[1].budget;
 root.ProLifeApp.execute(state,"acceptSaleOffer",{id:offer.id});
 assert.equal(state.clubs[0].budget,fromBudget+price);
 assert.equal(state.clubs[1].budget,toBudget-price);
 assert.equal(state.clubs[0].roster.length,19);
 assert.equal(state.clubs[1].roster.length,1);
 assert.equal(transfers,1);
 state=JSON.parse(JSON.stringify(state));
 assert.throws(()=>root.ProLifeApp.execute(state,"acceptSaleOffer",{id:offer.id}),/indisponível/);
 assert.equal(state.clubs[0].roster.length,19);
 assert.equal(transfers,1);
});
test("Incoming offer rejection survives reload, and transfer UI exposes sale actions",()=>{
 const appSource=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const root={};root.globalThis=root;
 root.ProLife={club:(s,id=s.clubId)=>s.clubs.find(c=>c.id===id),overall:p=>p.overall,Career:{windowStatus:()=>({open:true}),transfer:()=>{}}};
 vm.runInNewContext(appSource,root,{filename:"game.js"});
 const state={mode:"coach",clubId:"a",day:5,season:2026,news:[],coachCareer:{saleOffers:[{id:"sale",sellerClubId:"a",buyerClubId:"b",status:"pending",expiresDay:10}]},clubs:[{id:"a",roster:[]},{id:"b",roster:[]}]};
 root.ProLifeApp.execute(state,"rejectSaleOffer",{id:"sale"});
 const saved=JSON.parse(JSON.stringify(state));
 assert.equal(saved.coachCareer.saleOffers[0].status,"rejected");
 assert.throws(()=>root.ProLifeApp.execute(saved,"acceptSaleOffer",{id:"sale"}),/indisponível/);
 const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 for(const control of ["data-coach-sale-generate","data-coach-sale-accept","data-coach-sale-reject","data-coach-sale-counter"])assert.ok(view.includes(control),control);
});


function saleFixture(windowOpen=true){
 const root={};root.globalThis=root;
 root.ProLife={club:(s,id=s.clubId)=>s.clubs.find(c=>c.id===id),overall:p=>p.overall,Career:{windowStatus:()=>({open:windowOpen}),transfer:()=>{}}};
 vm.runInNewContext(fs.readFileSync(pathModuleForSale(),"utf8"),root,{filename:"game.js"});
 const roster=Array.from({length:20},(_,i)=>({id:"p"+i,name:"Atleta "+i,age:25,overall:65,pos:"ATA"}));
 const state={mode:"coach",clubId:"a",day:10,season:2026,news:[],clubs:[
 {id:"a",name:"Vendedor",budget:500000,roster,lineup:["p0"]},
 {id:"b",name:"Comprador",budget:3000000,roster:[],lineup:[]},
 {id:"c",name:"Terceiro",budget:200000,roster:[],lineup:[]}],
 coachCareer:{settings:{marketStrictness:"normal"},sellOnClauses:[]}};
 return {root,state};
}
function pathModuleForSale(){return path.join(__dirname,"../src/application/game.js");}
test("Incoming sales: counters persist, cap at three rounds and do not spend before accepting",()=>{
 const {root,state}=saleFixture();
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 const id=state.coachCareer.saleOffers[0].id, buyerBudget=state.clubs[1].budget;
 root.ProLifeApp.execute(state,"counterSaleOffer",{id,amount:500000});
 const reloaded=JSON.parse(JSON.stringify(state));
 assert.equal(reloaded.coachCareer.saleOffers[0].round,2);
 assert.equal(reloaded.coachCareer.saleOffers[0].history.length,2);
 root.ProLifeApp.execute(reloaded,"counterSaleOffer",{id,amount:510000});
 assert.equal(reloaded.coachCareer.saleOffers[0].round,3);
 assert.throws(()=>root.ProLifeApp.execute(reloaded,"counterSaleOffer",{id,amount:520000}),/limite de rodadas/);
 assert.equal(reloaded.clubs[1].budget,buyerBudget);
});
test("Incoming sales: buyer cannot be underfunded and duplicate offers have distinct IDs",()=>{
 const {root,state}=saleFixture();
 state.clubs[1].budget=1000;state.clubs[2].budget=1000;
 assert.throws(()=>root.ProLifeApp.execute(state,"generateSaleInterest",{}),/orçamento/);
 assert.equal(state.coachCareer.saleOffers,undefined);
 state.clubs[1].budget=3000000;
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 assert.equal(new Set(state.coachCareer.saleOffers.map(o=>o.id)).size,2);
});
test("Incoming sales: resale clauses pay beneficiary once, including after reload",()=>{
 const {root,state}=saleFixture();
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 const offer=state.coachCareer.saleOffers[0];
 state.coachCareer.sellOnClauses=[{playerId:offer.playerId,buyerClubId:"a",sellerClubId:"c",percentage:20,active:true}];
 const before=state.clubs.map(c=>c.budget),fee=offer.amount,share=Math.floor(fee*0.2);
 root.ProLifeApp.execute(state,"acceptSaleOffer",{id:offer.id});
 assert.equal(state.clubs[0].budget,before[0]+fee-share);
 assert.equal(state.clubs[1].budget,before[1]-fee);
 assert.equal(state.clubs[2].budget,before[2]+share);
 assert.equal(state.coachCareer.sellOnClauses[0].active,false);
 const reloaded=JSON.parse(JSON.stringify(state));
 assert.throws(()=>root.ProLifeApp.execute(reloaded,"acceptSaleOffer",{id:offer.id}),/indisponível/);
 assert.equal(reloaded.clubs[2].budget,before[2]+share);
});
test("Incoming sales: closed window and loaned player are blocked without changes",()=>{
 const closed=saleFixture(false);
 assert.throws(()=>closed.root.ProLifeApp.execute(closed.state,"generateSaleInterest",{}),/Janela/);
 const {root,state}=saleFixture();
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 const offer=state.coachCareer.saleOffers[0];
 state.coachCareer.loans=[{playerId:offer.playerId,returned:false}];
 const before=JSON.stringify(state.clubs);
 assert.throws(()=>root.ProLifeApp.execute(state,"acceptSaleOffer",{id:offer.id}),/emprestado/);
 assert.equal(JSON.stringify(state.clubs),before);
});
test("Incoming sales: legacy saves and player career remain isolated",()=>{
 const {root,state}=saleFixture();
 delete state.coachCareer.saleOffers;
 assert.throws(()=>root.ProLifeApp.execute(state,"acceptSaleOffer",{id:"missing"}),/indisponível/);
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 assert.equal(state.coachCareer.saleOffers.length,1);
 state.mode="player";
 assert.throws(()=>root.ProLifeApp.execute(state,"acceptSaleOffer",{id:state.coachCareer.saleOffers[0].id}),/Mercado fechado/);
});

test("Coach profile uses manager-specific panels without player number or attributes",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const coachStart=app.indexOf('if (state.mode === "coach") {\n        // FC27 manager profile:');
 const playerStart=app.indexOf('if (state.mode === "player") {\n        const P = window.ProLifePlayerProfile.init',coachStart);
 assert.ok(coachStart>0&&playerStart>coachStart,"coach profile must be isolated before player profile");
 const coach=app.slice(coachStart,playerStart);
 for(const section of ["coach-prof-resumo","coach-prof-desempenho","coach-prof-trajetoria","coach-prof-conquistas","coach-prof-identidade"]){
   assert.ok(coach.includes(section),section);
 }
 for(const forbidden of ['id="shirt-number"','data-action="number"','Charts.radar','D.Training.groupRatings','Comemoração']){
   assert.equal(coach.includes(forbidden),false,forbidden);
 }
 assert.ok(app.slice(playerStart).includes('id="shirt-number"'),"player number editor is preserved");
 assert.ok(coach.includes('appearanceFields(p.appearance)'),"manager appearance remains editable");
});

test("Coach profile tabs render independently and do not alter player profile",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const start=app.indexOf('// FC27 manager profile:');
 const end=app.indexOf('if (state.mode === "player") {\n        const P = window.ProLifePlayerProfile.init',start);
 assert.ok(start>0&&end>start);
 const coach=app.slice(start,end);
 for(const tab of ["resumo","desempenho","trajetoria","conquistas","identidade"]){
   assert.ok(coach.includes('data-coach-profile-tab="'+tab+'"'));
   assert.ok(coach.includes('coachProfileTab==="'+tab+'"'));
 }
 assert.match(app,/coachProfileTab = next;\s*render\(\);/);
 assert.match(app,/state\?\.mode === "coach" && page === "profile"/);
 assert.match(coach,/coachProfileTab==="identidade"\?section/);
 assert.match(coach,/coachProfileTab==="resumo"\?`<div/);
 assert.ok(app.slice(end).includes('id="shirt-number"'));
});
