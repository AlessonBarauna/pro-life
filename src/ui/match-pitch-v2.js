(function(root){"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const slots=[
 ["GK",7,50],["RB",23,84],["CB",22,61],["CB",22,39],["LB",23,16],
 ["CM",46,75],["DM",41,50],["CM",46,25],["RW",71,78],["ST",77,50],["LW",71,22]
];
function role(p){
 const x=String(p?.position||p?.pos||p?.primaryPosition||p?.role||"").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z]/g,"");
 if(/^(GK|GOL|GOLEIRO|GR)$/.test(x))return "GK";
 if(/^(RB|LD|LATERALDIREITO)$/.test(x))return "RB";
 if(/^(LB|LE|LATERALESQUERDO)$/.test(x))return "LB";
 if(/^(CB|ZAG|DFC|ZC|ZAGUEIRO|DEF)$/.test(x))return "CB";
 if(/^(DM|VOL|MDC|CDM|VOLANTE)$/.test(x))return "DM";
 if(/^(CM|MC|MEI|MAT|CAM|ME|MD|MLG|MEIOCAMPO)$/.test(x))return "CM";
 if(/^(RW|PD|ED|PONTA DIREITA)$/.test(x))return "RW";
 if(/^(LW|PE|EE|PONTA ESQUERDA)$/.test(x))return "LW";
 if(/^(ST|CF|ATA|AT|CA|SA|SEGUNDOATACANTE|CENTROAVANTE)$/.test(x))return "ST";
 return "UNKNOWN";
}
const score=(actual,wanted)=>actual===wanted?100:actual==="UNKNOWN"?10:actual==="GK"||wanted==="GK"?-200:
 (["CB","RB","LB"].includes(actual)&&["CB","RB","LB"].includes(wanted)?55:
 ["DM","CM"].includes(actual)&&["DM","CM"].includes(wanted)?65:
 ["ST","RW","LW"].includes(actual)&&["ST","RW","LW"].includes(wanted)?70:
 ["CM","DM"].includes(actual)&&["ST","RW","LW"].includes(wanted)?12:-25);
function players(club){return (Array.isArray(club?.roster)?club.roster:[]).filter(p=>p&&p.status!=="retired");}
const SCHEMES={
 "4-3-3":[["GK",7,50],["RB",23,84],["CB",22,61],["CB",22,39],["LB",23,16],["CM",46,75],["DM",41,50],["CM",46,25],["RW",71,78],["ST",77,50],["LW",71,22]],
 "4-2-3-1":[["GK",7,50],["RB",23,84],["CB",22,61],["CB",22,39],["LB",23,16],["DM",41,65],["DM",41,35],["RW",63,80],["CM",62,50],["LW",63,20],["ST",78,50]],
 "4-4-2":[["GK",7,50],["RB",23,84],["CB",22,61],["CB",22,39],["LB",23,16],["RW",48,83],["CM",45,60],["CM",45,40],["LW",48,17],["ST",74,65],["ST",74,35]],
 "3-5-2":[["GK",7,50],["CB",23,72],["CB",20,50],["CB",23,28],["RB",46,88],["CM",43,68],["DM",40,50],["CM",43,32],["LB",46,12],["ST",74,65],["ST",74,35]]
};
function scheme(club){
 const raw=String(club?.formation||club?.tactics?.formation||club?.tactic?.formation||"4-3-3").replace(/[^0-9-]/g,"");
 return SCHEMES[raw]?raw:"4-3-3";
}
function lineup(club){
 const pool=players(club);
 const requested=Array.isArray(club?.lineup)?club.lineup:[]; 
 const selected=requested.map(item=>pool.find(p=>String(p.id)===String(item?.id??item))).filter((p,i,arr)=>arr.indexOf(p)===i);
 const startersPool=selected.length>=11?selected.slice(0,11):selected.concat(pool.filter(p=>!selected.includes(p)).slice(0,11-selected.length));
 const available=startersPool.slice(),starters=[],shape=scheme(club);
 for(const [wanted] of SCHEMES[shape]){
   let best=-1,value=-Infinity;
   for(let i=0;i<available.length;i++){
     const n=score(role(available[i]),wanted)+(selected.includes(available[i])?15:0);
     if(n>value){value=n;best=i;}
   }
   starters.push(best<0?null:available.splice(best,1)[0]);
 }
 const starterSet=new Set(starters.filter(Boolean));
 return {starters,bench:pool.filter(p=>!starterSet.has(p)).slice(0,12),formation:shape};
}
function frame(minute,home,away){
 const t=Math.max(0,Number(minute)||0),possession=Math.floor(t/6)%2,phase=(t*.42)%1;
 const ball={x:clamp(10+phase*80,8,92),y:clamp(50+Math.sin(t*.39)*27,9,91)};
 const make=(club,side)=>SCHEMES[lineupCache[side].formation].map(([position,x,y],i)=>{
  const player=lineupCache[side].starters[i];let px=side===0?x:100-x,py=y;
  const offset=possession===side?5:-3;
  px=clamp(px+(side===0?offset:-offset)+Math.sin(t*.37+i*1.73)*2.2,4,96);
  py=clamp(py+Math.cos(t*.42+i*.87)*3,6,94);
  return {x:px,y:py,number:i+1,position,player};
 });
 const lineupCache=[lineup(home),lineup(away)];
 return {home:make(home,0),away:make(away,1),ball,possession};
}
const api=Object.freeze({players,lineup,frame,role,scheme});
root.ProLifeMatchPitchV2=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
