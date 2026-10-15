"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const live=require("../src/ui/live-match.js");
const app=fs.readFileSync("src/ui/app.js","utf8");
const html=fs.readFileSync("index.html","utf8");
test("J08: timeline ordered, no synthetic events",()=>{
 const m={events:[{type:"goal",side:0,minute:70,text:"GOL CASA"},{type:"yellow",minute:24,text:"CARTAO"},{type:"goal",side:1,minute:60,text:"GOL FORA"}],hg:1,ag:1};
 assert.deepEqual(live.events(m).map(e=>e.minute),[24,60,70]);
 assert.deepEqual(live.scoreAt(m,40),[0,0]);
 assert.deepEqual(live.scoreAt(m,65),[0,1]);
 assert.deepEqual(live.scoreAt(m,95),[1,1]);
});
test("J08: retains true final score when event list incomplete",()=>{
 const m={events:[],hg:3,ag:2};
 assert.deepEqual(live.scoreAt(m,30),[0,0]);
 assert.deepEqual(live.scoreAt(m,94),[3,2]);
});
test("J08: bench entry follows recorded participation",()=>{
 const m={participation:{hero:{entryMinute:64,exitMinute:null}}};
 assert.match(live.heroSnapshot(m,20).label,/Banco/);
 assert.match(live.heroSnapshot(m,64).label,/Entrou aos 64/);
 assert.equal(live.heroSnapshot({participation:{hero:{entryMinute:null}}},20).played,false);
});
test("J08: controls use playback, not re-execute match simulation",()=>{
 const src=fs.readFileSync("src/ui/live-match.js","utf8");
 for(const k of ["data-j08-next","data-j08-half","data-j08-entry","data-j08-finish","data-j08-close"])assert.ok(src.includes(k),k);
 assert.doesNotMatch(src,/A\.execute|D\.advance|persist\(/);
});
test("J08: J07 links existing live match, maintains skip option",()=>{
 assert.match(app,/data-live-match \$\{next\.date!==state\.day\+1\?"disabled":""\}/);
 assert.match(app,/data-simulate="nextMatch"/);
 assert.match(html,/fc27-j08-match\.css/);
});
