"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.resolve(__dirname,"../src/ui/app.js"),"utf8");
const live=fs.readFileSync(path.resolve(__dirname,"../src/ui/live-match.js"),"utf8");

test("25A UI: Seleção usa o live match existente sem bloqueio legado",()=>{
  assert.doesNotMatch(app,/Acompanhamento ao vivo da Seleção será integrado/);
  assert.match(app,/D\.NationalTeam\.init\(state\)\.lastMatchday/);
  assert.match(app,/next\.national \? \{ name:played\.homeName/);
});

test("25C UI: pós-jogo apresenta métricas, evolução e impactos",()=>{
  for(const label of ["PÓS-JOGO","MINUTOS","GOLS","ASSIST.","NOTA","XP","Evolução","Confiança e papel","Reputação"])
    assert.match(app,new RegExp(label.replace(".","\\.")));
  assert.match(app,/attributeChanges/);assert.match(app,/nationalImpact/);
});

test("25A UI: painel ao vivo exibe assistência e minutos do jogador",()=>{
  assert.match(live,/playerStats\?\.hero\?\.assists/);
  assert.match(live,/playerStats\?\.hero\?\.minutes/);
});
