"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M04.7 finance view parses",()=>new vm.Script(src));
test("M04.7 forecast has fallback without economy module",()=>{
 assert.match(src,/ProLifeClubEconomy\?\.revenueProjection\?\.\(own\)\|\|\(\(\)=>\{/);
 assert.match(src,/const sponsorshipAnnual=Math\.round/);
 assert.match(src,/const broadcastAnnual=Math\.round/);
 assert.match(src,/futureRevenuePanel\+settlementPanel/);
});
