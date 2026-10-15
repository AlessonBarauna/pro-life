const test=require("node:test");
const assert=require("node:assert/strict");
const rating=require("../src/domain/coach-match-rating.js");
test("T1 neutral context retains base GER without mutating player",()=>{
  const player={overall:80,form:50,morale:50,condition:100};
  const before=JSON.stringify(player);
  const r=rating.evaluate(player);
  assert.equal(r.base,80);
  assert.equal(r.effective,80);
  assert.equal(JSON.stringify(player),before);
});
test("T1 form and morale reward performance but clamp to 100",()=>{
  const r=rating.evaluate({overall:99,form:100,morale:100});
  assert.equal(r.effective,100);
  assert.equal(r.modifier,8);
});
test("T1 fatigue, low condition and position penalize independently",()=>{
  const r=rating.evaluate({overall:80,condition:60},{fatigue:50,outOfPosition:true,tacticalFit:75});
  assert.equal(r.effective,65);
  assert.deepEqual(r.contributions.filter(x=>x.value!==0).map(x=>x.id),["condition","fatigue","tactical","position"]);
});
test("T1 injury blocks availability and keeps underlying rating",()=>{
  const player={overall:76,injured:true};
  const r=rating.evaluate(player);
  assert.equal(r.available,false);
  assert.equal(r.base,76);
  assert.equal(player.overall,76);
});
test("T1 accepts empty, invalid and legacy values safely",()=>{
  const r=rating.evaluate({ger:88,form:"unknown",morale:null,condition:-10},{fatigue:250});
  assert.ok(r.effective>=1&&r.effective<=100);
  assert.equal(r.base,88);
  assert.equal(r.contributions.length,7);
});
