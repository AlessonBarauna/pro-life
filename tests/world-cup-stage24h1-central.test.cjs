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
    2401
  );
}

test("World Cup summary exposes all 12 groups",()=>{
  const s=make();

  const summary=
    D.NationalTeam.worldCupSummary(s);

  assert.ok(summary);
  assert.equal(
    summary.allGroups.length,
    12
  );

  assert.equal(
    summary.allGroups.reduce(
      (sum,g)=>sum+g.table.length,
      0
    ),
    48
  );
});

test("World Cup summary exposes all 48 teams",()=>{
  const s=make();

  const summary=
    D.NationalTeam.worldCupSummary(s);

  assert.equal(
    summary.participants.length,
    48
  );

  assert.equal(
    new Set(
      summary.participants.map(
        x=>x.id
      )
    ).size,
    48
  );
});

test("World Cup historical ranking starts from real pre-2026 titles",()=>{
  const s=make();

  const summary=
    D.NationalTeam.worldCupSummary(s);

  const brazil=
    summary.titleRanking.find(
      x=>x.id==="BRA"
    );

  const germany=
    summary.titleRanking.find(
      x=>x.id==="GER"
    );

  const argentina=
    summary.titleRanking.find(
      x=>x.id==="ARG"
    );

  assert.equal(brazil.titles,5);
  assert.equal(germany.titles,4);
  assert.equal(argentina.titles,3);
});

test("World Cup summary exposes tournament statistics",()=>{
  const s=make();

  const summary=
    D.NationalTeam.worldCupSummary(s);

  assert.equal(
    summary.tournamentStats.teams,
    48
  );

  assert.equal(
    summary.tournamentStats.groups,
    12
  );

  assert.equal(
    summary.tournamentStats.totalMatches,
    104
  );
});

test("World Cup UI renders complete competition sections",()=>{
  const source=
    fs.readFileSync(
      "src/ui/app.js",
      "utf8"
    );

  for(const text of [
    "Todos os grupos",
    "Todas as selecoes e estatisticas",
    "Chave completa do mata-mata",
    "Ranking historico de campeoes",
    "Caminho do Brasil no mata-mata"
  ])
    assert.ok(
      source.includes(text),
      text
    );
});
