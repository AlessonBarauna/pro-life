"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("E10 player roles saved for coach and passed into match-side club",()=>{
 assert.match(game,/s\.coachCareer\.playerRoles\[player\.id\]=\{position,role:data\.role\}/);
 assert.match(game,/club\.coachPlayerRoles\[player\.id\]=\{position,role:data\.role\}/);
 assert.match(engine,/clubs\[side\]\?\.coachPlayerRoles/);
 assert.match(engine,/squads\[side\]\.map\(p=>roles\[p\.id\]\?\.role\)/);
});
test("E10 individual role bonuses are bounded and optional",()=>{
 assert.match(engine,/if\(!roles\)continue/);
 assert.match(engine,/Math\.min\(2,offensive\*0\.3\)/);
 assert.match(engine,/Math\.min\(2,defensive\*0\.3\)/);
});
test("E10 collective tactics, presets and XI remain integrated",()=>{
 assert.match(game,/club\.coachTactics=\{style,pressing,buildup,width,depth\}/);
 assert.match(game,/execute\(s,"coachTeamTactics",\{\.\.\.saved\.settings\}\)/);
 assert.match(ui,/data-coach-formation/);
 assert.match(ui,/data-squad-undo/);
});
