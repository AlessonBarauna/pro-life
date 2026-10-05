(function(root){
"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PRESETS={
 balanced:{buildUp:"balanced",defensiveApproach:"balanced",tempo:50,width:50,line:50,pressing:50,directness:50,risk:50},
 possession:{buildUp:"possession",defensiveApproach:"balanced",tempo:42,width:58,line:58,pressing:56,directness:34,risk:42},
 attack:{buildUp:"balanced",defensiveApproach:"high",tempo:68,width:62,line:67,pressing:72,directness:63,risk:72},
 counter:{buildUp:"counter",defensiveApproach:"deep",tempo:62,width:52,line:38,pressing:38,directness:78,risk:54},
 highPress:{buildUp:"balanced",defensiveApproach:"aggressive",tempo:64,width:55,line:75,pressing:84,directness:58,risk:68},
 lowBlock:{buildUp:"counter",defensiveApproach:"deep",tempo:38,width:42,line:28,pressing:28,directness:70,risk:30}
};
function presetFor(club){
 const id=club?.tactic==="possession"?"possession":club?.tactic==="attack"?"attack":club?.tactic==="counter"?"counter":"balanced";
 return {...PRESETS[id]};
}
function normalize(club){
 const base=presetFor(club), raw=club?.tacticalPlan||{};
 const n={...base,...raw};
 for(const k of ["tempo","width","line","pressing","directness","risk"]) n[k]=clamp(Number(n[k]??base[k]),0,100);
 n.buildUp=["balanced","possession","counter","direct"].includes(n.buildUp)?n.buildUp:base.buildUp;
 n.defensiveApproach=["deep","balanced","high","aggressive"].includes(n.defensiveApproach)?n.defensiveApproach:base.defensiveApproach;
 return n;
}
function matchup(ownClub,oppClub){
 const own=normalize(ownClub),opp=normalize(oppClub);
 const pressVsBuild=(own.pressing-50)*.055-(opp.buildUp==="possession"?2.2:opp.buildUp==="counter"?-1.1:0);
 const lineRisk=Math.max(0,own.line-58)*Math.max(0,opp.directness-58)/900;
 const deepProtection=Math.max(0,48-own.line)*.045;
 const possession=(own.buildUp==="possession"?5:0)+(own.width-50)*.025-(opp.pressing-50)*.035;
 const attack=(own.tempo-50)*.045+(own.directness-50)*.035+(own.risk-50)*.025+lineRisk;
 const defense=(own.pressing-50)*.035+deepProtection-(own.risk-50)*.025;
 const fatigue=Math.max(0,own.pressing-55)*.0025+Math.max(0,own.tempo-60)*.0015;
 const volatility=Math.abs(own.risk-50)*.004+Math.abs(own.line-50)*.002;
 return {plan:own,possession:+possession.toFixed(3),attack:+attack.toFixed(3),defense:+defense.toFixed(3),pressVsBuild:+pressVsBuild.toFixed(3),lineRisk:+lineRisk.toFixed(3),fatigue:+fatigue.toFixed(4),volatility:+volatility.toFixed(3)};
}
function playerInstruction(person){
 const raw=person?.simulationInstructions||{};
 return {
  attackingIntent:["support","balanced","aggressive"].includes(raw.attackingIntent)?raw.attackingIntent:"balanced",
  passingRisk:["safe","balanced","creative"].includes(raw.passingRisk)?raw.passingRisk:"balanced",
  shooting:["selective","balanced","frequent"].includes(raw.shooting)?raw.shooting:"balanced",
  pressing:["conserve","balanced","intense"].includes(raw.pressing)?raw.pressing:"balanced",
  movement:["hold","balanced","runs"].includes(raw.movement)?raw.movement:"balanced"
 };
}
function playerModifiers(person){
 const p=playerInstruction(person);
 return {
  shotWeight:p.shooting==="frequent"?1.18:p.shooting==="selective"?.86:1,
  chanceCreation:p.passingRisk==="creative"?1.12:p.passingRisk==="safe"?.93:1,
  turnoverRisk:p.passingRisk==="creative"?1.12:p.passingRisk==="safe"?.9:1,
  runThreat:p.movement==="runs"?1.14:p.movement==="hold"?.92:1,
  fatigue:p.pressing==="intense"?1.12:p.pressing==="conserve"?.9:1
 };
}
const api={PRESETS,presetFor,normalize,matchup,playerInstruction,playerModifiers};
root.ProLifeSimulationTactics=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
