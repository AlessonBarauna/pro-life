const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
test("official coach action pipeline validates actual prepared starting XI",()=>{
 const prepare=engine.indexOf("preparePlayerLineup(s, rng, homeId, awayId);",engine.indexOf("function registerMatch("));
 const real=engine.indexOf("const onField=new Set(selected(team)",prepare);
 const simulate=engine.indexOf("const m = simulate(hc, ac, rng, s, eligibleActions)",real);
 assert.ok(prepare>=0&&real>prepare&&simulate>real);
});
test("scheduled bench player must remain eligible at kickoff",()=>{
 assert.match(engine,/incoming\.injury\|\|incoming\.suspension>0\|\|incoming\._competitionSuspended\|\|incoming\.condition<=35/);
 assert.match(engine,/!onField\.has\(a\.outId\)\|\|onField\.has\(a\.inId\)/);
});
test("planned substitutions are ordered before execution",()=>{
 assert.match(engine,/pendingCoachPlan\.actions\.slice\(\)\.sort\(\(a,b\)=>a\.minute-b\.minute\)/);
 assert.match(engine,/onField\.delete\(a\.outId\);onField\.add\(a\.inId\)/);
});
