"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const Save=require("../src/infrastructure/save.js");

function state(seed=2100){
  const s=D.create({mode:"player",clubId:"c0"},seed);
  D.Career.init(s);D.Squad.init(s);
  return s;
}
function managerOf(s,archetype){
  for(let generation=0;generation<600;generation++){
    const manager=D.Squad.createManager(s,{clubId:s.clubId,generation,season:s.season,day:s.day});
    if(manager.archetype===archetype) return manager;
  }
  throw Error("Arquétipo não encontrado: "+archetype);
}
function install(s,archetype){const q=D.Squad.init(s);q.manager=managerOf(s,archetype);q.managerGeneration=q.manager.generation;return q.manager;}
function change(s,overrides={}){return {day:s.day,season:s.season,clubId:s.clubId,club:D.club(s).name,reason:"sequência ruim",...overrides};}

test("21: save antigo migra treinador estável e init é idempotente",()=>{
  const s=state();const q=D.Squad.init(s);delete q.manager;delete q.managerHistory;delete q.managerVersion;
  const rng=s.rng,a=structuredClone(D.Squad.init(s).manager),b=structuredClone(D.Squad.init(s).manager);
  assert.deepEqual(a,b);assert.equal(s.rng,rng);assert.deepEqual(D.Squad.init(s).managerHistory,[]);assert.equal(q.managerVersion,1);
});

test("21: identidade e perfil completo são válidos e bounded",()=>{
  const s=state(2101),m=D.Squad.managerProfile(s);
  assert.match(m.id,/^manager:/);assert.ok(m.name.includes(" "));assert.equal(m.clubId,s.clubId);
  assert.ok(D.Squad.managerArchetypes[m.archetype]);assert.ok(D.Squad.tacticalStyles.includes(m.tacticalStyle));assert.ok(D.Squad.slots[m.preferredFormation]);
  for(const key of ["riskTolerance","youthPreference","starManagement","rotationTendency","discipline","patience","trustVolatility","developmentFocus"]) assert.ok(m[key]>=0&&m[key]<=100,key);
  for(const key of ["overall","form","training","fitness","trust","potential","experience"]) assert.ok(m.selectionWeights[key]>=0&&m.selectionWeights[key]<=100,key);
});

test("21: há dez arquétipos realmente diferentes",()=>{
  const names=Object.keys(D.Squad.managerArchetypes);assert.equal(names.length,10);
  const signatures=new Set(names.map(name=>JSON.stringify(D.Squad.managerArchetypes[name])));
  assert.equal(signatures.size,10);
});

test("21: geração não usa Math.random nem consome RNG global",()=>{
  const src=fs.readFileSync(path.join(__dirname,"../src/domain/squad.js"),"utf8");
  assert.doesNotMatch(src,/Math\.random\s*\(/);
  const s=state(2102),before=s.rng;
  for(let i=0;i<20;i++) D.Squad.createManager(s,{clubId:s.clubId,generation:i,season:s.season,day:s.day});
  assert.equal(s.rng,before);
});

test("21: troca cria nova identidade, incrementa geração, arquiva e preserva RNG",()=>{
  const s=state(2103),q=D.Squad.init(s),old=q.manager,rng=s.rng,generation=q.managerGeneration;
  const result=D.Squad.handleManagerChange(s,change(s));
  assert.ok(result);assert.notEqual(q.manager.id,old.id);assert.equal(q.managerGeneration,generation+1);assert.equal(q.managerHistory[0].id,old.id);assert.equal(s.rng,rng);
});

test("21: mudança duplicada permanece idempotente",()=>{
  const s=state(2104),item=change(s),first=D.Squad.handleManagerChange(s,item),q=D.Squad.init(s),id=q.manager.id,size=q.managerHistory.length;
  assert.ok(first);assert.equal(D.Squad.handleManagerChange(s,item),null);assert.equal(q.manager.id,id);assert.equal(q.managerHistory.length,size);
});

test("21: troca cancela promessa e conversa e registra metadata da confiança",()=>{
  const s=state(2105),pc=D.Career.init(s).playerCareer;pc.coachTrust=60;D.Career.updatePlayerRole(s);
  D.Squad.requestCoachPromise(s,"test");A.execute(s,"startCoachConversation",{});
  D.Squad.handleManagerChange(s,change(s));
  const q=D.Squad.init(s),event=q.trustHistory[0];
  assert.equal(q.activeCoachPromise,null);assert.equal(q.coachPromiseHistory[0].status,"CANCELADA");assert.equal(q.activeCoachConversation,null);assert.equal(q.coachConversations[0].cancelled,true);
  assert.equal(event.source,"manager_change");assert.equal(event.details.managerId,q.manager.id);assert.equal(event.details.managerGeneration,q.manager.generation);assert.equal(event.details.managerArchetype,q.manager.archetype);
});

test("21: histórico é limitado",()=>{
  const s=state(2106),q=D.Squad.init(s);
  for(let i=1;i<=30;i++){s.day=i;D.Squad.handleManagerChange(s,change(s));}
  assert.equal(q.managerHistory.length,24);
});

test("21: save/reload preserva exatamente o treinador",()=>{
  const s=state(2107),before=structuredClone(D.Squad.managerProfile(s));
  const restored=Save.parse(JSON.stringify(s)),after=D.Squad.managerProfile(restored);
  assert.deepEqual(after,before);
});

test("21: transferência troca treinador, clube e guarda o anterior",()=>{
  const s=state(2108),q=D.Squad.init(s),old=q.manager,next=s.clubs.find(c=>c.id!==s.clubId);
  s.careerTransferAvailableDay=0;s.offers=[{clubId:next.id,salary:12000,durationDays:730,signingBonus:0,squadRole:"Titular",transferType:"permanent",expires:s.day+10}];
  D.join(s,next.id,12000);
  assert.equal(q.manager.clubId,next.id);assert.notEqual(q.manager.id,old.id);assert.equal(q.managerHistory[0].id,old.id);
  const persisted=D.Squad.managerProfile(Save.parse(JSON.stringify(s)));assert.equal(persisted.id,q.manager.id);
});

test("21: Desenvolvedor favorece jovem de forma pequena",()=>{
  const s=state(2109),c=D.club(s),p=c.roster.find(x=>x.id!=="hero"&&x.pos===s.person.pos);install(s,"DESENVOLVEDOR");
  const age=p.age;p.age=20;const young=D.Squad.score(s,p);p.age=30;const veteran=D.Squad.score(s,p);p.age=age;
  assert.ok(young>veteran-1);assert.ok(Math.abs(young-veteran)<3);
});

test("21: Meritocrático valoriza treino mais que Conservador",()=>{
  const s=state(2110),q=D.Squad.init(s);install(s,"MERITOCRATICO");q.trainingTrend=4;const meritHigh=D.Squad.score(s,s.person);q.trainingTrend=-4;const meritLow=D.Squad.score(s,s.person);
  install(s,"CONSERVADOR");q.trainingTrend=4;const conservativeHigh=D.Squad.score(s,s.person);q.trainingTrend=-4;const conservativeLow=D.Squad.score(s,s.person);
  assert.ok(meritHigh-meritLow>conservativeHigh-conservativeLow);
});

test("21: Rotacionador aceita promessa antes do Conservador",()=>{
  const s=state(2111),pc=D.Career.init(s).playerCareer;pc.coachTrust=30;D.Career.updatePlayerRole(s);
  install(s,"ROTACIONADOR");const rotation=D.Squad.coachPromisePlan(s);install(s,"CONSERVADOR");const conservative=D.Squad.coachPromisePlan(s);
  assert.ok(rotation.minTrust<conservative.minTrust);
});

test("21: Exigente penaliza mais e Protetor amortece queda",()=>{
  const s=state(2112);install(s,"EXIGENTE");const demanding=D.Squad.adjustTrustDeltaForManager(s,-4,{type:"match"});install(s,"PROTETOR");const protective=D.Squad.adjustTrustDeltaForManager(s,-4,{type:"match"});
  assert.ok(Math.abs(demanding)>Math.abs(protective));assert.ok(demanding<0&&protective<0);
});

test("21: objetivos variam moderadamente sem se tornar impossíveis",()=>{
  const s=state(2113);install(s,"EXIGENTE");const hard=D.Career.matchObjectives(s)[0].target;install(s,"PROTETOR");const moderate=D.Career.matchObjectives(s)[0].target;
  assert.ok(hard>=moderate);assert.ok(hard<=7.3&&moderate>=6.5);
});

test("21: conversa e promessa continuam no sistema Stage19",()=>{
  const s=state(2114),talk=A.execute(s,"startCoachConversation",{});assert.equal(talk.managerId,D.Squad.managerProfile(s).id);
  const answer=A.execute(s,"respondCoachConversation",{choiceId:talk.choices[0].id});assert.equal(answer.answered,true);assert.equal(D.Squad.init(s).trustHistory[0].source,"conversation");
});

test("21: lesionado, suspenso e suspenso por competição nunca são selecionados",()=>{
  for(const field of ["injury","suspension","_competitionSuspended"]){const s=state(2115),hero=s.person;hero.condition=100;hero[field]=field==="_competitionSuspended"?true:2;const selection=D.Squad.choose(s,D.club(s));assert.ok(!selection.starters.includes(hero)&&!selection.bench.includes(hero),field);}
});

test("21: escalação usada na partida é exatamente a decidida por Squad.choose",()=>{
  const s=state(2116),c=D.club(s),opponent=s.clubs.find(x=>x.id!==c.id),expected=D.Squad.choose(s,c).starters.map(p=>p.id);
  D.preparePlayerLineup(s,new D.Random(99),c.id,opponent.id);
  assert.deepEqual(c.lineup,expected);
  assert.equal(D.Career.init(s).playerCareer.matchSelection.role,D.Squad.roleForHero(s,D.Squad.choose(s,c)));
});

test("21: modo treinador não recebe perfil de relação do jogador",()=>{
  const s=D.create({mode:"coach",clubId:"c0"},2117);assert.equal(D.Squad.managerProfile(s),null);assert.equal(D.Squad.handleManagerChange(s,change(s)),null);
});

test("21: validação rejeita manager persistido inválido",()=>{
  const s=state(2118);D.Squad.init(s).manager.preferredFormation="9-9-9";
  assert.throws(()=>Save.parse(JSON.stringify(s)),/inv/i);
});
