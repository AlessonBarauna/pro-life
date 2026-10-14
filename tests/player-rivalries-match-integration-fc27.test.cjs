"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs");
const R=require("../src/domain/player-rivalries.js");
function m(events,participants=[["hero"],["rival"]]){
 return {season:2026,date:8,competitionId:"league",round:1,home:"a",away:"b",participants,events};
}
const goal=(playerId,assistPlayerId)=>({type:"goal",playerId,assistPlayerId});
test("observa somente gols reais de ambos jogadores em campo",()=>{
 const s=R.initial({rivalId:"rival",position:"ATA",maxMatches:2});
 const after=R.fromSimulatedMatch(s,m([goal("hero","x"),goal("rival","hero")]));
 assert.equal(after.hero,1);assert.equal(after.rival,1);assert.equal(after.progress,1);
 assert.equal(R.fromSimulatedMatch(after,m([goal("hero","x")])),after);
});
test("hat trick real decide rivalidade no registro da partida",()=>{
 const s=R.initial({rivalId:"rival",position:"ATA",objectiveId:"hatTrick"});
 const result=R.fromSimulatedMatch(s,m([goal("rival"),goal("rival"),goal("rival")]));
 assert.equal(result.result,"loss");
});
test("não contabiliza rival ausente nem inventa clean sheets",()=>{
 const a=R.initial({rivalId:"rival",position:"ATA"});
 const b=R.initial({rivalId:"rival",position:"GOL"});
 assert.equal(R.fromSimulatedMatch(a,m([goal("hero")],[["hero"],[]])),a);
 assert.equal(R.fromSimulatedMatch(b,m([])),b);
});
test("carreira do treinador não é impactada pela integração",()=>{
 const engine=fs.readFileSync("src/domain/engine.js","utf8");
 const html=fs.readFileSync("index.html","utf8");
 assert.match(engine,/s\.mode==="player" && s\.extras\?\.playerRivalry/);
 assert.ok(html.indexOf("src/domain/player-rivalries.js")<html.indexOf("src/domain/engine.js"));
});
