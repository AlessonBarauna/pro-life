"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),path=require("node:path");
const club={id:"betis",name:"Real Betis",leagueId:"laliga",stats:{played:0,w:0,d:0,l:0,gf:0,ga:0}};
global.ProLife={
  club:(s,id)=>s.globalFootball.clubs.find(c=>c.id===(id||s.clubId))||null,
  seasonCompetitionOverview:()=>({standings:[{clubId:"betis",points:15,played:7,wins:4,draws:3,losses:0,goalsFor:12,goalsAgainst:6}]})
};
global.ProLifeCoachCareer={snapshot:()=>({board:54,risk:{label:"Estável"},stints:[],totals:{seasons:0}})};
global.ProLifeCompetitions={statCompetitions:()=>[],allStates:()=>[]};
const E=require(path.join(__dirname,"../src/ui/expansion.js"));
test("estatísticas do treinador resolvem clube global e dados atuais de todas as competições",()=>{
  const s={mode:"coach",clubId:"betis",season:2026,reputation:46,clubs:[],globalFootball:{clubs:[club]},matches:[
    {season:2026,home:"betis",away:"barca",hg:3,ag:1,competitionName:"LaLiga EA Sports"},
    {season:2026,home:"madrid",away:"betis",hg:2,ag:2,competitionName:"LaLiga EA Sports"},
    {season:2026,home:"betis",away:"porto",hg:2,ag:0,competitionName:"UEFA Europa League"}
  ]};
  const html=E.statistics(s,"");
  assert.match(html,/Real Betis · Temporada 2026/);
  assert.match(html,/Jogos na temporada <b>3<\/b>/);
  assert.match(html,/Vitórias <b>2<\/b>/);
  assert.match(html,/Empates <b>1<\/b>/);
  assert.match(html,/Pontos na liga <b>15<\/b>/);
  assert.match(html,/LaLiga EA Sports/);
  assert.match(html,/UEFA Europa League/);
  assert.doesNotMatch(html,/Sem clube/);
});
