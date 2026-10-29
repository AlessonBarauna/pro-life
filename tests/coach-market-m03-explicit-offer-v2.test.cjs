"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("M03 opening negotiation creates an unsent draft",()=>{
 assert.match(view,/draftOffer:null/);
 assert.match(view,/startOffer:\(clubId,playerId,suggestedOffer\)=>/);
 assert.match(view,/Nenhuma proposta foi enviada ainda/);
 assert.match(view,/data-coach-new-offer/);
 assert.match(view,/data-coach-submit-offer/);
 assert.match(view,/data-coach-cancel-offer/);
});
test("M03 only explicit submit invokes counterRecruit",()=>{
 const first=app.split('if(el.hasAttribute("data-coach-scout-offer")){')[1]?.split('if(el.hasAttribute("data-coach-cancel-offer"))')[0];
 const submit=app.split('if(el.hasAttribute("data-coach-submit-offer")){')[1]?.split('if(el.hasAttribute("data-coach-offer-save"))')[0];
 assert.ok(first&&submit);
 assert.match(first,/V\?\.startOffer\(/);
 assert.doesNotMatch(first,/command\("counterRecruit"/);
 assert.match(submit,/command\("counterRecruit",\{clubId,playerId,offer\}\)/);
 assert.match(submit,/offer<1000/);
 assert.match(submit,/if\(completed\)\{V\?\.awaitDealResponse\(\);render\(\);toast\("Proposta enviada\. Aguarde a resposta do clube\."\);\}/);
 assert.doesNotMatch(submit,/V\?\.clearOffer\(\)[\s\S]*command\("counterRecruit"/,"falha no envio preserva o rascunho");
});
test("M03 successful offer leaves the negotiation table and returns to market overview",()=>{
 assert.match(view,/awaitDealResponse:\(\)=>\{ui\.draftOffer=null;ui\.selectedDeal=null;ui\.dealTab="propostas";ui\.marketArea="overview";\}/);
 const revise=app.split('if(el.hasAttribute("data-coach-deal-revise")){')[1]?.split('if (el.hasAttribute("data-coach-deal-accept"))')[0];
 assert.ok(revise);
 assert.match(revise,/if\(completed\)\{V\?\.awaitDealResponse\(\);render\(\);toast\("Contraproposta enviada\. Aguarde a resposta do clube\."\);\}/);
});
