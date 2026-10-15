"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M03.8 view compiles and keeps transfer budget separate",()=>{
 new vm.Script(src,{filename:"coach-career-view.js"});
 assert.match(src,/Orçamento de transferências:/);
 assert.match(src,/Orçamento salarial informativo e separado/);
});
test("M03.8 loans respect receiving club salary share and roster presence",()=>{
 assert.match(src,/const inCurrentRoster=payrollPlayers\.some/);
 assert.match(src,/pct-\(inCurrentRoster\?1:0\)/);
 assert.match(src,/\(1-pct\)-\(inCurrentRoster\?1:0\)/);
});
test("M03.8 wage projection does not debit club budget",()=>{
 const section=src.slice(src.indexOf("    // M03.8:"),src.indexOf("    const payrollPanel=",src.indexOf("    // M03.8:")));
 assert.doesNotMatch(section,/\.budget\s*[-+*/]?=/);
 assert.match(section,/annual:adjustedMonthly\*12/);
});
