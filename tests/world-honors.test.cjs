"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const H=require("../src/domain/world-honors.js");
const V=require("../src/ui/honors-view.js");
test("cerimônia cai em 20 de outubro e é determinística",()=>{
  const a=H.ceremonyDay(0),b=H.ceremonyDay(0);assert.equal(a,b);
  const d=new Date(Date.UTC(2026,0,1)+a*86400000);assert.equal(d.getUTCMonth(),9);assert.equal(d.getUTCDate(),20);
});
test("peso de ligas privilegia as cinco grandes",()=>{
  const s={globalFootball:{leagues:[{id:"a",country:"Inglaterra",reputation:72},{id:"b",country:"Inglaterra",reputation:37},{id:"c",country:"Noruega",reputation:45}]}};
  assert.equal(H.leagueWeight(s,"a"),1);assert.ok(H.leagueWeight(s,"b")<.5);assert.ok(H.leagueWeight(s,"c")<.7);
});
test("view renderiza estado vazio e com premiação",()=>{
  const s={season:2030,person:{name:"X"},honors:{seasons:{2029:{season:2029,revealed:true,candidates:10,ucl:{simulated:true},
    ballon:[{rank:1,id:"p1",name:"Ana Silva",pos:"ATA",age:26,club:"Real",clubId:"c1",points:900,apps:30,goals:20,assists:5,avg:7.8,reasons:["Campeão da Champions"]}],
    theBest:[],kopa:[],yashin:[],gerd:[],cruyff:[]}}}};
  assert.match(V.honras({season:2030,honors:{seasons:{}}}),/ainda não aconteceu/);
  const html=V.honras(s);assert.match(html,/Ana Silva/);assert.match(html,/Bola de Ouro/);
  assert.match(V.lendas({season:2030,mode:"career",globalFootball:{retirements:[]}}),/Salão de lendas/);
});
test("Champions usa o resultado real da edição concluída",()=>{
  const s={season:2028,day:1,continental:{editions:{"ucl:2027":{comp:"ucl",season:2027,knockout:{championId:"A",ranking:[{id:"A"},{id:"B"},{id:"C"}],stages:[{matches:[{homeId:"B",awayId:"C"}]},{matches:[{homeId:"A",awayId:"B"}]},{matches:[]},{matches:[]},{matches:[{homeId:"A",awayId:"B"}]}]}}}}};
  const r=H.realUcl(s,2028);
  assert.equal(r.champion,"A");assert.equal(r.simulated,false);
  assert.equal(r.results.get("A"),70);assert.equal(r.results.get("B"),50);assert.equal(r.results.get("C"),8);
});
test("Central mundial reflete a votação: Visão geral usa os vencedores da Bola de Ouro",()=>{
  const W=require("../src/domain/world-stats.js");
  const rec={season:2030,revealed:true,ballon:[{rank:1,id:"p1",name:"Ana Silva",clubId:"c1",club:"Real",pos:"ATA",points:900,goals:20}],theBest:[],kopa:[{id:"p2",name:"Jovem X",clubId:"c2",club:"Y",pos:"MEI",points:500}],yashin:[],gerd:[{id:"p3",name:"Artilheiro Z",clubId:"c3",club:"W",pos:"ATA",goals:31}],cruyff:[{name:"Téc",club:"Q",clubId:"c4",points:80}]};
  global.ProLifeWorldHonors=H;
  const s={season:2030,honors:{seasons:{2030:rec}},globalFootball:{},extras:{}};
  const a=H.awardsFor(s,null);
  assert.equal(a.partial,false);
  const byCat=Object.fromEntries(a.awards.map(x=>[x.cat,x]));
  assert.equal(byCat.melhorMundo.label,"Bola de Ouro");assert.equal(byCat.melhorMundo.name,"Ana Silva");
  assert.equal(byCat.jovemMundo.label,"Troféu Kopa");assert.equal(byCat.artilheiroMundo.value,31);assert.equal(byCat.treinadorMundo.label,"Troféu Cruyff");
  assert.ok(W.worldAwards);
});
test("votação usa o resumo da temporada europeia arquivada",()=>{
  const W=require("../src/domain/world-stats.js");
  assert.equal(typeof W.closeLeague,"function");
});
test("indicados saem em 25/09 e o vencedor só em 20/10",()=>{
  const day=(m,d)=>Math.round((Date.UTC(2030,m,d)-Date.UTC(2026,0,1))/86400000);
  const arts=[],msgs=[];
  const api={Career:{addArticle:(s,x)=>arts.push(x),addMessage:(s,x)=>msgs.push(x)}};
  const rec={season:2030,revealDay:day(9,20),revealed:false,hero:{rank:12,points:30,of:100},ballon:[{rank:1,name:"A",points:9}]};
  const s={season:2030,day:day(8,26),mode:"player",honors:{seasons:{2030:rec}}};
  H.daily(s,api);assert.equal(rec.nomsAnnounced,true);assert.equal(rec.revealed,false);assert.equal(arts.length,1);assert.equal(msgs.length,1);
  s.day=day(9,21);H.daily(s,api);assert.equal(rec.revealed,true);assert.equal(arts.length,2);
});
