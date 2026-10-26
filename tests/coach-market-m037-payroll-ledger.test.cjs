"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const career = require("../src/domain/coach-career.js");
function make() {
  const club = {id:"a",budget:12000000,roster:[{id:"p1",salary:3000},{id:"p2"},{id:"p3",salary:5000}]};
  const state = {mode:"coach",day:1,clubId:"a",clubs:[club],coachCareer:{version:1,stints:[],board:{history:[]},locker:{cooldowns:{},log:[]},focus:"equilibrado",playerDataVersion:3}};
  return {state,club,api:{club:()=>club}};
}
test("M03.7 first monthly forecast migrates missing contracts and preserves budget",()=>{
  const {state,club,api}=make();
  assert.equal(career.recordPayrollForecast(state,api),null);
  state.day=31;
  const row=career.recordPayrollForecast(state,api);
  assert.ok(row.monthlyRegistered>8000);
  assert.equal(row.missingCount,0);
  assert.equal(row.status,"forecast_only");
  assert.equal(club.budget,12000000);
  assert.ok(club.roster.every(player=>Number(player.salary)>0));
  assert.ok(club.roster.every(player=>Number(player.marketValue)>0));
});
test("M03.7 repeated calls and JSON reload do not duplicate a period",()=>{
  const {state,api}=make();
  career.recordPayrollForecast(state,api);
  state.day=31;
  assert.ok(career.recordPayrollForecast(state,api));
  assert.equal(career.recordPayrollForecast(state,api),null);
  const reloaded=JSON.parse(JSON.stringify(state));
  assert.equal(career.recordPayrollForecast(reloaded,api),null);
  assert.equal(reloaded.coachCareer.payrollForecast.entries.length,1);
});
test("M03.7 changing clubs resets the forecast and preserves finances",()=>{
  const {state,club,api}=make();
  career.recordPayrollForecast(state,api);
  state.day=31;
  career.recordPayrollForecast(state,api);
  const second={id:"b",budget:90000,roster:[]};
  state.clubId="b";
  career.recordPayrollForecast(state,{club:()=>second});
  assert.equal(state.coachCareer.payrollForecast.clubId,"b");
  assert.equal(state.coachCareer.payrollForecast.entries.length,0);
  assert.equal(second.budget,90000);
  assert.equal(club.budget,12000000);
});
