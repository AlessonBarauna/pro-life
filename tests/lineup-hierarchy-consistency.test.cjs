const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
test("engine usa Squad.choose como fonte final da escalacao",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
 assert.match(src,/const selection = Squad\?\.choose \? Squad\.choose\(s,c\) : null/);
 assert.match(src,/c\.lineup=selection\.starters\.map/);
 assert.doesNotMatch(src,/starterRole|benchRole|selection\.starters\[idx\] = s\.person/);
});
