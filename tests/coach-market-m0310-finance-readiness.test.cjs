"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M03.10 view parses",()=>{new vm.Script(src);});
test("M03.10 only active and valid recurring revenue counted",()=>{
 assert.match(src,/x\.active===true/);
 assert.match(src,/Number\.isFinite\(Number\(x\.monthlyAmount\)\)/);
 assert.match(src,/monthlyRevenue=knownRecurringRevenue\.reduce/);
});
test("M03.10 funding gap stays a forecast",()=>{
 assert.match(src,/financeGap=Math\.max\(0,wageBudgetProjection\.monthly-monthlyRevenue\)/);
 assert.match(src,/Nenhuma receita ou despesa foi lançada/);
 const start=src.indexOf("    // M03.10:");
 const end=src.indexOf("    const payrollPanel=",start);
 assert.doesNotMatch(src.slice(start,end),/\.budget\s*[-+*/]?=/);
});
