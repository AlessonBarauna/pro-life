"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const E=require("../src/domain/club-economy.js"),C=require("../src/domain/commercial.js");
test("M04.13 sponsor counter accepts a custom amount and remains pending",()=>{
 const club={id:"sp",structure:80,leagueId:"serieA"},state={mode:"coach",clubId:"sp",day:150,season:2026,coachCareer:{}};
 const offer=E.sponsorshipOffers(state,club,C.brands)[0],amount=Math.round(offer.annualAmount*1.07);
 const result=E.decideSponsorship(state,club,C.brands,offer.id,"counter",amount);
 assert.equal(result.counterAmount,amount);
 assert.equal(result.status,"awaiting_brand");
 assert.equal(result.replyDay,153);
 assert.equal(state.coachCareer.finance.revenueContracts,undefined);
});
test("M04.13 UI validates input and supports cancel without save",()=>{
 const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 new vm.Script(view);new vm.Script(app);
 assert.match(view,/data-coach-sponsor-base/);
 assert.match(app,/window\.prompt\("Proposta anual/);
 assert.match(app,/if\(answer===null\)return/);
 assert.match(app,/Number\.isSafeInteger\(amount\)/);
});
