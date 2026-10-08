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

test("OFC Nations Cup UI consumes summary",()=>{
  assert.ok(
    app.includes(
      "ofcNationsCupSummary?.(state)"
    )
  );
});

test("OFC Nations Cup can be selected in hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="OFC_NATIONS_CUP"'
    )
  );

  assert.ok(
    app.includes(
      "ofcNationsCupHtml"
    )
  );
});

test("OFC Nations Cup UI exposes two groups",()=>{
  assert.ok(
    app.includes(
      "data-ofc-groups-track"
    )
  );

  assert.ok(
    app.includes(
      "ofcNationsCup.groups"
    )
  );
});

test("OFC Nations Cup UI exposes qualified four",()=>{
  assert.ok(
    app.includes(
      "ofcNationsCup.qualified4"
    )
  );

  assert.ok(
    app.includes(
      "Semifinalistas"
    )
  );
});

test("OFC Nations Cup UI exposes semifinals and final",()=>{
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

test("OFC Nations Cup UI exposes champion and runner-up",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA OFC NATIONS CUP"
    )
  );

  assert.ok(
    app.includes(
      "ofcNationsCup.runnerUp"
    )
  );
});

test("OFC Nations Cup FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 OFC NATIONS CUP DETAIL"
    )
  );
});
