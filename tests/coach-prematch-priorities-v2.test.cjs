const test=require("node:test");
const assert=require("node:assert/strict");
const {analyze,priorities}=require("../src/domain/coach-prematch-briefing-v2.js");
test("T1 priorities order unavailable before low condition",()=>{
 const p=[{id:"a",position:"ATA",overall:80,condition:40},{id:"b",position:"ATA",overall:90,injured:true}];
 const out=priorities(analyze(p,["ATA","ATA"],["a","b"]));
 assert.deepEqual(out.map(x=>x.type),["injury","condition"]);
});
test("T1 priorities include replacement without editing actual lineup",()=>{
 const p=[{id:"a",position:"ATA",overall:90,injured:true},{id:"b",position:"ATA",overall:76}];
 const chosen=["a"];
 const out=priorities(analyze(p,["ATA"],chosen));
 assert.equal(out[0].recommendedId,"b");
 assert.deepEqual(chosen,["a"]);
});
test("T1 priorities supports empty results and safe limits",()=>{
 assert.deepEqual(priorities(null),[]);
 assert.deepEqual(priorities({concerns:[{type:"empty",index:0}]},{max:0}),[]);
});
