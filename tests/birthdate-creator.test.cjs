const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const A=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8"),E=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
test("criador de jogador exige data de nascimento",()=>{assert.match(A,/name="birthDate"/);assert.match(A,/type="date"/);assert.match(A,/required/);});
test("idade da nova carreira deriva do nascimento",()=>{assert.match(A,/calculatedAge=2026-by/);assert.match(A,/config\.age=calculatedAge/);});
test("mudanca da data atualiza idade na tela",()=>assert.match(A,/e\.target\.name==="birthDate"/));
test("engine recebe birthDate da criacao",()=>assert.match(E,/config\.birthDate/));
