"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const CC=D.CoachCareer;

function setup(world=false){
  const s=D.create({
    mode:"coach",
    clubId:"c0",
    catalogVersion:"fc27_v1"
  },5);

  CC.init(s,D);
  const club=s.clubs.find(c=>c.id===s.clubId);
  club.worldMatch=world;
  club.stats={
    played:38,w:26,d:8,l:4,
    points:86,gf:70,ga:25
  };
  return {s,club};
}

test("lider de liga mundial ativa nao ganha titulo prematuro",()=>{
  const {s}=setup(true);
  const result=CC.closeSeason(s,D,null);
  assert.ok(result);
  assert.equal(
    result.row.trophies.some(t=>t.key.startsWith("league:")),
    false
  );
});

test("liga brasileira local preserva titulo de primeiro lugar",()=>{
  const {s}=setup(false);
  const result=CC.closeSeason(s,D,null);
  assert.ok(result);
  assert.equal(
    result.row.trophies.filter(t=>t.key.startsWith("league:")).length,
    1
  );
  assert.equal(result.row.titles,1);
});

test("fechamento repetido nao altera total de titulos",()=>{
  const {s}=setup(false);
  CC.closeSeason(s,D,null);
  const first=s.coachCareer.stints[0].titles;
  CC.closeSeason(s,D,null);
  assert.equal(s.coachCareer.stints[0].titles,first);
  assert.equal(first,1);
});

test("trofeu confirmado de copa continua contabilizado",()=>{
  const {s,club}=setup(true);
  const season=s.season;
  const day=Number(s.day)+100;
  s.day=day;
  s.englishCups={
    history:[{
      season,
      comp:"fa_cup",
      name:"FA Cup",
      championId:club.id,
      completedDay:day
    }]
  };

  const result=CC.closeSeason(s,D,null);
  assert.equal(
    result.row.trophies.some(t=>t.key.includes("fa_cup")),
    true
  );
  assert.equal(result.row.titles,1);
});

test("fechamento repetido com copa nao duplica total",()=>{
  const {s,club}=setup(true);
  const day=Number(s.day)+100;
  s.day=day;
  s.englishCups={
    history:[{
      season:s.season,
      comp:"fa_cup",
      championId:club.id,
      completedDay:day
    }]
  };

  CC.closeSeason(s,D,null);
  CC.closeSeason(s,D,null);

  assert.equal(s.coachCareer.stints[0].titles,1);
});