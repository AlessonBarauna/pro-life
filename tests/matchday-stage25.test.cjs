"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),Save=require("../src/infrastructure/save.js");

function state(seed=2501){const s=D.create({mode:"player",clubId:"c0"},seed);D.Career.init(s);D.Squad.init(s);return s;}
function maxHero(s){for(const key of Object.keys(s.person.attrs))s.person.attrs[key]=95;s.person.condition=100;s.person.morale=90;s.reputation=90;}

test("25D: importância é moderada para clássico, mata-mata, semifinal, final e Seleção",()=>{
  const s=state(),sameCity=s.clubs.find(c=>c.id!==s.clubId&&c.city===D.club(s).city);
  assert.equal(D.matchImportance(s,{}).factor,1);
  assert.equal(D.matchImportance(s,{stage:"Quartas de final"}).factor,1.1);
  assert.equal(D.matchImportance(s,{stage:"Semifinal"}).factor,1.15);
  assert.equal(D.matchImportance(s,{stage:"Final"}).factor,1.22);
  assert.equal(D.matchImportance(s,{competition:"Copa do Mundo",stage:"Final"},{national:true}).factor,1.22);
  assert.equal(D.matchImportance(s,{competitionId:"nationalTeam"}).factor,1.1);
  if(sameCity) assert.equal(D.matchImportance(s,{home:s.clubId,away:sameCity.id}).factor,1.08);
});

test("25B: plano do banco considera contexto e limita entrada entre 60 e 75",()=>{
  const s=state(),pc=D.Career.init(s).playerCareer,q=D.Squad.init(s);
  pc.coachTrust=78;s.person.condition=92;s.person.morale=84;q.trainingTrend=3;
  const losing=D.Squad.substitutePlan(s,s.person,{ownGoals:0,opponentGoals:1});
  const winning=D.Squad.substitutePlan(s,s.person,{ownGoals:2,opponentGoals:0});
  assert.ok(losing.minute>=60&&losing.minute<=75);
  assert.ok(losing.chance>winning.chance);
});

test("25B: reserva relacionado pode entrar, jogador fora da relação não entra",()=>{
  const base=state(2502),club=D.club(base),opponentId=base.fixtures[0].find(x=>x.includes(base.clubId)).find(x=>x!==base.clubId);
  base.person.condition=100;base.person.morale=95;D.Career.init(base).playerCareer.coachTrust=85;
  club.lineup=club.roster.filter(p=>p.id!=="hero").slice(0,11).map(p=>p.id);
  D.Career.init(base).playerCareer.matchSelection={day:base.day,role:"Banco",bench:["hero"]};
  let entry=null;
  for(let seed=1;seed<=120&&!entry;seed++){
    const s=structuredClone(base),m=D.simulate(D.club(s),D.club(s,opponentId),new D.Random(seed),s);
    if(m.playerStats?.hero?.starter===false)entry=m.playerStats.hero.entryMinute;
  }
  assert.ok(entry>=60&&entry<=75);
  const outside=structuredClone(base);D.Career.init(outside).playerCareer.matchSelection={day:outside.day,role:"Fora da relação",bench:[]};
  for(let seed=1;seed<=15;seed++){
    const s=structuredClone(outside),m=D.simulate(D.club(s),D.club(s,opponentId),new D.Random(seed),s);
    assert.equal(m.participation?.hero,undefined);
  }
});

test("25A/25C: jogo da Seleção produz live match e relatório completo persistente",()=>{
  const s=state(2503);maxHero(s);const n=D.NationalTeam.init(s);n.calledUp=true;n.status="Titular";
  const fixture={id:"stage25-national",day:s.day,opponent:"Argentina",competition:"Eliminatórias",stage:"Rodada 5",played:false};
  const before={caps:n.caps,starts:n.starts,goals:n.goals,assists:n.assists,minutes:n.minutes};
  const live=D.NationalTeam.play(s,new D.Random(77),D,()=>{},fixture),report=D.Career.init(s).playerCareer.lastMatchReport;
  assert.equal(live.national,true);assert.equal(live.date,s.day);assert.equal(fixture.played,true);assert.equal(n.lastMatchday,live);
  assert.equal(n.caps,before.caps+1);assert.equal(n.starts,before.starts+1);assert.ok(n.minutes>before.minutes);
  assert.equal(n.goals,before.goals+report.goals);assert.equal(n.assists,before.assists+report.assists);
  assert.equal(n.matches[0].rating,report.rating);assert.equal(report.national,true);assert.ok(report.xp>0);
  assert.ok(Array.isArray(report.attributeChanges));assert.equal(report.importance.factor,1.1);assert.match(report.nationalImpact,/\+1 jogo/);
  const restored=Save.parse(JSON.stringify(s));
  assert.deepEqual(restored.nationalTeam.lastMatchday,s.nationalTeam.lastMatchday);
  assert.deepEqual(D.Career.init(restored).playerCareer.lastMatchReport,report);
});

test("25B: reserva da Seleção só entra entre 60 e 75 minutos",()=>{
  const base=state(2504);maxHero(base);const n=D.NationalTeam.init(base);n.calledUp=true;n.status="Reserva";
  let report=null;
  for(let seed=1;seed<=80&&!report;seed++){
    const s=structuredClone(base);D.NationalTeam.play(s,new D.Random(seed),D,()=>{});
    const candidate=D.Career.init(s).playerCareer.lastMatchReport;
    if(candidate?.status==="ENTROU_DO_BANCO")report=candidate;
  }
  assert.ok(report);assert.ok(report.entryMinute>=60&&report.entryMinute<=75);assert.equal(report.minutes,94-report.entryMinute);
});

test("25D: importância aumenta XP sem ultrapassar o teto de 25%",()=>{
  const normal=state(2505),important=structuredClone(normal);
  const match=(factor)=>({season:normal.season,date:normal.day,competitionId:"stage25",home:"c0",away:"c1",participants:[["hero"],[]],playerStats:{hero:{minutes:90}},ratings:{hero:7.5},events:[],hg:1,ag:0,importance:{factor}});
  const a=D.Training.matchDevelopment(normal,match(1),{overall:D.overall,clamp:D.clamp});
  const b=D.Training.matchDevelopment(important,match(1.25),{overall:D.overall,clamp:D.clamp});
  assert.ok(b.xp>a.xp);assert.ok(b.xp<=a.xp*1.25+0.001);
});
