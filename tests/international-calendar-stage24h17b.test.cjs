const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const C=
  require("../src/domain/international-calendar.js");

test("World Cup qualifiers use shared international windows",()=>{
  const q=
    C.get(
      "WORLD_CUP_QUALIFIERS"
    );

  assert.equal(
    q.collisionPolicy,
    "SHARED_WINDOW"
  );
});

test("qualifier overlap is not classified as dangerous competition collision",()=>{
  const q=
    C.get(
      "WORLD_CUP_QUALIFIERS"
    );

  const finalissima=
    C.get(
      "FINALISSIMA"
    );

  assert.equal(
    C.overlap(
      q,
      finalissima
    ),
    true
  );

  assert.equal(
    C.classifyOverlap(
      q,
      finalissima
    ),
    "SHARED_WINDOW"
  );
});

test("2029 no longer reports false dangerous calendar collisions",()=>{
  const dangerous=
    C.dangerousCollisions(
      2029
    );

  assert.deepEqual(
    dangerous,
    []
  );
});

test("international calendar has no dangerous collisions through 2050",()=>{
  const report=
    C.validateRange(
      2026,
      2050
    );

  assert.equal(
    report.dangerous.length,
    0
  );
});

test("World Cup canonical group start remains day 161",()=>{
  const window=
    C.worldCupCanonicalWindow();

  assert.equal(
    window.groupStart,
    161
  );

  assert.deepEqual(
    window.brazilGroup,
    [161,167,173]
  );

  assert.equal(
    window.final,
    199
  );
});

test("national team World Cup window uses canonical day 161",()=>{
  const src=
    fs.readFileSync(
      "src/domain/national-team.js",
      "utf8"
    );

  assert.ok(
    /worldCupWindow\s*=\s*yearStart\s*\+\s*161\s*;/.test(
      src
    )
  );

  assert.equal(
    /worldCupWindow\s*=\s*yearStart\s*\+\s*224\s*;/.test(
      src
    ),
    false
  );
});
