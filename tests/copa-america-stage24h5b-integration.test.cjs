const test=require("node:test");
const assert=require("node:assert/strict");

global.ProLifeCopaAmerica=
  require("../src/domain/copa-america.js");

const NT=
  require("../src/domain/national-team.js");

function stateForYear(year){
  return {
    day:
      (year-2026)*365,

    mode:"player",

    person:{
      name:"Teste",
      age:22,
      pos:"ATA",
      morale:75,
      nationality:"Brasil"
    },

    reputation:80,

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

test("National Team exposes Copa America integration API",()=>{
  assert.equal(
    typeof NT.copaAmericaSummary,
    "function"
  );

  assert.equal(
    typeof NT.ensureCopaAmerica,
    "function"
  );

  assert.equal(
    NT.isCopaAmericaYear(2028),
    true
  );

  assert.equal(
    NT.isCopaAmericaYear(2027),
    false
  );
});

test("2028 creates Copa America tournament in save",()=>{
  const s=
    stateForYear(2028);

  const n=
    NT.init(s);

  const tournament=
    n.tournaments.find(
      t=>
        t.type===
        "COPA_AMERICA"
    );

  assert.ok(
    tournament
  );

  assert.equal(
    tournament.year,
    2028
  );
});

test("2028 schedules three Brazil group fixtures",()=>{
  const s=
    stateForYear(2028);

  const n=
    NT.init(s);

  const matches=
    n.schedule.filter(
      x=>
        x.tournamentType===
        "COPA_AMERICA"
    );

  assert.equal(
    matches.length,
    3
  );

  assert.deepEqual(
    matches.map(
      x=>x.tournamentPhase
    ),
    [
      "group",
      "group",
      "group"
    ]
  );

  assert.ok(
    matches.every(
      x=>
        x.competition===
        "Copa America"
    )
  );
});

test("Copa America group fixtures are spaced by six days",()=>{
  const s=
    stateForYear(2028);

  const n=
    NT.init(s);

  const matches=
    n.schedule
      .filter(
        x=>
          x.tournamentType===
          "COPA_AMERICA"
      )
      .sort(
        (a,b)=>a.day-b.day
      );

  assert.equal(
    matches[1].day-
    matches[0].day,
    6
  );

  assert.equal(
    matches[2].day-
    matches[1].day,
    6
  );
});

test("Copa America summary exposes tournament and Brazil group",()=>{
  const s=
    stateForYear(2028);

  NT.init(s);

  const summary=
    NT.copaAmericaSummary(s);

  assert.ok(
    summary
  );

  assert.equal(
    summary.year,
    2028
  );

  assert.equal(
    summary.participants.length,
    16
  );

  assert.equal(
    summary.groups.length,
    4
  );

  assert.ok(
    ["A","B","C","D"]
      .includes(
        summary.group
      )
  );

  assert.equal(
    summary.groupTable.length,
    4
  );

  assert.equal(
    summary.fixtures.length,
    3
  );
});

test("2027 does not create Copa America",()=>{
  const s=
    stateForYear(2027);

  const n=
    NT.init(s);

  assert.equal(
    n.tournaments.some(
      t=>
        t.type===
        "COPA_AMERICA"
    ),
    false
  );
});
