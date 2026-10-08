const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeConcacafNationsLeague=
  require("../src/domain/concacaf-nations-league.js");

global.ProLifeGoldCup=
  require("../src/domain/gold-cup.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=741852963;

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

function state(){
  return {
    day:0,
    season:1,
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
    matches:[],
    calendarDays:[],

    competitionSchedule:{
      cup:{
        rounds:[]
      }
    }
  };
}

function membership(
  tournament,
  leagueId
){
  const league=
    tournament.leagues[
      leagueId
    ];

  return [
    ...(league.seeded||[]),
    ...league.groups.flatMap(
      g=>g.teams
    )
  ].map(
    x=>x.id
  );
}

test("2026 creates Concacaf Nations League",()=>{
  const s=state();
  const n=NT.init(s);

  const t=
    NT.ensureConcacafNationsLeague(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.type,
    "CONCACAF_NATIONS_LEAGUE"
  );

  assert.equal(
    t.year,
    2026
  );
});

test("2027 does not create a new edition",()=>{
  const s=state();

  s.day=365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureConcacafNationsLeague(
      s,
      n
    ),
    null
  );
});

test("league phase progresses automatically",()=>{
  const s=state();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    245,
    252,
    273,
    280,
    301,
    308
  ]){
    s.day=day;

    NT.progressConcacafNationsLeagueBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>
        x.type===
        "CONCACAF_NATIONS_LEAGUE"
    );

  assert.equal(
    t.status,
    "QUARTERFINAL"
  );

  assert.equal(
    t.quarterfinals.length,
    4
  );

  assert.ok(
    t.promotion.length>0
  );

  assert.ok(
    t.relegation.length>0
  );
});

test("quarterfinals create Final Four",()=>{
  const s=state();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    245,
    252,
    273,
    280,
    301,
    308,
    329
  ]){
    s.day=day;

    NT.progressConcacafNationsLeagueBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>
        x.type===
        "CONCACAF_NATIONS_LEAGUE"
    );

  assert.equal(
    t.status,
    "SEMIFINAL"
  );

  assert.equal(
    t.finals.filter(
      x=>x.phase==="SEMIFINAL"
    ).length,
    2
  );
});

test("Final Four completes in following year",()=>{
  const s=state();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    245,
    252,
    273,
    280,
    301,
    308,
    329,
    430,
    434
  ]){
    s.day=day;

    NT.progressConcacafNationsLeagueBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>
        x.type===
        "CONCACAF_NATIONS_LEAGUE"
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

test("next edition inherits promotion and relegation",()=>{
  const s=state();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    245,
    252,
    273,
    280,
    301,
    308,
    329,
    430,
    434
  ]){
    s.day=day;

    NT.progressConcacafNationsLeagueBackground(
      s,
      n,
      R
    );
  }

  const first=
    n.tournaments.find(
      x=>
        x.type===
          "CONCACAF_NATIONS_LEAGUE" &&
        x.year===2026
    );

  const promoted=
    first.promotion.find(
      x=>
        x.from==="B" &&
        x.to==="A"
    ).team.id;

  const relegated=
    first.relegation.find(
      x=>
        x.from==="A" &&
        x.to==="B"
    ).team.id;

  s.day=
    2*365;

  const second=
    NT.ensureConcacafNationsLeague(
      s,
      n
    );

  assert.equal(
    second.year,
    2028
  );

  assert.equal(
    second.carriedFromYear,
    2026
  );

  const leagueA=
    membership(
      second,
      "A"
    );

  const leagueB=
    membership(
      second,
      "B"
    );

  assert.ok(
    leagueA.includes(
      promoted
    )
  );

  assert.ok(
    !leagueA.includes(
      relegated
    )
  );

  assert.ok(
    leagueB.includes(
      relegated
    )
  );
});

test("summary exposes divisions movement and champion",()=>{
  const s=state();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    245,
    252,
    273,
    280,
    301,
    308,
    329,
    430,
    434
  ]){
    s.day=day;

    NT.progressConcacafNationsLeagueBackground(
      s,
      n,
      R
    );
  }

  const summary=
    NT.concacafNationsLeagueSummary(
      s
    );

  assert.ok(summary);

  assert.deepEqual(
    Object.keys(
      summary.leagues
    ),
    ["A","B","C"]
  );

  assert.ok(
    summary.promotion.length>0
  );

  assert.ok(
    summary.relegation.length>0
  );

  assert.ok(
    summary.champion?.id
  );
});
