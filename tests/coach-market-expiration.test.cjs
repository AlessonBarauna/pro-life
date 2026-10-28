"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
global.ProLife=D;
const A=require("../src/application/game.js");
const View=require("../src/ui/coach-career-view.js");
const Mobile=require("../src/ui/mobile-sm27.js");

function career(){
  const s=D.create({mode:"coach",catalogVersion:"fc27_v1"},9081);
  s.clubId=null;
  D.join(s,"gf_fc27_5",90000);
  D.CoachCareer.init(s,D);
  return s;
}

test("ciclo diário encerra propostas, negociações e sondagens vencidas uma única vez",()=>{
  const s=career();
  s.day=100;
  s.coachCareer.negotiations=[{id:"expired-deal",playerId:"p1",status:"pending",expiresDay:99,response:"accepted"}];
  s.coachCareer.saleOffers=[{id:"expired-sale",playerId:"p2",status:"pending",expiresDay:99}];
  s.coachCareer.inquiries=[{id:"expired-inquiry",playerId:"p3",status:"accepted",expiresDay:99}];
  const first=D.CoachCareer.expireMarketItems(s);
  assert.deepEqual(first,{negotiations:1,saleOffers:1,inquiries:1});
  assert.equal(s.coachCareer.negotiations[0].status,"expired");
  assert.equal(s.coachCareer.saleOffers[0].status,"expired");
  assert.equal(s.coachCareer.inquiries[0].status,"expired");
  const news=s.news.length;
  assert.deepEqual(D.CoachCareer.expireMarketItems(s),{negotiations:0,saleOffers:0,inquiries:0});
  assert.equal(s.news.length,news,"não duplica avisos ao recarregar");
});

test("ações rejeitam registros vencidos mesmo antes do próximo avanço diário",()=>{
  const s=career();
  s.day=100;
  s.coachCareer.negotiations=[{id:"expired-deal",buyerClubId:s.clubId,status:"pending",expiresDay:99}];
  s.coachCareer.saleOffers=[{id:"expired-sale",sellerClubId:s.clubId,status:"pending",expiresDay:99}];
  assert.throws(()=>A.execute(s,"rejectCoachDeal",{id:"expired-deal"}),/indisponível/);
  assert.throws(()=>A.execute(s,"rejectSaleOffer",{id:"expired-sale"}),/indisponível/);
});

test("telas e contadores mostram somente negociações realmente ativas",()=>{
  const s=career(),own=D.club(s),seller=D.club(s,"gf_fc27_1");
  if(!Array.isArray(seller.roster))seller.roster=D.GlobalFootball.playersByClub(s,seller.id).slice();
  const [expiredPlayer,activePlayer]=seller.roster.filter(p=>p.id!=="hero").slice(0,2);
  s.day=100;
  s.coachCareer.negotiations=[
    {id:"expired-deal",playerId:expiredPlayer.id,sellerClubId:seller.id,buyerClubId:own.id,status:"pending",response:"accepted",requested:1,finalFee:1,expiresDay:99},
    {id:"active-deal",playerId:activePlayer.id,sellerClubId:seller.id,buyerClubId:own.id,status:"pending",response:"awaiting_reply",requested:1,finalFee:null,replyDay:102,expiresDay:110}
  ];
  View.setMarketArea("transferencias");
  View.setDealTab("propostas");
  const html=View.renderMarket(s,D);
  assert.ok(html.includes(activePlayer.name));
  assert.ok(!html.includes(expiredPlayer.name));
  assert.ok(!html.includes("Prazo vencido"));

  const mobile=Mobile.home(s,{club:()=>own},{c:own,messages:[],competitionTable:{rows:[]},recent:[],events:[]},{esc:String,dayDate:String,money:String});
  assert.match(mobile,/1 negociação aberta/);
});
