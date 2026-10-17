"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
function harness(){
 const clubs=[
  {id:"home",name:"Clube da carreira",roster:[{id:"home-1",name:"Atleta da casa"}],budget:5000000},
  {id:"away",name:"Clube vendedor",roster:[{id:"target-1",name:"Alvo",pos:"ATA",overall:76}]}
 ];
 const engine={club:(s,id)=>clubs.find(c=>c.id===(id||s.clubId)),GlobalFootball:{playersByClub:()=>[]}};
 const context={ProLife:engine,module:{exports:{}},console};
 vm.runInNewContext(source,context,{filename:"src/application/game.js"});
 return {execute:context.module.exports.execute,clubs};
}
function state(){return {mode:"coach",clubId:"home",day:42,season:2026,coachCareer:{shortlist:[],presentations:[]}};}
function snapshot(s){return JSON.stringify(s);}
test("M06.2 shortlist creates an actual target, changes priority and removes it",()=>{
 const {execute}=harness(),s=state();
 execute(s,"toggleCoachShortlist",{clubId:"away",playerId:"target-1"});
 assert.equal(s.coachCareer.shortlist.length,1);
 assert.equal(s.coachCareer.shortlist[0].playerId,"target-1");
 execute(s,"setCoachTargetPriority",{clubId:"away",playerId:"target-1",priority:"alta"});
 assert.equal(s.coachCareer.shortlist[0].priority,"alta");
 execute(s,"toggleCoachShortlist",{clubId:"away",playerId:"target-1"});
 assert.equal(s.coachCareer.shortlist.length,0);
});
test("M06.2 rejects invalid target priority without modifying saved state",()=>{
 const {execute}=harness(),s=state();
 execute(s,"toggleCoachShortlist",{clubId:"away",playerId:"target-1"});
 const before=snapshot(s);
 assert.throws(()=>execute(s,"setCoachTargetPriority",{clubId:"away",playerId:"target-1",priority:"impossivel"}),/Prioridade inválida/);
 assert.equal(snapshot(s),before);
});
test("M06.2 confirms a reinforcement presentation exactly once without altering finances",()=>{
 const {execute,clubs}=harness(),s=state();
 s.coachCareer.presentations.push({id:"signing-1",playerId:"target-1",toClubId:"home",presented:false});
 const budget=clubs[0].budget;
 execute(s,"ackCoachPresentation",{id:"signing-1"});
 assert.equal(s.coachCareer.presentations[0].presented,true);
 assert.equal(s.coachCareer.presentations[0].presentedDay,42);
 execute(s,"ackCoachPresentation",{id:"signing-1"});
 assert.equal(s.coachCareer.presentations.length,1);
 assert.equal(clubs[0].budget,budget);
 assert.equal(s.coachCareer.shortlist.length,0);
});
test("M06.2 denies acknowledging another club's presentation and preserves state",()=>{
 const {execute}=harness(),s=state();
 s.coachCareer.presentations.push({id:"other-signing",toClubId:"away",playerId:"target-1",presented:false});
 const before=snapshot(s);
 assert.throws(()=>execute(s,"ackCoachPresentation",{id:"other-signing"}),/Apresentação indisponível/);
 assert.equal(snapshot(s),before);
});
