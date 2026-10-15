"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8"),css=fs.readFileSync("src/ui/fc27-j07-matchday.css","utf8"),html=fs.readFileSync("index.html","utf8");
test("J07 pre-match shown in player only and uses next commitment snapshot",()=>{assert.match(app,/const j07PreMatch = \(function j07View/);assert.match(app,/if\(state\.mode!=="player"\)return ""/);assert.match(app,/ProLifeHomeDashboard\?\.snapshot/);assert.match(app,/\$\{j07PreMatch\}\$\{postMatch\}/);});
test("J07 preserves existing simulation and lineup routing",()=>{assert.match(app,/data-simulate="nextCommitment"/);assert.match(app,/data-page="lineup"/);assert.match(app,/Career\.matchObjectives\?\.\(state\)/);assert.match(app,/pc\?\.coachTrust/);});
test("J07 visual stylesheet is loaded and responsive",()=>{assert.ok(html.includes("fc27-j07-matchday.css"));assert.match(css,/\.pl-j07-matchup\{display:grid/);assert.match(css,/@media\(max-width:720px\)/);});
