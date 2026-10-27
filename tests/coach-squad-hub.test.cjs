"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

test("arquivos da central de elenco fazem parte do pacote publicado",()=>{
  const assets=require("../tools/assets.cjs").files;
  assert.ok(assets.includes("src/ui/coach-squad-hub.js"));
  assert.ok(assets.includes("src/ui/fc27-coach-squad-hub.css"));
});

function loadApp(){
  const source=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
  const careerState={transfers:[]};
  const root={};root.globalThis=root;
  root.ProLife={
    club:(s,id=s.clubId)=>[...(s.clubs||[]),...(s.globalFootball?.clubs||[])].find(c=>String(c.id)===String(id)),
    overall:p=>Number(p.overall||p.ovr||65),
    Career:{windowStatus:()=>({open:true}),init:()=>careerState,transfer:()=>{}},
    GlobalFootball:{playersByClub:()=>[]}
  };
  vm.runInNewContext(source,root,{filename:"game.js"});
  return {app:root.ProLifeApp,careerState};
}
function player(id,extra={}){return {id,name:"Jogador "+id,pos:"ATA",age:24,overall:72,potential:80,salary:20000,contractEndDay:730,condition:100,morale:70,...extra};}
function state(){
  const target=player("p1"),reserves=Array.from({length:18},(_,i)=>player("r"+i,{overall:60+i%5}));
  return {mode:"coach",clubId:"own",day:10,season:2027,news:[],internationalPlayers:[],
    clubs:[{id:"own",name:"Meu Clube",leagueId:"l1",budget:100000000,structure:80,roster:[target,...reserves],lineup:["p1"]},{id:"buyer",name:"Comprador",leagueId:"l2",budget:100000000,structure:80,roster:Array.from({length:19},(_,i)=>player("b"+i)),lineup:[]}],
    coachCareer:{settings:{loans:"on",marketStrictness:"normal"},offerPreferences:{mode:"all",blockedIds:[],listedIds:[],loanListedIds:[]},saleOffers:[],loans:[]}};
}

test("status de mercado do atleta é exclusivo e persiste após reload",()=>{
  const {app}=loadApp();let s=state();
  app.execute(s,"setCoachPlayerOfferStatus",{playerId:"p1",status:"listed"});
  app.execute(s,"setCoachPlayerOfferStatus",{playerId:"p1",status:"loan_listed"});
  s=JSON.parse(JSON.stringify(s));
  assert.deepEqual(s.coachCareer.offerPreferences.listedIds,[]);
  assert.deepEqual(s.coachCareer.offerPreferences.loanListedIds,["p1"]);
  assert.deepEqual(s.coachCareer.offerPreferences.blockedIds,[]);
});

test("lista de empréstimos gera e conclui empréstimo sem registrar venda",()=>{
  const {app,careerState}=loadApp();const s=state();
  app.execute(s,"setCoachPlayerOfferStatus",{playerId:"p1",status:"loan_listed"});
  app.execute(s,"setCoachOfferPreference",{mode:"listed"});
  app.execute(s,"generateSaleInterest",{});
  const offer=s.coachCareer.saleOffers[0];
  assert.equal(offer.dealType,"loan");
  app.execute(s,"acceptSaleOffer",{id:offer.id});
  assert.equal(s.clubs[0].roster.some(p=>p.id==="p1"),false);
  assert.equal(s.clubs[1].roster.some(p=>p.id==="p1"),true);
  assert.equal(s.coachCareer.loans.length,1);
  assert.equal(s.coachCareer.loans[0].fromClubId,"own");
  assert.equal(careerState.transfers[0].transferType,"loan");
});

test("renovação atualiza vínculo e orçamento e sobrevive ao save",()=>{
  const {app}=loadApp();let s=state(),before=s.clubs[0].budget;
  app.execute(s,"renewCoachPlayerContract",{playerId:"p1",salary:35000,years:3,bonus:120000,role:"Importante"});
  s=JSON.parse(JSON.stringify(s));
  const p=s.clubs[0].roster.find(p=>p.id==="p1");
  assert.equal(p.salary,35000);assert.equal(p.contractEndDay,10+3*365);assert.equal(p.squadRole,"Importante");
  assert.equal(s.clubs[0].budget,before-120000);assert.equal(s.coachCareer.contractRenewals.length,1);
});

test("rescisão cobra o custo, remove do elenco e mantém o atleta como agente livre",()=>{
  const {app}=loadApp();const s=state(),before=s.clubs[0].budget;
  app.execute(s,"releaseCoachPlayer",{playerId:"p1"});
  assert.equal(s.clubs[0].roster.length,18);
  assert.equal(s.clubs[0].lineup.includes("p1"),false);
  assert.equal(s.internationalPlayers.some(p=>p.id==="p1"),true);
  assert.equal(s.clubs[0].budget,before-240000);
  assert.equal(s.coachCareer.releases.length,1);
});

test("central de transferências expõe navegação única e ações individuais",()=>{
  const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
  const hub=fs.readFileSync(path.join(__dirname,"../src/ui/coach-squad-hub.js"),"utf8");
  const index=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  for(const label of ["Painel","Scouting","Transferências","Listas","Elenco"])assert.ok(view.includes(label));
  for(const action of ["data-coach-player-status","data-coach-renew-open","data-coach-player-release","data-coach-squad-lineup"])assert.ok(hub.includes(action));
  assert.ok(index.indexOf("coach-squad-hub.js")<index.indexOf("coach-career-view.js"));
});
