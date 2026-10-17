"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {registerRevenueContract,revenueContractsSnapshot}=require("../src/domain/club-economy.js");
const make=()=>({clubId:"sp",day:120,coachCareer:{finance:{}},clubs:[{id:"sp",budget:100000000}]});
test("M04.8 registers future sponsorship without changing club budget",()=>{
 const s=make();const e=registerRevenueContract(s,"sp",{id:"sponsor-1",type:"sponsorship",annualAmount:12000000,startDay:121,durationDays:365});
 assert.equal(e.postedAmount,0);assert.deepEqual(e.postedPeriods,[]);
 assert.equal(e.endDay,486);
 assert.equal(s.clubs[0].budget,100000000);
 assert.equal(s.coachCareer.finance.revenueHistory[0].amount,0);
});
test("M04.8 rejects duplicates and retroactive revenue contracts",()=>{
 const s=make();const data={id:"a",type:"broadcast",annualAmount:25000000,startDay:120,durationDays:365};
 registerRevenueContract(s,"sp",data);
 assert.throws(()=>registerRevenueContract(s,"sp",data));
 assert.throws(()=>registerRevenueContract(s,"sp",{...data,id:"b",startDay:119}));
 assert.equal(s.coachCareer.finance.revenueContracts.length,1);
});
test("M04.8 contract snapshot is detached from saved arrays",()=>{
 const s=make();registerRevenueContract(s,"sp",{id:"a",type:"broadcast",annualAmount:25000000,startDay:120,durationDays:365});
 const rows=revenueContractsSnapshot(s,"sp");rows[0].postedPeriods.push(42);
 assert.deepEqual(s.coachCareer.finance.revenueContracts[0].postedPeriods,[]);
});
test("M04.8 rejects unauthorized clubs and invalid amounts",()=>{
 const s=make();const d={id:"a",type:"sponsorship",annualAmount:10,startDay:120,durationDays:365};
 assert.throws(()=>registerRevenueContract(s,"other",d));
 assert.throws(()=>registerRevenueContract(s,"sp",{...d,annualAmount:-1}));
});
