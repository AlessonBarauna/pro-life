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

test("EURO UI consumes National Team summary",()=>{
  assert.ok(
    app.includes(
      "euroSummary?.(state)"
    )
  );
});

test("EURO can be selected in competition hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="EURO"'
    )
  );

  assert.ok(
    app.includes(
      "euroHtml"
    )
  );
});

test("EURO UI exposes all six groups",()=>{
  assert.ok(
    app.includes(
      "data-euro-groups-track"
    )
  );

  assert.ok(
    app.includes(
      "Todos os grupos"
    )
  );
});

test("EURO UI highlights best third-place qualifiers",()=>{
  assert.ok(
    app.includes(
      "euroQualifiedThirdIds"
    )
  );

  assert.ok(
    app.includes(
      "wc-row-best-third"
    )
  );

  assert.ok(
    app.includes(
      "4 melhores terceiros avançam"
    )
  );
});

test("EURO UI exposes knockout",()=>{
  assert.ok(
    app.includes(
      "ROUND_OF_16"
    )
  );

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

test("EURO UI exposes champion and runner-up",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA EURO"
    )
  );

  assert.ok(
    app.includes(
      "euro.runnerUp"
    )
  );
});

test("EURO FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 EURO DETAIL"
    )
  );
});
