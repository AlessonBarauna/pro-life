"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {calibration,estimate}=require("../src/domain/club-economy.js");
test("M04.3 calibration categorizes low, normal and high budgets",()=>{
 const base={id:"a",structure:70,leagueId:"serieA"};
 const reference=estimate(base).suggestedTransferBudget;
 const clubs=[
  {...base,id:"low",budget:reference*.2},
  {...base,id:"normal",budget:reference},
  {...base,id:"high",budget:reference*3},
  {...base,id:"missing"}
 ];
 const before=JSON.stringify(clubs);
 const report=calibration(clubs);
 assert.deepEqual(report.counts,{sem_orcamento:1,abaixo_da_referencia:1,acima_da_referencia:1,dentro_da_faixa:1});
 assert.equal(report.total,4);
 assert.equal(JSON.stringify(clubs),before);
});
test("M04.3 calibration does not modify existing club budgets",()=>{
 const club={id:"club",structure:80,leagueId:"serieB",budget:12500000};
 const result=calibration([club]);
 assert.equal(club.budget,12500000);
 assert.equal(result.rows[0].currentBudget,12500000);
 assert.equal(result.readOnly,true);
});
test("M04.3 calibration handles empty or invalid inputs",()=>{
 assert.equal(calibration(null).total,0);
 assert.equal(calibration([{},null,{id:"ok",budget:0}]).total,1);
});
