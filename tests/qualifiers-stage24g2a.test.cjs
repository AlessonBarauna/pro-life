const test=require("node:test");
const assert=require("node:assert/strict");

const NT=
  require("../src/domain/national-team.js");

function state(day=365){
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

test("CONMEBOL qualifiers have ten teams",()=>{
  const s=state();
  const n=NT.init(s);

  NT.ensureQualifiers(s,n,rng);

  assert.equal(
    n.qualifiers.table.length,
    10
  );
});

test("CONMEBOL qualifiers contain 18 rounds and 90 matches",()=>{
  const s=state();
  const n=NT.init(s);

  NT.ensureQualifiers(s,n,rng);

  assert.equal(
    n.qualifiers.rounds,
    18
  );

  assert.equal(
    n.qualifiers.fixtures.length,
    90
  );

  assert.equal(
    new Set(
      n.qualifiers.fixtures.map(
        x=>x.round
      )
    ).size,
    18
  );
});

test("every CONMEBOL team has 18 qualifier matches",()=>{
  const s=state();
  const n=NT.init(s);

  NT.ensureQualifiers(s,n,rng);

  for(const team of n.qualifiers.table){
    const count=
      n.qualifiers.fixtures.filter(
        m=>
          m.homeId===team.id ||
          m.awayId===team.id
      ).length;

    assert.equal(
      count,
      18,
      team.name
    );
  }
});

test("qualifier table progresses instead of resetting every year",()=>{
  const s=state(
    (2028-2026)*365+330
  );

  const n=NT.init(s);

  NT.ensureQualifiers(s,n,rng);

  const playedBefore=
    n.qualifiers.fixtures.filter(
      m=>m.played
    ).length;

  assert.ok(playedBefore>0);

  const same=n.qualifiers;

  s.day=
    (2029-2026)*365+100;

  NT.ensureQualifiers(s,n,rng);

  assert.equal(
    n.qualifiers,
    same
  );

  assert.ok(
    n.qualifiers.fixtures.filter(
      m=>m.played
    ).length>=playedBefore
  );
});

test("top six qualify and seventh enters playoff after round 18",()=>{
  const s=state(
    (2029-2026)*365+300
  );

  const n=NT.init(s);

  NT.ensureQualifiers(s,n,rng);

  assert.equal(
    n.qualifiers.complete,
    true
  );

  assert.equal(
    n.qualifiers.qualified.length,
    6
  );

  assert.ok(
    n.qualifiers.playoff
  );

  assert.equal(
    n.qualifiers.qualified.includes(
      n.qualifiers.playoff
    ),
    false
  );
});
