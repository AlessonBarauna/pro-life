"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,".."),view=fs.readFileSync(path.join(base,"src/ui/coach-career-view.js"),"utf8"),app=fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8");
test("M05.8 signings show recorded role, current GER and only available squad shortcut",()=>{
 assert.match(view,/const playerRole=rosterPlayer/);assert.match(view,/const currentOverall=rosterPlayer/);
 assert.match(view,/const planningPanel=rosterPlayer\?/);assert.match(view,/data-coach-signing-squad/);
 assert.match(view,/Jogador não localizado no elenco atual/);
});
test("M05.8 squad shortcut uses existing page without changing career state",()=>{
 assert.match(app,/data-coach-signing-squad/);
 assert.match(app,/page="squad"; render\(\); return;/);
});
