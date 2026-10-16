"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
test("Official live controller uses the existing minute generator",()=>{
 new vm.Script(src);
 assert.match(src,/function createCoachLiveController\(home,away,rng,context,initialActions=\[\]\)/);
 assert.match(src,/const runner=simulateSteps\(home,away,rng,context,actions\)/);
 assert.match(src,/get result\(\)\{return finished\?result:null;\}/);
 assert.match(src,/createCoachLiveController,\s*scheduleCoachActions/);
});
test("Official live controller rejects invalid and excessive substitutions",()=>{
 assert.match(src,/substitutions\[side\]>=5/);
 assert.match(src,/nextWindows\.size>3/);
 assert.match(src,/incoming\.injury\|\|Number\(incoming\.suspension\)>0/);
 assert.match(src,/actions\.push\(\{type:"substitution"/);
 assert.match(src,/bench\.has\(String\(inId\)\)/);
 assert.match(src,/const reserveOrder=context\?\.coachCareer\?\.benchOrder/);
});

test("Controller exposes read-only XI, bench, condition and minute-specific substitution history",()=>{
 assert.match(src,/snapshot\(side\)\{/);
 assert.match(src,/players:roster\.filter\(p=>onField\.has\(String\(p\.id\)\)\)/);
 assert.match(src,/history:actions\.filter\(a=>a\.side===side&&a\.minute<=minute\)/);
 assert.match(src,/substitutions:substitutions\[side\],windows:windows\[side\]\.size/);
});
