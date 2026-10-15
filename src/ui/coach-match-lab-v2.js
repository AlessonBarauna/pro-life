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
 return {kind:"experimental",match:Engine.create({seed,homeStrength:strength(home),awayStrength:strength(away)}),actions:[],lineups:[home,away].map(c=>{const roster=(Array.isArray(c?.roster)?c.roster:[]).filter(p=>p&&p.id!=null);return {starters:roster.slice(0,11).map(p=>String(p.id)),bench:roster.slice(11).map(p=>String(p.id))};})};
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
function swapPlayer(preview,side,outId,inId,roster){
 if(!preview||!([0,1].includes(side)))return {ok:false,reason:"Equipe indisponivel"};
 const line=preview.lineups?.[side];
 if(!line||!Array.isArray(roster))return {ok:false,reason:"Elenco indisponivel"};
 const oi=line.starters.indexOf(String(outId)),bi=line.bench.indexOf(String(inId));
 if(oi<0||bi<0||String(outId)===String(inId))return {ok:false,reason:"Troca invalida"};
 const incoming=roster.find(p=>String(p.id)===String(inId));
 const strength=Number(incoming?.ovr??incoming?.overall);
 const result=decision(preview,{side,incomingStrength:Number.isFinite(strength)&&strength>0?strength:70});
 if(!result.ok)return result;
 line.starters[oi]=String(inId);line.bench.splice(bi,1);
 const last=preview.actions[preview.actions.length-1];last.outId=String(outId);last.inId=String(inId);
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
const api=Object.freeze({createPreview,decision,swapPlayer,advance,summary,strength});
root.ProLifeCoachMatchLabV2=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
