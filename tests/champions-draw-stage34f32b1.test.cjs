"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Draw=require("../src/domain/champions-draw.js");

const edition={
  comp:"ucl",
  drawSeed:"ucl|2026",
  entrants:Array.from({length:36},(_,i)=>[
    "club_"+i,
    "COUNTRY_"+Math.floor(i/4)
  ])
};

test("34F.32B.1 quatro potes de nove clubes",()=>{
  const p=Draw.pots(edition);
  assert.equal(p.length,4);
  for(const pot of p)assert.equal(pot.clubs.length,9);
});

test("34F.32B.1 todos os clubes presentes uma vez",()=>{
  const ids=Draw.pots(edition).flatMap(p=>p.clubs.map(c=>c.id));
  assert.equal(new Set(ids).size,36);
});

test("34F.32B.1 determinismo e ausencia de mutacao",()=>{
  const before=JSON.stringify(edition);
  const a=JSON.stringify(Draw.pots(edition));
  const b=JSON.stringify(Draw.pots(edition));
  assert.equal(a,b);
  assert.equal(JSON.stringify(edition),before);
});

test("34F.32B.1 rejeita edicao incompleta",()=>{
  assert.throws(()=>Draw.pots({
    ...edition,entrants:edition.entrants.slice(0,34)
  }));
});

test("34F.32B.1 rejeita clubes duplicados",()=>{
  const copy=JSON.parse(JSON.stringify(edition));
  copy.entrants[35]=copy.entrants[0];
  assert.throws(()=>Draw.pots(copy));
});