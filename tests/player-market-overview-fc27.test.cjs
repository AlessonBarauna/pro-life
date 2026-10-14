"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8");
test("central de negociacoes exclusiva do jogador",()=>{
 assert.match(app,/const playerMarketOverview=state\.mode!=="player"\?"":\(\(\)=>/);
 assert.match(app,/id="player-market-overview"/);
 assert.match(app,/\$\{playerMarketOverview\}<section class="card"/);
});
test("visao usa propostas e interesses existentes em vez de estados ficticios",()=>{
 assert.match(app,/const pending=offers\.length/);
 assert.match(app,/pc\.interests\|\|\[\]/);
 assert.match(app,/x\.stage\|\|"Monitoramento"/);
 assert.match(app,/Interesse não é garantia de proposta/);
});
