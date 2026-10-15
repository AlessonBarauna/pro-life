"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const domain=fs.readFileSync(path.join(__dirname,"../src/domain/coach-career.js"),"utf8");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("M02 inquiry is validated, unique while pending and saved before negotiation",()=>{
 const block=game.split('case "coachInquiry": {')[1]?.split('case "counterRecruit":')[0];
 assert.ok(block);
 assert.match(block,/s\.mode!=="coach"/);
 assert.match(block,/buyer\.id===seller\.id/);
 assert.match(block,/existing&&existing\.status==="pending"/);
 assert.match(block,/responseDay:\(Number\(s\.day\)\|\|0\)\+2/);
 assert.match(block,/status:"pending"/);
 assert.doesNotMatch(block,/\.budget\s*[-+]?=/);
});
test("M02 resolves pending inquiries once with bounded deterministic interest",()=>{
 assert.match(domain,/function settleInquiries\(s,api\)/);
 assert.match(domain,/inquiry\.status!=="pending"/);
 assert.match(domain,/Number\(s\.day\)<Number\(inquiry\.responseDay\)/);
 assert.match(domain,/inquiry\.playerDecision=/);
 assert.match(domain,/inquiry\.clubDecision=/);
 assert.match(domain,/inquiry\.status=inquiry\.playerDecision==="accepted"&&inquiry\.clubDecision==="accepted"/);
 assert.match(domain,/settleInquiries\(s,api\)/);
});
test("M02 inquiry button requires acceptance before starting a new offer",()=>{
 assert.match(view,/data-coach-inquire/);
 assert.match(view,/Sondagem enviada/);
 assert.match(view,/Sondagem recusada/);
 assert.match(view,/Sondagem aceita/);
 assert.match(app,/command\("coachInquiry"/);
 assert.match(app,/inquiry\.status!=="accepted"/);
 assert.match(app,/command\("counterRecruit"/);
});
