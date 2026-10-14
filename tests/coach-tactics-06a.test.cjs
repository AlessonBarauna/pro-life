"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const T=require("../src/domain/simulation-tactics.js");
test("06A scouting report is deterministic and never mutates tactical plans",()=>{
 const home={tacticalPlan:{...T.PRESETS.highPress}};
 const away={tacticalPlan:{...T.PRESETS.counter}};
 const before=JSON.stringify([home,away]);
 const a=T.scoutingReport(home,away),b=T.scoutingReport(home,away);
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify([home,away]),before);
 assert.ok(a.indices.possession>=30&&a.indices.possession<=70);
 assert.ok(a.indices.workload>=20&&a.indices.workload<=90);
});
test("06A high defensive line against direct opponent exposes transition risk",()=>{
 const opponent={tacticalPlan:{...T.PRESETS.counter,directness:90}};
 const high=T.scoutingReport({tacticalPlan:{...T.PRESETS.highPress,line:90}},opponent);
 const low=T.scoutingReport({tacticalPlan:{...T.PRESETS.lowBlock,line:30}},opponent);
 assert.ok(high.matchup.counterExposure>low.matchup.counterExposure);
 assert.ok(high.warnings.some(x=>x.id==="high-line-counter"));
 assert.ok(!low.warnings.some(x=>x.id==="high-line-counter"));
});
test("06A intensive pressing and tempo produce fatigue warning",()=>{
 const intense=T.scoutingReport({tacticalPlan:{...T.PRESETS.highPress,tempo:80}}, {tacticalPlan:T.PRESETS.balanced});
 const calm=T.scoutingReport({tacticalPlan:T.PRESETS.lowBlock}, {tacticalPlan:T.PRESETS.balanced});
 assert.ok(intense.indices.workload>calm.indices.workload);
 assert.ok(intense.warnings.some(x=>x.id==="press-fatigue"));
});
test("06A balanced matchup produces neutral scouting indices",()=>{
 const a=T.scoutingReport({},{}).indices;
 assert.equal(a.possession,50);
 assert.equal(a.chanceCreation,50);
 assert.equal(a.defensiveSecurity,50);
});
