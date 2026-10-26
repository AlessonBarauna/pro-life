"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M03.6 estimates absent salaries without writing to players",()=>{
  assert.match(source,/const missingSalaries=payrollPlayers\.filter\(p=>!hasWage\(p\)\)/);
  assert.match(source,/minimumMarketSalaryMonthly\?\.\(p\)/);
  assert.match(source,/registeredMonthly\+estimatedMonthly/);
  assert.doesNotMatch(source,/p\.salary\s*=/);
});
test("M03.6 clearly separates contractual wages and defensive fallbacks",()=>{
  assert.match(source,/Salários contratuais:/);
  assert.match(source,/Fallbacks pendentes:/);
  assert.match(source,/contratos já negociados são preservados/);
});
test("M03.6 view file JavaScript parses",()=>{
  new vm.Script(source,{filename:"coach-career-view.js"});
});
