"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Calendar=require("../src/domain/champions-calendar.js");

test("34F.32B.4A verifica as datas de todos os confrontos",()=>{
  const s=D.create({
    mode:"player",clubId:"c0",catalogVersion:"fc27_v1"
  },5);

  D.Continental.init(s);
  const result=Calendar.create(
    s,D.Continental,D.WorldClubCompetitions
  );

  console.log("Partidas sorteadas:",result.total);
  console.log("Partidas com data:",result.matches.length);
  console.log("Conflitos:",result.conflicts.length);

  for(const c of result.conflicts.slice(0,15))
    console.log("CONFLITO:",JSON.stringify(c));

  assert.equal(result.total,144);
  assert.equal(
    result.matches.length+result.conflicts.length,144
  );

  const seen=new Set();

  for(const m of result.matches){
    assert.ok(Number.isInteger(m.day));
    assert.ok(m.round>=1&&m.round<=8);
    assert.ok(!seen.has(m.id));
    seen.add(m.id);
  }

  const again=Calendar.create(
    s,D.Continental,D.WorldClubCompetitions
  );
  assert.deepEqual(again,result);

  if(!result.complete)
    console.log("ATENCAO: existem conflitos a corrigir antes da integracao.");
  else
    console.log("CALENDARIO PRONTO PARA A PROXIMA ETAPA.");
});