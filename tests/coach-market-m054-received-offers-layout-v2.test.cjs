"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const squadHub=fs.readFileSync(path.join(__dirname,"../src/ui/coach-squad-hub.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("Received offers place urgent deals above collapsible preferences",()=>{
 assert.match(source,/cc-inbox-preferences/);
 assert.ok(source.includes('<details class="cc-card cc-inbox-preferences"'));
 assert.match(source,/cc-inbox-urgent/);
 assert.ok(source.includes('"Nenhuma proposta recebida.")+offerSettings'));
});
test("Received offers keep commands while player availability lives in squad management",()=>{
 assert.match(squadHub,/data-coach-player-status/);
 assert.match(app,/setCoachPlayerOfferStatus/);
 assert.match(source,/data-coach-sale-accept/);
 assert.match(source,/data-coach-sale-reject/);
 assert.match(source,/cc-inbox-offer button\{white-space:nowrap/);
});
