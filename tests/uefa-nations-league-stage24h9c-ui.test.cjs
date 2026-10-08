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

test("Nations League UI consumes summary",()=>{
  assert.ok(
    app.includes(
      "nationsLeagueSummary?.(state)"
    )
  );
});

test("Nations League can be selected in hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="UEFA_NATIONS_LEAGUE"'
    )
  );

  assert.ok(
    app.includes(
      "nationsLeagueHtml"
    )
  );
});

test("Nations League UI has division selector",()=>{
  assert.ok(
    app.includes(
      "data-nations-league-division"
    )
  );

  assert.ok(
    app.includes(
      'nationsLeagueDivision="A"'
    )
  );
});

test("Nations League UI exposes groups",()=>{
  assert.ok(
    app.includes(
      "data-nations-groups-track"
    )
  );

  assert.ok(
    app.includes(
      "nationsLeagueLeague.groups"
    )
  );
});

test("Nations League UI exposes promotion and relegation",()=>{
  assert.ok(
    app.includes(
      "Acesso e rebaixamento"
    )
  );

  assert.ok(
    app.includes(
      "nationsLeague.promotion"
    )
  );

  assert.ok(
    app.includes(
      "nationsLeague.relegation"
    )
  );
});

test("Nations League UI exposes Final Four",()=>{
  assert.ok(
    app.includes(
      "Final Four"
    )
  );

  assert.ok(
    app.includes(
      "SEMIFINAL"
    )
  );

  assert.ok(
    app.includes(
      "THIRD_PLACE"
    )
  );
});

test("Nations League UI exposes champion",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA NATIONS LEAGUE"
    )
  );

  assert.ok(
    app.includes(
      "nationsLeague.thirdPlace"
    )
  );
});

test("Nations League FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 NATIONS LEAGUE DETAIL"
    )
  );
});
