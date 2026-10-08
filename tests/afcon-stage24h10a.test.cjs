const test=require("node:test");
const assert=require("node:assert/strict");

const A=
  require("../src/domain/afcon.js");

function finishGroups(t){
  for(
    const group
    of t.groups
  ){
    for(
      const match
      of group.matches
    ){
      const home=
        group.teams.find(
          team=>
            team.id===
            match.homeId
        );

      const away=
        group.teams.find(
          team=>
            team.id===
            match.awayId
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

      A.recordGroupResult(
        t,
        match.id,
        hg,
        ag
      );
    }
  }
}

test("AFCON creates 24 unique teams",()=>{
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

test("AFCON has six groups of four",()=>{
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

test("AFCON picks four best third-place teams",()=>{
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

test("AFCON qualifies sixteen teams",()=>{
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
      x=>
        x.phase===
        "ROUND_OF_16"
    ).length,
    8
  );
});

test("AFCON has 52 matches including third-place game",()=>{
  assert.equal(
    A.totalMatches(),
    52
  );
});

test("AFCON produces champion runner-up and third place",()=>{
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
    const phase=
      t.status;

    const matches=
      t.knockout.filter(
        x=>
          x.phase===phase &&
          !x.played
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

    if(t.status==="FINAL"){
      const third=
        t.knockout.find(
          x=>
            x.phase===
              "THIRD_PLACE" &&
            !x.played
        );

      const final=
        t.knockout.find(
          x=>
            x.phase===
              "FINAL" &&
            !x.played
        );

      if(final)
        A.recordKnockoutResult(
          t,
          final.id,
          2,
          0
        );

      if(third)
        A.recordKnockoutResult(
          t,
          third.id,
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

  assert.ok(
    t.thirdPlace?.id
  );
});

test("AFCON resolves knockout draw with penalties",()=>{
  const t=
    A.createTournament(
      2027
    );

  finishGroups(t);
  A.buildRoundOf16(t);

  const match=
    t.knockout.find(
      x=>
        x.phase===
        "ROUND_OF_16"
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
