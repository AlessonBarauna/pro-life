const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const view=fs.readFileSync(require("node:path").join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("T1 prematch displays prioritized squad alerts",()=>{
 assert.match(view,/ALERTAS DO AUXILIAR - T1/);
 assert.match(view,/Indisponivel por lesao/);
 assert.match(view,/Condicao fisica baixa/);
 assert.match(view,/Rendimento abaixo do habitual/);
});
test("T1 UI makes clear alerts do not change confirmed lineup",()=>{
 assert.match(view,/nao da escalacao confirmada/);
 assert.match(view,/As decisoes continuam com o treinador/);
});
