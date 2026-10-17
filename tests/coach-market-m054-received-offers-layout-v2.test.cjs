"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("Received offers place urgent deals above collapsible preferences",()=>{
 assert.match(source,/cc-inbox-preferences/);
 assert.match(source,/<details class=\\?"cc-card cc-inbox-preferences/);
 assert.match(source,/cc-inbox-urgent/);
 assert.match(source,/Nenhuma proposta de compra recebida\.\s*"?\)\+offerSettings/);
});
test("Received offers keep commands and responsive labels",()=>{
 assert.match(source,/data-coach-offer-player-save/);
 assert.match(source,/data-coach-sale-accept/);
 assert.match(source,/data-coach-sale-reject/);
 assert.match(source,/min-width:96px;white-space:nowrap/);
});