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

test("FIFA Series UI consumes summary",()=>{
  assert.ok(
    app.includes(
      "fifaSeriesSummary?.(state)"
    )
  );
});

test("FIFA Series can be selected in hub",()=>{
  assert.ok(
    app.includes(
      'nationalCompetitionId==="FIFA_SERIES"'
    )
  );

  assert.ok(
    app.includes(
      "fifaSeriesHtml"
    )
  );
});

test("FIFA Series UI has venue selector",()=>{
  assert.ok(
    app.includes(
      "data-fifa-series-venue"
    )
  );

  assert.ok(
    app.includes(
      'fifaSeriesVenueId="AUSTRALIA"'
    )
  );
});

test("FIFA Series UI exposes participants",()=>{
  assert.ok(
    app.includes(
      "fifaSeriesSelected.participants"
    )
  );

  assert.ok(
    app.includes(
      "confederation"
    )
  );
});

test("FIFA Series UI supports knockout and fixture formats",()=>{
  assert.ok(
    app.includes(
      'fifaSeriesSelected.format==="KNOCKOUT"'
    )
  );

  assert.ok(
    app.includes(
      'fifaSeriesSelected?.format==="FIXTURES"'
    )
  );
});

test("FIFA Series UI exposes local standings",()=>{
  assert.ok(
    app.includes(
      "Classificação da sede"
    )
  );

  assert.ok(
    app.includes(
      "fifaSeriesSelected.table"
    )
  );
});

test("FIFA Series UI exposes local matches",()=>{
  assert.ok(
    app.includes(
      "fifaSeriesSelected.matches"
    )
  );

  assert.ok(
    app.includes(
      "PLACEMENT"
    )
  );
});

test("FIFA Series UI exposes local victor",()=>{
  assert.ok(
    app.includes(
      "VENCEDOR DA SÉRIE"
    )
  );

  assert.ok(
    app.includes(
      "fifaSeriesSelected.victor"
    )
  );
});

test("FIFA Series UI states there is no global champion",()=>{
  assert.ok(
    app.includes(
      "não existe campeão geral"
    )
  );

  assert.ok(
    app.includes(
      "Cada série possui seu próprio vencedor"
    )
  );
});

test("FIFA Series FC26 CSS exists",()=>{
  assert.ok(
    css.includes(
      "FC26 FIFA SERIES DETAIL"
    )
  );
});
