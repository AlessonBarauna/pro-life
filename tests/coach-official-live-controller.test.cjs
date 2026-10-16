"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
test("Official live controller uses the existing minute generator",()=>{
 new vm.Script(src);
 assert.match(src,/function createCoachLiveController\(home,away,rng,context\)/);
 assert.match(src,/const actions=\[\],runner=simulateSteps\(home,away,rng,context,actions\)/);
 assert.match(src,/get result\(\)\{return finished\?result:null;\}/);
 assert.match(src,/createCoachLiveController,\s*scheduleCoachActions/);
});
test("Official live controller rejects invalid and excessive substitutions",()=>{
 assert.match(src,/substitutions\[side\]>=5/);
 assert.match(src,/nextWindows\.size>3/);
 assert.match(src,/incoming\.injury\|\|Number\(incoming\.suspension\)>0/);
 assert.match(src,/actions\.push\(\{type:"substitution"/);
});
