const test=require("node:test");
const assert=require("node:assert/strict");
const R=require("../src/domain/player-rivalries.js");
test("objetivos respeitam posição",()=>{
 assert.equal(R.objectiveFor("ATA").id,"goals");
 assert.equal(R.objectiveFor("MEI").id,"assists");
 assert.equal(R.objectiveFor("GOL").id,"cleanSheets");
});
test("não permite rivalizar consigo",()=>assert.throws(()=>R.initial({rivalId:"hero"})));
test("partidas efetivamente jogadas avançam rivalidade apenas uma vez",()=>{
 const start=R.initial({rivalId:"opponent",position:"ATA",maxMatches:2});
 assert.equal(R.record(start,{id:"a",played:false}).progress,0);
 const one=R.record(start,{id:"a",played:true,hero:{goals:2},rival:{goals:1}});
 assert.equal(one.progress,1);
 assert.equal(R.record(one,{id:"a",played:true}).progress,1);
 const end=R.record(one,{id:"b",played:true,hero:{goals:1},rival:{goals:0}});
 assert.equal(end.result,"win");
 assert.equal(end.hero,3);
 assert.equal(R.reward(end),100);
 assert.equal(start.progress,0);
});
test("empate e derrota são distinguíveis, resultado final é imutável",()=>{
 const base=R.initial({rivalId:"opponent",position:"MEI",maxMatches:1});
 const draw=R.record(base,{id:"1",played:true,hero:{assists:1},rival:{assists:1}});
 assert.equal(draw.result,"draw"); assert.equal(R.reward(draw),50);
 assert.equal(R.record(draw,{id:"2",played:true}),draw);
 const loss=R.record(base,{id:"3",played:true,hero:{assists:0},rival:{assists:2}});
 assert.equal(loss.result,"loss");assert.equal(R.reward(loss),0);
});
