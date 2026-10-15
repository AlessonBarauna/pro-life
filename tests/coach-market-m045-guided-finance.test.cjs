"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-creator.js"),"utf8");
test("M04.5 coach creator JS parses",()=>{new vm.Script(src);});
test("M04.5 financial scenario is selectable and passed to creation",()=>{
 for(const id of ["legacy","conservative","standard","ambitious"])assert.ok(src.includes('<option value="'+id+'">'));
 assert.match(src,/financialScenario:String\(f\.get\("clubId"\)\|\|""\)\?/);
});
test("M04.5 preview displays base, funding and total",()=>{
 assert.match(src,/function financePreview\(\)/);
 assert.match(src,/Orçamento base: R\$/);
 assert.match(src,/Total previsto: R\$/);
 assert.match(src,/coach-finance-preview/);
});
test("M04.5 no-club careers retain original configuration",()=>{
 assert.match(src,/financialScenario:String\(f\.get\("clubId"\)\|\|""\)\?String\(f\.get\("financialScenario"\)\|\|"legacy"\):"legacy"/);
});
