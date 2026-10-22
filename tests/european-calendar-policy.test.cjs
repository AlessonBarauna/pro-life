"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Calendar=require("../src/domain/european-calendar.js");

test("Premier League 2026/27 cruza o Ano Novo e preserva as 38 rodadas",()=>{
  const w=Calendar.seasonWindow("ENG",2026);
  assert.deepEqual([w.start,w.end],["2026-08-21","2027-05-30"]);
  const dates=Calendar.roundDays("ENG",2026,38);
  assert.equal(dates.length,38);
  assert.equal(Calendar.toDate(dates[0]),w.start);
  assert.equal(Calendar.toDate(dates[37]),w.end);
  assert.ok(dates.every((day,i)=>i===0||day>dates[i-1]));
  assert.equal(Calendar.currentSeason("ENG",Calendar.dateDay("2027-01-15")).seasonLabel,"2026/27");
});
test("ligas do ano civil nao seguem agosto a maio",()=>{
  for(const [country,start,end] of [
    ["SWE","2026-04-04","2026-11-29"],
    ["NOR","2026-03-15","2026-12-06"],
    ["IRL","2026-02-06","2026-10-30"]
  ]){
    const w=Calendar.seasonWindow(country,2026);
    assert.equal(w.type,"calendar_year");
    assert.deepEqual([w.start,w.end],[start,end]);
    assert.equal(Calendar.currentSeason(country,Calendar.dateDay("2027-01-15")),null);
  }
});
test("UEFA 2026/27 disputa a fase de liga dos dois lados do Ano Novo",()=>{
  const dates=Calendar.UEFA_2026_27.ucl.league.map(Calendar.dateDay);
  assert.equal(dates.length,8);
  assert.ok(dates[5]<Calendar.dateDay("2027-01-01"));
  assert.ok(dates[6]>Calendar.dateDay("2027-01-01"));
  assert.equal(Calendar.UEFA_2026_27.ucl.final,"2027-06-05");
});
test("politica diferencia janela planejada de data oficialmente verificada",()=>{
  const eng=Calendar.seasonWindow("ENG",2026);
  const por=Calendar.seasonWindow("POR",2026);
  assert.equal(eng.source,"confirmed");
  assert.equal(por.source,"planning_window");
});

test("metadados da liga identificam o pais sem adivinhar formato",()=>{
  assert.equal(Calendar.leagueCountry({country:"England"}),"ENG");
  assert.equal(Calendar.leagueCountry({country:"Norway"}),"NOR");
  assert.equal(Calendar.leagueCountry({country:"Brasil"}),null);
});
test("datas oficiais de rodadas tem prioridade sobre distribuicao planejada",()=>{
  const league={country:"England",officialRoundDates:{"2026":["2026-08-21","2026-08-29"]}};
  assert.equal(Calendar.resolvedRoundDay(league,2026,1,38),Calendar.dateDay("2026-08-29"));
  assert.equal(Calendar.resolvedRoundDay({country:"England"},2026,0,38),Calendar.dateDay("2026-08-21"));
  assert.equal(Calendar.resolvedRoundDay({country:"Brasil"},2026,0,38),null);
});

test("UEFA 2026/27 tem calendarios independentes por torneio",()=>{
  const cases={
    ucl:["2026-09-08","2027-01-27",8],
    uel:["2026-09-16","2027-01-28",8],
    uecl:["2026-10-15","2026-12-17",6]
  };
  for(const [comp,[first,last,count]] of Object.entries(cases)){
    const dates=Calendar.uefaLeagueWindows(2026,comp);
    assert.equal(dates.length,count,comp);
    assert.equal(Calendar.toDate(dates[0]),first);
    assert.equal(Calendar.toDate(dates.at(-1)),last);
    assert.ok(dates.every((d,i)=>!i||d>dates[i-1]));
  }
  assert.equal(Calendar.uefaLeagueWindows(2027,"ucl"),null);
});

test("non-summer leagues retain calendar-year policies in UEFA associations",()=>{
  for(const code of ["FIN","ISL","EST","LVA","LTU","BLR","GEO","KAZ"]){
    const policy=Calendar.seasonWindow(code,2026);
    assert.equal(policy.type,"calendar_year",code);
    assert.equal(policy.source,"planning_window");
  }
  for(const code of ["TUR","GRE","CZE","CRO","SRB","UKR","HUN","SVK"]){
    const policy=Calendar.seasonWindow(code,2026);
    assert.equal(policy.type,"cross_year",code);
  }
});
test("future UEFA seasons retain proper January and June crossover",()=>{
  for(const comp of ["ucl","uel","uecl"]){
    const windows=Calendar.uefaLeagueWindows(2027,comp);
    assert.ok(windows.every(x=>Number.isInteger(x)));
    assert.ok(windows[0]>=Calendar.dateDay("2027-09-01"));
    assert.ok(Calendar.uefaKnockoutDates(2027,comp,"final")[0]>=Calendar.dateDay("2028-05-01"));
  }
});
