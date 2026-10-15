"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const {registerRevenueContract,revenueSchedule}=require("../src/domain/club-economy.js");
function state(){return {day:100,clubId:"sp",coachCareer:{finance:{}},clubs:[{id:"sp",budget:45000000}]};}
test("M04.9 computes future 30-day receivables without booking revenue",()=>{
 const s=state();registerRevenueContract(s,"sp",{id:"s1",type:"sponsorship",annualAmount:12000000,startDay:100,durationDays:90});
 const before=JSON.stringify(s),items=revenueSchedule(s,"sp");
 assert.deepEqual(items.map(x=>x.dueDay),[130,160,190]);
 assert.equal(items[0].expectedAmount,1000000);
 assert.equal(items[0].status,"forecast_only");
 assert.equal(JSON.stringify(s),before);
 assert.equal(s.clubs[0].budget,45000000);
});
test("M04.9 excludes overdue events and completed periods",()=>{
 const s=state();registerRevenueContract(s,"sp",{id:"s1",type:"broadcast",annualAmount:24000000,startDay:100,durationDays:180});
 s.day=165;
 s.coachCareer.finance.revenueContracts[0].postedPeriods=[3];
 assert.deepEqual(revenueSchedule(s,"sp").map(x=>x.dueDay),[220,250,280]);
});
test("M04.9 finance view displays career dates rather than day numbers",()=>{
 const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 new vm.Script(source);
 assert.match(source,/revenueSchedulePanel/);
 assert.match(source,/careerDate\(s,x\.dueDay\)/);
 assert.match(source,/Início '\+careerDate\(s,x\.startDay\)/);
});
