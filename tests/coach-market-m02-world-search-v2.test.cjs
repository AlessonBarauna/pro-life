"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const viewPath=path.join(__dirname,"../src/ui/coach-career-view.js");
const appPath=path.join(__dirname,"../src/ui/app.js");
const source=fs.readFileSync(viewPath,"utf8");
const app=fs.readFileSync(appPath,"utf8");
const view=require(viewPath);
test("M02 searches the full player pool and uses paged output",()=>{
 assert.match(source,/const pageSize=40/);
 assert.match(source,/const visibleCandidates=candidates\.slice/);
 assert.doesNotMatch(source,/if\(candidates\.length>=80\)break/);
 assert.match(source,/normalizeText\(p\.name\)\.includes\(needle\)/);
});
test("M02 pagination reuses scouting filters and existing actions",()=>{
 view.setScoutPage("next");assert.equal(view.state.scoutPage,1);
 view.setScoutPage("prev");assert.equal(view.state.scoutPage,0);
 view.setScoutFilters("Pedri","all");assert.equal(view.state.scoutPage,0);
 assert.match(source,/data-coach-shortlist/);
 assert.match(source,/data-coach-start-scout/);
 assert.match(app,/data-coach-scout-page/);
});
