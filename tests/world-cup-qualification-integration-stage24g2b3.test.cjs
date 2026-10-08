const test=require("node:test");
const assert=require("node:assert/strict");

const NT=
  require("../src/domain/national-team.js");

function state(day){
  return {
    day,
    mode:"player",

    person:{
      id:"hero",
      name:"Hero",
      age:20,
      pos:"ATA",
      nationality:"Brasil",
      morale:70,

      attrs:{
        pace:75,
        finish:75,
        pass:75,
        defense:55,
        strength:70,
        stamina:75
      }
    },

    clubs:[],
    calendarDays:[],
    reputation:75,
    fans:0
  };
}

const rng={
  next:()=>0.5,
  int:a=>a
};

test("2026 keeps initial fixed World Cup edition",()=>{
  const s=state(0);

  const n=NT.init(s);

  const cup=
    n.tournaments.find(
      t=>
        t.type==="WORLD_CUP" &&
        t.year===2026
    );

  assert.ok(cup);

  assert.equal(
    cup.participants.length,
    48
  );

  assert.equal(
    cup.qualificationSource,
    undefined
  );
});

test("2030 World Cup is built from career qualifiers",()=>{
  const s=state(
    (2029-2026)*365+300
  );

  const n=NT.init(s);

  NT.ensureQualifiers(
    s,
    n,
    rng
  );

  assert.equal(
    n.qualifiers.complete,
    true
  );

  const conmebolDirect=
    n.qualifiers.qualified.slice();

  s.day=
    (2030-2026)*365;

  const cup=
    NT.ensureWorldCup(
      s,
      n
    );

  assert.ok(cup);

  assert.equal(
    cup.year,
    2030
  );

  assert.equal(
    cup.qualificationSource,
    "WORLD_QUALIFIERS"
  );

  assert.equal(
    cup.participants.length,
    48
  );

  for(const id of conmebolDirect){
    assert.ok(
      cup.participants.some(
        team=>team.id===id
      ),
      id
    );
  }
});

test("2030 qualification stores confederation and playoff history",()=>{
  const s=state(
    (2029-2026)*365+300
  );

  const n=NT.init(s);

  NT.ensureQualifiers(
    s,
    n,
    rng
  );

  s.day=
    (2030-2026)*365;

  const cup=
    NT.ensureWorldCup(
      s,
      n
    );

  assert.ok(
    cup.qualification
  );

  assert.equal(
    cup.qualification.direct.length,
    46
  );

  assert.equal(
    cup.qualification.playoffCandidates.length,
    6
  );

  assert.equal(
    cup.qualification.playoffWinners.length,
    2
  );

  assert.equal(
    cup.conmebol.qualified.length,
    6
  );

  assert.ok(
    cup.conmebol.playoff
  );
});

test("fresh 2030 career state rebuilds completed qualification cycle",()=>{
  const s=state(
    (2030-2026)*365
  );

  const n=NT.init(s);

  const cup=
    n.tournaments.find(
      t=>
        t.type==="WORLD_CUP" &&
        t.year===2030
    );

  assert.ok(cup);

  assert.equal(
    n.qualifiers.worldCupYear,
    2030
  );

  assert.equal(
    n.qualifiers.complete,
    true
  );

  assert.equal(
    cup.participants.length,
    48
  );

  assert.equal(
    new Set(
      cup.participants.map(
        x=>x.id
      )
    ).size,
    48
  );
});
