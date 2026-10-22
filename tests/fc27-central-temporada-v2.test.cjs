"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Home=require("../src/ui/home-dashboard.js");

function state(){return {day:105,clubId:"c1",mode:"coach"};}
function next(){return {date:107,home:"Clube A",away:"Clube B",homeClubId:"c1",awayClubId:"c2",competitionId:"ucl",competitionName:"Champions League"};}
function calendar(events){return {events:()=>events};}

test("Central FC27: proximo compromisso do motor aparece em prioridade cronologica",()=>{
  const s=state(),rows=[{day:109,type:"club",title:"Jogo posterior",clubs:["c1","c3"]},{day:106,type:"event",title:"Decisao pendente"},{day:107,type:"club",title:"Clube A x Clube B",clubs:["c1","c2"]}];
  const out=Home.upcomingAgenda(s,{},calendar(rows),next());
  assert.deepEqual(out.map(x=>x.day),[106,107,109]);
  assert.equal(out.filter(x=>x.day===107).length,1);
  assert.equal(out.find(x=>x.day===107).officialNext,true);
  assert.equal(out.find(x=>x.day===107).detail,"Champions League");
});

test("Central FC27: ordem deterministica, limite de cinco e deduplicacao",()=>{
  const s=state(),rows=[{day:111,type:"event",title:"Natal"},{day:102,type:"club",title:"Partida passada"},{day:106,type:"event",title:"Aviso"},{day:106,type:"event",title:"Aviso"},{day:108,type:"club",title:"A x C",clubs:["c1","c3"]},{day:109,type:"club",title:"A x D",clubs:["c1","c4"]},{day:110,type:"club",title:"A x E",clubs:["c1","c5"]},{day:112,type:"event",title:"Evento extra"}];
  const expected=Home.upcomingAgenda(s,{},calendar(rows));
  assert.deepEqual(expected.map(x=>x.day),[106,108,109,110,111]);
  assert.deepEqual(Home.upcomingAgenda(s,{},calendar(rows)),expected);
});

test("Central FC27: nao muta estado nem eventos recebidos",()=>{
  const s=state(),rows=[{day:109,type:"club",title:"Jogo",clubs:["c1","c2"]},{day:106,type:"event",title:"Noticia"}];
  const before=JSON.stringify({s,rows});
  Home.upcomingAgenda(s,{},calendar(rows),next());
  assert.equal(JSON.stringify({s,rows}),before);
});

test("Central FC27: proximo compromisso vencido nao reaparece",()=>{
  const s=state();
  const out=Home.upcomingAgenda(s,{},calendar([]),{...next(),date:104});
  assert.deepEqual(out,[]);
});

test("Central FC27: nao exige proximo jogo para mostrar compromissos",()=>{
  const out=Home.upcomingAgenda(state(),{},calendar([{day:106,type:"event",title:"Reuniao"}]),null);
  assert.equal(out.length,1);
  assert.equal(out[0].title,"Reuniao");
});
