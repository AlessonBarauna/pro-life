"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs");
const ui=fs.readFileSync("src/ui/app.js","utf8");
test("comparação mostra somente candidatos do serviço de dados reais",()=>{
 assert.match(ui,/rivalryApi\?\.candidateStats\?\.\(state\)/);
 assert.match(ui,/Atletas da mesma liga e posição/);
 assert.match(ui,/x\.statistics\?\.appearances\?\?"—"/);
 assert.match(ui,/x\.statistics\?\.averageRating\?\?"—"/);
});
test("lista informativa não inicia rivalidades automaticamente",()=>{
 assert.match(ui,/Esta lista não determina automaticamente uma rivalidade/);
 assert.match(ui,/Nenhuma rivalidade ativa registrada nesta carreira/);
});
