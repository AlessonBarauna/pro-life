"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const View=require("../src/ui/world-competitions-view.js");

function fixture(){
  const clubs=Array.from({length:20},(_,index)=>({id:`c${index+1}`,name:`Clube ${index+1}`}));
  const table=clubs.map((club,index)=>({id:club.id,name:club.name,played:19,w:19-index,d:0,l:index,gd:20-index,points:57-index}));
  const rounds=Array.from({length:19},(_,index)=>({round:index+1,played:index<5,pairs:[{home:"c1",away:"c2",hg:2,ag:0,played:index<5}]}));
  const s={season:2026,globalFootball:{clubs,worldCompetitions:{leagues:{liga:{}}}}};
  const D={WorldClubCompetitions:{
    eligibleLeagues:()=>[{id:"liga",name:"Liga Nacional",country:"Brasil",clubCount:20}],
    standings:()=>table,
    calendar:()=>rounds,
    results:()=>[{home:"c1",away:"c2",homeName:"Clube 1",awayName:"Clube 2",hg:2,ag:0}],
    history:()=>[]
  }};
  return {s,D};
}

test("Mundo usa seletores compactos e telas independentes",()=>{
  const {s,D}=fixture();
  const overview=View.render(s,D);
  assert.match(overview,/data-world-league-select/);
  assert.match(overview,/data-world-section="standings"/);
  assert.match(overview,/data-world-active-section="overview"/);
  assert.doesNotMatch(overview,/world-league-tabs|world-round-tabs/);

  const matches=View.render(s,D,{section:"matches",round:7});
  assert.match(matches,/data-world-active-section="matches"/);
  assert.match(matches,/data-world-round-select/);
  assert.doesNotMatch(matches,/Tabela da liga/);
});

test("Classificação é paginada em blocos de dez sem faixa lateral",()=>{
  const {s,D}=fixture();
  const second=View.render(s,D,{section:"standings",tablePage:1});
  const rows=(second.match(/<tr>/g)||[]).length-1;
  assert.equal(rows,10);
  assert.match(second,/data-world-table-page="0"/);
  assert.match(second,/>11<\/td>/);
  assert.doesNotMatch(second,/overflow:auto/);
});
