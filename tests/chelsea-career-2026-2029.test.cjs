"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
const Dates=require("../src/domain/european-calendar.js");
const CHELSEA="gf_fc27_5";
const PREMIER="gf_fc27_premier_league";
const checkpoints=[
  ["2027-01-15",2026],
  ["2027-06-15",2027],
  ["2027-09-15",2027],
  ["2028-01-15",2027],
  ["2028-06-15",2028],
  ["2028-09-15",2028],
  ["2029-01-15",2028],
  ["2029-06-15",2029]
];
test("Chelsea: calendar continuity 2026-2029 with real engine", {timeout:0},()=>{
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);
  const club=s.globalFootball?.clubs?.find(x=>x.id===CHELSEA);
  assert.ok(club&&club.leagueId===PREMIER,"Chelsea must be in the FC27 Premier League");
  assert.equal(s.calendarVersion,"european_v1");
  // Coach takes the job through the engine's established joining workflow.
  s.clubId=null;
  E.join(s,CHELSEA,90000);
  assert.equal(s.clubId,CHELSEA);
  const seenYears=new Set();
  for(const [date,expectedEdition] of checkpoints){
    const target=Dates.dateDay(date);
    let loops=0;
    while(s.day<target){
      s.board=100;
      const left=target-s.day;
      E.advance(s,Math.min(30,left));
      if(++loops>1600)throw Error("Career did not progress to "+date);
    }
    assert.ok(s.day>=target,"date was not reached");
    assert.equal(s.clubId,CHELSEA,"coach lost Chelsea assignment unexpectedly");
    const world=s.globalFootball?.worldCompetitions;
    const league=world?.leagues?.[PREMIER];
    assert.ok(league,"Premier League state is missing at "+date);
    const finalSeason=Dates.currentSeason("ENG",s.day);
    if(finalSeason)assert.equal(league.season,finalSeason.startYear??Number(finalSeason.seasonLabel?.slice(0,4)),"Premier edition mismatch at "+date);
    assert.ok(Array.isArray(world.history),"world competition history missing");
    const cupEditions=Object.keys(s.englishCups?.editions||{}).filter(x=>/^(fa_cup|efl_cup):/.test(x));
    const uefaEditions=Object.keys(s.continental?.editions||{}).filter(x=>/^(ucl|uel|uecl):/.test(x));
    const snapshot={date,day:s.day,engineSeason:s.season,premierSeason:league.season,premierRound:league.round,premierStatus:league.status,worldHistory:world.history.length,cupEditions,uefaEditions,clubId:s.clubId};
    console.log("CHECKPOINT="+JSON.stringify(snapshot));
    seenYears.add(league.season);
  }
  assert.ok(seenYears.has(2026)&&seenYears.has(2027)&&seenYears.has(2028),"expected all three Premier editions");
  console.log("RESULT=CHECKPOINTS_COMPLETE");
});
