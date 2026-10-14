(function(root){
  'use strict';
  // 05A4: effects are match-local; never write roles or ratings into career saves.
  const P=root.ProLifePlayerPositions||(typeof require==='function'?require('./player-positions.js'):null);
  const Selection=root.ProLifeSquadPositionSelection||(typeof require==='function'?require('./squad-position-selection.js'):null);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function create(club,players){
    const roles=new Map();
    if(!P||!Selection?.supportsSpecific?.(club?.roster)||!Array.isArray(players))return roles;
    const slots=Selection.formationSlots?.[club?.formation];
    if(!slots||players.length!==11||!players.some(p=>P.group(p?.pos)==='GOL'))return roles;
    // 05A.8: atribuicao global de menor improvisacao (mesma regra da escalacao do treinador).
    const pairs=Selection.assignRoles?.(players,slots);
    if(!pairs)return roles;
    for(const [p,role] of pairs)roles.set(p.id,role);
    return roles;
  }
  function factor(player,roles){
    const role=roles?.get(player?.id);
    return role?(P?.suitability(player,role)?.multiplier??1):1;
  }
  function bestReplacement(candidates,role,overall){
    if(!role||!P)return null;
    const targetGroup=P.group(role);
    const eligible=candidates.filter(p=>P.group(p.pos)===targetGroup);
    return eligible.slice().sort((a,b)=>
      P.positionalOverall(overall(b),b,role)-P.positionalOverall(overall(a),a,role) || String(a.id).localeCompare(String(b.id)))[0]||null;
  }
  function bestExit(players,entrant,roles){
    if(!P||!roles?.size)return -1;
    const group=P.group(entrant.pos);
    let best=-1,score=-Infinity;
    for(let i=0;i<players.length;i++){
      const role=roles.get(players[i].id);
      if(!role||role==='GOL'||P.group(role)!==group)continue;
      const s=P.suitability(entrant,role)?.multiplier??0;
      if(s>score){score=s;best=i;}
    }
    return best;
  }
  const api={create,factor,bestReplacement,bestExit};
  root.ProLifeMatchPositionEffects=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
