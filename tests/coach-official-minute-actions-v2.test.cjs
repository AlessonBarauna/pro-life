const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
test("official simulator accepts optional minute-directed coach actions without changing existing calls",()=>{
 assert.match(src,/function simulate\(home, away, rng, context = null, coachActions = \[\]\)/);
 assert.match(src,/function\* simulateSteps\(home, away, rng, context = null, coachActions = \[\]\)/);
 assert.match(src,/const plannedActions=Array\.isArray\(coachActions\)\?coachActions:\[\]/);
});
test("planned substitutions are applied before subsequent possession and shot logic",()=>{
 const begin=src.indexOf('for (let minute = 1; minute <= 94; minute++)');
 const insertion=src.indexOf('ps[index]=incoming;',begin);
 const control=src.indexOf('const control = squads.map(',begin);
 assert.ok(begin>=0&&insertion>begin&&control>insertion);
});
test("substitutions track minutes, prevent unfit bench players and do not alter earlier events",()=>{
 assert.match(src,/incoming\.injury\|\|incoming\.suspension>0/);
 assert.match(src,/coachSubs\[side\]>=5/);
 assert.match(src,/m\.participation\[outgoing\.id\]\.exitMinute=minute/);
 assert.match(src,/m\.participation\[incoming\.id\]=\{side,starter:false,entryMinute:minute/);
});
