"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M01 market overview reflects current saved deal state",()=>{
 assert.match(source,/const summaryCards=\[/);
 assert.match(source,/sales\.filter\(x=>x\.status==="pending"\)/);
 assert.match(source,/pending\.filter\(x=>x\.status==="pending"\)/);
 assert.match(source,/status==="awaiting_window"/);
 assert.match(source,/\(c\.shortlist\|\|\[\]\)\.length/);
});
test("M01 category shortcuts use existing working tab dispatcher",()=>{
 assert.match(source,/class="cc-market-overview-card" data-coach-deal-tab/);
 assert.match(source,/const marketOverview=/);
 assert.match(source,/marketOverview\+taskPanel/);
 assert.match(source,/\.cc-market-overview-grid/);
});

test("M01 market categories have label and count for contracts",()=>{
 assert.match(source,/\["contratos","Contratos",\(D\?\.club\?\.\(s,s\.clubId\)\?\.roster\|\|\[\]\)\.length\]/);
});
