"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");

const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");

test("aba do treinador apresenta treino da equipe e separa a licença profissional",()=>{
  const start=app.indexOf('training() {');
  const end=app.indexOf('const plan = D.Training.init(state)',start);
  const coachTraining=app.slice(start,end);
  assert.ok(start>=0&&end>start);
  assert.match(coachTraining,/PREPARAÇÃO DO ELENCO/);
  assert.match(coachTraining,/Treino da equipe/);
  assert.match(coachTraining,/data-coach-focus/);
  assert.match(coachTraining,/Gerenciar planos individuais/);
  assert.match(coachTraining,/FORMAÇÃO PROFISSIONAL/);
  assert.doesNotMatch(coachTraining,/DESENVOLVIMENTO DO TREINADOR|Aplicar rotina|data-action="train"/);
  assert.match(app,/\["training", "Treino da equipe"\]/);
});

test("modo treinador altera o foco coletivo e não pode executar treino individual",()=>{
  const s=D.create({mode:"coach",catalogVersion:"fc27_v1"},2027);
  s.clubId=null;D.join(s,"gf_fc27_5",90000);
  const personalBefore={training:s.training,intensity:s.intensity};
  A.execute(s,"coachFocus",{focus:"recuperacao"});
  assert.equal(s.coachCareer.focus,"recuperacao");
  assert.deepEqual({training:s.training,intensity:s.intensity},personalBefore);
  assert.throws(()=>A.execute(s,"train",{focus:"balanced",intensity:"hard"}),/carreira de jogador/);
});

test("carga pessoal antiga não aumenta o estresse físico do treinador",()=>{
  assert.match(engine,/const personalIntensity=s\.mode==="player"\?s\.intensity:"normal"/);
  assert.match(engine,/personalIntensity === "hard"/);
});
