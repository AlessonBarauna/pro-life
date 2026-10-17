"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M05.5 preview only follows accepted proposal and contract",()=>{
 assert.match(source,/const settlementReady=selected\?\.status==="pending"&&selected\?\.response==="accepted"&&contract\?\.status==="accepted"/);
 assert.match(source,/const settlementSummary=settlementReady/);
 assert.match(source,/budget-settlementFee-settlementBonus/);
 assert.match(source,/Nenhum valor foi debitado/);
});
test("M05.5 reinforcement tracking derives from persisted presentations",()=>{
 assert.match(source,/c\.presentations\|\|\[\]/);
 assert.match(source,/x\.toClubId/);
 assert.match(source,/x\.presented\?"Apresentação realizada":"Apresentação pendente"/);
 assert.match(source,/detail\+signingPanel/);
});
