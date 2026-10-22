"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const E=require("../src/domain/club-economy.js");
const C=require("../src/domain/commercial.js");
global.ProLifeClubEconomy=E;
global.ProLifeCommercial=C;
const V=require("../src/ui/coach-career-view.js");
const club=()=>({id:"sp",name:"São Paulo",structure:80,leagueId:"serieA",budget:1000000});
const state=()=>({mode:"coach",clubId:"sp",day:100,season:2026,coachCareer:{finance:{}},clubs:[club()]});

test("propostas iniciais são persistentes, estáveis e sobrevivem ao save",()=>{
  const s=state(),offers=E.initializeSponsorships(s,s.clubs[0],C.brands);
  assert.equal(offers.length,3);
  assert.equal(new Set(offers.map(x=>x.id)).size,3);
  assert.ok(offers.every(x=>x.status==="pending"&&x.paymentFrequency==="monthly"&&x.bonus&&x.expiresDay===121));
  const ids=offers.map(x=>x.id);
  E.initializeSponsorships(s,s.clubs[0],C.brands);
  assert.deepEqual(s.coachCareer.finance.sponsorshipOffers.map(x=>x.id),ids);
  const loaded=JSON.parse(JSON.stringify(s));
  assert.deepEqual(E.sponsorshipOffers(loaded,loaded.clubs[0],C.brands).map(x=>x.id),ids);
});

test("aceite cria contrato e parcelas são creditadas uma vez, inclusive após reload",()=>{
  const s=state(),offer=E.initializeSponsorships(s,s.clubs[0],C.brands)[0],base=s.clubs[0].budget;
  s.wallet=7654321;
  const contract=E.acceptSponsorshipOffer(s,s.clubs[0],C.brands,offer.id);
  assert.equal(s.clubs[0].budget,base);
  assert.equal(s.wallet,7654321);
  s.day=contract.startDay+30;
  const first=E.processRevenuePayments(s,s.clubs[0]);
  assert.equal(first.length,1);
  assert.equal(s.clubs[0].budget,base+Math.round(contract.annualAmount/12));
  assert.equal(s.wallet,7654321);
  assert.deepEqual(s.coachCareer.finance.revenueHistory.find(x=>x.paymentId===first[0].paymentId),{
    paymentId:first[0].paymentId,contractId:contract.id,day:first[0].dueDay,processedDay:s.day,
    event:"payment",amount:first[0].amount,period:1,brandName:contract.brandName
  });
  assert.equal(E.processRevenuePayments(s,s.clubs[0]).length,0);
  const loaded=JSON.parse(JSON.stringify(s)),after=loaded.clubs[0].budget;
  assert.equal(E.processRevenuePayments(loaded,loaded.clubs[0]).length,0);
  assert.equal(loaded.clubs[0].budget,after);
});

test("exclusividade esportiva bloqueia marcas concorrentes sem apagar a proposta",()=>{
  const s=state();
  s.coachCareer.finance.revenueContracts=[{id:"nike",clubId:"sp",type:"sponsorship",brandName:"Nike",brandCategory:"SPORTSWEAR",sponsorRole:"main",exclusiveGroups:["role:main","sportswear"],startDay:1,endDay:500,status:"active"}];
  const offer={id:"adidas",brandName:"Adidas",brandCategory:"SPORTSWEAR",role:"kit",label:"Material esportivo",exclusiveGroups:["role:kit","sportswear"]};
  const conflict=E.sponsorshipConflict(s,offer);
  assert.match(conflict.reason,/material esportivo/);
  assert.equal(offer.id,"adidas");
});

test("expiração, bônus e renovação são idempotentes",()=>{
  const s=state(),offer=E.initializeSponsorships(s,s.clubs[0],C.brands)[0];
  const contract=E.acceptSponsorshipOffer(s,s.clubs[0],C.brands,offer.id),base=s.clubs[0].budget;
  s.day=365;
  const table=[{id:"sp",points:90},{id:"rival",points:70}];
  assert.equal(E.processSponsorshipBonuses(s,s.clubs[0],table).length,1);
  const withBonus=s.clubs[0].budget;
  assert.ok(withBonus>base);
  assert.equal(E.processSponsorshipBonuses(s,s.clubs[0],table).length,0);
  assert.equal(s.clubs[0].budget,withBonus);
  s.day=contract.endDay+1;s.season=2027;
  E.processRevenuePayments(s,s.clubs[0]);
  const lifecycle=E.processSponsorshipLifecycle(s,s.clubs[0],C.brands);
  assert.equal(contract.status,"ended");
  assert.ok(lifecycle.created.length>=1);
  assert.ok(s.coachCareer.finance.sponsorshipOffers.some(x=>x.season===2027&&x.renewalOf===contract.id));
});

test("painel e popup apontam para a proposta comercial do clube",()=>{
  const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
  const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
  new vm.Script(view);new vm.Script(app);
  assert.match(view,/function renderSponsorships/);
  assert.match(view,/id="club-sponsor-offer-/);
  assert.match(view,/Histórico de pagamentos e bônus/);
  assert.match(app,/"coach-sponsor":\{page:"clubSponsorships"/);
  assert.doesNotMatch(app,/"coach-sponsor":\{page:"market"/);
  assert.doesNotMatch(app,/Toda receita comercial entra na mesma carteira/);
  assert.match(app,/Resumo comercial da temporada/);
  assert.match(app,/receitas institucionais pertencem ao clube/);
});

test("interface de patrocínios reflete parcelas, datas e histórico persistidos",()=>{
  const s=state(),offer=E.initializeSponsorships(s,s.clubs[0],C.brands)[0];
  const contract=E.acceptSponsorshipOffer(s,s.clubs[0],C.brands,offer.id);
  s.day=contract.startDay+30;
  const [payment]=E.processRevenuePayments(s,s.clubs[0]);
  const html=V.renderSponsorships(s,{club:()=>s.clubs[0]});
  const next=E.revenueSchedule(s,"sp")[0];
  const date=day=>new Date(Date.UTC(2026,0,1)+day*86400000).toLocaleDateString("pt-BR",{timeZone:"UTC"});
  assert.match(html,new RegExp(contract.brandName));
  assert.match(html,new RegExp(contract.brandCategory));
  assert.match(html,/Parcelas recebidas:<\/b> 1 de 12/);
  assert.match(html,new RegExp(`parcela ${next.period}\/12`));
  assert.match(html,new RegExp(date(next.dueDay).replaceAll("/","\\/")));
  assert.match(html,new RegExp(`parcela ${payment.period}\/12`));
  assert.match(html,/Registrado sem crédito/);
  assert.match(html,/Valor contratual ainda previsto/);
});
