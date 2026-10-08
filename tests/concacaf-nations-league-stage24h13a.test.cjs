const test=require("node:test");
const assert=require("node:assert/strict");

const N=
  require("../src/domain/concacaf-nations-league.js");

function finishGroups(t){
  for(
    const league of
    Object.values(t.leagues)
  ){
    for(const group of league.groups){
      for(const match of group.matches){
        const all=[
          ...t.leagues.A.seeded,
          ...Object.values(t.leagues)
            .flatMap(
              l=>
                l.groups.flatMap(
                  g=>g.teams
                )
            )
        ];

        const home=
          all.find(
            x=>x.id===match.homeId
          );

        const away=
          all.find(
            x=>x.id===match.awayId
          );

        N.recordLeagueResult(
          t,
          match.id,
          home.reputation>=away.reputation
            ? 2
            : 0,
          home.reputation>=away.reputation
            ? 0
            : 2
        );
      }
    }
  }
}

test("Concacaf Nations League creates A B C divisions",()=>{
  const t=
    N.createTournament(
      2026
    );

  assert.deepEqual(
    Object.keys(
      t.leagues
    ),
    ["A","B","C"]
  );
});

test("League A has four seeded teams and two groups of six",()=>{
  const t=
    N.createTournament(
      2026
    );

  assert.equal(
    t.leagues.A.seeded.length,
    4
  );

  assert.equal(
    t.leagues.A.groups.length,
    2
  );

  assert.ok(
    t.leagues.A.groups.every(
      g=>g.teams.length===6
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

test("League C has three groups of three",()=>{
  const t=
    N.createTournament(
      2026
    );

  assert.equal(
    t.leagues.C.groups.length,
    3
  );

  assert.ok(
    t.leagues.C.groups.every(
      g=>g.teams.length===3
    )
  );
});

test("promotion and relegation are calculated",()=>{
  const t=
    N.createTournament(
      2026
    );

  finishGroups(t);

  const movement=
    N.calculateMovement(t);

  assert.ok(
    movement.promotion.some(
      x=>
        x.from==="B" &&
        x.to==="A"
    )
  );

  assert.ok(
    movement.promotion.some(
      x=>
        x.from==="C" &&
        x.to==="B"
    )
  );

  assert.ok(
    movement.relegation.some(
      x=>
        x.from==="A" &&
        x.to==="B"
    )
  );

  assert.ok(
    movement.relegation.some(
      x=>
        x.from==="B" &&
        x.to==="C"
    )
  );
});

test("League A creates four quarterfinals",()=>{
  const t=
    N.createTournament(
      2026
    );

  finishGroups(t);

  N.calculateMovement(t);
  N.buildQuarterfinals(t);

  assert.equal(
    t.quarterfinals.length,
    4
  );

  assert.equal(
    t.status,
    "QUARTERFINAL"
  );
});

test("Concacaf Nations League produces champion vice and third",()=>{
  const t=
    N.createTournament(
      2026
    );

  finishGroups(t);

  N.calculateMovement(t);
  N.buildQuarterfinals(t);

  for(const match of t.quarterfinals){
    N.recordQuarterfinalResult(
      t,
      match.id,
      2,
      0
    );
  }

  for(
    const match of
    t.finals.filter(
      x=>x.phase==="SEMIFINAL"
    )
  ){
    N.recordFinalResult(
      t,
      match.id,
      1,
      0
    );
  }

  const final=
    t.finals.find(
      x=>x.phase==="FINAL"
    );

  const third=
    t.finals.find(
      x=>x.phase==="THIRD_PLACE"
    );

  N.recordFinalResult(
    t,
    final.id,
    2,
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

  assert.ok(t.champion?.id);
  assert.ok(t.runnerUp?.id);
  assert.ok(t.thirdPlace?.id);
});
