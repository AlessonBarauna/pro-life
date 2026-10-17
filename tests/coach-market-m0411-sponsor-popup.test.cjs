"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("Coach sponsorship popup integration parses",()=>new vm.Script(src));
test("Coach sponsorship offers reuse career decision popup",()=>{
 assert.match(src,/function ensureCoachSponsorPopup\(\)/);
 assert.match(src,/economy\.sponsorshipOffers\(state,club,brands\)/);
 assert.match(src,/coachSponsorPopupSeen\.add\(pending\.id\)/);
 assert.match(src,/showSimulationStop\(\{type:"coach-sponsor"/);
 assert.match(src,/"coach-sponsor":\{page:"market"/);
});
test("Popup navigates to coach financial market and does not accept automatically",()=>{
 assert.match(src,/b\.dataset\.stopGo==="market"&&state\?\.mode==="coach"/);
 assert.match(src,/setDealTab\("financeiro"\)/);
 const start=src.indexOf("  function ensureCoachSponsorPopup()");
 const end=src.indexOf("  function ensurePendingDecisionPopup",start);
 assert.doesNotMatch(src.slice(start,end),/coachAcceptSponsorship|persist\(/);
});
