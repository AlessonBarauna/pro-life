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

test("AFCON UI consumes summary",()=>{
  assert.ok(
    app.includes(
      "afconSummary?.(state)"
    )
  );
});

test("AFCON can be selected in hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="AFCON"'
    )
  );

  assert.ok(
    app.includes(
      "afconHtml"
    )
  );
});

test("AFCON UI exposes six groups",()=>{
  assert.ok(
    app.includes(
      "data-afcon-groups-track"
    )
  );

  assert.ok(
    app.includes(
      "afcon.groups"
    )
  );
});

test("AFCON UI exposes best third qualifiers",()=>{
  assert.ok(
    app.includes(
      "afconBestThirdIds"
    )
  );

  assert.ok(
    app.includes(
      "4 melhores terceiros avançam"
    )
  );
});

test("AFCON UI exposes knockout",()=>{
  assert.ok(
    app.includes(
      "ROUND_OF_16"
    )
  );

  assert.ok(
    app.includes(
      "THIRD_PLACE"
    )
  );
});

test("AFCON UI exposes podium",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA AFCON"
    )
  );

  assert.ok(
    app.includes(
      "afcon.runnerUp"
    )
  );

  assert.ok(
    app.includes(
      "afcon.thirdPlace"
    )
  );
});

test("AFCON FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 AFCON DETAIL"
    )
  );
});
