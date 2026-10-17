"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const career=require("../src/domain/coach-career.js");
const club={id:"sp",budget:10000000,roster:[{id:"a",salary:5000},{id:"b"}]};
const make=()=>({mode:"coach",clubId:"sp",day:20,coachCareer:{version:1,loans:[],finance:{recurringRevenues:[]}},clubs:[structuredClone(club)]});
test("M03.12 blocks settlements with missing wages and missing revenue",()=>{
 const s=make(),before=JSON.stringify(s);
 const r=career.payrollReadiness(s,{club:()=>s.clubs[0]});
 assert.equal(r.ready,false);
 assert.equal(r.missing,1);
 assert.equal(r.revenueSources,0);
 assert.ok(r.reasons.some(x=>x.includes("automatico")));
 assert.equal(JSON.stringify(s),before);
});
test("M03.12 still blocks until separate payment authorization",()=>{
 const s=make();s.clubs[0].roster[1].salary=7000;
 s.coachCareer.finance.salaryBudget=120000;
 s.coachCareer.finance.recurringRevenues=[{active:true,monthlyAmount:90000}];
 const r=career.payrollReadiness(s,{club:()=>s.clubs[0]});
 assert.equal(r.ready,false);
 assert.equal(r.missing,0);
 assert.equal(r.revenueSources,1);
 assert.ok(r.reasons.includes("Pagamento automatico ainda nao autorizado"));
});
test("M03.12 loan split requires further validation",()=>{
 const s=make();s.coachCareer.loans=[{playerId:"a",fromClubId:"sp",toClubId:"other",salaryShare:50,returned:false}];
 const r=career.payrollReadiness(s,{club:()=>s.clubs[0]});
 assert.equal(r.loans,1);
 assert.ok(r.reasons.some(x=>x.includes("emprestimos")));
});
