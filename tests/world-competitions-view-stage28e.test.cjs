"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const View=require("../src/ui/world-competitions-view.js");

const base=path.resolve(__dirname,"..");

function fixture(){
  const s={
    season:2031,
    globalFootball:{
      clubs:[
        {id:"a",name:"Aurora FC"},
        {id:"b",name:"Boreal United"}
      ],
      worldCompetitions:{
        leagues:{world_league:{championId:"a"}}
      }
    }
  };
  const WorldClubCompetitions={
    eligibleLeagues:()=>[{id:"world_league",name:"Liga Mundial",country:"Global",clubCount:2}],
    standings:()=>[
      {id:"a",name:"Aurora FC",played:2,w:2,d:0,l:0,gd:3,points:6},
      {id:"b",name:"Boreal United",played:2,w:0,d:0,l:2,gd:-3,points:0}
    ],
    calendar:()=>[{round:1,played:true,pairs:[{home:"a",away:"b",hg:2,ag:0,played:true}]}],
    results:()=>[{round:1,home:"a",away:"b",homeName:"Aurora FC",awayName:"Boreal United",hg:2,ag:0}],
    history:()=>[{season:2031,championId:"a",champion:"Aurora FC"}]
  };
  return {s,D:{WorldClubCompetitions}};
}

function realState(){
  return D.create(
    {mode:"player",clubId:"c0"},
    28101
  );
}

test("28E.1: renderiza liga, classificação, rodada, resultado e campeão",()=>{
  const {s,D}=fixture();
  const html=View.render(s,D,{leagueId:"world_league",round:1});

  for(const marker of [
    "data-world-competitions-view",
    "Liga Mundial",
    "CLASSIFICAÇÃO",
    "Rodada 1",
    "Aurora FC",
    "2 – 0",
    "CAMPEÃO",
    "world-competitions-dark"
  ]) assert.ok(html.includes(marker),marker);

  const snap=View.snapshot(s,D,{leagueId:"world_league"});
  assert.equal(snap.champion.name,"Aurora FC");
  assert.equal(snap.standings[0].points,6);
});

test("28E.1: estados vazios são informativos e não quebram",()=>{
  const D={WorldClubCompetitions:{eligibleLeagues:()=>[]}};
  const html=View.render({season:2032,globalFootball:{}},D);

  assert.ok(html.includes("Nenhuma liga disponível"));
  assert.ok(html.includes("data-world-competitions-view"));
  assert.doesNotMatch(html,/\b(?:undefined|null|NaN)\b/);
});

test("28E.1: nomes vindos do motor são escapados no HTML",()=>{
  const {s,D}=fixture();
  s.globalFootball.clubs[0].name='<img src=x onerror="attack()">';
  D.WorldClubCompetitions.eligibleLeagues=()=>[{id:"world_league",name:"<script>attack()</script>",clubCount:2}];
  D.WorldClubCompetitions.standings=()=>[{id:"a",name:'<svg onload="attack()">',played:0,points:0}];
  D.WorldClubCompetitions.results=()=>[{home:"a",away:"b",homeName:"<b>bad</b>",awayName:"Safe",hg:0,ag:0}];

  const html=View.render(s,D);
  assert.doesNotMatch(html,/<(?:script|svg|img)\b/i);
  assert.ok(html.includes("&lt;script&gt;attack()&lt;/script&gt;"));
  assert.ok(html.includes("&lt;svg onload=&quot;attack()&quot;&gt;"));
});

test("28E.1B: exibe as 34 ligas reais disponíveis no motor",()=>{
  const s=realState();
  const snap=View.snapshot(s,D);
  const html=View.render(s,D);

  assert.equal(snap.leagues.length,34);
  assert.equal(
    (html.match(/data-world-league=/g)||[]).length,
    34
  );
  for(const league of snap.leagues)
    assert.ok(html.includes(View.esc(league.name||league.id)));
});

test("28E.1B: preserva a classificação e os critérios definidos pelo motor",()=>{
  const s=realState();
  const W=D.WorldClubCompetitions;
  const league=W.eligibleLeagues(s)[0];
  const competition=W.init(s).leagues[league.id];
  const [a,b,c,d,...others]=competition.clubIds;

  for(const id of competition.clubIds)
    competition.table[id]=[1,0,0,1,0,1,0];

  competition.table[a]=[4,2,4,0,8,3,10];
  competition.table[b]=[4,2,4,0,7,2,10];
  competition.table[c]=[4,1,7,0,20,0,10];
  competition.table[d]=[4,3,0,1,6,2,9];
  for(const id of others)
    competition.table[id]=[4,0,0,4,0,4,0];

  const engineOrder=W.standings(s,league.id);
  const snap=View.snapshot(s,D,{leagueId:league.id});
  const html=View.render(s,D,{leagueId:league.id});

  assert.deepEqual(
    snap.standings.map(row=>row.id),
    engineOrder.map(row=>row.id)
  );
  assert.deepEqual(engineOrder.slice(0,4).map(row=>row.id),[a,b,c,d]);
  assert.ok(
    html.indexOf(View.esc(engineOrder[0].name))<
    html.indexOf(View.esc(engineOrder[1].name))
  );
});

test("28E.1B: rodada e resultados pertencem somente à liga selecionada",()=>{
  const {s}=fixture();
  s.globalFootball.clubs.push(
    {id:"c",name:"Cobalto FC"},
    {id:"d",name:"Dourado SC"}
  );
  s.globalFootball.worldCompetitions.leagues.other={championId:null};

  const data={
    world_league:{
      table:[{id:"a",name:"Aurora FC",points:6}],
      rounds:[{round:1,played:true,pairs:[{home:"a",away:"b",hg:2,ag:0,played:true}]}],
      results:[{homeName:"Aurora FC",awayName:"Boreal United",hg:2,ag:0}]
    },
    other:{
      table:[{id:"c",name:"Cobalto FC",points:3}],
      rounds:[{round:7,played:true,pairs:[{home:"c",away:"d",hg:1,ag:1,played:true}]}],
      results:[{homeName:"Cobalto FC",awayName:"Dourado SC",hg:1,ag:1}]
    }
  };
  const W={
    eligibleLeagues:()=>[
      {id:"world_league",name:"Liga Mundial"},
      {id:"other",name:"Liga Alternativa"}
    ],
    standings:(_s,id)=>data[id].table,
    calendar:(_s,id)=>data[id].rounds,
    results:(_s,id)=>data[id].results,
    history:()=>[]
  };
  const localD={WorldClubCompetitions:W};
  const first=View.render(s,localD,{leagueId:"world_league",round:1});
  const second=View.render(s,localD,{leagueId:"other",round:7});

  assert.match(first,/Aurora FC[\s\S]*2 – 0/);
  assert.doesNotMatch(first,/Cobalto FC|1 – 1/);
  assert.match(second,/Cobalto FC[\s\S]*1 – 1/);
  assert.doesNotMatch(second,/Aurora FC|2 – 0/);
});

test("28E.1B: campeão atual e histórico de temporadas não são confundidos",()=>{
  const {s,D:localD}=fixture();
  const W=localD.WorldClubCompetitions;
  W.history=()=>[
    {season:2030,championId:"b",champion:"Boreal United"},
    {season:2029,championId:"a",champion:"Aurora FC"}
  ];
  s.globalFootball.worldCompetitions.leagues.world_league.championId=null;

  const active=View.render(s,localD);
  assert.match(active,/CAMPEÃO<\/small><strong>Em disputa/);
  assert.ok(active.includes("Boreal United"));

  W.history=()=>[
    {season:2031,championId:"a",champion:"Aurora FC"},
    {season:2030,championId:"b",champion:"Boreal United"}
  ];
  const finished=View.snapshot(s,localD);
  assert.equal(finished.champion.name,"Aurora FC");
  assert.equal(finished.history.length,2);
});

test("28E.1B: dados incompletos usam estados vazios sem inventar conteúdo",()=>{
  const s={season:2033,globalFootball:{clubs:[],worldCompetitions:{leagues:{incomplete:{}}}}};
  const localD={WorldClubCompetitions:{
    eligibleLeagues:()=>[{id:"incomplete",name:"Liga Incompleta"}]
  }};
  const html=View.render(s,localD);

  assert.ok(html.includes("Classificação ainda indisponível"));
  assert.ok(html.includes("Nenhuma rodada disponível"));
  assert.ok(html.includes("Ainda não há resultados disputados"));
  assert.ok(html.includes("O primeiro campeão ainda será definido"));
  assert.doesNotMatch(html,/\b(?:undefined|null|NaN)\b/);
});

test("28E.2B: rota mundial existe nos modos jogador e treinador sem substituir a Central",()=>{
  const app=fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8");
  const route='["worldCompetitions", "Competições Mundiais"]';

  assert.equal((app.match(new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"))||[]).length,2);
  assert.ok(app.includes("worldCompetitions()"));
  assert.ok(app.includes("window.ProLifeWorldCompetitionsView.render("));
  assert.ok(app.includes('home() {'));
  assert.ok(app.includes('page = b.dataset.page'));
});

test("28E.2B: seleções de liga e rodada são transitórias e precedem data-page",()=>{
  const app=fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8");
  const leagueHandler=app.indexOf("b.dataset.worldLeague !== undefined");
  const roundHandler=app.indexOf("b.dataset.worldRound !== undefined");
  const pageHandler=app.indexOf("if (b.dataset.page)");

  assert.ok(app.includes("let worldCompetitionLeagueId=null"));
  assert.ok(app.includes("let worldCompetitionRound=null"));
  assert.ok(leagueHandler>0 && roundHandler>leagueHandler);
  assert.ok(pageHandler>roundHandler);
  assert.ok(app.includes("worldCompetitionRound=null"));
  assert.ok(app.includes("round:worldCompetitionRound"));
});

test("28E.2B: módulo está registrado na página e nos assets offline",()=>{
  const html=fs.readFileSync(path.join(base,"index.html"),"utf8");
  const assets=fs.readFileSync(path.join(base,"tools/assets.cjs"),"utf8");
  const marker="src/ui/world-competitions-view.js";
  assert.ok(html.includes(marker));
  assert.ok(assets.includes(marker));
  assert.ok(html.indexOf(marker)<html.indexOf("src/ui/app.js"));
});
