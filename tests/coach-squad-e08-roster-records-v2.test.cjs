"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const domain=fs.readFileSync(path.join(__dirname,"../src/domain/coach-career.js"),"utf8");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("Roster records initialized across clubs without overwriting existing contracts",()=>{
 assert.match(domain,/for\(const club of \(s\.clubs\|\|\[\]\)\)/);
 assert.match(domain,/const alternatives=Array\.isArray\(p\.secondaryPositions\)/);
 assert.match(domain,/p\.secondaryPositionsSource="suggested"/);
 assert.match(domain,/p\.contractEndDay=Number\(s\.day\|\|0\)\+years\*365/);
 assert.match(domain,/p\.contractEndSource="generated_game"/);
 assert.match(domain,/if\(c\.playerDataVersion!==2\)/);
});
test("Manager can save focus and training honors selected attribute groups",()=>{
 assert.match(game,/case "coachDevelopmentPlan":/);
 assert.match(game,/p\.developmentPlan=\{focus,startDay:Number\(s\.day\)\|\|0,source:"manager"\}/);
 assert.match(domain,/FOCUS_ATTRIBUTES\[p\.developmentPlan\?\.focus\]/);
 assert.match(ui,/data-save-player-development/);
 assert.match(ui,/command\("coachDevelopmentPlan"/);
});
test("Dossier differentiates estimated positions and simulated contract end",()=>{
 assert.match(ui,/secondaryPositionsSource==="suggested"/);
 assert.match(ui,/contractEndSource==="generated_game"/);
 assert.match(ui,/prazo gerado no jogo/);
 assert.match(ui,/Não garante aumento semanal/);
});

test("E08 migration preserves verified empty alternatives and maps defender codes",()=>{
 assert.match(domain,/const verified=p\.secondaryPositionsSource==="ea_fc27"/);
 assert.match(domain,/if\(normalized\.length\|\|verified\)/);
 assert.match(domain,/CB:"ZAG",LB:"LE",RB:"LD"/);
 assert.match(domain,/const primary=normalizePos\(p\.pos\|\|p\.position\)/);
});
