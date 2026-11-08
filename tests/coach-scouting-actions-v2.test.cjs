const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base=path.join(__dirname,"..");
const ui=fs.readFileSync(path.join(base,"src/ui/coach-career-view.js"),"utf8");
const app=fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8");
const Scouting=require("../src/domain/coach-scouting-v2.js");

test("T2 observation list offers explicit scouting action",()=>{
 assert.match(ui.replace(/\s+/g,""),/data-coach-start-scout/);
 assert.match(ui.replace(/\s+/g,""),/data-coach-region/);
});
test("T2 app dispatches scouting on coach-only click path and persists",()=>{
 assert.match(app.replace(/\s+/g,""),/\[data-coach-start-scout\]/);
 assert.match(app.replace(/\s+/g,""),/scout\.start\(state/);
 assert.match(app,/persist\(\);render\(\);restoreScoutPosition\(position,true\);toast\("Observação iniciada/);
});
test("T2 failed scouting never charges or persists duplicate mission",()=>{
 const s={mode:"coach",clubId:"home",day:1,clubs:[{id:"home",budget:120}]};
 const first=Scouting.start(s,{playerId:"target",cost:100});
 assert.equal(first.ok,true);
 assert.equal(s.clubs[0].budget,20);
 const second=Scouting.start(s,{playerId:"target",cost:100});
 assert.equal(second.ok,false);
 assert.equal(s.clubs[0].budget,20);
 assert.equal(s.coachCareer.scoutingV2.missions.length,1);
});
