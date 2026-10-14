"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const T=require("../src/domain/simulation-tactics.js");
test("legacy tactics migrate to deterministic tactical plans",()=>{
 const a=T.normalize({tactic:"possession"}),b=T.normalize({tactic:"possession"});
 assert.deepEqual(a,b); assert.equal(a.buildUp,"possession"); assert.ok(a.width>50);
});
test("high press costs more fatigue than a low block",()=>{
 const high=T.matchup({tacticalPlan:T.PRESETS.highPress},{tacticalPlan:T.PRESETS.balanced});
 const low=T.matchup({tacticalPlan:T.PRESETS.lowBlock},{tacticalPlan:T.PRESETS.balanced});
 assert.ok(high.fatigue>low.fatigue); assert.ok(high.defense>low.defense);
});
test("high line is vulnerable to direct counter attacks",()=>{
 const high=T.matchup({tacticalPlan:{...T.PRESETS.highPress,line:85}},{tacticalPlan:{...T.PRESETS.counter,directness:90}});
 const safe=T.matchup({tacticalPlan:{...T.PRESETS.balanced,line:48}},{tacticalPlan:{...T.PRESETS.counter,directness:90}});
 assert.ok(high.lineRisk>safe.lineRisk);
});
test("player simulation instructions have measurable tradeoffs",()=>{
 const creative=T.playerModifiers({simulationInstructions:{passingRisk:"creative",shooting:"frequent",movement:"runs",pressing:"intense"}});
 const safe=T.playerModifiers({simulationInstructions:{passingRisk:"safe",shooting:"selective",movement:"hold",pressing:"conserve"}});
 assert.ok(creative.shotWeight>safe.shotWeight);
 assert.ok(creative.chanceCreation>safe.chanceCreation);
 assert.ok(creative.turnoverRisk>safe.turnoverRisk);
 assert.ok(creative.fatigue>safe.fatigue);
});

test("a high line suffers defensively against direct opponents, rather than receiving an attack bonus",()=>{
 const opponent={tacticalPlan:{...T.PRESETS.counter,directness:90}};
 const high=T.matchup({tacticalPlan:{...T.PRESETS.highPress,line:90}},opponent);
 const medium=T.matchup({tacticalPlan:{...T.PRESETS.highPress,line:55}},opponent);
 assert.ok(high.defense<medium.defense);
 assert.equal(high.attack,medium.attack);
 const forward={tacticalPlan:{...T.PRESETS.counter,directness:90}};
 const deep=T.matchup(forward,{tacticalPlan:{...T.PRESETS.balanced,line:48}});
 const exposed=T.matchup(forward,{tacticalPlan:{...T.PRESETS.balanced,line:90}});
 assert.ok(exposed.attack>deep.attack);
});
