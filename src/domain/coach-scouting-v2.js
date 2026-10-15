(function(root){
"use strict";
// T2 scouting missions: deterministic progression, persisted only in coach saves.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
function state(save){
 if(save?.mode!=="coach")return null;
 const c=save.coachCareer||(save.coachCareer={});
 const o=c.scoutingV2||(c.scoutingV2={version:1,nextId:1,missions:[]});
 if(!Array.isArray(o.missions))o.missions=[];
 if(!Number.isInteger(o.nextId)||o.nextId<1)o.nextId=1;
 return o;
}
function start(save,{playerId,region="Brasil",duration=14,scoutQuality=50,cost=0}={}){
 const s=state(save);if(!s)return {ok:false,error:"Somente treinador"};
 if(playerId===undefined||playerId===null||String(playerId).length===0)return {ok:false,error:"Jogador obrigatorio"};
 const day=Math.floor(num(save.day,0));
 const d=clamp(Math.floor(num(duration,14)),3,60);
 const fee=Math.max(0,Math.floor(num(cost,0)));
 if(s.missions.some(m=>m.playerId===String(playerId)&&m.status==="active"))return {ok:false,error:"Jogador ja observado"};
 const club=(save.clubs||[]).find(c=>String(c.id)===String(save.clubId));
 if(!club)return {ok:false,error:"Clube indisponivel"};
 if(fee>num(club.budget,0))return {ok:false,error:"Orcamento insuficiente"};
 if(fee)club.budget-=fee;
 const mission={id:s.nextId++,playerId:String(playerId),region:String(region).slice(0,60),startDay:day,duration:d,quality:clamp(Math.round(num(scoutQuality,50)),1,100),cost:fee,status:"active",progress:0,lastDay:day};
 s.missions.push(mission);
 return {ok:true,mission};
}
function advance(save){
 const s=state(save);if(!s)return [];
 const now=Math.floor(num(save.day,0));
 const changed=[];
 for(const m of s.missions){
  if(m.status!=="active"||now<=m.lastDay)continue;
  m.lastDay=now;m.progress=clamp((now-m.startDay)/m.duration,0,1);
  if(m.progress>=1)m.status="complete";
  changed.push({id:m.id,status:m.status,progress:m.progress});
 }
 return changed;
}
function report(save,missionId,player){
 const s=state(save),m=s?.missions.find(x=>String(x.id)===String(missionId));
 if(!m)return null;
 const base={missionId:m.id,playerId:m.playerId,status:m.status,progress:m.progress,region:m.region};
 if(!player||String(player.id)!==m.playerId)return {...base,available:false};
 const certainty=clamp(Math.floor(15+m.progress*(60+m.quality*.25)),15,100);
 const trueOvr=clamp(Math.round(num(player.ovr??player.overall,50)),1,100);
 const potential=clamp(Math.round(num(player.potential,trueOvr)),trueOvr,100);
 const variance=Math.ceil((100-certainty)/9);
 const offset=(hash(m.playerId+"|"+m.id)%3)-1;
 return {...base,available:true,certainty,estimatedOverall:[clamp(trueOvr-variance,1,100),clamp(trueOvr+variance,1,100)],
 potentialRange:[clamp(potential-variance+offset,1,100),clamp(potential+variance+offset,1,100)],
 exactOverall:m.status==="complete"?trueOvr:null,
 exactPotential:m.status==="complete"&&m.quality>=90?potential:null};
}
const api=Object.freeze({state,start,advance,report});
root.ProLifeCoachScoutingV2=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
