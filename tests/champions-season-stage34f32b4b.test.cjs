"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");
const Season=require("../src/domain/champions-season.js");

function setup(){
  const s=D.create({
    mode:"player",
    clubId:"c0",
    catalogVersion:"fc27_v1"
  },5);
  D.Continental.init(s);
  return {
    s,
    C:D.Continental,
    W:D.WorldClubCompetitions
  };
}

test("34F.32B.4B calendario persistente e idempotente",()=>{
  const {s,C,W}=setup();
  const ed=C.edition(s,"ucl");

  const first=Season.prepare(s,C,W);
  assert.equal(first.matches.length,144);

  const serialized=JSON.stringify(first);
  const again=Season.prepare(s,C,W);

  assert.equal(JSON.stringify(again),serialized);
  assert.equal(ed.leagueSchedule,first);
  assert.equal(first.matches.filter(m=>m.played).length,0);
});

test("34F.32B.4B nao inventa jogos antigos",()=>{
  const {s,C,W}=setup();
  const first=C.windows(s.season,"ucl")[0];
  // Simula save legado criado antes do bootstrap do calendario no dia zero.
  const ed=C.edition(s,"ucl");
  delete ed.leagueSchedule;
  s.day=first+5;

  assert.throws(
    ()=>Season.prepare(s,C,W),
    /retroativo/
  );
});

test("34F.32B.4B processa uma vez e nao altera LaLiga",()=>{
  const {s,C,W}=setup();
  const schedule=Season.prepare(s,C,W);
  const firstDay=Math.min(...schedule.matches.map(m=>m.day));

  const leagueBefore=JSON.stringify(
    (s.clubs||[]).map(c=>[c.id,c.stats])
  );

  s.day=firstDay;

  const due=schedule.matches.filter(m=>m.day===firstDay);
  assert.ok(due.length>0);

  let calls=0;
  const resolver=()=>{
    calls++;
    return {hg:2,ag:1};
  };

  const first=Season.processDay(s,C,W,{
    otherFixture:resolver
  });

  const callsAfterFirst=calls;

  assert.equal(first.played,due.length);
  assert.equal(first.totalPlayed,due.length);

  const second=Season.processDay(s,C,W,{
    otherFixture:resolver
  });

  assert.equal(second.played,0);
  assert.equal(calls,callsAfterFirst);
  assert.equal(
    JSON.stringify((s.clubs||[]).map(c=>[c.id,c.stats])),
    leagueBefore
  );

  const snapshot=JSON.parse(JSON.stringify(schedule));
  assert.equal(snapshot.matches.filter(m=>m.played).length,due.length);
});

test("34F.32B.4B protagonista aguarda simulador oficial",()=>{
  const {s,C,W}=setup();
  const schedule=Season.prepare(s,C,W);
  const heroId=schedule.matches[0].homeId;

  s.clubId=heroId;
  s.day=schedule.matches[0].day;

  const heroGames=schedule.matches.filter(m=>
    m.day<=s.day&&
    [m.homeId,m.awayId].includes(heroId)
  );

  assert.ok(heroGames.length>0);

  const result=Season.processDay(s,C,W,{
    otherFixture:()=>({hg:1,ag:0})
  });

  assert.ok(result.waitingHero>0);
  assert.ok(heroGames.every(m=>!m.played));

  const completed=Season.processDay(s,C,W,{
    heroFixture:()=>({hg:3,ag:2})
  });

  assert.equal(completed.played,heroGames.length);
  assert.ok(heroGames.every(m=>m.played));
});

test("34F.32B.4B rejeita placar invalido",()=>{
  const {s,C,W}=setup();
  const schedule=Season.prepare(s,C,W);

  s.day=schedule.matches[0].day;

  assert.throws(
    ()=>Season.processDay(s,C,W,{
      otherFixture:()=>({hg:-1,ag:2})
    }),
    /invalido/
  );

  assert.equal(
    schedule.matches.filter(m=>m.played).length,
    0
  );
});