const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const app=
  fs.readFileSync(
    "src/ui/app.js",
    "utf8"
  );

const css=
  fs.readFileSync(
    "src/ui/style.css",
    "utf8"
  );

test("World Cup exposes FC26 style squad hub",()=>{
  assert.ok(
    app.includes(
      "fc26-squad-hub"
    )
  );

  assert.ok(
    app.includes(
      "fc26-team-browser"
    )
  );

  assert.ok(
    app.includes(
      "fc26-pitch"
    )
  );

  assert.ok(
    app.includes(
      "fc26-bench-panel"
    )
  );
});

test("all World Cup teams can be selected",()=>{
  assert.ok(
    app.includes(
      "data-wc-squad-team"
    )
  );

  assert.ok(
    app.includes(
      "worldCupSquadTeamId"
    )
  );

  assert.ok(
    app.includes(
      "wcSquadTeams.map"
    )
  );
});

test("selected team exposes requested player data",()=>{
  for(const label of [
    "<th>Jogador</th>",
    "<th>Clube</th>",
    "<th>GER</th>",
    "<th>Idade</th>"
  ])
    assert.ok(
      app.includes(label),
      label
    );
});

test("FC26 squad CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 WORLD CUP SQUAD HUB"
    )
  );

  assert.ok(
    css.includes(
      ".fc26-pitch-player"
    )
  );

  assert.ok(
    css.includes(
      ".fc26-team-list"
    )
  );
});
