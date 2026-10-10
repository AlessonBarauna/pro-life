const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),Save=require("../src/infrastructure/save.js");

function player(seed=31530,personality="balanced"){
  const s=D.create({world:"brazil2026",mode:"player",name:"Teste",age:22,pos:"ATA",creation:{personality}},seed);
  D.movePlayerToClub(s,"c0");
  s.creation ||= {}; s.creation.personality=personality;
  s.careerTransferAvailableDay=99999;s.offers=[];
  const pc=D.Career.init(s).playerCareer;
  pc.interests=[];
  return s;
}
function decision(s,id="family",choices=[["visit","Visitar a família"],["work","Priorizar o trabalho"]]){
  s.decision={id,title:`Decisão ${id}`,body:"Contexto de teste",choices,createdDay:s.day,deadline:s.day+7};
}
function effectCount(s,id){return (s.decisionConsequences||[]).filter(x=>x.decisionId===id).length;}

test("31.5.3: avanço de +1 dia preserva decisão manual",()=>{
  const s=player();decision(s);D.advance(s,1);
  assert.equal(s.decision.id,"family");assert.equal(effectCount(s,"family"),0);
});

test("31.5.3: +30 dias resolve decisão cotidiana e aplica efeitos reais",()=>{
  const s=player(31531,"professional"),before=s.trainingProgress;decision(s);
  const r=D.simulateAdvance(s,"30days");
  assert.equal(r.completed,true);assert.equal(s.decision,null);assert.equal(effectCount(s,"family"),1);
  assert.ok(s.trainingProgress>before,"a escolha profissional usa o handler real de trabalho");
  assert.ok(s.news.some(x=>x.title==="Decisão automática"));
});

test("31.5.3: fim da temporada usa as mesmas decisões automáticas",()=>{
  const s=player(31532,"leader");s.day=360;decision(s,"community",[["support","Participar"],["skip","Não participar"]]);
  const fans=s.fans,r=D.simulateAdvance(s,"season");
  assert.equal(r.completed,true);assert.equal(s.decision,null);assert.ok(s.fans>fans);assert.equal(effectCount(s,"community"),1);
});

test("31.5.3: personalidades diferentes escolhem opções coerentes e determinísticas",()=>{
  const professional=player(31533,"professional"),charismatic=player(31533,"charismatic");
  const choices=[["work","Priorizar o trabalho"],["embrace_social","Aproveitar a exposição"]];
  decision(professional,"identity",choices);decision(charismatic,"identity",choices);
  D.simulateAdvance(professional,"30days");D.simulateAdvance(charismatic,"30days");
  assert.equal(professional.life.events.find(x=>x.day===0)?.choice,"work");
  assert.equal(charismatic.life.events.find(x=>x.day===0)?.choice,"embrace_social");
});

test("31.5.3: propostas de transferência pausam +30 dias e temporada sem decisão automática",()=>{
  for(const mode of ["30days","season"]){
    const s=player(31534+(mode==="season"));if(mode==="season")s.day=360;
    s.careerTransferAvailableDay=0;
    s.offers=[{clubId:"c1",salary:20000,role:"Titular",durationDays:730,expires:s.day+20,transferType:"permanent"}];
    const day=s.day,r=D.simulateAdvance(s,mode);
    assert.equal(r.completed,false);assert.equal(r.stop.type,"offer");assert.equal(r.stop.contractKind,"transfer");assert.equal(s.day,day);assert.equal(s.offers.length,1);
  }
});

test("31.5.3: empréstimo e renovação também exigem intervenção",()=>{
  const loan=player(31536);loan.careerTransferAvailableDay=0;loan.offers=[{clubId:"c1",salary:9000,role:"Rotação",durationDays:180,expires:loan.day+14,transferType:"loan"}];
  assert.equal(D.simulateAdvance(loan,"30days").stop.contractKind,"loan");
  const renewal=player(31537),pc=D.Career.init(renewal).playerCareer;
  pc.renewalOffer={clubId:renewal.clubId,salary:15000,durationDays:730,signingBonus:10000,performanceBonus:1000,role:"Titular",expires:renewal.day+20,round:0};
  assert.equal(D.simulateAdvance(renewal,"season").stop.type,"renewal");assert.ok(pc.renewalOffer);
});

test("31.5.3: rumor não bloqueia a simulação longa",()=>{
  const s=player(31538),pc=D.Career.init(s).playerCareer;
  pc.interests=[{clubId:"c2",stage:"Rumor",startedDay:s.day,expires:s.day+200}];
  const r=D.simulateAdvance(s,"30days");assert.equal(r.completed,true);assert.equal(r.stop,null);
});

test("31.5.3: continuação após resposta preserva o alvo e os dias restantes",()=>{
  const s=player(31539),target=s.day+30;
  s.careerTransferAvailableDay=0;
  s.offers=[{clubId:"c1",salary:20000,role:"Titular",durationDays:730,expires:s.day+20}];
  const paused=D.simulateAdvance(s,"30days");assert.equal(paused.remainingDays,30);
  D.Career.rejectOffer(s,"c1");s.careerTransferAvailableDay=99999;
  const resumed=D.simulateAdvance(s,"30days");
  assert.equal(resumed.completed,true);assert.equal(s.day,target);assert.equal(resumed.startDay,paused.startDay);assert.equal(resumed.days,30);
});

test("31.5.3: plano pausado e decisões automáticas sobrevivem a save/reload sem duplicar",()=>{
  const s=player(31540,"charismatic"),target=s.day+30;
  s.careerTransferAvailableDay=0;
  decision(s,"social",[["embrace_social","Aproveitar"],["quiet_social","Reduzir"]]);
  s.offers=[{clubId:"c1",salary:20000,role:"Titular",durationDays:730,expires:s.day+20}];
  D.simulateAdvance(s,"30days");
  const loaded=Save.parse(JSON.stringify(s));D.Career.rejectOffer(loaded,"c1");loaded.careerTransferAvailableDay=99999;D.simulateAdvance(loaded,"30days");
  assert.equal(loaded.day,target);assert.equal(effectCount(loaded,"social"),1);
  const ids=(D.Career.init(loaded).communications.messages||[]).map(x=>x.eventId).filter(Boolean);
  assert.equal(new Set(ids).size,ids.length);
});

test("31.5.3: mesma seed e contexto produzem a mesma escolha e estado",()=>{
  const a=player(31541,"ambitious"),b=player(31541,"ambitious");
  const choices=[["humble","Equilíbrio"],["bold","Prometer resultados"]];decision(a,"media",choices);decision(b,"media",choices);
  D.simulateAdvance(a,"30days");D.simulateAdvance(b,"30days");
  assert.equal(a.rng,b.rng);assert.deepEqual(a.life.events,b.life.events);assert.deepEqual(a.decisionConsequences,b.decisionConsequences);
});

test("31.5.3: entrevistas são respondidas pelo handler existente",()=>{
  const s=player(31542,"leader"),career=D.Career.init(s),pc=career.playerCareer;
  career.communications.interviews.unshift({id:"stage3153",title:"Pós-jogo",question:"Quem merece o crédito?",choices:[{id:"team",label:"A equipe"},{id:"moment",label:"Meu momento"},{id:"work",label:"Trabalho"}],answered:false});
  D.simulateAdvance(s,"30days");
  const row=career.communications.interviews.find(x=>x.id==="stage3153");assert.equal(row.answered,true);assert.equal(row.response,"team");assert.ok(career.communications.responses.some(x=>x.interviewId==="stage3153"));
});

test("31.5.3: decisões funcionam em clube brasileiro e internacional",()=>{
  const local=player(31543,"balanced"),global=player(31544,"balanced");
  D.movePlayerToClub(global,"gf_real_madrid");
  for(const s of [local,global]){decision(s,"family");const start=s.day,r=D.simulateAdvance(s,"30days");assert.equal(r.completed,true);assert.equal(s.day,start+30);assert.equal(effectCount(s,"family"),1);assert.ok(D.nextCommitment(s)||s.season>2026);}
});
