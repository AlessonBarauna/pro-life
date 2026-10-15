"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("Career settings view parses",()=>new vm.Script(src));
test("Negotiation difficulty belongs to career settings instead of transfer center",()=>{
 assert.match(src,/\["configuracoes","Configurações"\]/);
 assert.match(src,/function settings\(s\)/);
 assert.match(src,/ui\.tab==="configuracoes"\?settings\(s\)/);
 const negotiation=src.slice(src.indexOf("function negotiations(s,D)"),src.indexOf("function settings(s)"));
 assert.doesNotMatch(negotiation,/data-coach-market-difficulty-save/);
 assert.match(src.slice(src.indexOf("function settings(s)")) ,/data-coach-market-difficulty-save/);
});
test("Original difficulty still persists through existing command",()=>{
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(app,/A\.execute\(state,"coachMarketDifficulty",\{difficulty\}\)/);
});
