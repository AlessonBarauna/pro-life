"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");
const W=require("../src/domain/world-live-market.js");

const BASE=D.create({mode:"player",clubId:"c0"},29310);

function state(){
  const s=structuredClone(BASE);
  D.GlobalFootball.init(s);
  return s;
}

function parties(s){
  const player=D.GlobalFootball.activePlayers(s).find(item=>
    item.id!=="hero"&&item.clubId&&D.GlobalFootball.clubById(s,item.clubId)
  );
  const destination=s.globalFootball.clubs.find(club=>
    club.id!==player.clubId&&club.active!==false&&!club.generated
  );
  assert.ok(player&&destination);
  return {player,destination};
}

function terms(s,overrides={}){
  const {player,destination}=parties(s);
  return {
    playerId:player.id,
    fromClubId:player.clubId,
    toClubId:destination.id,
    value:18000000,
    salary:85000,
    startDay:s.day,
    ...overrides,
  };
}

function rosterSnapshot(s){
  return JSON.stringify({
    local:s.clubs.map(club=>club.roster.map(player=>player.id)),
    international:s.internationalPlayers.map(player=>[player.id,player.clubId]),
  });
}

function storedCopies(s,playerId){
  return [
    ...s.clubs.flatMap(club=>club.roster||[]),
    ...(s.internationalPlayers||[]),
  ].filter(player=>player?.id===playerId);
}

function localPlayer(s){
  return s.clubs.flatMap(club=>club.roster||[]).find(player=>player.id!=="hero");
}

function globalPlayer(s){
  return s.internationalPlayers.find(player=>
    player.id!=="hero"&&player.clubId&&D.GlobalFootball.clubById(s,player.clubId)
  );
}

function completedDeal(s,player,toClubId){
  return W.createDeal(s,{
    playerId:player.id,
    fromClubId:player.clubId,
    toClubId,
    value:24000000,
    salary:110000,
    state:"completed",
  });
}

test("29C: init cria estrutura mínima compatível com save antigo",()=>{
  const s=state();
  delete s.worldLiveMarket;
  assert.deepEqual(W.init(s),{
    version:1,
    sequence:0,
    deals:[],
    events:[],
    lastTickDay:s.day,
  });
  assert.equal("clubs" in s.worldLiveMarket,false);
  assert.equal("players" in s.worldLiveMarket,false);
});

test("29C: IDs são únicos e determinísticos para o mesmo estado",()=>{
  const a=state(),b=state();
  const firstA=W.createDeal(a,terms(a,{state:"completed"}));
  const firstB=W.createDeal(b,terms(b,{state:"completed"}));
  const secondA=W.createDeal(a,terms(a,{state:"rejected"}));
  const secondB=W.createDeal(b,terms(b,{state:"rejected"}));
  assert.equal(firstA.id,firstB.id);
  assert.equal(secondA.id,secondB.id);
  assert.notEqual(firstA.id,secondA.id);
});

test("29C: negócio armazena campos e consultas filtram jogador, clube e estado",()=>{
  const s=state();
  const data=terms(s,{state:"scouting",updatedDay:s.day+2});
  const deal=W.createDeal(s,data);
  assert.deepEqual(deal,{
    id:deal.id,
    playerId:data.playerId,
    fromClubId:data.fromClubId,
    toClubId:data.toClubId,
    value:data.value,
    salary:data.salary,
    startDay:data.startDay,
    updatedDay:data.updatedDay,
    state:"scouting",
    nextUpdateDay:deal.nextUpdateDay,
  });
  assert.equal(W.getDeal(s,deal.id),deal);
  assert.deepEqual(W.getDeals(s,{playerId:data.playerId}),[deal]);
  assert.deepEqual(W.getDeals(s,{clubId:data.toClubId}),[deal]);
  assert.deepEqual(W.getDeals(s,{state:"scouting"}),[deal]);
  assert.deepEqual(W.getDeals(s,{state:"offer"}),[]);
});

test("29C: todos os estados previstos são aceitos sem alterar elencos",()=>{
  const states=["rumor","scouting","negotiating","offer","completed","rejected","cancelled"];
  for(const stateName of states){
    const copy=state();
    const before=rosterSnapshot(copy);
    const deal=W.createDeal(copy,terms(copy,{state:stateName}));
    assert.equal(deal.state,stateName);
    assert.equal(rosterSnapshot(copy),before);
  }
});

test("29C: clubes inexistentes, gerados, inativos ou duplicados são rejeitados",()=>{
  const missing=state();
  assert.throws(()=>W.createDeal(missing,terms(missing,{toClubId:"gf_inexistente"})),/Clube inválido/);

  for(const kind of ["generated","inactive","duplicate"]){
    const s=state();
    const data=terms(s);
    const club=s.globalFootball.clubs.find(item=>item.id===data.toClubId);
    if(kind==="generated") club.generated=true;
    if(kind==="inactive") club.active=false;
    if(kind==="duplicate") s.globalFootball.clubs.push(structuredClone(club));
    assert.throws(()=>W.createDeal(s,data),/Clube inválido/);
  }
});

test("29C: jogador inativo e hero não entram em negociação automática",()=>{
  const s=state();
  const data=terms(s);
  assert.throws(()=>W.createDeal(s,{...data,playerId:"hero"}),/Jogador inválido/);
  const player=D.GlobalFootball.playerById(s,data.playerId);
  player.status="retired";
  player.active=false;
  assert.throws(()=>W.createDeal(s,data),/Jogador inválido/);
});

test("29C: apenas uma negociação ativa pode existir por jogador",()=>{
  const s=state();
  const data=terms(s);
  W.createDeal(s,data);
  assert.throws(()=>W.createDeal(s,{...data,state:"offer"}),/negociação ativa/);
  assert.equal(W.getDeals(s,{playerId:data.playerId}).length,1);
});

test("29C: serialização e reload preservam negócio sem duplicação",()=>{
  const s=state();
  const deal=W.createDeal(s,terms(s,{state:"offer"}));
  const restored=Save.parse(JSON.stringify(s));
  W.init(restored);
  assert.equal(W.getDeals(restored).length,1);
  assert.deepEqual(W.getDeal(restored,deal.id),deal);
  W.init(restored);
  assert.equal(W.getDeals(restored).length,1);
});

test("29C: histórico é limitado sem remover negociações ativas",()=>{
  const s=state();
  const active=W.createDeal(s,terms(s));
  const terminalTerms=terms(s);
  for(let index=0;index<205;index++){
    W.createDeal(s,{...terminalTerms,state:"completed",startDay:s.day+index});
  }
  assert.equal(W.getDeals(s).length,200);
  assert.equal(W.getDeal(s,active.id),active);
  assert.equal(W.getDeals(s,{state:"completed"}).length,199);
});

test("29C.2: tick progride por dia e é idempotente no mesmo dia",()=>{
  const s=state();
  s.day=60;
  const deal=W.createDeal(s,terms(s));
  s.day=deal.nextUpdateDay;
  const first=W.tick(s,new D.Random(1));
  assert.equal(deal.state,"scouting");
  assert.equal(first.transitions.length,1);
  const snapshot=JSON.stringify(s.worldLiveMarket);
  let calls=0;
  const repeated=W.tick(s,{next(){calls++;return 0;}});
  assert.equal(repeated.processedDays,0);
  assert.equal(calls,0);
  assert.equal(JSON.stringify(s.worldLiveMarket),snapshot);
});

test("29C.2: observação avança fora da janela, mas oferta e acordo aguardam abertura",()=>{
  const s=state();
  s.day=60;
  const deal=W.createDeal(s,terms(s));
  s.day=deal.nextUpdateDay;
  W.tick(s,new D.Random(2));
  s.day=deal.nextUpdateDay;
  W.tick(s,new D.Random(2));
  assert.equal(deal.state,"negotiating");
  s.day=deal.nextUpdateDay;
  W.tick(s,new D.Random(2));
  assert.equal(deal.state,"negotiating");
  s.day=181;
  W.tick(s,new D.Random(2));
  assert.equal(deal.state,"offer");
  s.day=deal.nextUpdateDay;
  W.tick(s,{next:()=>0});
  assert.equal(deal.state,"completed");
  assert.equal(D.GlobalFootball.playerById(s,deal.playerId).clubId,deal.fromClubId);
});

test("29C.2: resultados finais são determinísticos e não transferem jogadores",()=>{
  const outcomes=[[0,"completed"],[0.8,"rejected"],[0.95,"cancelled"]];
  for(const [roll,expected] of outcomes){
    const s=state();
    const before=rosterSnapshot(s);
    const deal=W.createDeal(s,terms(s,{state:"offer"}));
    s.day=deal.nextUpdateDay;
    W.tick(s,{next:()=>roll});
    assert.equal(deal.state,expected);
    assert.equal(rosterSnapshot(s),before);
    assert.equal(D.GlobalFootball.playerById(s,deal.playerId).clubId,deal.fromClubId);
  }
});

test("29C.2: negociação inválida é cancelada com evento único",()=>{
  const s=state();
  const deal=W.createDeal(s,terms(s));
  const player=D.GlobalFootball.playerById(s,deal.playerId);
  player.status="retired";
  player.active=false;
  s.day++;
  W.tick(s,new D.Random(3));
  assert.equal(deal.state,"cancelled");
  assert.deepEqual(s.worldLiveMarket.events.map(event=>event.dealId),[deal.id]);
  W.tick(s,new D.Random(3));
  assert.equal(s.worldLiveMarket.events.length,1);
});

test("29C.2: save/reload mantém prazo, eventos e resultado com a mesma seed",()=>{
  const original=state();
  const deal=W.createDeal(original,terms(original,{state:"offer"}));
  const restored=Save.parse(JSON.stringify(original));
  original.day=deal.nextUpdateDay;
  restored.day=deal.nextUpdateDay;
  const a=W.tick(original,new D.Random(29032));
  const b=W.tick(restored,new D.Random(29032));
  assert.deepEqual(b,a);
  assert.deepEqual(restored.worldLiveMarket,original.worldLiveMarket);
});

test("29C.2: limite de negociações ativas evita crescimento excessivo",()=>{
  const s=state();
  const players=D.GlobalFootball.activePlayers(s).filter(player=>
    player.id!=="hero"&&player.clubId&&D.GlobalFootball.clubById(s,player.clubId)
  ).slice(0,41);
  assert.equal(players.length,41);
  const market=W.init(s);
  market.deals=players.slice(0,40).map((player,index)=>({
    id:`existing_${index}`,
    playerId:player.id,
    fromClubId:player.clubId,
    toClubId:s.globalFootball.clubs.find(club=>club.id!==player.clubId).id,
    value:1,
    salary:1,
    startDay:s.day,
    updatedDay:s.day,
    nextUpdateDay:s.day+5,
    state:"rumor",
  }));
  const extra=players[40];
  const destination=s.globalFootball.clubs.find(club=>club.id!==extra.clubId);
  assert.throws(()=>W.createDeal(s,{
    playerId:extra.id,
    fromClubId:extra.clubId,
    toClubId:destination.id,
    value:1,
    salary:1,
  }),/Limite de negociações ativas/);
});

test("29C.3: acordo concluído permanece lógico até execução explícita",()=>{
  const s=state();
  const data=terms(s,{state:"offer"});
  const deal=W.createDeal(s,data);
  const originalClub=data.fromClubId;
  s.day=deal.nextUpdateDay;
  W.tick(s,{next:()=>0});
  assert.equal(deal.state,"completed");
  assert.equal(deal.executedDay,undefined);
  assert.equal(D.GlobalFootball.playerById(s,deal.playerId).clubId,originalClub);
});

test("29C.3: transferência local para global preserva uma única identidade",()=>{
  const s=state();
  const player=localPlayer(s);
  const destination=s.globalFootball.clubs.find(club=>club.active!==false&&!club.generated);
  const identity={id:player.id,name:player.name,potential:player.potential};
  const deal=completedDeal(s,player,destination.id);
  const result=W.executeCompleted(s);
  const moved=D.GlobalFootball.playerById(s,player.id);
  assert.deepEqual(result.executed,[deal.id]);
  assert.equal(moved.clubId,destination.id);
  assert.deepEqual({id:moved.id,name:moved.name,potential:moved.potential},identity);
  assert.equal(storedCopies(s,player.id).length,1);
  assert.equal(s.clubs.flatMap(club=>club.roster).some(item=>item.id===player.id),false);
});

test("29C.3: transferência global para local move o mesmo atleta ao elenco",()=>{
  const s=state();
  const player=globalPlayer(s);
  const destination=s.clubs.find(club=>club.id!==player.clubId);
  const deal=completedDeal(s,player,destination.id);
  W.executeCompleted(s);
  assert.equal(deal.executionStatus,"executed");
  assert.equal(destination.roster.filter(item=>item.id===player.id).length,1);
  assert.equal(s.internationalPlayers.some(item=>item.id===player.id),false);
  assert.equal(storedCopies(s,player.id).length,1);
  assert.equal(D.GlobalFootball.playerById(s,player.id),player);
});

test("29C.3: transferência global para global atualiza clube sem duplicação",()=>{
  const s=state();
  const player=globalPlayer(s);
  const destination=s.globalFootball.clubs.find(club=>
    club.id!==player.clubId&&club.active!==false&&!club.generated
  );
  const origin=player.clubId;
  const deal=completedDeal(s,player,destination.id);
  W.executeCompleted(s);
  assert.equal(deal.fromClubId,origin);
  assert.equal(player.clubId,destination.id);
  assert.equal(D.GlobalFootball.playersByClub(s,origin).some(item=>item.id===player.id),false);
  assert.equal(D.GlobalFootball.playersByClub(s,destination.id).filter(item=>item.id===player.id).length,1);
  assert.equal(storedCopies(s,player.id).length,1);
});

test("29C.3: janela fechada mantém acordo pendente sem executar",()=>{
  const s=state();
  s.day=100;
  const player=globalPlayer(s);
  const destination=s.globalFootball.clubs.find(club=>club.id!==player.clubId);
  const deal=completedDeal(s,player,destination.id);
  const result=W.executeCompleted(s);
  assert.deepEqual(result.pending,[deal.id]);
  assert.equal(deal.executionStatus,undefined);
  assert.equal(player.clubId,deal.fromClubId);
});

test("29C.3: jogador movido ou clube inválido cancela execução com segurança",()=>{
  for(const reason of ["player-moved","club-unavailable"]){
    const s=state();
    const player=globalPlayer(s);
    const destination=s.globalFootball.clubs.find(club=>club.id!==player.clubId);
    const deal=completedDeal(s,player,destination.id);
    if(reason==="player-moved") player.clubId=s.globalFootball.clubs.find(club=>
      club.id!==deal.fromClubId&&club.id!==deal.toClubId
    ).id;
    else destination.active=false;
    const result=W.executeCompleted(s);
    assert.deepEqual(result.cancelled,[deal.id]);
    assert.equal(deal.executionStatus,"cancelled");
    assert.equal(deal.cancellationReason,reason);
    assert.equal(deal.executedDay,undefined);
  }
});

test("29C.3: execução e histórico permanecem únicos após save/reload",()=>{
  const s=state();
  const player=localPlayer(s);
  const destination=s.globalFootball.clubs.find(club=>club.id!==player.clubId);
  const deal=completedDeal(s,player,destination.id);
  W.executeCompleted(s);
  const historyLength=player.clubHistory.length;
  const operationId=deal.operationId;
  const restored=Save.parse(JSON.stringify(s));
  const result=W.executeCompleted(restored);
  const restoredPlayer=D.GlobalFootball.playerById(restored,player.id);
  assert.deepEqual(result.executed,[]);
  assert.equal(W.getDeal(restored,deal.id).operationId,operationId);
  assert.equal(restoredPlayer.clubHistory.length,historyLength);
  assert.equal(storedCopies(restored,player.id).length,1);
  assert.equal(restored.worldLiveMarket.events.filter(event=>event.operationId===operationId).length,1);
});

test("29C.3: evento de execução registra operação e dados financeiros",()=>{
  const s=state();
  const player=globalPlayer(s);
  const destination=s.globalFootball.clubs.find(club=>club.id!==player.clubId);
  const deal=completedDeal(s,player,destination.id);
  W.executeCompleted(s);
  const event=s.worldLiveMarket.events.find(item=>item.operationId===deal.operationId);
  assert.deepEqual(event,{
    id:deal.operationId,
    type:"transfer-executed",
    dealId:deal.id,
    operationId:deal.operationId,
    day:s.day,
    playerId:deal.playerId,
    fromClubId:deal.fromClubId,
    toClubId:deal.toClubId,
    value:deal.value,
    salary:deal.salary,
  });
});
