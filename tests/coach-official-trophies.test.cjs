"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const CC=D.CoachCareer;

function setup(){
  const s=D.create({mode:"coach",clubId:"c0",catalogVersion:"fc27_v1"},5);
  CC.init(s,D);
  const club=s.clubs.find(c=>c.id===s.clubId);
  club.stats={played:3,w:2,d:0,l:1,points:6,gf:5,ga:2};
  return {s,club};
}

test("titulo de copa inglesa requer campeao e data no vinculo",()=>{
  const {s,club}=setup();
  s.day=120;
  s.englishCups={history:[
    {season:s.season,comp:"fa_cup",name:"FA Cup",
     championId:club.id,completedDay:110}
  ]};
  const r=CC.closeSeason(s,D,null);
  assert.equal(r.row.trophies.some(t=>t.key.includes("fa_cup")),true);
});

test("titulo anterior a chegada do treinador nao entra",()=>{
  const {s,club}=setup();
  s.day=120;
  s.coachCareer.stints[0].fromDay=100;
  s.englishCups={history:[
    {season:s.season,comp:"fa_cup",name:"FA Cup",
     championId:club.id,completedDay:80}
  ]};
  const r=CC.closeSeason(s,D,null);
  assert.equal(r.row.trophies.some(t=>t.key.includes("fa_cup")),false);
});

test("titulo de outro clube nao entra",()=>{
  const {s,club}=setup();
  s.day=120;
  s.englishCups={history:[
    {season:s.season,comp:"fa_cup",name:"FA Cup",
     championId:"outro_clube",completedDay:110}
  ]};
  const r=CC.closeSeason(s,D,null);
  assert.equal(r.row.trophies.some(t=>t.key.includes("fa_cup")),false);
});

test("titulo sem data comprovada nao e inventado",()=>{
  const {s,club}=setup();
  s.day=120;
  s.englishCups={history:[
    {season:s.season,comp:"fa_cup",championId:club.id}
  ]};
  const r=CC.closeSeason(s,D,null);
  assert.equal(r.row.trophies.some(t=>t.key.includes("fa_cup")),false);
});

test("fechamento repetido nao duplica titulos",()=>{
  const {s,club}=setup();
  s.day=120;
  s.englishCups={history:[
    {season:s.season,comp:"fa_cup",name:"FA Cup",
     championId:club.id,completedDay:110}
  ]};
  CC.closeSeason(s,D,null);
  const first=s.coachCareer.stints[0].titles;
  CC.closeSeason(s,D,null);
  assert.equal(s.coachCareer.stints[0].titles,first);
});

test("modo jogador continua sem historico de treinador",()=>{
  const s=D.create({mode:"player",clubId:"c0"},5);
  assert.equal(CC.snapshot(s,D).enabled,false);
});