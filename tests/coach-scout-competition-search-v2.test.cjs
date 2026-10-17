"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const V=require("../src/ui/coach-career-view.js");
test("club and competition accept typed text independently",()=>{
 V.setScoutFilters("","all",{club:"Sao Paulo",competition:"Serie A"});
 assert.equal(V.state.scoutClub,"Sao Paulo");
 assert.equal(V.state.scoutCompetition,"Serie A");
 V.setScoutFilters("","all",{});
});
test("search suggestions come from real clubs and league records",()=>{
 assert.match(view,/data-coach-scout-club list="cc-scout-club-options"/);
 assert.match(view,/data-coach-scout-competition list="cc-scout-competition-options"/);
 assert.match(view,/leagueIndex\.get\(id\)\?\.name/);
 assert.match(view,/normalizeText\(currentClub\?\.name\)\.includes\(clubNeedle\)/);
 assert.match(view,/normalizeText\(competitionName\(currentClub\)\)\.includes\(competitionNeedle\)/);
 assert.match(app,/competition:document\.querySelector\("\[data-coach-scout-competition\]"\)/);
});
