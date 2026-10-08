const test=require("node:test");
const assert=require("node:assert/strict");

const A=
  require("../src/domain/asian-cup.js");

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
        home.reputation>=away.reputation
          ? 2
          : 0;

      const ag=
        home.reputation>=away.reputation
          ? 0
          : 2;

      A.recordGroupResult(
        t,
        match.id,
        hg,
        ag
      );
    }
  }
}

test("Asian Cup creates 24 unique teams",()=>{
  const t=
    A.createTournament(
      2027
    );

  assert.equal(
    t.participants.length,
    24
  );

  assert.equal(
    new Set(
      t.participants.map(
        x=>x.id
      )
    ).size,
    24
  );
});

test("Asian Cup has six groups of four",()=>{
  const t=
    A.createTournament(
      2027
    );

  assert.equal(
    t.groups.length,
    6
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

test("Asian Cup picks four best third-place teams",()=>{
  const t=
    A.createTournament(
      2027
    );

  finishGroups(t);

  assert.equal(
    A.bestThirds(t).length,
    4
  );
});

test("Asian Cup qualifies sixteen teams",()=>{
  const t=
    A.createTournament(
      2027
    );

  finishGroups(t);

  A.buildRoundOf16(t);

  assert.equal(
    t.qualified16.length,
    16
  );

  assert.equal(
    t.knockout.filter(
      x=>x.phase==="ROUND_OF_16"
    ).length,
    8
  );
});

test("Asian Cup has 51 matches",()=>{
  assert.equal(
    A.totalMatches(),
    51
  );
});

test("Asian Cup produces champion and runner-up",()=>{
  const t=
    A.createTournament(
      2027
    );

  finishGroups(t);
  A.buildRoundOf16(t);

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
      A.recordKnockoutResult(
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

test("Asian Cup resolves knockout draw with penalties",()=>{
  const t=
    A.createTournament(
      2027
    );

  finishGroups(t);
  A.buildRoundOf16(t);

  const match=
    t.knockout.find(
      x=>x.phase==="ROUND_OF_16"
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
