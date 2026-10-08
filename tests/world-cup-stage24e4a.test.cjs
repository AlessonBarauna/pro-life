const test=require("node:test");
const assert=require("node:assert/strict");

const WC=
  require("../src/domain/world-cup.js");

global.ProLifeWorldCup=WC;

const NT=
  require("../src/domain/national-team.js");

function state(){
  return {
    mode:"player",
    day:0,
    season:2026,
    reputation:90,
    fans:0,
    clubId:"club1",

    person:{
      id:"hero",
      name:"Hero",
      age:22,
      pos:"ATA",
      nationality:"Brasil",
      condition:100,
      morale:90,
      ovr:90
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
        played:20,
        ratingTotal:160,
        squadRole:"Titular"
      }
    }
  };
}

function rng(){
  return {
    value:.11,

    next(){
      this.value=
        (this.value+.181)%1;

      return this.value;
    },

    int(a){
      return a;
    }
  };
}

function win(
  s,
  n,
  fixture,
  random
){
  fixture.played=true;
  fixture.brazil=3;
  fixture.other=0;

  NT.recordWorldCupFixture(
    s,
    n,
    fixture,
    3,
    0,
    random
  );
}

test("summary exposes group and Brazil row",()=>{
  const s=state();
  NT.init(s);

  const summary=
    NT.worldCupSummary(s);

  assert.ok(summary);
  assert.equal(
    summary.year,
    2026
  );

  assert.ok(
    summary.group
  );

  assert.ok(
    summary.brazilRow
  );

  assert.equal(
    summary.brazilRow.id,
    "BRA"
  );
});

test("summary exposes next World Cup fixture",()=>{
  const s=state();
  NT.init(s);

  const summary=
    NT.worldCupSummary(s);

  assert.ok(
    summary.nextFixture
  );

  assert.equal(
    summary.nextFixture.phase,
    "group"
  );
});

test("summary updates after group matches",()=>{
  const s=state();
  const n=NT.init(s);
  const random=rng();

  const fixtures=n.schedule
    .filter(
      m=>
        m.tournamentType==="WORLD_CUP" &&
        m.tournamentPhase==="group"
    )
    .sort(
      (a,b)=>a.day-b.day
    );

  for(const fixture of fixtures)
    win(
      s,
      n,
      fixture,
      random
    );

  const summary=
    NT.worldCupSummary(s);

  assert.equal(
    summary.matchesPlayed,
    3
  );

  assert.equal(
    summary.brazilQualified,
    true
  );

  assert.equal(
    summary.nextFixture.phase,
    "ROUND_OF_32"
  );
});

test("summary exposes elimination",()=>{
  const s=state();
  const n=NT.init(s);
  const random=rng();

  const groups=n.schedule
    .filter(
      m=>
        m.tournamentType==="WORLD_CUP" &&
        m.tournamentPhase==="group"
    );

  for(const fixture of groups)
    win(
      s,
      n,
      fixture,
      random
    );

  const r32=n.schedule.find(
    m=>
      m.tournamentPhase==="ROUND_OF_32" &&
      !m.played
  );

  r32.played=true;
  r32.brazil=0;
  r32.other=1;

  NT.recordWorldCupFixture(
    s,
    n,
    r32,
    0,
    1,
    random
  );

  const summary=
    NT.worldCupSummary(s);

  assert.equal(
    summary.brazilStatus,
    "ELIMINATED"
  );

  assert.equal(
    summary.eliminationPhase,
    "ROUND_OF_32"
  );

  assert.ok(
    summary.champion
  );
});

test("summary exposes Brazil as champion",()=>{
  const s=state();
  const n=NT.init(s);
  const random=rng();

  const groupFixtures=n.schedule
    .filter(
      m=>
        m.tournamentType==="WORLD_CUP" &&
        m.tournamentPhase==="group"
    );

  for(const fixture of groupFixtures)
    win(
      s,
      n,
      fixture,
      random
    );

  for(const phase of [
    "ROUND_OF_32",
    "ROUND_OF_16",
    "QUARTERFINAL",
    "SEMIFINAL",
    "FINAL"
  ]){
    const fixture=n.schedule.find(
      m=>
        m.tournamentPhase===phase &&
        !m.played
    );

    assert.ok(fixture);

    win(
      s,
      n,
      fixture,
      random
    );
  }

  const summary=
    NT.worldCupSummary(s);

  assert.equal(
    summary.brazilStatus,
    "CHAMPION"
  );

  assert.equal(
    summary.champion,
    "Brasil"
  );

  assert.equal(
    summary.phase,
    "Encerrada"
  );
});
