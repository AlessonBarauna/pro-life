"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("Pending seller response is not shown as a zero counteroffer",()=>{
 assert.match(ui,/selected\.response==="awaiting_reply"\?"Aguardando resposta"/);
 assert.match(ui,/h\.status==="sent"\|\|h\.response==null/);
 assert.match(ui,/fee=selected\?\.response==="awaiting_reply"\?Number\(selected\.requested\)/);
});
test("Pending first round does not claim negotiation rounds are exhausted",()=>{
 assert.match(ui,/selected\.response==="awaiting_reply"\?'Aguarde a resposta do clube/);
 assert.match(ui,/careerDate\(s,selected\.expiresDay\)/);
});
