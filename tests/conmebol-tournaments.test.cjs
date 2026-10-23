const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");

const make=(seed=1901,mode="player")=>D.create({mode,clubId:"c0",catalogVersion:"fc27_v1"},seed);
const score=m=>({hg:1+(m.id.length%3),ag:m.id.length%2});
const hooks={otherFixture:score,heroFixture:score};

test("Libertadores e Sul-Americana nascem com 32 clubes, 8 grupos e 96 jogos sem choque diário",()=>{
  const s=make(),M=D.ConmebolTournaments;
  for(const comp of ["lib","sud"]){
    const ed=D.Continental.edition(s,comp);
    const participants=ed.tournamentEntrants||ed.entrants.concat(ed.supplementalEntrants||[]);
    assert.ok(["ready","adapted"].includes(ed.status));
    assert.equal(participants.length,32);
    assert.equal(new Set(participants.map(x=>x[0])).size,32);
    assert.equal(ed.groups.length,8);
    assert.ok(ed.groups.every(g=>g.clubIds.length===4));
    assert.equal(ed.leagueSchedule.matches.length,96);
    for(const [id] of participants)assert.equal(ed.leagueSchedule.matches.filter(m=>[m.homeId,m.awayId].includes(id)).length,6);
    const base=(s.season-2026)*365;
    for(const match of ed.leagueSchedule.matches){
      for(const id of [match.homeId,match.awayId])if(s.clubs.some(c=>c.id===id)){
        const domestic=new Set((s.fixtures||[]).flatMap((round,i)=>round.some(pair=>pair.includes(id))?[base+Number(s.calendarDays?.[i]??7+i*21)]:[]));
        assert.equal(domestic.has(match.day),false,`${comp}:${id} tem jogo local e continental no dia ${match.day}`);
      }
    }
    assert.deepEqual(M.audit(s,D.WorldClubCompetitions,ed),{ok:true,issues:[],matches:96});
  }
  const loaded=JSON.parse(JSON.stringify(s));
  for(const comp of ["lib","sud"]){const ed=D.Continental.edition(loaded,comp);assert.equal(ed.leagueSchedule.matches,undefined);assert.equal(M.hydrate(ed).matches.length,96);}
});

test("fase de grupos, playoffs da Sul-Americana e mata-mata avançam até campeões persistentes",()=>{
  const s=make(1902),M=D.ConmebolTournaments,C=D.Continental,W=D.WorldClubCompetitions;
  s.day=400;
  for(let i=0;i<7;i++){M.daily(s,C,W,"lib",hooks);M.daily(s,C,W,"sud",hooks);}
  const lib=C.edition(s,"lib"),sud=C.edition(s,"sud");
  for(const ed of [lib,sud]){
    assert.equal(ed.leagueSchedule.matches.filter(m=>m.played).length,96);
    for(const group of ed.groups){
      const rows=M.standings(ed,group.id);
      assert.equal(rows.length,4);
      assert.equal(rows.reduce((n,r)=>n+r.played,0),24);
      assert.ok(rows.every(r=>r.played===6));
    }
    assert.equal(ed.status,"completed");
    assert.ok(ed.knockout.championId);
    assert.equal(ed.championId,ed.knockout.championId);
  }
  assert.deepEqual(lib.knockout.stages.map(x=>x.key),["round16","quarters","semis","final"]);
  assert.deepEqual(sud.knockout.stages.map(x=>x.key),["playoffs","round16","quarters","semis","final"]);
  const before=JSON.stringify({lib:lib.knockout,sud:sud.knockout});
  M.daily(s,C,W,"lib",hooks);M.daily(s,C,W,"sud",hooks);
  assert.equal(JSON.stringify({lib:lib.knockout,sud:sud.knockout}),before);
  const loaded=JSON.parse(JSON.stringify(s));
  assert.equal(C.edition(loaded,"lib").championId,lib.championId);
  assert.equal(C.edition(loaded,"sud").championId,sud.championId);
});

test("partida do clube local usa o registro oficial sem alterar a tabela da liga nacional",()=>{
  const s=make(1903,"coach"),ed=D.Continental.edition(s,"lib");
  const localId=ed.entrants.map(x=>x[0]).find(id=>s.clubs.some(c=>c.id===id));
  assert.ok(localId);
  s.clubId=localId;
  const local=D.club(s,localId),before={...local.stats};
  const fixture=ed.leagueSchedule.matches.find(m=>[m.homeId,m.awayId].includes(localId));
  s.day=fixture.day-1;
  D.advance(s,1);
  assert.equal(fixture.played,true);
  const logged=s.matches.find(m=>m.competitionId==="lib"&&[m.home,m.away].includes(localId));
  assert.ok(logged);
  assert.equal(logged.competitionName,"CONMEBOL Libertadores");
  assert.deepEqual(local.stats,before);
  const view=D.seasonCompetitionOverview(s,"lib");
  assert.equal(view.competition.type,"continental-tournament");
  assert.ok(view.fixtures.some(m=>m.id===fixture.id&&m.status==="PLAYED"));
  assert.ok(D.seasonCalendarEvents(s,fixture.day,fixture.day,{competitionId:"lib"}).some(x=>x.isHeroEvent));
});

test("treinador confirma uma partida ao vivo da Libertadores uma única vez",()=>{
  const s=make(1906,"coach"),ed=D.Continental.edition(s,"lib");
  const localId=ed.entrants.map(x=>x[0]).find(id=>s.clubs.some(c=>c.id===id));
  assert.ok(localId);
  s.clubId=localId;
  const scheduled=ed.leagueSchedule.matches.find(m=>[m.homeId,m.awayId].includes(localId));
  s.day=scheduled.day-1;
  const fixture={home:scheduled.homeId,away:scheduled.awayId,date:scheduled.day,
    round:scheduled.round,competitionId:"lib",competitionName:"CONMEBOL Libertadores",stage:scheduled.stage};
  const prepared=D.prepareCoachWorldFixture(s,fixture);
  assert.ok(prepared?.home?.roster?.length>=11&&prepared?.away?.roster?.length>=11);
  const controller=D.createCoachLiveController(prepared.home,prepared.away,new D.Random(s.rng),s);
  controller.advanceTo(94);
  assert.equal(D.stageCoachLiveResult(s,fixture,controller),true);
  const expected=[controller.result.hg,controller.result.ag];
  s.matches=Array.from({length:800},(_,i)=>({date:-i-1,home:`old-home-${i}`,away:`old-away-${i}`,
    events:[],participants:[[],[]],ratings:{},shots:[0,0],target:[0,0],xg:[0,0],possession:50}));
  D.advance(s,1);
  const official=s.matches.filter(m=>m.competitionId==="lib"&&m.date===scheduled.day&&
    m.home===scheduled.homeId&&m.away===scheduled.awayId);
  assert.equal(official.length,1);
  assert.equal(s.matches.length,800,"o registro novo substitui o mais antigo no histórico cheio");
  assert.deepEqual([official[0].hg,official[0].ag],expected);
  assert.deepEqual([scheduled.hg,scheduled.ag],expected);
});

test("resultado ao vivo prevalece sobre joinedDay legado e entra no calendário oficial",()=>{
  const s=make(1907,"coach"),ed=D.Continental.edition(s,"lib");
  const localId=ed.entrants.map(x=>x[0]).find(id=>s.clubs.some(c=>c.id===id));
  s.clubId=localId;
  const scheduled=ed.leagueSchedule.matches.find(m=>[m.homeId,m.awayId].includes(localId));
  s.day=scheduled.day-1;
  D.club(s,localId).joinedDay=scheduled.day+30;
  const fixture={home:scheduled.homeId,away:scheduled.awayId,date:scheduled.day,
    round:scheduled.round,competitionId:"lib",competitionName:"CONMEBOL Libertadores",stage:scheduled.stage};
  const prepared=D.prepareCoachWorldFixture(s,fixture);
  const controller=D.createCoachLiveController(prepared.home,prepared.away,new D.Random(s.rng),s);
  controller.advanceTo(94);
  assert.equal(D.stageCoachLiveResult(s,fixture,controller),true);
  D.advance(s,1);
  const official=s.matches.filter(m=>m.competitionId==="lib"&&m.date===scheduled.day&&
    m.home===scheduled.homeId&&m.away===scheduled.awayId);
  assert.equal(official.length,1);
  assert.deepEqual([official[0].hg,official[0].ag],[controller.result.hg,controller.result.ag]);
  assert.deepEqual([scheduled.hg,scheduled.ag],[controller.result.hg,controller.result.ag]);
});

test("carreira antiga após a primeira janela não recebe resultados retroativos",()=>{
  const s=make(1904),ed=D.Continental.edition(s,"lib"),first=D.Continental.windows(s.season,"lib")[0];
  delete ed.leagueSchedule;delete ed.groups;ed.status="ready";s.day=first;
  assert.equal(D.ConmebolTournaments.prepare(s,D.Continental,D.WorldClubCompetitions,"lib"),null);
  assert.equal(ed.simulationStatus,"not_scheduled_legacy");
  assert.equal(ed.leagueSchedule,undefined);
});

test("save FC 27 anterior ao módulo recebe calendário ao ser retomado antes da primeira janela",()=>{
  const s=make(1905);
  for(const comp of ["lib","sud"]){
    const ed=D.Continental.edition(s,comp);
    delete ed.leagueSchedule;delete ed.groups;ed.status="ready";delete ed.simulationStatus;
  }
  const result=D.prepareConmebolSeason(s);
  assert.deepEqual(result,{prepared:2,competitions:["lib","sud"]});
  for(const comp of ["lib","sud"]){
    const ed=D.Continental.edition(s,comp);
    assert.equal(ed.groups.length,8);
    assert.equal(ed.leagueSchedule.matches.length,96);
    assert.ok(ed.leagueSchedule.matches.every(m=>!m.played));
  }
  assert.deepEqual(D.prepareConmebolSeason(s),{prepared:0,competitions:[]});
});
