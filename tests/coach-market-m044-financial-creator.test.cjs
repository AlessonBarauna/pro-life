"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("M04.4 creator, engine and economy parse",()=>{for(const p of ["src/ui/app.js","src/domain/engine.js","src/domain/club-economy.js"])new vm.Script(read(p),{filename:p});});
test("M04.4 scenario is opt-in, coach-only and requires chosen club",()=>{
 const engine=read("src/domain/engine.js");
 assert.match(engine,/mode==="coach"&&config\.financialScenario!=null&&config\.financialScenario!=="legacy"/);
 assert.match(engine,/if\(!target\)throw Error/);
 assert.match(engine,/s\.coachInitialFinance=/);
});
test("M04.4 UI includes original budget fallback and loads economy module",()=>{
 const ui=read("src/ui/app.js"),html=read("index.html");
 for(const id of ["legacy","conservative","standard","ambitious"])assert.ok(ui.includes('<option value="'+id+'"'));
 assert.ok(html.indexOf('src/domain/club-economy.js')>=0);
 assert.ok(html.indexOf('src/domain/club-economy.js')<html.indexOf('src/domain/engine.js'));
});
