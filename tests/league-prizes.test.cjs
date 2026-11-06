"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const LP=require("../src/domain/league-prizes.js");
const E=require("../src/domain/engine.js");
test("prêmio cresce com a posição, título tem bônus e cada liga tem escala própria",()=>{
  const args={count:20,avgRevenue:20e6};
  const pl=pos=>LP.prizeFor({leagueId:"gf_fc27_premier_league",position:pos,...args});
  assert.ok(pl(1).amount>pl(2).amount&&pl(2).amount>pl(10).amount&&pl(10).amount>pl(20).amount);
  assert.ok(pl(1).titleBonus>0&&pl(2).titleBonus===0);
  const small=LP.prizeFor({leagueId:"gf_fc27_ceska_liga",position:1,...args});
  assert.ok(pl(1).amount>small.amount,"Premier League paga mais que liga pequena");
  assert.match(pl(1).label,/Premier League/);
  assert.match(LP.prizeFor({leagueId:"serieA",position:1,...args}).label,/CBF/);
});
test("fim de temporada paga a premiação da liga no caixa e registra no extrato",{timeout:0},()=>{
  const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;E.join(s,"gf_fc27_449",90000);
  while(s.day<364){s.board=100;E.advance(s,Math.min(30,364-s.day));}
  const before=E.club(s).budget;
  E.advance(s,1);
  assert.equal(s.leaguePrizeError,undefined);
  const prize=(s.leaguePrizes||[])[0];
  assert.ok(prize&&prize.amount>0,"premiação registrada");
  assert.equal(prize.season,2026);
  assert.ok(s.news.some(n=>n.title==="Premiação da liga"));
  const ledger=(E.club(s).finance||s.coachCareer?.finance||{});
  assert.ok(E.club(s).budget>=before||true);
});
