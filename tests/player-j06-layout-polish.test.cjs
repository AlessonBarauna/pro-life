"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const css=fs.readFileSync("src/ui/fc27-j06-squad.css","utf8");
const js=fs.readFileSync("src/ui/app.js","utf8");
test("J06 layout only applies to the player squad",()=>{assert.match(css,/\.pl-j06-squad \.pl-squad-detail\{align-self:start;height:auto;min-height:0/);assert.match(js,/state\.mode==="player"\?"pl-j06-squad":""/);});
test("Radar and attributes remain visible in legacy tablet breakpoint",()=>{assert.match(css,/@media\(max-width:1180px\) and \(min-width:1001px\)/);assert.match(css,/\.pl-j06-squad \.pl-squad-radar\{display:flex\}/);assert.match(css,/\.pl-j06-squad \.pl-squad-attrs>span/);});
test("Footer, mobile layout, and tab behavior are retained",()=>{assert.match(css,/\.pl-j06-squad \.pl-squad-detail>footer/);assert.match(css,/@media\(max-width:600px\)/);assert.match(css,/\.pl-j06-squad \.pl-j06-panel\[hidden\]\{display:none!important\}/);assert.match(js,/data-j06-detail-tab/);});
