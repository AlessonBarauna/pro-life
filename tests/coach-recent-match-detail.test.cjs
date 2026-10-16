"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync("src/ui/app.js","utf8");
test("coach recent-match detail uses team summary, player uses participation",()=>{
 new vm.Script(source);
 assert.match(source,/const matchSummary=state\.mode==="coach"\?/);
 assert.match(source,/\$\{matchSummary\}\$\{tieBox\}/);
 assert.match(source,/:"\s*"?hero;/);
});
