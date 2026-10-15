"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),J=require("../src/ui/player-j10-development.js");
test("momento mantém GER entre 1 e 100 e efeito entre -5 e +4",()=>{
 for(const b of [1,25,70,96,100])for(const c of [0,30,55,75,100])for(const m of [0,35,60,90])for(const f of [null,3,6,7.5,9]){
  const v=J.moment(b,c,m,f,0);assert.ok(v.value>=1&&v.value<=100);
  assert.ok(v.adjustment>=-5&&v.adjustment<=4);
 }
});
test("lesão não acrescenta desempenho e cálculo não muda entrada",()=>{
 const args=[75,90,70,7.2,10],before=JSON.stringify(args);
 const out=J.moment(...args);assert.ok(out.value<=75);
 assert.equal(JSON.stringify(args),before);
});
test("GER base e GER de momento são distintos; nenhum bônus de XP",()=>{
 const src=fs.readFileSync("src/ui/player-j10-development.js","utf8");
 assert.match(src,/GER BASE/);assert.match(src,/GER DE MOMENTO/);
 assert.match(src,/Não altera os atributos, o GER usado no motor/);
 assert.doesNotMatch(src,/A\.execute|D\.advance|persist\(|addDevelopmentXp\(/);
});
test("treino canônico já possui bloqueio diário, lesão e teto",()=>{
 const src=fs.readFileSync("src/domain/training.js","utf8");
 assert.match(src,/function trainedToday/);assert.match(src,/function trainingAvailable/);
 assert.match(src,/s\.person\.injury/);assert.match(src,/helpers\.overall\(s\.person\) < ceiling\(s,helpers\)/);
});
