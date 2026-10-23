"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const engine=fs.readFileSync("src/domain/engine.js","utf8");
const app=fs.readFileSync("src/ui/app.js","utf8");
const live=fs.readFileSync("src/ui/live-match.js","utf8");
test("UI scripts and official match engine compile",()=>{
 new vm.Script(engine);new vm.Script(app);new vm.Script(live);
});
test("Interactive coach branch does not advance career before finishing match",()=>{
 const start=app.indexOf('if(state.mode==="coach"&&!next.national&&D.createCoachLiveController)');
 const end=app.indexOf('      const before = next.national',start);
 assert.ok(start>0&&end>start);
 const part=app.slice(start,end);
 assert.match(part,/ProLifeLiveMatch\.start/);
 assert.match(part,/onOfficialFinish:/);
 assert.match(part,/D\.stageCoachLiveResult\?\.\(state,next,live\)/);
 assert.match(part,/D\.advance\(state,1\)/);
 assert.ok(part.indexOf('D.advance(state,1)')>part.indexOf('onOfficialFinish:'));
});
test("Coach live controls use uncommitted motor and finalize after 94 minutes",()=>{
 assert.match(live,/data-official-live-sub/);
 assert.match(live,/officialControl\.substitute/);
 assert.match(live,/officialControl\.advanceTo\(94\)/);
 assert.match(live,/session\.onOfficialFinish\(session\.officialControl\.actions\)/);
 assert.match(engine,/function createCoachLiveController/);
 assert.match(engine,/score:\[Number\(last\?\.hg\|\|0\),Number\(last\?\.ag\|\|0\)\]/);
});
