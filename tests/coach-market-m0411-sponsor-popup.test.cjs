"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("Coach sponsorship popup integration parses",()=>new vm.Script(src));
test("Coach sponsorship offers reuse career decision popup",()=>{
 assert.match(src,/function ensureCoachSponsorPopup\(\)/);
 assert.match(src,/economy\.sponsorshipOffers\(state,club,brands\)/);
 assert.match(src,/coachSponsorPopupSeen\.add\(entry\.id\)/);
 assert.match(src,/showSimulationStop\(\{type:"coach-sponsor"/);
 assert.match(src,/"coach-sponsor":\{page:"clubSponsorships"/);
});
test("Popup materializes the save and navigates to the exact club proposal without accepting",()=>{
 assert.match(src,/initializeSponsorships\?\.\(state,club,brands\)/);
 assert.match(src,/anchor:`club-sponsor-offer-\$\{stop\.id\}`/);
 const start=src.indexOf("  function ensureCoachSponsorPopup()");
 const end=src.indexOf("  function ensurePendingDecisionPopup",start);
 assert.doesNotMatch(src.slice(start,end),/coachAcceptSponsorship/);
});
