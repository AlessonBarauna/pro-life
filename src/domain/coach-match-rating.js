(function(root){
  "use strict";
  // T1: pure manager-career match rating, never mutates player or save.
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const number=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
  function evaluate(player,context={}){
    const p=player||{};
    const base=clamp(Math.round(number(p.overall??p.ger??p.ovr,50)),1,100);
    const form=clamp(number(context.form??p.form,50),0,100);
    const morale=clamp(number(context.morale??p.morale,50),0,100);
    const condition=clamp(number(context.condition??p.condition,100),0,100);
    const fatigue=clamp(number(context.fatigue??p.physical?.fatigue,0),0,100);
    const fit=clamp(number(context.tacticalFit,100),0,100);
    const outOfPosition=Boolean(context.outOfPosition);
    const injury=Boolean(context.injured??p.injured);
    const contributions=[
      {id:"form",label:"Forma recente",value:Math.round((form-50)*.10)},
      {id:"morale",label:"Moral",value:Math.round((morale-50)*.06)},
      {id:"condition",label:"Condicao fisica",value:-Math.round((100-condition)*.10)},
      {id:"fatigue",label:"Desgaste",value:-Math.round(fatigue*.06)},
      {id:"tactical",label:"Encaixe tatico",value:-Math.round((100-fit)*.08)},
      {id:"position",label:"Fora de posicao",value:outOfPosition?-6:0},
      {id:"injury",label:"Lesao",value:injury?-12:0}
    ];
    const modifier=contributions.reduce((sum,x)=>sum+x.value,0);
    return {base,effective:clamp(base+modifier,1,100),modifier,contributions,available:!injury,condition,form,morale};
  }
  function evaluateRoster(players,contextForPlayer){
    if(!Array.isArray(players))return [];
    return players.map((player,index)=>{
      const context=typeof contextForPlayer==="function"?contextForPlayer(player,index):contextForPlayer||{};
      const rating=evaluate(player,context);
      return {id:player?.id??null,index,...rating};
    });
  }
  function recovery(player,{days=1,trainingLoad=0,playedMinutes=0}={}){
    const p=player||{};
    const oldCondition=clamp(number(p.condition,100),0,100);
    const oldFatigue=clamp(number(p.physical?.fatigue,0),0,100);
    const n=clamp(Math.floor(number(days,1)),0,30);
    const load=clamp(number(trainingLoad,0),0,100);
    const minutes=clamp(number(playedMinutes,0),0,120);
    const gain=Math.round(n*(8-load*.04));
    const exertion=Math.round(minutes*.18);
    return {
      condition:clamp(oldCondition+gain-exertion,0,100),
      fatigue:clamp(oldFatigue-n*10+Math.round(load*.07)+Math.round(minutes*.25),0,100),
      days:n
    };
  }
  const api=Object.freeze({evaluate,evaluateRoster,recovery});
  root.ProLifeCoachMatchRating=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
