const test=require("node:test");
const assert=require("node:assert/strict");

const O=
  require("../src/domain/ofc-nations-cup.js");

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

      O.recordGroupResult(
        t,
        match.id,
        homeWins ? 2 : 0,
        homeWins ? 0 : 2
      );
    }
  }
}

test("OFC Nations Cup creates eight unique teams",()=>{
  const t=
    O.createTournament(
      2028
    );

  assert.equal(
    t.participants.length,
    8
  );

  assert.equal(
    new Set(
      t.participants.map(
        x=>x.id
      )
    ).size,
    8
  );
});

test("OFC Nations Cup has two groups of four",()=>{
  const t=
    O.createTournament(
      2028
    );

  assert.equal(
    t.groups.length,
    2
  );

  assert.ok(
    t.groups.every(
      group=>
        group.teams.length===4
    )
  );

  assert.ok(
    t.groups.every(
      group=>
        group.matches.length===6
    )
  );
});

test("OFC Nations Cup qualifies four semifinalists",()=>{
  const t=
    O.createTournament(
      2028
    );

  finishGroups(t);

  O.buildSemifinals(t);

  assert.equal(
    t.qualified4.length,
    4
  );

  assert.equal(
    t.knockout.filter(
      x=>x.phase==="SEMIFINAL"
    ).length,
    2
  );
});

test("OFC Nations Cup uses cross-group semifinals",()=>{
  const t=
    O.createTournament(
      2028
    );

  finishGroups(t);

  const A=
    O.standings(
      t,
      "A"
    );

  const B=
    O.standings(
      t,
      "B"
    );

  O.buildSemifinals(t);

  const sf=
    t.knockout.filter(
      x=>x.phase==="SEMIFINAL"
    );

  assert.equal(
    sf[0].homeId,
    A[0].id
  );

  assert.equal(
    sf[0].awayId,
    B[1].id
  );

  assert.equal(
    sf[1].homeId,
    B[0].id
  );

  assert.equal(
    sf[1].awayId,
    A[1].id
  );
});

test("OFC Nations Cup has fifteen matches",()=>{
  assert.equal(
    O.totalMatches(),
    15
  );
});

test("OFC Nations Cup produces champion and runner-up",()=>{
  const t=
    O.createTournament(
      2028
    );

  finishGroups(t);

  O.buildSemifinals(t);

  const semifinals=
    t.knockout.filter(
      x=>x.phase==="SEMIFINAL"
    );

  for(const match of semifinals){
    O.recordKnockoutResult(
      t,
      match.id,
      2,
      0
    );
  }

  assert.equal(
    t.status,
    "FINAL"
  );

  const final=
    t.knockout.find(
      x=>x.phase==="FINAL"
    );

  O.recordKnockoutResult(
    t,
    final.id,
    1,
    0
  );

  assert.equal(
    t.status,
    "COMPLETED"
  );

  assert.ok(
    t.champion?.id
  );

  assert.ok(
    t.runnerUp?.id
  );

  assert.notEqual(
    t.champion.id,
    t.runnerUp.id
  );
});

test("OFC Nations Cup resolves knockout draw on penalties",()=>{
  const t=
    O.createTournament(
      2028
    );

  finishGroups(t);

  O.buildSemifinals(t);

  const match=
    t.knockout.find(
      x=>x.phase==="SEMIFINAL"
    );

  O.recordKnockoutResult(
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
