"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const career=fs.readFileSync(path.join(__dirname,"../src/domain/coach-career.js"),"utf8");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M02.3 player acceptance and club demand are separate states",()=>{
 assert.match(career,/const clubDemand=available&&inquiry\.playerDecision==="accepted"/);
 assert.match(career,/!result\.eliteGap&&!result\.rival/);
 assert.match(career,/clubDemand\?"asking_price":"rejected"/);
 assert.match(career,/inquiry\.clubDecision=clubDemand\?"asking_price"/);
});
test("M02.3 club demand allows finance offer but outright refusal stays blocked",()=>{
 assert.match(game,/\["accepted","asking_price"\]\.includes\(currentInquiry\.status\)/);
 assert.match(app,/\["accepted","asking_price"\]\.includes\(inquiry\.status\)/);
 assert.match(view,/Exige proposta financeira/);
 assert.match(view,/inquiry\.status==="asking_price"/);
});
