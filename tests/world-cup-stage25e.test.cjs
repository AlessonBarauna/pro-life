"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const D=require("../src/domain/engine.js"),WC=require("../src/domain/world-cup.js"),Save=require("../src/infrastructure/save.js"),Squads2026=require("../src/domain/world-cup-squads-2026.js");
function state(seed=2510){return D.create({mode:"player",clubId:"c0"},seed);}
function cup(s,year=2026){return D.NationalTeam.init(s).tournaments.find(t=>t.type==="WORLD_CUP"&&t.year===year);}
function playedCount(t){return t.groups.flatMap(g=>g.matches).filter(m=>m.played).length+t.knockout.filter(m=>m.played).length;}
function playBrazilGroups(s,n,t,score=[3,0]){const fixtures=n.schedule.filter(x=>x.tournamentType==="WORLD_CUP"&&x.tournamentYear===t.year&&x.tournamentPhase==="group").sort((a,b)=>a.day-b.day);for(const fixture of fixtures){s.day=fixture.day;D.NationalTeam.init(s);fixture.played=true;fixture.brazil=score[0];fixture.other=score[1];D.NationalTeam.recordWorldCupFixture(s,n,fixture,score[0],score[1],new D.Random(2511));}return fixtures;}

test("25E: outros grupos progridem nas datas corretas sem depender do Brasil",()=>{
  const s=state(),n=D.NationalTeam.init(s),t=cup(s);s.day=161;D.NationalTeam.init(s);
  assert.equal(playedCount(t),23);assert.ok(t.groups.filter(g=>g.matches.some(m=>m.played)).length>1);
  assert.equal(t.groups.flatMap(g=>g.matches).filter(m=>m.round>1&&m.played).length,0);
  assert.equal(n.schedule.filter(x=>x.tournamentType==="WORLD_CUP"&&x.tournamentPhase==="group").length,3);
});

test("25E: fase de grupos fecha com 72 partidas e torneio completo mantém 104",()=>{
  const s=state(2512),n=D.NationalTeam.init(s),t=cup(s);playBrazilGroups(s,n,t,[0,9]);
  assert.equal(t.groups.flatMap(g=>g.matches).filter(m=>m.played).length,72);
  s.day=199;D.NationalTeam.init(s);
  assert.equal(playedCount(t),104);assert.equal(t.status,"COMPLETED");assert.ok(t.champion);
});

test("25E: convocação oficial congela 26 jogadores e pode incluir hero por mérito",()=>{
  const s=state(2513),n=D.NationalTeam.init(s),base=4*365,t=WC.createTournament(2030);
  for(const key of Object.keys(s.person.attrs))s.person.attrs[key]=100;s.reputation=100;s.day=base+154;s.season=2030;n.tournaments.push(t);
  D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});
  assert.equal(t.squads.length,48);assert.ok(t.squads.every(x=>x.squad.length===26));
  const brazil=t.squads.find(x=>x.id==="BRA");assert.ok(brazil.squad.some(x=>x.id==="hero"));assert.equal(n.calledUp,true);assert.equal(n.competition,"Copa Mundial");
  const ids=brazil.squad.map(x=>x.id),baselineFirst=Squads2026.squad("BRA")[0].id;
  assert.equal(ids.includes(baselineFirst),false);
  s.person.condition=20;D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});assert.deepEqual(t.squads.find(x=>x.id==="BRA").squad.map(x=>x.id),ids);
});

test("25E: convocação oficial não força hero sem mérito",()=>{
  const s=state(2516),n=D.NationalTeam.init(s),base=4*365,t=WC.createTournament(2030);
  for(const key of Object.keys(s.person.attrs))s.person.attrs[key]=20;s.reputation=0;s.day=base+154;s.season=2030;n.tournaments.push(t);
  D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});
  assert.equal(t.squads.find(x=>x.id==="BRA").squad.some(x=>x.id==="hero"),false);assert.equal(n.calledUp,false);assert.equal(t.brazilCallup.calledUp,false);
});

test("25E: próximo compromisso prioriza a Copa e escalação usa o squad persistido",()=>{
  const s=state(2514),n=D.NationalTeam.init(s),base=4*365,t=WC.createTournament(2030);
  for(const key of Object.keys(s.person.attrs))s.person.attrs[key]=100;s.reputation=100;s.day=base+160;s.season=2030;n.tournaments.push(t);
  D.NationalTeam.ensureWorldCupGroupSchedule(s,n);D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});
  s.round=0;s.calendarDays[0]=200;
  const next=D.nextCommitment(s);assert.equal(next.national,true);assert.equal(next.competitionName,"Copa Mundial");assert.equal(next.date,base+161);
  const frozen=t.squads.find(x=>x.id==="BRA").squad.map(x=>x.id);n.squad=[{id:"legacy_2026",name:"Legado",pos:"ATA",overall:99,score:99}];
  const lineup=D.NationalTeam.matchLineup(s,D),lineupIds=[...lineup.starters,...lineup.bench].map(x=>x.id);
  assert.equal(lineup.starters.length,11);assert.ok(lineupIds.every(id=>frozen.includes(id)));assert.equal(lineupIds.includes("legacy_2026"),false);
});

test("25E: reload recupera Copa em andamento sem duplicar resultados",()=>{
  const s=state(2515);s.day=167;const n=D.NationalTeam.init(s),t=cup(s),before=playedCount(t);assert.equal(before,46);
  const restored=Save.parse(JSON.stringify(s));const rt=cup(restored),after=playedCount(rt);D.NationalTeam.init(restored);
  assert.equal(after,before);assert.equal(playedCount(rt),before);assert.equal(new Set(rt.groups.flatMap(g=>g.matches).filter(m=>m.played).map(m=>m.id)).size,before);
});

test("25E UI: live match da Seleção continua conectado ao próximo compromisso",()=>{
  const source=fs.readFileSync(path.resolve(__dirname,"../src/ui/app.js"),"utf8");
  assert.match(source,/next\.national/);assert.match(source,/D\.NationalTeam\.init\(state\)\.lastMatchday/);assert.doesNotMatch(source,/Acompanhamento ao vivo da Seleção será integrado/);
});
