"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const scout=require("../src/domain/coach-scouting-v2.js");
test("M03.2 persists selected region and specialty without altering existing missions",()=>{
 const save={mode:"coach",day:10,clubId:"test",clubs:[{id:"test",budget:500}]};
 const first=scout.start(save,{playerId:"one",region:"Europa",specialty:"defesa",duration:7});
 assert.equal(first.ok,true);assert.equal(first.mission.region,"Europa");
 assert.equal(first.mission.specialty,"defesa");
 const second=scout.start(save,{playerId:"two"});
 assert.equal(second.ok,true);assert.equal(second.mission.specialty,"geral");
 assert.equal(save.clubs[0].budget,500);
 assert.equal(scout.state(save).missions.length,2);
});
test("M03.2 rejects unsupported specialty without affecting scout progression",()=>{
 const save={mode:"coach",day:1,clubId:"x",clubs:[{id:"x",budget:0}]};
 const out=scout.start(save,{playerId:"p",specialty:"invalid"});
 assert.equal(out.mission.specialty,"geral");
 save.day=15;scout.advance(save);assert.equal(out.mission.status,"complete");
});
