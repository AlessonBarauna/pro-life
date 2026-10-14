"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8"),css=fs.readFileSync("src/ui/fc27-player-transfers.css","utf8");
test("abas do mercado presentes apenas para jogador",()=>{
 assert.match(app,/state\.mode==="player"\?"pl-player-transfer-experience pl-market-j054":""/);
 for(const key of ['"negotiations","Negociações"','"clubs","Clubes-alvo"','"contracts","Contrato e agente"']) assert.ok(app.includes(key),key);
});
test("seções existentes preservadas na navegação",()=>{
 for(const key of ["pl-market-negotiations","pl-market-clubs","pl-market-contracts","data-player-market-section"])assert.ok(app.includes(key),key);
 assert.match(app,/playerMarketSection=el\.dataset\.playerMarketSection; render\(\); return/);
});
test("esconder seção não altera estado do motor",()=>{
 assert.match(css,/data-player-market-section="negotiations"/);
 assert.match(css,/data-player-market-section="clubs"/);
 assert.match(css,/data-player-market-section="contracts"/);
 assert.match(app,/function playerFc27Negotiation\(o\)/);
});
