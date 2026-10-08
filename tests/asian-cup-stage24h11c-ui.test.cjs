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

test("Asian Cup UI consumes summary",()=>{
  assert.ok(
    app.includes(
      "asianCupSummary?.(state)"
    )
  );
});

test("Asian Cup can be selected in hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="ASIAN_CUP"'
    )
  );

  assert.ok(
    app.includes(
      "asianCupHtml"
    )
  );
});

test("Asian Cup UI exposes six groups",()=>{
  assert.ok(
    app.includes(
      "data-asian-groups-track"
    )
  );

  assert.ok(
    app.includes(
      "asianCup.groups"
    )
  );
});

test("Asian Cup UI exposes best third qualifiers",()=>{
  assert.ok(
    app.includes(
      "asianCupBestThirdIds"
    )
  );

  assert.ok(
    app.includes(
      "4 melhores terceiros avançam"
    )
  );
});

test("Asian Cup UI exposes knockout",()=>{
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

test("Asian Cup UI exposes champion and runner-up",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA ASIAN CUP"
    )
  );

  assert.ok(
    app.includes(
      "asianCup.runnerUp"
    )
  );
});

test("Asian Cup FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 ASIAN CUP DETAIL"
    )
  );
});
