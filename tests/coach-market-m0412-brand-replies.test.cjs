"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const engine=require("../src/domain/club-economy.js");
const club={id:"sp",strength:85,structure:85,leagueId:"seriea",budget:1000000};
const brands=[{id:"nike",name:"Nike",tier:"GLOBAL",category:"SPORTSWEAR",prestige:100},{id:"coca",name:"Coca-Cola",tier:"GLOBAL",category:"DRINKS",prestige:90}];
function make(){return {mode:"coach",clubId:"sp",day:200,season:1,coachCareer:{}};}
test("counteroffer waits three career days before brand answer; no cash credited",()=>{
 const s=make(),offer=engine.sponsorshipOffers(s,club,brands)[0];
 const c=engine.decideSponsorship(s,club,brands,offer.id,"counter",Math.round(offer.annualAmount*1.1));
 assert.equal(c.status,"awaiting_brand");
 assert.equal(c.replyDay,203);
 assert.equal(engine.settleSponsorshipReplies(s).length,0);
 s.day=202;assert.equal(engine.settleSponsorshipReplies(s).length,0);
 s.day=203;assert.equal(engine.settleSponsorshipReplies(s).length,1);
 assert.equal(c.status,"brand_accepted");
 assert.equal(engine.settleSponsorshipReplies(s).length,0);
 assert.equal(s.coachCareer.finance.revenueContracts,undefined);
});
test("rejected brand response cannot be signed; accepted response can be signed only once",()=>{
 const s=make(),offer=engine.sponsorshipOffers(s,club,brands)[0];
 const c=engine.decideSponsorship(s,club,brands,offer.id,"counter",Math.round(offer.annualAmount*1.2));
 s.day=203;engine.settleSponsorshipReplies(s);
 assert.equal(c.status,"brand_rejected");
 assert.throws(()=>engine.acceptSponsorshipOffer(s,club,brands,offer.id));
 const remaining=engine.sponsorshipOffers(s,club,brands);
 const other=remaining.find(o=>o.id!==offer.id);
 assert.ok(other);
 const accepted=engine.acceptSponsorshipOffer(s,club,brands,other.id);
 assert.equal(accepted.postedAmount,0);
 assert.throws(()=>engine.acceptSponsorshipOffer(s,club,brands,other.id));
});
test("coach day and popup integration are wired",()=>{
 const daily=fs.readFileSync(path.join(__dirname,"../src/domain/coach-career.js"),"utf8");
 const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(daily,/settleSponsorshipReplies/);
 assert.match(app,/Resposta de patrocínio/);
});
