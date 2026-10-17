"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("M03 agent contract is accessible through UI and command dispatcher",()=>{
 assert.match(view,/data-coach-contract-negotiate/);
 for(const term of ["salary","years","bonus","role"])assert.match(view,new RegExp("data-coach-contract-"+term));
 assert.match(app,/command\("negotiateCoachContract"/);
 assert.match(game,/case "negotiateCoachContract":/);
});
test("M03 contract negotiation checks seller agreement and limits rounds",()=>{
 assert.match(game,/n\.response!=="accepted"/);
 assert.match(game,/previous\?\.round\|\|0\)>=3/);
 assert.match(game,/contractOffer=\{round,status:/);
});
test("M03 contract cash and terms settle exclusively through recruit",()=>{
 assert.match(game,/const agreedContract=negotiation\?\.contractOffer\?\.status==="accepted"/);
 assert.match(game,/own\.budget -= upfront\+contractBonus/);
 assert.match(game,/if \(own\.budget < upfront\+contractBonus\)/);
 assert.match(game,/p\.contractEndDay=Number\(s\.day\)\+agreedContract\.years\*365/);
 assert.match(game,/p\.salary=agreedContract\.salary/);
});
