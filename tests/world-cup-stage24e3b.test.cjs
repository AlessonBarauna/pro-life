const test=require("node:test");
const assert=require("node:assert/strict");

const WC=
  require("../src/domain/world-cup.js");

global.ProLifeWorldCup=WC;

const NT=
  require("../src/domain/national-team.js");

function random(){
  return {
    value:.21,

    next(){
      this.value=
        (this.value+.193)%1;

      return this.value;
    },

    int(a){
      return a;
    }
  };
}

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

function winBrazilFixture(
  s,
  n,
  fixture,
  rng
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
    rng
  );
}

function winGroup(s,n,rng){
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
    winBrazilFixture(
      s,
      n,
      fixture,
      rng
    );
}

test("three group wins create round of 32 fixture",()=>{
  const s=state();
  const n=NT.init(s);
  const rng=random();

  winGroup(s,n,rng);

  const cup=n.tournaments.find(
    t=>t.type==="WORLD_CUP"
  );

  assert.equal(
    cup.qualified32.length,
    32
  );

  assert.ok(
    cup.qualified32.some(
      t=>t.id==="BRA"
    )
  );

  assert.ok(
    n.schedule.some(
      m=>
        m.tournamentPhase==="ROUND_OF_32" &&
        !m.played
    )
  );
});

test("round of 32 victory creates round of 16",()=>{
  const s=state();
  const n=NT.init(s);
  const rng=random();

  winGroup(s,n,rng);

  const fixture=n.schedule.find(
    m=>
      m.tournamentPhase==="ROUND_OF_32" &&
      !m.played
  );

  assert.ok(fixture);

  winBrazilFixture(
    s,n,fixture,rng
  );

  assert.ok(
    n.schedule.some(
      m=>
        m.tournamentPhase==="ROUND_OF_16" &&
        !m.played
    )
  );
});

test("Brazil can progress to World Cup final",()=>{
  const s=state();
  const n=NT.init(s);
  const rng=random();

  winGroup(s,n,rng);

  for(const phase of [
    "ROUND_OF_32",
    "ROUND_OF_16",
    "QUARTERFINAL",
    "SEMIFINAL"
  ]){
    const fixture=n.schedule.find(
      m=>
        m.tournamentPhase===phase &&
        !m.played
    );

    assert.ok(
      fixture,
      "missing "+phase
    );

    winBrazilFixture(
      s,n,fixture,rng
    );
  }

  assert.ok(
    n.schedule.some(
      m=>
        m.tournamentPhase==="FINAL" &&
        !m.played
    )
  );
});

test("winning final registers World Cup title",()=>{
  const s=state();
  const n=NT.init(s);
  const rng=random();

  winGroup(s,n,rng);

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

    winBrazilFixture(
      s,n,fixture,rng
    );
  }

  const cup=n.tournaments.find(
    t=>t.type==="WORLD_CUP"
  );

  assert.equal(
    cup.status,
    "COMPLETED"
  );

  assert.equal(
    cup.champion.id,
    "BRA"
  );

  assert.equal(
    cup.brazilStatus,
    "CHAMPION"
  );

  assert.ok(
    n.titles.includes(
      "Copa Mundial 2026"
    )
  );
});

test("knockout loss eliminates Brazil and finishes tournament",()=>{
  const s=state();
  const n=NT.init(s);
  const rng=random();

  winGroup(s,n,rng);

  const fixture=n.schedule.find(
    m=>
      m.tournamentPhase==="ROUND_OF_32" &&
      !m.played
  );

  assert.ok(fixture);

  fixture.played=true;
  fixture.brazil=0;
  fixture.other=2;

  NT.recordWorldCupFixture(
    s,
    n,
    fixture,
    0,
    2,
    rng
  );

  const cup=n.tournaments.find(
    t=>t.type==="WORLD_CUP"
  );

  assert.equal(
    cup.brazilStatus,
    "ELIMINATED"
  );

  assert.equal(
    cup.brazilEliminationPhase,
    "ROUND_OF_32"
  );

  assert.equal(
    cup.status,
    "COMPLETED"
  );

  assert.ok(cup.champion);
});

test("club calendar protects World Cup pause and knockout dates",()=>{
  const base=365*4;

  assert.equal(
    NT.protectedDay(base+154),
    true
  );

  assert.equal(
    NT.protectedDay(base+194),
    true
  );

  assert.equal(
    NT.protectedDay(base+199),
    true
  );

  assert.equal(
    NT.protectedDay(base+200),
    false
  );
});
