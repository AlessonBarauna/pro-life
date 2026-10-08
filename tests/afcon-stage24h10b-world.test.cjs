const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeAfcon=
  require("../src/domain/afcon.js");

global.ProLifeEuro=
  require("../src/domain/euro.js");

global.ProLifeUefaNationsLeague=
  require("../src/domain/uefa-nations-league.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=314159265;

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

test("2027 creates AFCON in world save",()=>{
  const s=state2027();
  const n=NT.init(s);

  const t=
    NT.ensureAfcon(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.type,
    "AFCON"
  );

  assert.equal(
    t.year,
    2027
  );
});

test("2028 does not create AFCON",()=>{
  const s=state2027();

  s.day=
    2*365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureAfcon(
      s,
      n
    ),
    null
  );
});

test("AFCON background completes group stage",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    18,
    23,
    28
  ]){
    s.day=
      365+
      relative;

    NT.progressAfconBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="AFCON"
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

test("AFCON completes automatically",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    18,
    23,
    28,
    34,
    39,
    44,
    49
  ]){
    s.day=
      365+
      relative;

    NT.progressAfconBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="AFCON"
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

test("AFCON summary exposes tournament",()=>{
  const s=state2027();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    18,
    23,
    28,
    34,
    39,
    44,
    49
  ]){
    s.day=
      365+
      relative;

    NT.progressAfconBackground(
      s,
      n,
      R
    );
  }

  const summary=
    NT.afconSummary(s);

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
    52
  );

  assert.ok(
    summary.champion?.id
  );
});
