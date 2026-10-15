"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("E04 formation uses validated manager command without changing lineup",()=>{
 const block=game.split('case "coachFormation": {')[1]?.split('case "lineup": {')[0];
 assert.ok(block);
 for(const id of ["4-3-3","4-4-2","4-2-3-1"])assert.ok(block.includes(id));
 assert.match(block,/c\.formation=data\.value/);
 assert.doesNotMatch(block,/c\.lineup\s*=/);
 assert.match(block,/delete s\.coachCareer\.pitchSlots/);
});
test("E04 selection is available in the coach pitch and resets stale undo",()=>{
 assert.match(app,/select data-coach-formation/);
 assert.match(app,/A\.execute\(state,"coachFormation",\{value:e\.target\.value\}\)/);
 assert.match(app,/squadUndo=null;squadSwapSource=null;persist\(\);render\(\)/);
 assert.match(app,/const formation=coach\?\(c\.formation/);
});

test("E04 positional fit prefers compatible athletes and reports forced improvisation",()=>{
 assert.match(app,/const fit=\(role,p\)=>/);
 assert.match(app,/Array\.isArray\(p\.secondaryPositions\)/);
 assert.match(app,/if\(role==="GOL"\|\|all\.includes\("GOL"\)\)return 0/);
 assert.match(app,/const pitchFitWarnings=coach\?/);
 assert.match(app,/pl-squad-fit-note/);
 assert.match(app,/pitchSlots=rows\.flatMap/);
});
