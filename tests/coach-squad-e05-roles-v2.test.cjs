"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("E05 role action validates player membership and role by assigned position",()=>{
 const section=game.split('case "coachPlayerRole": {')[1]?.split('case "coachFormation":')[0];
 assert.ok(section);
 assert.match(section,/club\.roster\?\.find\(p=>p\.id===data\.playerId\)/);
 assert.match(section,/roles\[position\]\?\.includes\(data\.role\)/);
 assert.match(section,/s\.coachCareer\.playerRoles\[player\.id\]=\{position,role:data\.role\}/);
});
test("E05 role interface supports selected field slot and persists via command",()=>{
 assert.match(app,/const selectedSlot=rows\.flatMap/);
 assert.match(app,/data-coach-player-role/);
 assert.match(app,/data-coach-role-save/);
 assert.match(app,/command\("coachPlayerRole"/);
 assert.match(app,/ainda não alteram o motor da partida/);
});
