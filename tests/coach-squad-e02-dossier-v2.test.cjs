"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-05b-squad.css"),"utf8");
test("E02 detail tabs have real panels and safe navigation",()=>{
 assert.match(source,/squadDetailTab = "attributes"/);
 assert.match(source,/data-squad-detail-tab/);
 assert.match(source,/squadDetailTab==="comparison"\?comparisonInfo/);
 assert.match(source,/squadDetailTab==="contract"\?contractInfo/);
 assert.match(source,/if \(b\.dataset\.squadDetailTab\)/);
 assert.match(source,/\["attributes","comparison","contract"\]\.includes/);
});
test("E02 contract and comparison use actual player data",()=>{
 assert.match(source,/selected\.contractEndDay/);
 assert.match(source,/selected\.salary/);
 assert.match(source,/comparison\.name/);
 assert.match(source,/D\.overall\(comparison\)/);
});
test("E02 player panel retains aside and responsive styling",()=>{
 assert.match(source,/\$\{detailBody\}<footer>/);
 assert.match(css,/\.pl-squad-screen \.pl-squad-info-grid/);
 assert.match(css,/\.pl-squad-screen \.pl-squad-detail-tabs button\.active/);
});
