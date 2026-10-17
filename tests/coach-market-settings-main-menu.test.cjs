"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("Main app and career settings compile",()=>{
 new vm.Script(read("src/ui/app.js"));
 new vm.Script(read("src/ui/coach-career-view.js"));
});
test("Settings are available from the global More menu for coaches",()=>{
 const app=read("src/ui/app.js");
 assert.match(app,/state\.mode==="coach"\?'(?:<button[^']*data-coach-settings-open)/);
 assert.match(app,/page="coachCareer";/);
 assert.match(app,/setTab\("configuracoes"\)/);
});
test("Existing save handling remains unchanged",()=>{
 const app=read("src/ui/app.js");
 assert.match(app,/A\.execute\(state,"coachMarketDifficulty",\{difficulty\}\);persist\(\);render\(\);/);
});
