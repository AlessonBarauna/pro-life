(function(root){
  "use strict";

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const finite=value=>Number.isFinite(Number(value));

  function baseOverall(player,context){
    const calculate=typeof context?.baseOverall==="function"
      ? context.baseOverall
      : typeof context?.overall==="function"
        ? context.overall
        : root.ProLife?.overall;
    const value=calculate ? calculate(player) : (player?.overall ?? player?.ovr);
    if(!finite(value)) throw new TypeError("GER base indisponível para o jogador.");
    return clamp(Number(value),1,100);
  }

  function recentForm(state,player,context){
    if(finite(context?.form)) return clamp(Number(context.form),1,10);
    const id=player?.id;
    const ratings=(state?.matches||[])
      .filter(match=>id&&finite(match?.ratings?.[id]))
      .slice(0,5)
      .map(match=>Number(match.ratings[id]));
    if(ratings.length) return ratings.reduce((sum,value)=>sum+value,0)/ratings.length;
    if(finite(player?.form)) return clamp(Number(player.form),1,10);
    if(id==="hero"&&finite(state?.extras?.playerCareer?.lastEvaluation?.rating))
      return clamp(Number(state.extras.playerCareer.lastEvaluation.rating),1,10);
    return 6.5;
  }

  function currentOverall(state,player,context={}){
    if(!player||typeof player!=="object") throw new TypeError("Jogador inválido.");
    const base=baseOverall(player,context);
    const form=recentForm(state,player,context);
    const morale=finite(player.morale)?clamp(Number(player.morale),0,100):70;
    const physical=player.physical&&typeof player.physical==="object"?player.physical:null;
    const fitness=finite(physical?.fitness)
      ? clamp(Number(physical.fitness),0,100)
      : finite(player.condition)
        ? clamp(Number(player.condition),0,100)
        : 100;
    // Quando existe o estado físico detalhado, usa fitness (não condition, que já
    // incorpora fadiga em Physical.sync) e aplica a fadiga uma única vez.
    const fatigue=physical&&finite(physical.fatigue)?clamp(Number(physical.fatigue),0,100):0;
    const hero=player.id==="hero"&&state?.mode!=="coach";
    const trust=hero&&finite(context.coachTrust)
      ? clamp(Number(context.coachTrust),0,100)
      : hero&&finite(state?.extras?.playerCareer?.coachTrust)
        ? clamp(Number(state.extras.playerCareer.coachTrust),0,100)
        : 50;

    const formDelta=clamp((form-6.5)*.7,-2.5,2.5);
    const moraleDelta=clamp((morale-70)*.05,-2,1.5);
    const trustDelta=hero?clamp((trust-50)*.025,-1.25,1.25):0;
    const fitnessPenalty=clamp((100-fitness)*.045,0,3.5);
    const fatiguePenalty=clamp(fatigue*.025,0,2.5);
    const physicalDelta=-clamp(fitnessPenalty+fatiguePenalty,0,4.5);
    const injured=Number(player.injury)>0||!!physical?.active;
    const injuryDelta=injured?-4:0;
    const total=clamp(formDelta+moraleDelta+trustDelta+physicalDelta+injuryDelta,-10,5);
    return clamp(Math.round(base+total),1,100);
  }

  const api={currentOverall};
  root.ProLifeCurrentOverall=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
