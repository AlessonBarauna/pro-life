"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {estimate}=require("../src/domain/club-economy.js");
test("M04.1 club valuation increases with structure within same league",()=>{
 const smaller=estimate({id:"small",structure:45,leagueId:"serieA",budget:5000000});
 const bigger=estimate({id:"big",structure:85,leagueId:"serieA",budget:100000000});
 assert.ok(bigger.economicValue>smaller.economicValue);
 assert.ok(bigger.suggestedTransferBudget>smaller.suggestedTransferBudget);
});
test("M04.1 leaves original club and its budget unchanged",()=>{
 const club={id:"team",structure:72,leagueId:"serieB",budget:11000000,roster:[{id:"1"}]};
 const old=JSON.stringify(club);
 const result=estimate(club);
 assert.equal(JSON.stringify(club),old);
 assert.equal(result.currentBudget,11000000);
 assert.equal(result.readOnly,true);
});
test("M04.1 league tier influences independent valuation",()=>{
 const top=estimate({structure:60,leagueId:"serieA"});
 const lower=estimate({structure:60,leagueId:"serieD"});
 assert.ok(top.economicValue>lower.economicValue);
});
