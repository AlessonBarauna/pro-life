(function(root){"use strict";
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const internal=s=>/^(real_|fc27_|p[_-]?\d|\d+$)/i.test(String(s||""));
function allPlayers(home,away){return [home,away].flatMap(c=>Array.isArray(c?.roster)?c.roster:[]).filter(Boolean);}
function identify(id,home,away){
 const players=allPlayers(home,away);
 const raw=String(id??"");
 const p=players.find(x=>String(x.id)===raw||String(x.playerId)===raw);
 const name=[p?.displayName,p?.knownName,p?.shortName,p?.name,p?.fullName].find(x=>typeof x==="string"&&x.trim()&&!internal(x));
 return {id:raw,name:name||(!internal(raw)&&raw?raw:"Jogador não identificado"),number:p?.number??p?.shirtNumber??null,position:p?.pos??p?.position??null,player:p||null};
}
function short(name){const words=String(name||"").trim().split(/\s+/);return words.length>1?words[words.length-1]:words[0]||"Jogador";}
function eventMetrics(match,minute){
 const events=(match?.events||[]).filter(e=>Number(e.minute)<=minute);
 const count=(side,types)=>events.filter(e=>Number(e.side)===side&&types.includes(e.type)).length;
 return {goals:[count(0,["goal"]),count(1,["goal"])],yellow:[count(0,["yellow","yellow_card"]),count(1,["yellow","yellow_card"])],red:[count(0,["red","red_card"]),count(1,["red","red_card"])],substitutions:[count(0,["sub","substitution"]),count(1,["sub","substitution"])]};
}
const api=Object.freeze({identify,short,escape,eventMetrics});
root.ProLifeMatchIdentityV2=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
