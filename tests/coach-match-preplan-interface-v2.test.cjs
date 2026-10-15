const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("coach match opens without forcing pre-match substitutions",()=>{
 assert.doesNotMatch(app,/data-coach-prematch-play/);
 assert.doesNotMatch(app,/coach-prematch-substitutions/);
 const start=app.indexOf('if (b.hasAttribute("data-live-match"))');
 const advance=app.indexOf('D.advance(state, 1)',start);
 assert.ok(start>=0&&advance>start);
});
test("legacy match playback remains available while true live runner is integrated",()=>{
 assert.match(app,/window\.ProLifeLiveMatch\.start\(\{ match: played, home, away, mode: state\.mode \}\)/);
});
test("new match runner is exposed separately without modifying player mode UI",()=>{
 const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
 assert.match(engine,/function\* simulateSteps\(/);
 assert.match(engine,/simulateSteps,/);
});
