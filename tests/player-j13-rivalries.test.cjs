"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const R=require("../src/domain/player-rivalries.js");
require("../src/ui/player-j13-rivalries.js");
function state(){return {mode:"player",season:2026,day:10,clubId:"A",person:{pos:"ATA",goals:0,assists:0},extras:{playerCareer:{}},clubs:[{id:"A",leagueId:"serieA",roster:[{id:"hero",pos:"ATA"}]},{id:"B",leagueId:"serieA",name:"Clube B",roster:[{id:"rival",name:"Atacante B",pos:"ATA"}]},{id:"C",leagueId:"serieA",roster:[{id:"other",pos:"ATA"}]},{id:"D",leagueId:"serieB",roster:[{id:"outside",pos:"ATA"}]}]};}
function match(date,home,away,ids,events=[]){return {season:2026,date,home,away,leagueId:"serieA",participants:[ids],participation:Object.fromEntries(ids.map(id=>[id,{minutes:90}])),ratings:Object.fromEntries(ids.map(id=>[id,7])),events};}
test("J13 selects real same-role same-league rival and uses canonical save slot",()=>{
 const s=state(),q=R.ensureCareer(s);
 assert.equal(q.rivalId,"rival");assert.equal(q.objectiveId,"goals");
 assert.strictEqual(q,R.ensureCareer(s));assert.equal(s.extras.playerCareer.fc27PlayerRivalry,undefined);
 assert.ok(!R.eligibleRivals(s).some(r=>r.id==="outside"));
});
test("J13 records each player's real fixtures separately and idempotently",()=>{
 const s=state();R.ensureCareer(s);
 const a=match(10,"A","C",["hero","other"],[{type:"goal",playerId:"hero"}]);
 const b=match(11,"B","C",["rival","other"],[{type:"goal",playerId:"rival"}]);
 R.recordLeagueMatch(s,a);R.recordLeagueMatch(s,a);R.recordLeagueMatch(s,b);
 const q=s.extras.playerRivalry;
 assert.equal(q.heroGames,1);assert.equal(q.rivalGames,1);assert.equal(q.progress,1);
 assert.equal(q.hero,1);assert.equal(q.rival,1);assert.equal(q.processed.length,2);
});
test("J13 ignores absent rival and does not award results before window completion",()=>{
 const s=state();R.ensureCareer(s);
 R.recordLeagueMatch(s,match(10,"A","C",["hero"],[]));
 assert.equal(s.extras.playerRivalry.progress,0);
 assert.equal(s.extras.playerRivalry.result,"active");
 assert.equal(R.claimCareerReward(s).claimed,false);
});
test("J13 supports milestone challenge and one-time reward distribution",()=>{
 const s=state();s.person.goals=11;
 const q=R.ensureCareer(s);assert.equal(q.objectiveId,"hatTrick");
 R.recordLeagueMatch(s,match(10,"A","B",["hero","rival"],[0,1,2].map(()=>({type:"goal",playerId:"hero"}))));
 assert.equal(q.result,"win");
 const first=R.claimCareerReward(s),second=R.claimCareerReward(s);
 assert.equal(first.claimed,true);assert.equal(first.amount,90);assert.equal(second.claimed,false);
 assert.deepEqual(s.extras.playerCareer.rivalryPointWallet,{maverick:30,virtuoso:30,heartbeat:30});
});
test("J13 archives inconclusive seasons and allows later partial reward claim",()=>{
 const s=state();R.ensureCareer(s);s.season=2027;
 R.ensureCareer(s);
 assert.equal(s.extras.playerRivalryHistory[0].result,"unfinished");
 const claim=R.claimCareerReward(s);
 assert.equal(claim.claimed,true);assert.equal(claim.amount,45);
 assert.equal(R.claimCareerReward(s).claimed,false);
});
test("J13 integrates one match pipeline, screen, and claim action",()=>{
 const app=fs.readFileSync("src/ui/app.js","utf8"),engine=fs.readFileSync("src/domain/engine.js","utf8"),html=fs.readFileSync("index.html","utf8");
 assert.match(engine,/PlayerRivalries\.recordLeagueMatch\(s,m\)/);
 assert.match(app,/ProLifeJ13View\?\.render\?\.\(state\)/);
 assert.match(app,/data-rivalry-claim/);
 assert.match(html,/player-j13-rivalries\.js/);
 assert.match(html,/fc27-j13-rivalries\.css/);
});

test("J13 does not count an unused substitute with absent rating and minutes",()=>{
 const s=state();R.ensureCareer(s);
 const m=match(12,"A","C",["other"],[]);
 m.participation.hero={};delete m.ratings.hero;
 R.recordLeagueMatch(s,m);
 assert.equal(s.extras.playerRivalry.heroGames??0,0);
 assert.equal(s.extras.playerRivalry.processed.length,0);
});
test("J13 does not count a rated athlete if his club did not play",()=>{
 const s=state();R.ensureCareer(s);
 const m=match(13,"B","C",["hero","rival"],[]);
 R.recordLeagueMatch(s,m);
 assert.equal(s.extras.playerRivalry.heroGames??0,0);
 assert.equal(s.extras.playerRivalry.rivalGames,1);
});
test("J13 clean sheet attributes goals conceded to the actual player's club",()=>{
 const s=state();s.person.pos="GOL";
 s.clubs[0].roster[0].pos="GOL";
 s.clubs[1].roster[0].pos="GOL";
 s.clubs[2].roster[0].pos="MEI";
 const q=R.ensureCareer(s);assert.equal(q.objectiveId,"cleanSheets");
 const m=match(14,"B","A",["hero","rival"],[]);
 m.hg=2;m.ag=0;
 R.recordLeagueMatch(s,m);
 assert.equal(q.hero,0);
 assert.equal(q.rival,1);
});
test("J13 never double counts a match after JSON save reload",()=>{
 const s=state();R.ensureCareer(s);
 const m=match(15,"A","C",["hero"],[{type:"goal",playerId:"hero"}]);
 R.recordLeagueMatch(s,m);
 const saved=JSON.parse(JSON.stringify(s));
 R.recordLeagueMatch(saved,m);
 assert.equal(saved.extras.playerRivalry.heroGames,1);
 assert.equal(saved.extras.playerRivalry.hero,1);
});
