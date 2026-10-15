"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const J=require("../src/ui/post-match-j09.js");
const app=fs.readFileSync("src/ui/app.js","utf8");
const html=fs.readFileSync("index.html","utf8");
test("jogador titular: dados reais e confiança",()=>{
 const source={status:"TITULAR",minutes:90,rating:7.8,goals:1,assists:1,xp:4.25,objectivesMet:2,objectivesTotal:2,coachTrustBefore:60,coachTrustAfter:64,squadRoleBefore:"Rotação",squadRoleAfter:"Titular",attributeChanges:[{label:"Finalização",before:70,after:71}]};
 const m=J.model(source),out=J.render(source);
 assert.equal(m.trustDelta,4);assert.equal(m.rating,7.8);assert.match(out,/2 de 2 objetivos/);assert.match(out,/Finalização/);assert.match(out,/70 → 71/);assert.equal(source.coachTrustBefore,60);
});
test("jogador não utilizado não recebe nota, minutos, XP ou objetivos",()=>{
 const m=J.model({status:"NAO_UTILIZADO",minutes:0,rating:null,xp:0,objectivesMet:0,objectivesTotal:0});
 const out=J.render({status:"NAO_UTILIZADO",minutes:0,rating:null,xp:0});
 assert.equal(m.rating,null);assert.equal(m.minutes,0);assert.equal(m.met,null);
 assert.match(out,/Não utilizado/);assert.match(out,/sem nota ou XP/);
});
test("participação registrada do banco",()=>{
 const m=J.model({status:"ENTROU_DO_BANCO",entryMinute:67,minutes:23,rating:6.7,goals:0,assists:0,xp:1});
 assert.equal(m.entry,67);assert.match(J.render({status:"ENTROU_DO_BANCO",entryMinute:67,minutes:23,rating:6.7}),/Entrou aos 67/);
});
test("objetivos individuais não são inventados",()=>{
 const out=J.render({status:"TITULAR",minutes:80,rating:6.6,objectivesMet:1,objectivesTotal:2});
 assert.match(out,/1 de 2 objetivos/);assert.match(out,/não os resultados de cada objetivo individual/);
});
test("relatório é leitura apenas e mantém a integração",()=>{
 const src=fs.readFileSync("src/ui/post-match-j09.js","utf8");
 assert.doesNotMatch(src,/A\.execute|D\.advance|persist\(|pc\.coachTrust\s*=/);
 assert.match(app,/window\.ProLifePostMatchJ09\.render\(report\)/);
 assert.match(html,/src\/ui\/post-match-j09\.js/);
 assert.match(html,/src\/ui\/fc27-j09-post-match\.css/);
});
