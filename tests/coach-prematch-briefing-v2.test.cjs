const test=require("node:test");
const assert=require("node:assert/strict");
const {analyze}=require("../src/domain/coach-prematch-briefing-v2.js");
test("T1 prematch detects missing player and makes replacement suggestion",()=>{
 const r=analyze([{id:"a",position:"GOL",overall:78}],["GOL"],[]);
 assert.equal(r.ready,false);
 assert.equal(r.concerns[0].type,"empty");
 assert.equal(r.lines[0].recommendedId,"a");
});
test("T1 prematch warns about low fitness and injury",()=>{
 const p=[{id:"a",position:"ATA",overall:80,condition:40},{id:"b",position:"ATA",overall:90,injured:true}];
 const r=analyze(p,["ATA","ATA"],["a","b"]);
 assert.deepEqual(r.concerns.map(x=>x.type),["condition","injury"]);
});
test("T1 prematch never mutates selected lineup or roster",()=>{
 const p=[{id:"a",position:"GOL",overall:72}];const s=["a"];
 const before=JSON.stringify({p,s});
 const r=analyze(p,["GOL"],s);
 assert.equal(r.ready,true);
 assert.equal(r.averageEffective,72);
 assert.equal(JSON.stringify({p,s}),before);
});
test("T1 prematch detects duplicated player",()=>{
 const r=analyze([{id:"a",position:"DEF",overall:72}],["DEF","DEF"],["a","a"]);
 assert.ok(r.concerns.some(x=>x.type==="duplicate"));
});
test("T1 prematch respects contextual tactical mismatch",()=>{
 const p=[{id:"a",position:"ATA",overall:80}];
 const r=analyze(p,["ATA"],["a"],{contextForPlayer:()=>({tacticalFit:0})});
 assert.equal(r.lines[0].effective,72);
 assert.ok(r.lines[0].modifier<=-8);
});
