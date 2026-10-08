const test=require("node:test");
const assert=require("node:assert/strict");

const A=
  require("../src/domain/fifa-arab-cup.js");

function finishGroups(t){
  for(const group of t.groups){
    for(const match of group.matches){
      const home=
        group.teams.find(
          x=>x.id===match.homeId
        );

      const away=
        group.teams.find(
          x=>x.id===match.awayId
        );

      const homeWins=
        home.reputation>=
        away.reputation;

      A.recordGroupResult(
        t,
        match.id,
        homeWins ? 2 : 0,
        homeWins ? 0 : 2
      );
    }
  }
}

test("FIFA Arab Cup creates sixteen unique teams",()=>{
  const t=
    A.createTournament(
      2029
    );

  assert.equal(
    t.participants.length,
    16
  );

  assert.equal(
    new Set(
      t.participants.map(
        x=>x.id
      )
    ).size,
    16
  );
});

test("FIFA Arab Cup has four groups of four",()=>{
  const t=
    A.createTournament(
      2029
    );

  assert.equal(
    t.groups.length,
    4
  );

  assert.ok(
    t.groups.every(
      g=>g.teams.length===4
    )
  );

  assert.ok(
    t.groups.every(
      g=>g.matches.length===6
    )
  );
});

test("FIFA Arab Cup qualifies eight teams",()=>{
  const t=
    A.createTournament(
      2029
    );

  finishGroups(t);

  A.buildQuarterfinals(t);

  assert.equal(
    t.qualified8.length,
    8
  );

  assert.equal(
    t.knockout.filter(
      x=>x.phase==="QUARTERFINAL"
    ).length,
    4
  );
});

test("FIFA Arab Cup has thirty two matches",()=>{
  assert.equal(
    A.totalMatches(),
    32
  );
});

test("FIFA Arab Cup produces champion vice and third",()=>{
  const t=
    A.createTournament(
      2029
    );

  finishGroups(t);
  A.buildQuarterfinals(t);

  for(
    const match of
    t.knockout.filter(
      x=>x.phase==="QUARTERFINAL"
    )
  ){
    A.recordKnockoutResult(
      t,
      match.id,
      2,
      0
    );
  }

  for(
    const match of
    t.knockout.filter(
      x=>x.phase==="SEMIFINAL"
    )
  ){
    A.recordKnockoutResult(
      t,
      match.id,
      1,
      0
    );
  }

  const final=
    t.knockout.find(
      x=>x.phase==="FINAL"
    );

  const third=
    t.knockout.find(
      x=>x.phase==="THIRD_PLACE"
    );

  A.recordKnockoutResult(
    t,
    final.id,
    2,
    0
  );

  A.recordKnockoutResult(
    t,
    third.id,
    1,
    0
  );

  assert.equal(
    t.status,
    "COMPLETED"
  );

  assert.ok(t.champion?.id);
  assert.ok(t.runnerUp?.id);
  assert.ok(t.thirdPlace?.id);
});

test("FIFA Arab Cup resolves knockout draw on penalties",()=>{
  const t=
    A.createTournament(
      2029
    );

  finishGroups(t);
  A.buildQuarterfinals(t);

  const match=
    t.knockout.find(
      x=>x.phase==="QUARTERFINAL"
    );

  A.recordKnockoutResult(
    t,
    match.id,
    1,
    1,
    5,
    4
  );

  assert.equal(
    match.winnerId,
    match.homeId
  );
});
