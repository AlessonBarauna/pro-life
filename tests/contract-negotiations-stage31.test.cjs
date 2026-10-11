const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");

function career(seed=31801){
  const s=D.create({world:"brazil2026",mode:"player",clubId:"c0",name:"Negociação",age:23,pos:"ATA"},seed);
  s.careerTransferAvailableDay=0;s.offers=[];D.Career.init(s).playerCareer.interests=[];return s;
}
function offer(s,clubId="gf_craiova",overrides={}){
  const row={clubId,salary:18000,signingBonus:24000,durationDays:730,role:"Disputa por posição",squadRole:"Rotação",transferType:"permanent",expires:s.day+20,interestScore:78,...overrides};
  s.offers=[row];return D.contractOfferOverview(s,clubId);
}
function assertSafe(value,path="root"){
  if(value===undefined)assert.fail(`${path} undefined`);
  if(typeof value==="number")assert.ok(Number.isFinite(value),`${path} não finito`);
  if(value&&typeof value==="object")for(const [key,item] of Object.entries(value))assertSafe(item,`${path}.${key}`);
}

test("31.8A: Universitatea Craiova usa identidade canônica e metadados reais cadastrados",()=>{
  const s=career(),id=D.GlobalFootball.clubIdentity(s,"gf_craiova");
  assert.equal(id.name,"Universitatea Craiova");assert.equal(id.city,"Craiova");assert.equal(id.region,"Dolj");assert.equal(id.country,"Romênia");
  assert.equal(id.league.id,"gf_rou_sl");assert.equal(id.league.name,"SuperLiga Romena");assert.equal(id.division,1);
  assert.equal(id.stadium,null);assert.equal(id.ranking,null,"sem jogos não inventa classificação");
  assert.ok(id.reputation>=0&&id.reputation<=100&&id.structure>=0&&id.structure<=100&&id.prestige>=0&&id.prestige<=100);assertSafe(id);
});

test("31.8A: outro clube internacional resolve liga e mantém ausências como null",()=>{
  const s=career(31802),madrid=D.GlobalFootball.clubIdentity(s,"gf_real_madrid"),craiova=D.GlobalFootball.clubIdentity(s,"gf_craiova");
  assert.equal(madrid.country,"Espanha");assert.equal(madrid.league.name,"LaLiga");assert.equal(madrid.city,null);assert.equal(madrid.region,null);assert.equal(madrid.stadium,null);
  assert.ok(madrid.prestige>craiova.prestige);assertSafe(madrid);
});

test("31.8A: visão detalhada expõe somente termos suportados e comparações finitas",()=>{
  const s=career(31803),overview=offer(s);
  assert.equal(overview.offerId,s.offers[0].offerId);assert.equal(overview.stage,"FORMAL_OFFER");assert.equal(overview.club.id,"gf_craiova");
  assert.equal(overview.terms.performanceBonus,null);assert.equal(overview.terms.releaseClause,null);assert.equal(overview.terms.expectedMinutes,"Moderada");
  for(const key of ["clubInterest","playerInterest","agreementChance","tension","daysRemaining"])assert.ok(Number.isFinite(overview.indicators[key]),key);
  assert.ok(overview.history.some(row=>row.stage==="FORMAL_OFFER"));assertSafe(overview);
});

test("31.8A: pedir prazo e recusar usam handlers existentes e registram etapas",()=>{
  const s=career(31804),overview=offer(s),before=s.offers[0].expires;
  D.Career.holdOffer(s,overview.offerId);assert.ok(s.offers[0].expires>=before);assert.equal(s.offers[0].stage,"ON_HOLD");
  D.Career.rejectOffer(s,overview.offerId);assert.equal(s.offers.length,0);assert.ok(D.Career.init(s).playerCareer.marketState.rejectionCooldowns.gf_craiova>s.day);
  const stages=D.Career.init(s).playerCareer.contractNegotiations.filter(row=>row.clubId==="gf_craiova").map(row=>row.stage);
  assert.ok(stages.includes("ON_HOLD")&&stages.includes("REJECTED"));
});

test("31.8A: contraproposta razoável recebe resposta determinística e não é recusada",()=>{
  const make=()=>{const s=career(31805),o=offer(s);return{s,o};},a=make(),b=make(),terms={salary:19000,signingBonus:26000,durationDays:1095,role:"Titular"};
  const ra=D.Career.counterOffer(a.s,a.o.offerId,terms),rb=D.Career.counterOffer(b.s,b.o.offerId,terms);
  assert.notEqual(ra.status,"rejected");assert.ok(["AGREEMENT","CLUB_RESPONSE"].includes(ra.stage));
  assert.deepEqual({status:ra.status,stage:ra.stage,salary:ra.salary,bonus:ra.signingBonus,role:ra.squadRole,negotiation:ra.negotiation},{status:rb.status,stage:rb.stage,salary:rb.salary,bonus:rb.signingBonus,role:rb.squadRole,negotiation:rb.negotiation});
});

test("31.8A: exigência exagerada pode encerrar a negociação",()=>{
  const s=career(31806),overview=offer(s),result=D.Career.counterOffer(s,overview.offerId,{salary:900000,signingBonus:9000000,durationDays:1825,role:"Estrela"});
  assert.equal(result.status,"rejected");assert.equal(result.stage,"REJECTED");assert.equal(s.offers.length,0);
  assert.ok(D.Career.init(s).playerCareer.contractNegotiations.some(row=>row.clubId==="gf_craiova"&&row.stage==="REJECTED"));
});

test("31.8A: aceite assina uma única vez e preserva termos contratuais",()=>{
  const s=career(31807),overview=offer(s,"gf_craiova",{signingBonus:32100,squadRole:"Titular"}),before=(s.extras.ledger||[]).filter(row=>row.label==="Luvas de assinatura").length;
  D.join(s,"gf_craiova",s.offers[0].salary);const pc=D.Career.init(s).playerCareer;
  assert.equal(s.clubId,"gf_craiova");assert.equal(pc.contract.role,"Titular");assert.equal(pc.contract.signingBonus,32100);
  assert.equal((s.extras.ledger||[]).filter(row=>row.label==="Luvas de assinatura").length,before+1);assert.equal(pc.contractNegotiations.filter(row=>row.offerId===overview.offerId&&row.stage==="SIGNED").length,1);
  assert.throws(()=>D.join(s,"gf_craiova",18000),/janela|disponível/i);
});

test("31.8A: contraproposta e expiração sobrevivem ao save sem eventos duplicados",()=>{
  const s=career(31805),overview=offer(s);D.Career.counterOffer(s,overview.offerId,{salary:19000,signingBonus:26000,durationDays:1095,role:"Titular"});
  const loaded=Save.parse(JSON.stringify(s)),current=loaded.offers[0];assert.ok(current&&current.offerId===overview.offerId);
  const history=D.Career.init(loaded).playerCareer.contractNegotiations.filter(row=>row.clubId==="gf_craiova"),ids=history.map(row=>row.id);assert.equal(new Set(ids).size,ids.length);
  loaded.day=current.expires+1;D.Career.marketTick(loaded);D.Career.marketTick(loaded);
  const expired=D.Career.init(loaded).playerCareer.contractNegotiations.filter(row=>row.clubId==="gf_craiova"&&row.stage==="EXPIRED");assert.equal(expired.length,1);
});

test("31.8A: proposta formal continua interrompendo simulações longas",()=>{
  const s=career(31809);offer(s);const result=D.simulateAdvance(s,"30days");
  assert.equal(result.completed,false);assert.equal(result.stop.type,"offer");assert.equal(s.day,0);assert.equal(s.offers.length,1);
});
