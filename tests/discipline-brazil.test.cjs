const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("cartoes sao controlados por competicao e serie de tres",()=>{
 assert.match(engine,/competitions:\{\}/); assert.match(engine,/while\(d\.yellows>=3\)/);
});
test("segundo amarelo gera vermelho e nao acumula os dois amarelos",()=>{
 assert.match(engine,/reason:"second-yellow"/); assert.match(engine,/if\(g\.secondYellowRed\)/);
});
test("vermelho e suspensoes afetam a selecao",()=>{
 assert.match(engine,/!p\._competitionSuspended/); assert.match(engine,/d\.suspensions\+=1/);
});
test("interface explica C VC e mostra disciplina",()=>{
 assert.match(ui,/Capitão: líder da equipe/); assert.match(ui,/Vice-capitão: assume a braçadeira/); assert.match(ui,/Amarelos na série/);
});