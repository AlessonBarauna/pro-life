"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const R=require("../src/domain/player-rivalries.js");
const setup=()=>R.initial({rivalId:"rival",position:"ATA",objectiveId:"hatTrick",maxMatches:3});
const match=(id,hero,rival)=>({id,played:true,hero:{goals:hero},rival:{goals:rival}});
test("FC27: primeiro hat-trick do protagonista encerra a rivalidade",()=>{
 const before=setup(),next=R.record(before,match("j1",3,1));
 assert.equal(next.result,"win");assert.equal(next.progress,1);
 assert.equal(before.result,"active");
 assert.equal(R.record(next,match("j2",0,3)),next);
});
test("FC27: rival consegue a conquista primeiro",()=>{
 assert.equal(R.record(setup(),match("j1",0,3)).result,"loss");
});
test("FC27: dois hat-tricks na mesma partida empatam",()=>{
 assert.equal(R.record(setup(),match("j1",3,3)).result,"draw");
});
test("FC27: sem conquista até o limite registra não concluída",()=>{
 let s=setup();
 s=R.record(s,match("j1",1,2));
 s=R.record(s,match("j2",2,0));
 assert.equal(s.result,"active");
 s=R.record(s,match("j3",1,0));
 assert.equal(s.result,"unfinished");
 assert.equal(R.record(s,match("j4",3,0)),s);
});
test("FC27: partidas pendentes ou repetidas não avançam progresso",()=>{
 const s=setup(),pending=R.record(s,{...match("j1",3,0),played:false});
 assert.equal(pending,s);
 const once=R.record(s,match("j1",1,0));
 assert.equal(R.record(once,match("j1",3,0)),once);
});
