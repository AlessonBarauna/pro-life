"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("Current-career difficulty modules parse",()=>{for(const p of ["src/application/game.js","src/ui/coach-career-view.js","src/ui/app.js"])new vm.Script(read(p),{filename:p});});
test("Difficulty command validates coach mode, allowed options and updates only settings",()=>{
 const src=read("src/application/game.js");
 const start=src.indexOf('case "coachMarketDifficulty":');
 const end=src.indexOf('case "coachFocus":',start);
 assert.ok(start>=0&&end>start);
 const body=src.slice(start,end);
 assert.match(body,/s\.mode!=="coach"/);
 assert.match(body,/\["flexible","normal","strict"\]/);
 assert.match(body,/s\.coachCareer\.settings\.marketStrictness=difficulty/);
 assert.doesNotMatch(body,/negotiations|inquiries|budget\s*=/);
});
test("Difficulty selector persists through existing app save process",()=>{
 const ui=read("src/ui/coach-career-view.js"),app=read("src/ui/app.js");
 assert.match(ui,/data-coach-market-difficulty-save/);
 assert.match(app,/A\.execute\(state,"coachMarketDifficulty",\{difficulty\}\);persist\(\);render\(\);/);
});
