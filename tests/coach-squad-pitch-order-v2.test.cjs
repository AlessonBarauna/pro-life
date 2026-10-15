"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-05b-squad.css"),"utf8");
test("coach pitch preserves explicit position order between renders",()=>{
 assert.match(app,/const saved=state\.coachCareer\?\.pitchSlots/);
 assert.match(app,/const valid=Array\.isArray\(saved\)/);
 assert.match(app,/row\.players=saved\.slice\(cursor,cursor\+count\)\.map/);
 assert.match(app,/state\.coachCareer\.pitchSlots=nextPitch/);
});
test("coach swapping keeps original squad transfer logic and validates XI",()=>{
 assert.match(app,/if\(fi>=0&&ti>=0\)/);
 assert.match(app,/if\(chosen\.length!==11\|\|!hasGoalkeeper\(\)\)/);
 assert.match(app,/A\.execute\(state,"lineup",\{ids:chosen\}\)/);
});
test("selection supports pointer swap and visibly identifies source",()=>{
 assert.match(app,/squadSwapSource===id\?null:id/);
 assert.match(app,/swap-source/);
 assert.match(css,/\.pl-squad-player\.swap-source/);
});

test("render regression: slot restore must not depend on exhausted remaining players",()=>{
 assert.match(app,/const count=row\.players\.length/);
 assert.doesNotMatch(app,/row\.players=row\.players\.map\(\(\)=>c\.roster\.find/);
 const roster=Array.from({length:11},(_,i)=>({id:"p"+i}));
 const saved=roster.map(p=>p.id).reverse();
 const rows=[{players:roster.slice(0,3)},{players:roster.slice(3,6)},{players:roster.slice(6,10)},{players:roster.slice(10)}];
 let cursor=0;
 for(const row of rows){
   const count=row.players.length;
   row.players=saved.slice(cursor,cursor+count).map(id=>roster.find(p=>p.id===id)).filter(Boolean);
   cursor+=count;
 }
 assert.equal(rows.flatMap(row=>row.players).length,11);
 assert.deepEqual(rows.flatMap(row=>row.players.map(p=>p.id)),saved);
});

test("E01 resets pitch slots when formation changes and avoids automatic reassignment",()=>{
 assert.match(app,/pitchFormation===formation&&Array\.isArray\(saved\)/);
 assert.match(app,/state\.coachCareer\.pitchFormation=formation/);
 assert.match(app,/state\.coachCareer\.pitchFormation=club\.formation/);
 assert.match(app,/assignedPositions:null/);
});
