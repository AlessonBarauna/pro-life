"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
function coach(){const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_5",90000);return s;}
test("time ideal automático tira lesionado do XI antes do jogo e mantém 11 únicos com goleiro",()=>{
  const s=coach();const club=E.club(s);
  E.CoachCareer.autoIdealXI(s,E);
  const star=club.roster.find(p=>club.lineup.includes(p.id)&&p.pos!=="GOL");
  star.injury={name:"Entorse",daysLeft:20};
  // sem jogo próximo a escalação antiga continua; ao chegar o dia do jogo o motor refaz sozinho
  star.injury={name:"Entorse",daysLeft:900};
  const nc=E.nextCommitment(s);
  while(s.day<nc.date-3)E.advance(s,Math.min(30,nc.date-3-s.day));
  assert.ok(E.club(s).lineup.includes(star.id),"longe do jogo a escalação não muda");
  E.advance(s,3);
  const ids=E.club(s).lineup;
  assert.equal(new Set(ids).size,11);
  assert.ok(!ids.includes(star.id),"lesionado fora");
  assert.ok(ids.every(id=>!E.club(s).roster.find(p=>p.id===id).injury));
  assert.ok(ids.some(id=>E.club(s).roster.find(p=>p.id===id).pos==="GOL"));
  assert.equal(s.coachAutoIdealError,undefined);
});
test("desligar o automático preserva a escalação manual",()=>{
  const s=coach();E.CoachCareer.autoIdealXI(s,E);
  s.coachCareer.autoIdeal=false;
  const club=E.club(s),manual=[...club.lineup];
  const out=club.roster.find(p=>manual.includes(p.id)&&p.pos!=="GOL");out.injury={name:"x",daysLeft:9};
  assert.equal(E.CoachCareer.autoIdealXI(s,E).changed,false);
  assert.deepEqual(club.lineup,manual);
  s.coachCareer.autoIdeal=true;
  assert.equal(E.CoachCareer.autoIdealXI(s,E).changed,true);
  assert.ok(!club.lineup.includes(out.id));
});
