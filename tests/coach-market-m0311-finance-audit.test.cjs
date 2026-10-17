"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("M03.11 JavaScript syntax",()=>{new vm.Script(src);});
test("M03.11 audit distinguishes transfer liabilities from recurring income",()=>{
 assert.match(src,/const transferDue=validDebts\.reduce/);
 assert.match(src,/knownRecurringRevenue\.length/);
 assert.match(src,/Transferências, receitas recorrentes e salários são categorias separadas/);
});
test("M03.11 audit does not mutate budgets or manufacture transactions",()=>{
 const start=src.indexOf("    // M03.11:");
 const end=src.indexOf("    const debtRows=",start);
 assert.ok(start>=0&&end>start);
 const segment=src.slice(start,end);
 assert.doesNotMatch(segment,/\.budget\s*[-+*/]?=/);
 assert.match(segment,/Nenhum lançamento ou pagamento foi criado/);
});
