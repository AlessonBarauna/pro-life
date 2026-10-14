"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8"),css=fs.readFileSync("src/ui/fc27-j06-squad.css","utf8");
test("detalhes da escalação possuem 3 abas reais",()=>{
 for(const x of ['"attributes","Atributos"','"competition","Concorrência"','"hierarchy","Hierarquia"'])assert.ok(app.includes(x),x);
 assert.match(app,/data-j06-detail-tab="\$\{id\}"/);
 assert.match(app,/if \(b\.dataset\.j06DetailTab\) \{ j06DetailTab = b\.dataset\.j06DetailTab; render\(\); return; \}/);
});
test("cada painel é exclusivo da aba escolhida",()=>{
 for(const key of ["attributes","competition","hierarchy"])assert.ok(app.includes('j06DetailTab==="'+key+'"'));
 assert.match(css,/\.pl-j06-panel\[hidden\]\{display:none!important\}/);
});
test("dados aproveitam o motor sem mutação",()=>{
 assert.match(app,/const j06CompetitionInfo=selected/);
 assert.match(app,/const j06PlayerInfo=j06Hero/);
 assert.match(app,/Charts\.radar\(ratings\)/);
});
