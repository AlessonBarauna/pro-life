"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const app=read("src/ui/app.js"),view=read("src/ui/coach-career-view.js"),game=read("src/application/game.js"),index=read("index.html");
test("M06 market navigation routes are handled in the app",()=>{
 for(const route of ["data-coach-market-area","data-coach-scout-screen","data-coach-deal-tab","data-coach-signing-open","data-coach-signing-close","data-coach-signing-squad","data-coach-deal-open","data-coach-deal-close"]) {
  assert.ok(view.includes(route),"Missing UI route "+route);
  assert.ok(app.includes(route),"Missing app route "+route);
 }
});
test("M06 target priority persists through validated coach action",()=>{
 assert.ok(view.includes("data-coach-save-priority"));
 assert.ok(app.includes('command("setCoachTargetPriority"'));
 assert.ok(game.includes('case "setCoachTargetPriority"'));
 assert.ok(game.includes('entry.priority=priority'));
});
test("M06 offer commands keep existing engine dispatch",()=>{
 for(const action of ["acceptSaleOffer","rejectSaleOffer","negotiateCoachContract","toggleCoachShortlist"]) {
  assert.ok(app.includes('command("'+action+'"'),"Missing app command "+action);
  assert.ok(game.includes('case "'+action+'"'),"Missing domain action "+action);
 }
});
test("M06 signing and financial previews do not add execution actions",()=>{
 assert.ok(view.includes("const settlementSummary=settlementReady"));
 assert.ok(view.includes("const reinforcementPanel="));
 assert.ok(view.includes("const rosterPlayer=focusedSigning"));
 assert.ok(index.includes("src/ui/coach-career-view.js"));
});
