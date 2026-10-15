"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const J=require("../src/ui/player-j113-history.js");
const state={mode:"player",clubId:"club"};
const pc={starts:3,benchGames:5,squadCompetition:{history:[{day:10,role:"Banco",trust:55,reason:"Forma recente"},{day:14,role:"Titular",trust:61,reason:"Bom treino"}],trustHistory:[{day:14,source:"match",delta:3}]},lastMatchReport:{competition:"Série A",status:"ENTROU_DO_BANCO",minutes:28,entryMinute:66}};
const Career={init:()=>({playerCareer:pc})};
test("J11.3 displays saved totals, selection history and trust without guessing older entries",()=>{
 const data=J.snapshot(state,Career),view=J.render(state,Career);
 assert.equal(data.starts,3);assert.equal(data.nonStarts,5);
 for(const text of ["TITULARIDADES","JOGOS SEM INICIAR TITULAR","Dia 10","Forma recente","Dia 14","ENTROU DO BANCO","28 min","entrada aos 66","Inclui reservas utilizados"])assert.ok(view.includes(text),text);
});
test("J11.3 no fabricated historical appearances in legacy saves",()=>{
 const view=J.render(state,{init:()=>({playerCareer:{starts:0,benchGames:2}})});
 assert.match(view,/Sem decisões históricas registradas/);
 assert.match(view,/Sem variações históricas registradas/);
 assert.doesNotMatch(view,/entrada aos 60/);
});
test("J11.3 is player-only, read-only and loaded before J11",()=>{
 assert.equal(J.render({mode:"coach"},Career),"");
 const src=fs.readFileSync("src/ui/player-j113-history.js","utf8");
 assert.doesNotMatch(src,/A\.execute|persist\(|advance\(|coachTrust\s*=|Math\.random/);
 const html=fs.readFileSync("index.html","utf8");
 assert.ok(html.indexOf("src/ui/player-j113-history.js")<html.indexOf("src/ui/player-j11-coach.js"));
 assert.match(fs.readFileSync("src/ui/player-j11-coach.js","utf8"),/ProLifeJ113\?\.render/);
});
