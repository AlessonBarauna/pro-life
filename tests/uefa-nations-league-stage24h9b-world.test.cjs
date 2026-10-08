const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeUefaNationsLeague=
  require("../src/domain/uefa-nations-league.js");

global.ProLifeEuro=
  require("../src/domain/euro.js");

global.ProLifeCopaAmerica=
  require("../src/domain/copa-america.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=135792468;

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

function state2026(){
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

test("2026 creates Nations League in world save",()=>{
  const s=state2026();
  const n=NT.init(s);

  const tournament=
    NT.ensureNationsLeague(
      s,
      n
    );

  assert.ok(tournament);

  assert.equal(
    tournament.type,
    "UEFA_NATIONS_LEAGUE"
  );

  assert.equal(
    tournament.year,
    2026
  );
});

test("odd year does not create Nations League",()=>{
  const s=state2026();

  s.day=365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureNationsLeague(
      s,
      n
    ),
    null
  );
});

test("Nations League league phase completes automatically",()=>{
  const s=state2026();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    55,
    59,
    92,
    96,
    125,
    129
  ]){
    s.day=day;

    NT.progressNationsLeagueBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>
        x.type===
        "UEFA_NATIONS_LEAGUE"
    );

  assert.ok(
    [
      "SEMIFINAL",
      "FINALS",
      "COMPLETED"
    ].includes(
      t.status
    )
  );

  assert.ok(
    t.promotion.length>0
  );

  assert.ok(
    t.relegation.length>0
  );
});

test("Nations League completes finals automatically",()=>{
  const s=state2026();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    55,
    59,
    92,
    96,
    125,
    129,
    160,
    164
  ]){
    s.day=day;

    NT.progressNationsLeagueBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>
        x.type===
        "UEFA_NATIONS_LEAGUE"
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

test("Nations League summary exposes divisions and movement",()=>{
  const s=state2026();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    55,
    59,
    92,
    96,
    125,
    129,
    160,
    164
  ]){
    s.day=day;

    NT.progressNationsLeagueBackground(
      s,
      n,
      R
    );
  }

  const summary=
    NT.nationsLeagueSummary(s);

  assert.ok(summary);

  assert.deepEqual(
    Object.keys(
      summary.leagues
    ),
    ["A","B","C","D"]
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
