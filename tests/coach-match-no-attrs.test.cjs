"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
test("jogo do treinador não quebra com titular sem atributos detalhados",()=>{
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_5",90000);
  const club=E.club(s);E.CoachCareer.autoIdealXI(s,E,true);
  const p=club.roster.find(x=>club.lineup.includes(x.id)&&x.id!=="hero");delete p.attrs;
  const nc=E.nextCommitment(s);
  assert.doesNotThrow(()=>{while(s.day<=nc.date+1)E.advance(s,1);});
});
