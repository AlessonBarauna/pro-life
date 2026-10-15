(function(root){"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const positions=[[7,50],[22,14],[22,38],[22,62],[22,86],[45,22],[43,50],[45,78],[69,20],[76,50],[69,80]];
function players(club){const roster=Array.isArray(club?.roster)?club.roster:[];return roster.filter(p=>p&&p.status!=="retired");}
function lineup(club){const pool=players(club), starters=pool.slice(0,11);return {starters,bench:pool.slice(11,20)};}
function frame(minute,home,away){
 const t=Math.max(0,Number(minute)||0);
 const possession=Math.floor(t/6)%2;
 const wave=Math.sin(t*.27),phase=(t*.42)%1;
 const ball={x:clamp(10+phase*80,8,92),y:clamp(50+Math.sin(t*.39)*27,9,91)};
 const make=(club,side)=>{
  const formation=lineup(club).starters;
  return positions.map(([x,y],i)=>{
    let px=side===0?x:100-x,py=y;
    const shift=possession===side?8:-6;
    px=clamp(px+(side===0?shift:-shift)+Math.sin(t*.37+i*1.73)*3.8,4,96);
    py=clamp(py+Math.cos(t*.42+i*.87)*5+(ball.y-py)*(i>4?.10:.03),6,94);
    return {x:px,y:py,number:i+1,player:formation[i]||null};
  });
 };
 return {home:make(home,0),away:make(away,1),ball,possession};
}
const api=Object.freeze({players,lineup,frame});
root.ProLifeMatchPitchV2=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
