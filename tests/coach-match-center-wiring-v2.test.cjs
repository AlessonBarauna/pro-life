const test=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");const path=require("node:path");const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("coach match centre loads before live match in browser",()=>{const html=read("index.html");assert.ok(html.indexOf('src="src/ui/coach-match-center-v2.js"')>=0);assert.ok(html.indexOf('src="src/ui/coach-match-center-v2.js"')<html.indexOf('src="src/ui/live-match.js"'));});
test("coach match view menu clicks update tab and re-render",()=>{const code=read("src/ui/live-match.js");assert.match(code,/data-live-tab/);assert.match(code,/session\.tab=b\.dataset\.liveTab/);assert.match(code,/session\.coach/);});
test("only coach career activates the new tactical match menu",()=>{assert.match(read("src/ui/app.js"),/mode: state\.mode/);assert.match(read("src/ui/live-match.js"),/opts\?\.mode==="coach"/);});
test("new coach match assets are included in offline package",()=>{const a=read("tools/assets.cjs");assert.match(a,/coach-match-center-v2\.js/);assert.match(a,/coach-match-center-v2\.css/);});
