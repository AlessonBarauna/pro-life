"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const previous=globalThis.ProLife;
globalThis.ProLife={overall:p=>p.ovr??p.overall??65};
const app=require("../src/application/game.js");
const star={ovr:84,age:21,potential:88,salary:3000};
const small={ovr:65,age:27,potential:68,salary:1000};
test("M03.4 high-rated player gets market wage despite legacy salary",()=>{
  const req=app.coachContractRequirements(star,{strength:75},{strength:85},"important",3);
  assert.ok(req.requiredSalary>100000);
  assert.equal(req.requiredSalary%1000,0);
  assert.ok(req.suggestedBonus>0);
});
test("M03.4 squad role and prestige influence asking wage",()=>{
  const base=app.coachContractRequirements(star,{strength:70},{strength:80},"rotation",3);
  const starRole=app.coachContractRequirements(star,{strength:95},{strength:70},"star",3);
  assert.ok(starRole.requiredSalary>base.requiredSalary);
});
test("M03.4 salary preserves higher existing monthly wage as baseline",()=>{
  const reference=app.coachContractRequirements(small,{strength:65},{strength:65},"important",3);
  const high=app.coachContractRequirements({...small,salary:500000},{strength:65},{strength:65},"important",3);
  assert.ok(high.requiredSalary>=500000);
  assert.ok(high.requiredSalary>reference.requiredSalary);
});
test("M03.4 wages and suggested bonuses are safe positive integers",()=>{
  for(const rating of [50,65,75,84,92]){
    const res=app.coachContractRequirements({ovr:rating,age:24},{strength:80},{strength:60},"starter",4);
    assert.ok(Number.isSafeInteger(res.requiredSalary)&&res.requiredSalary>0);
    assert.ok(Number.isSafeInteger(res.suggestedBonus)&&res.suggestedBonus>0);
  }
});
globalThis.ProLife=previous;
