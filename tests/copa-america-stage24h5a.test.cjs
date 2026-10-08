const test=require("node:test");
const assert=require("node:assert/strict");
const CA=require("../src/domain/copa-america.js");

function finishGroups(t){
  for(const g of t.groups){
    for(const m of g.matches){
      const home=
        g.teams.find(
          x=>x.id===m.homeId
        );

      const away=
        g.teams.find(
          x=>x.id===m.awayId
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

      CA.recordGroupResult(
        t,
        m.id,
        hg,
        ag
      );
    }
  }
}

test("Copa America creates 16 unique teams",()=>{
  const t=
    CA.createTournament(
      2028
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

  assert.ok(
    t.participants.some(
      x=>x.id==="BRA"
    )
  );
});

test("Copa America has four groups of four",()=>{
  const t=
    CA.createTournament(
      2028
    );

  assert.equal(
    t.groups.length,
    4
  );

  for(const g of t.groups){
    assert.equal(
      g.teams.length,
      4
    );

    assert.equal(
      g.matches.length,
      6
    );
  }
});

test("Brazil belongs to one group",()=>{
  const t=
    CA.createTournament(
      2028
    );

  const g=
    CA.brazilGroup(t);

  assert.ok(g);
  assert.ok(
    ["A","B","C","D"]
      .includes(
        g.name
      )
  );
});

test("top two from each group reach quarterfinals",()=>{
  const t=
    CA.createTournament(
      2028
    );

  finishGroups(t);

  CA.buildQuarterfinals(t);

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

test("full Copa America has 32 matches",()=>{
  assert.equal(
    CA.totalMatches(),
    32
  );
});

test("knockout produces champion runner-up and third place",()=>{
  const t=
    CA.createTournament(
      2028
    );

  finishGroups(t);
  CA.buildQuarterfinals(t);

  while(
    t.status!=="COMPLETED"
  ){
    const playable=
      t.knockout.filter(
        m=>!m.played
      );

    assert.ok(
      playable.length>0
    );

    for(const m of playable){
      if(m.phase==="FINAL" ||
         m.phase==="THIRD_PLACE" ||
         m.phase===t.status){
        CA.recordKnockoutResult(
          t,
          m.id,
          1,
          0
        );
      }
    }
  }

  assert.ok(
    t.champion?.id
  );

  assert.ok(
    t.runnerUp?.id
  );

  assert.ok(
    t.thirdPlace?.id
  );

  assert.notEqual(
    t.champion.id,
    t.runnerUp.id
  );
});

test("2028 participant selection is deterministic",()=>{
  const a=
    CA.createTournament(
      2028
    );

  const b=
    CA.createTournament(
      2028
    );

  assert.deepEqual(
    a.participants.map(
      x=>x.id
    ),
    b.participants.map(
      x=>x.id
    )
  );
});
