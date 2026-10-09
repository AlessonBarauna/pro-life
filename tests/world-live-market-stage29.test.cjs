"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");

const C=D.Career;
const BASE=D.create({mode:"player",clubId:"c0"},29000);

function state(){
  const s=structuredClone(BASE);
  D.GlobalFootball.init(s);
  C.init(s);
  return s;
}

function strongState(){
  const s=state();
  for(const key of Object.keys(s.person.attrs)) s.person.attrs[key]=88;
  s.person.age=26;
  s.person.potential=92;
  s.reputation=92;
  C.init(s).playerCareer.lastEvaluation={rating:8.4};
  s.careerTransferAvailableDay=0;
  return s;
}

function realOffers(s,seed=29001){
  return D.weightedCareerOffers(s,new D.Random(seed),9999);
}

function globalOffer(s,seed=29001){
  const offer=realOffers(s,seed).find(item=>String(item.clubId).startsWith("gf_"));
  assert.ok(offer,"o mercado real deve produzir clube global compatível");
  return offer;
}

test("29A: interesse mantém identidade única por clube sem duplicar negociação",()=>{
  const s=strongState();
  const pc=C.init(s).playerCareer;
  pc.interests=[];

  C.registerInterest(s,"gf_real_madrid","Rumor");
  C.registerInterest(s,"gf_real_madrid","Sondagem");

  assert.equal(pc.interests.length,1);
  assert.equal(pc.interests[0].clubId,"gf_real_madrid");
  assert.equal(pc.interests[0].stage,"Sondagem");
  assert.equal(new Set(pc.interests.map(item=>item.clubId)).size,pc.interests.length);
});

test("29A: pipeline existente cobre rumor, sondagem, negociação, proposta e recusa",()=>{
  const s=strongState();
  const pc=C.init(s).playerCareer;
  const offer=globalOffer(s,29010);
  const rng=new D.Random(29011);
  pc.interests=[];
  s.offers=[];

  C.registerInterest(s,offer.clubId,"Rumor");
  const interest=pc.interests[0];
  assert.equal(interest.stage,"Rumor");

  C.progressInterest(s,rng,()=>[offer]);
  assert.equal(interest.stage,"Sondagem");
  C.progressInterest(s,rng,()=>[offer]);
  assert.equal(interest.stage,"Negociação");
  C.progressInterest(s,rng,()=>[offer]);
  assert.equal(interest.stage,"Oferta oficial");
  assert.equal(s.offers.length,1);

  C.rejectOffer(s,offer.clubId);
  assert.equal(interest.stage,"Recusado");
  assert.equal(s.offers.length,0);
});

test("29A: proposta expirada encerra o interesse sem duplicação",()=>{
  const s=strongState();
  const pc=C.init(s).playerCareer;
  const offer=globalOffer(s,29020);
  pc.interests=[];
  C.registerInterest(s,offer.clubId,"Oferta oficial");
  offer.expires=s.day-1;
  s.offers=[offer];

  C.marketTick(s);
  assert.equal(pc.interests[0].stage,"Encerrado");
  assert.equal(s.offers.length,0);
});

test("29A: save e reload preservam pipeline global sem duplicações",()=>{
  const s=strongState();
  const pc=C.init(s).playerCareer;
  const offer=globalOffer(s,29030);
  pc.interests=[];
  s.offers=[offer];
  C.registerInterest(s,offer.clubId,"Oferta oficial");

  const restored=Save.parse(JSON.stringify(s));
  const restoredPc=C.init(restored).playerCareer;
  assert.equal(restoredPc.interests.length,1);
  assert.equal(restored.offers.length,1);
  assert.equal(restoredPc.interests[0].clubId,offer.clubId);
  assert.equal(restored.offers[0].clubId,offer.clubId);
  assert.equal(new Set(restoredPc.interests.map(item=>item.clubId)).size,1);
});

test("29A: clubes globais usados pelo mercado possuem IDs resolvíveis",()=>{
  const s=strongState();
  const offers=realOffers(s,29040).filter(item=>String(item.clubId).startsWith("gf_"));
  assert.ok(offers.length>0);
  for(const offer of offers){
    const club=D.club(s,offer.clubId);
    assert.ok(club,offer.clubId);
    assert.equal(club.id,offer.clubId);
  }
});

test("29A: transferência concluída atualiza elenco mundial e histórico",()=>{
  const s=strongState();
  const offer=globalOffer(s,29050);
  const destination=D.club(s,offer.clubId);
  s.offers=[offer];

  D.join(s,offer.clubId,offer.salary);

  const heroes=D.GlobalFootball.allPlayers(s).filter(player=>player.id==="hero");
  const record=C.init(s).transfers.find(item=>
    item.player===s.person.name&&item.to===destination.name
  );
  assert.equal(s.clubId,offer.clubId);
  assert.equal(heroes.length,1);
  assert.equal(heroes[0].clubId,offer.clubId);
  assert.ok(record);
  assert.equal(record.status,"CONFIRMED");
  assert.equal(record.accepted,true);
});

test("29A: ofertas mundiais são determinísticas com seed fixa",()=>{
  const a=realOffers(strongState(),29060);
  const b=realOffers(strongState(),29060);
  assert.deepEqual(a,b);
});

test.todo(
  "29A TODO: negociação deve possuir ID próprio e persistente além do clubId"
);

test.todo(
  "29A TODO: progressão rumor → proposta deve exigir passagem configurável de dias"
);

test.todo(
  "29A TODO: pipeline unificado deve registrar estados Concluída e Cancelada"
);
