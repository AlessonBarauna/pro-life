"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const J=require("../src/ui/player-j10-development.js");
const app=fs.readFileSync("src/ui/app.js","utf8"),engine=fs.readFileSync("src/domain/training.js","utf8");
const D={overall:p=>p.overall,Training:{ceiling:()=>86,trainingAvailable:()=>true,exercises:{sprint:{name:"Velocidade"}}}};
const Career={init:s=>({playerCareer:s.pc||{}})};
test("J10: current player condition and GER are grounded in saved attributes",()=>{
 const s={mode:"player",person:{overall:72,condition:88,morale:73,injury:0},trainingPlan:{exerciseId:"sprint",developmentXp:11,sessions:2}};
 const m=J.snapshot(s,D,Career);
 assert.equal(m.base,72);assert.equal(m.readiness,"Máximo");assert.equal(m.projected,86);
 assert.match(J.render(s,D,Career),/GER BASE/);
 assert.match(J.render(s,D,Career),/Velocidade/);
});
test("J10: injury blocks maximum readiness without modifying state",()=>{
 const s={mode:"player",person:{overall:76,condition:99,morale:80,injury:8},trainingPlan:{developmentXp:5}};
 const before=JSON.stringify(s);
 assert.equal(J.snapshot(s,D,Career).readiness,"Indisponível");
 assert.match(J.render(s,D,Career),/8 dia\(s\) de recuperação/);
 assert.equal(JSON.stringify(s),before);
});
test("J10: recent match and progress sourced from saved report",()=>{
 const s={mode:"player",person:{overall:74,condition:68,morale:54},pc:{lastEvaluation:{rating:6.9},lastMatchReport:{status:"TITULAR",minutes:82,rating:6.9,attributeChanges:[{label:"Passe",before:68,after:69}]}}};
 assert.match(J.render(s,D,Career),/Passe/);
 assert.match(J.render(s,D,Career),/68 → 69/);
});
test("J10: does not award XP and keeps existing training engine",()=>{
 const view=fs.readFileSync("src/ui/player-j10-development.js","utf8");
 assert.doesNotMatch(view,/A\.execute|D\.advance|persist\(|addDevelopmentXp\(/);
 assert.match(app,/window\.ProLifeJ10\?\.render\?\.\(state,D,Career\)/);
 assert.match(engine,/function trainingAvailable\(/);
 assert.match(engine,/function performTraining\(/);
 assert.match(engine,/function ceiling\(/);
});
