"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const economy=require("../src/domain/club-economy.js");
const commercial=require("../src/domain/commercial.js");
test("M04.10 uses existing commercial brands without creating contracts",()=>{
 const state={id:"sp",structure:80,budget:112665000};
 const original=JSON.stringify(state);
 const candidates=economy.sponsorshipCandidates(state,commercial.brands);
 assert.ok(candidates.length>0);
 assert.ok(candidates.some(x=>x.name==="Nike"));
 assert.ok(candidates.every(x=>x.readOnly&&x.existingClubContract===false));
 assert.equal(JSON.stringify(state),original);
});
test("M04.10 candidate list never modifies brand source",()=>{
 const brands=[{id:"id",name:"Example",tier:"NATIONAL",prestige:75}];
 const initial=JSON.stringify(brands);
 const candidates=economy.sponsorshipCandidates({structure:60},brands);
 assert.equal(candidates[0].source,"commercial_brand_catalog");
 assert.equal(JSON.stringify(brands),initial);
});
test("M04.10 UI labels brands as references, not confirmed sponsors",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
 new vm.Script(src);
 assert.match(src,/Marcas do catálogo — referências/);
 assert.match(src,/não patrocinadores confirmados do clube/);
 assert.match(src,/sponsorCatalogPanel\+sponsorshipOfferPanel\+revenueContractPanel/);
});
