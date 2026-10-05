const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const C=fs.readFileSync(path.join(__dirname,"../src/ui/creator.js"),"utf8");
test("criador guiado mostra data de nascimento",()=>{assert.match(C,/Data de nascimento/);assert.match(C,/name="birthDate"/);});
test("idade e calculada da data",()=>{assert.match(C,/function ageFromBirthDate/);assert.match(C,/c\.age=age/);});
test("historia sincroniza nascimento",()=>assert.match(C,/W\.cfg\.birthDate = birthDateForAge\(st\.age\)/));
test("config envia birthDate ao dominio",()=>assert.match(C,/birthDate/));
