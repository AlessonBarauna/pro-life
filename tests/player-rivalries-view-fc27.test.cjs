"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8");
const engine=fs.readFileSync("src/domain/engine.js","utf8");
const html=fs.readFileSync("index.html","utf8");
test("rivalidades aparecem como seção do Meu Jogador",()=>{
 assert.match(app,/id="player-rivalries"/);
 assert.match(app,/href="#player-rivalries">Rivalidades/);
 assert.match(app,/\$\{rivalryPanel\}/);
});
test("painel usa estado real e não gera rival fictício",()=>{
 assert.match(app,/state\.extras\?\.playerRivalry/);
 assert.match(app,/actualRival\?\.name/);
 assert.match(app,/Nenhuma rivalidade ativa registrada nesta carreira/);
});
test("apenas jogador recebe progresso do motor e módulo carrega no navegador",()=>{
 assert.match(engine,/s\.mode==="player" && s\.extras\?\.playerRivalry/);
 assert.ok(html.indexOf("src/domain/player-rivalries.js")>=0);
 assert.ok(html.indexOf("src/domain/player-rivalries.js")<html.indexOf("src/domain/engine.js"));
});
