"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");

test("30.2: compactação restaura defaults e preserva todos os valores não padrão",()=>{
  const s=D.create({clubId:"c0"},3002);
  const player=s.internationalPlayers.find(item=>String(item.id).startsWith("gf_p_")&&item.clubId!=="gf_anderlecht");
  Object.assign(player,{appearances:7,condition:83,suspension:2,injury:5,external:false,marketStatus:"listed",morale:67,discipline:55,goals:4,minutes:321,reputation:91,shortName:"Nome Especial"});
  const text=JSON.stringify(s),raw=JSON.parse(text).internationalPlayers.find(item=>item.id===player.id);
  for(const field of ["appearances","condition","suspension","injury","external","marketStatus","morale","discipline","goals","minutes","reputation","shortName"]){
    assert.deepEqual(raw[field],player[field],field);
  }
  const restored=D.GlobalFootball.playerById(Save.parse(text),player.id);
  for(const field of ["appearances","condition","suspension","injury","external","marketStatus","morale","discipline","goals","minutes","reputation","shortName"]){
    assert.deepEqual(restored[field],player[field],field);
  }
});

test("30.2: internacional em clube brasileiro mantém attrs completos e passa no reload",()=>{
  const s=D.create({clubId:"c0"},3003),player=D.GlobalFootball.allPlayers(s).find(item=>item.name==="Cristian Makate"),club=s.clubs.find(item=>item.name==="Cuiabá");
  assert.ok(player&&club,"fixture real de Cristian Makate e Cuiabá");
  D.GlobalFootball.transferPlayer(s,player.id,club.id);
  s.internationalPlayers=s.internationalPlayers.filter(item=>item.id!==player.id);
  const text=JSON.stringify(s),raw=JSON.parse(text).clubs.find(item=>item.id===club.id).roster.find(item=>item.id===player.id);
  assert.deepEqual(Object.keys(raw.attrs).sort(),["defense","finish","pace","pass","stamina","strength"]);
  const restored=Save.parse(text),loaded=restored.clubs.find(item=>item.id===club.id).roster.find(item=>item.id===player.id);
  assert.deepEqual(loaded.attrs,player.attrs);
  assert.equal(loaded.clubId,club.id);
});

test("30.2: pool mundial compactado permanece abaixo de três milhões de caracteres",()=>{
  const s=D.create({clubId:"c0"},3004),poolSize=JSON.stringify(s.internationalPlayers).length;
  assert.ok(poolSize<3000000,`pool internacional com ${poolSize} caracteres`);
});
