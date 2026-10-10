const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");
const C=D.Career;

function setOv(s,o){
  s.person.ovr=o;s.person.overall=o;
  for(const k of Object.keys(s.person.attrs||{}))if(typeof s.person.attrs[k]==="number")s.person.attrs[k]=o;
}
function make(ov,seed){
  const s=D.create({mode:"player",clubId:"c0"},seed);setOv(s,ov);
  s.contract=4000;const pc=C.init(s).playerCareer;if(pc.contract)pc.contract.endDay=s.day+4000;
  s.offers=[];pc.interests=[];s.careerTransferAvailableDay=0;
  return s;
}
const openDay=(year=0)=>year*365+10;      // Início do ano: janela aberta
const closedDay=(year=0)=>year*365+100;   // fora de qualquer janela
function eligibleClub(s){
  return D.careerClubPool(s).find(c=>c.id!==s.clubId&&C.interestAssessment(s,c.id)?.eligible===true);
}
function forceRoll(real){
  let first=true;
  return {next:()=>{if(first){first=false;return 0;}return real.next();},int:(a,b)=>real.int(a,b),pick:a=>real.pick(a)};
}
// Cadência do jogo: marketTick diário e progressInterest semanal (mesma ordem do avanço de dias).
function pipeline(s,rng,days){
  const seen={rumor:new Set(),probe:new Set(),neg:new Set(),offer:new Set()};
  for(let i=0;i<days;i++){
    s.day++;
    C.marketTick(s);
    s.offers=s.offers.filter(o=>o.expires>=s.day);
    if(s.day%7===0)C.progressInterest(s,rng,D.weightedCareerOffers);
    for(const it of C.init(s).playerCareer.interests){
      const k=`${it.clubId}:${it.day}`;
      if(it.stage==="Rumor")seen.rumor.add(k);if(it.stage==="Sondagem")seen.probe.add(k);if(it.stage==="Negociação")seen.neg.add(k);
    }
    for(const o of s.offers)seen.offer.add(`${o.clubId}:${o.expires}`);
  }
  return {rumors:seen.rumor.size,probes:seen.probe.size,negotiations:seen.neg.size,offers:seen.offer.size};
}

function simulateYear(ov,seed){
  const s=make(ov,seed),pc=C.init(s).playerCareer,seen={rumor:new Set(),probe:new Set(),neg:new Set(),offer:new Set()};
  const start=s.clubId;
  for(let d=0;d<365;d++){
    D.advance(s,1);
    for(const it of pc.interests){
      const k=`${it.clubId}:${it.day}`;
      if(it.stage==="Rumor")seen.rumor.add(k);if(it.stage==="Sondagem")seen.probe.add(k);if(it.stage==="Negociação")seen.neg.add(k);
    }
    for(const o of s.offers)seen.offer.add(`${o.clubId}:${o.expires}`);
  }
  return {s,start,rumors:seen.rumor.size,probes:seen.probe.size,negotiations:seen.neg.size,offers:seen.offer.size};
}
for(const ov of [65,78,86]){
  test(`31.4.1 (1) GER ${ov} recebe propostas oficiais em 365 dias, em quantidade plausível`,()=>{
    const r=simulateYear(ov,4100+ov);
    console.log(`GER ${ov}: rumores ${r.rumors}, sondagens ${r.probes}, negociações ${r.negotiations}, propostas ${r.offers}`);
    assert.ok(r.negotiations>=1,"sem negociações");
    assert.ok(r.offers>=1,"nenhuma proposta oficial: "+JSON.stringify({r:r.rumors,p:r.probes,n:r.negotiations,o:r.offers}));
    assert.ok(r.offers<=12,"propostas demais: "+r.offers);
    assert.ok(r.offers<=r.negotiations,"proposta sem negociação correspondente");
    assert.equal(r.s.clubId,r.start,"a simulação normal não pode aceitar propostas sozinha");
  });
}

test("31.4.1 (2) negociação elegível é convertida em proposta oficial para aquele clube",()=>{
  const s=make(78,4201);s.day=closedDay();
  const club=eligibleClub(s),pc=C.init(s).playerCareer;
  assert.ok(club);
  pc.interests=[{clubId:club.id,stage:"Negociação",day:s.day-7,expires:s.day+28}];
  C.progressInterest(s,forceRoll(new D.Random(1)),D.weightedCareerOffers);
  const offer=s.offers.find(o=>o.clubId===club.id);
  assert.ok(offer,"proposta não gerada");
  assert.equal(pc.interests[0].stage,"Oferta oficial");
  assert.ok(offer.salary>0&&offer.durationDays>0&&offer.expires>s.day&&offer.squadRole&&offer.role);
  assert.equal(s.offers.filter(o=>o.clubId===club.id).length,1);
});

test("31.4.1 (3) clube incompatível ou em cooldown não recebe conversão",()=>{
  const s=make(50,4202);s.day=closedDay();
  const pc=C.init(s).playerCareer;
  const top=D.careerClubPool(s).filter(c=>C.interestAssessment(s,c.id)?.eligible!==true)[0];
  assert.ok(top,"esperava clube inelegível para GER 50");
  pc.interests=[{clubId:top.id,stage:"Negociação",day:s.day-7,expires:s.day+28}];
  C.progressInterest(s,forceRoll(new D.Random(2)),D.weightedCareerOffers);
  assert.equal(s.offers.length,0);
  assert.equal(pc.interests[0].stage,"Negociação");
  // cooldown de recusa
  const s2=make(78,4203);s2.day=closedDay();
  const club=eligibleClub(s2),pc2=C.init(s2).playerCareer;
  pc2.marketState.rejectionCooldowns[club.id]=s2.day+30;
  pc2.interests=[{clubId:club.id,stage:"Negociação",day:s2.day-7,expires:s2.day+28}];
  C.progressInterest(s2,forceRoll(new D.Random(3)),D.weightedCareerOffers);
  assert.equal(s2.offers.length,0);
});

test("31.4.1 (4) preferências de mercado continuam filtrando a conversão",()=>{
  const s=make(78,4204);s.day=closedDay();
  const pc=C.init(s).playerCareer;
  const foreign=D.careerClubPool(s).find(c=>c.id!==s.clubId&&!(s.clubs||[]).some(x=>x.id===c.id)&&C.interestAssessment(s,c.id)?.eligible===true);
  assert.ok(foreign,"esperava clube internacional elegível");
  {
    C.init(s).offerPreferences={leagues:["serieA","serieB","serieC","serieD"],clubLevel:"any",international:false};
    pc.interests=[{clubId:foreign.id,stage:"Negociação",day:s.day-7,expires:s.day+28}];
    C.progressInterest(s,forceRoll(new D.Random(4)),D.weightedCareerOffers);
    assert.ok(!s.offers.some(o=>o.clubId===foreign.id),"mercado internacional desligado ainda gerou proposta");
  }
  const s2=make(78,4205);s2.day=closedDay();
  const club=eligibleClub(s2);
  C.init(s2).offerPreferences={leagues:["serieA","serieB","serieC","serieD"],clubLevel:Number(club.structure)>=45?"small":"elite",international:true};
  C.init(s2).playerCareer.interests=[{clubId:club.id,stage:"Negociação",day:s2.day-7,expires:s2.day+28}];
  C.progressInterest(s2,forceRoll(new D.Random(5)),D.weightedCareerOffers);
  assert.ok(!s2.offers.some(o=>o.clubId===club.id),"nível de clube fora da preferência gerou proposta");
});

test("31.4.1 (5) propostas são geradas com janela aberta e fechada",()=>{
  for(const [label,day] of [["aberta",openDay()],["fechada",closedDay()]]){
    const s=make(78,4210);s.day=day;
    assert.equal(C.windowStatus(s).open,label==="aberta");
    const club=eligibleClub(s);
    C.init(s).playerCareer.interests=[{clubId:club.id,stage:"Negociação",day:s.day-7,expires:s.day+28}];
    C.progressInterest(s,forceRoll(new D.Random(6)),D.weightedCareerOffers);
    assert.ok(s.offers.some(o=>o.clubId===club.id),`sem proposta com janela ${label}`);
  }
});

test("31.4.1 (6) acordo fora da janela vira transferência futura, sem antecipar a mudança",()=>{
  const s=make(78,4220);s.day=closedDay();
  const club=eligibleClub(s),previous=s.clubId;
  C.init(s).playerCareer.interests=[{clubId:club.id,stage:"Negociação",day:s.day-7,expires:s.day+28}];
  C.progressInterest(s,forceRoll(new D.Random(7)),D.weightedCareerOffers);
  const offer=s.offers.find(o=>o.clubId===club.id);assert.ok(offer);
  const result=D.join(s,club.id,offer.salary);
  const pc=C.init(s).playerCareer;
  assert.equal(result.scheduled,true);
  assert.equal(s.clubId,previous);
  assert.equal(pc.marketState.signedAgreement.clubId,club.id);
  assert.equal(pc.marketState.futureTransfer.clubId,club.id);
  assert.ok(pc.marketState.futureTransfer.startDay>s.day);
  // na abertura da janela o acordo é efetivado
  s.day=pc.marketState.futureTransfer.startDay;
  const due=C.marketTick(s);
  assert.ok(due&&C.windowStatus(s).open);
  D.join(s,due.clubId,due.salary);
  assert.equal(s.clubId,club.id);
});

test("31.4.1 (7) proposta fica acessível: s.offers, caixa de entrada e contador da navegação",()=>{
  const s=make(78,4230);s.day=closedDay();
  const club=eligibleClub(s);
  C.init(s).playerCareer.interests=[{clubId:club.id,stage:"Negociação",day:s.day-7,expires:s.day+28}];
  const unreadBefore=C.unreadCount(s);
  C.progressInterest(s,forceRoll(new D.Random(8)),D.weightedCareerOffers);
  assert.ok(s.offers.length>=1);
  const messages=C.init(s).communications.messages;
  const msg=messages.find(m=>/proposta oficial/i.test(`${m.title} ${m.body}`)&&String(m.body).includes(D.club(s,club.id).name));
  assert.ok(msg,"mensagem da proposta ausente");
  assert.match(msg.body,/R\$/);assert.match(msg.body,/ano/);
  assert.ok(C.unreadCount(s)>unreadBefore);
  const app=fs.readFileSync(path.join(__dirname,"..","src","ui","app.js"),"utf8");
  assert.match(app,/offerCount = \(state\.offers\|\|\[\]\)\.filter\(\(o\) => o\.expires >= state\.day\)\.length/);
});

test("31.4.1 (8) aceitar, recusar e negociar proposta funcionam sem erro",()=>{
  const s=make(78,4240);s.day=openDay();
  const clubs=D.careerClubPool(s).filter(c=>c.id!==s.clubId&&C.interestAssessment(s,c.id)?.eligible===true).slice(0,3);
  assert.ok(clubs.length>=3);
  const pc=C.init(s).playerCareer;
  pc.interests=clubs.map(c=>({clubId:c.id,stage:"Negociação",day:s.day-7,expires:s.day+28}));
  for(let i=0;i<3;i++){C.progressInterest(s,forceRoll(new D.Random(20+i)),D.weightedCareerOffers);}
  assert.ok(s.offers.length>=1);
  const [first,...rest]=s.offers.map(o=>o.clubId);
  C.rejectOffer(s,first);
  assert.ok(!s.offers.some(o=>o.clubId===first));
  assert.ok(pc.marketState.rejectionCooldowns[first]>s.day);
  if(rest.length){C.counterOffer(s,rest[0]);assert.ok(s.offers.find(o=>o.clubId===rest[0]).negotiated);}
  const target=s.offers[0];
  if(target){D.join(s,target.clubId,target.salary);assert.equal(s.clubId,target.clubId);}
});

test("31.4.1 (9) cooldown de recusa impede nova conversão e negociação expira sem ficar presa",()=>{
  const s=make(78,4250);s.day=openDay();
  const club=eligibleClub(s),pc=C.init(s).playerCareer;
  pc.interests=[{clubId:club.id,stage:"Negociação",day:s.day-7,expires:s.day+28}];
  C.progressInterest(s,forceRoll(new D.Random(30)),D.weightedCareerOffers);
  C.rejectOffer(s,club.id);
  const cooldown=pc.marketState.rejectionCooldowns[club.id];
  pc.interests=[{clubId:club.id,stage:"Negociação",day:s.day,expires:s.day+28}];
  s.day+=7;
  C.progressInterest(s,forceRoll(new D.Random(31)),D.weightedCareerOffers);
  assert.ok(s.day<cooldown);
  assert.ok(!s.offers.some(o=>o.clubId===club.id));
  // expiração: após o prazo o interesse deixa de ser processado e a oferta some
  s.day=pc.interests[0].expires+1;
  C.progressInterest(s,new D.Random(32),D.weightedCareerOffers);
  assert.ok(!s.offers.some(o=>o.clubId===club.id));
  const s2=make(78,4251);s2.day=openDay();
  const c2=eligibleClub(s2);
  C.init(s2).playerCareer.interests=[{clubId:c2.id,stage:"Negociação",day:s2.day-7,expires:s2.day+28}];
  C.progressInterest(s2,forceRoll(new D.Random(33)),D.weightedCareerOffers);
  const expires=s2.offers[0].expires;
  s2.day=expires+1;C.marketTick(s2);
  assert.equal(s2.offers.filter(o=>o.expires>=s2.day).length,0);
  const closed=C.init(s2).playerCareer.interests.find(i=>i.clubId===c2.id);
  assert.ok(!closed||closed.stage==="Encerrado");
});

test("31.4.1 (10) save/reload preserva propostas sem duplicar",()=>{
  const s=make(78,4260);
  const club=eligibleClub(s);
  C.init(s).playerCareer.interests=[{clubId:club.id,stage:"Negociação",day:s.day,expires:s.day+28}];
  C.progressInterest(s,forceRoll(new D.Random(40)),D.weightedCareerOffers);
  const copy=Save.parse(JSON.stringify(s)),again=Save.parse(JSON.stringify(copy));
  assert.deepEqual(copy.offers,s.offers);
  assert.deepEqual(again.offers,s.offers);
  assert.equal(copy.offers.filter(o=>o.clubId===club.id).length,1);
  C.progressInterest(copy,forceRoll(new D.Random(41)),D.weightedCareerOffers);
  assert.equal(copy.offers.filter(o=>o.clubId===club.id).length,1,"duplicou ao reprocessar");
});

test("31.4.1 (11) mesma seed produz as mesmas propostas",()=>{
  const run=()=>{const s=make(78,4270);s.day=0;const r=pipeline(s,new D.Random(77),200);return {r,offers:s.offers,interests:C.init(s).playerCareer.interests};};
  assert.deepEqual(run(),run());
});

test("31.4.1 (12) a simulação normal não aceita nem recusa propostas sozinha",()=>{
  const s=make(78,4280);s.day=closedDay();
  const club=eligibleClub(s),previous=s.clubId;
  C.init(s).playerCareer.interests=[{clubId:club.id,stage:"Negociação",day:s.day-7,expires:s.day+28}];
  C.progressInterest(s,forceRoll(new D.Random(50)),D.weightedCareerOffers);
  assert.ok(s.offers.length>=1);
  D.advance(s,3);
  assert.equal(s.clubId,previous);
  assert.ok(s.offers.some(o=>o.clubId===club.id&&o.expires>=s.day));
});
