"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const engine=fs.readFileSync("src/domain/engine.js","utf8");
test("J10.3: player-only fatigue participation applies to shot candidate, not permanent attributes",()=>{
 assert.match(engine,/context\?\.mode === "player" && p\.id === "hero"/);
 assert.match(engine,/clamp\(0\.94 \+ \(Number\(p\.condition \?\? 75\) - 65\) \/ 600, 0\.90, 1\.00\)/);
});
test("J10.3: existing team form, morale and physical multipliers are preserved",()=>{
 assert.match(engine,/formFactors\?\.get\(p\.id\) \?\? 1/);
 assert.match(engine,/0\.55 \+ \(0\.45 \* p\.condition\) \/ 100/);
 assert.match(engine,/0\.85 \+ \(0\.15 \* p\.morale\) \/ 100/);
 assert.match(engine,/0\.7 \+ \(0\.3 \* shooter\.condition\) \/ 100/);
});
test("J10.3: changes do not mutate training or persist an alternative GER",()=>{
 const training=fs.readFileSync("src/domain/training.js","utf8");
 assert.match(training,/function progressAttribute/);
 assert.match(training,/helpers\.overall\(s\.person\) < ceiling\(s,helpers\)/);
 assert.doesNotMatch(engine,/j10Moment\s*=|p\.attrs\s*=\s*j10/);
});
