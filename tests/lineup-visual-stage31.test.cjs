"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const D=require("../src/domain/engine.js");

function state(seed=3102){
  const s=D.create({mode:"player",clubId:"c0"},seed);
  D.Career.init(s);
  D.Squad.init(s);
  return s;
}

test("Stage 31.2: formações reais mantêm onze titulares únicos",()=>{
  for(const formation of ["4-3-3","4-4-2","4-2-3-1"]){
    const s=state(),club=D.club(s);
    club.formation=formation;
    const selection=D.Squad.choose(s,club),ids=selection.starters.map(player=>player.id);
    assert.equal(selection.formation,formation);
    assert.equal(ids.length,11,formation);
    assert.equal(new Set(ids).size,11,`${formation} não pode duplicar jogadores`);
    for(const [position,count] of Object.entries(D.Squad.slots[formation])){
      assert.equal(selection.starters.filter(player=>player.pos===position).length,count,`${formation} · ${position}`);
    }
  }
});

test("Stage 31.2: personagem pode ser titular, reserva ou ficar fora da relação",()=>{
  const s=state(),pc=D.Career.init(s).playerCareer;
  s.person.condition=100;
  s.person.morale=70;
  for(const key of Object.keys(s.person.attrs)) s.person.attrs[key]=99;
  pc.coachTrust=100;
  assert.equal(D.Squad.competition(s).heroRole,"Titular");

  for(const key of Object.keys(s.person.attrs)) s.person.attrs[key]=75;
  pc.coachTrust=30;
  assert.equal(D.Squad.competition(s).heroRole,"Banco");

  s.person.condition=20;
  assert.equal(D.Squad.competition(s).heroRole,"Fora da relação");
});

test("Stage 31.2: interface reutiliza a seleção do motor no campo e preserva Seleção Brasileira",()=>{
  const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
  assert.match(app,/fc-tactical-board/);
  assert.match(app,/L\.selection\.starters,L\.formation/);
  assert.match(app,/nationalLineup\.starters,nationalLineup\.formation/);
  assert.match(app,/data-player-id/);
  assert.match(app,/fc-sub-plan/);
  assert.match(app,/captainId:capId,viceId/);
});
