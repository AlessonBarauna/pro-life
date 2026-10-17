"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M04.10 view parses with catalog fallback",()=>new vm.Script(src));
test("M04.10 uses commercial brand catalog when economy helper is unavailable",()=>{
 assert.match(src,/Array\.isArray\(root\.ProLifeCommercial\?\.brands\)/);
 assert.match(src,/\|\|sponsorBrands\.filter/);
 assert.match(src,/clubSponsorCandidates\.slice\(0,8\)/);
});
