"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
test("E09 presets are club-specific with three validated slots",()=>{
 const block=game.split('case "coachTacticPreset": {')[1]?.split('case "coachTeamTactics":')[0];
 assert.ok(block);
 assert.match(block,/slot<1\|\|slot>3/);
 assert.match(block,/presets\[club\.id\]/);
 assert.match(block,/clubPresets\[slot\]=\{name,settings:\{\.\.\.settings\}\}/);
 assert.match(block,/execute\(s,"coachTeamTactics",\{\.\.\.saved\.settings\}\)/);
});
test("E09 preset controls are in tactics screen only, not hierarchy audit",()=>{
 assert.match(app,/data-coach-preset-save/);
 assert.match(app,/data-coach-preset-load/);
 assert.match(app,/command\("coachTacticPreset"/);
 assert.doesNotMatch(app,/AUDITORIA FC27/);
 assert.doesNotMatch(app,/positionAudit/);
});
