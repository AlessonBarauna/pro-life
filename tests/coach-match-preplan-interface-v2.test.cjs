const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
test("coach opens substitution setup before official advance",()=>{
 const start=app.indexOf('if (b.hasAttribute("data-live-match"))');
 const popup=app.indexOf('dialog.id="coach-prematch-substitutions"',start);
 const advance=app.indexOf('D.advance(state, 1)',start);
 assert.ok(start>=0&&popup>start&&advance>popup);
});
test("prematch substitution plans queue before advancing game day",()=>{
 const start=app.indexOf('if (b.hasAttribute("data-coach-prematch-play"))');
 const queue=app.indexOf('D.scheduleCoachActions?.(state,next,actions)',start);
 const advance=app.indexOf('D.advance(state,1)',start);
 assert.ok(start>=0&&queue>start&&advance>queue);
});
test("prematch planner offers lineup, bench and cancel action",()=>{
 assert.match(app,/data-coach-prematch-out/);
 assert.match(app,/data-coach-prematch-in/);
 assert.match(app,/data-coach-prematch-cancel/);
 assert.match(engine,/coachActionPlans\.delete\(s\)/);
});
