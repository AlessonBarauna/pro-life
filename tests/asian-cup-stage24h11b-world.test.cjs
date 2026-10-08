const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeAsianCup=
  require("../src/domain/asian-cup.js");

global.ProLifeAfcon=
  require("../src/domain/afcon.js");

global.ProLifeEuro=
  require("../src/domain/euro.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=192837465;

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

function state2027(){
  return {
    day:365,
    season:2,
    mode:"player",

    person:{
      name:"Teste",
      age:23,
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

test("2027 creates Asian Cup in world save",()=>{
  const s=state2027();
  const n=NT.init(s);

  const t=
    NT.ensureAsianCup(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.type,
    "ASIAN_CUP"
  );

  assert.equal(
    t.year,
    2027
  );
});

test("2028 does not create Asian Cup",()=>{
  const s=state2027();

  s.day=
    2*365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureAsianCup(
      s,
      n
    ),
    null
  );
});

test("Asian Cup background completes group stage",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    26,
    31,
    36
  ]){
    s.day=
      365+
      relative;

    NT.progressAsianCupBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="ASIAN_CUP"
    );

  assert.equal(
    t.status,
    "ROUND_OF_16"
  );

  assert.equal(
    t.qualified16.length,
    16
  );

  assert.equal(
    t.groups
      .flatMap(
        g=>g.matches
      )
      .filter(
        m=>m.played
      ).length,
    36
  );
});

test("Asian Cup completes automatically",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    26,
    31,
    36,
    42,
    47,
    52,
    57
  ]){
    s.day=
      365+
      relative;

    NT.progressAsianCupBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="ASIAN_CUP"
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
});

test("Asian Cup summary exposes tournament",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    26,
    31,
    36,
    42,
    47,
    52,
    57
  ]){
    s.day=
      365+
      relative;

    NT.progressAsianCupBackground(
      s,
      n,
      R
    );
  }

  const summary=
    NT.asianCupSummary(s);

  assert.ok(summary);

  assert.equal(
    summary.year,
    2027
  );

  assert.equal(
    summary.status,
    "COMPLETED"
  );

  assert.equal(
    summary.participants.length,
    24
  );

  assert.equal(
    summary.groups.length,
    6
  );

  assert.equal(
    summary.totalMatches,
    51
  );

  assert.ok(
    summary.champion?.id
  );
});
