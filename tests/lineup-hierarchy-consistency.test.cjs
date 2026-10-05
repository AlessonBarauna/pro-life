const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
test("hierarquia Titular/Importante/Estrela garante XI quando disponivel",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
 assert.match(src,/\["Titular","Importante","Estrela"\]\.includes\(hierarchy\)/);
 assert.match(src,/selection\.starters\[idx\] = s\.person/);
});
test("Reserva/Rotacao garante relacao no banco quando disponivel",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
 assert.match(src,/\["Reserva","Rotação"\]\.includes\(hierarchy\)/);
 assert.match(src,/selection\.bench\[selection\.bench\.length-1\]=s\.person/);
});