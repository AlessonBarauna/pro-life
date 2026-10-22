"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const CC=D.CoachCareer;

function setup(){
  const s=D.create({mode:"coach",clubId:"c0",catalogVersion:"fc27_v1"},5);
  CC.init(s,D);
  const club=s.clubs.find(c=>c.id===s.clubId);
  const other=s.clubs.find(c=>c.id!==club.id);
  return {s,club,other};
}

test("official: copa nacional e continental contam separadamente",()=>{
  const {s,club,other}=setup();
  const season=s.season;
  const cup={season,date:10,home:club.id,away:other.id,hg:2,ag:1,competitionId:"national_cup"};
  const continental={season,date:20,home:other.id,away:club.id,hg:1,ag:1,competitionId:"continental_cup"};
  assert.equal(CC.recordOfficialMatch(s,cup),true);
  assert.equal(CC.recordOfficialMatch(s,continental),true);
  const record=s.coachCareer.stints[0].officialMatches[String(season)].byCompetition;
  assert.equal(record.national_cup.w,1);
  assert.equal(record.continental_cup.d,1);
});

test("official: a mesma partida nunca e contabilizada duas vezes",()=>{
  const {s,club,other}=setup();
  const m={season:s.season,date:15,home:club.id,away:other.id,hg:3,ag:0,competitionId:"cup"};
  assert.equal(CC.recordOfficialMatch(s,m),true);
  assert.equal(CC.recordOfficialMatch(s,{...m}),false);
  assert.equal(s.coachCareer.stints[0].officialMatches[String(s.season)].byCompetition.cup.w,1);
});

test("official: jogo de liga nao e somado duas vezes no fechamento",()=>{
  const {s,club,other}=setup();
  club.stats={played:1,w:1,d:0,l:0,points:3,gf:2,ga:0};
  CC.recordOfficialMatch(s,{
    season:s.season,date:8,home:club.id,away:other.id,hg:2,ag:0,
    leagueId:club.leagueId,competitionId:club.leagueId
  });
  const result=CC.closeSeason(s,D,null);
  assert.ok(result);
  assert.equal(result.row.w,1);
  assert.equal(result.row.d,0);
  assert.equal(result.row.l,0);
});

test("official: copas entram no balanço junto com o campeonato",()=>{
  const {s,club,other}=setup();
  club.stats={played:2,w:1,d:1,l:0,points:4,gf:3,ga:1};
  CC.recordOfficialMatch(s,{
    season:s.season,date:10,home:club.id,away:other.id,hg:2,ag:0,
    competitionId:"national_cup"
  });
  CC.recordOfficialMatch(s,{
    season:s.season,date:20,home:other.id,away:club.id,hg:3,ag:1,
    competitionId:"continental_cup"
  });
  const result=CC.closeSeason(s,D,null);
  assert.ok(result);
  assert.equal(result.row.w,2);
  assert.equal(result.row.d,1);
  assert.equal(result.row.l,1);
  assert.equal(result.row.statisticsScope,"league_plus_recorded_cups");
});

test("official: adversario e modo jogador nao criam registro",()=>{
  const {s,club,other}=setup();
  const m={season:s.season,date:10,home:other.id,away:"outro",hg:1,ag:0,competitionId:"cup"};
  assert.equal(CC.recordOfficialMatch(s,m),false);
  const p=D.create({mode:"player",clubId:"c0"},5);
  assert.equal(CC.recordOfficialMatch(p,{...m,home:p.clubId}),false);
  assert.equal(p.coachCareer,undefined);
});

test("official: temporada sem copa preserva balanco existente",()=>{
  const {s,club}=setup();
  club.stats={played:3,w:2,d:0,l:1,points:6,gf:4,ga:2};
  const result=CC.closeSeason(s,D,null);
  assert.ok(result);
  assert.equal(result.row.w,2);
  assert.equal(result.row.d,0);
  assert.equal(result.row.l,1);
  assert.equal(result.row.statisticsScope,"league_only");
});