"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const J=require("../src/ui/player-j11-coach.js");
const app=fs.readFileSync("src/ui/app.js","utf8"),html=fs.readFileSync("index.html","utf8");
const state={mode:"player",clubId:"x",person:{},day:28};
const Career={init:()=>({playerCareer:{coachTrust:67,squadRole:"Rotação",lastMatchReport:{rating:7.2}}})};
const Squad={
 init:()=>({trainingTrend:1.25}),
 trustSummary:()=>({trend:3,history:[{source:"training",delta:1.25}]}),
 managerProfile:()=>({name:"Treinador Teste",preferredFormation:"4-3-3"}),
 competition:()=>({rivals:[{id:"hero",name:"Protagonista",overall:75,status:"Banco"},{id:"r2",name:"Concorrente",overall:77,status:"Titular"}]}),
 coachConversationStatus:()=>({available:true}),
 coachPromiseStatus:()=>null,
 coachConversationChoices:()=>[]
};
test("J11: displays the canonical trust, role, coach and real positional rival",()=>{
 const m=J.snapshot(state,Squad,Career),view=J.render(state,Squad,Career);
 assert.equal(m.trust,67);assert.equal(m.trainingTrend,1.25);
 for(const value of ["Treinador Teste","Concorrente","Rotação","67/100","GER 77"])assert.ok(view.includes(value),value);
});
test("J11: excludes manager mode and keeps existing lineup navigation",()=>{
 assert.equal(J.render({...state,mode:"coach"},Squad,Career),"");
 assert.match(J.render(state,Squad,Career),/data-page="lineup"/);
 assert.match(app,/!coach \? \(window\.ProLifeJ11\?\.render\?\.\(state,D\.Squad,Career\)/);
});
test("J11: no custom trust or selection mutation",()=>{
 const src=fs.readFileSync("src/ui/player-j11-coach.js","utf8");
 assert.doesNotMatch(src,/pc\.coachTrust\s*=|A\.execute|D\.advance|persist\(|Math\.random/);
 assert.match(html,/src\/ui\/player-j11-coach\.js/);
 assert.match(html,/src\/ui\/fc27-j11-coach\.css/);
});

test("J11/J11.3: module syntax remains valid after composing history panel",()=>{
 const cp=require("node:child_process");
 const result=cp.spawnSync(process.execPath,["--check","src/ui/player-j11-coach.js"],{encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
});
