"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");

test("official interactive result retains existing match registration pipeline",()=>{
  new vm.Script(engine);
  assert.match(engine,/function stageCoachLiveResult\(s,fixture,controller\)/);
  assert.match(engine,/!controller\?\.finished\|\|!controller\.result/);
  assert.match(engine,/if\(coachLiveResults\.has\(s\)\)return false/);
  assert.match(engine,/const m = useLive \? staged\.result : simulate\(hc, ac, rng, s, eligibleActions\)/);
  assert.match(engine,/if\(useLive\)coachLiveResults\.delete\(s\)/);
  assert.match(engine,/Statistics\?\.recordMatch\(s, m\)/);
  assert.match(engine,/processDiscipline\(s,m,disciplineMeta,hc,ac\)/);
});

test("coach live overlay completes interactive result before advancing career",()=>{
  new vm.Script(app);
  assert.match(app,/D\.createCoachLiveController\(home,away,rng,state,existingActions\)/);
  assert.match(app,/if\(!live\.finished\|\|!live\.result\)/);
  assert.match(app,/D\.stageCoachLiveResult\?\.\(state,next,live\)/);
  assert.match(app,/try\{D\.advance\(state,1\);\}/);
  assert.match(app,/D\.discardCoachLiveResult\?\.\(state\)/);
});

test("legacy simulation remains available when no live result is staged",()=>{
  assert.match(engine,/const useLive=staged&&s\.mode==="coach"/);
  assert.match(engine,/staged\.date===s\.day/);
  assert.match(engine,/staged\.home===homeId&&staged\.away===awayId/);
  assert.match(engine,/useLive \? staged\.result : simulate/);
});
