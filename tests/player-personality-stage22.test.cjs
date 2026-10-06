"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const Save=require("../src/infrastructure/save.js");
const ExpansionValidator=require("../src/infrastructure/validate-expansion.js");

function state(seed=2200){
  const s=D.create({mode:"player",clubId:"c0"},seed);
  D.Career.init(s);D.Squad.init(s);
  return s;
}
function answerInterview(s,choice,id="stage22-interview"){
  const comm=D.Career.init(s).communications;
  comm.interviews.unshift({id,eventId:id,choices:["team","moment","work"].map(x=>({id:x,label:x})),answered:false});
  return A.execute(s,"respondInterview",{id,choice});
}

test("22: save antigo migra personalidade neutra sem consumir RNG",()=>{
  const s=state();delete s.extras.playerCareer.personality;const rng=s.rng;
  const p=D.Personality.init(s);
  assert.equal(p.version,1);assert.equal(p.dominantProfile,"EQUILIBRADO");assert.equal(s.rng,rng);
  assert.deepEqual(Object.values(p.traits),Array(8).fill(50));assert.deepEqual(Object.values(p.reputation),Array(4).fill(50));
});

test("22: init é idempotente e não existe no modo treinador",()=>{
  const s=state(2201),first=structuredClone(D.Personality.init(s)),rng=s.rng;
  assert.deepEqual(D.Personality.init(s),first);assert.equal(s.rng,rng);
  const coach=D.create({mode:"coach",clubId:"c0"},2201);assert.equal(D.Personality.init(coach),null);
});

test("22: entrevista equipe fortalece coletivo e reputação no vestiário",()=>{
  const s=state(2202),p=D.Personality.init(s);answerInterview(s,"team");
  assert.equal(p.traits.teamOrientation,53);assert.equal(p.traits.humility,52);assert.equal(p.reputation.dressingRoom,52);
});

test("22: entrevista momento fortalece ambição e presença na mídia",()=>{
  const s=state(2203),p=D.Personality.init(s);answerInterview(s,"moment");
  assert.equal(p.traits.ambition,53);assert.equal(p.traits.mediaPresence,52);assert.equal(p.traits.humility,49);
});

test("22: entrevista trabalho fortalece profissionalismo e disciplina",()=>{
  const s=state(2204),p=D.Personality.init(s);answerInterview(s,"work");
  assert.equal(p.traits.professionalism,53);assert.equal(p.traits.discipline,52);assert.equal(p.reputation.coach,52);
});

test("22: entrevista legada humilde e ousada preserva seus efeitos",()=>{
  const humble=state(2205),bold=state(2206);D.Career.interview(humble,"humble");D.Career.interview(bold,"bold");
  assert.ok(D.Personality.init(humble).traits.humility>50);assert.ok(D.Personality.init(bold).traits.ambition>50);
  assert.ok(D.Personality.init(bold).traits.humility<50);
});

test("22: conversa com treinador altera personalidade e mantém confiança Stage19",()=>{
  const s=state(2207),pc=D.Career.init(s).playerCareer,before=pc.coachTrust;
  const talk=A.execute(s,"startCoachConversation",{}),choice=talk.choices.find(x=>x.id==="focus")||talk.choices[0];
  A.execute(s,"respondCoachConversation",{choiceId:choice.id});
  const p=D.Personality.init(s);assert.ok(p.history.some(x=>x.source==="coach_conversation"));assert.notEqual(pc.coachTrust,before);
  assert.ok(D.Squad.init(s).trustHistory.some(x=>x.source==="conversation"));
});

test("22: respostas work e demand da conversa têm efeitos distintos",()=>{
  const work=state(2221),demand=state(2222);
  for(const s of [work,demand]){const pc=D.Career.init(s).playerCareer;pc.coachTrust=20;D.Career.updatePlayerRole(s);}
  let talk=A.execute(work,"startCoachConversation",{});A.execute(work,"respondCoachConversation",{choiceId:talk.choices.find(x=>x.id==="work").id});
  talk=A.execute(demand,"startCoachConversation",{});A.execute(demand,"respondCoachConversation",{choiceId:talk.choices.find(x=>x.id==="demand").id});
  assert.ok(D.Personality.init(work).traits.professionalism>50);assert.ok(D.Personality.init(work).traits.discipline>50);
  assert.ok(D.Personality.init(demand).traits.ambition>50);assert.ok(D.Personality.init(demand).traits.humility<50);assert.ok(D.Personality.init(demand).reputation.coach<50);
});

test("22: evento inesperado familiar registra escolha uma única vez",()=>{
  const s=state(2208),decision=D.UnexpectedEvents.force(s,"family_request",D.Career,D);assert.ok(decision);
  D.UnexpectedEvents.resolve(s,"attend",D.Career,D);const p=D.Personality.init(s),length=p.history.length;
  assert.equal(p.traits.loyalty,53);assert.equal(D.UnexpectedEvents.resolve(s,"attend",D.Career,D).choice,"attend");assert.equal(p.history.length,length);
});

test("22: evento de imprensa repercute na imagem segmentada",()=>{
  const s=state(2209);D.UnexpectedEvents.force(s,"press_misquote",D.Career,D);D.UnexpectedEvents.resolve(s,"clarify",D.Career,D);
  const p=D.Personality.init(s);assert.equal(p.reputation.public,52);assert.equal(p.traits.professionalism,52);
});

test("22: resposta humilde à torcida afeta personalidade e mantém Stage20",()=>{
  const s=state(2223);D.UnexpectedEvents.force(s,"fan_pressure",D.Career,D);const result=D.UnexpectedEvents.resolve(s,"humble_reply",D.Career,D),p=D.Personality.init(s);
  assert.equal(result.status,"RESOLVED");assert.equal(p.traits.humility,53);assert.equal(p.reputation.public,53);assert.ok(D.UnexpectedEvents.recent(s).length);
});

test("22: escolha inválida não altera personalidade",()=>{
  const s=state(2210),before=structuredClone(D.Personality.init(s));
  assert.equal(D.Personality.applyChoice(s,"test","inexistente",{eventId:"invalid"}),null);assert.deepEqual(D.Personality.init(s),before);
  D.UnexpectedEvents.force(s,"family_request",D.Career,D);const again=structuredClone(D.Personality.init(s));
  assert.throws(()=>D.UnexpectedEvents.resolve(s,"inexistente",D.Career,D),/inválida/i);assert.deepEqual(D.Personality.init(s),again);
});

test("22: aplicação é idempotente por evento",()=>{
  const s=state(2211),first=D.Personality.applyChoice(s,"interview","team",{eventId:"same"}),snapshot=structuredClone(D.Personality.init(s));
  const second=D.Personality.applyChoice(s,"interview","team",{eventId:"same"});assert.deepEqual(second,first);assert.deepEqual(D.Personality.init(s),snapshot);
});

test("22: deltas e valores são limitados",()=>{
  const s=state(2212),p=D.Personality.init(s);p.traits.ambition=99;p.reputation.public=1;
  D.Personality.applyChoice(s,"test","custom",{eventId:"bounds",effects:{traits:{ambition:999,humility:-999},reputation:{public:-999,coach:999}}});
  assert.equal(p.traits.ambition,100);assert.equal(p.traits.humility,45);assert.equal(p.reputation.public,0);assert.equal(p.reputation.coach,55);
});

test("22: histórico é limitado a cem entradas",()=>{
  const s=state(2213),p=D.Personality.init(s);
  for(let i=0;i<120;i++) D.Personality.applyChoice(s,"test","custom",{eventId:"h"+i,effects:{traits:{ambition:i%2?1:-1},reputation:{}}});
  assert.equal(p.history.length,100);assert.equal(p.history[0].eventId,"h119");
});

test("22: perfis dominantes são derivados dos atributos",()=>{
  const s=state(2214),p=D.Personality.init(s);
  p.traits.leadership=80;p.traits.teamOrientation=80;assert.equal(D.Personality.deriveProfile(p),"LÍDER");
  Object.assign(p.traits,{leadership:50,teamOrientation:50,professionalism:80,discipline:75});assert.equal(D.Personality.deriveProfile(p),"PROFISSIONAL");
  Object.assign(p.traits,{professionalism:50,discipline:50,ambition:80,humility:35});assert.equal(D.Personality.deriveProfile(p),"AMBICIOSO");
  Object.assign(p.traits,{ambition:50,humility:80});assert.equal(D.Personality.deriveProfile(p),"HUMILDE");
});

test("22: perfil controverso reutiliza o contador de controvérsias",()=>{
  const s=state(2224),p=D.Personality.init(s),media=D.Career.mediaProfile(s);p.traits.mediaPresence=80;media.controversies=3;
  assert.equal(D.Personality.deriveProfile(p,media),"CONTROVERSO");
  D.Career.interview(s,"bold");assert.ok(media.controversies>=4);assert.equal(D.Personality.init(s).dominantProfile,"CONTROVERSO");
});

test("22: reputação global continua sendo a fonte canônica antiga",()=>{
  const s=state(2215),global=s.reputation;D.Personality.applyChoice(s,"interview","team",{eventId:"canonical"});
  assert.equal(s.reputation,global);assert.equal(D.Personality.init(s).reputation.public,52);
});

test("22: valor de mercado depende da reputação global, não dos segmentos",()=>{
  const s=state(2225),base=D.Career.marketValue(s),p=D.Personality.init(s);for(const key of D.Personality.reputationKeys)p.reputation[key]=100;
  assert.equal(D.Career.marketValue(s),base);s.reputation=100;assert.ok(D.Career.marketValue(s)>=base);
});

test("22: mediaProfile permanece operacional e separado",()=>{
  const s=state(2226),p=structuredClone(D.Personality.init(s));D.Career.updateMediaProfile(s,{fans:4,pressure:3,sponsor:2,controversy:1});
  const media=D.Career.mediaProfile(s);assert.equal(media.controversies,1);assert.equal(media.pressure,23);assert.deepEqual(D.Personality.init(s).traits,p.traits);
});

test("22: modificadores de mercado, comercial e treinador são pequenos",()=>{
  const s=state(2216),p=D.Personality.init(s);Object.values(p.traits);for(const key of D.Personality.traitKeys)p.traits[key]=100;for(const key of D.Personality.reputationKeys)p.reputation[key]=100;
  assert.ok(Math.abs(D.Personality.marketModifier(s))<=4);assert.ok(Math.abs(D.Personality.commercialModifier(s))<=5);assert.ok(Math.abs(D.Personality.coachModifier(s))<=2);
  const brand=D.Commercial.brands[0],withPersonality=D.Commercial.scoreBrand(s,brand,D);for(const key of D.Personality.traitKeys)p.traits[key]=50;for(const key of D.Personality.reputationKeys)p.reputation[key]=50;
  const neutral=D.Commercial.scoreBrand(s,brand,D);assert.ok(Math.abs(withPersonality-neutral)<=5.01);
});

test("22: avaliação de interesse expõe bônus sem substituir reputação esportiva",()=>{
  const s=state(2217),club=s.clubs.find(x=>x.id!==s.clubId),p=D.Personality.init(s);p.traits.professionalism=100;p.traits.ambition=100;p.reputation.public=100;
  const rep=s.reputation,result=D.Career.interestAssessment(s,club.id);assert.ok(Math.abs(result.personalityModifier)<=4);assert.equal(s.reputation,rep);assert.ok(Number.isFinite(result.sportingReputation));
});

test("22: vestiário só ajusta levemente pesos de eventos",()=>{
  const s=state(2227),p=D.Personality.init(s);p.reputation.dressingRoom=100;
  assert.equal(D.Personality.unexpectedEventWeight(s,"teammate_support"),1.1);assert.equal(D.Personality.unexpectedEventWeight(s,"training_conflict"),.9);
  assert.equal(D.Personality.unexpectedEventWeight(s,"family_request"),1);
});

test("22: agente usa personalidade só como recomendação narrativa",()=>{
  const s=state(2228),p=D.Personality.init(s),strategy=structuredClone(D.Career.init(s).playerCareer.agentStrategy);p.traits.ambition=80;
  const advice=D.Career.agentAdvice(s);assert.match(advice.reason,/ambicioso/i);assert.deepEqual(D.Career.init(s).playerCareer.agentStrategy,strategy);
});

test("22: save e reabertura preservam personalidade exatamente",()=>{
  const s=state(2218);answerInterview(s,"team");D.Personality.applyChoice(s,"test","custom",{eventId:"persist",effects:{traits:{leadership:4},reputation:{commercial:3}}});
  const before=structuredClone(D.Personality.init(s)),restored=Save.parse(JSON.stringify(s));assert.deepEqual(D.Personality.init(restored),before);
});

test("22: personalidade não altera RNG global e não usa Math.random",()=>{
  const source=fs.readFileSync(path.join(__dirname,"../src/domain/player-personality.js"),"utf8"),s=state(2219),rng=s.rng;
  D.Personality.applyChoice(s,"interview","team",{eventId:"rng"});D.Personality.marketModifier(s);D.Personality.commercialModifier(s);
  assert.equal(s.rng,rng);assert.doesNotMatch(source,/Math\.random\s*\(/);
});

test("22: Stage21 e validação de saves continuam ativas",()=>{
  const s=state(2220);assert.ok(D.Squad.managerProfile(s));D.Personality.init(s).traits.loyalty=101;
  assert.throws(()=>ExpansionValidator.validate(s,()=>{throw Error("inválido");}),/inválido/i);
});

test("22: snapshot legado e save geral antigo continuam carregando",()=>{
  const s=state(2229),snapshot=D.Career.legacySnapshot(s),old=structuredClone(s);delete old.extras.playerCareer.personality;
  assert.ok(Number.isFinite(snapshot.score));const restored=Save.parse(JSON.stringify(old));assert.equal(D.Personality.init(restored).dominantProfile,"EQUILIBRADO");
});
