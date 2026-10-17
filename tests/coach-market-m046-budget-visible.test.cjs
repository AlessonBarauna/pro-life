"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M04.6 finance view parses",()=>new vm.Script(src));
test("M04.6 wage budget always has a fallback if economy module is absent",()=>{
 assert.match(src,/ProLifeClubEconomy\?\.fundingSnapshot\?\.\(own,c\.finance,wageBudgetProjection\.monthly\)\|\|\{/);
 assert.match(src,/annualRevenue:monthlyRevenue\*12/);
 assert.match(src,/fundingDetails\+/);
 assert.match(src,/Orçamento salarial independente:/);
});
