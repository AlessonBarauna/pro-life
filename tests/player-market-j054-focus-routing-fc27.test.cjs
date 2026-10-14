"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8");
test("somente botão de aba do mercado aciona render ao clicar",()=>{
 assert.match(app,/q\("button\[data-player-market-section\]"\)/);
 assert.doesNotMatch(app,/q\("\[data-player-market-section\]"\)/);
});
test("contêiner com estado da aba não é tratado como botão",()=>{
 assert.match(app,/data-player-market-section="\$\{esc\(playerMarketSection\)\}"/);
 assert.match(app,/data-player-market-section="\$\{id\}"/);
});
test("filtros permanecem com eventos próprios",()=>{
 const target=fs.readFileSync("src/ui/target-club-selector.js","utf8");
 assert.match(target,/data-target-club-country/);
 assert.match(target,/data-target-club-league/);
 assert.match(target,/data-target-club-search/);
});
