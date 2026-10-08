const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeEuro=
  require("../src/domain/euro.js");

global.ProLifeCopaAmerica=
  require("../src/domain/copa-america.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=987654321;

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
      age:22,
      pos:"ATA",
      morale:80,
      nationality:"Brasil",
      condition:100
    },

    reputation:85,
    fans:0,

    nationalTeam:null,

    calendarDays:[],

    matches:[],

    competitionSchedule:{
      cup:{
        rounds:[]
      }
    }
  };
}

test("2028 creates EURO inside international save",()=>{
  const s=state2028();
  const n=NT.init(s);

  const tournament=
    NT.ensureEuro(
      s,
      n
    );

  assert.ok(
    tournament
  );

  assert.equal(
    tournament.type,
    "EURO"
  );

  assert.equal(
    tournament.year,
    2028
  );
});

test("non EURO year does not create EURO",()=>{
  const s=state2028();

  s.day=
    365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureEuro(
      s,
      n
    ),
    null
  );
});

test("EURO background simulation completes group stage",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    166,
    172,
    178
  ]){
    s.day=
      2*365+
      relative;

    NT.progressEuroBackground(
      s,
      n,
      R
    );
  }

  const tournament=
    n.tournaments.find(
      x=>x.type==="EURO"
    );

  assert.equal(
    tournament.status,
    "ROUND_OF_16"
  );

  assert.equal(
    tournament.groups
      .flatMap(
        group=>group.matches
      )
      .filter(
        match=>match.played
      ).length,
    36
  );

  assert.equal(
    tournament.qualified16.length,
    16
  );
});

test("EURO progresses automatically to champion",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    166,
    172,
    178,
    185,
    190,
    195,
    199
  ]){
    s.day=
      2*365+
      relative;

    NT.progressEuroBackground(
      s,
      n,
      R
    );
  }

  const tournament=
    n.tournaments.find(
      x=>x.type==="EURO"
    );

  assert.equal(
    tournament.status,
    "COMPLETED"
  );

  assert.ok(
    tournament.champion?.id
  );

  assert.ok(
    tournament.runnerUp?.id
  );

  assert.notEqual(
    tournament.champion.id,
    tournament.runnerUp.id
  );
});

test("EURO summary exposes champion for Finalissima feed",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  for(const relative of [
    166,
    172,
    178,
    185,
    190,
    195,
    199
  ]){
    s.day=
      2*365+
      relative;

    NT.progressEuroBackground(
      s,
      n,
      R
    );
  }

  const summary=
    NT.euroSummary(s);

  assert.ok(summary);

  assert.equal(
    summary.year,
    2028
  );

  assert.equal(
    summary.status,
    "COMPLETED"
  );

  assert.ok(
    summary.champion?.id
  );

  assert.equal(
    summary.participants.length,
    24
  );

  assert.equal(
    summary.totalMatches,
    51
  );
});

test("EURO exists independently from Brazil participation",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  s.day=
    2*365+
    199;

  NT.progressEuroBackground(
    s,
    n,
    R
  );

  const tournament=
    n.tournaments.find(
      x=>x.type==="EURO"
    );

  assert.ok(
    tournament
  );

  assert.equal(
    tournament.participants.some(
      team=>team.id==="BRA"
    ),
    false
  );
});
