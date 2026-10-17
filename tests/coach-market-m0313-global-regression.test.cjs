"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("M03.13 financial and transfer modules parse",()=>{
 for(const p of ["src/application/game.js","src/domain/coach-career.js","src/ui/coach-career-view.js"])
  new vm.Script(read(p),{filename:p});
});
test("M03.13 accepted player contract is stored on arrival",()=>{
 const game=read("src/application/game.js");
 for(const field of ["p.salary=agreedContract.salary","p.contractEndDay=","p.squadRole=agreedContract.role","p.lastSigningBonus=contractBonus"])
  assert.ok(game.includes(field),field);
});
test("M03.13 settled window transfers honor original deal amount",()=>{
 const game=read("src/application/game.js");
 assert.match(game,/if\(negotiation\)fee=negotiation\.finalFee/);
 assert.match(game,/n\.status="awaiting_window"/);
 assert.match(game,/n\.status="accepted"|negotiation\.status="accepted"/);
});
test("M03.13 financial forecast cannot debit budget",()=>{
 const career=read("src/domain/coach-career.js");
 const start=career.indexOf("  function recordPayrollForecast(");
 const end=career.indexOf("  // ---------- agenda diaria ----------",start);
 assert.ok(start>=0&&end>start);
 const body=career.slice(start,end);
 assert.doesNotMatch(body,/\.budget\s*[-+*/]?=/);
 assert.match(body,/status:"forecast_only"/);
});
test("M03.13 UI separates contract and transfer budgets",()=>{
 const ui=read("src/ui/coach-career-view.js");
 assert.match(ui,/Orçamento de transferências:/);
 assert.match(ui,/payrollReadiness/);
 assert.match(ui,/Contrato acordado com o jogador/);
});
