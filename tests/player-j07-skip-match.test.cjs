"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const s=fs.readFileSync("src/ui/app.js","utf8");
const engine=fs.readFileSync("src/domain/engine.js","utf8");
test("J07 offers separate prepare, skip and lineup actions",()=>{
 assert.match(s,/data-simulate="nextCommitment">Preparar próximo jogo/);
 assert.match(s,/data-simulate="nextMatch"/);
 assert.match(s,/Simular partida · pular jogo/);
 assert.match(s,/data-page="lineup">Consultar escalação/);
});
test("Skipping confirms a save-changing action and uses canonical simulation",()=>{
 assert.match(s,/mode === "nextMatch" && !confirm/);
 assert.match(s,/A\.execute\(state, "simulateAdvance", \{ mode \}\)/);
 assert.match(engine,/if \(mode === "nextMatch"\)/);
 assert.match(engine,/targetDay = initialCommitment\.date/);
});
test("button is disabled for past or current dated fixture",()=>{
 assert.match(s,/next\.date<=state\.day\?"disabled":""/);
});
