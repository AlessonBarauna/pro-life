"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
const view=require("../src/ui/coach-career-view.js");
test("modern market adds contracts without deleting existing market tabs",()=>{
  for(const tab of ["lista","recebidas","propostas","emprestimos","financeiro","contratos","clausulas","historico"]){
    view.setDealTab(tab);assert.equal(view.state.dealTab,tab);
  }
  assert.match(source,/const contractRows=wrap/);
});
test("purchase negotiation displays stage and readonly budget forecast",()=>{
  assert.match(source,/const steps=selected\?/);
  assert.match(source,/const budgetPreview=selected/);
  assert.match(source,/não altera o orçamento/);
  assert.match(source,/marketCss\(\)/);
});
test("purchase activity opens exact deal and preserves incoming offers",()=>{
  assert.match(source,/data-coach-deal-open="'\+esc\(t\.id\)/);
  assert.match(source,/data-coach-deal-tab="recebidas"/);
});
