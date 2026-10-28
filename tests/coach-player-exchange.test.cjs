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
test("contratação concluída encerra a sondagem correspondente",()=>{
  const {s,own,src}=setup();D.CoachCareer.init(s,D);if(!D.Career.windowStatus(s).open)s.day=1;
  const p=src.roster.find(x=>x.id!=="hero");
  s.coachCareer.inquiries=[{id:"inq",playerId:p.id,clubId:src.id,buyerClubId:own.id,status:"accepted",expiresDay:s.day+10}];
  A.execute(s,"recruit",{clubId:src.id,playerId:p.id,paymentPlan:"upfront",dealType:"permanent"});
  assert.equal(s.coachCareer.inquiries[0].status,"converted");
  assert.equal(s.coachCareer.inquiries[0].convertedDay,s.day);
});
function sellScenario(rights){
  const {s,own,src}=setup();D.CoachCareer.init(s,D);if(!D.Career.windowStatus(s).open)s.day=1;
  const p=src.roster.find(x=>x.id!=="hero");
  A.execute(s,"recruit",{clubId:src.id,playerId:p.id,paymentPlan:"upfront",dealType:"permanent",rights});
  const third=D.club(s,"gf_fc27_2");third.roster=D.GlobalFootball.playersByClub(s,third.id).slice();third.budget=900000000;
  const fee=rights==="buyback"?Math.ceil(1000000000/1000)*1000:5000000;
  src.budget=900000000;
  s.coachCareer.saleOffers=[{id:"sale1",playerId:p.id,buyerClubId:third.id,sellerClubId:own.id,amount:Math.min(fee,800000000),requested:1,round:1,status:"pending",createdDay:s.day,expiresDay:s.day+10,dealType:"permanent"}];
  return {s,own,src,third,p};
}
test("direito de preferência: clube de origem iguala a oferta e fica com o jogador",()=>{
  const {s,src,p}=sellScenario("first_refusal");
  A.execute(s,"acceptSaleOffer",{id:"sale1"});
  assert.ok(D.club(s,src.id).roster.some(x=>x.id===p.id),"voltou ao clube de origem");
  assert.equal(s.coachCareer.rightsClauses[0].active,false);
});
test("recompra: clube de origem compra pelo valor fixado quando a oferta é maior",()=>{
  const {s,src,p}=sellScenario("buyback");
  const price=s.coachCareer.rightsClauses[0].price;
  A.execute(s,"acceptSaleOffer",{id:"sale1"});
  assert.ok(D.club(s,src.id).roster.some(x=>x.id===p.id));
  assert.equal(s.coachCareer.saleOffers[0].amount,price);
});
