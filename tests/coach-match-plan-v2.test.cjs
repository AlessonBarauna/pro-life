const test=require("node:test"),assert=require("node:assert/strict");
const Engine=require("../src/domain/engine.js");
const fixture={home:"a",away:"b",date:8};
function state(){
 const player=(id,pos="ATA")=>({id,pos,injury:0,suspension:0,condition:100});
 const roster=[player("p1"),player("p12"),player("p13")];
 return {mode:"coach",day:7,clubId:"a",matches:[],clubs:[{id:"a",lineup:["p1"],roster}]};
}
test("coach-only queue accepts future fixture with valid same-team substitution",()=>{
 const s=state(),before=JSON.stringify(s);assert.equal(Engine.scheduleCoachActions(s,fixture,[{type:"substitution",side:0,minute:65,outId:"p1",inId:"p12"}]),true);
 assert.equal(Object.hasOwn(s,"coachActionPlans"),false);
 assert.equal(JSON.stringify(s),before);
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
