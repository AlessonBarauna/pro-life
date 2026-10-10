const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");

function career(seed=31701,clubId="c0",mode="player"){
  const s=D.create({world:"brazil2026",mode,name:"Stage 31.7B",age:22,pos:"ATA",clubId:"c0"},seed);
  if(mode==="player"&&s.clubId!==clubId)D.movePlayerToClub(s,clubId);
  s.careerTransferAvailableDay=99999;s.offers=[];
  if(mode==="player")D.Career.init(s).playerCareer.interests=[];
  return s;
}
function assertTable(rows){
  for(const row of rows){
    assert.equal(row.played,row.wins+row.draws+row.losses,`${row.clubName}: J=V+E+D`);
    assert.equal(row.goalDifference,row.goalsFor-row.goalsAgainst,`${row.clubName}: SG=GP-GC`);
    assert.equal(row.points,row.wins*3+row.draws,`${row.clubName}: P=3V+E`);
  }
}

test("31.7B: catálogo expõe somente competições cadastradas, sem duplicidades",()=>{
  const s=career(),rows=D.seasonCompetitionCatalog(s);
  assert.equal(rows.filter(x=>x.country==="Brasil"&&x.type==="league").length,4);
  assert.equal(rows.filter(x=>x.type==="state").length,20);
  assert.equal(rows.filter(x=>x.id==="copaBrasil").length,1);
  assert.equal(rows.filter(x=>x.type==="world-league").length,34);
  assert.ok(rows.some(x=>x.type.startsWith("national-")),"inclui competições de Seleção existentes");
  assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
  assert.equal(new Set(rows.map(x=>`${x.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}:${x.season}`)).size,rows.length);
  for(const row of rows)for(const key of ["id","name","country","type","format","season","available","status"])assert.ok(Object.hasOwn(row,key),`${row.id}.${key}`);
  const national=rows.find(x=>x.type==="national-tournament"),overview=D.seasonCompetitionOverview(s,national.id);
  assert.ok(overview.fixtures.length>0&&overview.rounds.length>0&&overview.standings.length>0);
});

test("31.7B: classificação brasileira preserva invariantes oficiais",()=>{
  const s=career(31702);D.advanceToDay(s,70);
  const data=D.seasonCompetitionOverview(s,"serieA");
  assert.equal(data.competition.id,"serieA");assert.equal(data.standings.length,20);
  assert.equal(data.fixtures.length,380);assert.equal(data.rounds.length,38);
  assertTable(data.standings);
  assert.ok(data.recentResults.length>0&&data.nextFixtures.length>0);
});

test("31.7B: liga mundial reutiliza standings, results e calendar oficiais",()=>{
  const s=career(31703);D.advanceToDay(s,25);
  const id="gf_la_liga",data=D.seasonCompetitionOverview(s,id);
  const standings=D.WorldClubCompetitions.standings(s,id),results=D.WorldClubCompetitions.results(s,id),calendar=D.WorldClubCompetitions.calendar(s,id);
  assert.equal(data.fixtures.length,calendar.reduce((n,r)=>n+r.pairs.length,0));
  assert.equal(data.recentResults.length,Math.min(12,results.length));
  assert.deepEqual(data.standings.map(x=>x.clubId),standings.map(x=>x.id));
  assertTable(data.standings);
});

test("31.7B: copas e estaduais mantêm fases eliminatórias sem tabela fictícia",()=>{
  const s=career(31704),cup=D.seasonCompetitionOverview(s,"copaBrasil");
  assert.deepEqual(cup.standings,[]);assert.ok(cup.rounds.length>0);assert.ok(cup.fixtures.length>0);
  const state=D.seasonCompetitionCatalog(s).find(x=>x.type==="state");
  const data=D.seasonCompetitionOverview(s,state.id);
  assert.ok(data.rounds.every(r=>r.name&&Array.isArray(r.fixtures)));
  assert.ok(data.fixtures.every(f=>Object.hasOwn(f,"qualifiedId")&&Object.hasOwn(f,"aggregate")));
});

test("31.7B: calendário é somente leitura, deduplicado e filtrável",()=>{
  const s=career(31705);s.life.events.push({season:s.season,day:12,choice:"family"});
  s.commercial.events.push({id:"stage317b",day:13,brand:"Marca Teste",type:"campanha",status:"AGENDADO"});
  D.Career.init(s).communications.messages.push({id:"stage317b",day:14,subject:"Compromisso registrado"});
  s.offers.push({clubId:"c1",salary:10000,role:"Rotação",durationDays:730,expires:15});
  const before=JSON.stringify(s),rng=s.rng;
  const events=D.seasonCalendarEvents(s,s.day,s.day+365);
  assert.equal(JSON.stringify(s),before);assert.equal(s.rng,rng);
  assert.equal(new Set(events.map(x=>x.id)).size,events.length);
  assert.ok(events.some(x=>x.category==="match"&&x.competitionId==="serieA"));
  for(const category of ["personal","commercial","career","market"])assert.ok(events.some(x=>x.category===category),category);
  const filtered=D.seasonCalendarEvents(s,s.day,s.day+365,{competitionId:"serieA"});
  assert.ok(filtered.length>0&&filtered.every(x=>x.competitionId==="serieA"));
});

test("31.7B: avanço por data chega ao alvo exato no Brasil e no exterior",()=>{
  const local=career(31706),international=career(31707,"gf_real_madrid");
  const a=D.advanceToDay(local,local.day+18),b=D.advanceToDay(international,international.day+18);
  for(const [s,r] of [[local,a],[international,b]]){assert.equal(r.completed,true);assert.equal(r.paused,false);assert.equal(s.day,r.requestedDay);assert.equal(r.pendingTargetDay,null);}
  assert.ok(international.matches.some(m=>[m.home,m.away].includes("gf_real_madrid")),"o calendário internacional foi processado");
});

test("31.7B: proposta e renovação pausam sem decisão automática; rumor não pausa",()=>{
  const offer=career(31708);offer.careerTransferAvailableDay=0;offer.offers=[{clubId:"c1",salary:20000,role:"Titular",durationDays:730,expires:offer.day+20,transferType:"permanent"}];
  const ro=D.advanceToDay(offer,offer.day+10);assert.equal(ro.pauseReason.type,"offer");assert.equal(ro.daysAdvanced,0);assert.equal(offer.offers.length,1);
  const renewal=career(31709),pc=D.Career.init(renewal).playerCareer;pc.renewalOffer={clubId:renewal.clubId,salary:18000,durationDays:730,signingBonus:0,expires:renewal.day+20};
  const rr=D.advanceToDay(renewal,renewal.day+10);assert.equal(rr.pauseReason.type,"renewal");assert.ok(pc.renewalOffer);
  const rumor=career(31710),rpc=D.Career.init(rumor).playerCareer;rpc.interests=[{clubId:"c2",stage:"Rumor",startedDay:0,expires:200}];
  assert.equal(D.advanceToDay(rumor,rumor.day+10).completed,true);
});

test("31.7B: plano pendente sobrevive ao save e retoma sem repetir dias",()=>{
  const s=career(31711),target=s.day+24;s.careerTransferAvailableDay=0;
  s.offers=[{clubId:"c1",salary:20000,role:"Titular",durationDays:730,expires:s.day+20,transferType:"permanent"}];
  const paused=D.advanceToDay(s,target);assert.equal(paused.pendingTargetDay,target);
  const loaded=Save.parse(JSON.stringify(s));assert.equal(loaded.advanceToDayPlan.targetDay,target);
  D.Career.rejectOffer(loaded,"c1");loaded.careerTransferAvailableDay=99999;
  const resumed=D.advanceToDay(loaded,target);
  assert.equal(resumed.completed,true);assert.equal(loaded.day,target);assert.equal(resumed.daysAdvanced,target-paused.reachedDay);
  const matches=loaded.matches||[],keys=matches.map(m=>`${m.competitionId||m.leagueId}:${m.date}:${m.home}:${m.away}`);
  assert.equal(new Set(keys).size,keys.length,"partidas não foram repetidas");
});

test("31.7B: opção de partida pausa no dia anterior e pode continuar",()=>{
  const s=career(31712),next=D.nextCommitment(s);assert.ok(next&&next.date>s.day);
  const target=next.date+3,paused=D.advanceToDay(s,target,{simulateMatches:false});
  assert.equal(paused.pauseReason.type,"match");assert.equal(s.day,next.date-1);assert.equal(paused.pendingTargetDay,target);
  const resumed=D.advanceToDay(s,target,{simulateMatches:true});assert.equal(resumed.completed,true);assert.equal(s.day,target);
});

test("31.7B: avanço por data é determinístico e não duplica efeitos",()=>{
  const a=career(31713),b=career(31713),target=35;
  const ra=D.advanceToDay(a,target),rb=D.advanceToDay(b,target);
  assert.deepEqual(ra,rb);assert.equal(a.rng,b.rng);assert.deepEqual(a.matches,b.matches);assert.deepEqual(a.life.events,b.life.events);
  const consequences=a.decisionConsequences||[],keys=consequences.map(x=>`${x.day}:${x.decisionId}:${x.choice}`);
  assert.equal(new Set(keys).size,keys.length);
  assert.throws(()=>D.advanceToDay(a,a.day),/posterior/);
  assert.throws(()=>D.advanceToDay(a,a.day+4000),/limite/);
});
