const test=require("node:test");
const assert=require("node:assert/strict");

const C=
  require("../src/domain/international-calendar.js");

test("international calendar contains all active senior competitions",()=>{
  for(const id of [
    "WORLD_CUP",
    "WORLD_CUP_QUALIFIERS",
    "COPA_AMERICA",
    "EURO",
    "UEFA_NATIONS_LEAGUE",
    "AFCON",
    "ASIAN_CUP",
    "GOLD_CUP",
    "CONCACAF_NATIONS_LEAGUE",
    "OFC_NATIONS_CUP",
    "FINALISSIMA",
    "FIFA_ARAB_CUP",
    "FIFA_SERIES"
  ]){
    assert.ok(
      C.get(id),
      id
    );
  }
});

test("World Cup cycle is every four years from 2026",()=>{
  assert.equal(
    C.isEditionYear(
      "WORLD_CUP",
      2026
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "WORLD_CUP",
      2027
    ),
    false
  );

  assert.equal(
    C.isEditionYear(
      "WORLD_CUP",
      2030
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "WORLD_CUP",
      2034
    ),
    true
  );
});

test("Copa America and EURO share the 2028 four-year cycle",()=>{
  assert.equal(
    C.isEditionYear(
      "COPA_AMERICA",
      2028
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "EURO",
      2028
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "COPA_AMERICA",
      2032
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "EURO",
      2032
    ),
    true
  );
});

test("Gold Cup and AFCON use biennial simulator cycles",()=>{
  assert.equal(
    C.isEditionYear(
      "GOLD_CUP",
      2027
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "GOLD_CUP",
      2029
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "AFCON",
      2027
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "AFCON",
      2029
    ),
    true
  );
});

test("FIFA Series runs on even years",()=>{
  assert.equal(
    C.isEditionYear(
      "FIFA_SERIES",
      2026
    ),
    true
  );

  assert.equal(
    C.isEditionYear(
      "FIFA_SERIES",
      2027
    ),
    false
  );

  assert.equal(
    C.isEditionYear(
      "FIFA_SERIES",
      2030
    ),
    true
  );
});

test("cross-confederation overlaps are classified but not dangerous",()=>{
  const euro=
    C.get("EURO");

  const copa=
    C.get("COPA_AMERICA");

  assert.equal(
    C.overlap(
      euro,
      copa
    ),
    true
  );

  assert.equal(
    C.classifyOverlap(
      euro,
      copa
    ),
    "CROSS_CONFEDERATION"
  );
});

test("World Cup canonical dates are documented centrally",()=>{
  const window=
    C.worldCupCanonicalWindow();

  assert.deepEqual(
    window.brazilGroup,
    [161,167,173]
  );

  assert.equal(
    window.roundOf32,
    178
  );

  assert.equal(
    window.final,
    199
  );
});

test("calendar can audit long career ranges",()=>{
  const report=
    C.validateRange(
      2026,
      2050
    );

  assert.equal(
    report.years.length,
    25
  );

  assert.ok(
    report.years.some(
      item=>
        item.year===2030 &&
        item.editions.includes(
          "WORLD_CUP"
        )
    )
  );

  assert.ok(
    Array.isArray(
      report.dangerous
    )
  );
});

test("CONCACAF Nations League is marked as crossing seasons",()=>{
  const item=
    C.get(
      "CONCACAF_NATIONS_LEAGUE"
    );

  assert.equal(
    item.crossesYear,
    true
  );

  assert.ok(
    item.window.end>365
  );
});
