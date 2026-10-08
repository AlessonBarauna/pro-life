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

test("Gold Cup UI consumes summary",()=>{
  assert.ok(
    app.includes(
      "goldCupSummary?.(state)"
    )
  );
});

test("Gold Cup can be selected in hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="GOLD_CUP"'
    )
  );

  assert.ok(
    app.includes(
      "goldCupHtml"
    )
  );
});

test("Gold Cup UI exposes four groups",()=>{
  assert.ok(
    app.includes(
      "data-goldcup-groups-track"
    )
  );

  assert.ok(
    app.includes(
      "goldCup.groups"
    )
  );
});

test("Gold Cup UI exposes qualified eight",()=>{
  assert.ok(
    app.includes(
      "goldCup.qualified8"
    )
  );

  assert.ok(
    app.includes(
      "Classificados às quartas"
    )
  );
});

test("Gold Cup UI exposes knockout",()=>{
  assert.ok(
    app.includes(
      "QUARTERFINAL"
    )
  );

  assert.ok(
    app.includes(
      "SEMIFINAL"
    )
  );

  assert.ok(
    app.includes(
      "FINAL"
    )
  );
});

test("Gold Cup UI exposes champion and runner-up",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA GOLD CUP"
    )
  );

  assert.ok(
    app.includes(
      "goldCup.runnerUp"
    )
  );
});

test("Gold Cup FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 GOLD CUP DETAIL"
    )
  );
});
