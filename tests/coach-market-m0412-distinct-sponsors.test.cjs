"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/club-economy.js");
const C=require("../src/domain/commercial.js");
const club={id:"sp",structure:80,leagueId:"serieA",budget:112665000};
const make=()=>({mode:"coach",clubId:"sp",day:125,season:2026,coachCareer:{finance:{}}});
test("M04.12 three concurrent sponsor categories choose different brands",()=>{
 const s=make(),offers=E.sponsorshipOffers(s,club,C.brands);
 assert.equal(offers.length,3);
 assert.equal(new Set(offers.map(o=>o.brandId)).size,3);
 assert.deepEqual(offers,E.sponsorshipOffers(s,club,C.brands));
});
test("M04.12 accepting one sponsor must not reassign brand to another category",()=>{
 const s=make(),first=E.sponsorshipOffers(s,club,C.brands)[0];
 E.acceptSponsorshipOffer(s,club,C.brands,first.id);
 const rest=E.sponsorshipOffers(s,club,C.brands);
 assert.equal(rest.length,2);
 assert.ok(rest.every(o=>o.brandId!==first.brandId));
 assert.equal(new Set(rest.map(o=>o.brandId)).size,2);
 assert.equal(s.coachCareer.finance.revenueContracts.length,1);
});
test("M04.12 existing sponsor records are not edited by proposal generation",()=>{
 const s=make();
 s.coachCareer.finance.revenueContracts=[{id:"prior",clubId:"sp",type:"sponsorship",brandId:"nike",brandName:"Nike",sponsorRole:"main",endDay:600}];
 const before=JSON.stringify(s);
 const offers=E.sponsorshipOffers(s,club,C.brands);
 assert.ok(offers.every(o=>o.brandId!=="nike"));
 assert.equal(JSON.stringify(s),before);
});
