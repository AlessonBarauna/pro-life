"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("Flexible mode UI and modules parse",()=>{for(const p of ["src/ui/coach-creator.js","src/domain/coach-career.js","src/application/game.js"])new vm.Script(read(p),{filename:p});});
test("Flexible option exposed in manager creation and persists market strictness",()=>{
 const ui=read("src/ui/coach-creator.js");
 assert.match(ui,/<option value="flexible">Flexível/);
 assert.match(ui,/marketStrictness:String\(f\.get\("marketStrictness"\)/);
});
test("Flexible mode increases inquiry interest without overriding elite refusal",()=>{
 const domain=read("src/domain/coach-career.js");
 assert.match(domain,/marketStrictness==="flexible"&&!eliteGap/);
 assert.match(domain,/playerScore\+=22/);
 assert.match(domain,/clubScore\+=20/);
});
test("Flexible fee and eligibility ease but preserve budget validation",()=>{
 const game=read("src/application/game.js");
 assert.match(game,/marketStrictness==="flexible"\?0\.85:1/);
 assert.match(game,/marketStrictness==="flexible"\?0\.78:0\.9/);
 assert.match(game,/marketStrictness==="flexible"\?25:14/);
 assert.match(game,/Orçamento insuficiente para a entrada e bônus contratual/);
 assert.match(game,/Janela de transferências fechada/);
});
