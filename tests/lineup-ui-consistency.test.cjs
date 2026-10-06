const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
test("preview de escalação lê a competição canônica sem reescrever o XI",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/ui/home-dashboard.js"),"utf8");
 assert.match(src,/D\.Squad\.competition\(s\)/);
 assert.doesNotMatch(src,/selection\.starters\[idx\]=s\.person|hierarchyApplied/);
});
test("tela usa o papel derivado da lista efetiva",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(src,/actualRole=D\.Squad\.roleForHero\(state,L\.selection\)/);
 assert.match(src,/Você aparece abaixo no XI inicial/);
});
