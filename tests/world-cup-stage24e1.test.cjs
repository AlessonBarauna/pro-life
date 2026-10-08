const test=require("node:test");
const assert=require("node:assert/strict");

const WC=require("../src/domain/world-cup.js");

function deterministic(){
  return {
    next(){
      return .5;
    }
  };
}

test("World Cup has 48 national teams",()=>{
  assert.equal(
    WC.teams.length,
    48
  );

  assert.equal(
    new Set(WC.teams.map(t=>t.id)).size,
    48
  );
});

test("World Cup creates 12 groups of four",()=>{
  const cup=WC.createTournament(2026);

  assert.equal(
    cup.groups.length,
    12
  );

  for(const group of cup.groups){
    assert.equal(
      group.teams.length,
      4
    );

    assert.equal(
      group.matches.length,
      6
    );
  }
});

test("Brazil is present in exactly one group",()=>{
  const cup=WC.createTournament(2026);

  const groups=cup.groups.filter(
    g=>g.teams.some(
      t=>t.id==="BRA"
    )
  );

  assert.equal(
    groups.length,
    1
  );
});

test("group result updates standings",()=>{
  const cup=WC.createTournament(2026);
  const group=cup.groups[0];
  const match=group.matches[0];

  WC.recordGroupResult(
    cup,
    match.id,
    2,
    0
  );

  const table=WC.standings(
    cup,
    group.name
  );

  const winner=table.find(
    x=>x.id===match.homeId
  );

  assert.equal(
    winner.points,
    3
  );

  assert.equal(
    winner.gf,
    2
  );

  assert.equal(
    winner.ga,
    0
  );
});

test("group stage contains 72 matches",()=>{
  const cup=WC.createTournament(2026);

  const total=cup.groups.reduce(
    (sum,g)=>sum+g.matches.length,
    0
  );

  assert.equal(
    total,
    72
  );
});

test("32 teams qualify after group stage",()=>{
  const cup=WC.createTournament(2026);

  WC.simulateGroupStage(
    cup,
    deterministic()
  );

  assert.equal(
    cup.qualified32.length,
    32
  );

  assert.equal(
    cup.status,
    "ROUND_OF_32"
  );
});

test("qualification contains 24 direct and 8 third-place teams",()=>{
  const cup=WC.createTournament(2026);

  WC.simulateGroupStage(
    cup,
    deterministic()
  );

  const direct=cup.qualified32.filter(
    x=>x.groupPosition<=2
  );

  const thirds=cup.qualified32.filter(
    x=>x.groupPosition===3
  );

  assert.equal(
    direct.length,
    24
  );

  assert.equal(
    thirds.length,
    8
  );
});
