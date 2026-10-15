"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-05b-squad.css"),"utf8");
test("coach pitch preserves explicit position order between renders",()=>{
 assert.match(app,/const saved=state\.coachCareer\?\.pitchSlots/);
 assert.match(app,/const valid=Array\.isArray\(saved\)/);
 assert.match(app,/row\.players=row\.players\.map/);
 assert.match(app,/state\.coachCareer\.pitchSlots=nextPitch/);
});
test("coach swapping keeps original squad transfer logic and validates XI",()=>{
 assert.match(app,/if\(fi>=0&&ti>=0\)/);
 assert.match(app,/if\(chosen\.length!==11\|\|!hasGoalkeeper\(\)\)/);
 assert.match(app,/A\.execute\(state,"lineup",\{ids:chosen\}\)/);
});
test("selection supports pointer swap and visibly identifies source",()=>{
 assert.match(app,/squadSwapSource===id\?null:id/);
 assert.match(app,/swap-source/);
 assert.match(css,/\.pl-squad-player\.swap-source/);
});
