(function(root){
"use strict";
// Experimental manager-only incremental simulation. Does not modify live saves.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,d)=>Number.isFinite(Number(n))?Number(n):d;
const tactics=Object.freeze(["equilibrado","ofensivo","defensivo","pressao_alta"]);
function create({seed=1,homeStrength=70,awayStrength=70}={}){
 return {version:1,minute:0,seed:(Math.floor(finite(seed,1))>>>0)||1,
   home:{strength:clamp(finite(homeStrength,70),1,100),tactic:"equilibrado",freshness:100,subs:0},
   away:{strength:clamp(finite(awayStrength,70),1,100),tactic:"equilibrado",freshness:100,subs:0},
   score:[0,0],shots:[0,0],events:[]};
}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function setTactic(s,side,tactic){
 if(!s||s.minute>=90||![0,1].includes(side)||!tactics.includes(tactic))return false;
 (side===0?s.home:s.away).tactic=tactic;return true;
}
function substitute(s,side,{incomingStrength=70,outgoingStrength=null}={}){
 if(!s||s.minute>=90||![0,1].includes(side))return false;
 const team=side===0?s.home:s.away;
 if(team.subs>=5)return false;
 team.subs++;
 const incoming=clamp(finite(incomingStrength,70),1,100);
 const outgoing=outgoingStrength==null?null:clamp(finite(outgoingStrength,70),1,100);
 team.strength=outgoing===null
  ?clamp(Math.round(team.strength*.91+incoming*.09),1,100)
  :clamp(Math.round((team.strength+(incoming-outgoing)/11)*100)/100,1,100);
 team.freshness=clamp(team.freshness+5,0,100);
 return true;
}
function chance(team,other){
 const attack={equilibrado:0,ofensivo:13,defensivo:-10,pressao_alta:8}[team.tactic];
 const defense={equilibrado:0,ofensivo:-8,defensivo:12,pressao_alta:4}[other.tactic];
 return clamp(0.025+(team.strength-other.strength)*.0014+attack*.0012-defense*.001+team.freshness*.00012,0.003,0.20);
}
function advance(s,toMinute){
 if(!s||!Number.isFinite(Number(toMinute)))return [];
 const target=clamp(Math.floor(Number(toMinute)),s.minute,90),events=[];
 while(s.minute<target){
  s.minute++;
  for(const [side,team,other] of [[0,s.home,s.away],[1,s.away,s.home]]){
   if(random(s)<chance(team,other)){
    s.shots[side]++;
    const goalChance=clamp(0.09+(team.strength-other.strength)*.0015,0.04,0.23);
    const goal=random(s)<goalChance;
    if(goal)s.score[side]++;
    const event={minute:s.minute,side,type:goal?"goal":"shot"};
    s.events.push(event);events.push(event);
   }
  }
  for(const team of [s.home,s.away])team.freshness=clamp(team.freshness-(team.tactic==="pressao_alta"?.40:.21),0,100);
 }
 return events;
}
const api=Object.freeze({create,advance,setTactic,substitute,tactics});
root.ProLifeCoachIncrementalMatchV2=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
