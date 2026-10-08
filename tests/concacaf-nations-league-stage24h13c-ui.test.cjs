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

test("Concacaf Nations League UI consumes summary",()=>{
  assert.ok(
    app.includes(
      "concacafNationsLeagueSummary?.(state)"
    )
  );
});

test("Concacaf Nations League can be selected in hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="CONCACAF_NATIONS_LEAGUE"'
    )
  );

  assert.ok(
    app.includes(
      "concacafNationsLeagueHtml"
    )
  );
});

test("Concacaf Nations League UI has A B C selector",()=>{
  assert.ok(
    app.includes(
      "data-concacaf-nations-division"
    )
  );

  assert.ok(
    app.includes(
      'concacafNationsLeagueDivision="A"'
    )
  );
});

test("Concacaf Nations League UI exposes seeded League A teams",()=>{
  assert.ok(
    app.includes(
      "CABEÇAS DE CHAVE · ENTRAM NAS QUARTAS"
    )
  );

  assert.ok(
    app.includes(
      "concacafLeague.seeded"
    )
  );
});

test("Concacaf Nations League UI exposes groups",()=>{
  assert.ok(
    app.includes(
      "data-concacaf-nations-groups-track"
    )
  );

  assert.ok(
    app.includes(
      "concacafLeague.groups"
    )
  );
});

test("Concacaf Nations League UI exposes promotion and relegation",()=>{
  assert.ok(
    app.includes(
      "Acesso e rebaixamento"
    )
  );

  assert.ok(
    app.includes(
      "concacafNationsLeague.promotion"
    )
  );

  assert.ok(
    app.includes(
      "concacafNationsLeague.relegation"
    )
  );
});

test("Concacaf Nations League UI exposes quarterfinals",()=>{
  assert.ok(
    app.includes(
      "concacafNationsLeague.quarterfinals"
    )
  );

  assert.ok(
    app.includes(
      "Quartas de final"
    )
  );
});

test("Concacaf Nations League UI exposes Final Four",()=>{
  assert.ok(
    app.includes(
      "Final Four"
    )
  );

  assert.ok(
    app.includes(
      "THIRD_PLACE"
    )
  );
});

test("Concacaf Nations League UI exposes podium",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA CONCACAF NATIONS LEAGUE"
    )
  );

  assert.ok(
    app.includes(
      "concacafNationsLeague.runnerUp"
    )
  );

  assert.ok(
    app.includes(
      "concacafNationsLeague.thirdPlace"
    )
  );
});

test("Concacaf Nations League FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 CONCACAF NATIONS LEAGUE DETAIL"
    )
  );
});
