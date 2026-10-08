const test=require("node:test");
const assert=require("node:assert/strict");

const N=
  require("../src/domain/uefa-nations-league.js");

function finishLeaguePhase(t){
  for(
    const league of
    Object.values(
      t.leagues
    )
  ){
    for(const group of league.groups){
      for(const match of group.matches){
        const home=
          N.teams.find(
            x=>x.id===match.homeId
          );

        const away=
          N.teams.find(
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

        N.recordLeagueResult(
          t,
          match.id,
          hg,
          ag
        );
      }
    }
  }
}

test("Nations League creates four divisions",()=>{
  const t=
    N.createTournament(
      2026
    );

  assert.deepEqual(
    Object.keys(
      t.leagues
    ),
    ["A","B","C","D"]
  );
});

test("League A has four groups of four",()=>{
  const t=
    N.createTournament(
      2026
    );

  assert.equal(
    t.leagues.A.groups.length,
    4
  );

  assert.ok(
    t.leagues.A.groups.every(
      g=>g.teams.length===4
    )
  );
});

test("League B has four groups of four",()=>{
  const t=
    N.createTournament(
      2026
    );

  assert.equal(
    t.leagues.B.groups.length,
    4
  );

  assert.ok(
    t.leagues.B.groups.every(
      g=>g.teams.length===4
    )
  );
});

test("League C has four groups of four",()=>{
  const t=
    N.createTournament(
      2026
    );

  assert.equal(
    t.leagues.C.groups.length,
    4
  );

  assert.ok(
    t.leagues.C.groups.every(
      g=>g.teams.length===4
    )
  );
});

test("Nations League calculates promotion and relegation",()=>{
  const t=
    N.createTournament(
      2026
    );

  finishLeaguePhase(t);

  const movement=
    N.calculateMovement(t);

  assert.ok(
    movement.promotion.length>0
  );

  assert.ok(
    movement.relegation.length>0
  );

  assert.ok(
    movement.promotion.some(
      x=>
        x.from==="B" &&
        x.to==="A"
    )
  );

  assert.ok(
    movement.relegation.some(
      x=>
        x.from==="A" &&
        x.to==="B"
    )
  );
});

test("four League A winners reach finals",()=>{
  const t=
    N.createTournament(
      2026
    );

  finishLeaguePhase(t);

  N.calculateMovement(t);
  N.createFinals(t);

  const semifinals=
    t.finals.filter(
      x=>
        x.phase===
        "SEMIFINAL"
    );

  assert.equal(
    semifinals.length,
    2
  );

  assert.equal(
    t.status,
    "SEMIFINAL"
  );
});

test("Nations League produces champion runner-up and third place",()=>{
  const t=
    N.createTournament(
      2026
    );

  finishLeaguePhase(t);

  N.calculateMovement(t);
  N.createFinals(t);

  for(
    const match of
    t.finals.filter(
      x=>
        x.phase===
        "SEMIFINAL"
    )
  ){
    N.recordFinalResult(
      t,
      match.id,
      2,
      0
    );
  }

  const final=
    t.finals.find(
      x=>x.phase==="FINAL"
    );

  const third=
    t.finals.find(
      x=>
        x.phase===
        "THIRD_PLACE"
    );

  assert.ok(final);
  assert.ok(third);

  N.recordFinalResult(
    t,
    final.id,
    1,
    0
  );

  N.recordFinalResult(
    t,
    third.id,
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

  assert.ok(
    t.thirdPlace?.id
  );
});

test("Nations League resolves knockout draw on penalties",()=>{
  const t=
    N.createTournament(
      2026
    );

  finishLeaguePhase(t);

  N.createFinals(t);

  const semifinal=
    t.finals.find(
      x=>
        x.phase===
        "SEMIFINAL"
    );

  N.recordFinalResult(
    t,
    semifinal.id,
    1,
    1,
    5,
    4
  );

  assert.equal(
    semifinal.winnerId,
    semifinal.homeId
  );
});
