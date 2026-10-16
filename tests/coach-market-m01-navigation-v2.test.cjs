"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const view=require("../src/ui/coach-career-view.js");
test("M01 market entry exposes distinct scouting and transfer navigation",()=>{
 new vm.Script(source);
 assert.match(source,/cc-market-entry/);
 assert.match(source,/PAINEL DO DIRETOR ESPORTIVO/);
 assert.match(source,/data-coach-market-area="observacao"/);
 assert.match(source,/data-coach-market-area="transferencias"/);
 view.setMarketArea("observacao");assert.equal(view.state.marketArea,"observacao");
 view.setMarketArea("transferencias");assert.equal(view.state.marketArea,"transferencias");
});
test("M01 reuses existing market commands and negotiation detail",()=>{
 assert.match(source,/\+intro\+navigation\+negotiations\(s,D\)/);
 assert.match(source,/data-coach-deal-tab/);
 assert.match(source,/data-coach-deal-open/);
});
