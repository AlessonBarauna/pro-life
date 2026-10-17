"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("Official pregame planner renders and compiles",()=>{
 new vm.Script(src);
 assert.match(src,/data-coach-plan-official-sub/);
 assert.match(src,/data-official-sub-save/);
 assert.match(src,/data-official-sub-out/);
 assert.match(src,/data-official-sub-in/);
 assert.match(src,/data-official-sub-minute/);
});
test("Planner schedules, never precommits a result",()=>{
 assert.match(src,/D\.scheduleCoachActions\?\.\(state,next,\[\{type:"substitution"/);
 assert.match(src,/next\.date!==state\.day\+1/);
 assert.match(src,/club\.roster\.filter\(p=>valid\(p\)/);
});
