const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const engine=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("capitania considera longevidade e experiencia com pesos atuais",()=>{
 assert.match(engine,/Math\.min\(years,8\)\*1\.6 \+ experience\*\.7/);
 assert.match(engine,/heroYears/);
});
test("capitao da partida precisa estar no XI",()=>{
 assert.match(engine,/xiIds=new Set\(selection\.starters/);
 assert.match(engine,/leadership\.ranking\.find\(x=>xiIds\.has\(x\.player\.id\)\)/);
});
test("interface mostra capitao vice e posicao do jogador",()=>{
 assert.match(ui,/HIERARQUIA DE LIDERANÇA/);
 assert.match(ui,/Vice-capitão/);
 assert.match(ui,/leadership\?\.heroRank/);
 assert.match(ui,/captain-mark/);
});