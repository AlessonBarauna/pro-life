const test=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");const path=require("node:path");
const root=path.join(__dirname,"..");
test("T2 observation menu renders persistent scouting mission progress",()=>{
 const ui=fs.readFileSync(path.join(root,"src/ui/coach-career-view.js"),"utf8");
 assert.match(ui,/REDE DE OBSERVAÇÃO/);
 assert.match(ui,/Relatórios de olheiros/);
 assert.match(ui,/scoutingV2\?\.missions/);
 assert.match(ui,/scouting\?\.report/);
 assert.match(ui,/missionPanel/);
});
test("T2 scouting module loads before coach-career daily engine",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 const a=html.indexOf('src="src/domain/coach-scouting-v2.js"');
 const b=html.indexOf('src="src/domain/coach-career.js"');
 assert.ok(a>=0&&b>a);
});
test("T2 scouting module is included in published asset list",()=>{
 const assets=fs.readFileSync(path.join(root,"tools/assets.cjs"),"utf8");
 assert.match(assets,/src\/domain\/coach-scouting-v2\.js/);
});
