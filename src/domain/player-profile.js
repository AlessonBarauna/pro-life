(function(root){
  "use strict";
  const categoryDefs = [
    ["Ritmo", ["pace","acceleration","sprint"]],
    ["Finalização", ["finish","powerShot","longShot","finesseShot","heading","penalty","freeKick","positioning","composure"]],
    ["Passe", ["pass","longPass","crossing","vision","technique"]],
    ["Drible", ["dribbling","ballControl","agility","balance","composure"]],
    ["Físico", ["strength","stamina","jumping","balance"]],
    ["Defesa", ["defense","interception","tackling","positioning"]],
  ];
  function init(s,D){
    const p=s.person, career=D.Career.init(s), pc=career.playerCareer||{}, plan=D.Training.init(s), stats=D.Statistics.heroDashboard(s), club=D.club(s);
    const overall=D.overall(p), dev=Array.isArray(s.development)?s.development:[];
    const seasonDev=dev.filter(x=>x.season===s.season), seasonStart=seasonDev[0]||dev[0]||null;
    const history=[];
    for(const row of dev){
      const key=String(row.season ?? Math.floor((row.day||0)/365));
      const existing=history.find(x=>x.key===key);
      if(!existing) history.push({key,season:row.season??null,start:row.overall,end:row.overall,day:row.day});
      else { existing.end=row.overall; existing.day=row.day; }
    }
    if(!history.length || history.at(-1).end!==overall) history.push({key:"current",season:s.season,start:seasonStart?.overall??overall,end:overall,day:s.day,current:true});
    else history.at(-1).current=true;
    const baseline=seasonStart?.attrs||p.attrs;
    const gains=Object.keys(p.attrs||{}).map(key=>({key,label:D.Training.skills[key]||D.labels[key]||key,from:Number(baseline[key]??p.attrs[key]),to:Number(p.attrs[key])})).filter(x=>x.to!==x.from).sort((a,b)=>(b.to-b.from)-(a.to-a.from)).slice(0,6);
    const categories=categoryDefs.filter(([name])=>name!=="Goleiro").map(([name,keys])=>({name,items:keys.filter(k=>Number.isFinite(p.attrs?.[k])).map(k=>({key:k,label:D.Training.skills[k]||D.labels[k]||k,value:p.attrs[k]}))})).filter(x=>x.items.length);
    if(p.pos==="GOL") categories.push({name:"Goleiro",items:["positioning","composure","jumping","longPass"].filter(k=>Number.isFinite(p.attrs?.[k])).map(k=>({key:k,label:D.Training.skills[k]||k,value:p.attrs[k]}))});
    const ct=pc.contract||null, remaining=ct?Math.max(0,ct.endDay-s.day):0;
    const careerSeasons=stats.seasons||[], stints=stats.stints||[];
    const clubs=[...new Set(stints.map(x=>x.club).filter(Boolean))];
    const awards=(s.statistics?.awards||[]).filter(a=>a?.winner?.id==="hero"||a?.playerId==="hero"||a?.id==="hero").length;
    const xp=Number(plan.developmentXp||0), level=Number(plan.level||1);
    const nextXp=level>=50?xp:D.Training.xpForLevel(level+1);
    const archetypeXp=Number(plan.archetypeXp||0), archetypeLevel=Number(plan.archetypeLevel||1);
    return {
      identity:{name:p.name,number:career.number,club:club?.name||"Sem clube",position:p.pos,age:p.age,nationality:p.nationality||null,overall,marketValue:pc.marketValue||0,salary:s.salary||0,squadRole:pc.squadRole||ct?.role||null,form:pc.form??null,condition:p.condition,morale:p.morale,origin:p.originName||null,style:p.style||null},
      season:stats.season, careerStats:stats.career, national:stats.national,
      archetype:{...(plan.archetype||{}),specializations:(plan.specializations||[]).map(id=>D.Training.specializations[id]).filter(Boolean)},
      development:{overall,seasonStart:seasonStart?.overall??overall,seasonGrowth:overall-(seasonStart?.overall??overall),level,xp,nextXp,archetypeXp,archetypeLevel,attributePoints:Number(plan.attributePoints||0),potential:Number(p.potential||0),gains,history},
      attributes:categories,
      contract:ct?{club:club?.name||"—",salary:s.salary||ct.salary||0,signedDay:ct.signedDay,endDay:ct.endDay,remainingDays:remaining,role:ct.role||pc.squadRole,type:ct.type||"permanent"}:null,
      career:{clubs,seasons:careerSeasons.length||Math.max(1,new Set(stints.map(x=>x.season)).size),awards,stints,transfers:(s.extras?.transfers||[]).filter(x=>x.playerId==="hero"||x.id==="hero"||x.player?.id==="hero")}
    };
  }
  const api={init,categoryDefs}; root.ProLifePlayerProfile=api; if(typeof module!=="undefined"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
