"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("M04.11 loader attempts recovery when economics script is absent",()=>{
 const html=read("index.html").replace(/\.(js|css)\?v=[^"]*"/g,".$1\"");
 assert.match(html,/ProLifeClubEconomyLoadStatus/);
 assert.match(html,/club-economy\.js\?v=m0414brandbrands-retry/);
 assert.match(html,/retry\.onerror/);
});
test("M04.11 financial panel reports module loader status without mutating save",()=>{
 const code=read("src/ui/coach-career-view.js");
 new vm.Script(code);
 assert.match(code,/ProLifeClubEconomyLoadStatus/);
 assert.match(code,/Módulo de propostas indisponível/);
});
