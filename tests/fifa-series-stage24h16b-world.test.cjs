const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeFifaSeries=
  require("../src/domain/fifa-series.js");

global.ProLifeFifaArabCup=
  require("../src/domain/fifa-arab-cup.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=852741963;

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

test("2026 creates FIFA Series",()=>{
  const s=state2026();
  const n=NT.init(s);

  const t=
    NT.ensureFifaSeries(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.type,
    "FIFA_SERIES"
  );

  assert.equal(
    t.year,
    2026
  );

  assert.equal(
    t.series.length,
    9
  );
});

test("2027 does not create FIFA Series",()=>{
  const s=state2026();

  s.day=365;

  const n=NT.init(s);

  assert.equal(
    NT.ensureFifaSeries(
      s,
      n
    ),
    null
  );
});

test("first March block progresses every series",()=>{
  const s=state2026();
  const n=NT.init(s);
  const R=rng();

  s.day=78;

  NT.progressFifaSeriesBackground(
    s,
    n,
    R
  );

  const t=
    n.tournaments.find(
      x=>x.type==="FIFA_SERIES"
    );

  assert.ok(t);

  for(const series of t.series){
    const played=
      series.matches.filter(
        m=>m.played
      ).length;

    assert.equal(
      played,
      2
    );
  }
});

test("second March block completes all FIFA Series events",()=>{
  const s=state2026();
  const n=NT.init(s);
  const R=rng();

  for(const day of [
    78,
    82
  ]){
    s.day=day;

    NT.progressFifaSeriesBackground(
      s,
      n,
      R
    );
  }

  const t=
    n.tournaments.find(
      x=>x.type==="FIFA_SERIES"
    );

  assert.equal(
    t.status,
    "COMPLETED"
  );

  assert.equal(
    t.completedSeries,
    9
  );

  assert.ok(
    t.series.every(
      series=>
        series.status==="COMPLETED"
    )
  );

  assert.ok(
    t.series.every(
      series=>series.victor?.id
    )
  );
});

test("FIFA Series preserves one victor per event and no global champion",()=>{
  const s=state2026();
  const n=NT.init(s);
  const R=rng();

  s.day=82;

  NT.progressFifaSeriesBackground(
    s,
    n,
    R
  );

  const t=
    n.tournaments.find(
      x=>x.type==="FIFA_SERIES"
    );

  assert.equal(
    t.status,
    "COMPLETED"
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      t,
      "champion"
    ),
    false
  );

  assert.equal(
    t.series.filter(
      series=>series.victor?.id
    ).length,
    9
  );
});

test("FIFA Series summary exposes all events",()=>{
  const s=state2026();
  const n=NT.init(s);
  const R=rng();

  s.day=82;

  NT.progressFifaSeriesBackground(
    s,
    n,
    R
  );

  const summary=
    NT.fifaSeriesSummary(s);

  assert.ok(summary);

  assert.equal(
    summary.year,
    2026
  );

  assert.equal(
    summary.status,
    "COMPLETED"
  );

  assert.equal(
    summary.series.length,
    9
  );

  assert.equal(
    summary.completedSeries,
    9
  );

  assert.equal(
    summary.totalSeries,
    9
  );

  assert.equal(
    summary.totalTeams,
    36
  );

  assert.equal(
    summary.totalMatches,
    36
  );

  assert.equal(
    summary.hasGlobalChampion,
    false
  );
});

test("2030 creates a new FIFA Series edition",()=>{
  const s=state2026();

  s.day=
    4*365;

  const n=NT.init(s);

  const t=
    NT.ensureFifaSeries(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.year,
    2030
  );
});
