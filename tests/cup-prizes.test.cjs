"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const CP=require("../src/domain/cup-prizes.js");
const E=require("../src/domain/engine.js");
test("campeão continental recebe bem mais que quem caiu nas oitavas",()=>{
  const mk=(champ)=>({comp:"ucl",season:2026,entrants:[["A"]],championId:champ?"A":"B",leagueSchedule:{matches:[{homeId:"A",awayId:"X",played:true,hg:2,ag:0},{homeId:"Y",awayId:"A",played:true,hg:1,ag:1}]},
    knockout:{stages:[{key:"round16",matches:[{homeId:"A",awayId:"Z"}]},...(champ?[{key:"quarters",matches:[{homeId:"A",awayId:"Z"}]},{key:"semis",matches:[{homeId:"A",awayId:"Z"}]},{key:"final",matches:[{homeId:"A",awayId:"Z"}]}]:[])]}});
  const a=CP.continental(mk(true),"A"),b=CP.continental(mk(false),"A");
  assert.ok(a.amount>b.amount*2);assert.ok(a.champion&&!b.champion);
  assert.equal(CP.continental(mk(true),"nada"),null);
  assert.ok(CP.continental(mk(true),"A").amount>CP.COMPS.ucl.part*1e6);
});
test("Libertadores paga mais que Sul-Americana; Copa do Brasil por fase",()=>{
  assert.ok(CP.COMPS.lib.champion>CP.COMPS.sud.champion);
  const cup=(w)=>({season:2026,championId:w,runnerUpId:w==="A"?"B":"A",rounds:[{name:"Primeira fase",pairs:[{home:"A",away:"B"}]},{name:"Oitavas de final",pairs:[{home:"A",away:"C"}]}]});
  assert.ok(CP.domesticCup(cup("A"),"A").amount>CP.domesticCup(cup("B"),"A").amount);
});
test("fim da temporada paga copas no caixa, uma vez só",{timeout:0},()=>{
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_449",90000);
  while(s.day<364){s.board=100;E.advance(s,Math.min(30,364-s.day));}
  E.advance(s,1);
  assert.equal(s.cupPrizeError,undefined);
  const n=(s.cupPrizes||[]).length;
  for(const p of s.cupPrizes||[])assert.ok(p.amount>0);
  assert.equal(new Set((s.cupPrizes||[]).map(p=>p.season+p.competitionId)).size,n);
});
