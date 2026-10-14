"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const R=require("../src/domain/player-rivalries.js");
const fixture=()=>({mode:"player",clubId:"a",person:{pos:"ATA"},clubs:[
 {id:"a",leagueId:"serieA",roster:[{id:"hero",pos:"ATA"},{id:"one",name:"Um",pos:"ATA"}]},
 {id:"b",leagueId:"serieA",roster:[{id:"two",name:"Dois",pos:"ATA"}]},
 {id:"c",leagueId:"serieB",roster:[{id:"three",name:"Três",pos:"ATA"}]}
],statistics:{players:{
 one:{byCompetition:{serieA:{appearances:4,goals:2,assists:1,ratingTotal:28},serieB:{appearances:99,goals:99}}},
 two:{byCompetition:{serieB:{appearances:5,goals:3}}}
}}});
test("estatísticas reais da liga, sem usar números de outra competição",()=>{
 const s=fixture(),values=R.candidateStats(s);
 assert.equal(values.length,2);
 assert.deepEqual(values[0].statistics,{appearances:4,goals:2,assists:1,averageRating:7});
 assert.equal(values[1].statistics,null);
 assert.equal(s.extras?.playerRivalry,undefined);
});
test("sem estatísticas não inventa desempenho",()=>{
 const s=fixture();delete s.statistics;
 assert.equal(R.candidateStats(s).every(x=>x.statistics===null),true);
});
test("modo treinador não recebe candidatos",()=>{
 const s=fixture();s.mode="coach";
 assert.deepEqual(R.candidateStats(s),[]);
});
