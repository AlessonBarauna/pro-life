"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
const CN=E.CoachNational;

function setup(){
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);
  s.clubId=null;E.join(s,"gf_fc27_5",90000);s.reputation=58;
  const code=CN.overview(s,E).nations.find(n=>n.eligible).code;
  s.coachNational.offers.push({code,name:code,received:s.day,expires:s.day+45});
  CN.acceptOffer(s,E,code);
  return s;
}
test("convocação: primeira lista automática, editável e confirmável", {timeout:0},()=>{
  const s=setup(),cn=s.coachNational;
  let ov=CN.overview(s,E);
  assert.equal(ov.callup.status,"open");assert.equal(ov.callup.firstList,true);
  CN.confirmCallup(s,E);
  assert.equal(CN.overview(s,E).callup.status,"confirmed");
  assert.ok(cn.called.length>=18);
});
test("convocação: abre 12 dias antes, bloqueia antes e fecha no prazo", {timeout:0},()=>{
  const s=setup(),cn=s.coachNational;
  const first=cn.callup.first;
  // fecha a janela inicial no prazo
  s.day=cn.callup.deadline;CN.syncCallup(s,E,false);
  assert.equal(cn.callup.status,"closed");
  const ov0=CN.overview(s,E);
  const out=ov0.players.find(p=>p.called&&p.available),inn=ov0.players.find(p=>!p.called&&p.available);
  assert.throws(()=>CN.toggleCall(s,E,out.id),/fechada/);
  // próxima janela: aguardando
  s.day=Math.max(...cn.schedule.filter(m=>m.day-first<=7).map(m=>m.day))+1;
  CN.syncCallup(s,E,false);
  assert.equal(cn.callup.status,"waiting");
  assert.throws(()=>CN.confirmCallup(s,E),/abre no dia/);
  assert.throws(()=>CN.toggleCall(s,E,out.id),/abre no dia/);
  // abre
  s.day=cn.callup.opens;CN.syncCallup(s,E,false);
  assert.equal(cn.callup.status,"open");
  assert.ok(cn.called.length>=18&&cn.called.length<=26);
  CN.confirmCallup(s,E);assert.equal(cn.callup.status,"confirmed");
  // sem confirmar: prazo estoura -> auto e diretoria cobra
  const s2=setup(),c2=s2.coachNational;
  s2.day=c2.callup.deadline;const b=c2.board;CN.syncCallup(s2,E,false);
  assert.equal(c2.callup.status,"closed");
});
test("convocação: prazo sem confirmar após janela normal reduz confiança", {timeout:0},()=>{
  const s=setup(),cn=s.coachNational;
  s.day=cn.callup.deadline;CN.syncCallup(s,E,false);
  s.day=cn.callup.last+1;CN.syncCallup(s,E,false);
  s.day=cn.callup.opens;CN.syncCallup(s,E,false);
  assert.equal(cn.callup.status,"open");
  const b=cn.board;
  s.day=cn.callup.deadline;CN.syncCallup(s,E,false);
  assert.equal(cn.callup.status,"closed");
  assert.equal(cn.board,b-2);
});
test("seleção: escalação manual, táticas e capitão", {timeout:0},()=>{
  const s=setup();
  let ov=CN.overview(s,E);
  const out=ov.players.find(p=>p.starter&&p.pos!=="GOL"),inn=ov.players.find(p=>p.called&&!p.starter&&p.available&&p.pos!=="GOL");
  CN.setStarter(s,E,out.id,inn.id);
  ov=CN.overview(s,E);
  assert.ok(ov.lineup.starters.includes(inn.id)&&!ov.lineup.starters.includes(out.id));
  assert.equal(ov.lineup.manual,true);
  assert.throws(()=>CN.setStarter(s,E,inn.id,inn.id),/já é titular/);
  CN.autoXI(s,E);assert.equal(CN.overview(s,E).lineup.manual,false);
  CN.setTactic(s,E,"style","attack");assert.equal(CN.overview(s,E).tactics.style,"attack");
  assert.throws(()=>CN.setTactic(s,E,"style","xx"),/inválida/);
  CN.setCaptain(s,E,"captain",inn.id);assert.equal(CN.overview(s,E).captain,inn.id);
});
test("treinador assume clube com projeto mesmo com a janela fechada", {timeout:0},()=>{
  const A=require("../src/application/game.js");
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;
  E.join(s,E.GlobalFootball.clubByName(s,"Real Betis").id,90000);
  let g=0;while(E.Career.windowStatus(s).open&&g++<400)E.advance(s,1);
  assert.equal(E.Career.windowStatus(s).open,false);
  const tgt=E.GlobalFootball.clubByName(s,"Santos");
  s.offers.push({clubId:tgt.id,salary:100000,expires:s.day+30,durationDays:730});
  A.execute(s,"join",{id:tgt.id});
  assert.equal(s.clubId,tgt.id);
});
test("escalação por posição específica: 11 posições da formação, goleiro no gol e troca no mesmo lugar",{timeout:0},()=>{
  const s=setup(),cn=s.coachNational;
  for(const f of CN.FORMATIONS?Object.keys(CN.FORMATIONS):["4-3-3","4-4-2","3-5-2","4-2-3-1","5-3-2"]){
    CN.setFormation(s,E,f);
    const ov=CN.overview(s,E),sl=ov.lineup.slots;
    assert.equal(sl.length,11);assert.equal(sl[0].code,"GOL");
    assert.equal(new Set(sl.map(x=>x.id)).size,11);
    assert.ok(sl.every(x=>x.x>=0&&x.x<=100&&x.y>=0&&x.y<=100&&x.fit>0&&x.fit<=1));
    assert.equal(cn.starters.length,0,"trocar a formação volta ao XI automático");
  }
  CN.setFormation(s,E,"4-3-3");
  const ov=CN.overview(s,E),m=new Map(ov.players.map(p=>[p.id,p]));
  const out=ov.lineup.slots[3],inP=ov.lineup.bench.map(id=>m.get(id)).find(p=>p.pos!=="GOL"&&p.available);
  CN.setStarter(s,E,out.id,inP.id);
  const after=CN.overview(s,E).lineup.slots;
  assert.equal(after[3].id,inP.id);assert.equal(after[3].code,out.code);
});
