"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");

const BASE=D.create({mode:"player",clubId:"c0"},29110);

function state(){
  const s=structuredClone(BASE);
  D.GlobalFootball.init(s);
  D.Career.init(s);
  s.careerTransferAvailableDay=0;
  return s;
}

function globalClub(s){
  const club=s.globalFootball.clubs.find(item=>
    item&&item.active!==false&&String(item.id).startsWith("gf_")
  );
  assert.ok(club,"o catálogo real deve conter ao menos um clube global ativo");
  assert.equal(D.club(s,club.id)?.id,club.id);
  return club;
}

function offer(clubId){
  return {
    clubId,
    salary:32000,
    durationDays:730,
    signingBonus:25000,
    role:"Disputa por posição",
    squadRole:"Rotação",
    transferType:"permanent",
    expires:20,
    responseDeadline:20,
    round:0,
  };
}

function reload(s){
  return Save.parse(JSON.stringify(s));
}

test("29B.1: save preserva proposta de clube brasileiro existente",()=>{
  const s=state();
  const club=s.clubs.find(item=>item.id!==s.clubId);
  s.offers=[offer(club.id)];

  const restored=reload(s);

  assert.equal(restored.offers.length,1);
  assert.deepEqual(restored.offers[0],s.offers[0]);
  assert.equal(D.club(restored,restored.offers[0].clubId)?.id,club.id);
});

test("29B.1: save preserva proposta de clube global existente",()=>{
    const s=state();
    const club=globalClub(s);
    s.offers=[offer(club.id)];

    const restored=reload(s);

    assert.equal(restored.offers.length,1);
    assert.deepEqual(restored.offers[0],s.offers[0]);
    assert.equal(D.club(restored,restored.offers[0].clubId)?.id,club.id);
});

test("29B.1: save rejeita proposta de clube global inexistente",()=>{
  const s=state();
  s.offers=[offer("gf_inexistente")];

  assert.throws(()=>reload(s),/save inválido ou incompatível/i);
});

test("29B.1: save rejeita ID global duplicado",()=>{
    const s=state();
    const club=globalClub(s);
    s.globalFootball.clubs.push(structuredClone(club));

    assert.throws(()=>reload(s),/save inválido ou incompatível/i);
});

test("29B.1: save rejeita ID global inválido",()=>{
    const s=state();
    globalClub(s).id="";

    assert.throws(()=>reload(s),/save inválido ou incompatível/i);
});

test("29B.1: save preserva contrato internacional com valores válidos",()=>{
  const s=state();
  const club=globalClub(s);
  const contract={
    clubId:club.id,
    signedDay:s.day,
    endDay:s.day+730,
    durationDays:730,
    salary:42000,
    signingBonus:80000,
    role:"Rotação",
    type:"permanent",
  };
  D.Career.init(s).playerCareer.contract=contract;

  const restored=reload(s);

  assert.deepEqual(D.Career.init(restored).playerCareer.contract,contract);
  assert.equal(D.club(restored,contract.clubId)?.id,club.id);
});

test("29B.1: save preserva clube global atual e proposta global após reload",()=>{
    const s=state();
    const current=globalClub(s);
    const target=s.globalFootball.clubs.find(item=>
      item&&item.id!==current.id&&item.active!==false&&String(item.id).startsWith("gf_")
    );
    assert.ok(target);
    D.movePlayerToClub(s,current.id);
    s.offers=[offer(target.id)];

    const restored=reload(s);

    assert.equal(restored.clubId,current.id);
    assert.equal(restored.offers[0].clubId,target.id);
    assert.equal(D.club(restored,restored.clubId)?.id,current.id);
    assert.equal(D.club(restored,restored.offers[0].clubId)?.id,target.id);
});
