"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-mobile-sm27.css"),"utf8");
test("finanças do clube exibem caixa total, orçamento, reserva e loja",()=>{
  assert.match(app,/Caixa total do clube/);
  assert.match(app,/Orçamento de transferências/);
  assert.match(app,/LOJA DO CLUBE · NÍVEL/);
  assert.match(app,/data-fin-store-upgrade/);
});
test("cabeçalho mobile identifica que o valor é de transferências",()=>{
  assert.match(css,/\.phone-money::before \{ content:"TRANSF\."/);
});
