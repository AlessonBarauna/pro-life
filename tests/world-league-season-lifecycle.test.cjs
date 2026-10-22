"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const W=require("../src/domain/world-club-competitions.js");
const C=require("../src/domain/european-calendar.js");
const leagueId="gf_fc27_premier_league";
function fixture(){
  const clubs=Array.from({length:20},(_,i)=>({id:"team_"+i,name:"Team "+i,leagueId,active:true,generated:false,strength:70}));
  const s={season:2026,day:C.dateDay("2027-05-31"),globalFootball:{clubs,leagues:[{id:leagueId,name:"Premier League",country:"England",active:true}]}};
  W.init(s);
  const st=s.globalFootball.worldCompetitions.leagues[leagueId];
  st.calendarMode="european_v1";
  st.round=W.makeSchedule(st.clubIds).length;
  st.table[st.clubIds[0]][6]=100;
  return {s,st};
}
test("liga europeia termina no seu proprio fim de temporada, uma unica vez",()=>{
  const {s,st}=fixture();
  assert.equal(W.progressEuropeanSeasons(s),1);
  assert.equal(st.status,"finished");
  assert.ok(st.championId);
  assert.equal(s.globalFootball.worldCompetitions.history.length,1);
  assert.equal(W.progressEuropeanSeasons(s),0);
  assert.equal(s.globalFootball.worldCompetitions.history.length,1);
});
test("edicao encerrada permanece ate o proximo inicio real em agosto",()=>{
  const {s,st}=fixture();
  W.progressEuropeanSeasons(s);
  s.season=2027;
  s.day=C.dateDay("2027-06-10");
  W.nextSeason(s);
  assert.strictEqual(s.globalFootball.worldCompetitions.leagues[leagueId],st);
  assert.equal(W.progressEuropeanSeasons(s),0);
  s.day=C.dateDay("2027-08-21");
  assert.equal(W.progressEuropeanSeasons(s),1);
  const next=s.globalFootball.worldCompetitions.leagues[leagueId];
  assert.notStrictEqual(next,st);
  assert.equal(next.season,2027);
  assert.equal(next.round,0);
  assert.equal(next.calendarMode,"european_v1");
  assert.equal(s.globalFootball.worldCompetitions.history.length,1);
});
test("save legado continua independente do novo encerramento",()=>{
  const {s,st}=fixture();
  delete st.calendarMode;
  assert.equal(W.progressEuropeanSeasons(s),0);
  assert.equal(st.status,"active");
});
