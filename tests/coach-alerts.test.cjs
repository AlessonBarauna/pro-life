"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js"),A=require("../src/ui/coach-alerts.js");
function coach(){const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_5",90000);E.CoachCareer.init(s,E);return s;}
test("alertas: primeira leitura só registra; depois avisa lesão, suspensão, olheiro, proposta e sondagem",()=>{
  const s=coach(),club=E.club(s);
  assert.deepEqual(A.fresh(s,E),[]);
  assert.ok(Array.isArray(s.coachCareer.alertsSeen));
  const [p1,p2]=club.roster.filter(p=>p.id!=="hero");
  p1.injury={name:"Entorse",daysLeft:12};p2.suspension=2;
  s.coachCareer.scoutingV2={version:1,nextId:2,missions:[{id:1,playerId:club.roster[3].id,status:"complete"}]};
  s.coachCareer.saleOffers=[{id:"so1",status:"pending",sellerClubId:s.clubId,buyerClubId:"gf_fc27_9",playerId:p1.id,fee:5e6}];
  s.coachCareer.inquiries=[{id:"q1",buyerClubId:s.clubId,sellerClubId:"gf_fc27_9",playerId:club.roster[4].id,status:"accepted"}];
  const f=A.fresh(s,E),titles=f.map(a=>a.title).join("|");
  assert.match(titles,/lesionado/);assert.match(titles,/suspenso/);assert.match(titles,/olheiro/);assert.match(titles,/Proposta por/);assert.match(titles,/Sondagem aceita/);
  assert.equal(f.find(a=>/Proposta por/.test(a.title)).go.tab,"negociacoes");
  assert.equal(f.find(a=>/Sondagem aceita/.test(a.title)).go.list,"sondagens");
  assert.deepEqual(A.fresh(s,E),[],"não repete");
});
test("alertas: convocação da seleção e proposta de investidor",()=>{
  const s=coach();A.fresh(s,E);
  s.coachNational={teamId:"BRA",callup:{status:"open",first:100,deadline:95,label:"Eliminatórias"}};
  s.coachCareer.investors={deals:[{id:"inv_x",status:"proposed",clubId:s.clubId,investor:"Fundo X",amount:2e8}]};
  const f=A.fresh(s,E);
  assert.ok(f.some(a=>/Convocação/.test(a.title)&&a.go.page==="national"));
  assert.ok(f.some(a=>/investidor/.test(a.title)&&a.attrs));
});
test("alertas: destinos dos botões",()=>{
  const s=coach();A.fresh(s,E);
  s.coachCareer.youth=Object.assign(s.coachCareer.youth||{},{missions:[{id:3,status:"complete"}]});
  s.coachCareer.scoutingV2={version:1,nextId:2,missions:[{id:1,playerId:"x",status:"complete"}]};
  s.coachNational={teamId:"BRA",callup:{status:"open",first:100,deadline:95,label:"Eliminatórias"}};
  const f=A.fresh(s,E);
  assert.equal(f.find(a=>/base/.test(a.title)).attrs,"data-sm27-academy");
  assert.equal(f.find(a=>/olheiro/.test(a.title)).go.scoutScreen,"olheiros");
  assert.equal(f.find(a=>/Convocação/.test(a.title)).go.natTab,"convocacao");
});
