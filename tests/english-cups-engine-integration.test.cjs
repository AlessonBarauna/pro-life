"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");

const CITY="gf_fc27_10";
function career(){const s=D.create({mode:"coach",clubId:"c0",catalogVersion:"fc27_v1"},4242);s.clubId=null;D.join(s,CITY,90000);return s;}
function advanceOne(s){s.board=100;D.advance(s,1);}

test("motor oficial integra Premier, copas inglesas e competição UEFA no mesmo calendário",()=>{
  const s=career();
  assert.equal(D.EnglishCups.edition(s,"fa_cup"),null,"FA Cup 2026/27 must not begin in January 2026");
  const cupOpening=require("../src/domain/european-calendar.js").dateDay("2026-08-01");
  while(s.day<cupOpening)advanceOne(s);
  assert.equal(D.EnglishCups.edition(s,"fa_cup")?.participantIds.length,92);
  assert.equal(D.EnglishCups.edition(s,"efl_cup")?.participantIds.length,92);
  assert.equal(D.Continental.heroEntries(s).length,1,"clube inscrito simultaneamente ou ausente nas competições UEFA");

  let cupFixture=null;
  while(s.day<470&&!cupFixture){cupFixture=D.EnglishCups.nextFixture(s,CITY);if(!cupFixture)advanceOne(s);}
  assert.ok(cupFixture,"copa inglesa não entrou no calendário do Manchester City");
  while(s.day<cupFixture.day-1)advanceOne(s);
  const next=D.nextCommitment(s);
  assert.equal(next.competitionId,cupFixture.competitionId);
  assert.deepEqual([next.home,next.away,next.date],[cupFixture.homeId,cupFixture.awayId,cupFixture.day]);

  const prepared=D.prepareCoachWorldFixture(s,next);
  assert.ok(prepared?.home?.roster?.length>=11&&prepared?.away?.roster?.length>=11);
  const controller=D.createCoachLiveController(prepared.home,prepared.away,new D.Random(s.rng),s);
  controller.advanceTo(94);assert.equal(controller.finished,true);
  assert.equal(D.stageCoachLiveResult(s,next,controller),true);
  advanceOne(s);

  const official=s.matches.filter(m=>m.competitionId===cupFixture.competitionId&&m.date===cupFixture.day&&m.home===cupFixture.homeId&&m.away===cupFixture.awayId);
  assert.equal(official.length,1,"partida da copa não foi registrada uma única vez");
  assert.equal(official[0].domesticCupMatch,true);
  const completed=D.EnglishCups.edition(s,cupFixture.competitionId).rounds.flatMap(r=>r.matches).find(m=>m.id===cupFixture.id);
  assert.deepEqual([completed.hg,completed.ag],[controller.result.hg,controller.result.ag]);
  advanceOne(s);assert.equal(s.matches.filter(m=>m.competitionId===cupFixture.competitionId&&m.date===cupFixture.day).length,1);

  const restored=JSON.parse(JSON.stringify(s));
  const persisted=D.EnglishCups.edition(restored,cupFixture.competitionId).rounds.flatMap(r=>r.matches).find(m=>m.id===cupFixture.id);
  assert.deepEqual([persisted.played,persisted.hg,persisted.ag],[true,completed.hg,completed.ag]);
});
