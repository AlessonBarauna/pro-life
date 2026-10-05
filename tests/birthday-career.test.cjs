const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const E=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
const A=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("novo jogador possui data de nascimento",()=>assert.match(E,/birthDate:/));
test("save antigo recebe migracao de aniversario",()=>assert.match(E,/Compatibilidade com saves antigos/));
test("aniversario gera decisao e atualiza idade",()=>{assert.match(E,/function birthdayTick/);assert.match(E,/Seu aniversário de/);assert.match(E,/s\.person\.age=age/)});
test("ha cinco formas de comemorar",()=>["birthday_family","birthday_team","birthday_fans","birthday_charity","birthday_private"].forEach(x=>assert.match(E,new RegExp(x))));
test("escolha repercute na rede social e historico",()=>{assert.match(E,/career\.feed\.unshift/);assert.match(E,/s\.birthday\.history\.push/)});
test("vida pessoal mostra nascimento e idade",()=>assert.match(A,/Data de nascimento:/));
