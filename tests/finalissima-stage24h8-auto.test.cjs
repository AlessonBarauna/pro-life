const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeCopaAmerica=
  require("../src/domain/copa-america.js");

global.ProLifeEuro=
  require("../src/domain/euro.js");

global.ProLifeFinalissima=
  require("../src/domain/finalissima.js");

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

function state(year){
  return {
    day:(year-2026)*365,
    season:year-2025,
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

function completedContinentalPair(
  s,
  copaChampion,
  euroChampion
){
  const n=NT.init(s);

  n.tournaments.push({
    type:"COPA_AMERICA",
    year:2028,
    status:"COMPLETED",
    champion:{
      ...copaChampion
    }
  });

  n.tournaments.push({
    type:"EURO",
    year:2028,
    status:"COMPLETED",
    champion:{
      ...euroChampion
    }
  });

  return n;
}

test("2029 creates Finalissima from 2028 champions",()=>{
  const s=state(2029);

  const n=
    completedContinentalPair(
      s,
      {
        id:"ARG",
        name:"Argentina",
        reputation:93
      },
      {
        id:"ESP",
        name:"Espanha",
        reputation:94
      }
    );

  const t=
    NT.ensureFinalissima(
      s,
      n
    );

  assert.ok(t);

  assert.equal(
    t.year,
    2029
  );

  assert.equal(
    t.match.homeId,
    "ARG"
  );

  assert.equal(
    t.match.awayId,
    "ESP"
  );
});

test("Finalissima waits until both continental champions exist",()=>{
  const s=state(2029);
  const n=NT.init(s);

  n.tournaments.push({
    type:"COPA_AMERICA",
    year:2028,
    status:"COMPLETED",
    champion:{
      id:"ARG",
      name:"Argentina",
      reputation:93
    }
  });

  assert.equal(
    NT.ensureFinalissima(
      s,
      n
    ),
    null
  );
});

test("Brazil champion gets Finalissima fixture in national schedule",()=>{
  const s=state(2029);

  const n=
    completedContinentalPair(
      s,
      {
        id:"BRA",
        name:"Brasil",
        reputation:92
      },
      {
        id:"ESP",
        name:"Espanha",
        reputation:94
      }
    );

  NT.ensureFinalissima(
    s,
    n
  );

  const fixture=
    NT.ensureFinalissimaSchedule(
      s,
      n
    );

  assert.ok(fixture);

  assert.equal(
    fixture.opponent,
    "Espanha"
  );

  assert.equal(
    fixture.tournamentType,
    "FINALISSIMA"
  );
});

test("Finalissima without Brazil simulates automatically",()=>{
  const s=state(2029);

  const n=
    completedContinentalPair(
      s,
      {
        id:"ARG",
        name:"Argentina",
        reputation:93
      },
      {
        id:"ESP",
        name:"Espanha",
        reputation:94
      }
    );

  NT.ensureFinalissima(
    s,
    n
  );

  s.day=
    3*365+
    82;

  NT.progressFinalissimaBackground(
    s,
    n,
    rng()
  );

  const t=
    n.tournaments.find(
      x=>
        x.type===
        "FINALISSIMA"
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

test("Finalissima summary exposes champion",()=>{
  const s=state(2029);

  const n=
    completedContinentalPair(
      s,
      {
        id:"ARG",
        name:"Argentina",
        reputation:93
      },
      {
        id:"ESP",
        name:"Espanha",
        reputation:94
      }
    );

  NT.ensureFinalissima(
    s,
    n
  );

  s.day=
    3*365+
    82;

  NT.progressFinalissimaBackground(
    s,
    n,
    rng()
  );

  const summary=
    NT.finalissimaSummary(s);

  assert.ok(summary);

  assert.equal(
    summary.status,
    "COMPLETED"
  );

  assert.ok(
    summary.champion?.id
  );
});
