const test=require("node:test");
const assert=require("node:assert/strict");

const E=
  require("../src/domain/euro.js");

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

      E.recordGroupResult(
        t,
        match.id,
        hg,
        ag
      );
    }
  }
}

test("EURO creates 24 unique teams",()=>{
  const t=
    E.createTournament(
      2028
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

test("EURO has six groups of four",()=>{
  const t=
    E.createTournament(
      2028
    );

  assert.equal(
    t.groups.length,
    6
  );

  for(const group of t.groups){
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

test("EURO picks four best third-place teams",()=>{
  const t=
    E.createTournament(
      2028
    );

  finishGroups(t);

  const thirds=
    E.bestThirds(t);

  assert.equal(
    thirds.length,
    4
  );
});

test("EURO qualifies sixteen teams to knockout",()=>{
  const t=
    E.createTournament(
      2028
    );

  finishGroups(t);

  E.buildRoundOf16(t);

  assert.equal(
    t.qualified16.length,
    16
  );

  assert.equal(
    t.knockout.filter(
      x=>
        x.phase===
        "ROUND_OF_16"
    ).length,
    8
  );
});

test("EURO has 51 matches",()=>{
  assert.equal(
    E.totalMatches(),
    51
  );
});

test("EURO knockout produces champion and runner-up",()=>{
  const t=
    E.createTournament(
      2028
    );

  finishGroups(t);
  E.buildRoundOf16(t);

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
      E.recordKnockoutResult(
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

test("EURO penalty shootout resolves draw",()=>{
  const t=
    E.createTournament(
      2028
    );

  finishGroups(t);
  E.buildRoundOf16(t);

  const match=
    t.knockout.find(
      x=>
        x.phase===
        "ROUND_OF_16"
    );

  E.recordKnockoutResult(
    t,
    match.id,
    1,
    1,
    5,
    4
  );

  assert.equal(
    match.played,
    true
  );

  assert.equal(
    match.winnerId,
    match.homeId
  );
});
