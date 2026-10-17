"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("Coach swaps permit bench and related players without changing XI",()=>{
 new vm.Script(src);
 assert.match(src,/if\(fi<0&&ti<0\)\{/);
 assert.match(src,/\[ordered\[a\],ordered\[b\]\]=\[ordered\[b\],ordered\[a\]\]/);
 assert.match(src,/state\.coachCareer\.benchOrder=ordered/);
 assert.match(src,/bench\.slice\(0,7\)/);
 assert.match(src,/bench\.slice\(7\)/);
});
test("Starter exchanges still use lineup and undo restores bench order",()=>{
 assert.match(src,/A\.execute\(state,"lineup",\{ids:chosen\}\)/);
 assert.match(src,/undo\.benchOrder/);
 assert.match(src,/delete state\.coachCareer\.benchOrder/);
 assert.match(src,/squadSwapSource=tile\.dataset\.squadPlayer/);
 assert.match(src,/swapSquadPlayers\(source,target\.dataset\.squadPlayer\)/);
});
