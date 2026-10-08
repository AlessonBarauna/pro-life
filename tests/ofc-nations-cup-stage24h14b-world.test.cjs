const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeOfcNationsCup=
  require("../src/domain/ofc-nations-cup.js");

global.ProLifeConcacafNationsLeague=
  require("../src/domain/concacaf-nations-league.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=159753486;

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

function state2028(){
  return {
    day:2*365,
    season:3,
    mode:"player",

    person:{
      name:"Teste",
      age:24,
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

test("2028 creates OFC Nations Cup",()=>{
  const s=state2028();
  const n=NT.init(s);

  const t=
    NT.ensureOfcNationsCup(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.type,
    "OFC_NATIONS_CUP"
  );

  assert.equal(
    t.year,
    2028
  );
});

test("2029 does not create OFC Nations Cup",()=>{
  const s=state2028();

  s.day=
    3*365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureOfcNationsCup(
      s,
      n
    ),
    null
  );
});

test("OFC Nations Cup group stage completes automatically",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    160,
    165,
    170
  ]){
    s.day=
      2*365+
      relative;

    NT.progressOfcNationsCupBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>
        x.type===
        "OFC_NATIONS_CUP"
    );

  assert.equal(
    t.status,
    "SEMIFINAL"
  );

  assert.equal(
    t.qualified4.length,
    4
  );

  assert.equal(
    t.groups
      .flatMap(
        g=>g.matches
      )
      .filter(
        m=>m.played
      ).length,
    12
  );
});

test("OFC Nations Cup completes automatically",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    160,
    165,
    170,
    176,
    181
  ]){
    s.day=
      2*365+
      relative;

    NT.progressOfcNationsCupBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>
        x.type===
        "OFC_NATIONS_CUP"
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

  assert.notEqual(
    t.champion.id,
    t.runnerUp.id
  );
});

test("OFC Nations Cup summary exposes tournament",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    160,
    165,
    170,
    176,
    181
  ]){
    s.day=
      2*365+
      relative;

    NT.progressOfcNationsCupBackground(
      s,
      n,
      R
    );
  }

  const summary=
    NT.ofcNationsCupSummary(s);

  assert.ok(summary);

  assert.equal(
    summary.year,
    2028
  );

  assert.equal(
    summary.status,
    "COMPLETED"
  );

  assert.equal(
    summary.participants.length,
    8
  );

  assert.equal(
    summary.groups.length,
    2
  );

  assert.equal(
    summary.qualified4.length,
    4
  );

  assert.equal(
    summary.totalMatches,
    15
  );

  assert.ok(
    summary.champion?.id
  );
});
