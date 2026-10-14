"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const R=require("../src/domain/player-rivalries.js");
const state=()=>({mode:"player",clubId:"a",person:{pos:"ATA"},clubs:[
 {id:"a",leagueId:"serieA",roster:[{id:"hero",pos:"ATA",name:"Jogador"},{id:"one",pos:"ATA",name:"Um"}]},
 {id:"b",leagueId:"serieA",roster:[{id:"two",pos:"ATA",name:"Dois"},{id:"three",pos:"MEI",name:"Tres"}]},
 {id:"c",leagueId:"serieB",roster:[{id:"four",pos:"ATA",name:"Quatro"}]}
]});
test("FC27: candidatos são atletas existentes da mesma liga e mesma função",()=>{
 const result=R.eligibleRivals(state());
 assert.deepEqual(result.map(x=>x.id),["one","two"]);
 assert.deepEqual(result.map(x=>x.clubId),["a","b"]);
});
test("sem carreira de jogador ou clube não oferece rival",()=>{
 const s=state();s.mode="coach";assert.deepEqual(R.eligibleRivals(s),[]);
 s.mode="player";s.clubId=null;assert.deepEqual(R.eligibleRivals(s),[]);
});
test("seleção não modifica elenco nem inicia desafio não solicitado",()=>{
 const s=state(),before=JSON.stringify(s);
 R.eligibleRivals(s);
 assert.equal(JSON.stringify(s),before);
 assert.equal(s.extras?.playerRivalry,undefined);
});
