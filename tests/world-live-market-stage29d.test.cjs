"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");
const W=require("../src/domain/world-live-market.js");

function state(mode="player",seed=29410){
  const s=D.create({mode,clubId:"c0"},seed);
  D.GlobalFootball.init(s);
  return s;
}

function playerAndDestination(s){
  const player=s.clubs.flatMap(club=>club.roster||[]).find(item=>item.id!=="hero");
  const destination=s.globalFootball.clubs.find(club=>
    club.active!==false&&!club.generated&&club.id!==player.clubId
  );
  assert.ok(player&&destination);
  return {player,destination};
}

function createDeal(s,stateName="rumor"){
  const {player,destination}=playerAndDestination(s);
  return W.createDeal(s,{
    playerId:player.id,
    fromClubId:player.clubId,
    toClubId:destination.id,
    value:16000000,
    salary:72000,
    state:stateName,
  });
}

function storedCopies(s,playerId){
  return [
    ...s.clubs.flatMap(club=>club.roster||[]),
    ...(s.internationalPlayers||[]),
  ].filter(player=>player?.id===playerId);
}

test("29D: avanço de +1 dia processa o mercado mundial exatamente uma vez",()=>{
    const s=state();
    const deal=createDeal(s);
    deal.nextUpdateDay=s.day+1;
    D.advance(s,1);
    assert.equal(s.worldLiveMarket.lastTickDay,s.day);
    assert.equal(deal.state,"scouting");
    assert.equal(s.worldLiveMarket.events.filter(event=>event.dealId===deal.id).length,1);
});

test("29D: avanço de +30 dias equivale a trinta avanços diários",()=>{
    const bulk=state("player",29411);
    const daily=state("player",29411);
    createDeal(bulk).nextUpdateDay=1;
    createDeal(daily).nextUpdateDay=1;
    D.advance(bulk,30);
    for(let day=0;day<30;day++) D.advance(daily,1);
    assert.equal(bulk.worldLiveMarket.lastTickDay,bulk.day);
    assert.deepEqual(bulk.worldLiveMarket,daily.worldLiveMarket);
});

test("29D: avanço até o próximo jogo não duplica negociações",()=>{
    const s=state("player",29412);
    const deal=createDeal(s);
    deal.nextUpdateDay=s.day+1;
    D.simulateAdvance(s,"nextMatch");
    assert.equal(s.worldLiveMarket.lastTickDay,s.day);
    assert.equal(new Set(W.getDeals(s).map(item=>item.id)).size,W.getDeals(s).length);
    assert.ok(W.getDeals(s).length>0);
});

test("29D: avanço até o fim da temporada preserva histórico mundial",()=>{
  const s=state("player",29418);
  const deal=createDeal(s,"rejected");
  s.day=364;
  s.worldLiveMarket.lastTickDay=364;
  D.advance(s,1);
  assert.equal(s.season,2027);
  assert.equal(W.getDeal(s,deal.id).state,"rejected");
  assert.equal(s.worldLiveMarket.lastTickDay,s.day);
});

test("29D: calendário automático respeita janelas abertas e fechadas",()=>{
    const s=state("player",29413);
    s.day=100;
    const deal=createDeal(s,"negotiating");
    deal.nextUpdateDay=s.day+1;
    D.advance(s,1);
    assert.equal(deal.state,"negotiating");
    D.advance(s,30);
    assert.equal(s.worldLiveMarket.lastTickDay,s.day);
    while(s.day<181) D.advance(s,Math.min(30,181-s.day));
    assert.equal(deal.state,"offer");
});

test("29D: transferência efetivada atualiza o elenco real",()=>{
  const s=state("player",29414);
  const deal=createDeal(s,"completed");
  const result=W.executeCompleted(s);
  assert.deepEqual(result.executed,[deal.id]);
  assert.equal(D.GlobalFootball.playerById(s,deal.playerId).clubId,deal.toClubId);
  assert.equal(storedCopies(s,deal.playerId).length,1);
});

test("29D: save/reload não repete transferência efetivada",()=>{
  const s=state("player",29415);
  const deal=createDeal(s,"completed");
  W.executeCompleted(s);
  const restored=Save.parse(JSON.stringify(s));
  const before=D.GlobalFootball.playerById(restored,deal.playerId).clubHistory.length;
  const result=W.executeCompleted(restored);
  assert.deepEqual(result.executed,[]);
  assert.equal(D.GlobalFootball.playerById(restored,deal.playerId).clubHistory.length,before);
  assert.equal(restored.worldLiveMarket.events.filter(event=>event.operationId===deal.operationId).length,1);
  assert.equal(storedCopies(restored,deal.playerId).length,1);
});

test("29D: mercado antigo e mercado mundial não duplicam operações",()=>{
  const s=state("player",29419);
  const deal=createDeal(s,"completed");
  const localOffer=s.clubs.find(club=>club.id!==s.clubId);
  s.offers=[{
    clubId:localOffer.id,
    salary:12000,
    expires:s.day+20,
    role:"Rotação",
  }];
  D.advance(s,1);
  assert.equal(s.worldLiveMarket.events.filter(event=>event.operationId===deal.operationId).length,1);
  assert.equal(D.GlobalFootball.playerById(s,deal.playerId).clubHistory.length,1);
  assert.equal(s.clubId,"c0");
});

test("29D: modo Treinador executa o mercado mundial durante o avanço",()=>{
    const s=state("coach",29416);
    const deal=createDeal(s,"completed");
    D.advance(s,1);
    assert.equal(deal.executionStatus,"executed");
    assert.equal(D.GlobalFootball.playerById(s,deal.playerId).clubId,deal.toClubId);
});

test("29D: negociação envolvendo hero nunca é executada automaticamente",()=>{
  const s=state("player",29417);
  const destination=s.globalFootball.clubs.find(club=>club.active!==false&&!club.generated);
  const market=W.init(s);
  const deal={
    id:"legacy_hero_completed",
    playerId:"hero",
    fromClubId:s.clubId,
    toClubId:destination.id,
    value:99999999,
    salary:999999,
    startDay:s.day,
    updatedDay:s.day,
    state:"completed",
  };
  market.deals.push(deal);
  const originalClub=s.clubId;
  const result=W.executeCompleted(s);
  assert.deepEqual(result.executed,[]);
  assert.deepEqual(result.cancelled,[deal.id]);
  assert.equal(deal.executionStatus,"cancelled");
  assert.equal(s.clubId,originalClub);
  assert.equal(s.person.clubId,originalClub);
});

test("29D: avanço gera rumores realistas e moderados nos dois modos",()=>{
  for(const [mode,seed] of [["player",29420],["coach",29421]]){
    const s=state(mode,seed);
    s.day=13;
    s.worldLiveMarket.lastTickDay=13;
    D.advance(s,1);
    const deals=W.getDeals(s);
    assert.ok(deals.length>=1&&deals.length<=2);
    assert.ok(deals.every(deal=>
      deal.state==="rumor"&&
      deal.playerId!=="hero"&&
      Number.isFinite(deal.value)&&deal.value>=0&&
      Number.isFinite(deal.salary)&&deal.salary>=0&&
      D.GlobalFootball.clubById(s,deal.fromClubId)&&
      D.GlobalFootball.clubById(s,deal.toClubId)
    ));
  }
});

test("29D: avanço preserva jogadores e limita crescimento persistente",()=>{
  const s=state("coach",29422);
  const before=new Set(D.GlobalFootball.allPlayers(s).map(player=>player.id));
  D.advance(s,30);
  const after=D.GlobalFootball.allPlayers(s).map(player=>player.id);
  assert.equal(new Set(after).size,after.length);
  assert.deepEqual(new Set(after),before);
  assert.ok(s.worldLiveMarket.deals.length<=200);
  assert.ok(s.worldLiveMarket.events.length<=300);
  assert.equal(s.worldLiveMarket.lastTickDay,s.day);
});
