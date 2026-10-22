"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const C=require("../src/domain/continental.js");
function game(){
  return {season:2027,day:400,continental:{v:1,finals:{},editions:{
    "ucl:2026":{comp:"ucl",season:2026,calendarMode:"european_v1",status:"ready",leagueSchedule:{matches:[{day:420,played:false,homeId:"a",awayId:"b"}]}},
    "ucl:2027":{comp:"ucl",season:2027,status:"ready",leagueSchedule:{matches:[]}}
  }}};
}
test("edition resolver retains 2026/27 Champions across January rollover",()=>{
  const s=game();
  assert.strictEqual(C.activeEdition(s,"ucl"),s.continental.editions["ucl:2026"]);
  assert.equal(C.edition(s,"ucl"),s.continental.editions["ucl:2027"]);
});
test("legacy unmarked UEFA editions stay on current engine season",()=>{
  const s=game();
  delete s.continental.editions["ucl:2026"].calendarMode;
  assert.strictEqual(C.activeEdition(s,"ucl"),s.continental.editions["ucl:2027"]);
});
test("completed knockout editions stop overriding current year",()=>{
  const s=game();
  s.continental.editions["ucl:2026"].leagueSchedule.matches[0].played=true;
  assert.strictEqual(C.activeEdition(s,"ucl"),s.continental.editions["ucl:2026"],"completed league phase must remain available for knockouts");
  s.continental.editions["ucl:2026"].status="complete";
  assert.strictEqual(C.activeEdition(s,"ucl"),s.continental.editions["ucl:2027"]);
});
test("CONMEBOL keeps calendar-year edition",()=>{
  const s=game();
  const lib={comp:"lib",season:2027,status:"ready"};
  s.continental.editions["lib:2027"]=lib;
  assert.strictEqual(C.activeEdition(s,"lib"),lib);
});
