(function(root){
"use strict";
// PRO-LIFE J03: rivalidades de atleta, núcleo determinístico e isolado.
// Uma rivalidade só pontua estatísticas explicitamente informadas no relatório de partida.
// A integração com os resultados reais da simulação será feita separadamente.
const VERSION=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const integer=v=>Math.max(0,Math.floor(Number(v)||0));
const OBJECTIVES=Object.freeze({
  goals:Object.freeze({id:"goals",label:"Mais gols nas próximas 5 partidas",field:"goals"}),
  assists:Object.freeze({id:"assists",label:"Mais assistências nas próximas 5 partidas",field:"assists"}),
  cleanSheets:Object.freeze({id:"cleanSheets",label:"Mais jogos sem sofrer gols nas próximas 5 partidas",field:"cleanSheets"}),
  hatTrick:Object.freeze({id:"hatTrick",label:"Quem marcar um hat-trick primeiro",field:"goals",kind:"firstAchievement",threshold:3})
});
function objectiveFor(position){
  const p=String(position||"").toUpperCase();
  return p==="GOL"||p==="DEF"||p==="ZAG"||p==="LD"||p==="LE" ? OBJECTIVES.cleanSheets
    : p==="MEI"||p==="MC"||p==="VOL" ? OBJECTIVES.assists : OBJECTIVES.goals;
}
function initial({season,clubId,playerId="hero",rivalId,position,maxMatches=5,objectiveId}={}){
  if(!rivalId||String(rivalId)===String(playerId))throw Error("Rival precisa ser outro atleta.");
  const objective=objectiveId ? OBJECTIVES[objectiveId] : objectiveFor(position);
  if(!objective)throw Error("Objetivo de rivalidade desconhecido.");
  return {version:VERSION,season:integer(season),clubId:String(clubId||""),playerId:String(playerId),rivalId:String(rivalId),
    objectiveId:objective.id,targetMatches:clamp(Math.floor(maxMatches),1,20)||5,
    progress:0,hero:0,rival:0,result:"active",processed:[]};
}
function record(state,match){
  if(!state||state.version!==VERSION||state.result!=="active")return state;
  if(!match||match.id===null||match.id===undefined)throw Error("Partida precisa de identificador.");
  const id=String(match.id);
  if(state.processed.includes(id))return state;
  if(match.played!==true)return state;
  const objective=OBJECTIVES[state.objectiveId];
  if(!objective)throw Error("Objetivo desconhecido.");
  const heroValue=integer(match.hero?.[objective.field]);
  const rivalValue=integer(match.rival?.[objective.field]);
  const next={...state,processed:[...state.processed,id],progress:state.progress+1,
    hero:state.hero+heroValue,rival:state.rival+rivalValue};
  if(objective.kind==="firstAchievement"){
    const heroAchieved=heroValue>=objective.threshold;
    const rivalAchieved=rivalValue>=objective.threshold;
    if(heroAchieved||rivalAchieved)next.result=heroAchieved&&rivalAchieved?"draw":heroAchieved?"win":"loss";
  }else if(next.progress>=next.targetMatches){
    next.result=next.hero>next.rival?"win":next.hero<next.rival?"loss":"draw";
  }
  if(next.result==="active"&&next.progress>=next.targetMatches)next.result="unfinished";
  return next;
}
function reward(state){
  if(!state||state.result==="active")return 0;
  return state.result==="win"?100:state.result==="draw"?50:state.result==="loss"?0:0;
}
const api=Object.freeze({VERSION,OBJECTIVES,objectiveFor,initial,record,reward});
root.ProLifePlayerRivalries=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
