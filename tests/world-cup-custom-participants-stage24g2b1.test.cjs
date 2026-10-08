const test=require("node:test");
const assert=require("node:assert/strict");

const WC=
  require("../src/domain/world-cup.js");

test("default World Cup still has 48 teams",()=>{
  const cup=WC.createTournament(2026);

  assert.equal(
    cup.participants.length,
    48
  );

  assert.equal(
    cup.groups.length,
    12
  );
});

test("World Cup accepts 48 external qualified teams",()=>{
  const participants=
    Array.from(
      {length:48},
      (_,i)=>({
        id:
          "T"+
          String(i+1).padStart(2,"0"),
        name:"Team "+(i+1),
        reputation:70+(i%20)
      })
    );

  const cup=
    WC.createTournament(
      2030,
      participants
    );

  assert.equal(
    cup.participants.length,
    48
  );

  assert.equal(
    cup.groups.length,
    12
  );

  assert.equal(
    cup.groups.reduce(
      (sum,g)=>sum+g.teams.length,
      0
    ),
    48
  );
});

test("custom participants can complete full tournament",()=>{
  const participants=
    Array.from(
      {length:48},
      (_,i)=>({
        id:
          "X"+
          String(i+1).padStart(2,"0"),
        name:"Nation "+(i+1),
        reputation:60+(i%30)
      })
    );

  const cup=
    WC.createTournament(
      2030,
      participants
    );

  const rng={
    next:()=>0.47
  };

  WC.simulateTournament(
    cup,
    rng
  );

  assert.equal(
    cup.status,
    "COMPLETED"
  );

  assert.ok(
    cup.champion
  );
});

test("World Cup rejects invalid participant count",()=>{
  assert.throws(
    ()=>
      WC.createTournament(
        2030,
        WC.teams.slice(0,47)
      )
  );
});
