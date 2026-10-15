(function(root){
"use strict";
// T1: advisory pre-match briefing. No save mutation and no lineup changes.
const Rating=root.ProLifeCoachMatchRating||(typeof require==="function"?require("./coach-match-rating.js"):null);
function analyze(players,slots,selected=[],options={}){
  const roster=Array.isArray(players)?players:[];
  const positions=Array.isArray(slots)?slots:[];
  const chosen=Array.isArray(selected)?selected:[];
  const recommended=Rating.recommendLineup(roster,positions,options);
  const byId=new Map(roster.filter(p=>p&&p.id!=null).map(p=>[String(p.id),p]));
  const concerns=[];
  const lines=positions.map((slot,index)=>{
    const id=chosen[index]??null;
    const player=id==null?null:byId.get(String(id));
    const suggestion=recommended[index];
    if(!player){concerns.push({slot,index,type:"empty",message:"Posicao sem jogador"});return {slot,index,playerId:id,base:null,effective:null,recommendedId:suggestion.playerId};}
    const ctx=typeof options.contextForPlayer==="function"?options.contextForPlayer(player,slot,index):{};
    const rating=Rating.evaluate(player,ctx);
    if(!rating.available)concerns.push({slot,index,type:"injury",message:"Atleta indisponivel"});
    else if(rating.condition<65)concerns.push({slot,index,type:"condition",message:"Condicao fisica baixa"});
    else if(rating.modifier<=-8)concerns.push({slot,index,type:"form",message:"Rendimento abaixo do GER base"});
    if(chosen.slice(0,index).some(previous=>String(previous)===String(id)))concerns.push({slot,index,type:"duplicate",message:"Atleta escalado duas vezes"});
    return {slot,index,playerId:id,base:rating.base,effective:rating.effective,recommendedId:suggestion.playerId,modifier:rating.modifier,contributions:rating.contributions};
  });
  const available=lines.filter(line=>Number.isFinite(line.effective));
  const mean=available.length?Math.round(available.reduce((sum,line)=>sum+line.effective,0)/available.length):null;
  return {lines,recommended,concerns,averageEffective:mean,ready:concerns.length===0&&lines.length>0};
}
const api=Object.freeze({analyze});
root.ProLifeCoachPrematchBriefing=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
