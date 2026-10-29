"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/domain/career.js"),"utf8");
const CoachCareer=require("../src/domain/coach-career.js");
function settleTransferReply(state){
 const pending=state.coachCareer?.negotiations?.find(n=>n.status==="pending"&&n.response==="awaiting_reply");
 assert.ok(pending,"resposta pendente esperada");
 state.day=pending.replyDay;
 assert.equal(CoachCareer.settleTransferReplies(state),1);
 return pending;
}
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
 root.ProLifeApp.execute(state,"counterRecruit",{clubId:"a",playerId:"p1",offer:base});
 state=JSON.parse(JSON.stringify(state));
 assert.equal(state.coachCareer.negotiations.length,1);
 const beforeReply=JSON.stringify(state.clubs);
 assert.throws(()=>root.ProLifeApp.execute(state,"recruit",{clubId:"a",playerId:"p1"}),/Aguarde a resposta/);
 assert.equal(JSON.stringify(state.clubs),beforeReply,"proposta pendente não altera orçamento ou elenco");
 settleTransferReply(state);
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
   assert.ok(html.includes('aria-label="Telas independentes de transferências"'));
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
 const buyer={id:"b",name:"Destino",roster:[],budget:20000000,structure:90,lineup:[]};
 let state={mode:"coach",clubId:"b",day:1,season:2026,news:[],clubs:[source,buyer],coachCareer:{settings:{marketStrictness:"normal",installments:"on"}}};
 const original=buyer.budget;
 root.ProLifeApp.execute(state,"counterRecruit",{clubId:"a",playerId:"p",offer:20000});
 const id=state.coachCareer.negotiations[0].id;
 state=JSON.parse(JSON.stringify(state));
 settleTransferReply(state);
 root.ProLifeApp.execute(state,"reviseCoachDeal",{id,offer:30000});
 assert.equal(state.coachCareer.negotiations[0].round,2);
 assert.equal(state.coachCareer.negotiations[0].history.length,2);
 state=JSON.parse(JSON.stringify(state));
 settleTransferReply(state);
 root.ProLifeApp.execute(state,"reviseCoachDeal",{id,offer:10000000});
 assert.equal(state.coachCareer.negotiations[0].round,3);
 settleTransferReply(state);
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
 let state={mode:"coach",clubId:"a",day:10,season:2026,news:[],clubs:[{id:"a",name:"Meu Clube",budget:500000,roster,lineup:["p0"]},{id:"b",name:"Comprador",budget:20000000,roster:[],lineup:[]}],coachCareer:{settings:{marketStrictness:"normal"},sellOnClauses:[]}};
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
 {id:"b",name:"Comprador",budget:20000000,roster:[],lineup:[]},
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
 state.clubs[1].budget=20000000;
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
 closed.root.ProLifeApp.execute(closed.state,"generateSaleInterest",{});
 assert.equal(closed.state.coachCareer.saleOffers.length,1);
 const future=closed.state.coachCareer.saleOffers[0];
 const unchanged=JSON.stringify(closed.state.clubs);
 closed.root.ProLifeApp.execute(closed.state,"acceptSaleOffer",{id:future.id});
 assert.equal(future.status,"awaiting_window");
 assert.equal(JSON.stringify(closed.state.clubs),unchanged);
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
 assert.throws(()=>root.ProLifeApp.execute(state,"acceptSaleOffer",{id:state.coachCareer.saleOffers[0].id}),/apenas ao treinador/);
});

test("Coach profile uses manager-specific panels without player number or attributes",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const coachStart=app.indexOf('if (state.mode === "coach") {\n        // FC27 manager profile:');
 const playerStart=app.indexOf('if (state.mode === "player") {\n        const P = window.ProLifePlayerProfile.init',coachStart);
 assert.ok(coachStart>0&&playerStart>coachStart,"coach profile must be isolated before player profile");
 const coach=app.slice(coachStart,playerStart);
 for(const section of ["resumo","desempenho","trajetoria","conquistas","identidade"]){
   assert.ok(coach.includes('data-coach-profile-tab="'+section+'"'),section+" navigation");
   assert.ok(coach.includes('coachProfileTab==="'+section+'"'),section+" screen");
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

test("Coach scouting shortlist persists and does not modify player career",()=>{
 const {root,state}=saleFixture();
 const original=JSON.stringify(state.clubs);
 assert.throws(()=>root.ProLifeApp.execute(state,"toggleCoachShortlist",{clubId:"b",playerId:"none"}),/indisponível/);
 state.clubs[1].roster.push({id:"target",name:"Alvo",overall:70,pos:"ATA"});
 root.ProLifeApp.execute(state,"toggleCoachShortlist",{clubId:"b",playerId:"target"});
 let saved=JSON.parse(JSON.stringify(state));
 assert.equal(saved.coachCareer.shortlist.length,1);
 assert.equal(JSON.stringify(saved.clubs),JSON.stringify(state.clubs));
 root.ProLifeApp.execute(saved,"toggleCoachShortlist",{clubId:"b",playerId:"target"});
 assert.equal(saved.coachCareer.shortlist.length,0);
 saved.mode="player";
 assert.throws(()=>root.ProLifeApp.execute(saved,"toggleCoachShortlist",{clubId:"b",playerId:"target"}),/treinador/);
});

test("Scouting screens and actions are wired only in coach mode",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 for(const key of ["data-coach-market-area","data-coach-scout-apply","data-coach-shortlist","data-coach-scout-offer"]){
   assert.ok(app.includes(key),key+" handler");
   assert.ok(view.includes(key),key+" view");
 }
 assert.ok(app.includes('state.mode !== "coach"'));
 assert.ok(view.includes("setMarketArea"));
 assert.ok(view.includes("setScoutFilters"));
});

test("Main Transfers Market page routes coach to new scouting centre",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const start=app.indexOf("    market() {");
 const end=app.indexOf("    sponsorships() {",start);
 assert.ok(start>0&&end>start,"market view exists");
 const market=app.slice(start,end);
 assert.match(market,/state\?\.mode === "coach"/);
 assert.match(market,/ProLifeCoachCareerView\?\.renderMarket/);
 assert.match(market,/return window\.ProLifeCoachCareerView\.renderMarket\(state, D\)/);
 assert.match(market,/ProLifeWorldLiveMarketView/,"legacy world market fallback remains for player");
});

test("Global scouting supports international catalog and moves player exactly once",()=>{
 const srcApp=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const root={};root.globalThis=root;
 root.ProLife={club:(s,id=s.clubId)=>s.clubs.find(c=>c.id===id)||s.globalFootball?.clubs.find(c=>c.id===id),
 overall:p=>p.overall,
 GlobalFootball:{playersByClub:(s,id)=>s.internationalPlayers.filter(p=>p.clubId===id)},
 Career:{windowStatus:()=>({open:true}),transfer:()=>{}}};
 vm.runInNewContext(srcApp,root,{filename:"game.js"});
 const overseas=Array.from({length:22},(_,i)=>({id:"intl"+i,name:"International "+i,clubId:"intlclub",age:24,overall:66,pos:"ATA"}));
 let state={mode:"coach",day:4,season:2026,clubId:"local",news:[],
 clubs:[{id:"local",name:"Home",roster:[],lineup:[],budget:50000000,structure:90}],
 internationalPlayers:overseas,
 globalFootball:{clubs:[{id:"intlclub",name:"Abroad",budget:30000000,structure:70}]},
 coachCareer:{settings:{marketStrictness:"normal",installments:"off"}}};
 root.ProLifeApp.execute(state,"toggleCoachShortlist",{clubId:"intlclub",playerId:"intl0"});
 assert.equal(state.coachCareer.shortlist.length,1);
 root.ProLifeApp.execute(state,"counterRecruit",{clubId:"intlclub",playerId:"intl0",offer:5000000});
 assert.equal(state.coachCareer.negotiations.length,1);
 settleTransferReply(state);
 root.ProLifeApp.execute(state,"recruit",{clubId:"intlclub",playerId:"intl0"});
 const restored=JSON.parse(JSON.stringify(state));
 assert.equal(restored.clubs[0].roster.filter(p=>p.id==="intl0").length,1);
 assert.equal(restored.internationalPlayers.filter(p=>p.id==="intl0").length,0);
 assert.equal(restored.globalFootball.clubs[0].roster.filter(p=>p.id==="intl0").length,0);
 assert.equal(restored.clubs[0].roster[0].clubId,"local");
 assert.throws(()=>root.ProLifeApp.execute(restored,"recruit",{clubId:"intlclub",playerId:"intl0"}),/indisponível/i);
});
test("Global observation pulls activePlayers rather than only local rosters",()=>{
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(ui,/gf\?\.activePlayers\?\.\(s\)/);
 assert.match(ui,/gf\?\.clubById\?\.\(s,p\.clubId\)/);
 assert.match(app,/GlobalFootball\?\.playerById\?\.\(state,playerId\)/);
});

test("Dedicated coach market hides career navigation and preserves full career view",()=>{
 const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const root={};root.globalThis=root;
 vm.runInNewContext(source,root,{filename:"coach-career-view.js"});
 const V=root.ProLifeCoachCareerView;
 const state={mode:"coach",clubId:"a",season:2026,day:10,person:{nationality:"Brasil"},clubs:[{id:"a",name:"Clube",budget:200000,roster:[],lineup:[]}],coachCareer:{settings:{}}};
 const D={club:(s,id)=>s.clubs.find(c=>c.id===id),CoachCareer:{snapshot:()=>({club:{name:"Clube"},hasClub:true,reputation:50})}};
 V.setMarketArea("transferencias");
 const market=V.renderMarket(state,D);
 assert.match(market,/CENTRAL DE TRANSFERÊNCIAS/);
 assert.match(market,/Áreas do mercado/);
 assert.doesNotMatch(market,/aria-label="Seções da carreira"/);
 assert.doesNotMatch(market,/<h2>Carreira do Treinador<\/h2>/);
 V.setTab("negociacoes");
 assert.match(V.render(state,D),/aria-label="Seções da carreira"/);
});

test("Coach signing reveal is queued once, survives reload, and never pays twice",()=>{
 const {root,state}=saleFixture();
 state.clubId="b";
 state.clubs[0].roster=Array.from({length:20},(_,i)=>({id:"p"+i,name:"Atleta "+i,age:23,overall:70,pos:"ATA"}));
 state.clubs[1].budget=30000000;
 state.clubs[1].structure=90;
 state.clubs[0].budget=100000;
 const budget=state.clubs[1].budget;
 root.ProLifeApp.execute(state,"recruit",{clubId:"a",playerId:"p0"});
 assert.equal(state.coachCareer.presentations.length,1);
 assert.equal(state.coachCareer.presentations[0].playerName,"Atleta 0");
 assert.equal(state.clubs[1].roster.filter(p=>p.id==="p0").length,1);
 const spent=state.clubs[1].budget;
 assert.ok(spent<budget);
 const loaded=JSON.parse(JSON.stringify(state));
 const id=loaded.coachCareer.presentations[0].id;
 root.ProLifeApp.execute(loaded,"ackCoachPresentation",{id});
 assert.equal(loaded.coachCareer.presentations[0].presented,true);
 assert.equal(loaded.clubs[1].budget,spent);
 root.ProLifeApp.execute(loaded,"ackCoachPresentation",{id});
 assert.equal(loaded.coachCareer.presentations.length,1);
 assert.equal(loaded.clubs[1].roster.filter(p=>p.id==="p0").length,1);
});
test("Signing reveal actions and market presentation stay manager-only",()=>{
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const root={};root.globalThis=root;
 vm.runInNewContext(ui,root);
 const state={mode:"coach",clubId:"a",season:2026,day:1,clubs:[{id:"a",name:"Clube",budget:100000,roster:[]}],coachCareer:{presentations:[{id:"q1",playerId:"p1",playerName:"Reforço",toClubId:"a",toClubName:"Clube",fromClubName:"Origem",fee:25000,presented:false}]}};
 const D={club:s=>s.clubs[0]};
 root.ProLifeCoachCareerView.setMarketArea("overview");
 const html=root.ProLifeCoachCareerView.renderMarket(state,D);
 for(const attr of ["data-coach-signing-done","data-coach-signing-squad","data-coach-signing-history"])assert.ok(html.includes(attr),attr);
 assert.match(html,/CONTRATAÇÃO CONFIRMADA/);
 assert.doesNotMatch(html,/aria-label="Seções da carreira"/);
 assert.match(app,/ackCoachPresentation/);
});

test("Coach can negotiate outside transfer window but cannot recruit until window opens",()=>{
 const {root,state}=saleFixture(false);
 state.clubId="b";
 state.clubs[0].roster=Array.from({length:20},(_,i)=>({id:"p"+i,name:"Athlete "+i,age:22,overall:70,pos:"ATA"}));
 state.clubs[1].budget=10000000;state.clubs[1].structure=90;
 root.ProLife.Career.windowStatus=()=>({open:false,remaining:31});
 const before=JSON.stringify(state.clubs);
 root.ProLifeApp.execute(state,"counterRecruit",{clubId:"a",playerId:"p0",offer:1000000});
 assert.equal(state.coachCareer.negotiations.length,1);
 assert.equal(state.coachCareer.negotiations[0].expiresDay,state.day+41);
 assert.equal(JSON.stringify(state.clubs),before);
 assert.throws(()=>root.ProLifeApp.execute(state,"recruit",{clubId:"a",playerId:"p0"}),/Janela de transferências fechada/);
 assert.equal(JSON.stringify(state.clubs),before);
});
test("Shortlist indicates transferred player belongs to new club and old target is removable",()=>{
 const {root,state}=saleFixture();
 state.clubs[1].roster=[{id:"target",name:"Target",clubId:"b",pos:"ATA"}];
 root.ProLifeApp.execute(state,"toggleCoachShortlist",{clubId:"b",playerId:"target"});
 state.clubs[1].roster=[];
 state.clubs[0].roster.push({id:"target",name:"Target",clubId:"a",pos:"ATA"});
 const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 assert.match(view,/Já está no seu elenco/);
 root.ProLifeApp.execute(state,"toggleCoachShortlist",{clubId:"b",playerId:"target"});
 assert.equal(state.coachCareer.shortlist.length,0);
});

test("Off-window manager deal negotiates, signs, and settles only once after opening",()=>{
 const {root,state}=saleFixture();
 state.clubId="b";
 let open=false;
 root.ProLife.Career.windowStatus=()=>({open,remaining:12});
 const before=state.clubs[1].budget;
 root.ProLifeApp.execute(state,"counterRecruit",{clubId:"a",playerId:"p0",offer:160000});
 const n=state.coachCareer.negotiations[0];
 settleTransferReply(state);
 root.ProLifeApp.execute(state,"reviseCoachDeal",{id:n.id,offer:5000000});
 settleTransferReply(state);
 root.ProLifeApp.execute(state,"acceptCoachDeal",{id:n.id,paymentPlan:"upfront"});
 assert.equal(n.status,"awaiting_window");
 assert.equal(state.clubs[1].budget,before);
 assert.equal(state.clubs[1].roster.length,0);
 let saved=JSON.parse(JSON.stringify(state));
 assert.throws(()=>root.ProLifeApp.execute(saved,"recruit",{clubId:"a",playerId:"p0"}),/Janela/);
 open=true;
 root.ProLifeApp.execute(saved,"settleCoachWindowDeals",{});
 const paid=saved.clubs[1].budget;
 assert.equal(saved.coachCareer.negotiations[0].status,"accepted");
 assert.equal(saved.clubs[1].roster.filter(p=>p.id==="p0").length,1);
 assert.ok(paid<before);
 root.ProLifeApp.execute(saved,"settleCoachWindowDeals",{});
 assert.equal(saved.clubs[1].budget,paid);
 assert.equal(saved.clubs[1].roster.filter(p=>p.id==="p0").length,1);
});
test("Automatic future transfer hook runs from coach daily and UI shows awaiting window",()=>{
 const career=fs.readFileSync(path.join(__dirname,"../src/domain/career.js"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 assert.match(career,/settleCoachWindowDeals/);
 assert.match(ui,/Aguardando abertura da janela/);
 assert.match(ui,/n.status==="awaiting_window"/);
});

test("Manager team management offers drag, drop, and click-to-swap through lineup validation",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(app,/draggable="true" title="Arraste para trocar/);
 assert.match(app,/addEventListener\("dragstart"/);
 assert.match(app,/addEventListener\("dragover"/);
 assert.match(app,/addEventListener\("drop"/);
 assert.match(app,/function swapSquadPlayers/);
 assert.match(app,/A\.execute\(state,"lineup",\{ids:(?:chosen|ids)\}\)/);
 assert.match(app,/swapSquadPlayers\(source,id\)/);
 assert.match(app,/state\?\.mode==="coach"/);
});

test("Drag substitution repairs a ten-player lineup containing injured goalkeeper",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const start=app.indexOf("  function swapSquadPlayers("),end=app.indexOf('  document.addEventListener("click"',start);
 assert.ok(start>0&&end>start);
 const squad=Array.from({length:12},(_,i)=>({id:"p"+i,name:"Player "+i,pos:i<2?"GOL":"ATA",overall:70+i}));
 squad[0].injury={days:10};
 const club={roster:squad,lineup:["p0","p2","p3","p4","p5","p6","p7","p8","p9","p10"]};
 const ctx={state:{mode:"coach"},squadSelectedId:null,D:{club:()=>club,overall:p=>p.overall},A:{execute:(state,action,data)=>{
   assert.equal(action,"lineup");
   assert.equal(data.ids.length,11);
   assert.ok(data.ids.includes("p1"));
   assert.ok(!data.ids.includes("p0"));
   assert.ok(data.ids.includes("p11"));
   club.lineup=data.ids;
 }},persist:()=>{},render:()=>{},toast:()=>{}};
 vm.runInNewContext(app.slice(start,end)+";globalThis.swap=swapSquadPlayers;",ctx);
 assert.equal(ctx.swap("p11","p10"),true);
 assert.equal(club.lineup.length,11);
 assert.ok(club.lineup.includes("p1"));
});

test("Manager offer preferences persist and control proposal eligibility",()=>{
 const {root,state}=saleFixture();
 const own=state.clubs.find(c=>c.id===state.clubId);
 const player=own.roster.find(p=>p.id!=="hero");
 assert.ok(player);
 root.ProLifeApp.execute(state,"setCoachOfferPreference",{mode:"none"});
 assert.equal(state.coachCareer.offerPreferences.mode,"none");
 assert.throws(()=>root.ProLifeApp.execute(state,"generateSaleInterest",{}),/desativado/);
 root.ProLifeApp.execute(state,"setCoachOfferPreference",{mode:"listed"});
 assert.throws(()=>root.ProLifeApp.execute(state,"generateSaleInterest",{}),/preferências/);
 root.ProLifeApp.execute(state,"setCoachPlayerOfferStatus",{playerId:player.id,status:"listed"});
 assert.ok(state.coachCareer.offerPreferences.listedIds.includes(player.id));
 root.ProLifeApp.execute(state,"setCoachPlayerOfferStatus",{playerId:player.id,status:"blocked"});
 assert.equal(state.coachCareer.offerPreferences.listedIds.includes(player.id),false);
 assert.equal(state.coachCareer.offerPreferences.blockedIds.includes(player.id),true);
 const saved=JSON.parse(JSON.stringify(state));
 assert.equal(saved.coachCareer.offerPreferences.mode,"listed");
 assert.ok(saved.coachCareer.offerPreferences.blockedIds.includes(player.id));
 root.ProLifeApp.execute(saved,"setCoachPlayerOfferStatus",{playerId:player.id,status:"available"});
 assert.ok(!saved.coachCareer.offerPreferences.blockedIds.includes(player.id));
});
test("Offer settings controls are available only on manager transfer screen",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 assert.match(app,/setCoachOfferPreference/);
 assert.match(app,/setCoachPlayerOfferStatus/);
 assert.match(view,/Preferências de propostas/);
 assert.match(view,/Bloquear ofertas/);
 assert.match(view,/Não receber propostas/);
});

test("Manager receives offer deadlines, negotiates outside window and expires unanswered offers once",()=>{
 const {root,state}=saleFixture(false);
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 const offer=state.coachCareer.saleOffers[0],original=JSON.stringify(state.clubs);
 root.ProLifeApp.execute(state,"counterSaleOffer",{id:offer.id,amount:150000});
 assert.equal(offer.round,2);
 assert.equal(JSON.stringify(state.clubs),original);
 // Isolate the real daily expiry block: this fixture intentionally has no
 // full career/person setup and must not trigger unrelated career subsystems.
 const begin=src.indexOf("    // Close expired incoming proposals once");
 const end=src.indexOf("    // Periodic inbound approaches;",begin);
 assert.ok(begin>=0&&end>begin);
 const expire=vm.runInNewContext("(function(s){"+src.slice(begin,end)+"})",{});
 state.day=offer.expiresDay+1;
 expire(state);
 assert.equal(offer.status,"expired");
 const count=state.news.filter(n=>n.title==="Proposta de transferência expirada").length;
 assert.equal(count,1);
 expire(state);
 assert.equal(state.news.filter(n=>n.title==="Proposta de transferência expirada").length,1);
 assert.equal(JSON.stringify(state.clubs),original);
});
test("Received offers show financial dashboard and urgent decision deadlines",()=>{
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 assert.match(ui,/Resumo de propostas recebidas/);
 assert.match(ui,/Prazo próximo \(até 3 dias\)/);
 assert.match(ui,/Urgente/);
 assert.match(ui,/Valor total oferecido/);
});

test("Manager signs outgoing sale outside window and settlement is idempotent after reload",()=>{
 const {root,state}=saleFixture(false);
 let open=false;
 root.ProLife.Career.windowStatus=()=>({open});
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 const offer=state.coachCareer.saleOffers[0],playerId=offer.playerId;
 const funds=[state.clubs[0].budget,state.clubs[1].budget];
 const rosters=JSON.stringify(state.clubs.map(c=>c.roster));
 root.ProLifeApp.execute(state,"acceptSaleOffer",{id:offer.id});
 assert.equal(offer.status,"awaiting_window");
 assert.equal(JSON.stringify(state.clubs.map(c=>c.roster)),rosters);
 assert.deepEqual([state.clubs[0].budget,state.clubs[1].budget],funds);
 const saved=JSON.parse(JSON.stringify(state));
 open=true;
 root.ProLifeApp.execute(saved,"settleCoachWindowSales",{});
 const sold=saved.coachCareer.saleOffers[0];
 assert.equal(sold.status,"accepted");
 assert.equal(saved.clubs[0].roster.some(p=>p.id===playerId),false);
 assert.equal(saved.clubs[1].roster.filter(p=>p.id===playerId).length,1);
 const after=JSON.stringify(saved.clubs);
 root.ProLifeApp.execute(saved,"settleCoachWindowSales",{});
 assert.equal(JSON.stringify(saved.clubs),after);
 assert.throws(()=>root.ProLifeApp.execute(saved,"acceptSaleOffer",{id:offer.id}),/indisponível/);
});
test("Outgoing sale cannot be settled until the window opens; manager UI reports agreement",()=>{
 const {root,state}=saleFixture(false);
 root.ProLifeApp.execute(state,"generateSaleInterest",{});
 const id=state.coachCareer.saleOffers[0].id;
 root.ProLifeApp.execute(state,"acceptSaleOffer",{id});
 const before=JSON.stringify(state.clubs);
 root.ProLifeApp.execute(state,"settleCoachWindowSales",{});
 assert.equal(JSON.stringify(state.clubs),before);
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const career=fs.readFileSync(path.join(__dirname,"../src/domain/career.js"),"utf8");
 assert.match(ui,/Venda programada/);
 assert.match(ui,/Aceitar acordo futuro/);
 assert.match(career,/settleCoachWindowSales/);
});
