const test=require("node:test");
const assert=require("node:assert/strict");

const F=
  require("../src/domain/finalissima.js");

const BRA={
  id:"BRA",
  name:"Brasil",
  reputation:92
};

const ESP={
  id:"ESP",
  name:"Espanha",
  reputation:94
};

test("Finalissima creates Copa America champion vs EURO champion",()=>{
  const t=
    F.createTournament(
      2029,
      BRA,
      ESP
    );

  assert.equal(
    t.type,
    "FINALISSIMA"
  );

  assert.equal(
    t.participants.length,
    2
  );

  assert.equal(
    t.participants[0].source,
    "COPA_AMERICA"
  );

  assert.equal(
    t.participants[1].source,
    "EURO"
  );
});

test("Finalissima is a single match",()=>{
  const t=
    F.createTournament(
      2029,
      BRA,
      ESP
    );

  assert.equal(
    t.match.homeId,
    "BRA"
  );

  assert.equal(
    t.match.awayId,
    "ESP"
  );

  assert.equal(
    t.match.phase,
    "FINAL"
  );
});

test("regular-time result produces champion and runner-up",()=>{
  const t=
    F.createTournament(
      2029,
      BRA,
      ESP
    );

  F.recordResult(
    t,
    2,
    1
  );

  assert.equal(
    t.status,
    "COMPLETED"
  );

  assert.equal(
    t.champion.id,
    "BRA"
  );

  assert.equal(
    t.runnerUp.id,
    "ESP"
  );
});

test("draw requires penalty winner",()=>{
  const t=
    F.createTournament(
      2029,
      BRA,
      ESP
    );

  assert.throws(
    ()=>
      F.recordResult(
        t,
        1,
        1,
        4,
        4
      )
  );
});

test("penalty result decides Finalissima",()=>{
  const t=
    F.createTournament(
      2029,
      BRA,
      ESP
    );

  F.recordResult(
    t,
    1,
    1,
    5,
    4
  );

  assert.equal(
    t.champion.id,
    "BRA"
  );

  assert.equal(
    t.match.hp,
    5
  );

  assert.equal(
    t.match.ap,
    4
  );
});

test("same national team cannot face itself",()=>{
  assert.throws(
    ()=>
      F.createTournament(
        2029,
        BRA,
        BRA
      )
  );
});

test("summary exposes full Finalissima result",()=>{
  const t=
    F.createTournament(
      2029,
      BRA,
      ESP
    );

  F.recordResult(
    t,
    3,
    2
  );

  const s=
    F.summary(t);

  assert.equal(
    s.champion.name,
    "Brasil"
  );

  assert.equal(
    s.runnerUp.name,
    "Espanha"
  );

  assert.equal(
    s.match.played,
    true
  );
});
