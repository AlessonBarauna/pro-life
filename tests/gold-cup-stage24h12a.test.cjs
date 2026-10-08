const test=require("node:test");
const assert=require("node:assert/strict");

const G=
  require("../src/domain/gold-cup.js");

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

      const hg=
        home.reputation>=
        away.reputation
          ? 2
          : 0;

      const ag=
        home.reputation>=
        away.reputation
          ? 0
          : 2;

      G.recordGroupResult(
        t,
        match.id,
        hg,
        ag
      );
    }
  }
}

test("Gold Cup creates 16 unique teams",()=>{
  const t=
    G.createTournament(
      2027
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

test("Gold Cup has four groups of four",()=>{
  const t=
    G.createTournament(
      2027
    );

  assert.equal(
    t.groups.length,
    4
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

test("Gold Cup qualifies top two from each group",()=>{
  const t=
    G.createTournament(
      2027
    );

  finishGroups(t);

  G.buildQuarterfinals(t);

  assert.equal(
    t.qualified8.length,
    8
  );

  assert.equal(
    t.knockout.filter(
      x=>
        x.phase===
        "QUARTERFINAL"
    ).length,
    4
  );
});

test("Gold Cup uses official-style quarterfinal bracket",()=>{
  const t=
    G.createTournament(
      2027
    );

  finishGroups(t);

  const A=
    G.standings(t,"A");

  const B=
    G.standings(t,"B");

  const C=
    G.standings(t,"C");

  const D=
    G.standings(t,"D");

  G.buildQuarterfinals(t);

  const qf=
    t.knockout.filter(
      x=>x.phase==="QUARTERFINAL"
    );

  assert.equal(
    qf[0].homeId,
    D[0].id
  );

  assert.equal(
    qf[0].awayId,
    A[1].id
  );

  assert.equal(
    qf[1].homeId,
    A[0].id
  );

  assert.equal(
    qf[1].awayId,
    D[1].id
  );

  assert.equal(
    qf[2].homeId,
    C[0].id
  );

  assert.equal(
    qf[2].awayId,
    B[1].id
  );

  assert.equal(
    qf[3].homeId,
    B[0].id
  );

  assert.equal(
    qf[3].awayId,
    C[1].id
  );
});

test("Gold Cup has 31 matches",()=>{
  assert.equal(
    G.totalMatches(),
    31
  );
});

test("Gold Cup produces champion and runner-up",()=>{
  const t=
    G.createTournament(
      2027
    );

  finishGroups(t);
  G.buildQuarterfinals(t);

  let safety=0;

  while(
    t.status!=="COMPLETED" &&
    safety++<10
  ){
    const phase=t.status;

    const matches=
      t.knockout.filter(
        m=>
          m.phase===phase &&
          !m.played
      );

    assert.ok(
      matches.length>0
    );

    for(const match of matches){
      G.recordKnockoutResult(
        t,
        match.id,
        1,
        0
      );
    }
  }

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

test("Gold Cup resolves knockout draw with penalties",()=>{
  const t=
    G.createTournament(
      2027
    );

  finishGroups(t);
  G.buildQuarterfinals(t);

  const match=
    t.knockout.find(
      x=>
        x.phase===
        "QUARTERFINAL"
    );

  G.recordKnockoutResult(
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
