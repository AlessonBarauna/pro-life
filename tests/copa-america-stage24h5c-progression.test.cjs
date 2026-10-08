const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeCopaAmerica=
  require("../src/domain/copa-america.js");

const NT=
  require("../src/domain/national-team.js");

function rng(){
  let seed=123456789;

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

    matches:[],

    calendarDays:[],

    competitionSchedule:{
      cup:{
        rounds:[]
      }
    }
  };
}

test("Brazil Copa America result updates tournament table",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  const fixture=n.schedule.find(
    x=>
      x.tournamentType===
      "COPA_AMERICA"
  );

  assert.ok(fixture);

  fixture.played=true;
  fixture.brazil=2;
  fixture.other=0;

  assert.equal(
    NT.recordCopaAmericaFixture(
      s,
      n,
      fixture,
      2,
      0,
      R
    ),
    true
  );

  const summary=
    NT.copaAmericaSummary(s);

  const brazil=
    summary.groupTable.find(
      x=>x.id==="BRA"
    );

  assert.equal(
    brazil.played,
    1
  );

  assert.equal(
    brazil.points,
    3
  );
});

test("background simulation completes each group round",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  s.day=
    2*365+168;

  const fixture=n.schedule.find(
    x=>
      x.tournamentType===
      "COPA_AMERICA"
  );

  fixture.played=true;

  NT.recordCopaAmericaFixture(
    s,
    n,
    fixture,
    1,
    0,
    R
  );

  const tournament=
    n.tournaments.find(
      x=>
        x.type===
        "COPA_AMERICA"
    );

  const round1=
    tournament.groups
      .flatMap(
        g=>g.matches
      )
      .filter(
        m=>m.round===1
      );

  assert.ok(
    round1.every(
      m=>m.played
    )
  );
});

test("group stage creates quarterfinals and Brazil fixture when qualified",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  const fixtures=n.schedule
    .filter(
      x=>
        x.tournamentType===
          "COPA_AMERICA" &&
        x.tournamentPhase===
          "group"
    )
    .sort(
      (a,b)=>a.day-b.day
    );

  for(
    let i=0;
    i<fixtures.length;
    i++
  ){
    s.day=fixtures[i].day;

    fixtures[i].played=true;

    NT.recordCopaAmericaFixture(
      s,
      n,
      fixtures[i],
      3,
      0,
      R
    );
  }

  const tournament=
    n.tournaments.find(
      x=>
        x.type===
        "COPA_AMERICA"
    );

  assert.equal(
    tournament.status,
    "QUARTERFINAL"
  );

  assert.equal(
    tournament.knockout.filter(
      x=>x.phase==="QUARTERFINAL"
    ).length,
    4
  );

  const qf=
    n.schedule.find(
      x=>
        x.tournamentType===
          "COPA_AMERICA" &&
        x.tournamentPhase===
          "quarterfinal"
    );

  assert.ok(qf);
});

test("Copa America can progress through knockout automatically",()=>{
  const s=state2028();
  const n=NT.init(s);
  const R=rng();

  const groupFixtures=
    n.schedule
      .filter(
        x=>
          x.tournamentType===
            "COPA_AMERICA" &&
          x.tournamentPhase===
            "group"
      )
      .sort(
        (a,b)=>a.day-b.day
      );

  for(const fixture of groupFixtures){
    s.day=fixture.day;
    fixture.played=true;

    NT.recordCopaAmericaFixture(
      s,
      n,
      fixture,
      3,
      0,
      R
    );
  }

  let safety=0;

  while(
    safety++<10
  ){
    const fixture=
      n.schedule.find(
        x=>
          x.tournamentType===
            "COPA_AMERICA" &&
          !x.played &&
          x.tournamentPhase!=="group"
      );

    if(!fixture)
      break;

    s.day=fixture.day;

    fixture.played=true;

    NT.recordCopaAmericaFixture(
      s,
      n,
      fixture,
      2,
      0,
      R
    );
  }

  const tournament=
    n.tournaments.find(
      x=>
        x.type===
        "COPA_AMERICA"
    );

  if(
    tournament.status!=="COMPLETED"
  ){
    s.day=
      2*365+
      205;

    NT.progressCopaAmericaBackground(
      s,
      n,
      R
    );
  }

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

  assert.ok(
    tournament.thirdPlace?.id
  );
});
