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

test("Finalissima UI consumes National Team summary",()=>{
  assert.ok(
    app.includes(
      "finalissimaSummary?.(state)"
    )
  );
});

test("Finalissima can be selected in competition hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="FINALISSIMA"'
    )
  );

  assert.ok(
    app.includes(
      "finalissimaHtml"
    )
  );
});

test("Finalissima UI shows Copa America and EURO champions",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA COPA AMÉRICA"
    )
  );

  assert.ok(
    app.includes(
      "CAMPEÃO DA EURO"
    )
  );
});

test("Finalissima UI shows single match result",()=>{
  assert.ok(
    app.includes(
      "fc26-finalissima-score"
    )
  );

  assert.ok(
    app.includes(
      "Pênaltis:"
    )
  );
});

test("Finalissima UI highlights Brazil participation",()=>{
  assert.ok(
    app.includes(
      "finalissimaBrazil"
    )
  );

  assert.ok(
    app.includes(
      "BRASIL PARTICIPA"
    )
  );
});

test("Finalissima UI exposes champion and runner-up",()=>{
  assert.ok(
    app.includes(
      "CAMPEÃO DA FINALÍSSIMA"
    )
  );

  assert.ok(
    app.includes(
      "finalissima.runnerUp"
    )
  );
});

test("Finalissima FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 FINALISSIMA DETAIL"
    )
  );
});
