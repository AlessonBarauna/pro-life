"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const engine=fs.readFileSync("src/domain/engine.js","utf8");
const training=fs.readFileSync("src/domain/training.js","utf8");

test("carga fisica do treino automatico exige sessao realizada",()=>{
  assert.match(engine,/if \(improved\?\.available\) Physical\?\.trainLoad\?\.\(s\.person, s\.intensity\)/);
});
test("risco de lesao por treino intenso exige sessao real",()=>{
  assert.match(engine,/if \(improved\?\.available && s\.intensity === "hard" && rng\.next\(\)/);
});
test("rotina de treino continua respeitando sessao unica e dia de partida",()=>{
  assert.match(training,/function trainingAvailable\(s\)/);
  assert.match(training,/!mandatoryCommitmentToday\(s\)/);
  assert.match(training,/!trainedToday\(s,init\(s\)\)/);
});
