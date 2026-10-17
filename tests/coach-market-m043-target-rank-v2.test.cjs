"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M04.3 ranks saved targets by priority without mutating shortlist",()=>{
 assert.match(src,/const rankedTargets=shortlist\.slice\(\)\.sort/);
 assert.match(src,/const targetRows=rankedTargets\.map/);
 assert.match(src,/alta:0,media:1,baixa:2/);
});
test("M04.3 offers existing shortlist action for untracked recommended players",()=>{
 assert.match(src,/const savedRecommendations=new Set/);
 assert.match(src,/Já está na lista/);
 assert.match(src,/Adicionar à lista/);
 assert.match(src,/data-coach-shortlist/);
});
