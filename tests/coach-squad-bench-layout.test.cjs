"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const js=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-05b-squad.css"),"utf8");
test("Squad screen renders responsive bench grid with extra reserves",()=>{
 new vm.Script(js);
 assert.match(js,/pl-squad-bench-groups/);
 assert.match(js,/pl-squad-bench-grid/);
 assert.match(js,/pl-squad-extra-reserves/);
 assert.match(css,/grid-template-columns:repeat\(auto-fit,minmax\(150px,1fr\)\)/);
});
test("Bench interaction still uses draggable player tiles and retains full bench",()=>{
 assert.match(js,/bench\.slice\(0,7\)\.map\(p=>playerTile\(p,true\)\)/);
 assert.match(js,/bench\.slice\(7\)\.map\(p=>playerTile\(p,true\)\)/);
 assert.match(js,/data-squad-player/);
 assert.match(js,/draggable="true"/);
});
