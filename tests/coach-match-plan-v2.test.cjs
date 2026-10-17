const test=require("node:test"),assert=require("node:assert/strict");
const Engine=require("../src/domain/engine.js");
const fixture={home:"a",away:"b",date:8};
function state(){return {mode:"coach",day:7,clubId:"a",matches:[]};}
test("coach-only queue accepts future fixture with valid same-team substitution",()=>{
 const s=state();assert.equal(Engine.scheduleCoachActions(s,fixture,[{type:"substitution",side:0,minute:65,outId:"p1",inId:"p12"}]),true);
 assert.equal(Object.hasOwn(s,"coachActionPlans"),false);
 assert.equal(JSON.stringify(s).includes("p12"),false);
});
test("queued official coach actions reject opponent, duplicated player and finalized game",()=>{
 let s=state();assert.equal(Engine.scheduleCoachActions(s,fixture,[{type:"substitution",side:1,minute:65,outId:"p1",inId:"p12"}]),false);
 assert.equal(Engine.scheduleCoachActions(s,fixture,[{type:"substitution",side:0,minute:65,outId:"p1",inId:"p12"},{type:"substitution",side:0,minute:70,outId:"p1",inId:"p13"}]),false);
 s.matches=[{...fixture,hg:2,ag:0}];assert.equal(Engine.scheduleCoachActions(s,fixture,[]),false);
});
test("pending coach fixture queue does not allow player mode or past games",()=>{
 const s=state();s.mode="player";assert.equal(Engine.scheduleCoachActions(s,fixture,[]),false);
 s.mode="coach";s.day=9;assert.equal(Engine.scheduleCoachActions(s,fixture,[]),false);
});
