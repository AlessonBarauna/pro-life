"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const mobile=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-mobile-sm27.css"),"utf8");
test("aba Partidas usa somente o clube atual e oferece todas as famílias de competição",()=>{
  assert.match(app,/m\.home === state\.clubId \|\| m\.away === state\.clubId/);
  assert.doesNotMatch(app,/list = own\.length \? own : state\.matches/);
  for(const label of ["Liga nacional","Copas","UCL","UEL","Conference","Libertadores","Sul-Americana"])assert.ok(app.includes(label),label);
  assert.match(app,/data-match-competition/);
});
test("filtros de partidas cabem em uma faixa no mobile",()=>{
  assert.match(mobile,/\.game-stage-matches \.fc27-match-filters[\s\S]*repeat\(8,minmax\(0,1fr\)\)/);
});
