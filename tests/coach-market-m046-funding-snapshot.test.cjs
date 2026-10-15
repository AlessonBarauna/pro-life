"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const {fundingSnapshot}=require("../src/domain/club-economy.js");
test("M04.6 counts only active positive recurring revenue and preserves inputs",()=>{
 const club={id:"sp",budget:12000000},finance={recurringRevenues:[
 {active:true,monthlyAmount:250000},{active:false,monthlyAmount:900000},
 {active:true,monthlyAmount:-100},{active:true,monthlyAmount:"none"}]};
 const before=JSON.stringify([club,finance]);
 const r=fundingSnapshot(club,finance,300000);
 assert.equal(r.monthlyRevenue,250000);
 assert.equal(r.annualRevenue,3000000);
 assert.equal(r.fundingGap,50000);
 assert.equal(r.salaryBudget,null);
 assert.equal(JSON.stringify([club,finance]),before);
});
test("M04.6 independent wage budget is not transfer budget",()=>{
 const club={id:"sp",budget:99999999};
 const r=fundingSnapshot(club,{salaryBudget:350000,recurringRevenues:[]},400000);
 assert.equal(r.salaryBudget,350000);
 assert.equal(r.salaryBudgetGap,50000);
 assert.equal(club.budget,99999999);
 assert.equal(r.readOnly,true);
});
test("M04.6 absent finance does not invent income",()=>{
 const r=fundingSnapshot({},undefined,100000);
 assert.equal(r.revenueConfigured,false);
 assert.equal(r.monthlyRevenue,0);
 assert.equal(r.salaryBudget,null);
});
test("M04.6 finance view has safe read-only funding panel",()=>{
 const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 new vm.Script(source);
 assert.match(source,/ProLifeClubEconomy\?\.fundingSnapshot/);
 assert.match(source,/Orçamento salarial independente:/);
});
