const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const calendar=
  require("../src/domain/international-calendar.js");

test("World Cup canonical window remains harmonized",()=>{
  const w=
    calendar.worldCupCanonicalWindow();

  assert.equal(
    w.clubStopStart,
    154
  );

  assert.equal(
    w.groupStart,
    161
  );

  assert.equal(
    w.roundOf32,
    178
  );

  assert.equal(
    w.roundOf16,
    184
  );

  assert.equal(
    w.quarterfinal,
    189
  );

  assert.equal(
    w.semifinal,
    194
  );

  assert.equal(
    w.thirdPlace,
    198
  );

  assert.equal(
    w.final,
    199
  );
});

test("national competition container uses unified detail hub",()=>{
  const app=
    fs.readFileSync(
      "src/ui/app.js",
      "utf8"
    );

  const start=
    app.indexOf(
      '<section id="national-competitions"'
    );

  assert.ok(
    start>=0
  );

  const end=
    app.indexOf(
      "</section>",
      start
    );

  const section=
    app.slice(
      start,
      end
    );

  assert.ok(
    section.includes(
      "${internationalCompetitionsHubHtml}"
    )
  );

  assert.ok(
    section.includes(
      "${nationalCompetitionDetailsHtml}"
    )
  );
});

test("World Cup remains selectable through unified international hub",()=>{
  const app=
    fs.readFileSync(
      "src/ui/app.js",
      "utf8"
    );

  assert.ok(
    app.includes(
      'nationalCompetitionId==="WORLD_CUP"'
    )
  );

  assert.ok(
    app.includes(
      "worldCupHtml"
    )
  );
});
