"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const D=require("../src/domain/engine.js");
const CC=D.CoachCareer;
function setup(){
  const s=D.create({mode:"coach",clubId:"c0",catalogVersion:"fc27_v1"},5);
  CC.init(s,D);
  const club=s.clubs.find(c=>c.id===s.clubId);
  club.worldMatch=true;
  club.stats={played:20,w:13,d:4,l:3,points:43,gf:39,ga:19};
  return {s,club};
}
function event(s,club,overrides={}){
  return {leagueId:club.leagueId,season:s.season,
    championId:club.id,name:"Liga mundial",day:s.day,...overrides};
}
test("campeao mundial recebe titulo apenas no fechamento confirmado",()=>{
  const {s,club}=setup();
  assert.equal(CC.recordWorldLeagueTitle(s,event(s,club)),true);
  const row=CC.closeSeason(s,D,null).row;
  assert.equal(row.trophies.filter(x=>x.key.startsWith("world-league:")).length,1);
  assert.equal(row.titles,1);
});
test("titulo mundial nao duplica com repeticao do evento ou temporada",()=>{
  const {s,club}=setup();
  assert.equal(CC.recordWorldLeagueTitle(s,event(s,club)),true);
  assert.equal(CC.recordWorldLeagueTitle(s,event(s,club)),false);
  CC.closeSeason(s,D,null); CC.closeSeason(s,D,null);
  assert.equal(s.coachCareer.stints[0].titles,1);
});
test("nao credita titulo de outro clube ou data retroativa",()=>{
  const {s,club}=setup();
  assert.equal(CC.recordWorldLeagueTitle(s,event(s,club,{championId:"outro"})),false);
  const oldDay=s.day;
  s.day=oldDay+50;
  s.coachCareer.stints[0].fromDay=s.day-10;
  assert.equal(CC.recordWorldLeagueTitle(s,event(s,club,{day:oldDay})),false);
});
test("ano de encerramento distinto do inicio da temporada da liga",()=>{
  const {s,club}=setup();
  const edition=s.season;
  s.season=edition+1;
  s.day+=365;
  assert.equal(CC.recordWorldLeagueTitle(s,event(s,club,{season:edition})),true);
  const row=CC.closeSeason(s,D,null).row;
  assert.equal(row.trophies.some(x=>x.key===`world-league:${edition}:${club.leagueId}`),true);
});
test("vinculo encerrado nao recebe titulo",()=>{
  const {s,club}=setup();
  s.coachCareer.stints[0].exit="troca de clube";
  assert.equal(CC.recordWorldLeagueTitle(s,event(s,club)),false);
});
test("motor chama registro quando liga europeia termina",()=>{
  const src=fs.readFileSync(require.resolve("../src/domain/world-club-competitions.js"),"utf8");
  assert.match(src,/coachCareer\?\.recordWorldLeagueTitle\?\.\(s,/);
});