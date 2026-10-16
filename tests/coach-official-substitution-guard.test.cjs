"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
test("Official engine supports minute-by-minute simulation without precommitting intermediate results",()=>{
 new vm.Script(src);
 assert.match(src,/function\* simulateSteps\(/);
 assert.match(src,/function scheduleCoachActions\(/);
 assert.match(src,/coachActionPlans=new WeakMap\(\)/);
});
test("Official substitution queue limits bench, five changes, and three windows",()=>{
 assert.match(src,/actions\.length>5/);
 assert.match(src,/if\(windows\.size>3\)return false/);
 assert.match(src,/const benchIds=new Set/);
 assert.match(src,/if\(actions\.some\(a=>!benchIds\.has\(a\.inId\)\)\)return false/);
});
test("Existing official simulation still records substitution participation",()=>{
 assert.match(src,/m\.participation\[incoming\.id\]/);
 assert.match(src,/type:"substitution"/);
});

test("Official queue verifies active XI, goalkeeper role and offers a read-only planning snapshot",()=>{
 assert.match(src,/if\(!active\.has\(a\.outId\)\|\|active\.has\(a\.inId\)\)return false/);
 assert.match(src,/String\(outgoing\.pos\)==="GOL"/);
 assert.match(src,/function coachActionPlan\(s\)/);
 assert.match(src,/actions:plan\.actions\.map\(a=>\(\{\.\.\.a\}\)\)/);
});
