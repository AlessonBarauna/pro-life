"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const E=require("../src/domain/engine.js"),A=require("../src/application/game.js");
test("virada de temporada preserva contratações, caixa e escalação do treinador",{timeout:0},()=>{
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_449",90000);E.CoachCareer.init(s,E);
  const me=()=>E.club(s);me().budget=5e9;
  const stars=E.GlobalFootball.activePlayers(s).filter(p=>p.clubId&&p.clubId!==s.clubId).sort((a,b)=>E.overall(b)-E.overall(a)).slice(0,40);
  const bought=[];
  for(const p of stars){if(bought.length>=3)break;try{A.execute(s,"payReleaseClause",{clubId:p.clubId,playerId:p.id});bought.push(p.id);}catch(e){}}
  assert.equal(bought.length,3);
  const budget=me().budget;
  while(s.day<366){s.board=100;E.advance(s,Math.min(30,366-s.day));}
  assert.equal(s.season,2027);
  const ids=new Set(me().roster.map(p=>p.id));
  for(const id of bought)assert.ok(ids.has(id),"jogador comprado continua no elenco");
  assert.ok(me().budget>budget*0.9,"o caixa não é zerado na virada: "+me().budget+" vs "+budget);
  assert.equal(me().lineup.length,11);assert.equal(new Set(me().lineup).size,11);
  assert.ok(me().lineup.every(id=>ids.has(id)));
  assert.ok(me().stats.played<=2,"estatísticas da temporada recomeçam");
  assert.equal(s.worldClubRefreshError,undefined);
});
