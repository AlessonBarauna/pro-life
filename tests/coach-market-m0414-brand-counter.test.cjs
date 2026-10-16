"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const E=require("../src/domain/club-economy.js"),C=require("../src/domain/commercial.js");
const club={id:"sp",structure:80,leagueId:"serieA"},state=()=>({mode:"coach",clubId:"sp",day:100,season:2026,coachCareer:{finance:{}}});
test("High counter triggers brand counter, no financial movement",()=>{
 const s=state(),o=E.sponsorshipOffers(s,club,C.brands)[0];
 E.decideSponsorship(s,club,C.brands,o.id,"counter",Math.round(o.annualAmount*1.2));
 s.day=103;E.settleSponsorshipReplies(s);
 const rec=s.coachCareer.finance.sponsorshipOffers[0];
 assert.equal(rec.status,"brand_countered");
 assert.ok(rec.brandCounterAmount>o.annualAmount);
 assert.equal(rec.responseExpiresDay,110);
 assert.equal(s.coachCareer.finance.revenueContracts,undefined);
 E.rejectBrandCounter(s,o.id);
 assert.equal(rec.status,"rejected");
 assert.throws(()=>E.acceptSponsorshipOffer(s,club,C.brands,o.id));
});
test("Brand counter can be accepted once for brand's price",()=>{
 const s=state(),o=E.sponsorshipOffers(s,club,C.brands)[0];
 E.decideSponsorship(s,club,C.brands,o.id,"counter",Math.round(o.annualAmount*1.2));
 s.day=103;E.settleSponsorshipReplies(s);
 const rec=s.coachCareer.finance.sponsorshipOffers[0];
 const signed=E.acceptSponsorshipOffer(s,club,C.brands,o.id);
 assert.equal(signed.annualAmount,rec.brandCounterAmount);
 assert.equal(signed.postedAmount,0);
 assert.throws(()=>E.acceptSponsorshipOffer(s,club,C.brands,o.id));
});
test("UI parses and exposes brand decisions",()=>{
 const ui=fs.readFileSync("src/ui/coach-career-view.js","utf8");
 const app=fs.readFileSync("src/ui/app.js","utf8");
 new vm.Script(ui);new vm.Script(app);
 assert.match(ui,/data-coach-sponsor-decline/);
 assert.match(app,/rejectBrandCounter/);
});
