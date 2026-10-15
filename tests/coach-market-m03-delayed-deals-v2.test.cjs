"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const domain=fs.readFileSync(path.join(__dirname,"../src/domain/coach-career.js"),"utf8");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M03: new and revised offers wait for a two-day response",()=>{
 assert.match(game,/response:"awaiting_reply",replyDay:Number\(s\.day\)\+2/);
 assert.match(game,/n\.response="awaiting_reply";n\.replyDay=Number\(s\.day\)\+2/);
 assert.match(game,/if\(n\.response==="awaiting_reply"\)throw Error/);
});
test("M03: settle once, publish answer after waiting, and keep historical deals",()=>{
 assert.match(domain,/function settleTransferReplies\(s\)/);
 assert.match(domain,/n\.response!=="awaiting_reply"/);
 assert.match(domain,/Number\(s\.day\)<Number\(n\.replyDay\)/);
 assert.match(domain,/delete n\.pendingOutcome/);
 assert.match(domain,/settleTransferReplies\(s\)/);
});
test("M03: pending offers cannot conclude and show a career date",()=>{
 assert.match(game,/if\(n\.response!=="accepted"\)throw Error\("Aguarde o aceite/);
 assert.match(view,/Aguardando resposta até "\+careerDate\(s,n\.replyDay\)/);
 assert.match(view,/selected\.response!=="awaiting_reply"/);
 assert.match(view,/Resposta prevista em '\+careerDate\(s,n\.replyDay\)/);
});
