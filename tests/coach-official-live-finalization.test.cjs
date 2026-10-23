"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const D=require("../src/domain/engine.js");

test("official interactive result retains existing match registration pipeline",()=>{
  new vm.Script(engine);
  assert.match(engine,/function stageCoachLiveResult\(s,fixture,controller\)/);
  assert.match(engine,/!controller\?\.finished\|\|!controller\.result/);
  assert.match(engine,/coachLiveFixtureKey\(pending\)===key/);
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
  assert.doesNotMatch(app,/length===prior/,
    "histórico limitado não pode ser confundido com falha de registro");
});

test("legacy simulation remains available when no live result is staged",()=>{
  assert.match(engine,/const useLive=staged&&s\.mode==="coach"/);
  assert.match(engine,/coachLiveFixtureKey\(staged\)/);
  assert.match(engine,/useLive \? staged\.result : simulate/);
});

test("coach result confirmation accepts legacy scalar ids and is idempotent",()=>{
  const state={mode:"coach",day:4,clubId:1};
  const fixture={date:"5",home:"1",away:"2"};
  const controller={finished:true,result:{date:0,home:1,away:2,hg:3,ag:1}};
  assert.equal(D.coachLiveResultIssue(state,fixture,controller),null);
  assert.equal(D.stageCoachLiveResult(state,fixture,controller),true);
  assert.equal(D.stageCoachLiveResult(state,fixture,controller),true,
    "o segundo clique em continuar não pode invalidar a mesma partida");
  D.discardCoachLiveResult(state);
});

test("an abandoned live result does not block the next official fixture",()=>{
  const state={mode:"coach",day:9,clubId:"club"};
  const first={date:10,home:"club",away:"a"};
  const second={date:11,home:"b",away:"club"};
  assert.equal(D.stageCoachLiveResult(state,first,{finished:true,result:{home:"club",away:"a"}}),true);
  state.day=10;
  assert.equal(D.stageCoachLiveResult(state,second,{finished:true,result:{home:"b",away:"club"}}),true);
  D.discardCoachLiveResult(state);
});
