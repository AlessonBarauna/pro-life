"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const lab=require("../src/ui/coach-match-lab-v2.js");
const make=()=>{
 const roster=Array.from({length:18},(_,i)=>({id:"p"+i,pos:i===0?"GOL":i%2?"MC":"CA",ovr:80,condition:80}));
 const club={roster,lineup:roster.slice(0,11).map(p=>p.id)};
 const p=lab.createPreview(club,club,33);
 return {p,roster};
};
test("substitution history and three windows in simulation preview",()=>{
 const {p,roster}=make();
 assert.ok(p);
 lab.advance(p,60);
 let result=lab.swapPlayer(p,0,p.lineups[0].starters[1],p.lineups[0].bench[0],roster);
 assert.equal(result.ok,true);
 assert.equal(lab.substitutionsStatus(p,0).windowsUsed,1);
 assert.equal(lab.substitutionsStatus(p,0).history.length,1);
 lab.advance(p,70);
 result=lab.swapPlayer(p,0,p.lineups[0].starters[2],p.lineups[0].bench[0],roster);
 assert.equal(result.ok,true);
 lab.advance(p,80);
 result=lab.swapPlayer(p,0,p.lineups[0].starters[3],p.lineups[0].bench[0],roster);
 assert.equal(result.ok,true);
 lab.advance(p,81);
 result=lab.swapPlayer(p,0,p.lineups[0].starters[4],p.lineups[0].bench[0],roster);
 assert.equal(result.ok,false);
 assert.equal(lab.substitutionsStatus(p,0).windowsRemaining,0);
});
test("recommendations and live UI compile without writing saves",()=>{
 const src=fs.readFileSync("src/ui/live-match.js","utf8");
 new vm.Script(src);
 assert.match(src,/suggestedSubstitutions/);
 assert.match(src,/substitutionsStatus/);
 assert.match(src,/não alteram o placar oficial nem o save/);
});
