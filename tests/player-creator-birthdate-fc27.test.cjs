const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const source=fs.readFileSync("src/ui/creator.js","utf8");
const beginning=source.indexOf("  function birthDateForAge(age) {");
const end=source.indexOf("  function init(ctx, keepSeed) {");
assert.ok(beginning>=0&&end>beginning,"birthdate helpers found");
const helpers=source.slice(beginning,end);
const dates=vm.runInNewContext(`(()=>{${helpers};return {birthDateForAge,ageFromBirthDate};})()`);

test("idade considera início da carreira em 1 janeiro de 2026",()=>{
  assert.equal(dates.ageFromBirthDate("2012-01-01"),14);
  assert.equal(dates.ageFromBirthDate("2011-01-02"),14);
  assert.equal(dates.ageFromBirthDate("2011-01-01"),15);
  assert.equal(dates.birthDateForAge(14),"2012-01-01");
  assert.equal(dates.birthDateForAge(32),"1994-01-01");
});
test("data impossível ou malformada nunca gera idade",()=>{
  for(const date of ["2020-02-30","2023-02-29","2026-13-01","2026-00-01","2026-01-00","abc","2026-1-1",""]){
    assert.equal(dates.ageFromBirthDate(date),null,date);
  }
  assert.equal(dates.ageFromBirthDate("2024-02-29"),1);
});
test("edição inválida não preserva nascimento anterior",()=>{
  assert.match(source,/else if \(n === "birthDate"\) \{\s*c\.birthDate=t\.value;/);
  assert.match(source,/if\(ageInput\) ageInput\.value=age===null\?"":String\(age\)/);
  assert.match(source,/if\(age===null\) return "Informe uma data de nascimento válida\."/);
});
test("datas do campo correspondem à idade no primeiro dia da carreira",()=>{
  assert.match(source,/minBirthDate=`\$\{2026-maxA-1\}-01-02`, maxBirthDate=`\$\{2026-minA\}-01-01`/);
});
