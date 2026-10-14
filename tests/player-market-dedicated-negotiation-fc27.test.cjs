"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8"),css=fs.readFileSync("src/ui/fc27-player-transfers.css","utf8");
test("tela dedicada é usada apenas na carreira de jogador",()=>{
 assert.match(app,/function playerFc27Negotiation\(o\)/);
 assert.match(app,/if\(state\.mode==="player"\) return playerFc27Negotiation\(o\)/);
 assert.match(app,/role="dialog" aria-modal="true"/);
});
test("negociação preserva botões originais e assinatura cinematográfica",()=>{
 const part=app.slice(app.indexOf("function playerFc27Negotiation(o)"),app.indexOf("function negotiationCenter(o)"));
 for(const action of ["data-neg-close","data-neg-sign","data-neg-terms","data-hold-offer","data-neg-reject","data-neg-cancel"])assert.ok(part.includes(action),action);
 assert.match(app,/cineOpen\(cineAgreement\(\) \? "agreement" : "sign"/);
});
test("layout dá espaço aos termos e ações em telas menores",()=>{
 assert.match(css,/\.fc27-transfer-overlay\{position:fixed/);
 assert.match(css,/\.fc27-transfer-content\{display:grid/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/@media\(max-width:450px\)/);
});
