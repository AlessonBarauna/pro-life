const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const national=fs.readFileSync(
  "src/domain/national-team.js",
  "utf8"
);

const app=fs.readFileSync(
  "src/ui/app.js",
  "utf8"
);

test("national module exposes matchLineup",()=>{
  assert.match(national,/function matchLineup\(/);
  assert.match(national,/matchLineup,fixtureCallupStatus/);
});

test("national lineup uses eleven players",()=>{
  assert.match(national,/take\("GOL",1\)/);
  assert.match(national,/take\("DEF",4\)/);
  assert.match(national,/take\("MEI",3\)/);
  assert.match(national,/take\("ATA",3\)/);
});

test("national fixture is rendered on lineup page",()=>{
  assert.match(app,/national-lineup-stage23/);
  assert.match(app,/NationalTeam\?\.matchLineup/);
});

test("old national fixture blocker was removed",()=>{
  assert.doesNotMatch(
    app,
    /if\(next\?\.national\) return/
  );
});

test("national lineup has starters and bench",()=>{
  assert.match(app,/fc-lineup-list/);
  assert.match(app,/data-page="national"/);
});

test("career player is highlighted in national lineup",()=>{
  assert.match(app,/p\.id==="hero"/);
});
