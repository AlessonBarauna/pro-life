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

test("FIFA Arab Cup UI consumes summary",()=>{
  assert.ok(
    app.includes(
      "fifaArabCupSummary?.(state)"
    )
  );
});

test("FIFA Arab Cup can be selected in hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="FIFA_ARAB_CUP"'
    )
  );

  assert.ok(
    app.includes(
      "fifaArabCupHtml"
    )
  );
});

test("FIFA Arab Cup UI exposes four groups",()=>{
  assert.ok(
    app.includes(
      "data-arab-cup-groups-track"
    )
  );

  assert.ok(
    app.includes(
      "fifaArabCup.groups"
    )
  );
});

test("FIFA Arab Cup UI exposes qualified eight",()=>{
  assert.ok(
    app.includes(
      "fifaArabCup.qualified8"
    )
  );

  assert.ok(
    app.includes(
      "Classificados às quartas"
    )
  );
});

test("FIFA Arab Cup UI exposes full knockout",()=>{
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
      "THIRD_PLACE"
    )
  );

  assert.ok(
    app.includes(
      "FINAL"
    )
  );
});

test("FIFA Arab Cup UI exposes podium",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA FIFA ARAB CUP"
    )
  );

  assert.ok(
    app.includes(
      "fifaArabCup.runnerUp"
    )
  );

  assert.ok(
    app.includes(
      "fifaArabCup.thirdPlace"
    )
  );
});

test("FIFA Arab Cup FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 FIFA ARAB CUP DETAIL"
    )
  );
});
