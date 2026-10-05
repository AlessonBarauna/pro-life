const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("pendingActions inclui decisoes de vida e entrevistas",()=>{
  assert.match(engine,/type:"decision"/);
  assert.match(engine,/communications\?\.interviews/);
  assert.match(engine,/type:"interview"/);
});
test("pendingActions inclui renovacao, transferencia e patrocinio",()=>{
  for(const t of ["renewal","offer","commercial","commercial-event"]) assert.match(engine,new RegExp(`type:"${t}"`));
});
test("render valida pendencias mesmo fora da simulacao",()=>{
  assert.match(ui,/ensurePendingDecisionPopup\(\);/);
  assert.match(ui,/D\.pendingActions\?\.\(state\)/);
});
test("popup preserva destino exato da decisao",()=>{
  assert.match(ui,/page:action\.page, anchor:action\.anchor/);
  assert.match(ui,/showSimulationStop\(popupFromPending\(next\)\)/);
});