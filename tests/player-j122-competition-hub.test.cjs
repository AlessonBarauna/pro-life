"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const src=fs.readFileSync("src/ui/competitions-hub-view.js","utf8");
test("J12.2 reuses the canonical competition hub and existing navigation",()=>{
 assert.match(src,/function playerCompetitionFocus\(s,D\)/);
 assert.match(src,/ui\.section==="minhas"&&!ui\.leagueId\?playerCompetitionFocus\(s,D\)/);
 for(const section of ["Minhas competições","Ligas nacionais","Copas nacionais","Continentais","Mundiais","Seleções","Histórico e estatísticas"])assert.ok(src.includes(section),section);
 for(const tab of ["Visão geral","Tabela","Calendário","Estatísticas","Histórico","Clubes"])assert.ok(src.includes(tab),tab);
});
test("J12.2 uses canonical table, fixture and match history without inventing data",()=>{
 assert.match(src,/D\?\.nextCommitment\?\.\(s\)/);
 assert.match(src,/D\?\.table\?\.\(s,hc\.leagueId\)/);
 assert.match(src,/D\?\.Competitions\?\.fixtureStage\?\.\(s,next\)/);
 assert.match(src,/\(s\.matches\|\|\[\]\)\.filter/);
 assert.match(src,/String\(m\.home\)===String\(s\.clubId\)/);
 assert.match(src,/data-page="matches"/);
 assert.match(src,/data-page="calendar"/);
});
test("J12.2 isolates player UI, does not schedule or simulate games",()=>{
 assert.match(src,/s\?\.mode!=="player"\|\|!s\.clubId/);
 const section=src.slice(src.indexOf("function playerCompetitionFocus"),src.indexOf("function render(s,D)"));
 assert.doesNotMatch(section,/simulateAdvance|\.advance\(|\.push\(|Math\.random\(|save\(|persist\(/);
});
