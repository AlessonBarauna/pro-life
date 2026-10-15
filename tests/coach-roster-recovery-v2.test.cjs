const test=require("node:test");
const assert=require("node:assert/strict");
const rating=require("../src/domain/coach-match-rating.js");

test("T1 roster preview retains ids and player order without mutation",()=>{
  const players=[{id:"a",overall:82,form:75},{id:"b",overall:70,form:25}];
  const original=JSON.stringify(players);
  const rows=rating.evaluateRoster(players);
  assert.deepEqual(rows.map(r=>r.id),["a","b"]);
  assert.ok(rows[0].effective>rows[1].effective);
  assert.equal(JSON.stringify(players),original);
});
test("T1 roster accepts per-player tactical contexts",()=>{
  const rows=rating.evaluateRoster([{id:1,overall:80},{id:2,overall:80}],(p,i)=>({outOfPosition:i===1}));
  assert.equal(rows[0].effective-rows[1].effective,6);
});
test("T1 rest recovery does not mutate save or player",()=>{
  const p={condition:50,physical:{fatigue:60}};
  const original=JSON.stringify(p);
  const next=rating.recovery(p,{days:2});
  assert.deepEqual(next,{condition:66,fatigue:40,days:2});
  assert.equal(JSON.stringify(p),original);
});
test("T1 match and heavy training demand reduce recovery",()=>{
  const p={condition:70,physical:{fatigue:10}};
  const rest=rating.recovery(p,{days:1});
  const loaded=rating.recovery(p,{days:1,trainingLoad:80,playedMinutes:90});
  assert.ok(loaded.condition<rest.condition);
  assert.ok(loaded.fatigue>rest.fatigue);
});
test("T1 preview safely clamps extreme inputs",()=>{
  const r=rating.recovery({condition:99,physical:{fatigue:99}},{days:300,trainingLoad:1000,playedMinutes:999});
  assert.ok(r.condition>=0&&r.condition<=100);
  assert.ok(r.fatigue>=0&&r.fatigue<=100);
  assert.equal(r.days,30);
});
