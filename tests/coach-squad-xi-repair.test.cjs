"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("XI repair is a deliberate action, not an automatic save migration",()=>{
 new vm.Script(src);
 assert.match(src.replace(/\s+/g,""),/data-squad-repair/);
 assert.match(src.replace(/\s+/g,""),/e\.target\.closest\?\.\("\[data-squad-repair\]"\)/);
 assert.match(src.replace(/\s+/g,""),/A\.execute\(state,"lineup",\{ids:chosen\}\)/);
 assert.match(src.replace(/\s+/g,""),/squadUndo=previous/);
});
test("XI repair reserves goalkeeper and checks exactly eleven unique players",()=>{
 assert.match(src,/if\(role==="GOL"\)return positions\.includes\("GOL"\)\?10000:-100000/);
 assert.match(src,/if\(positions\.includes\("GOL"\)\)return -100000/);
 assert.match(src,/chosen\.length!==11\|\|new Set\(chosen\)\.size!==11/);
 assert.match(src.replace(/\s+/g,""),/state\.coachCareer\.pitchSlots=\[\.\.\.chosen\]/);
});
