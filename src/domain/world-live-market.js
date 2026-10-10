(function(root){
  "use strict";

  const GF=
    root.ProLifeGlobalFootball ||
    (typeof require==="function" ? require("./global-football.js") : null);
  const Career=
    root.ProLifeCareer ||
    (typeof require==="function" ? require("./career.js") : null);
  const VERSION=1;
  const HISTORY_LIMIT=200;
  const EVENT_LIMIT=300;
  const MAX_ACTIVE=40;
  const STATES=new Set([
    "rumor",
    "scouting",
    "negotiating",
    "offer",
    "completed",
    "rejected",
    "cancelled",
  ]);
  const ACTIVE_STATES=new Set(["rumor","scouting","negotiating","offer"]);
  const NEXT_STATE={rumor:"scouting",scouting:"negotiating",negotiating:"offer"};
  const DEADLINES={
    rumor:[2,5],
    scouting:[3,7],
    negotiating:[2,6],
    offer:[2,5],
  };

  function hash(value){
    let h=2166136261;
    for(const ch of String(value)){
      h^=ch.charCodeAt(0);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  }

  function trimHistory(market){
    while(market.deals.length>HISTORY_LIMIT){
      const index=market.deals.findIndex(deal=>!ACTIVE_STATES.has(deal.state));
      if(index<0) break;
      market.deals.splice(index,1);
    }
  }

  function deadline(deal,state=deal.state,day=deal.updatedDay){
    const range=DEADLINES[state];
    if(!range) return null;
    const span=range[1]-range[0]+1;
    return day+range[0]+hash(`${deal.id}|${state}|${day}`)%span;
  }

  function init(s){
    if(!s||typeof s!=="object") throw Error("Estado de carreira inválido.");
    if(!s.worldLiveMarket||typeof s.worldLiveMarket!=="object"){
      s.worldLiveMarket={version:VERSION,sequence:0,deals:[]};
    }
    const market=s.worldLiveMarket;
    market.version=VERSION;
    if(!Number.isInteger(market.sequence)||market.sequence<0) market.sequence=0;
    if(!Array.isArray(market.deals)) market.deals=[];
    if(!Array.isArray(market.events)) market.events=[];
    if(!Number.isInteger(market.lastTickDay)||market.lastTickDay<0){
      market.lastTickDay=Number.isInteger(s.day)&&s.day>=0?s.day:0;
    }

    const ids=new Set();
    const activePlayers=new Set();
    market.deals=market.deals.filter(deal=>{
      if(!deal||typeof deal.id!=="string"||!deal.id||ids.has(deal.id)) return false;
      if(ACTIVE_STATES.has(deal.state)){
        if(activePlayers.has(deal.playerId)) return false;
        activePlayers.add(deal.playerId);
        if(!Number.isInteger(deal.nextUpdateDay)||deal.nextUpdateDay<deal.updatedDay){
          deal.nextUpdateDay=deadline(deal);
        }
      }
      ids.add(deal.id);
      return true;
    });
    const eventIds=new Set();
    market.events=market.events.filter(event=>
      event&&typeof event.id==="string"&&!eventIds.has(event.id)&&eventIds.add(event.id)
    ).slice(-EVENT_LIMIT);
    trimHistory(market);
    return market;
  }

  function realActiveClub(s,id){
    GF?.init?.(s);
    if(typeof id!=="string"||!id) return null;
    const matches=[
      ...(s.clubs||[]),
      ...(s.globalFootball?.clubs||[]),
    ].filter(club=>club?.id===id);
    if(matches.length!==1) return null;
    const club=GF?.clubById?.(s,id);
    if(!club||club.active===false||club.generated===true) return null;
    return club;
  }

  function finiteMoney(value,label){
    const amount=Number(value);
    if(!Number.isFinite(amount)||amount<0) throw Error(`${label} inválido.`);
    return amount;
  }

  function careerDay(value,label){
    const day=Number(value);
    if(!Number.isInteger(day)||day<0) throw Error(`${label} inválido.`);
    return day;
  }

  function createDeal(s,input={}){
    const market=init(s);
    GF?.init?.(s);
    const player=GF?.playerById?.(s,input.playerId);
    if(
      !player ||
      player.id==="hero" ||
      player.status==="retired" ||
      player.active===false
    ) throw Error("Jogador inválido ou indisponível.");

    const fromClubId=input.fromClubId||player.clubId;
    const toClubId=input.toClubId||input.destinationClubId;
    if(!realActiveClub(s,fromClubId)||!realActiveClub(s,toClubId)){
      throw Error("Clube inválido ou inativo.");
    }
    if(player.clubId!==fromClubId) throw Error("Clube de origem incompatível.");
    if(fromClubId===toClubId) throw Error("Destino deve ser diferente da origem.");
    const state=input.state||"rumor";
    if(!STATES.has(state)) throw Error("Estado de negociação inválido.");
    if(ACTIVE_STATES.has(state)&&market.deals.some(deal=>
      deal.playerId===player.id&&ACTIVE_STATES.has(deal.state)
    )) throw Error("Jogador já possui negociação ativa.");
    if(
      ACTIVE_STATES.has(state) &&
      market.deals.filter(deal=>ACTIVE_STATES.has(deal.state)).length>=MAX_ACTIVE
    ) throw Error("Limite de negociações ativas atingido.");

    const startDay=careerDay(input.startDay??s.day??0,"Data inicial");
    const updatedDay=careerDay(input.updatedDay??startDay,"Última atualização");
    if(updatedDay<startDay) throw Error("Última atualização inválida.");
    const value=finiteMoney(input.value,"Valor");
    const salary=finiteMoney(input.salary,"Salário");

    let id;
    do{
      const sequence=market.sequence++;
      const key=[player.id,fromClubId,toClubId,startDay,sequence].join("|");
      id=`wlm_${hash(key).toString(36)}_${sequence.toString(36)}`;
    }while(market.deals.some(deal=>deal.id===id));

    const deal={
      id,
      playerId:player.id,
      fromClubId,
      toClubId,
      value,
      salary,
      startDay,
      updatedDay,
      state,
    };
    if(ACTIVE_STATES.has(state)) deal.nextUpdateDay=deadline(deal);
    market.deals.push(deal);
    trimHistory(market);
    return deal;
  }

  function getDeals(s,filters={}){
    return init(s).deals.filter(deal=>
      (!filters.playerId||deal.playerId===filters.playerId) &&
      (!filters.clubId||deal.fromClubId===filters.clubId||deal.toClubId===filters.clubId) &&
      (!filters.state||deal.state===filters.state)
    );
  }

  function getDeal(s,id){
    return init(s).deals.find(deal=>deal.id===id)||null;
  }

  function windowOpen(s,day,options){
    if(typeof options?.windowOpen==="function"){
      return options.windowOpen(day,s)===true;
    }
    if(Career?.windowStatus){
      return Career.windowStatus({...s,day}).open===true;
    }
    const annual=day%365;
    return annual<=58||(annual>=181&&annual<=242)||annual>=318;
  }

  function validDeal(s,deal){
    const player=GF?.playerById?.(s,deal.playerId);
    return !!(
      player &&
      player.id!=="hero" &&
      player.status!=="retired" &&
      player.active!==false &&
      player.clubId===deal.fromClubId &&
      realActiveClub(s,deal.fromClubId) &&
      realActiveClub(s,deal.toClubId) &&
      deal.fromClubId!==deal.toClubId &&
      Number.isFinite(deal.value) && deal.value>=0 &&
      Number.isFinite(deal.salary) && deal.salary>=0 &&
      Number.isInteger(deal.startDay) && deal.startDay>=0 &&
      Number.isInteger(deal.updatedDay) && deal.updatedDay>=deal.startDay
    );
  }

  function recordEvent(market,deal,day){
    const id=`${deal.id}:${day}:${deal.state}`;
    if(market.events.some(event=>event.id===id)) return;
    market.events.push({id,dealId:deal.id,day,state:deal.state});
    market.events=market.events.slice(-EVENT_LIMIT);
  }

  function recordExecutionEvent(market,deal,day,status,operationId=null){
    const id=operationId||`${deal.id}:execution:${status}:${day}`;
    if(market.events.some(event=>event.id===id)) return;
    market.events.push({
      id,
      type:status==="executed"?"transfer-executed":"transfer-cancelled",
      dealId:deal.id,
      operationId,
      day,
      playerId:deal.playerId,
      fromClubId:deal.fromClubId,
      toClubId:deal.toClubId,
      value:deal.value,
      salary:deal.salary,
    });
    market.events=market.events.slice(-EVENT_LIMIT);
  }

  function finalState(rng,deal,day){
    const fallback=hash(`${deal.id}|outcome|${day}`)/4294967296;
    const sampled=typeof rng?.next==="function"?Number(rng.next()):fallback;
    const roll=Number.isFinite(sampled)&&sampled>=0&&sampled<1?sampled:fallback;
    return roll<0.72?"completed":roll<0.9?"rejected":"cancelled";
  }

  function tick(s,rng,options={}){
    const market=init(s);
    const currentDay=careerDay(s.day,"Dia da carreira");
    if(currentDay<=market.lastTickDay){
      return {processedDays:0,transitions:[]};
    }
    const transitions=[];
    const firstDay=market.lastTickDay+1;
    for(let day=firstDay;day<=currentDay;day++){
      for(const deal of market.deals){
        if(!ACTIVE_STATES.has(deal.state)) continue;
        if(!validDeal(s,deal)){
          deal.state="cancelled";
          deal.updatedDay=day;
          deal.nextUpdateDay=null;
          recordEvent(market,deal,day);
          transitions.push({dealId:deal.id,day,state:deal.state});
          continue;
        }
        if(day<deal.nextUpdateDay) continue;
        if(
          (deal.state==="negotiating"||deal.state==="offer") &&
          !windowOpen(s,day,options)
        ) continue;

        deal.state=deal.state==="offer"
          ? finalState(rng,deal,day)
          : NEXT_STATE[deal.state];
        deal.updatedDay=day;
        deal.nextUpdateDay=ACTIVE_STATES.has(deal.state)?deadline(deal):null;
        recordEvent(market,deal,day);
        transitions.push({dealId:deal.id,day,state:deal.state});
      }
    }
    market.lastTickDay=currentDay;
    trimHistory(market);
    return {processedDays:currentDay-firstDay+1,transitions};
  }

  function storeTransferredPlayer(s,player,toClubId){
    const localTarget=(s.clubs||[]).find(club=>club.id===toClubId)||null;
    for(const club of s.clubs||[]){
      club.lineup=(club.lineup||[]).filter(id=>id!==player.id);
      const matches=(club.roster||[]).filter(item=>item?.id===player.id);
      if(club===localTarget){
        club.roster=(club.roster||[]).filter(item=>item?.id!==player.id);
        club.roster.push(player);
      }else if(matches.length){
        club.roster=(club.roster||[]).filter(item=>item?.id!==player.id);
      }
    }
    if(!Array.isArray(s.internationalPlayers)) s.internationalPlayers=[];
    s.internationalPlayers=s.internationalPlayers.filter(item=>item?.id!==player.id);
    if(!localTarget) s.internationalPlayers.push(player);
  }

  function cancelExecution(market,deal,day,reason,cancelled){
    deal.executionStatus="cancelled";
    deal.cancelledDay=day;
    deal.cancellationReason=reason;
    deal.updatedDay=day;
    recordExecutionEvent(market,deal,day,"cancelled");
    cancelled.push(deal.id);
  }

  function executeCompleted(s,options={}){
    const market=init(s);
    const day=careerDay(s.day,"Dia da carreira");
    const result={executed:[],cancelled:[],pending:[]};
    for(const deal of market.deals){
      if(deal.state!=="completed") continue;
      if(deal.executionStatus==="executed"||deal.executedDay!==undefined) continue;
      if(deal.executionStatus==="cancelled") continue;
      if(!windowOpen(s,day,options)){
        result.pending.push(deal.id);
        continue;
      }

      const player=GF?.playerById?.(s,deal.playerId);
      if(!player||player.id==="hero"||player.status==="retired"||player.active===false){
        cancelExecution(market,deal,day,"player-unavailable",result.cancelled);
        continue;
      }
      if(!realActiveClub(s,deal.fromClubId)||!realActiveClub(s,deal.toClubId)){
        cancelExecution(market,deal,day,"club-unavailable",result.cancelled);
        continue;
      }
      if(player.clubId!==deal.fromClubId){
        cancelExecution(market,deal,day,"player-moved",result.cancelled);
        continue;
      }

      const transferred=GF?.transferPlayer?.(s,deal.playerId,deal.toClubId);
      if(!transferred||transferred.id!==deal.playerId){
        cancelExecution(market,deal,day,"transfer-failed",result.cancelled);
        continue;
      }
      storeTransferredPlayer(s,transferred,deal.toClubId);
      const operationId=`wlt_${deal.id}_${day.toString(36)}`;
      deal.executionStatus="executed";
      deal.executedDay=day;
      deal.operationId=operationId;
      deal.updatedDay=day;
      recordExecutionEvent(market,deal,day,"executed",operationId);
      result.executed.push(deal.id);
    }
    return result;
  }

  const api={init,createDeal,getDeals,getDeal,tick,executeCompleted};
  root.ProLifeWorldLiveMarket=api;
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
