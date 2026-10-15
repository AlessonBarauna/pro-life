"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const J=require("../src/ui/player-j124-match-context.js");
const s={mode:"player",clubId:"a",person:{condition:77,injury:0}};
test("J12.4 distinguishes knockout stages from a regular fixture",()=>{
 for(const [stage,tag] of [["Final","FINAL"],["Semifinal","SEMIFINAL"],["Quartas de final","QUARTAS DE FINAL"],["Oitavas de final","OITAVAS DE FINAL"],["Rodada 12","COMPROMISSO OFICIAL"]]){
 const x=J.describe({stage,competitionName:"Copa do Brasil"},s);assert.equal(x.tag,tag,stage);
 }
});
test("J12.4 shows actual health and never fabricates a winner",()=>{
 const out=J.render({stage:"Final",competitionName:"Copa do Brasil"}, {...s,person:{injury:4,condition:38}});
 assert.match(out,/Lesionado · 4 dia\(s\)/);
 assert.match(out,/não atribui bônus nem garante classificação/);
 assert.doesNotMatch(out,/campeão garantido|vitória garantida/);
});
test("J12.4 integrates existing J07 without touching the competition motor",()=>{
 const source=fs.readFileSync("src/ui/app.js","utf8"),view=fs.readFileSync("src/ui/player-j124-match-context.js","utf8"),html=fs.readFileSync("index.html","utf8");
 assert.match(source,/ProLifeJ124\?\.render\?\.\(next,state\)/);
 assert.match(source,/\$\{decisiveBrief\}/);
 assert.match(html,/player-j124-match-context\.js/);
 assert.doesNotMatch(view,/simulateAdvance|\.advance\(|persist\(|state\.matches\.push/);
});
