const test=require("node:test");
const assert=require("node:assert/strict");

const Q=
  require("../src/domain/world-qualifiers.js");

const conmebol={
  complete:true,
  qualified:[
    "BRA",
    "ARG",
    "URU",
    "COL",
    "ECU",
    "PAR"
  ],
  playoff:"VEN"
};

const rng={
  next:()=>0.5
};

test("world qualification pool is larger than World Cup field",()=>{
  assert.ok(
    Q.teams.length>48
  );

  assert.equal(
    new Set(
      Q.teams.map(x=>x.id)
    ).size,
    Q.teams.length
  );
});

test("allocation has 46 direct World Cup places",()=>{
  const total=
    Object.values(
      Q.allocation
    ).reduce(
      (sum,x)=>sum+x.direct,
      0
    );

  assert.equal(
    total,
    46
  );
});

test("qualification creates six playoff candidates and two winners",()=>{
  const result=
    Q.qualify(
      2030,
      conmebol,
      rng
    );

  assert.equal(
    result.playoffCandidates.length,
    6
  );

  assert.equal(
    result.playoffWinners.length,
    2
  );
});

test("qualification produces 48 unique World Cup teams",()=>{
  const result=
    Q.qualify(
      2030,
      conmebol,
      rng
    );

  assert.equal(
    result.participants.length,
    48
  );

  assert.equal(
    new Set(
      result.participants.map(
        x=>x.id
      )
    ).size,
    48
  );
});

test("CONMEBOL top six qualify directly",()=>{
  const result=
    Q.qualify(
      2030,
      conmebol,
      rng
    );

  for(const id of conmebol.qualified){
    const team=
      result.participants.find(
        x=>x.id===id
      );

    assert.ok(team);

    assert.equal(
      team.qualificationSource,
      "CONMEBOL_DIRECT"
    );
  }
});

test("CONMEBOL seventh enters playoff instead of direct field",()=>{
  const result=
    Q.qualify(
      2030,
      conmebol,
      rng
    );

  assert.ok(
    result.playoffCandidates.some(
      x=>x.id==="VEN"
    )
  );

  assert.equal(
    result.direct.some(
      x=>x.id==="VEN"
    ),
    false
  );
});
