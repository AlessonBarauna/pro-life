const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const Home=require("../src/ui/home-dashboard.js");
const Save=require("../src/infrastructure/save.js");

const Calendar={events:()=>[]};

function state(mode="player",seed=31320){
  const s=D.create({clubId:"c0",mode},seed);
  s.day=120;
  s.matches=[];
  D.NationalTeam.init(s).matches=[];
  return s;
}

function clubMatch(s,date,{hg=1,ag=0,rating=7.2}={}){
  return {season:s.season,date,home:s.clubId,away:"c1",hg,ag,competitionName:"Brasileirão Série A",events:[],ratings:{hero:rating},playerStats:{hero:{starter:true,minutes:90}}};
}

function nationalMatch(s,day,{opponent="Argentina",brazil=1,other=0,rating=7.5,starter=true,entryMinute=null,minutes=90,goals=0,assists=0}={}){
  return {season:s.season,day,competition:"Eliminatórias",opponent,brazil,other,rating,starter,entryMinute,minutes,goals,assists};
}

test("Stage 31.3.2 intercala clube e Seleção e mantém somente os cinco mais recentes",()=>{
  const s=state();
  s.matches=[clubMatch(s,110),clubMatch(s,90),clubMatch(s,70)];
  s.nationalTeam.matches=[nationalMatch(s,100),nationalMatch(s,80),nationalMatch(s,60)];
  const recent=Home.snapshot(s,D,Calendar).recent;
  assert.equal(recent.length,5);
  assert.deepEqual(recent.map(x=>x.date),[110,100,90,80,70]);
  assert.deepEqual(recent.map(x=>x.national),[false,true,false,true,false]);
});

test("Stage 31.3.2 calcula vitória, empate e derrota da perspectiva do Brasil",()=>{
  const s=state("player",31321);
  s.nationalTeam.matches=[
    nationalMatch(s,110,{brazil:2,other:0}),
    nationalMatch(s,109,{opponent:"Uruguai",brazil:1,other:1}),
    nationalMatch(s,108,{opponent:"Chile",brazil:0,other:3})
  ];
  assert.deepEqual(Home.snapshot(s,D,Calendar).recent.map(x=>x.result),["V","E","D"]);
});

test("Stage 31.3.2 preserva estatísticas internacionais para os detalhes clicáveis",()=>{
  const s=state("player",31322);
  s.nationalTeam.matches=[nationalMatch(s,115,{opponent:"Colômbia",brazil:3,other:2,rating:8.4,starter:false,entryMinute:64,minutes:26,goals:1,assists:1})];
  const row=Home.snapshot(s,D,Calendar).recent[0];
  assert.equal(row.national,true);
  assert.equal(row.home,"Brasil");
  assert.equal(row.competition,"Eliminatórias");
  assert.deepEqual(row.hero,{played:true,starter:false,entryMinute:64,minutes:26,goals:1,assists:1,rating:8.4});
  assert.equal(row.goals,null);
  assert.equal(row.motm,null);
});

test("Stage 31.3.2 mantém apenas jogos do clube quando não há partidas da Seleção",()=>{
  const s=state("player",31323);
  s.matches=[clubMatch(s,111),clubMatch(s,105)];
  const recent=Home.snapshot(s,D,Calendar).recent;
  assert.equal(recent.length,2);
  assert.ok(recent.every(x=>x.national===false));
});

test("Stage 31.3.2 não inclui Seleção no modo treinador",()=>{
  const s=state("coach",31324);
  s.matches=[clubMatch(s,111)];
  s.nationalTeam.matches=[nationalMatch(s,115)];
  const recent=Home.snapshot(s,D,Calendar).recent;
  assert.deepEqual(recent.map(x=>x.date),[111]);
  assert.ok(recent.every(x=>!x.national));
});

test("Stage 31.3.2 elimina registros internacionais duplicados",()=>{
  const s=state("player",31325), match=nationalMatch(s,115,{brazil:2,other:1});
  s.nationalTeam.matches=[match,{...match}];
  const recent=Home.snapshot(s,D,Calendar).recent;
  assert.equal(recent.filter(x=>x.national).length,1);
});

test("Stage 31.3.2 preserva a forma recente após save e reload",()=>{
  const s=state("player",31326);
  s.nationalTeam.matches=[nationalMatch(s,115,{rating:8.3,goals:1})];
  const before=Home.snapshot(s,D,Calendar).recent.map(x=>({date:x.date,national:x.national,score:x.score,rating:x.rating,hero:x.hero}));
  const loaded=Save.parse(JSON.stringify(s));
  const after=Home.snapshot(loaded,D,Calendar).recent.map(x=>({date:x.date,national:x.national,score:x.score,rating:x.rating,hero:x.hero}));
  assert.deepEqual(after,before);
});

test("Stage 31.3.2 integra a Central V3 e calcula FASE somente com notas válidas",()=>{
  const s=state("player",31327);
  s.matches=[clubMatch(s,114,{rating:7})];
  s.nationalTeam.matches=[nationalMatch(s,115,{rating:9}),nationalMatch(s,113,{rating:null}),nationalMatch(s,112,{rating:99})];
  const snap=Home.snapshot(s,D,Calendar);
  assert.equal(snap.player.form,8);
  const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
  assert.match(app,/data-recent-match=/);
  assert.match(app,/SELEÇÃO BRASILEIRA/);
  assert.match(app,/Autores dos gols não disponíveis neste registro/);
  assert.match(app,/Seu jogo pela Seleção/);
});
