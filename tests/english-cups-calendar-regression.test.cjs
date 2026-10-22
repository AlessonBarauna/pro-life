"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Cup=require("../src/domain/english-cups.js");

const LEAGUES=Cup.LEAGUES;
global.ProLifeWorldClubCompetitions={
  coverage(s){return Object.values(LEAGUES).map(leagueId=>({leagueId,rounds:leagueId===LEAGUES.premier?38:46}));},
  roundDate(season,i,total){return (season-2026)*365+10+Math.round(i*330/(total-1));},
  standings(){return [];}
};
function career(season=2026){
  const clubs=[];
  for(const [id,count] of [[LEAGUES.premier,20],[LEAGUES.championship,24],[LEAGUES.leagueOne,24],[LEAGUES.leagueTwo,24]])
    for(let i=0;i<count;i++)clubs.push({id:id+"_"+i,name:id+"_"+i,leagueId:id,active:true,generated:false,level:70});
  return {catalogVersion:"fc27_v1",season,day:(season-2026)*365,initialSeed:44,clubId:clubs[0].id,globalFootball:{clubs},continental:{editions:{}}};
}
test("janelas simuladas: EFL e FA Cup terminam no primeiro semestre em uma nova carreira",()=>{
  const s=career();Cup.init(s);
  for(let d=1;d<=240;d++){s.day=d;Cup.daily(s);}
  for(const comp of ["fa_cup","efl_cup"]){
    const ed=Cup.edition(s,comp);
    assert.equal(ed.status,"complete",comp+" nao terminou");
    assert.ok(ed.rounds.flatMap(x=>x.matches).every(m=>m.day<=240),comp+" agendou apos janela");
    assert.ok(ed.championId);
  }
  assert.deepEqual(Cup.audit(s).duplicates,[]);
});
test("rodada futura nunca surge no passado se rodada anterior foi atrasada",()=>{
  const s=career();Cup.init(s);
  const ed=Cup.edition(s,"fa_cup"),first=ed.rounds[0];
  for(const m of first.matches){m.day=145;}
  for(let d=1;d<=145;d++){s.day=d;Cup.daily(s);}
  const next=ed.rounds[1];
  assert.ok(next.matches.every(m=>m.day>145));
});
test("semifinal ida e volta: desempate so ocorre quando o agregado esta empatado",()=>{
  const s=career();Cup.init(s);
  const ed=Cup.edition(s,"efl_cup");
  const a=s.globalFootball.clubs[0].id,b=s.globalFootball.clubs[1].id;
  ed.rounds=[{key:"semifinal",name:"Semifinal",status:"scheduled",twoLegged:true,matches:[
    {id:"leg1",tieId:"tie",homeId:a,awayId:b,leg:1,day:10,played:false},
    {id:"leg2",tieId:"tie",homeId:b,awayId:a,leg:2,day:25,played:false}
  ],byes:[]}];ed.currentRound=0;
  for(let d=1;d<=25;d++){s.day=d;Cup.daily(s,{otherFixture(m){return m.leg===1?{hg:2,ag:0}:{hg:1,ag:1};}});}
  const leg2=ed.rounds[0].matches[1];
  assert.equal(leg2.penalties,undefined);
  assert.equal(ed.rounds[1].matches.length,1);
  assert.deepEqual(ed.rounds[1].matches[0].homeId===a||ed.rounds[1].matches[0].awayId===a,true);
});
test("Community Shield pega o vice da Premier e apresenta somente dois participantes",()=>{
  const s=career(2027),top=s.globalFootball.clubs.filter(x=>x.leagueId===LEAGUES.premier);
  s.globalFootball.worldCompetitions={history:[{season:2026,leagueId:LEAGUES.premier,championId:top[0].id,top4:top.slice(0,4).map(x=>x.id)}]};
  s.englishCups={version:1,editions:{},history:[{season:2026,comp:"fa_cup",championId:top[0].id}],prizeLedger:{}};
  Cup.init(s);
  const shield=Cup.edition(s,"community_shield");
  assert.equal(shield.status,"active");
  assert.deepEqual(shield.participantIds,[top[0].id,top[1].id]);
  assert.equal(shield.rounds[0].matches.length,1);
});