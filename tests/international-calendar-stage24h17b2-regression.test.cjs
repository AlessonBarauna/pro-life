const test=require("node:test");
const assert=require("node:assert/strict");

const NT=
  require("../src/domain/national-team.js");

test("World Cup club pause covers canonical tournament window",()=>{
  const base=365*4;

  for(const relative of [
    154,
    161,
    173,
    178,
    184,
    189,
    194,
    198,
    199
  ]){
    assert.equal(
      NT.protectedDay(
        base+relative
      ),
      true,
      "day "+relative
    );
  }
});

test("World Cup club pause ends after final",()=>{
  const base=365*4;

  assert.equal(
    NT.protectedDay(
      base+200
    ),
    false
  );
});

test("old World Cup-specific pause window is removed",()=>{
  const source=
    require("fs").readFileSync(
      "src/domain/national-team.js",
      "utf8"
    );

  assert.equal(
    /relative\s*>=\s*217\s*&&\s*relative\s*<=\s*256/.test(
      source
    ),
    false
  );

  assert.equal(
    /relative\s*>=\s*154\s*&&\s*relative\s*<=\s*199/.test(
      source
    ),
    true
  );
});
