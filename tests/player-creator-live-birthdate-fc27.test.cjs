const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const src=fs.readFileSync("src/ui/creator.js","utf8");

test("criador valida nascimento durante a digitacao e na mudanca",()=>{
 assert.match(src,/app\.addEventListener\("input", app\._wizardInput\)/);
 assert.match(src,/app\.addEventListener\("change", app\._wizardChange\)/);
 assert.match(src,/e\.target\?\.name === "birthDate"/);
});
test("idade e feedback visual refletem datas incompletas",()=>{
 assert.match(src,/ageInput\.value=age===null\?"":String\(age\)/);
 assert.match(src,/aria-live="polite"/);
 assert.match(src,/aria-describedby="w-birth-error"/);
 assert.match(src,/validity\?\.badInput/);
 assert.match(src,/aria-invalid/);
});
test("eventos anteriores sao desregistrados ao montar novamente",()=>{
 assert.match(src,/removeEventListener\("input", app\._wizardInput\)/);
});
