"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const W=require("../src/domain/world-club-competitions.js");

test("liga opt-in nao perde tabela nem resultados na passagem para 2027",()=>{
  const id="gf_fc27_premier_league";
  const clubs=Array.from({length:20},(_,i)=>({id:"club_"+i,leagueId:id,active:true,generated:false}));
  const s={season:2026,day:364,globalFootball:{clubs,leagues:[{id,country:"England",active:true}]}};
  W.init(s);
  const league=s.globalFootball.worldCompetitions.leagues[id];
  assert.ok(league);
  league.calendarMode="european_v1";
  league.round=12;
  league.scores.push([0,0,2,1]);
  league.table[clubs[0].id][0]=1;
  s.season=2027;s.day=365;
  W.nextSeason(s);
  const preserved=s.globalFootball.worldCompetitions.leagues[id];
  assert.strictEqual(preserved,league);
  assert.equal(preserved.season,2026);
  assert.equal(preserved.round,12);
  assert.deepEqual(preserved.scores,[[0,0,2,1]]);
  assert.equal(preserved.table[clubs[0].id][0],1);
});
test("liga legada continua reiniciando na virada anual",()=>{
  const id="gf_fc27_premier_league";
  const s={season:2026,day:364,globalFootball:{clubs:Array.from({length:20},(_,i)=>({id:"c"+i,leagueId:id,active:true})),leagues:[{id,country:"England",active:true}]}};
  W.init(s);
  const old=s.globalFootball.worldCompetitions.leagues[id];
  old.round=12;
  s.season=2027;s.day=365;W.nextSeason(s);
  const next=s.globalFootball.worldCompetitions.leagues[id];
  assert.notStrictEqual(next,old);
  assert.equal(next.season,2027);
  assert.equal(next.round,0);
});
