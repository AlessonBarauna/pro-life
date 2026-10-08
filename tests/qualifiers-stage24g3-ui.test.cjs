const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const source=
  fs.readFileSync(
    "src/ui/app.js",
    "utf8"
  );

test("qualifiers UI shows World Cup cycle",()=>{
  assert.match(
    source,
    /Rumo a Copa Mundial/
  );

  assert.match(
    source,
    /qualifierWorldCupYear/
  );
});

test("qualifiers UI shows 18-round progress",()=>{
  assert.match(
    source,
    /qualifierRound/
  );

  assert.match(
    source,
    /qData\.rounds/
  );

  assert.match(
    source,
    /Jogos disputados/
  );
});

test("qualifiers UI exposes direct and playoff zones",()=>{
  assert.match(
    source,
    /Classificacao direta/
  );

  assert.match(
    source,
    /Repescagem/
  );

  assert.match(
    source,
    /Fora da zona/
  );
});

test("qualifiers UI uses positions one to six and seventh",()=>{
  assert.match(
    source,
    /position<=6/
  );

  assert.match(
    source,
    /position===7/
  );
});

test("Brazil row remains highlighted",()=>{
  assert.match(
    source,
    /x\.id==="BRA"/
  );

  assert.match(
    source,
    /hero-row/
  );
});

test("qualifiers remain inside national competitions screen",()=>{
  const fs=require("fs");

  const app=
    fs.readFileSync(
      "src/ui/app.js",
      "utf8"
    );

  const section=
    app.indexOf(
      'id="national-competitions"'
    );

  assert.ok(
    section>=0,
    "secao national-competitions ausente"
  );

  const block=
    app.slice(
      section,
      section+1200
    );

  assert.match(
    block,
    /\$\{internationalCompetitionsHubHtml\}/
  );

  assert.match(
    block,
    /\$\{nationalCompetitionDetailsHtml\}/
  );

  assert.match(
    app,
    /nationalCompetitionId==="WORLD_CUP_QUALIFIERS"/
  );

  assert.match(
    app,
    /Eliminatórias da Copa Mundial|Eliminatorias da Copa Mundial/
  );
});
