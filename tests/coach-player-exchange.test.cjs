const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");global.ProLife=D;
const A=require("../src/application/game.js");
function setup(){
  const s=D.create({mode:"coach",catalogVersion:"fc27_v1"},4242);s.clubId=null;D.join(s,"gf_fc27_5",90000);
  const own=D.club(s);own.budget=900000000;
  const src=D.club(s,"gf_fc27_1");if(!Array.isArray(src.roster))src.roster=D.GlobalFootball.playersByClub(s,src.id).slice();src.lineup||=[];
  return {s,own,src};
}
test("troca de jogadores abate o valor em dinheiro e move os atletas",()=>{
  const {s,own,src}=setup();
  if(!D.Career.windowStatus(s).open)s.day=1;
  const p=src.roster.find(x=>x.id!=="hero"),give=own.roster.find(x=>x.id!=="hero");
  const before={own:own.budget,srcLen:src.roster.length,ownLen:own.roster.length};
  const s2=JSON.parse(JSON.stringify(s));
  A.execute(s,"recruit",{clubId:src.id,playerId:p.id,paymentPlan:"upfront",dealType:"permanent"});
  const paidCash=before.own-D.club(s).budget;
  const t=setup();const o2=D.club(t.s),sr2=D.club(t.s,"gf_fc27_1");
  if(!D.Career.windowStatus(t.s).open)t.s.day=1;
  const p2=sr2.roster.find(x=>x.id===p.id),give2=o2.roster.find(x=>x.id===give.id);
  A.execute(t.s,"recruit",{clubId:sr2.id,playerId:p2.id,paymentPlan:"upfront",dealType:"permanent",exchangeIds:[give2.id]});
  const paidWithExchange=before.own-D.club(t.s).budget;
  assert.ok(paidWithExchange<paidCash,"troca reduz o dinheiro pago");
  assert.ok(sr2.roster.some(x=>x.id===give2.id),"jogador trocado foi para o clube vendedor");
  assert.ok(!D.club(t.s).roster.some(x=>x.id===give2.id));assert.ok(D.club(t.s).roster.some(x=>x.id===p2.id));
  assert.equal(give2.clubId,sr2.id);
});
test("troca não aceita jogador de fora do elenco nem deixar o elenco abaixo de 18",()=>{
  const {s,own,src}=setup();if(!D.Career.windowStatus(s).open)s.day=1;
  const p=src.roster.find(x=>x.id!=="hero");
  assert.throws(()=>A.execute(s,"recruit",{clubId:src.id,playerId:p.id,paymentPlan:"upfront",dealType:"permanent",exchangeIds:["inexistente"]}),/indisponível/);
  const ids=own.roster.filter(x=>x.id!=="hero").slice(0,3).map(x=>x.id);
  own.roster=own.roster.slice(0,18);
  assert.throws(()=>A.execute(s,"recruit",{clubId:src.id,playerId:p.id,paymentPlan:"upfront",dealType:"permanent",exchangeIds:ids.slice(0,2)}),/abaixo do mínimo/);
});
test("acordo com cláusula de revenda via mesa de negociação registra a cláusula",()=>{
  const {s,src}=setup();if(!D.Career.windowStatus(s).open)s.day=1;
  const p=src.roster.find(x=>x.id!=="hero");
  D.CoachCareer.init(s,D);
  A.execute(s,"recruit",{clubId:src.id,playerId:p.id,paymentPlan:"upfront",dealType:"permanent",sellOn:20});
  assert.ok(s.coachCareer.sellOnClauses.some(c=>c.playerId===p.id&&c.percentage===20&&c.active));
});
test("resposta de sondagem gera mensagem na caixa de entrada",()=>{
  const {s,src}=setup();D.CoachCareer.init(s,D);
  const p=src.roster.find(x=>x.id!=="hero");
  A.execute(s,"coachInquiry",{clubId:src.id,playerId:p.id});
  for(let i=0;i<3;i++)D.advance(s,1);
  assert.notEqual(s.coachCareer.inquiries[0].status,"pending");
  assert.match(JSON.stringify(D.Career.init(s)),/Sondagem (aceita|recusada)/);
});
