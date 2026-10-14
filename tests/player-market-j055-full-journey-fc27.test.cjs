"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8");
const css=fs.readFileSync("src/ui/fc27-player-transfers.css","utf8");
test("J05.5: shortlist, negociação e status exclusivos de jogador",()=>{
 assert.match(app,/if\(state\.mode==="player"\)return `<article class="pl-offer-shortlist/);
 assert.match(app,/class="pl-deal-progress"/);
 assert.match(app,/if\(state\.mode==="player"\) return playerFc27Negotiation\(o\)/);
});
test("J05.5: jornada utiliza contrato e chegada já registrados sem inventar estados",()=>{
 assert.match(app,/const playerContractJourney=state\.mode!=="player"\?"":\(\(\)=>\{/);
 assert.match(app,/agreement=cineAgreement\(\), arrival=cineArrival\(\)/);
 assert.match(app,/data-cine-agreement/);
 assert.match(app,/data-cine-present/);
 assert.match(app,/\$\{playerContractJourney\}\$\{playerMarketOverview\}/);
});
test("J05.5: assinatura canônica mantém uma única execução de join",()=>{
 const a=app.indexOf("function cineSign()"),b=app.indexOf("function cineAutoPresent()",a);
 const sign=app.slice(a,b);
 assert.equal((sign.match(/A\.execute\(state, "join"/g)||[]).length,1);
 assert.match(sign,/if \(cineAgreement\(\)\)/);
 assert.match(sign,/persist\(\)/);
});
test("J05.5: botões de decisão permanecem ligados aos eventos originais",()=>{
 const start=app.indexOf("function playerFc27Negotiation(o)");
 const end=app.indexOf("function negotiationCenter(o)",start);
 const screen=app.slice(start,end);
 for(const field of ["data-neg-sign","data-neg-terms","data-hold-offer","data-neg-reject","data-counter","data-neg-cancel"])assert.ok(screen.includes(field),field);
});
test("J05.5: responsivo e correção do título da caixa de entrada",()=>{
 assert.match(css,/\.pl-contract-steps\{display:grid/);
 assert.match(css,/\.pl-offer-shortlist-main\{display:grid/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(app,/<h2>Mensagens da carreira<\/h2><p class="muted">/);
});
test("J05.5: não recria bug de clique das abas",()=>{
 assert.match(app,/q\("button\[data-player-market-section\]"\)/);
 assert.doesNotMatch(app,/q\("\[data-player-market-section\]"\)/);
});
