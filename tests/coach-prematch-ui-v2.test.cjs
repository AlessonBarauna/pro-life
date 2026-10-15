const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
test("T1 browser loads match rating before coach career view",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 const a=html.indexOf('src="src/domain/coach-match-rating.js"');
 const b=html.indexOf('src="src/ui/coach-career-view.js"');
 assert.ok(a>=0&&b>a);
});
test("T1 published asset manifest includes match rating",()=>{
 const assets=require("../tools/assets.cjs");
 const text=fs.readFileSync(path.join(root,"tools/assets.cjs"),"utf8");
 assert.match(text,/src\/domain\/coach-match-rating\.js/);
});
test("T1 prematch renders conditional non-mutating GER preview",()=>{
 const view=fs.readFileSync(path.join(root,"src/ui/coach-career-view.js"),"utf8");
 assert.match(view,/ProLifeCoachMatchRating/);
 assert.match(view,/GER EFETIVO DO ELENCO/);
 assert.match(view,/A escalação não|a escalação não|a escalação não são alterados|escalação não são alterados/);
});
