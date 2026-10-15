"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
test("E07 shows distinct tactical phases",()=>{
 assert.match(app,/data-squad-phase="with-ball"/);
 assert.match(app,/data-squad-phase="without-ball"/);
 assert.match(app,/phaseDescription/);
 assert.match(app,/squadPhase=next;render\(\)/);
});
test("E07 stores match-facing tactics and applies bounded simulation effects",()=>{
 assert.match(game,/club\.coachTactics=\{style,pressing,buildup,width,depth\}/);
 assert.match(engine,/const t=clubs\[side\]\?\.coachTactics/);
 assert.match(engine,/tactical\[side\]\.attack\+=/);
 assert.match(engine,/tactical\[side\]\.defense\+=/);
 assert.match(engine,/Math\.max\(20,Math\.min\(80/);
});
