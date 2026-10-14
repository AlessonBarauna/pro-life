"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const s=fs.readFileSync("src/ui/app.js","utf8");
const css=fs.readFileSync("src/ui/fc27-j06-squad.css","utf8");
test("J06: four top tabs are real buttons with click handler",()=>{
 for(const x of ['"lineup","Escalação"','"tactics","Táticas"','"roles","Funções"','"hierarchy","Hierarquia"'])assert.ok(s.includes(x),x);
 assert.match(s,/if \(b\.dataset\.squadTab\) \{\s*squadTab = b\.dataset\.squadTab;\s*render\(\)/);
});
test("J06: non-lineup tabs show content before workspace, not below it",()=>{
 const a=s.indexOf('<nav class="pl-squad-tabs"'),b=s.indexOf('<footer class="pl-squad-actions">',a);
 const view=s.slice(a,b);
 assert.ok(view.indexOf('pl-j06-tab-view')<view.indexOf('pl-squad-workspace'));
 assert.match(view,/squadTab==="lineup"\?"":"hidden"/);
 assert.ok(!view.includes('</aside></div>${tabSupplement}'));
 assert.match(css,/\.pl-squad-workspace\[hidden\]\{display:none!important\}/);
});
