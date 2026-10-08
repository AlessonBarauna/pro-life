"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),WC=require("../src/domain/world-cup.js"),Save=require("../src/infrastructure/save.js"),Squads2026=require("../src/domain/world-cup-squads-2026.js");

function state(seed=2550){return D.create({mode:"player",clubId:"c0"},seed);}
function createOfficialCup(s,year=2030){
  s.day=(year-2026)*365+154;s.season=year;
  const n=D.NationalTeam.init(s),t=n.tournaments.find(cup=>cup.type==="WORLD_CUP"&&cup.year===year)||WC.createTournament(year);
  if(!n.tournaments.includes(t))n.tournaments.push(t);
  D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});
  return {n,t};
}
function allPlayers(t){return t.squads.flatMap(team=>team.squad);}
function average(team){return team.squad.reduce((sum,p)=>sum+p.overall,0)/team.squad.length;}
function placeholder(player){return player.club==="Universo internacional"||/ (GOL|DEF|MEI|ATA) \d+$/i.test(player.name);}

test("25F: elencos 2030 são naturais, completos, únicos e persistentes",()=>{
  const s=state(),{t}=createOfficialCup(s),players=allPlayers(t);
  assert.equal(t.squads.length,48);
  assert.ok(t.squads.every(team=>team.squad.length===26));
  assert.ok(t.squads.every(team=>new Set(team.squad.map(player=>player.id)).size===26));
  assert.ok(t.squads.every(team=>new Set(team.squad.map(player=>player.name)).size===26));
  assert.ok(players.every(player=>!placeholder(player)));
  assert.ok(players.every(player=>player.club!=="Universo internacional"));
  const generated=s.internationalPlayers.filter(player=>player.generatedInternational);
  assert.ok(generated.length>0);
  assert.ok(generated.every(player=>player.id&&player.name&&player.nationality&&player.externalClub&&Number.isFinite(player.potential)));
  const ids=t.squads.map(team=>[team.id,team.squad.map(player=>player.id)]);
  D.NationalTeam.ensureWorldCupOfficialSquads(s,s.nationalTeam,D,()=>{});
  assert.deepEqual(t.squads.map(team=>[team.id,team.squad.map(player=>player.id)]),ids);
  const restored=Save.parse(JSON.stringify(s)),rt=restored.nationalTeam.tournaments.find(cup=>cup.year===2030);
  assert.deepEqual(rt.squads.map(team=>[team.id,team.squad.map(player=>player.id)]),ids);
  assert.ok(restored.internationalPlayers.some(player=>player.generatedInternational));
});

test("25F: GER tem dispersão e força acompanha a reputação da seleção",()=>{
  const s=state(2551),{t}=createOfficialCup(s),ordered=t.squads.slice().sort((a,b)=>b.reputation-a.reputation),strong=ordered[0],weak=ordered.at(-1);
  const ratings=strong.squad.map(player=>player.overall);
  assert.ok(new Set(ratings).size>=6);
  assert.ok(Math.max(...ratings)-Math.min(...ratings)>=8);
  assert.ok(average(strong)>average(weak)+10);
});

test("25F: Copa seguinte reutiliza internacionais elegíveis e atualiza idade",()=>{
  const s=state(2552),{n,t}=createOfficialCup(s),france2030=t.squads.find(team=>team.id==="FRA").squad;
  const ages=new Map(france2030.map(player=>[player.id,player.age])),next=WC.createTournament(2034);
  n.tournaments.push(next);s.day=8*365+154;s.season=2034;
  D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});
  const france2034=next.squads.find(team=>team.id==="FRA").squad,shared=france2034.filter(player=>ages.has(player.id));
  assert.ok(shared.length>=20);
  assert.ok(shared.every(player=>player.age===ages.get(player.id)+4));
});

test("25F: Brasil mantém o hero por mérito no elenco congelado",()=>{
  const s=state(2553);for(const key of Object.keys(s.person.attrs))s.person.attrs[key]=100;s.reputation=100;
  const {n,t}=createOfficialCup(s),brazil=t.squads.find(team=>team.id==="BRA");
  assert.ok(brazil.squad.some(player=>player.id==="hero"));
  assert.equal(t.brazilCallup.calledUp,true);assert.equal(n.calledUp,true);
});

test("25F: migração troca só placeholders sem alterar resultados da Copa",()=>{
  const s=state(2554),{n,t}=createOfficialCup(s),france=t.squads.find(team=>team.id==="FRA"),beforeIds=france.squad.map(player=>player.id);
  for(let i=0;i<4;i++)france.squad[i]={id:`wc_2030_FRA_${france.squad[i].pos}_${i}`,name:`Franca ${france.squad[i].pos} ${i+1}`,pos:france.squad[i].pos,club:"Universo internacional",age:25,overall:france.squad[i].overall,score:france.squad[i].overall,source:"generated"};
  const match=t.groups[0].matches[0];Object.assign(match,{played:true,hg:2,ag:1,winnerId:match.homeId});
  const competitionBefore=JSON.stringify({groups:t.groups,knockout:t.knockout,status:t.status,champion:t.champion});
  D.NationalTeam.ensureWorldCupOfficialSquads(s,n,D,()=>{});
  assert.ok(france.squad.every(player=>!placeholder(player)));
  assert.ok(france.squad.every(player=>player.club!=="Universo internacional"));
  assert.equal(france.squad.length,26);assert.equal(new Set(france.squad.map(player=>player.id)).size,26);
  assert.deepEqual(france.squad.slice(4).map(player=>player.id),beforeIds.slice(4));
  assert.equal(JSON.stringify({groups:t.groups,knockout:t.knockout,status:t.status,champion:t.champion}),competitionBefore);
  assert.equal(t.squadMigrationVersion,2);
});

test("25F: baseline de 2026 permanece disponível antes da convocação oficial",()=>{
  const s=state(2555),summary=D.NationalTeam.worldCupSummary(s,D.NationalTeam.init(s));
  assert.equal(summary.year,2026);assert.equal(summary.worldCupSquads.length,48);
  assert.equal(summary.worldCupSquads.find(team=>team.id==="FRA").squad[0].id,Squads2026.squad("FRA")[0].id);
});
