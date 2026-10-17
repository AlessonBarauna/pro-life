"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const E=require("../src/domain/club-economy.js");
const C=require("../src/domain/commercial.js");
const club={id:"sp",structure:80,leagueId:"serieA",budget:112665000};
const make=()=>({mode:"coach",clubId:"sp",day:120,season:2026,coachCareer:{finance:{}},clubs:[structuredClone(club)]});
test("M04.11 proposals are stable, categorized and read-only",()=>{
 const s=make(),before=JSON.stringify(s);
 const proposals=E.sponsorshipOffers(s,s.clubs[0],C.brands);
 assert.ok(proposals.length>=2);
 assert.ok(proposals.some(x=>x.role==="main"));
 assert.ok(proposals.some(x=>x.role==="kit"));
 assert.ok(proposals.every(x=>x.annualAmount>0&&x.status==="proposal"));
 assert.deepEqual(proposals,E.sponsorshipOffers(s,s.clubs[0],C.brands));
 assert.equal(JSON.stringify(s),before);
});
test("M04.11 accepting a proposal persists contract once without credit",()=>{
 const s=make(),offer=E.sponsorshipOffers(s,s.clubs[0],C.brands)[0];
 const contract=E.acceptSponsorshipOffer(s,s.clubs[0],C.brands,offer.id);
 assert.equal(contract.brandId,offer.brandId);
 assert.equal(contract.sponsorRole,offer.role);
 assert.equal(contract.startDay,121);
 assert.equal(contract.postedAmount,0);
 assert.equal(s.clubs[0].budget,112665000);
 assert.equal(s.coachCareer.finance.revenueContracts.length,1);
 assert.throws(()=>E.acceptSponsorshipOffer(s,s.clubs[0],C.brands,offer.id));
 assert.equal(s.coachCareer.finance.revenueContracts.length,1);
});
test("M04.11 rejected or invalid offer cannot change game state",()=>{
 const s=make(),before=JSON.stringify(s);
 assert.throws(()=>E.acceptSponsorshipOffer(s,s.clubs[0],C.brands,"forged"));
 assert.equal(JSON.stringify(s),before);
});
test("M04.11 view and autosave wiring parse",()=>{
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 new vm.Script(ui);new vm.Script(app);
 assert.match(ui,/data-coach-sponsor-accept/);
 assert.match(app,/A\.execute\(state,"coachAcceptSponsorship",\{offerId\}\);persist\(\);render\(\)/);
});
