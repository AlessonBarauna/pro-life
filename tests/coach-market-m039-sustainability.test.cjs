"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M03.9 UI JavaScript parses",()=>new vm.Script(source));
test("M03.9 ratio is presented as diagnostic not wage budget",()=>{
  assert.match(source,/annualWageToTransferRatio/);
  assert.match(source,/Não representa disponibilidade para salários/);
  assert.match(source,/Cobrança automática desativada/);
});
test("M03.9 diagnostic does not mutate club budget",()=>{
  const start=source.indexOf("    // M03.9:");
  const end=source.indexOf("    const payrollPanel=",start);
  assert.ok(start>=0&&end>start);
  assert.doesNotMatch(source.slice(start,end),/\.budget\s*[-+*/]?=/);
});
