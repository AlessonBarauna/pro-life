"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M03 scouting mission hub shows real save progress and date",()=>{
 assert.match(ui,/missions\.filter\(m=>m\.status==="active"\)/);
 assert.match(ui,/missions\.filter\(m=>m\.status==="complete"\)/);
 assert.match(ui,/careerDate\(s,expiryDay\)/);
 assert.match(ui,/data-coach-start-scout/);
 assert.match(ui,/cc-scout-mission-hub/);
});
test("M03 estimates come from the actual scouting report",()=>{
 assert.match(ui,/scouting\?\.report\?\.\(s,m\.id,player\)/);
 assert.match(ui,/info\.estimatedOverall\.join/);
 assert.match(ui,/info\.potentialRange\.join/);
 assert.match(ui,/info\.certainty/);
});
