const test=require("node:test");
const assert=require("node:assert/strict");

const F=
  require("../src/domain/fifa-series.js");

test("FIFA Series creates nine men's series",()=>{
  const t=
    F.createTournament(
      2026
    );

  assert.equal(
    t.series.length,
    9
  );

  assert.equal(
    F.totalSeries(),
    9
  );
});

test("FIFA Series uses thirty six unique men's teams",()=>{
  const t=
    F.createTournament(
      2026
    );

  const ids=
    t.series.flatMap(
      s=>
        s.participants.map(
          x=>x.id
        )
    );

  assert.equal(
    ids.length,
    36
  );

  assert.equal(
    new Set(ids).size,
    36
  );

  assert.equal(
    F.totalTeams(),
    36
  );
});

test("every FIFA Series event has four teams",()=>{
  const t=
    F.createTournament(
      2026
    );

  assert.ok(
    t.series.every(
      s=>
        s.participants.length===4
    )
  );
});

test("FIFA Series supports multiple event formats",()=>{
  const t=
    F.createTournament(
      2026
    );

  assert.ok(
    t.series.some(
      s=>s.format==="KNOCKOUT"
    )
  );

  assert.ok(
    t.series.some(
      s=>s.format==="FIXTURES"
    )
  );
});

test("knockout series produces local victor",()=>{
  const t=
    F.createTournament(
      2026
    );

  const s=
    t.series.find(
      x=>x.format==="KNOCKOUT"
    );

  for(
    const match of
    s.matches.filter(
      x=>x.phase==="SEMIFINAL"
    )
  ){
    F.recordFixtureResult(
      t,
      s.id,
      match.id,
      2,
      0
    );
  }

  const final=
    s.matches.find(
      x=>x.phase==="FINAL"
    );

  const placement=
    s.matches.find(
      x=>x.phase==="PLACEMENT"
    );

  F.recordFixtureResult(
    t,
    s.id,
    final.id,
    1,
    0
  );

  F.recordFixtureResult(
    t,
    s.id,
    placement.id,
    1,
    0
  );

  assert.equal(
    s.status,
    "COMPLETED"
  );

  assert.ok(
    s.victor?.id
  );

  assert.ok(
    s.runnerUp?.id
  );
});

test("fixture series produces local victor by table",()=>{
  const t=
    F.createTournament(
      2026
    );

  const s=
    t.series.find(
      x=>x.format==="FIXTURES"
    );

  for(const match of s.matches){
    F.recordFixtureResult(
      t,
      s.id,
      match.id,
      2,
      0
    );
  }

  assert.equal(
    s.status,
    "COMPLETED"
  );

  assert.ok(
    s.victor?.id
  );

  assert.equal(
    F.standings(s).length,
    4
  );
});

test("FIFA Series has no single global champion",()=>{
  const t=
    F.createTournament(
      2026
    );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      t,
      "champion"
    ),
    false
  );
});

test("FIFA Series knockout draw is decided on penalties",()=>{
  const t=
    F.createTournament(
      2026
    );

  const s=
    t.series.find(
      x=>x.format==="KNOCKOUT"
    );

  const match=
    s.matches.find(
      x=>x.phase==="SEMIFINAL"
    );

  F.recordFixtureResult(
    t,
    s.id,
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
