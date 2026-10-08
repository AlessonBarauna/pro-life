const test=require("node:test");
const assert=require("node:assert/strict");

const WC=require("../src/domain/world-cup.js");

global.ProLifeWorldCup=WC;

const NationalTeam=
  require("../src/domain/national-team.js");

function baseState(day=0){
  return {
    mode:"player",
    day,
    season:
      2026+Math.floor(day/365),
    reputation:80,
    fans:0,
    clubId:"club1",

    person:{
      id:"hero",
      name:"Hero",
      age:22,
      pos:"ATA",
      nationality:"Brasil",
      condition:100,
      morale:80,
      ovr:85
    },

    clubs:[
      {
        id:"club1",
        name:"Clube Teste",
        roster:[]
      }
    ],

    calendarDays:[],

    competitionSchedule:{
      cup:{
        rounds:[]
      }
    },

    career:{
      playerCareer:{
        played:10,
        ratingTotal:75,
        squadRole:"Titular"
      }
    }
  };
}

test("2026 creates World Cup automatically",()=>{
  const s=baseState(0);

  const n=NationalTeam.init(s);

  assert.ok(
    n.tournaments.some(
      t=>
        t.type==="WORLD_CUP" &&
        t.year===2026
    )
  );
});

test("2030 creates another World Cup edition",()=>{
  const s=baseState(365*4);

  const n=NationalTeam.init(s);

  assert.ok(
    n.tournaments.some(
      t=>
        t.type==="WORLD_CUP" &&
        t.year===2030
    )
  );
});

test("2027 does not create World Cup",()=>{
  const s=baseState(365);

  const n=NationalTeam.init(s);

  assert.equal(
    n.tournaments.some(
      t=>
        t.type==="WORLD_CUP" &&
        t.year===2027
    ),
    false
  );
});

test("Brazil gets exactly three group fixtures",()=>{
  const s=baseState(0);

  const n=NationalTeam.init(s);

  const fixtures=n.schedule.filter(
    m=>
      m.tournamentType==="WORLD_CUP" &&
      m.tournamentYear===2026 &&
      m.tournamentPhase==="group"
  );

  assert.equal(
    fixtures.length,
    3
  );

  assert.equal(
    new Set(
      fixtures.map(m=>m.opponent)
    ).size,
    3
  );
});

test("Brazil World Cup group dates follow June schedule",()=>{
  const s=baseState(0);

  const n=NationalTeam.init(s);

  const fixtures=n.schedule
    .filter(
      m=>
        m.tournamentType==="WORLD_CUP" &&
        m.tournamentYear===2026
    )
    .sort(
      (a,b)=>a.day-b.day
    );

  assert.deepEqual(
    fixtures.map(m=>m.day),
    [161,167,173]
  );
});

test("Brazil played group fixture updates World Cup",()=>{
  const s=baseState(161);

  const n=NationalTeam.init(s);

  const fixture=n.schedule.find(
    m=>
      m.tournamentType==="WORLD_CUP" &&
      m.day===161
  );

  assert.ok(fixture);

  n.calledUp=true;
  n.status="Titular";

  n.callupDecisions[
    String(fixture.windowDay)
  ]={
    day:154,
    windowDay:fixture.windowDay,
    calledUp:true,
    status:"Titular"
  };

  const rng={
    next:()=>.5,
    int:a=>a
  };

  const api={
    overall:p=>
      Number(p.ovr||85)
  };

  NationalTeam.play(
    s,
    rng,
    api,
    ()=>{},
    fixture
  );

  const cup=n.tournaments.find(
    t=>t.type==="WORLD_CUP"
  );

  const cupMatch=
    cup.groups
      .flatMap(g=>g.matches)
      .find(
        m=>
          m.id===
          fixture.tournamentMatchId
      );

  assert.equal(
    fixture.played,
    true
  );

  assert.equal(
    cupMatch.played,
    true
  );
});
