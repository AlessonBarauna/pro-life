"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const domain=fs.readFileSync(path.join(__dirname,"../src/domain/coach-career.js"),"utf8");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const catalog=require("../src/data/fc27/fc27-positions-v1.js");
test("Coverage report uses bundled FC27 EA-ID catalog",()=>{
 assert.ok(Object.keys(catalog.alt).length>=11000);
 assert.match(domain,/function positionCoverage\(s\)/);
 assert.match(domain,/const hasSource=Object\.prototype\.hasOwnProperty\.call\(catalog,key\)/);
 assert.match(domain,/const type=verified\?"verified":suggested\?"suggested":"unmatched"/);
 assert.match(domain,/fillPlayerRecords,positionCoverage/);
});
test("Coverage report is available in hierarchy with four distinct counts",()=>{
 assert.match(ui,/ProLifeCoachCareer\?\.positionCoverage\?\.\(state\)/);
 assert.match(ui,/coverage\.verified/);
 assert.match(ui,/coverage\.suggested/);
 assert.match(ui,/coverage\.unmatched/);
 assert.match(ui,/Cobertura por posição/);
});
