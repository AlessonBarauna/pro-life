const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const D=
  require("../src/domain/engine.js");

function make(){
  return D.create(
    {
      mode:"player",
      clubId:"c0"
    },
    2420
  );
}

test("Brazil World Cup squad supports 26 players",()=>{
  const s=make();

  const squad=
    D.NationalTeam.buildSquad(
      s,
      D
    );

  assert.equal(
    squad.length,
    26
  );
});

test("Brazil lineup has 11 starters and up to 15 reserves",()=>{
  const s=make();

  const lineup=
    D.NationalTeam.matchLineup(
      s,
      D
    );

  assert.equal(
    lineup.starters.length,
    11
  );

  assert.ok(
    lineup.bench.length<=15
  );

  assert.ok(
    lineup.starters.length+
    lineup.bench.length<=26
  );

  assert.equal(
    lineup.formation,
    "4-3-3"
  );
});

test("World Cup summary exposes Brazil squad and lineup",()=>{
  const s=make();

  const summary=
    D.NationalTeam.worldCupSummary(s);

  assert.ok(summary);
  assert.ok(summary.brazilLineup);
  assert.ok(Array.isArray(summary.brazilSquad));

  assert.equal(
    summary.brazilLineup.starters.length,
    11
  );

  assert.equal(
    summary.brazilSquad.length,
    26
  );
});

test("World Cup UI renders Brazil squad detail",()=>{
  const source=
    fs.readFileSync(
      "src/ui/app.js",
      "utf8"
    );

  for(const text of [
    "Escalacao e elenco",
    "Time titular",
    "Banco",
    "wcBrazilSquadHtml"
  ])
    assert.ok(
      source.includes(text),
      text
    );
});
