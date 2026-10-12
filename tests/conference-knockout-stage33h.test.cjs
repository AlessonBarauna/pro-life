const test=require('node:test');
const assert=require('node:assert/strict');
const K=require('../src/domain/conference-knockout.js');
function edition(){
 const ids=Array.from({length:36},(_,i)=>'club'+i);
 const entrants=ids.map(id=>[id,'ENG']);
 const matches=[];
 for(let r=0;r<6;r++)for(let i=0;i<18;i++)matches.push({id:`uecl:2026:league:${r*18+i}`,homeId:ids[(i*2+r)%36],awayId:ids[(i*2+1+r)%36],played:true,hg:(r+i)%3,ag:(i+2)%3});
 return {comp:'uecl',season:2026,entrants,leagueSchedule:{matches}};
}
test('36 clubes e 108 jogos de fase de liga',()=>{const ed=edition();assert.equal(K.rank(ed).length,36)});
test('formato incompleto nao pode produzir ranking',()=>{const ed=edition();ed.leagueSchedule.matches.pop();assert.throws(()=>K.rank(ed),/concluida|Conference/)});
test('playoffs geram 16 jogos sem duplicidade',()=>{const ed=edition();K.initialize(ed,180);assert.equal(ed.knockout.stages[0].matches.length,16);assert.equal(new Set(ed.knockout.stages[0].matches.map(m=>m.id)).size,16)});
test('mata-mata completa 45 partidas e registra campeao',()=>{
 const ed=edition();K.initialize(ed,180);
 for(let i=0;i<5;i++){
  const stage=ed.knockout.stages.at(-1);
  for(const m of stage.matches)Object.assign(m,{played:true,hg:2,ag:0});
  K.advance(ed);
 }
 const k=ed.knockout;
 assert.equal(k.status,'completed');assert.ok(ed.entrants.some(x=>x[0]===k.championId));
 assert.equal(k.stages.reduce((n,st)=>n+st.matches.length,0),45);
});
test('campeao e partidas persistem no estado JSON',()=>{
 const ed=edition();K.initialize(ed,180);
 for(let i=0;i<5;i++){for(const m of ed.knockout.stages.at(-1).matches)Object.assign(m,{played:true,hg:1,ag:0});K.advance(ed)}
 const restored=JSON.parse(JSON.stringify(ed));assert.equal(restored.knockout.championId,ed.knockout.championId);assert.equal(restored.knockout.stages.length,5);
});
