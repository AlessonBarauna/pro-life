const test=require("node:test");
const assert=require("node:assert/strict");

const Squads=
  require("../src/domain/world-cup-squads-2026.js");

const WC=
  require("../src/domain/world-cup.js");

const NT=
  require("../src/domain/national-team.js");

const Engine=
  require("../src/domain/engine.js");

test("2026 database has 48 teams and 1248 players",()=>{
  assert.equal(Squads.totalTeams,48);
  assert.equal(Squads.totalPlayers,1248);
});

test("all teams contain 26 complete players",()=>{

  for(const team of Squads.teams){

    const players=
      Squads.squad(team.id);

    assert.equal(
      players.length,
      26,
      team.name
    );

    for(const p of players){
      assert.ok(p.name);
      assert.ok(p.club);

      assert.ok(
        Number.isFinite(p.overall)
      );

      assert.ok(
        Number.isFinite(p.age)
      );
    }
  }
});

test("all teams expose 11 starters and 15 bench players",()=>{

  for(const team of Squads.teams){

    const lineup=
      Squads.lineup(team.id);

    assert.equal(
      lineup.starters.length,
      11,
      team.name
    );

    assert.equal(
      lineup.bench.length,
      15,
      team.name
    );
  }
});

test("World Cup uses official 2026 teams",()=>{

  const cup=
    WC.createTournament(2026);

  assert.equal(
    cup.participants.length,
    48
  );

  const ids=
    new Set(
      cup.participants.map(
        t=>t.id
      )
    );

  for(const id of [
    "CZE",
    "BIH",
    "HAI",
    "CUW",
    "TUN",
    "CPV",
    "IRQ",
    "JOR",
    "COD",
    "UZB",
    "PAN"
  ])
    assert.ok(
      ids.has(id),
      id
    );
});

test("World Cup summary exposes all squads",()=>{

  const s=
    Engine.create(
      {
        mode:"player",
        clubId:"c0"
      },
      2420
    );

  const summary=
    NT.worldCupSummary(s);

  assert.equal(
    summary.worldCupSquads.length,
    48
  );

  for(
    const team of
    summary.worldCupSquads
  ){
    assert.equal(
      team.squad.length,
      26,
      team.name
    );

    assert.equal(
      team.lineup.starters.length,
      11,
      team.name
    );

    assert.equal(
      team.lineup.bench.length,
      15,
      team.name
    );
  }
});
