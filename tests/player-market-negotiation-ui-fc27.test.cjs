"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("src/ui/app.js","utf8");
const css=fs.readFileSync("src/ui/fc27-player-transfers.css","utf8");
test("negociação 2D carrega estilo depois do layout anterior",()=>{
 assert.ok(html.indexOf("src/ui/fc27-player-transfers.css")>html.indexOf("src/ui/fc27-05c-player.css"));
});
test("escopo da interface protege modo treinador",()=>{
 assert.match(app,/state\.mode==="player"\?"pl-player-transfer-experience":""/);
 assert.match(css,/\.pl-player-transfer-experience \.neg-center/);
});
test("negociação usa grade responsiva e preserva texto dos botões",()=>{
 assert.match(css,/\.neg-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.neg-actions button\{[^}]*white-space:normal/);
 assert.match(css,/@media\(max-width:520px\)/);
});
test("ações originais continuam presentes no fluxo",()=>{
 for(const action of ["data-neg-sign","data-neg-terms","data-hold-offer","data-neg-reject"])assert.ok(app.includes(action),action);
});
