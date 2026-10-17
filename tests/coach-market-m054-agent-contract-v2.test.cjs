"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M05.4 renders agent contract with grouped inputs and feedback",()=>{
 for(const token of ["cc-agent-contract","cc-agent-grid","cc-agent-feedback","cc-agent-head"])assert.ok(src.includes(token));
 for(const field of ["data-coach-contract-salary","data-coach-contract-years","data-coach-contract-bonus","data-coach-contract-role"])assert.ok(src.includes(field));
});
test("M05.4 retains contract negotiation and finance controls",()=>{
 assert.match(src,/data-coach-contract-negotiate/);
 assert.match(src,/const contractCosts=/);
 assert.match(src,/const referenceHint=/);
 assert.match(src,/const agreedContractPanel=/);
});
