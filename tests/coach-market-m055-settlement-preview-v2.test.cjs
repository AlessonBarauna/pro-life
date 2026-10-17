"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M05.5 summary requires club acceptance and accepted player contract",()=>{
 assert.match(src,/const settlementReady=selected\?\.status==="pending"&&selected\?\.response==="accepted"&&contract\?\.status==="accepted"/);
 assert.match(src,/const settlementSummary=settlementReady/);
 assert.match(src,/budget-settlementFee-settlementBonus/);
 assert.match(src,/Nenhum valor foi debitado/);
});
test("M05.5 arrival panel uses existing coach presentation records",()=>{
 assert.match(src,/c\.presentations\|\|\[\]/);
 assert.match(src,/x\.toClubId===s\.clubId/);
 assert.match(src,/x\.presented\?"Apresentação realizada":"Apresentação pendente"/);
 assert.match(src,/detail\+signingPanel/);
});
