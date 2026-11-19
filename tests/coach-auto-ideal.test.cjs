"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
function coach(){const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_5",90000);return s;}
test("time ideal automático tira lesionado do XI antes do jogo e mantém 11 únicos com goleiro",()=>{
  const s=coach();const club=E.club(s);
  E.CoachCareer.autoIdealXI(s,E,true);
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
test("escalação manual: jogador de GER baixo continua titular; só lesionado/suspenso é trocado",()=>{
  const s=coach();E.CoachCareer.autoIdealXI(s,E,true);
  const club=E.club(s);
  const weak=club.roster.filter(p=>!club.lineup.includes(p.id)&&p.pos==="ATA"&&p.id!=="hero").sort((a,b)=>E.overall(a)-E.overall(b))[0];
  const slot=club.lineup.findIndex(id=>club.roster.find(p=>p.id===id).pos==="ATA");
  club.lineup[slot]=weak.id;
  const manual=[...club.lineup];
  assert.equal(E.CoachCareer.autoIdealXI(s,E).changed,false);
  const nc=E.nextCommitment(s);
  while(s.day<nc.date)E.advance(s,Math.min(30,nc.date-s.day));
  assert.ok(E.club(s).lineup.includes(weak.id),"GER baixo não tira o jogador do XI");
  const other=E.club(s).roster.find(p=>E.club(s).lineup.includes(p.id)&&p.pos==="DEF"&&p.id!==weak.id);
  other.suspension=2;
  const swaps=E.CoachCareer.dropUnavailable(s,E);
  assert.equal(swaps.length,1);assert.ok(!E.club(s).lineup.includes(other.id));
  assert.ok(E.club(s).lineup.includes(weak.id));
  assert.equal(new Set(E.club(s).lineup).size,11);
  assert.equal(E.club(s).roster.find(p=>p.id===swaps[0].in).pos,"DEF");
});
