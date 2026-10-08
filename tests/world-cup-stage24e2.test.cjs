const test=require("node:test");
const assert=require("node:assert/strict");

const WC=require("../src/domain/world-cup.js");

function rng(){
  return {
    value:0,
    next(){
      this.value=
        (this.value+.173)%1;

      return this.value;
    }
  };
}

function prepared(){
  const cup=
    WC.createTournament(2026);

  WC.simulateGroupStage(
    cup,
    rng()
  );

  WC.buildRoundOf32(
    cup
  );

  return cup;
}

test("round of 32 has 16 matches",()=>{
  const cup=prepared();

  assert.equal(
    WC.phaseMatches(
      cup,
      "ROUND_OF_32"
    ).length,
    16
  );
});

test("round of 32 produces 16 winners",()=>{
  const cup=prepared();

  WC.simulatePhase(
    cup,
    "ROUND_OF_32",
    rng()
  );

  const matches=
    WC.phaseMatches(
      cup,
      "ROUND_OF_32"
    );

  assert.equal(
    matches.filter(
      m=>m.winnerId
    ).length,
    16
  );
});

test("knockout progresses 16 to 8 to 4 to 2",()=>{
  const cup=prepared();
  const random=rng();

  WC.simulatePhase(
    cup,
    "ROUND_OF_32",
    random
  );

  const r16=
    WC.createNextPhase(
      cup,
      "ROUND_OF_32",
      "ROUND_OF_16"
    );

  assert.equal(r16.length,8);

  WC.simulatePhase(
    cup,
    "ROUND_OF_16",
    random
  );

  const qf=
    WC.createNextPhase(
      cup,
      "ROUND_OF_16",
      "QUARTERFINAL"
    );

  assert.equal(qf.length,4);

  WC.simulatePhase(
    cup,
    "QUARTERFINAL",
    random
  );

  const sf=
    WC.createNextPhase(
      cup,
      "QUARTERFINAL",
      "SEMIFINAL"
    );

  assert.equal(sf.length,2);
});

test("semifinals create final and third place",()=>{
  const cup=prepared();
  const random=rng();

  WC.simulatePhase(
    cup,
    "ROUND_OF_32",
    random
  );

  WC.createNextPhase(
    cup,
    "ROUND_OF_32",
    "ROUND_OF_16"
  );

  WC.simulatePhase(
    cup,
    "ROUND_OF_16",
    random
  );

  WC.createNextPhase(
    cup,
    "ROUND_OF_16",
    "QUARTERFINAL"
  );

  WC.simulatePhase(
    cup,
    "QUARTERFINAL",
    random
  );

  WC.createNextPhase(
    cup,
    "QUARTERFINAL",
    "SEMIFINAL"
  );

  WC.simulatePhase(
    cup,
    "SEMIFINAL",
    random
  );

  const finals=
    WC.createFinals(cup);

  assert.equal(
    finals.length,
    2
  );

  assert.equal(
    WC.phaseMatches(
      cup,
      "FINAL"
    ).length,
    1
  );

  assert.equal(
    WC.phaseMatches(
      cup,
      "THIRD_PLACE"
    ).length,
    1
  );
});

test("full simulation produces champion",()=>{
  const cup=
    WC.createTournament(2026);

  WC.simulateTournament(
    cup,
    rng()
  );

  assert.equal(
    cup.status,
    "COMPLETED"
  );

  assert.ok(
    cup.champion
  );

  assert.ok(
    cup.runnerUp
  );

  assert.notEqual(
    cup.champion.id,
    cup.runnerUp.id
  );
});

test("full tournament has 104 matches",()=>{
  const cup=
    WC.createTournament(2026);

  WC.simulateTournament(
    cup,
    rng()
  );

  const groupMatches=
    cup.groups.reduce(
      (sum,g)=>
        sum+g.matches.length,
      0
    );

  const knockout=
    cup.knockout.length;

  assert.equal(
    groupMatches,
    72
  );

  assert.equal(
    knockout,
    32
  );

  assert.equal(
    groupMatches+knockout,
    104
  );
});

test("knockout match cannot end tied without penalties",()=>{
  const cup=prepared();

  const match=
    WC.phaseMatches(
      cup,
      "ROUND_OF_32"
    )[0];

  assert.throws(()=>{
    WC.recordKnockoutResult(
      cup,
      match.id,
      1,
      1
    );
  });
});
