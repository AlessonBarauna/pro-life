"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const R=require("../src/domain/champions-rounds.js");

test("34F.32B.3 calendario completo com 8 rodadas",()=>{
  const s=D.create({
    mode:"player",clubId:"c0",catalogVersion:"fc27_v1"
  },5);

  D.Continental.init(s);
  const ed=D.Continental.edition(s,"ucl");
  const windows=D.Continental.windows(ed.season,"ucl");
  const before=JSON.stringify(ed);

  const result=R.schedule(ed,windows);

  assert.equal(result.matches.length,144);
  assert.equal(JSON.stringify(ed),before);

  for(let round=1;round<=8;round++){
    const games=result.matches.filter(m=>m.round===round);
    const ids=games.flatMap(m=>[m.homeId,m.awayId]);

    assert.equal(games.length,18,"Rodada "+round);
    assert.equal(new Set(ids).size,36,"Clubes da rodada "+round);
    assert.ok(games.every(m=>m.day===windows[round-1]));
  }

  const participants=ed.entrants.map(x=>x[0]);

  for(const id of participants){
    const games=result.matches.filter(m=>
      m.homeId===id||m.awayId===id
    );

    assert.equal(games.length,8);
    assert.equal(games.filter(m=>m.homeId===id).length,4);
    assert.equal(games.filter(m=>m.awayId===id).length,4);
    assert.equal(new Set(games.map(m=>
      m.homeId===id?m.awayId:m.homeId
    )).size,8);
  }

  assert.deepEqual(R.schedule(ed,windows),result);
  assert.ok(result.maximumVenueStreak<=4);

  console.log("Tentativa:",result.attempt);
  console.log("Maior sequencia casa/fora:",result.maximumVenueStreak);

  const madrid="gf_fc27_243";
  for(let round=1;round<=8;round++){
    const m=result.matches.find(m=>
      m.round===round&&
      (m.homeId===madrid||m.awayId===madrid)
    );
    assert.ok(m,"Real Madrid rodada "+round);
    console.log(
      "Real Madrid - rodada",round,
      m.homeId===madrid?"CASA":"FORA",
      m.homeId===madrid?m.awayId:m.homeId
    );
  }
});