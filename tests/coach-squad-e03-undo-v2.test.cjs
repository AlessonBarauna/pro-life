"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-05b-squad.css"),"utf8");
test("E03 undo snapshots XI and pitch slots before swap",()=>{
 assert.match(app,/const previous=\{clubId:club\.id,day:state\.day,lineup:/);
 assert.match(app,/pitchSlots:Array\.isArray\(state\.coachCareer\?\.pitchSlots\)/);
 assert.match(app,/squadUndo=previous/);
});
test("E03 undo restores XI through authoritative lineup action",()=>{
 assert.match(app,/data-squad-undo/);
 assert.match(app,/A\.execute\(state,"lineup",\{ids:\[\.\.\.undo\.lineup\]\}\)/);
 assert.match(app,/state\.coachCareer\.pitchSlots=\[\.\.\.undo\.pitchSlots\]/);
 assert.match(app,/squadUndo=null;squadSwapSource=null;persist\(\);render\(\)/);
});
test("E03 undo is unavailable for other clubs or days",()=>{
 assert.match(app,/undo\.clubId!==club\.id\|\|undo\.day!==state\.day/);
 assert.match(css,/\.pl-squad-pitch-tools button:disabled/);
});
