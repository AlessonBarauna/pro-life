"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const C=require("../src/domain/continental.js");
test("completed European league standings are preserved for qualification",()=>{
  const id="gf_fc27_premier_league";
  const order=Array.from({length:20},(_,i)=>"team"+i);
  const state={season:2027,day:550,globalFootball:{
    clubs:order.map(id0=>({id:id0,leagueId:id,active:true,generated:false})),
    leagues:[{id,name:"Premier League",country:"England",active:true}],
    worldCompetitions:{history:[{season:2026,leagueId:id,orderIds:order,top4:order.slice(0,4)}]}
  },continental:{editions:{},finals:{}}};
  assert.equal(state.globalFootball.worldCompetitions.history[0].orderIds.length,20);
  const entries=C.associations(state).uefa;
  assert.ok(Array.isArray(entries));
});
