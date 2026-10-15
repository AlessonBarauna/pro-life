"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const J=require("../src/ui/player-j12-calendar.js");
const state={mode:"player",day:20,clubId:"club",person:{condition:72,injury:0},matches:[{date:12,home:"club",away:"opponent",hg:2,ag:1,competitionName:"Liga"},{date:15,home:"other",away:"third",hg:1,ag:0}]};
const D={nextCommitment:()=>({date:28,home:"Mandante",away:"Visitante",competitionName:"Copa"}),Competitions:{fixtureStage:()=> "Oitavas de final"}};
const date=d=>"Dia "+d;
test("J12 shows canonical next game, stage and recent club results",()=>{
 const m=J.snapshot(state,D),v=J.render(state,D,date);
 assert.equal(m.next.date,28);assert.equal(m.played.length,1);
 for(const label of ["Oitavas de final","Copa","EM 8 DIAS","Mandante","Visitante","2 × 1"])assert.ok(v.includes(label),label);
});
test("J12 shows injury accurately without creating unavailable fixtures",()=>{
 const s={...state,person:{injury:5,condition:30},matches:[]};
 assert.match(J.render(s,{nextCommitment:()=>null},date),/5 dia\(s\) de lesão registrados/);
 assert.match(J.render(s,{nextCommitment:()=>null},date),/Nenhum compromisso oficial agendado/);
});
test("J12 preserves original calendar and navigation, no save changes",()=>{
 const app=fs.readFileSync("src/ui/app.js","utf8"),view=fs.readFileSync("src/ui/player-j12-calendar.js","utf8"),html=fs.readFileSync("index.html","utf8");
 assert.match(app,/return j12\+calendarView\(\)/);
 for(const dest of ["matches","lineup","competitions","training"])assert.ok(view.includes('data-page="'+dest+'"'));
 assert.doesNotMatch(view,/D\.advance\(|persist\(|simulateAdvance|state\.matches\.push/);
 assert.match(html,/src\/ui\/player-j12-calendar\.js/);
 assert.equal(J.render({...state,mode:"coach"},D,date),"");
});
