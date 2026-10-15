(function(root){
"use strict";
// Independent, unsaved manager match laboratory. Never replaces official match results.
const Engine=root.ProLifeCoachIncrementalMatchV2||(typeof require==="function"?require("../domain/coach-incremental-match-v2.js"):null);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const strength=club=>{
 const roster=Array.isArray(club?.roster)?club.roster:[];
 const ratings=roster.map(p=>Number(p?.ovr??p?.overall)).filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>b-a).slice(0,11);
 return ratings.length?clamp(Math.round(ratings.reduce((a,b)=>a+b,0)/ratings.length),1,100):70;
};
function createPreview(home,away,seed=1){
 if(!Engine)return null;
 return {kind:"experimental",match:Engine.create({seed,homeStrength:strength(home),awayStrength:strength(away)}),actions:[]};
}
function decision(preview,{side=0,tactic,incomingStrength}={}){
 if(!preview||preview.kind!=="experimental")return {ok:false,reason:"Prévia indisponível"};
 let ok=false;
 if(tactic!==undefined)ok=Engine.setTactic(preview.match,side,tactic);
 else if(incomingStrength!==undefined)ok=Engine.substitute(preview.match,side,{incomingStrength});
 if(!ok)return {ok:false,reason:"Alteração não permitida"};
 preview.actions.push({minute:preview.match.minute,side,tactic:tactic??null,incomingStrength:incomingStrength??null});
 return {ok:true};
}
function advance(preview,minute){
 if(!preview||preview.kind!=="experimental")return [];
 return Engine.advance(preview.match,minute);
}
function summary(preview){
 const m=preview?.match;
 if(!m)return null;
 return {experimental:true,minute:m.minute,score:m.score.slice(),shots:m.shots.slice(),tactics:[m.home.tactic,m.away.tactic],substitutions:[m.home.subs,m.away.subs],actions:preview.actions.length};
}
const api=Object.freeze({createPreview,decision,advance,summary,strength});
root.ProLifeCoachMatchLabV2=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
