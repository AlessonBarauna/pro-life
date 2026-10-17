"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"..");
const view=fs.readFileSync(path.join(base,"src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8");
const game=fs.readFileSync(path.join(base,"src/application/game.js"),"utf8");
test("M04.2 allows saved targets to have a validated priority",()=>{
 assert.match(view,/data-coach-target-priority/);
 assert.match(view,/data-coach-save-priority/);
 assert.match(app,/setCoachTargetPriority/);
 assert.match(game,/case "setCoachTargetPriority"/);
 assert.match(game,/\["alta","media","baixa"\]\.includes\(priority\)/);
 assert.match(game,/entry\.priority=priority/);
});
test("M04.2 preserves existing shortlist actions",()=>{
 assert.match(view,/const rankedTargets=shortlist\.slice\(\)\.sort/);
 assert.match(view,/const targetRows=rankedTargets\.map/);
 assert.match(view,/data-coach-shortlist/);
 assert.match(view,/data-coach-scout-select/);
});
