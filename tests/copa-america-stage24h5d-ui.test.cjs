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

test("Copa America UI consumes National Team summary",()=>{
  assert.ok(
    app.includes(
      "copaAmericaSummary?.(state)"
    )
  );
});

test("Copa America can be selected from competition hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="COPA_AMERICA"'
    )
  );

  assert.ok(
    app.includes(
      "copaAmericaHtml"
    )
  );
});

test("Copa America UI shows Brazil group and all groups",()=>{
  assert.ok(
    app.includes(
      "Grupo do Brasil"
    )
  );

  assert.ok(
    app.includes(
      "data-ca-groups-track"
    )
  );
});

test("Copa America UI exposes campaign and knockout",()=>{
  assert.ok(
    app.includes(
      "Campanha do Brasil"
    )
  );

  assert.ok(
    app.includes(
      "copaAmericaKnockoutHtml"
    )
  );
});

test("Copa America UI exposes podium",()=>{
  assert.ok(
    app.includes(
      "fc26-ca-podium"
    )
  );

  assert.ok(
    app.includes(
      "thirdPlace"
    )
  );
});

test("Copa America FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 COPA AMERICA DETAIL"
    )
  );
});
