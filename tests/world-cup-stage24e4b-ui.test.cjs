const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const source=
  fs.readFileSync(
    "src/ui/app.js",
    "utf8"
  );

test("national UI consumes World Cup summary",()=>{
  assert.match(
    source,
    /worldCupSummary\?\.\(state\)/
  );
});

test("national competitions renders World Cup panel",()=>{
  assert.match(
    source,
    /national-world-cup/
  );

  assert.match(
    source,
    /COPA MUNDIAL/
  );
});

test("World Cup UI renders Brazil group table",()=>{
  assert.match(
    source,
    /wcTableHtml/
  );

  assert.match(
    source,
    /Grupo do Brasil/
  );
});

test("World Cup UI renders campaign and knockout",()=>{
  assert.match(
    source,
    /Campanha do Brasil/
  );

  assert.match(
    source,
    /wcKnockoutHtml/
  );

  assert.match(
    source,
    /mata-mata/i
  );
});

test("World Cup UI remains inside national competitions",()=>{
  const start=
    source.indexOf(
      '<section id="national-competitions"'
    );

  const end=
    source.indexOf(
      '<section id="national-stats"',
      start
    );

  assert.ok(start>=0);
  assert.ok(end>start);

  const block=
    source.slice(
      start,
      end
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
    source,
    /nationalCompetitionId==="WORLD_CUP"/
  );

  assert.match(
    source,
    /worldCupHtml/
  );
});
