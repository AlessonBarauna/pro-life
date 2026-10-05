const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
test("preview de escalação insere hero no XI e recalcula o papel real",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/ui/home-dashboard.js"),"utf8");
 assert.match(src,/selection\.starters\[idx\]=s\.person/);
 assert.match(src,/heroRole:D\.Squad\.roleForHero\(s,selection\)/);
});
test("tela usa o papel derivado da lista efetiva",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(src,/actualRole=D\.Squad\.roleForHero\(state,L\.selection\)/);
 assert.match(src,/Você aparece abaixo no XI inicial/);
});