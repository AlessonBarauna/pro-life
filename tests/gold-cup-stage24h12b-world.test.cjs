const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeGoldCup=
  require("../src/domain/gold-cup.js");

global.ProLifeAsianCup=
  require("../src/domain/asian-cup.js");

global.ProLifeAfcon=
  require("../src/domain/afcon.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=987123654;

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

test("2027 creates Gold Cup in world save",()=>{
  const s=state2027();
  const n=NT.init(s);

  const t=
    NT.ensureGoldCup(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.type,
    "GOLD_CUP"
  );

  assert.equal(
    t.year,
    2027
  );
});

test("2028 does not create Gold Cup",()=>{
  const s=state2027();

  s.day=
    2*365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureGoldCup(
      s,
      n
    ),
    null
  );
});

test("Gold Cup background completes group stage",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    165,
    171,
    177
  ]){
    s.day=
      365+
      relative;

    NT.progressGoldCupBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="GOLD_CUP"
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

test("Gold Cup completes automatically",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    165,
    171,
    177,
    183,
    188,
    193
  ]){
    s.day=
      365+
      relative;

    NT.progressGoldCupBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="GOLD_CUP"
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

test("Gold Cup summary exposes tournament",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    165,
    171,
    177,
    183,
    188,
    193
  ]){
    s.day=
      365+
      relative;

    NT.progressGoldCupBackground(
      s,
      n,
      R
    );
  }

  const summary=
    NT.goldCupSummary(s);

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
    31
  );

  assert.ok(
    summary.champion?.id
  );
});
