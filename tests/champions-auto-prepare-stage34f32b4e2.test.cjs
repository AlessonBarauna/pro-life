"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");

test("34F.32B.4E.2 prepara calendario antes da primeira rodada",()=>{
  const s=D.create({
    mode:"player",clubId:"c0",catalogVersion:"fc27_v1"
  },5);

  D.advance(s,1);

  const ed=D.Continental.edition(s,"ucl");
  assert.ok(ed?.leagueSchedule);
  assert.equal(ed.leagueSchedule.matches.length,144);
  assert.ok(ed.leagueSchedule.matches.every(m=>!m.played));

  const saved=JSON.stringify(ed.leagueSchedule);
  D.advance(s,1);

  assert.equal(JSON.stringify(ed.leagueSchedule),saved);
});

test("34F.32B.4E.2 nao recria calendario retroativo",()=>{
  const s=D.create({
    mode:"player",clubId:"c0",catalogVersion:"fc27_v1"
  },5);

  D.Continental.init(s);
  // UCL_LEGACY_SCENARIO_V35
  delete D.Continental.edition(s, 'ucl').leagueSchedule;

  const ed=D.Continental.edition(s,"ucl");
  assert.equal(ed.leagueSchedule,undefined);

  s.day=D.Continental.windows(s.season,"ucl")[0]+5;
  D.advance(s,1);

  assert.equal(ed.leagueSchedule,undefined);
});