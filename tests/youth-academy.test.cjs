"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
const G=require("../src/application/game.js");
function coach(){const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_449",90000);E.advance(s,2);return s;}
const run=(s,a,d)=>(G.execute||G.Game?.execute||((...x)=>E.execute?.(...x)))(s,a,d);
test("base do treinador: lista, lotação e promover/dispensar",()=>{
  const s=coach(),Y=E.YouthAcademy,v=Y.view(s,E);
  assert.ok(v&&v.kids.length>=6,"base seeded");
  assert.equal(v.capacity,6+2*v.level);
  const k=v.kids.find(x=>x.canPromote);assert.ok(k,"alguém pode subir");
  const before=E.club(s).roster.length;
  Y.promote(s,E,k.id,{});
  assert.equal(E.club(s).roster.length,before+1);
  assert.ok(!Y.view(s,E).kids.some(x=>x.id===k.id));
  const r=Y.view(s,E).kids[0];Y.release(s,E,r.id,{});
  assert.ok(!Y.view(s,E).kids.some(x=>x.id===r.id));
  assert.throws(()=>Y.promote(s,E,"nao-existe",{}),/base/);
});
test("empréstimo libera vaga e chamada de volta respeita lotação",()=>{
  const s=coach(),Y=E.YouthAcademy;
  const k=Y.view(s,E).kids.find(x=>x.age>=17);assert.ok(k);
  Y.loan(s,E,k.id,{});assert.ok(Y.view(s,E).kids.find(x=>x.id===k.id).loaned);
  assert.throws(()=>Y.promote(s,E,k.id,{}),/emprestado/);
  Y.recall(s,E,k.id,{});assert.ok(!Y.view(s,E).kids.find(x=>x.id===k.id).loaned);
});
test("admissão periódica gera jovens até a lotação",{timeout:0},()=>{
  const s=coach(),Y=E.YouthAcademy;
  const before=Y.view(s,E);
  for(const k of before.kids.slice(0,3))Y.release(s,E,k.id,{});
  while(s.day<80)E.advance(s,Math.min(30,80-s.day));
  const after=Y.view(s,E);
  assert.ok(after.kids.length>before.kids.length-3,"admissão repôs");
  assert.ok(after.used<=after.capacity);
});
test("olheiro da base: missão, relatório e contratação",{timeout:0},()=>{
  const s=coach(),Y=E.YouthAcademy;
  const v=Y.view(s,E);assert.ok(v.countries.length>3);
  const country=v.countries[0].name;
  assert.throws(()=>Y.startMission(s,E,{country:"Nowhere"}),/país/);
  const m=Y.startMission(s,E,{country,positions:[],ageMin:15,ageMax:19,minStars:1});
  assert.throws(()=>Y.startMission(s,E,{country,minStars:1}),/ocupados/);
  E.advance(s,m.duration+1);
  const v2=Y.view(s,E);
  assert.equal(v2.missions[0].status,"complete");
  if(v2.reports.length){
    const rep=v2.reports[0];assert.ok(rep.potLo<=rep.potHi);
    for(const k of v2.kids.slice(0,2))Y.release(s,E,k.id,{});
    const r0=Y.signProspect(s,E,rep.playerId,{});assert.ok(r0.fee>0);
    assert.ok(Y.view(s,E).kids.some(x=>x.id===rep.playerId));
  }
});
test("virada de temporada mantém a base e resolve quem passou dos 20",{timeout:0},()=>{
  const s=coach();
  while(s.day<364){s.board=100;E.advance(s,Math.min(30,364-s.day));}
  E.advance(s,2);
  assert.equal(s.youthError,undefined);
  const v=E.YouthAcademy.view(s,E);assert.ok(v.kids.length>=1);
  assert.ok(v.kids.every(k=>k.age<=20));
});
