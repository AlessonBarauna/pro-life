(function(root){
"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CATALOG=[
 {id:"bruise",name:"Contusão",severity:"LEVE",min:2,max:6,weight:34},
 {id:"strain",name:"Distensão",severity:"LEVE",min:4,max:10,weight:25},
 {id:"sprain",name:"Entorse",severity:"MODERADA",min:8,max:18,weight:18},
 {id:"muscle",name:"Lesão muscular",severity:"MODERADA",min:12,max:28,weight:14},
 {id:"ankle",name:"Lesão de tornozelo",severity:"MODERADA",min:16,max:38,weight:6},
 {id:"knee",name:"Lesão de joelho",severity:"GRAVE",min:45,max:120,weight:3}
];
function init(p,day=0){
 if(!p.physical||typeof p.physical!=="object") p.physical={fatigue:Math.max(0,100-Number(p.condition??100)),fitness:Number(p.condition??100),active:null,history:[],recentLoad:0,returnMode:"full",processed:[]};
 const q=p.physical;q.fatigue=clamp(Number(q.fatigue)||0,0,100);q.fitness=clamp(Number(q.fitness??p.condition??100),0,100);q.recentLoad=clamp(Number(q.recentLoad)||0,0,180);q.history=Array.isArray(q.history)?q.history:[];q.processed=Array.isArray(q.processed)?q.processed:[];
 if(Number(p.injury)>0&&!q.active) q.active={type:"legacy",name:"Lesão em recuperação",severity:"MODERADA",startDay:day,returnDay:day+Number(p.injury),totalDays:Number(p.injury),status:"LESIONADO",context:"save anterior"};
 return q;
}
function sync(p){const q=p.physical;if(!q)return;p.condition=clamp(Math.round(q.fitness-q.fatigue*.12),0,100);if(q.active)p.injury=Math.max(0,Math.ceil(q.active.returnDay-(q.currentDay||0)));}
function risk(p,intensity="normal"){
 const q=init(p);const age=Math.max(0,(Number(p.age)||24)-29),hist=Math.min(8,q.history.length)*.0015,intensityAdd=intensity==="hard"?.006:intensity==="rest"?-.003:0;
 return clamp(.0015+q.fatigue*.00012+(100-q.fitness)*.00007+q.recentLoad*.000035+age*.00035+hist+(q.returnMode==="early"?.009:0)+intensityAdd,.0005,.055);
}
function pick(rng){let x=rng.next()*CATALOG.reduce((n,c)=>n+c.weight,0);for(const c of CATALOG){x-=c.weight;if(x<=0)return c;}return CATALOG[0];}
function injure(p,rng,day,context="partida",forced=null){const q=init(p,day);if(q.active||Number(p.injury)>0)return null;const c=forced||pick(rng),days=rng.int(c.min,c.max);q.active={type:c.id,name:c.name,severity:c.severity,startDay:day,returnDay:day+days,totalDays:days,status:"LESIONADO",context};q.returnMode="full";q.fitness=clamp(q.fitness-8,20,100);p.injury=days;return q.active;}
function daily(p,day,intensity="normal"){
 const q=init(p,day);q.currentDay=day;q.recentLoad=clamp(q.recentLoad*.86,0,180);
 if(q.active){p.injury=Math.max(0,q.active.returnDay-day);const elapsed=day-q.active.startDay;q.active.status=p.injury>Math.max(2,Math.round(q.active.totalDays*.25))?"EM RECUPERAÇÃO":p.injury>0?"RETORNO PARCIAL":"APTO";q.fatigue=clamp(q.fatigue-5,0,100);q.fitness=clamp(q.fitness+1.5,0,88);if(p.injury<=0){q.history.unshift({type:q.active.name,severity:q.active.severity,startDay:q.active.startDay,returnDay:day,daysOut:elapsed,context:q.active.context});q.history=q.history.slice(0,30);q.active=null;q.returnMode="gradual";q.fitness=Math.min(q.fitness,82);} }
 else {const rest=intensity==="rest";q.fatigue=clamp(q.fatigue-(rest?9:5)+(intensity==="hard"?5:0),0,100);q.fitness=clamp(q.fitness+(rest?3:1),0,100);if(q.returnMode==="gradual"&&q.fitness>=92)q.returnMode="full";}
 sync(p);return q;
}
function matchLoad(p,minutes){const q=init(p);const load=clamp(Number(minutes)||0,0,120);q.fatigue=clamp(q.fatigue+load*.24,0,100);q.recentLoad=clamp(q.recentLoad+load,0,180);q.fitness=clamp(q.fitness-load*.055,0,100);sync(p);}
function trainLoad(p,intensity){const q=init(p);if(intensity==="hard"){q.fatigue=clamp(q.fatigue+8,0,100);q.recentLoad=clamp(q.recentLoad+24,0,180);q.fitness=clamp(q.fitness-2,0,100);}else if(intensity==="normal"){q.fatigue=clamp(q.fatigue+3,0,100);q.recentLoad=clamp(q.recentLoad+12,0,180);}sync(p);}
function chooseReturn(p,day,choice){const q=init(p,day);if(choice==="wait")return q;if(choice!=="gradual"||!q.active||q.active.status!=="RETORNO PARCIAL"||q.active.severity==="GRAVE")throw Error("Retorno antecipado indisponível.");const a=q.active;q.history.unshift({type:a.name,severity:a.severity,startDay:a.startDay,returnDay:day,daysOut:day-a.startDay,context:a.context,early:true});q.history=q.history.slice(0,30);q.active=null;q.returnMode="early";q.fitness=Math.min(q.fitness,72);q.fatigue=Math.max(q.fatigue,28);p.injury=0;sync(p);return q;}
function canPlay(p){const q=init(p);return !q.active&&!Number(p.injury)&&Number(p.condition??100)>=25;}
function status(p){const q=init(p);if(q.active)return q.active.status;if(q.returnMode==="gradual")return"RETORNO GRADUAL";return q.fitness>=95&&q.fatigue<20?"100%":"APTO";}
const api={CATALOG,init,risk,injure,daily,matchLoad,trainLoad,chooseReturn,canPlay,status};root.ProLifePhysical=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
