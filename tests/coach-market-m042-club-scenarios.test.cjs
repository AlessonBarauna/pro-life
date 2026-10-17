"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {estimate,scenarios,compare}=require("../src/domain/club-economy.js");
test("M04.2 scenario budgets increase without changing original",()=>{
 const club={id:"sp",leagueId:"serieA",structure:78,budget:95000000};
 const previous=JSON.stringify(club);
 const rows=scenarios(club);
 assert.equal(rows.length,3);
 assert.ok(rows[0].proposedTransferBudget<rows[1].proposedTransferBudget);
 assert.ok(rows[1].proposedTransferBudget<rows[2].proposedTransferBudget);
 assert.equal(rows[1].estimatedClubValue,estimate(club).economicValue);
 assert.equal(JSON.stringify(club),previous);
});
test("M04.2 compare respects domestic division differences",()=>{
 const data=["serieA","serieB","serieC","serieD"].map((leagueId,i)=>({id:"club"+i,leagueId,structure:70}));
 const out=compare(data);
 assert.equal(out.length,4);
 for(let i=1;i<out.length;i++)assert.ok(out[i-1].economicValue>out[i].economicValue);
});
test("M04.2 scenarios do not overwrite existing budget and remain read-only",()=>{
 const rows=compare([{id:"x",structure:90,leagueId:"serieA",budget:5000000}]);
 assert.equal(rows[0].currentBudget,5000000);
 assert.ok(rows[0].scenarios.every(x=>x.readOnly&&x.existingBudget===5000000));
});
