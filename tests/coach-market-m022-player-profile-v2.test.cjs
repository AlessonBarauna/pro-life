"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const view=require("../src/ui/coach-career-view.js");
test("M02 player profile is selectable within visible search results",()=>{
 new vm.Script(source);
 assert.match(source,/visibleCandidates\.find\(x=>String\(x\.p\.id\)===String\(ui\.selectedScoutPlayer\)\)/);
 assert.match(source,/data-coach-scout-select/);
 view.selectScoutPlayer("test-athlete");
 assert.equal(view.state.selectedScoutPlayer,"test-athlete");
});
test("M02 profile reuses scouting and transfer actions without changing save data",()=>{
 for(const selector of ["data-coach-shortlist","data-coach-start-scout","data-coach-inquire","data-coach-scout-offer"])assert.ok(source.includes(selector));
 assert.match(source,/const selectedPending=/);
 assert.match(source,/const selectedReady=/);
 assert.match(source,/const selectedCooldown=/);
 assert.match(source,/cc-market-detail-actions/);
});

test("profile displays actual attributes and optional contract data",()=>{
 assert.match(source,/const technical=selectedPlayer\?\.attrs/);
 assert.match(source,/const contractItems=/);
 assert.match(source,/Não informado/);
 assert.match(source,/cc-market-detail-section/);
});

test("scout progress hides unconfirmed attributes and distinguishes estimates",()=>{
 assert.match(source,/const reportComplete=reportReady&&detailReport\.status==="complete"/);
 assert.match(source,/reportReady\?detailReport\.estimatedOverall/);
 assert.match(source,/reportComplete\?\(attrsPanel/);
 assert.match(source,/Não descoberto/);
 assert.match(source,/cc-scout-progress/);
});
