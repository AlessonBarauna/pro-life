const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const src=
  fs.readFileSync(
    "src/ui/app.js",
    "utf8"
  );

test("World Cup UI consumes all national squads",()=>{
  assert.ok(
    src.includes(
      "worldCup?.worldCupSquads?.length"
    ) ||
    src.includes(
      "worldCup?.worldCupSquads"
    )
  );

  assert.ok(
    src.includes(
      "wcSquadTeams"
    )
  );

  assert.ok(
    src.includes(
      "wcSelectedTeam"
    )
  );
});

test("World Cup teams can be selected in FC26 squad hub",()=>{
  assert.ok(
    src.includes(
      "data-wc-squad-team"
    )
  );

  assert.ok(
    src.includes(
      "worldCupSquadTeamId"
    )
  );

  assert.ok(
    src.includes(
      "fc26-team-browser"
    )
  );

  assert.ok(
    src.includes(
      "fc26-team-list"
    )
  );
});

test("World Cup squad table exposes requested columns",()=>{
  for(const label of [
    "<th>Jogador</th>",
    "<th>Clube</th>",
    "<th>GER</th>",
    "<th>Idade</th>"
  ])
    assert.ok(
      src.includes(label),
      label
    );
});

test("World Cup squad UI separates starters and bench",()=>{
  assert.ok(
    src.includes(
      "fc26-pitch"
    )
  );

  assert.ok(
    src.includes(
      "fc26-bench-panel"
    )
  );

  assert.ok(
    src.includes(
      "lineup.formation"
    )
  );
});
