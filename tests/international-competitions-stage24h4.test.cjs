const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");

const DB=require("../src/domain/international-competitions.js");
const app=fs.readFileSync("src/ui/app.js","utf8");
const html=fs.readFileSync("index.html","utf8");

test("international catalog contains major senior competitions",()=>{
  const ids=new Set(DB.competitions.map(x=>x.id));

  for(const id of [
    "WORLD_CUP",
    "COPA_AMERICA",
    "EURO",
    "UEFA_NATIONS_LEAGUE",
    "GOLD_CUP",
    "CONCACAF_NATIONS_LEAGUE",
    "AFCON",
    "ASIAN_CUP",
    "OFC_NATIONS_CUP",
    "FINALISSIMA",
    "FIFA_ARAB_CUP",
    "FIFA_SERIES"
  ])
    assert.ok(ids.has(id),id);
});

test("Confederations Cup is historical only",()=>{
  const c=DB.get("CONFEDERATIONS_CUP");
  assert.ok(c);
  assert.equal(c.active,false);
});

test("Brazil has Copa America and World Cup eligibility",()=>{
  assert.equal(DB.get("COPA_AMERICA").brazil,"eligible");
  assert.equal(DB.get("WORLD_CUP").brazil,"eligible");
});

test("UI exposes FC26 international competition hub",()=>{
  assert.ok(app.includes("fc26-national-competition-hub"));
  assert.ok(app.includes("data-national-competition"));
  assert.ok(app.includes("nationalCompetitionId"));
});

test("catalog loads before World Cup UI dependencies",()=>{
  const catalog=html.indexOf(
    "src/domain/international-competitions.js"
  );

  const squads=html.indexOf(
    "src/domain/world-cup-squads-2026.js"
  );

  assert.ok(catalog>=0);
  assert.ok(squads>=0);
  assert.ok(catalog<squads);
});
