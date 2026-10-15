"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const R=require("../src/domain/player-rivalries.js");
const view=require("../src/ui/player-j13-rivalries.js");
function state(){return {mode:"player",season:2026,day:10,clubId:"A",person:{pos:"ATA"},extras:{playerCareer:{}},clubs:[{id:"A",leagueId:"serieA",roster:[{id:"hero",pos:"ATA"}]},{id:"B",leagueId:"serieA",name:"Clube B",roster:[{id:"rival",name:"Atacante B",pos:"ATA"}]},{id:"C",leagueId:"serieB",roster:[{id:"other",pos:"ATA"}]}]};}
test("J13: same-league real player selection is deterministic and persists in existing slot",()=>{
 const s=state(),q=R.ensureCareer(s);
 assert.equal(q.rivalId,"rival");assert.equal(q.objectiveId,"goals");
 assert.strictEqual(q,R.ensureCareer(s));assert.equal(s.extras.playerCareer.fc27PlayerRivalry,undefined);
});
test("J13: real simulated match scored once, never doubles on reload",()=>{
 const s=state();R.ensureCareer(s);
 const m={season:2026,date:10,home:"A",away:"B",leagueId:"serieA",participants:[["hero"],["rival"]],events:[{type:"goal",playerId:"hero"},{type:"goal",playerId:"rival"}]};
 const one=R.onCareerMatch(s,m);const two=R.onCareerMatch(s,m);
 assert.equal(one.progress,1);assert.equal(two.progress,1);assert.equal(two.hero,1);assert.equal(two.rival,1);
});
test("J13: never advances when rival did not play",()=>{
 const s=state();R.ensureCareer(s);
 R.onCareerMatch(s,{season:2026,date:10,home:"A",away:"C",participants:[["hero"],["other"]],events:[{type:"goal",playerId:"hero"}]});
 assert.equal(s.extras.playerRivalry.progress,0);
});
test("J13: module source parses and player match view is integrated",()=>{
 const app=fs.readFileSync("src/ui/app.js","utf8"),engine=fs.readFileSync("src/domain/engine.js","utf8"),html=fs.readFileSync("index.html","utf8");
 assert.match(engine,/PlayerRivalries\?\.ensureCareer\?\.\(s\)/);
 assert.match(engine,/PlayerRivalries\.fromSimulatedMatch\(s\.extras\.playerRivalry,m\)/);
 assert.match(app,/ProLifeJ13View\?\.render\?\.\(state\)/);
 assert.match(html,/player-j13-rivalries\.js/);
 assert.match(html,/fc27-j13-rivalries\.css/);
});
