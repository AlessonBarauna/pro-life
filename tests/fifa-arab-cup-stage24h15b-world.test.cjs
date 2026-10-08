const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeFifaArabCup=
  require("../src/domain/fifa-arab-cup.js");

global.ProLifeOfcNationsCup=
  require("../src/domain/ofc-nations-cup.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=246813579;

  return {
    next(){
      seed=
        (
          Math.imul(
            seed,
            1664525
          )+
          1013904223
        )>>>0;

      return seed/
        4294967296;
    },

    int(min,max){
      return (
        min+
        Math.floor(
          this.next()*
          (max-min+1)
        )
      );
    }
  };
}

function state2029(){
  return {
    day:3*365,
    season:4,
    mode:"player",

    person:{
      name:"Teste",
      age:25,
      pos:"ATA",
      morale:80,
      nationality:"Brasil",
      condition:100
    },

    reputation:85,
    fans:0,
    nationalTeam:null,
    matches:[],
    calendarDays:[],

    competitionSchedule:{
      cup:{
        rounds:[]
      }
    }
  };
}

test("2029 creates FIFA Arab Cup",()=>{
  const s=state2029();
  const n=NT.init(s);

  const t=
    NT.ensureFifaArabCup(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.type,
    "FIFA_ARAB_CUP"
  );

  assert.equal(
    t.year,
    2029
  );
});

test("2030 does not create FIFA Arab Cup",()=>{
  const s=state2029();

  s.day=
    4*365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureFifaArabCup(
      s,
      n
    ),
    null
  );
});

test("FIFA Arab Cup group stage completes automatically",()=>{
  const s=state2029();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    330,
    334,
    338
  ]){
    s.day=
      3*365+
      relative;

    NT.progressFifaArabCupBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="FIFA_ARAB_CUP"
    );

  assert.equal(
    t.status,
    "QUARTERFINAL"
  );

  assert.equal(
    t.qualified8.length,
    8
  );

  assert.equal(
    t.groups
      .flatMap(
        g=>g.matches
      )
      .filter(
        m=>m.played
      ).length,
    24
  );
});

test("FIFA Arab Cup completes automatically",()=>{
  const s=state2029();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    330,
    334,
    338,
    343,
    347,
    351
  ]){
    s.day=
      3*365+
      relative;

    NT.progressFifaArabCupBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="FIFA_ARAB_CUP"
    );

  assert.equal(
    t.status,
    "COMPLETED"
  );

  assert.ok(
    t.champion?.id
  );

  assert.ok(
    t.runnerUp?.id
  );

  assert.ok(
    t.thirdPlace?.id
  );
});

test("FIFA Arab Cup summary exposes tournament",()=>{
  const s=state2029();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    330,
    334,
    338,
    343,
    347,
    351
  ]){
    s.day=
      3*365+
      relative;

    NT.progressFifaArabCupBackground(
      s,
      n,
      R
    );
  }

  const summary=
    NT.fifaArabCupSummary(s);

  assert.ok(summary);

  assert.equal(
    summary.year,
    2029
  );

  assert.equal(
    summary.status,
    "COMPLETED"
  );

  assert.equal(
    summary.participants.length,
    16
  );

  assert.equal(
    summary.groups.length,
    4
  );

  assert.equal(
    summary.qualified8.length,
    8
  );

  assert.equal(
    summary.totalMatches,
    32
  );

  assert.ok(
    summary.champion?.id
  );

  assert.ok(
    summary.thirdPlace?.id
  );
});
