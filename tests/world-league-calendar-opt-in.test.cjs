"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const W=require("../src/domain/world-club-competitions.js");
const C=require("../src/domain/european-calendar.js");
const leagueId="gf_fc27_premier_league";
function state(mode){
  return {globalFootball:{leagues:[{id:leagueId,country:"England"}],worldCompetitions:{leagues:{[leagueId]:{calendarMode:mode}}}}};
}
test("legacy continues using saved season schedule by default",()=>{
  const legacy=state(undefined);
  const day=W.leagueRoundDate(legacy,leagueId,2026,0,38);
  assert.equal(day,W.roundDate(2026,0,38));
  assert.equal(day,10);
});
test("explicit European opt-in maps 2026/27 fixtures to August-May",()=>{
  const s=state("european_v1");
  assert.equal(W.leagueRoundDate(s,leagueId,2026,0,38),C.dateDay("2026-08-21"));
  assert.equal(W.leagueRoundDate(s,leagueId,2026,37,38),C.dateDay("2027-05-30"));
});
test("calendar resolver is read-only and isolated to marked league",()=>{
  const s=state("european_v1"),before=JSON.stringify(s);
  W.leagueRoundDate(s,leagueId,2026,4,38);
  assert.equal(JSON.stringify(s),before);
  assert.equal(W.leagueRoundDate(s,"unknown",2026,4,38),W.roundDate(2026,4,38));
});
