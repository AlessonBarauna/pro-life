"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const Home=require("../src/ui/home-dashboard.js");

const clubs=["chelsea","arsenal","city","united","liverpool","tottenham"].map((id,index)=>({id,name:id[0].toUpperCase()+id.slice(1),leagueId:"premier",stats:{points:20-index}}));
const D={
  club:(s,id=s.clubId)=>clubs.find(c=>c.id===id),
  Competitions:{fixtureStage:()=>"Rodada 5/38"}
};
const leagueTable={league:"Premier League",page:"league",kind:"league",position:1,rows:[{id:"chelsea",position:1,stats:{points:30}}]};
const fixture=(competitionId,stage="Quartas de final")=>({competitionId,competitionName:competitionId,home:"chelsea",away:"arsenal",date:150,round:5,stage,knockout:true});
const cupEdition=(comp,name,stage,key="quarterfinal")=>({comp,name,season:2026,status:"active",currentRound:0,rounds:[{name:stage,key,matches:[{id:`${comp}:1`,competitionId:comp,stage,homeId:"chelsea",awayId:"arsenal",day:150,played:false,pair:0,leg:1}],byes:[]}],participantIds:clubs.map(c=>c.id)});

test("liga nacional mantém a classificação oficial e sua navegação",()=>{
  const context=Home.competitionContext({season:2026,clubId:"chelsea"},D,{competitionId:"premier"},leagueTable);
  assert.equal(context,leagueTable);
  assert.equal(context.rows[0].stats.points,30);
  assert.equal(context.page,"league");
});

test("EFL Cup preserva a fase oficial e nunca herda Rodada 5/38",()=>{
  const s={season:2026,clubId:"chelsea",globalFootball:{clubs},englishCups:{editions:{"efl_cup:2026":cupEdition("efl_cup","EFL Cup","Quartas de final")}}};
  const next=Home.nextInfo(s,{...D,nextCommitment:()=>fixture("efl_cup")});
  assert.equal(next.stage,"Quartas de final");
  assert.notEqual(next.stage,"Rodada 5/38");
  const before=JSON.stringify(s),context=Home.competitionContext(s,D,next,leagueTable);
  assert.equal(context.kind,"knockout");
  assert.equal(context.league,"EFL Cup");
  assert.equal(context.page,"englishCups");
  assert.equal(context.actionLabel,"Ver chaveamento");
  assert.deepEqual(context.fixtures.map(x=>[x.homeId,x.awayId]),[["chelsea","arsenal"]]);
  assert.equal(JSON.stringify(s),before,"renderização não pode sortear ou mutar a copa");
});

test("FA Cup usa confrontos oficiais e classificados já persistidos",()=>{
  const ed=cupEdition("fa_cup","Emirates FA Cup","Semifinal","semifinal");
  ed.rounds[0].matches[0]= {...ed.rounds[0].matches[0],played:true,hg:2,ag:1};
  const s={season:2026,clubId:"chelsea",globalFootball:{clubs},englishCups:{editions:{"fa_cup:2026":ed}}};
  const context=Home.competitionContext(s,D,fixture("fa_cup","Semifinal"),leagueTable);
  assert.equal(context.stage,"Semifinal");
  assert.equal(context.fixtures[0].score,"2–1");
  assert.deepEqual(context.qualified.map(x=>x.id),["chelsea"]);
});

test("Community Shield é final única e exibe campeão após a decisão",()=>{
  const ed=cupEdition("community_shield","FA Community Shield","Final","final");
  ed.status="complete";ed.championId="chelsea";ed.rounds[0].matches[0]={...ed.rounds[0].matches[0],played:true,hg:1,ag:0};
  const s={season:2026,clubId:"chelsea",globalFootball:{clubs},englishCups:{editions:{"community_shield:2026":ed}}};
  const context=Home.competitionContext(s,D,fixture("community_shield","Final"),leagueTable);
  assert.equal(context.final,true);
  assert.equal(context.champion.id,"chelsea");
  assert.equal(context.fixtures.length,1);
});

test("Champions, Europa e Conference distinguem fase de liga e mata-mata",()=>{
  global.ProLifeChampionsStandings={standings:()=>clubs.map((c,index)=>({id:c.id,position:index+1,points:15-index,played:5,wins:4,draws:1,losses:0,gf:10,ga:3}))};
  const editions={};
  for(const id of ["ucl","uel","uecl"])editions[`${id}:2026`]={season:2026,leagueSchedule:{matches:[]},knockout:{stages:[{key:"semis",name:"Semifinais",matches:[{id:`${id}:semi`,homeId:"chelsea",awayId:"arsenal",day:300,played:false,leg:1,pair:0}],winners:null}],championId:null}};
  global.ProLifeContinental={edition:(s,id)=>s.continental.editions[`${id}:2026`]};
  const s={season:2026,clubId:"chelsea",globalFootball:{clubs},continental:{editions}};
  for(const id of ["ucl","uel","uecl"]){
    const table=Home.competitionContext(s,D,fixture(id,"Fase de liga"),leagueTable);
    assert.equal(table.kind,"league",id);assert.equal(table.position,1,id);
    const ko=Home.competitionContext(s,D,fixture(id,"semis"),leagueTable);
    assert.equal(ko.kind,"knockout",id);assert.equal(ko.stage,"Semifinais",id);assert.equal(ko.fixtures.length,1,id);
  }
});

test("Libertadores e Sul-Americana alternam grupos e chaveamento persistido",()=>{
  const editions={};
  for(const id of ["lib","sud"])editions[`${id}:2026`]={comp:id,season:2026,groups:[{id:"A",clubIds:["chelsea","arsenal"]}],knockout:{stages:[{key:"quarterfinal",name:"Quartas de final",matches:[{id:`${id}:qf`,homeId:"chelsea",awayId:"arsenal",day:260,played:false,pair:0,leg:1}],winners:null}],championId:null}};
  const domain={...D,ConmebolTournaments:{standings:()=>[{id:"chelsea",position:1,points:9,played:3,wins:3,draws:0,losses:0,gf:7,ga:1},{id:"arsenal",position:2,points:4,played:3,wins:1,draws:1,losses:1,gf:4,ga:3}]}};
  const s={season:2026,clubId:"chelsea",globalFootball:{clubs},continental:{editions}};
  for(const id of ["lib","sud"]){
    assert.equal(Home.competitionContext(s,domain,fixture(id,"Grupo A · Rodada 3"),leagueTable).kind,"group",id);
    const ko=Home.competitionContext(s,domain,fixture(id,"quarterfinal"),leagueTable);
    assert.equal(ko.kind,"knockout",id);assert.equal(ko.fixtures[0].id,`${id}:qf`,id);
  }
});

test("save/reload mantém o contexto e a Central navega para a copa correta",()=>{
  const s={season:2026,clubId:"chelsea",globalFootball:{clubs},englishCups:{editions:{"efl_cup:2026":cupEdition("efl_cup","EFL Cup","Quartas de final")}}};
  const restored=JSON.parse(JSON.stringify(s));
  assert.deepEqual(Home.competitionContext(restored,D,fixture("efl_cup"),leagueTable),Home.competitionContext(s,D,fixture("efl_cup"),leagueTable));
  const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
  assert.match(app,/data-english-cup=/);
  assert.match(app,/data-target="english-cup-/);
  assert.match(app,/englishCupKey=b\.dataset\.englishCup/);
});
